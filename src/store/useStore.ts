import { create } from 'zustand';
import { db } from '../services/db';
import { syncManager } from '../services/SyncManager';
import {
    Field, StockItem, Animal, Machine, Transaction, Task,
    UserProfile, Notification, ProductBatch, FieldLog, Sensor, MaintenanceLog,
    WeatherForecast, DetailedForecast
} from '../types';

interface AppState {
    fields: Field[];
    stocks: StockItem[];
    animals: Animal[];
    machines: Machine[];
    transactions: Transaction[];
    tasks: Task[];
    notifications: Notification[];
    users: UserProfile[];
    harvests: ProductBatch[];
    isHydrated: boolean;

    // Global UI & Prefs
    activeTab: string;
    isDarkMode: boolean;
    isSolarMode: boolean;
    isOnline: boolean;
    weatherData: WeatherForecast[];
    detailedForecast: DetailedForecast[];
    currentUserId: string;

    // Hydration & Persistence
    hydrate: () => Promise<void>;

    // Global Actions
    setActiveTab: (tab: string) => void;
    setDarkMode: (isDark: boolean) => void;
    setSolarMode: (isSolar: boolean) => void;
    setOnline: (isOnline: boolean) => void;
    setWeatherData: (data: WeatherForecast[]) => void;
    setDetailedForecast: (data: DetailedForecast[]) => void;
    setCurrentUserId: (id: string) => void;

    // Handlers (extracted from App.tsx)
    setFields: (fields: Field[]) => void;
    addField: (field: Field) => Promise<void>;
    updateField: (id: string, updates: Partial<Field>) => Promise<void>;
    deleteField: (id: string) => Promise<void>;

    setStocks: (stocks: StockItem[]) => void;
    addStock: (item: StockItem) => Promise<void>;
    updateStock: (id: string, updates: Partial<StockItem>) => Promise<void>;
    deleteStock: (id: string) => Promise<void>;

    addAnimal: (animal: Animal) => Promise<void>;
    updateAnimal: (id: string, updates: Partial<Animal>) => Promise<void>;

    addMachine: (machine: Machine) => Promise<void>;
    updateMachine: (id: string, updates: Partial<Machine>) => Promise<void>;

    addTask: (task: Task) => Promise<void>;
    updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;

    addTransaction: (tx: Transaction) => Promise<void>;

    addNotification: (notification: Notification) => Promise<void>;
    markNotificationRead: (id: string) => Promise<void>;

    // Complex Handlers
    toggleIrrigation: (id: string, status: boolean) => Promise<void>;
    addLogToField: (fieldId: string, log: FieldLog, transaction?: Transaction, stockUpdate?: { id: string, quantity: number }) => Promise<void>;
    registerSale: (saleData: { stockId: string, quantity: number, transaction: Transaction, fieldLog?: { fieldId: string, log: FieldLog } }) => Promise<void>;
    harvestField: (fieldId: string, stockItem: StockItem, harvest: ProductBatch) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
    fields: [],
    stocks: [],
    animals: [],
    machines: [],
    transactions: [],
    tasks: [],
    notifications: [],
    users: [],
    harvests: [],
    isHydrated: false,

    // UI Initial
    activeTab: 'dashboard',
    isDarkMode: localStorage.getItem('oriva_dark_mode') === 'true',
    isSolarMode: localStorage.getItem('oriva_solar_mode') === 'true',
    isOnline: navigator.onLine,
    weatherData: [],
    detailedForecast: [],
    currentUserId: localStorage.getItem('oriva_current_user') || 'u1',

