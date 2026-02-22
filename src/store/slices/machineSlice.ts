import { StateCreator } from 'zustand';
import { AppState } from '../useStore';
import { db } from '../../services/db';
import { syncManager } from '../../services/SyncManager';
import { Machine } from '../../types';

export interface MachineSlice {
    machines: Machine[];
    setMachines: (machines: Machine[]) => void;
    addMachine: (machine: Machine) => Promise<void>;
    updateMachine: (id: string, updates: Partial<Machine>) => Promise<void>;
}

export const createMachineSlice: StateCreator<AppState, [], [], MachineSlice> = (set, get) => ({
    machines: [],

    setMachines: (machines) => set({ machines }),

    addMachine: async (machine) => {
        await db.machines.add(machine);
        syncManager.addToQueue('ADD_MACHINE', machine);
        set(state => ({ machines: [...state.machines, machine] }));
    },

    updateMachine: async (id, updates) => {
        await db.machines.update(id, updates);
        const fullMachine = await db.machines.get(id);
        if (fullMachine) {
            syncManager.addToQueue('UPDATE_MACHINE', fullMachine);
            set(state => ({
                machines: state.machines.map(m => m.id === id ? fullMachine : m)
            }));
        }
    },
});
