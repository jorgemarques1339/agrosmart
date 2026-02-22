import { StateCreator } from 'zustand';
import { AppState } from '../useStore';
import { db } from '../../services/db';
import { syncManager } from '../../services/SyncManager';
import { Field, FieldLog, Transaction, StockItem } from '../../types';

export interface FieldSlice {
    fields: Field[];
    setFields: (fields: Field[]) => void;
    addField: (field: Field) => Promise<void>;
    updateField: (id: string, updates: Partial<Field>) => Promise<void>;
    deleteField: (id: string) => Promise<void>;
    toggleIrrigation: (id: string, status: boolean) => Promise<void>;
    addLogToField: (fieldId: string, log: FieldLog, transaction?: Transaction, stockUpdate?: { id: string, quantity: number }) => Promise<void>;
}

export const createFieldSlice: StateCreator<AppState, [], [], FieldSlice> = (set, get) => ({
    fields: [],

    setFields: (fields) => set({ fields }),

    addField: async (field) => {
        await db.fields.add(field);
        syncManager.addToQueue('ADD_FIELD', field);
        set(state => ({ fields: [...state.fields, field] }));
    },

    updateField: async (id, updates) => {
        await db.fields.update(id, updates);
        const fullField = await db.fields.get(id);
        if (fullField) {
            syncManager.addToQueue('UPDATE_FIELD', fullField);
            set(state => ({
                fields: state.fields.map(f => f.id === id ? fullField : f)
            }));
        }
    },

    deleteField: async (id) => {
        await db.fields.delete(id);
        syncManager.addToQueue('DELETE_FIELD', id);
        set(state => ({ fields: state.fields.filter(f => f.id !== id) }));
    },

    toggleIrrigation: async (id, status) => {
        await db.fields.update(id, { irrigationStatus: status });
        const fullField = await db.fields.get(id);
        if (fullField) {
            syncManager.addToQueue('UPDATE_FIELD', fullField);
            set(state => ({
                fields: state.fields.map(f => f.id === id ? fullField : f)
            }));
        }
    },

    addLogToField: async (fieldId, log, transaction, stockUpdate) => {
        const field = get().fields.find(f => f.id === fieldId);
        if (!field) return;

        const newLogs = [...(field.logs || []), log];
        await db.fields.update(fieldId, { logs: newLogs });

        if (transaction) {
            await db.transactions.add(transaction);
            syncManager.addToQueue('ADD_TRANSACTION', transaction);
            set(state => ({ transactions: [transaction, ...state.transactions] }));
        }

        if (stockUpdate) {
            const item = get().stocks.find(s => s.id === stockUpdate.id);
            if (item) {
                const newQuantity = stockUpdate.quantity;
                await db.stocks.update(item.id, { quantity: newQuantity });
                const fullStock = await db.stocks.get(item.id);
                if (fullStock) {
                    syncManager.addToQueue('UPDATE_STOCK', fullStock);
                    set(state => ({
                        stocks: state.stocks.map(s => s.id === item.id ? fullStock : s)
                    }));
                }
            }
        }

        const fullField = await db.fields.get(fieldId);
        if (fullField) {
            syncManager.addToQueue('UPDATE_FIELD', fullField);
            set(state => ({
                fields: state.fields.map(f => f.id === fieldId ? fullField : f)
            }));
        }
    },
});