    hydrate: async () => {
        // Migration logic during hydration
        const rawState = localStorage.getItem('oriva_enterprise_v1');
        if (rawState) {
            try {
                const data = JSON.parse(rawState);
                if (data.fields?.length) await db.fields.bulkPut(data.fields);
                if (data.stocks?.length) await db.stocks.bulkPut(data.stocks);
                if (data.animals?.length) await db.animals.bulkPut(data.animals);
                if (data.machines?.length) await db.machines.bulkPut(data.machines);
                if (data.transactions?.length) await db.transactions.bulkPut(data.transactions);
                if (data.tasks?.length) await db.tasks.bulkPut(data.tasks);
                if (data.notifications?.length) await db.notifications.bulkPut(data.notifications);
                if (data.users?.length) await db.users.bulkPut(data.users);
                if (data.harvests?.length) await db.harvests.bulkPut(data.harvests);

                localStorage.removeItem('oriva_enterprise_v1');
            } catch (e) {
                console.error("Migration failed", e);
            }
        }

        const [fields, stocks, animals, machines, transactions, tasks, notifications, users, harvests] = await Promise.all([
            db.fields.toArray(),
            db.stocks.toArray(),
            db.animals.toArray(),
            db.machines.toArray(),
            db.transactions.toArray(),
            db.tasks.toArray(),
            db.notifications.toArray(),
            db.users.toArray(),
            db.harvests.toArray(),
        ]);

        // [AUTO-PATCH] Ensure Trator Principal (m1) has ISO-BUS data for demo
        const demoMachine = machines.find(m => m.id === 'm1' || m.name === 'Trator Principal');
        if (demoMachine) {
            const demoIsoData = {
                engineRpm: 1850,
                groundSpeed: 8.4,
                fuelRate: 12.5,
                ptoSpeed: 540,
                hydraulicPressure: 185,
                engineLoad: 68,
                coolantTemp: 92,
                dtc: [] as string[],
                lastUpdate: new Date().toISOString()
            };
            demoMachine.isobusData = demoIsoData;
            // Persist the patch
            await db.machines.update(demoMachine.id, { isobusData: demoIsoData });
        }

        // [AUTO-PATCH] Ensure Carrinha da Quinta (m2) is UNCONFIGURED for demo purposes
        const exampleMachine = machines.find(m => m.id === 'm2' || m.name === 'Carrinha da Quinta');
        if (exampleMachine && exampleMachine.isobusData) {
            delete exampleMachine.isobusData;
            await db.machines.update(exampleMachine.id, { isobusData: undefined });
        }

        // Fill with MOCK_STATE if empty
        if (fields.length === 0 && stocks.length === 0) {
            // Import here to avoid circular dep if constants imports types
            const { MOCK_STATE } = await import('../constants');
            await Promise.all([
                db.fields.bulkAdd(MOCK_STATE.fields),
                db.stocks.bulkAdd(MOCK_STATE.stocks),
                db.animals.bulkAdd(MOCK_STATE.animals),
                db.machines.bulkAdd(MOCK_STATE.machines),
                db.transactions.bulkAdd(MOCK_STATE.transactions),
                db.tasks.bulkAdd(MOCK_STATE.tasks),
                db.users.bulkAdd(MOCK_STATE.users),
            ]);
            // Re-hydrate
            return get().hydrate();
        }

        set({
            fields, stocks, animals, machines, transactions, tasks, notifications, users, harvests,
            isHydrated: true
        });
    },

    setActiveTab: (tab) => set({ activeTab: tab }),
    setDarkMode: (isDark) => {
        localStorage.setItem('oriva_dark_mode', String(isDark));
        set({ isDarkMode: isDark });
    },
    setSolarMode: (isSolar) => {
        localStorage.setItem('oriva_solar_mode', String(isSolar));
        set({ isSolarMode: isSolar });
    },
    setOnline: (isOnline) => set({ isOnline }),
    setWeatherData: (weatherData) => set({ weatherData }),
    setDetailedForecast: (detailedForecast) => set({ detailedForecast }),
    setCurrentUserId: (id) => {
        localStorage.setItem('oriva_current_user', id);
        set({ currentUserId: id });
    },

    setFields: (fields) => set({ fields }),

    addField: async (field) => {
        await db.fields.add(field);
        set(state => ({ fields: [...state.fields, field] }));
    },

    updateField: async (id, updates) => {
        await db.fields.update(id, updates);
        set(state => ({
            fields: state.fields.map(f => f.id === id ? { ...f, ...updates } : f)
        }));
    },

    deleteField: async (id) => {
        await db.fields.delete(id);
        set(state => ({ fields: state.fields.filter(f => f.id !== id) }));
    },

    setStocks: (stocks) => set({ stocks }),

    addStock: async (item) => {
        await db.stocks.add(item);
        set(state => ({ stocks: [...state.stocks, item] }));
    },

    updateStock: async (id, updates) => {
        await db.stocks.update(id, updates);
        set(state => ({
            stocks: state.stocks.map(s => s.id === id ? { ...s, ...updates } : s)
        }));
    },

