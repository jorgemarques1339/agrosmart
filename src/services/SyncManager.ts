import { db } from './db';
import { useStore } from '../store/useStore';
import { haptics } from '../utils/haptics';
import * as Comlink from 'comlink';
import type { DataSyncWorker } from '../workers/dataWorker';
import { FeedItem } from '../types';

export class SyncManager {
    private static instance: SyncManager;
    private isSyncing = false;
    private syncInterval: NodeJS.Timeout | null = null;
    public dataWorker: Comlink.Remote<DataSyncWorker> | null = null;

    private constructor() {
        this.setupConnectivityListeners();
        this.initWorker();
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
            useStore.getState().setSyncStatus('offline');
            haptics.warning();
        }
    }

    public async sync() {
        await this.processQueue();
    }

    public async processQueue() {
        if (this.isSyncing || !navigator.onLine) return;

        const pendingItems = await db.syncQueue.where('status').equals('pending').toArray();
        this.isSyncing = true;
        useStore.getState().setSyncStatus('syncing');

        console.log(`Processing ${pendingItems.length} items from sync queue...`);

        // 1. PUSH LOCAL CHANGES
        for (const item of pendingItems) {
            try {
                await db.syncQueue.update(item.id!, { status: 'syncing' });

                // --- SYNC LOGIC SIMULATION ---
                // Mock API call
                await new Promise(resolve => setTimeout(resolve, 800));
                // -----------------------------

                await db.syncQueue.delete(item.id!);
            } catch (error) {
                console.error(`Sync failed for item ${item.id}:`, error);
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
        console.log("Pulling remote changes from Enterprise Cloud...");
        await new Promise(r => setTimeout(r, 1200));

        const random = Math.random();

        // 1. Simulate Remote Feed Post
        if (random > 0.8) {
            const remoteItem: FeedItem = {
                id: `remote-feed-${Date.now()}`,
                userId: 'user-admin',
                userName: 'António (Dono)',
                userAvatar: 'A',
                type: 'text',
                content: 'Bom trabalho com a rega de hoje. Verifiquem o Stock de Fertilizantes.',
                location: [41.444, -8.725],
                timestamp: new Date().toISOString()
            };

            const exists = await db.feed.get(remoteItem.id);
            if (!exists) {
                await db.feed.add(remoteItem);
                useStore.setState(state => ({
                    feedItems: [remoteItem, ...state.feedItems],
                    hasUnreadFeed: true
                }));
                this.notifyRemoteUpdate(`Mensagem de ${remoteItem.userName}`, remoteItem.content, 'info');
            }
        }

        // 2. Simulate Remote Field Log (Cultivation Note)
        if (random > 0.6 && random <= 0.8) {
            const { fields } = useStore.getState();
            if (fields.length > 0) {
                const targetField = fields[0];
                const remoteLog: any = {
                    id: `remote-log-${Date.now()}`,
                    date: new Date().toISOString().split('T')[0],
                    type: 'observation',
                    description: 'Observação Remota: Solo parece seco na Parcela Norte.'
                };

                await db.fields.update(targetField.id, {
                    logs: [...(targetField.logs || []), remoteLog]
                });

                useStore.setState(state => ({
                    fields: state.fields.map(f => f.id === targetField.id ? { ...f, logs: [...(f.logs || []), remoteLog] } : f)
                }));

                this.notifyRemoteUpdate(`Nota de Cultivo: ${targetField.name}`, remoteLog.description, 'success');
            }
        }

        // 3. Simulate Stock Update
        if (random > 0.4 && random <= 0.6) {
            const { stocks } = useStore.getState();
            if (stocks.length > 0) {
                const targetStock = stocks[0];
                const newQty = targetStock.quantity + 50;
                await db.stocks.update(targetStock.id, { quantity: newQty });

                useStore.setState(state => ({
                    stocks: state.stocks.map(s => s.id === targetStock.id ? { ...s, quantity: newQty } : s)
                }));

                this.notifyRemoteUpdate('Stock Atualizado', `${targetStock.name} reforçado por Entrega Cloud.`, 'info');
            }
        }

        // 4. Simulate Remote Task Assignment
        if (random > 0.2 && random <= 0.4) {
            const remoteTask: any = {
                id: `remote-task-${Date.now()}`,
                title: 'Verificação Urgente: Parcela B',
                description: 'O dono solicitou uma inspeção visual rápida na Parcela B.',
                priority: 'high',
                completed: false,
                date: new Date().toISOString().split('T')[0],
                tags: ['Inspeção'],
                userId: useStore.getState().currentUserId
            };

            await db.tasks.add(remoteTask);
            useStore.setState(state => ({
                tasks: [...state.tasks, remoteTask]
            }));

            this.notifyRemoteUpdate('Nova Tarefa Atribuída', remoteTask.title, 'critical');
        }

        // 5. Simulate Remote Machine Status
        if (random > 0 && random <= 0.2) {
            const { machines } = useStore.getState();
            const targetMachine = machines[0];
            const newStatus: any = targetMachine.status === 'active' ? 'maintenance' : 'active';
            await db.machines.update(targetMachine.id, { status: newStatus });

            useStore.setState(state => ({
                machines: state.machines.map(m => m.id === targetMachine.id ? { ...m, status: newStatus } : m)
            }));

            this.notifyRemoteUpdate('Estado de Frota', `${targetMachine.name} marcado como ${newStatus === 'maintenance' ? 'Em Manutenção' : 'Ativo'} via Cloud.`, 'info');
        }
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
