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

        this.channel = supabase
            .channel('farm-realtime')
            .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
                this.handleCloudChange(payload);
            })
            .subscribe();

        console.log('Supabase Realtime listeners active.');
    }

    private async handleCloudChange(payload: any) {
        const { table, eventType, old: oldItem } = payload;
        // Convert incoming snake_case data to camelCase for the app
        const newItem = this.toCamelCase(payload.new);
        const store = useStore.getState();

        console.log(`Cloud Event: ${eventType} on ${table}`, newItem);

        try {
            if (eventType === 'INSERT' || eventType === 'UPDATE') {
                // 1. Sync to IndexDB
                const dexieTable = (db as any)[table];
                if (dexieTable) {
                    await dexieTable.put(newItem);
                }

                // 2. Sync to Zustand Store
                this.updateStoreEntity(table, newItem);

                // 3. UI Feedback
                if (eventType === 'INSERT') {
                    store.addNotification({
                        id: `cloud-notif-${Date.now()}`,
                        title: 'Atualização da Quinta',
                        message: `Novo registo em ${table} adicionado por outro utilizador.`,
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
            console.error('Error handling cloud change:', err);
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
