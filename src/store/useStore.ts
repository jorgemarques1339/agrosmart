import { create } from 'zustand';
import { db } from '../services/db';
import { syncManager } from '../services/SyncManager';
import {
    Field, StockItem, Animal, Machine, Transaction, Task,
    UserProfile, Notification, ProductBatch, FieldLog, Sensor, MaintenanceLog,
    WeatherForecast, DetailedForecast, AnimalBatch, FeedItem
} from '../types';

// Import slices
import { createAuthSlice, AuthSlice } from './slices/authSlice';
import { createFieldSlice, FieldSlice } from './slices/fieldSlice';
import { createAnimalSlice, AnimalSlice } from './slices/animalSlice';
import { createInventorySlice, InventorySlice } from './slices/inventorySlice';
import { createMachineSlice, MachineSlice } from './slices/machineSlice';
import { createTaskSlice, TaskSlice } from './slices/taskSlice';
import { createNotificationSlice, NotificationSlice } from './slices/notificationSlice';
import { createUISlice, UISlice } from './slices/uiSlice';

export type AppState = AuthSlice & FieldSlice & AnimalSlice & InventorySlice &
    MachineSlice & TaskSlice & NotificationSlice & UISlice & {
        isHydrated: boolean;
        syncStatus: 'idle' | 'syncing' | 'error' | 'offline';
        lastSyncTime: string | null;
        hydrate: () => Promise<void>;
        resetAllData: () => Promise<void>;
        setSyncStatus: (status: 'idle' | 'syncing' | 'error' | 'offline') => void;
    };

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

export const useStore = create<AppState>()((...a) => ({
    ...createAuthSlice(...a),
    ...createFieldSlice(...a),
    ...createAnimalSlice(...a),
    ...createInventorySlice(...a),
    ...createMachineSlice(...a),
    ...createTaskSlice(...a),
    ...createNotificationSlice(...a),
    ...createUISlice(...a),

    isHydrated: false,
    syncStatus: 'idle',
    lastSyncTime: localStorage.getItem('oriva_last_sync') || null,

    setSyncStatus: (status) => (a[0] as any)({ syncStatus: status }),

    resetAllData: async () => {
        const set = a[0];
        console.log('[Store] Resetting all data...');

        await Promise.all([
            db.fields.clear(),
            db.stocks.clear(),
            db.animals.clear(),
            db.machines.clear(),
            db.transactions.clear(),
            db.tasks.clear(),
            db.notifications.clear(),
            db.users.clear(),
            db.animalBatches.clear(),
            db.harvests.clear(),
            db.feed.clear(),
            db.syncQueue.clear()
        ]);

        localStorage.removeItem('oriva_last_sync');
        localStorage.removeItem('oriva_auth_state');
        localStorage.setItem('oriva_avoid_mock', 'true');

        console.log('[Store] All data wiped successfully.');
        alert('Todos os dados locais foram removidos. A aplicação irá reiniciar.');
        window.location.reload();
    },

    hydrate: async () => {
        const set = a[0];
        const get = a[1] as any;

        // Migration logic
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
                engineRpm: 1850, groundSpeed: 8.4, fuelRate: 12.5, ptoSpeed: 540,
                hydraulicPressure: 185, engineLoad: 68, coolantTemp: 92, adBlueLevel: 85,
                implementDepth: 12, dtc: [] as string[], lastUpdate: new Date().toISOString()
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
            // Sync all mock users to cloud to ensure FK constraints work
            for (const u of MOCK_STATE.users) {
                syncManager.addToQueue('ADD_USER', u);
            }
            users = await db.users.toArray();
        } else {
            // [AUTO-PATCH] Ensure Jorge Marques (Master) is in the list
            const masterExists = users.some(u => u.username === 'jorge_marques');
            if (!masterExists) {
                const { MOCK_STATE } = await import('../constants');
                const master = MOCK_STATE.users.find(u => u.username === 'jorge_marques');
                if (master) {
                    await db.users.put(master);
                    syncManager.addToQueue('ADD_USER', master);
                    users = await db.users.toArray();
                }
            }
        }

        // Fill with MOCK_STATE only if really empty AND no cloud sync happened
        // Check if Supabase is configured
        const isCloudConfigured = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
        const avoidMock = localStorage.getItem('oriva_avoid_mock') === 'true';

        if (fields.length === 0 && stocks.length === 0) {
            let populatedFromCloud = false;
            if (isCloudConfigured) {
                console.log('[Store] Local is empty. Attempting initial cloud pull...');
                try {
                    await syncManager.pullRemoteChanges();
                    // Re-check after pull
                    const cloudFields = await db.fields.toArray();
                    const cloudStocks = await db.stocks.toArray();
                    if (cloudFields.length > 0 || cloudStocks.length > 0) {
                        populatedFromCloud = true;
                        console.log('[Store] Cloud data found. Skipping mock seeding.');
                    }
                } catch (err) {
                    console.error('[Store] Initial cloud pull failed:', err);
                }
            }

            if (!populatedFromCloud && !avoidMock) {
                console.log('[Store] Seeding mock state (Cloud empty or not configured).');
                const { MOCK_STATE } = await import('../constants');
                await Promise.all([
                    db.fields.bulkAdd(MOCK_STATE.fields),
                    db.stocks.bulkAdd(MOCK_STATE.stocks),
                    db.animals.bulkAdd(MOCK_STATE.animals),
                    db.machines.bulkAdd(MOCK_STATE.machines),
                    db.transactions.bulkAdd(MOCK_STATE.transactions),
                    db.tasks.bulkAdd(MOCK_STATE.tasks),
                ]);
            }

            // Re-fetch arrays
            [fields, stocks, animals, machines, transactions, tasks, notifications, users, harvests, animalBatches, feedItems] = await Promise.all([
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

            // Ensure master user exists
            const masterExists = users.some(u => u.username === 'jorge_marques');
            if (!masterExists && !avoidMock) {
                const { MOCK_STATE } = await import('../constants');
                const master = MOCK_STATE.users.find(u => u.username === 'jorge_marques');
                if (master) {
                    await db.users.put(master);
                    users = await db.users.toArray();
                }
            }
        }

        // Authentication is handled via isAuthenticated state restored from localStorage
        // and verified against the users list fetched from DB
        const currentId = get().currentUserId;
        const validUser = users.find(u => u.id === currentId);

        if (!validUser && get().isAuthenticated) {
            console.warn('[Store] Authenticated user not found in DB. Resetting auth.');
            set({ isAuthenticated: false, currentUserId: 'guest' });
            localStorage.removeItem('oriva_auth_state');
        }

        set({
            fields, stocks, animals, machines, transactions, tasks, notifications, users, harvests, animalBatches, feedItems,
            isHydrated: true
        });
    },
}));
