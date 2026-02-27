import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SyncManager } from '../SyncManager';

// Define mocks before importing the modules that use them
const mockStore = {
    setSyncStatus: vi.fn(),
    setOnline: vi.fn(),
    addConflict: vi.fn()
};

vi.mock('../db', () => ({
    db: {
        syncQueue: {
            add: vi.fn(),
            toArray: vi.fn().mockResolvedValue([]),
            update: vi.fn(),
            delete: vi.fn(),
            filter: vi.fn().mockReturnThis(),
        }
    }
}));

vi.mock('../../utils/haptics', () => ({
    haptics: {
        warning: vi.fn(),
        success: vi.fn(),
        error: vi.fn(),
    }
}));

vi.mock('../../utils/sounds', () => ({
    sounds: {
        playSwoosh: vi.fn(),
    }
}));

vi.mock('../../store/useStore', () => ({
    useStore: {
        getState: vi.fn(() => mockStore)
    }
}));

// Mock comlink to prevent issues with Web Workers in jsdom
vi.mock('comlink', () => ({
    wrap: vi.fn(),
    proxy: vi.fn(),
}));

// Mock Supabase to avoid real network attempts
vi.mock('../supabaseClient', () => ({
    supabase: {
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: [], error: null }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
            delete: vi.fn().mockResolvedValue({ error: null }),
        })
    }
}));

describe('SyncManager', () => {
    let originalOnline: boolean;
    let syncManager: any;

    beforeEach(() => {
        vi.clearAllMocks();
        originalOnline = navigator.onLine;
        syncManager = (SyncManager as any).getInstance();
    });

    afterEach(() => {
        Object.defineProperty(navigator, 'onLine', { value: originalOnline, configurable: true });
    });

    it('adds item to queue and sets status to offline when disconnected', async () => {
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

        // Dinamic import is necessary to access mocked db here
        const { db } = await import('../db');

        await syncManager.addToQueue('ADD_TASK', { id: 1, title: 'Test Task' });

        expect(db.syncQueue.add).toHaveBeenCalledWith(expect.objectContaining({
            operation: 'ADD_TASK',
            data: { id: 1, title: 'Test Task' },
            status: 'pending'
        }));

        expect(mockStore.setSyncStatus).toHaveBeenCalledWith('offline');
    });

    it('triggers processQueue when online', async () => {
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

        const processQueueSpy = vi.spyOn(syncManager, 'processQueue').mockResolvedValue(undefined);

        await syncManager.addToQueue('ADD_TASK', { id: 2, title: 'Online Task' });

        expect(processQueueSpy).toHaveBeenCalled();
    });
});
