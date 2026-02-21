import { supabase } from './supabaseClient';
import { db } from './db';
import { useStore } from '../store/useStore';
import { haptics } from '../utils/haptics';

export class SupabaseRealtime {
    private static instance: SupabaseRealtime;
    private channel: any = null;

    public static getInstance(): SupabaseRealtime {
        if (!SupabaseRealtime.instance) {
            SupabaseRealtime.instance = new SupabaseRealtime();
        }
        return SupabaseRealtime.instance;
    }

    public init() {
        if (this.channel) return;

        console.log('[SupabaseRealtime] Initializing subscription...');

        this.channel = supabase
            .channel('farm-realtime')
            .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
                console.log('[SupabaseRealtime] Event Received:', payload.eventType, payload.table);
                this.handleCloudChange(payload);
            })
            .subscribe((status) => {
                console.log('[SupabaseRealtime] Status:', status);
                if (status === 'CHANNEL_ERROR') {
                    console.error('[SupabaseRealtime] Failed to connect to realtime. Check RLS and Publication.');
                }
            });
    }

    private async handleCloudChange(payload: any) {
        const { table, eventType, old: oldItem } = payload;

        console.log(`[SupabaseRealtime] Raw Event: ${eventType} on ${table}`, payload.new);

        // Convert incoming snake_case data to camelCase for the app
        const newItem = this.toCamelCase(payload.new);
        const store = useStore.getState();

        console.log(`[SupabaseRealtime] Processed Item:`, newItem);

        try {
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
                // 1. Sync to IndexDB
                const dexieTable = (db as any)[table];
                if (dexieTable) {
                    await dexieTable.put(newItem);
                    console.log(`[SupabaseRealtime] Updated local DB: ${table}`);
                }

                // 2. Sync to Zustand Store
                this.updateStoreEntity(table, newItem);
                console.log(`[SupabaseRealtime] Updated Store: ${table}`);

                // 3. UI Feedback
                if (eventType === 'INSERT') {
                    store.addNotification({
                        id: `cloud-notif-${Date.now()}`,
                        title: 'Atualização da Quinta',
                        message: `Novo registo em ${table} adicionado remotamente.`,
                        type: 'info',
                        timestamp: new Date().toISOString(),
                        read: false
                    });
                    haptics.success();
                }
            }

            if (eventType === 'DELETE') {
                const dexieTable = (db as any)[table];
                if (dexieTable) {
                    await dexieTable.delete(oldItem.id);
                }
                this.removeFromStore(table, oldItem.id);
            }
        } catch (err) {
            console.error('[SupabaseRealtime] Error handling change:', err);
        }
    }

    private updateStoreEntity(table: string, item: any) {
        const set = useStore.setState;

        const mapping: Record<string, string> = {
            'animals': 'animals',
            'fields': 'fields',
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

        const storeKey = mapping[table];
        if (!storeKey) return;

        set((state: any) => {
            const list = state[storeKey];
            if (!Array.isArray(list)) return state;

            const exists = list.some((i: any) => i.id === item.id);
            if (exists) {
                return {
                    [storeKey]: list.map((i: any) => i.id === item.id ? { ...i, ...item } : i)
                };
            } else {
                return {
                    [storeKey]: [item, ...list]
                };
            }
        });
    }

    private removeFromStore(table: string, id: string) {
        const mapping: Record<string, string> = {
            'animals': 'animals',
            'fields': 'fields',
            'stocks': 'stocks',
            'machines': 'machines',
            'tasks': 'tasks',
            'users': 'users',
            'feed': 'feedItems',
            'transactions': 'transactions'
        };

        const storeKey = mapping[table];
        if (!storeKey) return;

        useStore.setState((state: any) => ({
            [storeKey]: state[storeKey].filter((i: any) => i.id !== id)
        }));
    }

    public stop() {
        if (this.channel) {
            supabase.removeChannel(this.channel);
            this.channel = null;
        }
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
}

export const supabaseRealtime = SupabaseRealtime.getInstance();
