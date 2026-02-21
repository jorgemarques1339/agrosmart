import { create } from 'zustand';
import { db } from '../services/db';
import { syncManager } from '../services/SyncManager';
import {
    Field, StockItem, Animal, Machine, Transaction, Task,
    UserProfile, Notification, ProductBatch, FieldLog, Sensor, MaintenanceLog,
    WeatherForecast, DetailedForecast, AnimalBatch, FeedItem
} from '../types';

export interface AppState {
    fields: Field[];
    stocks: StockItem[];
    animals: Animal[];
    machines: Machine[];
    transactions: Transaction[];
    tasks: Task[];
    notifications: Notification[];
    users: UserProfile[];
    animalBatches: AnimalBatch[];
    harvests: ProductBatch[];
    onNavigate: (tab: string) => void;
    feedItems: FeedItem[];
    hasUnreadFeed: boolean;
    alertCount: number;
    isHydrated: boolean;
    syncStatus: 'idle' | 'syncing' | 'error' | 'offline';
    lastSyncTime: string | null;

    // Global UI & Prefs
    activeTab: string;
    isDarkMode: boolean;
    isSolarMode: boolean;
    isOnline: boolean;
    weatherData: WeatherForecast[];
    detailedForecast: DetailedForecast[];
    currentUserId: string;
    permissions: {
        gps: boolean;
        camera: boolean;
        nfc: boolean;
        motion: boolean;
    };

    // Hydration & Persistence
    hydrate: () => Promise<void>;

    // Global Actions
    setActiveTab: (tab: string) => void;
    setDarkMode: (isDark: boolean) => void;
    setSolarMode: (isSolar: boolean) => void;
    setOnline: (isOnline: boolean) => void;
    setSyncStatus: (status: AppState['syncStatus']) => void;
    setWeatherData: (data: WeatherForecast[]) => void;
    setDetailedForecast: (data: DetailedForecast[]) => void;
    setCurrentUserId: (id: string) => void;
    setPermission: (key: keyof AppState['permissions'], status: boolean) => void;

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
    addProduction: (id: string, value: number, type: 'milk' | 'weight') => Promise<void>;

    addAnimalBatch: (batch: AnimalBatch) => Promise<void>;
    updateAnimalBatch: (id: string, updates: Partial<AnimalBatch>) => Promise<void>;
    deleteAnimalBatch: (id: string) => Promise<void>;
    reclaimCredits: (amount: number, value: number) => Promise<void>;
    applyBatchAction: (batchId: string, actionType: string, description: string) => Promise<void>;

    addMachine: (machine: Machine) => Promise<void>;
    updateMachine: (id: string, updates: Partial<Machine>) => Promise<void>;

    addTask: (task: Task) => Promise<void>;
    updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;

    addUser: (user: UserProfile) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    updateUser: (id: string, updates: Partial<UserProfile>) => Promise<void>;

    addTransaction: (tx: Transaction) => Promise<void>;

    addNotification: (notification: Notification) => Promise<void>;
    markNotificationRead: (id: string) => Promise<void>;

    // Complex Handlers
    toggleIrrigation: (id: string, status: boolean) => Promise<void>;
    addLogToField: (fieldId: string, log: FieldLog, transaction?: Transaction, stockUpdate?: { id: string, quantity: number }) => Promise<void>;
    addFeedItem: (item: FeedItem) => Promise<void>;
    registerSale: (saleData: { stockId: string, quantity: number, transaction: Transaction, fieldLog?: { fieldId: string, log: FieldLog } }) => Promise<void>;
    harvestField: (fieldId: string, stockItem: StockItem, harvest: ProductBatch) => Promise<void>;

    // Bulk Setters for Sync
    setAnimals: (animals: Animal[]) => void;
    setMachines: (machines: Machine[]) => void;
    setTasks: (tasks: Task[]) => void;
    setUsers: (users: UserProfile[]) => void;
    setFeedItems: (items: FeedItem[]) => void;
    setTransactions: (transactions: Transaction[]) => void;
    setHarvests: (harvests: ProductBatch[]) => void;
    setAnimalBatches: (batches: AnimalBatch[]) => void;
    setNotifications: (notifications: Notification[]) => void;

    // Map Focus
    focusedTarget: { type: 'sensor' | 'field', id: string } | null;
    setFocusedTarget: (target: { type: 'sensor' | 'field', id: string } | null) => void;

