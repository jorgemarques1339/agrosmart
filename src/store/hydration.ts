import { db } from '../services/db';
import { syncManager } from '../services/SyncManager';
import {
    Field, StockItem, Animal, Machine, Transaction, Task,
    UserProfile, Notification, AnimalBatch, FeedItem, ProductBatch
} from '../types';

export const hydrateStore = async (set: any, get: any) => {
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

    const dbResults = await Promise.all([
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
        db.sessions.toArray(),
    ]);

    let [fields, stocks, animals, machines, transactions, tasks, notifications, users, harvests, animalBatches, feedItems, activeSessions] = [
        dbResults[0].filter(Boolean) as Field[],
        dbResults[1].filter(Boolean) as StockItem[],
        dbResults[2].filter(Boolean) as Animal[],
        dbResults[3].filter(Boolean) as Machine[],
        dbResults[4].filter(Boolean) as Transaction[],
        dbResults[5].filter(Boolean) as Task[],
        dbResults[6].filter(Boolean) as Notification[],
        dbResults[7].filter(Boolean) as UserProfile[],
        dbResults[8].filter(Boolean) as ProductBatch[],
        dbResults[9].filter(Boolean) as AnimalBatch[],
        dbResults[10].filter(Boolean) as FeedItem[],
        dbResults[11].filter(Boolean) as any[],
    ];

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

    // [AUTO-PATCH] Ensure Oliva exists in stock with "Colheita" category for demo
    const olivaStock = stocks.find(s => (s?.name || '').toLowerCase().includes('oliva') || (s?.name || '').toLowerCase().includes('azeitona'));
    if (!olivaStock) {
        const mockOliva = {
            id: 's-mock-oliva', name: 'Oliva (Azeitona)', category: 'Colheita' as any,
            quantity: 5000, unit: 'kg', minStock: 0, pricePerUnit: 3.84, updatedAt: new Date().toISOString()
        };
        await db.stocks.add(mockOliva);
        stocks.push(mockOliva);
    } else if ((olivaStock.category || '').toLowerCase() !== 'colheita') {
        olivaStock.category = 'Colheita' as any;
        await db.stocks.update(olivaStock.id, { category: 'Colheita' });
    }

    // [AUTO-PATCH] Ensure Carrinha da Quinta (m2) is UNCONFIGURED for demo purposes
    const exampleMachine = machines.find(m => m.id === 'm2' || m.name === 'Carrinha da Quinta');
    if (exampleMachine && exampleMachine.isobusData) {
        delete exampleMachine.isobusData;
        await db.machines.update(exampleMachine.id, { isobusData: undefined });
    }

    // --- CLOUD-FIRST INITIALIZATION ---
    const isCloudConfigured = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (isCloudConfigured && navigator.onLine) {
        console.log('[Store] Cloud configured and online. Pulling latest data from Supabase...');
        try {
            // Determine if we need to block for the pull (if completely empty)
            const isLocalEmpty = fields.length === 0 && stocks.length === 0 && users.length === 0;

            if (isLocalEmpty) {
                console.log('[Store] Local DB is empty, blocking to fetch initial data...');
                await syncManager.pullRemoteChanges();
            } else {
                console.log('[Store] Local DB has data, but awaiting cloud sync to prevent hydration race condition...');
                await syncManager.pullRemoteChanges();
            }

            // Always re-fetch all immediately after pull to guarantee state consistency
            const newDbResults = await Promise.all([
                db.fields.toArray(), db.stocks.toArray(), db.animals.toArray(),
                db.machines.toArray(), db.transactions.toArray(), db.tasks.toArray(),
                db.notifications.toArray(), db.users.toArray(), db.harvests.toArray(),
                db.animalBatches.toArray(), db.feed.toArray(), db.sessions.toArray(),
            ]);

            [fields, stocks, animals, machines, transactions, tasks, notifications, users, harvests, animalBatches, feedItems, activeSessions] = [
                newDbResults[0].filter(Boolean) as Field[], newDbResults[1].filter(Boolean) as StockItem[],
                newDbResults[2].filter(Boolean) as Animal[], newDbResults[3].filter(Boolean) as Machine[],
                newDbResults[4].filter(Boolean) as Transaction[], newDbResults[5].filter(Boolean) as Task[],
                newDbResults[6].filter(Boolean) as Notification[], newDbResults[7].filter(Boolean) as UserProfile[],
                newDbResults[8].filter(Boolean) as ProductBatch[], newDbResults[9].filter(Boolean) as AnimalBatch[],
                newDbResults[10].filter(Boolean) as FeedItem[], newDbResults[11].filter(Boolean) as any[]
            ];
        } catch (err) {
            console.error('[Store] Initial cloud pull failed:', err);
        }
    } else if (users.length === 0) {
        console.warn('[Store] OFFLINE and empty DB! The app will not function without an initial sync.');
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
        activeSession: activeSessions.length > 0 ? activeSessions[0] : null,
        isHydrated: true
    });
};
