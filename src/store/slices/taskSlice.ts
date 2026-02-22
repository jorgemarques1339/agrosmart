import { StateCreator } from 'zustand';
import { AppState } from '../useStore';
import { db } from '../../services/db';
import { syncManager } from '../../services/SyncManager';
import { Task } from '../../types';

export interface TaskSlice {
    tasks: Task[];
    setTasks: (tasks: Task[]) => void;
    addTask: (task: Task) => Promise<void>;
    updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
}

export const createTaskSlice: StateCreator<AppState, [], [], TaskSlice> = (set, get) => ({
    tasks: [],

    setTasks: (tasks) => set({ tasks }),

    addTask: async (task) => {
        await db.tasks.add(task);
        syncManager.addToQueue('ADD_TASK', task);
        set(state => ({ tasks: [...state.tasks, task] }));
    },

    updateTask: async (id, updates) => {
        await db.tasks.update(id, updates);
        const fullTask = await db.tasks.get(id);
        if (fullTask) {
            syncManager.addToQueue('UPDATE_TASK', fullTask);
            set(state => ({
                tasks: state.tasks.map(t => t.id === id ? fullTask : t)
            }));
        }
    },

    deleteTask: async (id) => {
        await db.tasks.delete(id);
        syncManager.addToQueue('DELETE_TASK', id);
        set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
    },
});