    deleteStock: async (id) => {
        await db.stocks.delete(id);
        set(state => ({ stocks: state.stocks.filter(s => s.id !== id) }));
    },

    addAnimal: async (animal) => {
        await db.animals.add(animal);
        set(state => ({ animals: [...state.animals, animal] }));
    },

    updateAnimal: async (id, updates) => {
        await db.animals.update(id, updates);
        set(state => ({
            animals: state.animals.map(a => a.id === id ? { ...a, ...updates } : a)
        }));
    },

    addMachine: async (machine) => {
        await db.machines.add(machine);
        set(state => ({ machines: [...state.machines, machine] }));
    },

    updateMachine: async (id, updates) => {
        await db.machines.update(id, updates);
        set(state => ({
            machines: state.machines.map(m => m.id === id ? { ...m, ...updates } : m)
        }));
    },

    addTask: async (task) => {
        await db.tasks.add(task);
        syncManager.addToQueue('ADD_TASK', task);
        set(state => ({ tasks: [...state.tasks, task] }));
    },

    updateTask: async (id, updates) => {
        await db.tasks.update(id, updates);
        syncManager.addToQueue('UPDATE_TASK', { id, updates });
        set(state => ({
            tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
        }));
    },
    deleteTask: async (id) => {
        await db.tasks.delete(id);
        set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
    },

    addTransaction: async (tx) => {
        await db.transactions.add(tx);
        syncManager.addToQueue('ADD_TRANSACTION', tx);
        set(state => ({ transactions: [tx, ...state.transactions] }));
    },
    addNotification: async (notif) => {
        await db.notifications.add(notif);
        set(state => ({ notifications: [notif, ...state.notifications] }));
    },

    markNotificationRead: async (id) => {
        await db.notifications.update(id, { read: true });
        set(state => ({
            notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
        }));
    },

    toggleIrrigation: async (id, status) => {
        await db.fields.update(id, { irrigationStatus: status });
        set(state => ({
            fields: state.fields.map(f => f.id === id ? { ...f, irrigationStatus: status } : f)
        }));
    },

    addLogToField: async (fieldId, log, transaction, stockUpdate) => {
        const field = get().fields.find(f => f.id === fieldId);
        if (!field) return;

        const newLogs = [...(field.logs || []), log];

        // Push to Sync Queue
        syncManager.addToQueue('ADD_FIELD_LOG', { fieldId, log, transaction, stockUpdate });

        await db.fields.update(fieldId, { logs: newLogs });
        if (transaction) {
            await db.transactions.add(transaction);
        }

        if (stockUpdate) {
            await db.stocks.update(stockUpdate.id, { quantity: stockUpdate.quantity });
        }

        set(state => ({
            fields: state.fields.map(f => f.id === fieldId ? { ...f, logs: newLogs } : f),
            transactions: transaction ? [transaction, ...state.transactions] : state.transactions,
            stocks: stockUpdate ? state.stocks.map(s => s.id === stockUpdate.id ? { ...s, quantity: stockUpdate.quantity } : s) : state.stocks
        }));
    },

    registerSale: async (saleData) => {
        await db.transactions.add(saleData.transaction);
        syncManager.addToQueue('REGISTER_SALE', saleData);

        // Update Stock
        const stock = get().stocks.find(s => s.id === saleData.stockId);
        if (stock) {
            const newQuantity = Math.max(0, stock.quantity - saleData.quantity);
            await db.stocks.update(saleData.stockId, { quantity: newQuantity });
        }

        // Update Field Log if provided
        if (saleData.fieldLog) {
            const field = get().fields.find(f => f.id === saleData.fieldLog?.fieldId);
            if (field) {
                const newLogs = [...field.logs, saleData.fieldLog.log];
                await db.fields.update(saleData.fieldLog.fieldId, { logs: newLogs });
                set(state => ({
                    fields: state.fields.map(f => f.id === saleData.fieldLog!.fieldId ? { ...f, logs: newLogs } : f)
                }));
            }
        }

        set(state => ({
            transactions: [saleData.transaction, ...state.transactions],
            stocks: state.stocks.map(s => s.id === saleData.stockId ? { ...s, quantity: Math.max(0, s.quantity - saleData.quantity) } : s)
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
    }
}));
