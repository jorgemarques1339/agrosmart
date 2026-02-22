import { StateCreator } from 'zustand';
import { AppState } from '../useStore';
import { UserProfile } from '../../types';
import { db } from '../../services/db';
import { syncManager } from '../../services/SyncManager';

export interface AuthSlice {
    isAuthenticated: boolean;
    currentUserId: string;
    users: UserProfile[];
    setUsers: (users: UserProfile[]) => void;
    login: (username: string, pass: string) => Promise<boolean>;
    logout: () => void;
    setCurrentUserId: (id: string) => void;
    addUser: (user: UserProfile) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    updateUser: (id: string, updates: Partial<UserProfile>) => Promise<void>;
}

export const createAuthSlice: StateCreator<AppState, [], [], AuthSlice> = (set, get) => ({
    isAuthenticated: localStorage.getItem('oriva_auth_state') === 'true',
    currentUserId: localStorage.getItem('oriva_current_user') || 'guest',
    users: [],

    setUsers: (users) => set({ users }),

    login: async (username, pass) => {
        const { users } = get();
        const user = users.find(u => u.username === username && u.password === pass);
        if (user) {
            localStorage.setItem('oriva_auth_state', 'true');
            localStorage.setItem('oriva_current_user', user.id);
            set({ isAuthenticated: true, currentUserId: user.id });
            return true;
        }
        return false;
    },

    logout: () => {
        localStorage.removeItem('oriva_auth_state');
        localStorage.removeItem('oriva_current_user');
        set({ isAuthenticated: false, currentUserId: 'guest' });
    },

    setCurrentUserId: (id) => {
        localStorage.setItem('oriva_current_user', id);
        set({ currentUserId: id });
    },

    addUser: async (user) => {
        await db.users.add(user);
        syncManager.addToQueue('ADD_USER', user);
        set(state => ({ users: [...state.users, user] }));
    },

    deleteUser: async (id) => {
        await db.users.delete(id);
        syncManager.addToQueue('DELETE_USER', id);
        set(state => ({ users: state.users.filter(u => u.id !== id) }));
    },

    updateUser: async (id, updates) => {
        await db.users.update(id, updates);
        const fullUser = await db.users.get(id);
        if (fullUser) {
            syncManager.addToQueue('UPDATE_USER', fullUser);
            set(state => ({
                users: state.users.map(u => u.id === id ? fullUser : u)
            }));
        }
    },
});