    // UI & Modal Management
    ui: {
        modals: {
            settings: boolean;
            notificationCenter: boolean;
            notifications: boolean;
            teamManager: boolean;
            omniSearch: boolean;
            taskProof: Task | null;
            traceability: ProductBatch | null;
            fieldFeed: boolean;
            guide: boolean;
            // e-GUIAS specific state
            guideStep: number;
            guideData: any;
        };
        isChildModalOpen: boolean;
    };
    openModal: (modalId: keyof AppState['ui']['modals'], data?: any) => void;
    closeModal: (modalId: keyof AppState['ui']['modals']) => void;
    setChildModalOpen: (isOpen: boolean) => void;
    updateGuideData: (updates: any) => void;
}

export const isAnyModalOpen = (state: AppState) => {
    const { modals, isChildModalOpen } = state.ui;
    return isChildModalOpen ||
        modals.settings ||
        modals.notificationCenter ||
        modals.notifications ||
        modals.teamManager ||
        modals.omniSearch ||
        !!modals.taskProof ||
        modals.traceability ||
        modals.fieldFeed ||
        modals.guide;
};

export const useStore = create<AppState>((set, get) => ({
    fields: [],
    stocks: [],
    animals: [],
    machines: [],
    transactions: [],
    tasks: [],
    notifications: [],
    users: [],
    animalBatches: [],
    harvests: [],
    onNavigate: () => { }, // Placeholder for onNavigate
    feedItems: [],
    hasUnreadFeed: false,
    alertCount: 0,
    isHydrated: false,
    syncStatus: 'idle',
    lastSyncTime: localStorage.getItem('oriva_last_sync') || null,
    focusedTarget: null,

    // UI Initial
    ui: {
        modals: {
            settings: false,
            notificationCenter: false,
            notifications: false,
            teamManager: false,
            omniSearch: false,
            taskProof: null,
            traceability: null,
            fieldFeed: false,
            guide: false,
            guideStep: 1,
            guideData: {
                stockId: '',
                quantity: '',
                clientName: '',
                clientNif: '',
                destination: '',
                plate: '',
                date: new Date().toISOString().split('T')[0],
                price: '',
                fieldId: ''
            }
        },
        isChildModalOpen: false
    },
    activeTab: 'dashboard',
    isDarkMode: localStorage.getItem('oriva_dark_mode') === 'true',
    isSolarMode: localStorage.getItem('oriva_solar_mode') === 'true',
    isOnline: navigator.onLine,
    weatherData: [],
    detailedForecast: [],
    currentUserId: (localStorage.getItem('oriva_current_user') === 'user-1' || !localStorage.getItem('oriva_current_user')) ? 'u1' : localStorage.getItem('oriva_current_user')!,
    permissions: {
        gps: false,
        camera: false,
        nfc: false,
        motion: false
    },

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
                if (data.animalBatches?.length) await db.animalBatches.bulkPut(data.animalBatches);
                if (data.harvests?.length) await db.harvests.bulkPut(data.harvests);

                localStorage.removeItem('oriva_enterprise_v1');
            } catch (e) {
                console.error("Migration failed", e);
            }
        }

        let [fields, stocks, animals, machines, transactions, tasks, notifications, users, harvests, animalBatches, feedItems] = await Promise.all([
            db.fields.toArray(),
            db.stocks.toArray(),
            db.animals.toArray(),
            db.machines.toArray(),
            db.transactions.toArray(),
            db.tasks.toArray(),
            db.notifications.toArray(),
            db.users.toArray(),
            db.harvests.toArray(),
            db.animalBatches.toArray(),
            db.feed.toArray(),
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
                adBlueLevel: 85,
                implementDepth: 12,
                dtc: [] as string[],
                lastUpdate: new Date().toISOString()
            };

            // Reset unread flag on hydration if needed (or keep it based on logic)
            set({ hasUnreadFeed: false });

            // Seed mock feed items if none exist
            if (feedItems.length === 0) {
                const mockFeed: FeedItem[] = [
                    {
                        id: 'f1', userId: 'u2', userName: 'Ricardo M.', userAvatar: 'R',
                        type: 'photo', content: 'Início da colheita na Parcela A. As uvas estão com excelente brix.',
                        location: [41.443, -8.724], timestamp: new Date(Date.now() - 3600000).toISOString(), fieldId: 'f1'
                    },
                    {
                        id: 'f2', userId: 'u3', userName: 'Sílvia P.', userAvatar: 'S',
                        type: 'alert', content: 'Fuga detectada na válvula de rega secundária. A fechar o setor agora!',
                        location: [41.442, -8.722], timestamp: new Date().toISOString()
                    }
                ];
                await Promise.all(mockFeed.map(item => db.feed.add(item)));
                feedItems = mockFeed;
            }
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

        // Fill with MOCK_STATE if empty or missing critical users
        if (users.length === 0) {
            const { MOCK_STATE } = await import('../constants');
            await db.users.bulkAdd(MOCK_STATE.users);
            users = await db.users.toArray();
        }

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
            ]);
            // Re-hydrate
            return get().hydrate();
        }

        set({
            fields, stocks, animals, machines, transactions, tasks, notifications, users, harvests, animalBatches, feedItems,
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
    setOnline: (isOnline) => set({ isOnline, syncStatus: isOnline ? 'idle' : 'offline' }),
    setSyncStatus: (status) => set({ syncStatus: status }),
    setWeatherData: (weatherData) => set({ weatherData }),
    setDetailedForecast: (data) => set({ detailedForecast: data }),
    setCurrentUserId: (id) => {
        localStorage.setItem('oriva_current_user', id);
        set({ currentUserId: id });
    },
    setPermission: (key, status) => set(state => ({
        permissions: { ...state.permissions, [key]: status }
    })),

    setFields: (fields) => set({ fields }),

    addField: async (field) => {
        await db.fields.add(field);
        syncManager.addToQueue('ADD_FIELD', field);
        set(state => ({ fields: [...state.fields, field] }));
    },

    updateField: async (id, updates) => {
        await db.fields.update(id, updates);
        syncManager.addToQueue('UPDATE_FIELD', { id, updates });
        set(state => ({
            fields: state.fields.map(f => f.id === id ? { ...f, ...updates } : f)
        }));
    },

    deleteField: async (id) => {
        await db.fields.delete(id);
        syncManager.addToQueue('DELETE_FIELD', id);
        set(state => ({ fields: state.fields.filter(f => f.id !== id) }));
    },

    setAnimals: (animals) => set({ animals }),
    setMachines: (machines) => set({ machines }),
    setTasks: (tasks) => set({ tasks }),
    setUsers: (users) => set({ users }),
    setFeedItems: (feedItems) => set({ feedItems }),
    setTransactions: (transactions) => set({ transactions }),
    setHarvests: (harvests) => set({ harvests }),
    setAnimalBatches: (animalBatches) => set({ animalBatches }),
    setNotifications: (notifications) => set({ notifications }),

    setStocks: (stocks) => set({ stocks }),

    addStock: async (item) => {
        await db.stocks.add(item);
        syncManager.addToQueue('ADD_STOCK', item);
        set(state => ({ stocks: [...state.stocks, item] }));
    },

    updateStock: async (id, updates) => {
        await db.stocks.update(id, updates);
        syncManager.addToQueue('UPDATE_STOCK', { id, updates });
        set(state => ({
            stocks: state.stocks.map(s => s.id === id ? { ...s, ...updates } : s)
        }));
    },

    deleteStock: async (id) => {
        await db.stocks.delete(id);
        syncManager.addToQueue('DELETE_STOCK', id);
        set(state => ({ stocks: state.stocks.filter(s => s.id !== id) }));
    },

    addAnimal: async (animal) => {
        await db.animals.add(animal);
        syncManager.addToQueue('ADD_ANIMAL', animal);
        set(state => ({ animals: [...state.animals, animal] }));
    },

    updateAnimal: async (id, updates) => {
        await db.animals.update(id, updates);
        syncManager.addToQueue('UPDATE_ANIMAL', { id, updates });
        set(state => ({
            animals: state.animals.map(a => a.id === id ? { ...a, ...updates } : a)
        }));
    },

    addProduction: async (id, value, type) => {
        const animal = get().animals.find(a => a.id === id);
        if (!animal) return;

        const record = { date: new Date().toISOString().split('T')[0], value, type };
        const updates: Partial<Animal> = {
            productionHistory: [...(animal.productionHistory || []), record],
            weight: type === 'weight' ? value : animal.weight
        };

        await db.animals.update(id, updates);
        syncManager.addToQueue('ADD_PRODUCTION', { id, record, updates });
        set(state => ({
            animals: state.animals.map(a => a.id === id ? { ...a, ...updates } : a)
        }));
    },

    addAnimalBatch: async (batch) => {
        await db.animalBatches.add(batch);
        syncManager.addToQueue('ADD_ANIMAL_BATCH', batch);
        set(state => ({ animalBatches: [...state.animalBatches, batch] }));
    },

    updateAnimalBatch: async (id, updates) => {
        await db.animalBatches.update(id, updates);
        syncManager.addToQueue('UPDATE_ANIMAL_BATCH', { id, updates });
        set(state => ({
            animalBatches: state.animalBatches.map(b => b.id === id ? { ...b, ...updates } : b)
        }));
    },

    deleteAnimalBatch: async (id) => {
        await db.animalBatches.delete(id);
        syncManager.addToQueue('DELETE_ANIMAL_BATCH', id);
        set(state => ({ animalBatches: state.animalBatches.filter(b => b.id !== id) }));
    },

    reclaimCredits: async (amount: number, value: number) => {
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

    applyBatchAction: async (batchId, actionType, description) => {
        const batch = get().animalBatches.find(b => b.id === batchId);
        if (!batch) return;

        const log: FieldLog = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            type: 'treatment',
            description: `${actionType}: ${description}`
        };

        const newHistory = [...(batch.history || []), log];
        await db.animalBatches.update(batchId, { history: newHistory });
        syncManager.addToQueue('APPLY_BATCH_ACTION', { batchId, actionType, description, log });

        set(state => ({
            animalBatches: state.animalBatches.map(b => b.id === batchId ? { ...b, history: newHistory } : b)
        }));

        // Also add a global notification
        const notification: Notification = {
            id: `notif-batch-${Date.now()}`,
            title: `Ação em Massa: ${batch.name}`,
            message: `${actionType} aplicada a todos os animais do lote.`,
            type: 'info',
            timestamp: new Date().toISOString(),
            read: false
        };
        await db.notifications.add(notification);
        set(state => ({ notifications: [notification, ...state.notifications] }));
    },

    addMachine: async (machine) => {
        await db.machines.add(machine);
        syncManager.addToQueue('ADD_MACHINE', machine);
        set(state => ({ machines: [...state.machines, machine] }));
    },

    updateMachine: async (id, updates) => {
        await db.machines.update(id, updates);
        syncManager.addToQueue('UPDATE_MACHINE', { id, updates });
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

    addUser: async (user) => {
        await db.users.add(user);
        syncManager.addToQueue('ADD_USER', user);
        set(state => ({ users: [...state.users, user] }));
    },

    deleteUser: async (id) => {
        await db.users.delete(id);
        syncManager.addToQueue('DELETE_USER', id);
        set(state => ({ users: state.users.filter(u => u.id !== id) }));
    },

    updateUser: async (id, updates) => {
        await db.users.update(id, updates);
        syncManager.addToQueue('UPDATE_USER', { id, updates });
        set(state => ({
            users: state.users.map(u => u.id === id ? { ...u, ...updates } : u)
        }));
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
        syncManager.addToQueue('TOGGLE_IRRIGATION', { id, status });
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

    addFeedItem: async (item) => {
        await db.feed.add(item);
        syncManager.addToQueue('ADD_FEED_ITEM', item);
        set(state => ({
            feedItems: [item, ...state.feedItems],
            hasUnreadFeed: true
        }));

        // Auto-generate a notification for EVERY feed item
        const notif: Notification = {
            id: `notif-feed-${item.id}`,
            title: item.type === 'alert' ? `ALERTA: ${item.userName}` : `Novo Post: ${item.userName}`,
            message: item.content,
            type: item.type === 'alert' ? 'critical' : 'info',
            timestamp: item.timestamp,
            read: false
        };
        await db.notifications.add(notif);
        set(state => ({ notifications: [notif, ...state.notifications] }));
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
    },

    setFocusedTarget: (target) => set({ focusedTarget: target }),

    openModal: (modalId, data) => set(state => {
        const newModals = { ...state.ui.modals };
        if (modalId === 'taskProof') newModals.taskProof = data;
        else if (modalId === 'traceability') newModals.traceability = data;
        else (newModals as any)[modalId] = true;

        return { ui: { ...state.ui, modals: newModals } };
    }),

    closeModal: (modalId) => set(state => {
        const newModals = { ...state.ui.modals };
        if (modalId === 'taskProof') newModals.taskProof = null;
        else if (modalId === 'traceability') newModals.traceability = null;
        else if (modalId === 'guide') {
            newModals.guide = false;
            newModals.guideStep = 1;
            newModals.guideData = {
                stockId: '', quantity: '', clientName: '', clientNif: '',
                destination: '', plate: '', date: new Date().toISOString().split('T')[0],
                price: '', fieldId: ''
            };
        }
        else (newModals as any)[modalId] = false;

        return { ui: { ...state.ui, modals: newModals } };
    }),

    setChildModalOpen: (isOpen) => set(state => ({
        ui: { ...state.ui, isChildModalOpen: isOpen }
    })),

    updateGuideData: (updates) => set(state => ({
        ui: {
            ...state.ui,
            modals: {
                ...state.ui.modals,
                ...updates,
                guideData: updates.guideData ? { ...state.ui.modals.guideData, ...updates.guideData } : state.ui.modals.guideData
            }
        }
    }))
}));
