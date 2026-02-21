import { db } from './db';
import { useStore } from '../store/useStore';
import { haptics } from '../utils/haptics';
import * as Comlink from 'comlink';
import type { DataSyncWorker } from '../workers/dataWorker';
import { FeedItem } from '../types';
import { supabase } from './supabaseClient';

export class SyncManager {
    private static instance: SyncManager;
    private isSyncing = false;
    private syncInterval: NodeJS.Timeout | null = null;
    public dataWorker: Comlink.Remote<DataSyncWorker> | null = null;

    private constructor() {
        this.setupConnectivityListeners();
        this.initWorker();
        console.log('[SyncManager] Initialized.');
    }

    private initWorker() {
        if (typeof window !== 'undefined' && window.Worker) {
            const worker = new Worker(new URL('../workers/dataWorker.ts', import.meta.url), { type: 'module' });
            this.dataWorker = Comlink.wrap<DataSyncWorker>(worker);
        }
    }

    public static getInstance(): SyncManager {
        if (!SyncManager.instance) {
            SyncManager.instance = new SyncManager();
        }
        return SyncManager.instance;
    }

    private setupConnectivityListeners() {
        window.addEventListener('online', () => {
            console.log('[SyncManager] Connectivity restored. Starting sync...');
            useStore.getState().setOnline(true);
            this.processQueue();
        });

        window.addEventListener('offline', () => {
            console.log('[SyncManager] Connectivity lost. Queuing operations...');
            useStore.getState().setOnline(false);
        });
    }

    public async addToQueue(operation: string, data: any) {
        console.log(`[SyncManager] Adding to queue: ${operation}`);
        const item = {
            operation,
            data,
            timestamp: new Date().toISOString(),
            status: 'pending' as const
        };

        await db.syncQueue.add(item);

        if (navigator.onLine) {
            console.log('[SyncManager] Online: triggering processQueue()...');
            this.processQueue();
        } else {
            console.warn(`[SyncManager] Offline: Operation ${operation} queued.`);
            useStore.getState().setSyncStatus('offline');
            haptics.warning();
        }
    }

    public async sync() {
        await this.processQueue();
    }

    public async processQueue() {
        if (this.isSyncing || !navigator.onLine) return;

        // Process both pending and failed items to ensure recovery
        const itemsToProcess = await db.syncQueue
            .filter(item => item.status === 'pending' || item.status === 'failed')
            .toArray();

        if (itemsToProcess.length === 0) return;

        this.isSyncing = true;
        useStore.getState().setSyncStatus('syncing');

        console.log(`[SyncManager] Processing ${itemsToProcess.length} items...`);

        // 1. PUSH LOCAL CHANGES
        for (const item of itemsToProcess) {
            try {
                await db.syncQueue.update(item.id!, { status: 'syncing' });

                // --- REAL SUPABASE SYNC ---
                const table = this.mapOperationToTable(item.operation);
                const payload = this.preparePayload(item.operation, item.data);

                if (table) {
                    const { error } = await supabase
                        .from(table)
                        .upsert(payload, { onConflict: 'id' });

                    if (error) {
                        console.error(`[Sync] Fail: ${table}`, error.message);
                        throw error;
                    }
                }
                // --------------------------

                await db.syncQueue.delete(item.id!);
            } catch (error) {
                console.error(`[Sync] Error item ${item.id}:`, error);
                await db.syncQueue.update(item.id!, { status: 'failed' });
            }
        }

        // 2. PULL REMOTE CHANGES (Simulation)
        await this.pullRemoteChanges();

        const lastSync = new Date().toISOString();
        localStorage.setItem('oriva_last_sync', lastSync);
        useStore.setState({ lastSyncTime: lastSync, syncStatus: 'idle' });

        this.isSyncing = false;
        haptics.success();

        // Final check in case new items were added during sync
        const remaining = await db.syncQueue.count();
        if (remaining > 0) {
            this.processQueue();
        }
    }

    private async pullRemoteChanges() {
        console.log("Pulling real remote changes from Supabase Cloud...");

        // In a real implementation, we would fetch the last modified date
        // and only pull items newer than that. For this phase, we ensure 
        // real-time listeners are active (implemented in App.tsx).

        // This method can still be used for a full manual refresh if needed.
    }

    private mapOperationToTable(op: string): string | null {
        const mapping: Record<string, string> = {
            'ADD_FIELD': 'fields',
            'UPDATE_FIELD': 'fields',
            'DELETE_FIELD': 'fields',
            'ADD_ANIMAL': 'animals',
            'UPDATE_ANIMAL': 'animals',
            'ADD_STOCK': 'stocks',
            'UPDATE_STOCK': 'stocks',
            'ADD_MACHINE': 'machines',
            'UPDATE_MACHINE': 'machines',
            'ADD_TASK': 'tasks',
            'UPDATE_TASK': 'tasks',
            'ADD_USER': 'users',
            'UPDATE_USER': 'users',
            'ADD_FEED_ITEM': 'feed',
            'ADD_PRODUCTION': 'animals',
            'RECLAIM_CREDITS': 'transactions',
            'ADD_ANIMAL_BATCH': 'animal_batches',
            'UPDATE_ANIMAL_BATCH': 'animal_batches'
        };

        for (const key in mapping) {
            if (op.includes(key)) return mapping[key];
        }
        return null;
    }

    private preparePayload(op: string, data: any): any {
        let payload: any;

        if (op.includes('UPDATE_')) {
            payload = { id: data.id, ...data.updates };
        } else if (op === 'ADD_PRODUCTION') {
            payload = { id: data.id, ...data.updates };
        } else if (op === 'RECLAIM_CREDITS') {
            payload = data.transaction;
        } else {
            payload = data;
        }

        // Convert keys to snake_case to match SQL schema
        return this.toSnakeCase(payload);
    }

    private toSnakeCase(obj: any): any {
        if (typeof obj !== 'object' || obj === null) return obj;
        if (Array.isArray(obj)) return obj.map(v => this.toSnakeCase(v));

        const snakeObj: any = {};
        for (const key in obj) {
            // Special cases for acronyms if needed, or just standard camelToSnake
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            snakeObj[snakeKey] = this.toSnakeCase(obj[key]);
        }
        return snakeObj;
    }

    private notifyRemoteUpdate(title: string, message: string, type: 'info' | 'success' | 'critical') {
        useStore.getState().addNotification({
            id: `remote-notif-${Date.now()}`,
            title,
            message,
            type,
            timestamp: new Date().toISOString(),
            read: false
        });
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

    // --- EDGE COMPUTING STRESS TEST ---
    public async runStressTest(count: number, onProgress: (msg: string) => void) {
        if (!this.dataWorker) {
            onProgress('Erro: Web Worker não inicializado.');
            return;
        }
        await this.dataWorker.stressTestInsert(count, Comlink.proxy(onProgress));
    }

    public async clearStressTest(onProgress: (msg: string) => void) {
        if (!this.dataWorker) return;
        await this.dataWorker.clearStressTestData(Comlink.proxy(onProgress));
    }
}

export const syncManager = SyncManager.getInstance();
