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
        this.syncInterval = setInterval(() => {
            this.processQueue();
            this.monitorIoTHealth();
        }, ms);
    }

    public stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    public monitorIoTHealth() {
        const { fields, addNotification, notifications } = useStore.getState();
        const CRITICAL_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
        // const CRITICAL_THRESHOLD_MS = 60 * 1000; // Debug: 1 min

        fields.forEach(field => {
            if (!field.sensors) return;

            field.sensors.forEach(sensor => {
                const lastSeen = new Date(sensor.lastSeen).getTime();
                const now = Date.now();
                const diff = now - lastSeen;

                if (diff > CRITICAL_THRESHOLD_MS) {
                    // Check if already notified to avoid spam
                    const alreadyNotified = notifications.some(n =>
                        n.relatedId === sensor.id &&
                        n.type === 'critical' &&
                        !n.read
                    );

                    if (!alreadyNotified) {
                        console.warn(`CRITICAL: Sensor ${sensor.name} silent for ${Math.floor(diff / 3600000)}h`);

                        addNotification({
                            id: `iot-alert-${sensor.id}-${Date.now()}`,
                            title: 'Falha Crítica de Hardware',
                            message: `O sensor "${sensor.name}" não comunica há mais de 24h. Verifique a bateria ou conexão.`,
                            type: 'critical',
                            timestamp: new Date().toISOString(),
                            read: false,
                            relatedId: sensor.id,
                            actionLink: `app://dashboard/map?lat=${field.coordinates[0]}&lng=${field.coordinates[1]}&sensorId=${sensor.id}`
                        });

                        haptics.error(); // Vibrate on critical alert
                    }
                }
            });
        });
    }
}

export const syncManager = SyncManager.getInstance();
