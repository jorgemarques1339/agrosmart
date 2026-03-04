
import { create } from 'zustand';
import { db } from '../services/db';
import { syncManager } from '../services/SyncManager';
import {
    Field, StockItem, Animal, Machine, Transaction, Task,
    UserProfile, Notification, AnimalBatch, FeedItem, ProductBatch, FieldLog, Sensor, MaintenanceLog,
    WeatherForecast, DetailedForecast
} from '../types';

import { hydrateStore } from './hydration';

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
        registerTemporaryWorker: (name: string, phone: string, dailyRate: number, hoursWorked?: number, fieldId?: string, cropName?: string) => Promise<void>;
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

    registerTemporaryWorker: async (
        name: string,
        phone: string,
        dailyRate: number,
        hoursWorked?: number,
        fieldId?: string,
        cropName?: string
    ) => {
        const today = new Date().toISOString().split('T')[0];
        const tempWorkerTx = {
            id: `tx-temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'expense' as const,
            amount: dailyRate,
            category: 'Salários',
            description: `Mão-de-Obra Sazonal: ${name} (${phone})${cropName ? ` — ${cropName}` : ''}${hoursWorked ? ` — ${hoursWorked.toFixed(1)}h` : ''}`,
            date: today,
            relatedCrop: cropName || 'Sazonal',
            relatedId: fieldId,
        };

        await db.transactions.add(tempWorkerTx);

        const set = a[0];
        const get = a[1] as any;
        set((state: any) => ({
            transactions: [tempWorkerTx, ...state.transactions],
        }));

        // If a specific field was selected, write a FieldLog diary entry
        if (fieldId && hoursWorked !== undefined) {
            const HOURLY_RATE = 7.50;
            const log = {
                id: `log-labor-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                date: today,
                type: 'labor' as const,
                description: `Mão-de-obra sazonal: ${name} (${phone})`,
                operator: name,
                hoursWorked: parseFloat(hoursWorked.toFixed(2)),
                hourlyRate: HOURLY_RATE,
                cost: dailyRate,
            };
            // Use the addLogToField action from fieldSlice (already in the store)
            await get().addLogToField(fieldId, log);
        }
    },

    hydrate: async () => {
        const set = a[0];
        const get = a[1] as any;
        await hydrateStore(set, get);
    },
}));
