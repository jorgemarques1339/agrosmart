import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStore } from '../useStore';
import { syncManager } from '../../services/SyncManager';
import { db } from '../../services/db';

vi.mock('../../services/db', () => ({
    db: {
        stocks: {
            add: vi.fn(),
            delete: vi.fn(),
            update: vi.fn(),
            get: vi.fn().mockImplementation((id) => Promise.resolve({ id, name: 'Mocked Full Stock', quantity: 50 })),
        },
    }
}));

vi.mock('../../services/SyncManager', () => ({
    syncManager: {
        addToQueue: vi.fn(),
    }
}));

describe('inventorySlice', () => {
    beforeEach(() => {
        useStore.setState({ stocks: [], harvests: [], transactions: [] });
        vi.clearAllMocks();
    });

    it('should add new stock properly', async () => {
        const mockStock: any = { id: 's1', name: 'Alimento', quantity: 100 };

        await useStore.getState().addStock(mockStock);

        expect(db.stocks.add).toHaveBeenCalledWith(mockStock);
        expect(syncManager.addToQueue).toHaveBeenCalledWith('ADD_STOCK', mockStock);
        expect(useStore.getState().stocks).toHaveLength(1);
        expect(useStore.getState().stocks[0]).toEqual(mockStock);
    });

    it('should update stock properly', async () => {
        const initialStock: any = { id: 's1', name: 'Alimento', quantity: 100 };
        useStore.setState({ stocks: [initialStock] });

        await useStore.getState().updateStock('s1', { quantity: 50 });

        expect(db.stocks.update).toHaveBeenCalledWith('s1', { quantity: 50 });
        expect(syncManager.addToQueue).toHaveBeenCalledWith('UPDATE_STOCK', expect.objectContaining({ quantity: 50 }));
        expect(useStore.getState().stocks[0].quantity).toBe(50);
    });

    it('should delete stock properly', async () => {
        const initialStock: any = { id: 's1', name: 'Alimento', quantity: 100 };
        useStore.setState({ stocks: [initialStock] });

        await useStore.getState().deleteStock('s1');

        expect(db.stocks.delete).toHaveBeenCalledWith('s1');
        expect(syncManager.addToQueue).toHaveBeenCalledWith('DELETE_STOCK', 's1');
        expect(useStore.getState().stocks).toHaveLength(0);
    });
});
