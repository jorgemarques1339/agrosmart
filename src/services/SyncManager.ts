import { db } from './db';
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
        window.addEventListener('online', async () => {
            console.log('[SyncManager] Connectivity restored. Starting sync...');
            const store = await this.getStore();
            store.setOnline(true);
            this.processQueue();
        });

        window.addEventListener('offline', async () => {
            console.log('[SyncManager] Connectivity lost. Queuing operations...');
            const store = await this.getStore();
            store.setOnline(false);
        });
    }

    private async getStore() {
        const { useStore } = await import('../store/useStore');
        return useStore.getState();
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
            const store = await this.getStore();
            store.setSyncStatus('offline');
            haptics.warning();
        }
    }

    public async sync() {
        await this.processQueue();
    }

    public async processQueue() {
        if (this.isSyncing || !navigator.onLine) return;

        this.isSyncing = true;
        const store = await this.getStore();

        try {
            let totalProcessed = 0;
            let retryCount = 0;
            const MAX_RETRIES = 3;

            // Exhaustion Loop: Keep processing while there are items, up to a limit
            while (true) {
                const itemsToProcess = await db.syncQueue
                    .filter(item => item.status === 'pending' || item.status === 'failed')
                    .toArray();

                if (itemsToProcess.length === 0 || retryCount >= MAX_RETRIES) break;

                store.setSyncStatus('syncing');
                console.log(`[SyncManager] Pushing ${itemsToProcess.length} items (Attempt ${retryCount + 1})...`);

                let successInThisPass = 0;

                for (const item of itemsToProcess) {
                    try {
                        await db.syncQueue.update(item.id!, { status: 'syncing' });

                        const table = this.mapOperationToTable(item.operation);
                        if (table) {
                            let payload = this.preparePayload(item.operation, item.data);

                            // --- DEFENSIVE SYNC SAFETY NET ---
                            const isDelete = item.operation.startsWith('DELETE_');
                            const needsHealing = !isDelete && (table === 'fields' || table === 'animals') && (!payload.name || (table === 'fields' && !payload.crop));

                            if (needsHealing) {
                                console.warn(`[Sync] Defensive Action: Payload for ${table} is incomplete. Healing...`, payload);
                                const dexieTable = (db as any)[table];
                                if (dexieTable) {
                                    const localGroundTruth = await dexieTable.get(payload.id);
                                    if (localGroundTruth) {
                                        const healedData = { ...localGroundTruth, ...(item.data.updates || item.data) };
                                        payload = this.toSnakeCase(healedData);
                                        console.log(`[Sync] Healed Payload:`, payload);
                                    } else {
                                        console.error(`[Sync] Critical: Could not heal payload for ${table}:${payload.id}. Local record also missing.`);
                                    }
                                }
                            }

                            console.log(`[Sync] Pushing to ${table}:`, payload);

                            let error = null;

                            if (isDelete) {
                                const deleteId = typeof payload === 'string' ? payload : payload.id;
                                console.log(`[Sync] Executing DELETE on ${table} for id: ${deleteId}`);
                                const result = await supabase
                                    .from(table)
                                    .delete()
                                    .eq('id', deleteId);
                                error = result.error;
                            } else {
                                const result = await supabase
                                    .from(table)
                                    .upsert(payload, { onConflict: 'id' });
                                error = result.error;
                            }

                            if (error) {
                                console.error(`[Sync] Supabase Error (${table}):`, error);
                                // Specific Error: Unique Constraint (Tag NFC already in use)
                                if (error.code === '23505' || error.message?.includes('unique constraint')) {
                                    await this.notifyRemoteUpdate(
                                        'Erro de Registo',
                                        `A Tag NFC "${item.data.tagId || 'lida'}" já está associada a outro animal.`,
                                        'critical'
                                    );
                                    // Move to failed and don't retry this specific item automatically in this loop
                                    await db.syncQueue.update(item.id!, { status: 'failed' });
                                    continue;
                                }

                                // Specific Error: Credentials Missing
                                if (error.message?.includes('credentials missing')) {
                                    console.warn('[SyncManager] Local-only mode detected. Aborting push.');
                                    throw new Error('Local-Only Mode');
                                }

                                throw error;
                            }
                        }

                        await db.syncQueue.delete(item.id!);
                        successInThisPass++;
                        totalProcessed++;
                        console.log(`[Sync] Successfully synced ${item.operation} (${item.id})`);
                    } catch (error: any) {
                        if (error.message === 'Local-Only Mode') throw error;
                        console.error(`[Sync] Error item ${item.id}:`, error);
                        await db.syncQueue.update(item.id!, { status: 'failed' });
                    }
                }

                // If no items succeeded in this entire pass, don't keep retrying
                if (successInThisPass === 0) {
                    console.warn('[SyncManager] No items succeeded in this pass. Suspending retries.');
                    break;
                }

                retryCount++;
                // Small delay to allow other DB operations
                await new Promise(r => setTimeout(r, 500));
            }

            // 2. PULL REMOTE CHANGES
            await this.pullRemoteChanges();

            const lastSync = new Date().toISOString();
            localStorage.setItem('oriva_last_sync', lastSync);

            if (typeof (store as any).setState === 'function') {
                (store as any).setState({ lastSyncTime: lastSync });
            }

            if (totalProcessed > 0) {
                await this.notifyRemoteUpdate(
                    'Sincronização Concluída',
                    `Gravados ${totalProcessed} registos na nuvem.`,
                    'success'
                );
                haptics.success();
            }

            console.log('[SyncManager] Full synchronization process completed.');
        } catch (error: any) {
            console.error('[SyncManager] Critical sync error:', error);
            if (error.message === 'Local-Only Mode') {
                store.setSyncStatus('offline');
            } else {
                store.setSyncStatus('error');
            }
        } finally {
            this.isSyncing = false;
            // Only set to idle if we aren't already in an error/offline state
            const currentStore = await this.getStore();
            if (currentStore.syncStatus === 'syncing') {
                store.setSyncStatus('idle');
            }
        }
    }

    private async pullRemoteChanges() {
        console.log("[SyncManager] Pulling real remote changes from Supabase...");

        const tables = [
            { remote: 'fields', store: 'setFields' },
            { remote: 'animals', store: 'setAnimals' },
            { remote: 'stocks', store: 'setStocks' },
            { remote: 'machines', store: 'setMachines' },
            { remote: 'tasks', store: 'setTasks' },
            { remote: 'users', store: 'setUsers' },
            { remote: 'feed', store: 'setFeedItems' },
            { remote: 'transactions', store: 'setTransactions' },
            { remote: 'harvests', store: 'setHarvests' },
            { remote: 'animal_batches', store: 'setAnimalBatches' },
            { remote: 'notifications', store: 'setNotifications' }
        ];

        for (const meta of tables) {
            try {
                console.log(`[SyncManager] Pulling table: ${meta.remote}...`);
                const { data, error } = await supabase
                    .from(meta.remote)
                    .select('*');

                if (error) {
                    console.error(`[SyncManager] Failed to pull ${meta.remote}:`, error.message);
                    continue;
                }

                if (data) {
                    console.log(`[SyncManager] Pulled ${data.length} items from ${meta.remote}`);

                    // Special Case: Don't wipe users if cloud is empty but we have local ones
                    // This protects the Admin profile during initial setup
                    if (meta.remote === 'users' && data.length === 0) {
                        console.warn('[SyncManager] Cloud users table is empty. Keeping local profiles.');
                        continue;
                    }

                    const camelData = data.map((item: any) => this.toCamelCase(item));

                    // 1. Update IndexDB
                    const dexieTable = (db as any)[meta.remote];
                    if (dexieTable) {
                        await dexieTable.bulkPut(camelData);
                        console.log(`[SyncManager] Updated IndexedDB for ${meta.remote}`);
                    }

                    // 2. Update Store
                    const state = await this.getStore();
                    const storeAction = (state as any)[meta.store];
                    if (typeof storeAction === 'function') {
                        storeAction(camelData);
                        console.log(`[SyncManager] Updated Store via ${meta.store}`);
                    } else {
                        const key = this.mapRemoteToStoreKey(meta.remote);
                        const { useStore } = await import('../store/useStore');
                        useStore.setState({ [key]: camelData } as any);
                        console.log(`[SyncManager] Updated Store via Fallback key: ${key}`);
                    }
                }
            } catch (err) {
                console.error(`[SyncManager] Critical error pulling ${meta.remote}:`, err);
            }
        }
    }

    private mapRemoteToStoreKey(remote: string): string {
        const mapping: Record<string, string> = {
            'fields': 'fields',
            'animals': 'animals',
            'stocks': 'stocks',
            'machines': 'machines',
            'tasks': 'tasks',
            'users': 'users',
            'feed': 'feedItems',
            'transactions': 'transactions',
            'harvests': 'harvests',
            'animal_batches': 'animalBatches',
            'notifications': 'notifications'
        };
        return mapping[remote] || remote;
    }

    private toCamelCase(obj: any): any {
        if (typeof obj !== 'object' || obj === null) return obj;
        if (Array.isArray(obj)) return obj.map(v => this.toCamelCase(v));

        const camelObj: any = {};
        for (const key in obj) {
            const camelKey = key.replace(/([-_][a-z])/g, group =>
                group.toUpperCase().replace('-', '').replace('_', '')
            );
            camelObj[camelKey] = this.toCamelCase(obj[key]);
        }
        return camelObj;
    }

    private mapOperationToTable(op: string): string | null {
        const mapping: Record<string, string> = {
            'ADD_FIELD': 'fields',
            'UPDATE_FIELD': 'fields',
            'DELETE_FIELD': 'fields',
            'TOGGLE_IRRIGATION': 'fields',
            'ADD_FIELD_LOG': 'fields',
            'ADD_ANIMAL': 'animals',
            'UPDATE_ANIMAL': 'animals',
            'ADD_STOCK': 'stocks',
            'UPDATE_STOCK': 'stocks',
            'DELETE_STOCK': 'stocks',
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
            'UPDATE_ANIMAL_BATCH': 'animal_batches',
            'REGISTER_SALE': 'transactions',
            'ADD_TRANSACTION': 'transactions',
            'HARVEST_FIELD': 'harvests'
        };

        return mapping[op] || null;
    }

    private preparePayload(op: string, data: any): any {
        let payload: any;

        // Resilience check: Handle both { id, updates } (legacy) and full state object
        const isLegacyUpdate = data?.updates && data?.id;

        if (op === 'UPDATE_FIELD' || op === 'UPDATE_ANIMAL' || op === 'UPDATE_STOCK' || op === 'UPDATE_MACHINE' || op === 'UPDATE_TASK' || op === 'UPDATE_USER' || op === 'UPDATE_ANIMAL_BATCH') {
            payload = isLegacyUpdate ? { id: data.id, ...data.updates } : data;
        } else if (op === 'TOGGLE_IRRIGATION') {
            payload = { id: data.id, irrigationStatus: data.status };
        } else if (op === 'ADD_FIELD_LOG') {
            payload = { id: data.fieldId, logs: data.fullLogs };
        } else if (op === 'HARVEST_FIELD') {
            payload = data.harvest;
        } else if (op === 'ADD_PRODUCTION') {
            payload = isLegacyUpdate ? { id: data.id, ...data.updates } : data;
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

    private async notifyRemoteUpdate(title: string, message: string, type: 'info' | 'success' | 'critical') {
        const store = await this.getStore();
        store.addNotification({
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

    public async monitorIoTHealth() {
        const store = await this.getStore();
        const { fields, addNotification, notifications } = store;
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
