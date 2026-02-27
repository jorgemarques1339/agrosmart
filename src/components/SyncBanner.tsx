import React from 'react';
import { Loader2 } from 'lucide-react';
import { useAppSync } from '../hooks/useAppSync';

export const SyncBanner: React.FC = () => {
    const { syncQueueCount } = useAppSync();

    if (syncQueueCount === 0) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-orange-500 text-white py-1 px-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 animate-slide-down">
            <Loader2 size={12} className="animate-spin" />
            A sincronizar alterações ({syncQueueCount} pendentes)
        </div>
    );
};
