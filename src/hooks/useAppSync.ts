import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { supabaseRealtime } from '../services/SupabaseRealtime';
import { syncManager } from '../services/SyncManager';
import { iotManager } from '../services/IoTManager';

export const useAppSync = () => {
    const { isHydrated, hydrate, setOnline } = useStore();
    const [syncQueueCount, setSyncQueueCount] = useState(0);

    useEffect(() => {
        hydrate();
    }, [hydrate]);

    useEffect(() => {
        // Initialize Cloud Sync & IoT Listeners
        supabaseRealtime.init();
        syncManager.processQueue();
        iotManager.init();

        const handleOnline = () => setOnline(true);
        const handleOffline = () => setOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            supabaseRealtime.stop();
            iotManager.stop();
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [setOnline]);

    // Monitor Sync Queue
    useEffect(() => {
        const interval = setInterval(async () => {
            const { db } = await import('../services/db');
            const count = await db.syncQueue.count();
            setSyncQueueCount(count);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return {
        isHydrated,
        syncQueueCount
    };
};
