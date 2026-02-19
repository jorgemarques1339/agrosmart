import { db } from './db';
import { useStore } from '../store/useStore';
import { haptics } from '../utils/haptics';

export class SyncManager {
    private static instance: SyncManager;
    private isSyncing = false;
    private syncInterval: NodeJS.Timeout | null = null;

    private constructor() {
        this.setupConnectivityListeners();
    }

    public static getInstance(): SyncManager {
        if (!SyncManager.instance) {
            SyncManager.instance = new SyncManager();
        }
        return SyncManager.instance;
    }

    private setupConnectivityListeners() {
        window.addEventListener('online', () => {
            console.log('Connectivity restored. Starting sync...');
            useStore.getState().setOnline(true);
            this.processQueue();
        });

        window.addEventListener('offline', () => {
            console.log('Connectivity lost. Queuing operations...');
            useStore.getState().setOnline(false);
        });
    }

    public async addToQueue(operation: string, data: any) {
        const item = {
            operation,
            data,
            timestamp: new Date().toISOString(),
            status: 'pending' as const
        };

        await db.syncQueue.add(item);

        if (navigator.onLine) {
            this.processQueue();
        } else {
            console.warn(`Offline: Operation ${operation} queued.`);
            haptics.warning();
        }
    }

    public async processQueue() {
        if (this.isSyncing || !navigator.onLine) return;

        const pendingItems = await db.syncQueue.where('status').equals('pending').toArray();
        if (pendingItems.length === 0) return;

        this.isSyncing = true;
        console.log(`Processing ${pendingItems.length} items from sync queue...`);

        for (const item of pendingItems) {
            try {
                await db.syncQueue.update(item.id!, { status: 'syncing' });

                // --- SYNC LOGIC SIMULATION ---
                // In a real app, this would be an API call
                // axios.post('/api/sync', item.data)
                await new Promise(resolve => setTimeout(resolve, 800));
                // -----------------------------

                await db.syncQueue.delete(item.id!);
                console.log(`Synced: ${item.operation}`);
            } catch (error) {
                console.error(`Sync failed for item ${item.id}:`, error);
                await db.syncQueue.update(item.id!, { status: 'failed' });
            }
        }

        this.isSyncing = false;
        haptics.success();

        // Final check in case new items were added during sync
        const remaining = await db.syncQueue.count();
        if (remaining > 0) {
            this.processQueue();
        }
    }

    public startAutoSync(ms: number = 30000) {
        if (this.syncInterval) clearInterval(this.syncInterval);
        this.syncInterval = setInterval(() => this.processQueue(), ms);
    }

    public stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
}

export const syncManager = SyncManager.getInstance();
