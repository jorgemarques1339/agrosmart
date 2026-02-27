import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStore } from '../useStore';

vi.mock('../../services/db', () => ({
    db: {
        users: {
            add: vi.fn(),
            delete: vi.fn(),
            update: vi.fn(),
            get: vi.fn(),
        },
        sessions: {
            put: vi.fn(),
            delete: vi.fn(),
        }
    }
}));

vi.mock('../../services/SyncManager', () => ({
    syncManager: {
        addToQueue: vi.fn(),
    }
}));

vi.mock('../../utils/haptics', () => ({
    haptics: {
        success: vi.fn(),
    }
}));

vi.mock('../../utils/confetti', () => ({
    triggerSessionCompleteConfetti: vi.fn(),
}));

describe('authSlice', () => {
    beforeEach(() => {
        // Reset store before each test
        useStore.setState({
            isAuthenticated: false,
            currentUserId: 'guest',
            users: [],
            activeSession: null
        });
        window.localStorage.clear();
        vi.clearAllMocks();
    });

    it('should authenticate a valid user', async () => {
        const mockUser: any = { id: 'u1', username: 'john', password: '123' };
        useStore.setState({ users: [mockUser] });

        const result = await useStore.getState().login('john', '123');

        expect(result).toBe(true);
        expect(useStore.getState().isAuthenticated).toBe(true);
        expect(useStore.getState().currentUserId).toBe('u1');
        expect(window.localStorage.getItem('oriva_auth_state')).toBe('true');
    });

    it('should not authenticate invalid user', async () => {
        const mockUser: any = { id: 'u1', username: 'john', password: '123' };
        useStore.setState({ users: [mockUser] });

        const result = await useStore.getState().login('john', 'wrong');

        expect(result).toBe(false);
        expect(useStore.getState().isAuthenticated).toBe(false);
    });

    it('should successfully logout', () => {
        window.localStorage.setItem('oriva_auth_state', 'true');
        useStore.setState({ isAuthenticated: true, currentUserId: 'u1' });

        useStore.getState().logout();

        expect(useStore.getState().isAuthenticated).toBe(false);
        expect(useStore.getState().currentUserId).toBe('guest');
        expect(window.localStorage.getItem('oriva_auth_state')).toBeNull();
    });
});
