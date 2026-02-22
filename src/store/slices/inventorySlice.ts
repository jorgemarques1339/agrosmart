import { StateCreator } from 'zustand';
import { AppState } from '../useStore';
import { db } from '../../services/db';
import { syncManager } from '../../services/SyncManager';
import { StockItem, Transaction, Notification, ProductBatch, FieldLog } from '../../types';

export interface InventorySlice {
    stocks: StockItem[];
    transactions: Transaction[];
    harvests: ProductBatch[];
    setStocks: (stocks: StockItem[]) => void;
    setTransactions: (transactions: Transaction[]) => void;
    setHarvests: (harvests: ProductBatch[]) => void;
    addStock: (item: StockItem) => Promise<void>;
    updateStock: (id: string, updates: Partial<StockItem>) => Promise<void>;
    deleteStock: (id: string) => Promise<void>;
    addTransaction: (tx: Transaction) => Promise<void>;
    reclaimCredits: (amount: number, value: number) => Promise<void>;
    registerSale: (saleData: { stockId: string, quantity: number, transaction: Transaction, fieldLog?: { fieldId: string, log: FieldLog } }) => Promise<void>;
    harvestField: (fieldId: string, stockItem: StockItem, harvest: ProductBatch) => Promise<void>;
}

export const createInventorySlice: StateCreator<AppState, [], [], InventorySlice> = (set, get) => ({
    stocks: [],
    transactions: [],
    harvests: [],

    setStocks: (stocks) => set({ stocks }),
    setTransactions: (transactions) => set({ transactions }),
    setHarvests: (harvests) => set({ harvests }),

    addStock: async (item) => {
        await db.stocks.add(item);
        syncManager.addToQueue('ADD_STOCK', item);
        set(state => ({ stocks: [...state.stocks, item] }));
    },

    updateStock: async (id, updates) => {
        await db.stocks.update(id, updates);
        const fullStock = await db.stocks.get(id);
        if (fullStock) {
            syncManager.addToQueue('UPDATE_STOCK', fullStock);
            set(state => ({
                stocks: state.stocks.map(s => s.id === id ? fullStock : s)
            }));
        }
    },

    deleteStock: async (id) => {
        await db.stocks.delete(id);
        syncManager.addToQueue('DELETE_STOCK', id);
        set(state => ({ stocks: state.stocks.filter(s => s.id !== id) }));
    },

    addTransaction: async (tx) => {
        await db.transactions.add(tx);
        syncManager.addToQueue('ADD_TRANSACTION', tx);
        set(state => ({ transactions: [tx, ...state.transactions] }));
    },

    reclaimCredits: async (amount, value) => {
        const transaction: Transaction = {
            id: `carbon-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            type: 'income',
            amount: value,
            description: `Créditos de Carbono: ${amount} tCO2e Verificados`,
            category: 'Carbono'
        };

        const notification: Notification = {
            id: `notif-carbon-${Date.now()}`,
            title: 'Créditos Verificados',
            message: `Gerados €${value.toLocaleString()} em créditos de carbono auditados.`,
            type: 'success',
            timestamp: new Date().toISOString(),
            read: false
        };

        await db.transactions.add(transaction);
        await db.notifications.add(notification);
        syncManager.addToQueue('RECLAIM_CREDITS', { transaction, amount });

        set(state => ({
            transactions: [transaction, ...state.transactions],
            notifications: [notification, ...state.notifications]
        }));
    },

    registerSale: async (saleData) => {
        await db.transactions.add(saleData.transaction);
        syncManager.addToQueue('REGISTER_SALE', saleData);

        const stock = get().stocks.find(s => s.id === saleData.stockId);
        if (stock) {
            const newQuantity = Math.max(0, stock.quantity - saleData.quantity);
            await db.stocks.update(saleData.stockId, { quantity: newQuantity });
            const fullStock = await db.stocks.get(saleData.stockId);
            if (fullStock) {
                syncManager.addToQueue('UPDATE_STOCK', fullStock);
                set(state => ({
                    stocks: state.stocks.map(s => s.id === saleData.stockId ? fullStock : s)
                }));
            }
        }

        if (saleData.fieldLog) {
            const field = get().fields.find(f => f.id === saleData.fieldLog?.fieldId);
            if (field) {
                const newLogs = [...field.logs, saleData.fieldLog.log];
                await db.fields.update(saleData.fieldLog.fieldId, { logs: newLogs });
                const fullField = await db.fields.get(saleData.fieldLog.fieldId);
                if (fullField) {
                    syncManager.addToQueue('UPDATE_FIELD', fullField);
                    set(state => ({
                        fields: state.fields.map(f => f.id === saleData.fieldLog!.fieldId ? fullField : f)
                    }));
                }
            }
        }

        set(state => ({
            transactions: [saleData.transaction, ...state.transactions]
        }));
    },

    harvestField: async (fieldId, stockItem, harvest) => {
        await db.stocks.add(stockItem);
        await db.harvests.add(harvest);
        await db.fields.delete(fieldId);
        syncManager.addToQueue('HARVEST_FIELD', { fieldId, stockItem, harvest });

        set(state => ({
            stocks: [...state.stocks, stockItem],
            harvests: [harvest, ...state.harvests],
            fields: state.fields.filter(f => f.id !== fieldId)
        }));
    },
});
