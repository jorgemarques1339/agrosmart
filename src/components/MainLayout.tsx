import React from 'react';
import { Outlet } from 'react-router-dom';

import { useStore } from '../store/useStore';
import { useAppSync } from '../hooks/useAppSync';
import { useIoTManager } from '../hooks/useIoTManager';

// Layout Components
import { SyncBanner } from './SyncBanner';
import { BottomNavigation } from './BottomNavigation';
import { GlobalModals } from './GlobalModals';

// Services & Global UI
import VoiceAssistant from './VoiceAssistant';
import InstallPrompt from './InstallPrompt';
import LoneWorkerMonitor from '../features/team/LoneWorkerMonitor';
import GeofencingService from './GeofencingService';
import { ConflictDiscoveryModal } from './ConflictDiscoveryModal';
import { AutoPilotService } from '../features/machines/AutoPilotService';
import AppSkeleton from './AppSkeleton';

export const MainLayout = () => {
    const isDarkMode = useStore(state => state.isDarkMode);
    const isSolarMode = useStore(state => state.isSolarMode);

    // For padding of the main content area
    const { syncQueueCount } = useAppSync();

    // Voice Assistant dependency
    const { handleVoiceCommand } = useIoTManager();

    return (
        <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} ${isSolarMode ? 'theme-solar' : ''} bg-gray-50 dark:bg-black transition-all duration-500 overflow-x-hidden`}>
            {/* Top Banner for Offline / Syncing Status */}
            <SyncBanner />

            {/* Main Content Area */}
            <main className={`flex-1 overflow-y-auto scrollbar-hide w-full max-w-md md:max-w-5xl mx-auto relative px-4 md:px-8 pb-32 ${syncQueueCount > 0 ? 'pt-10' : 'pt-4'} transition-all duration-300`}>
                <React.Suspense fallback={<AppSkeleton />}>
                    <Outlet />
                </React.Suspense>
            </main>

            {/* Voice Assistant */}
            <VoiceAssistant onCommand={handleVoiceCommand} />

            {/* Bottom Navigation */}
            <BottomNavigation />

            {/* Global Modals */}
            <GlobalModals />

            {/* Background Services & Prompts */}
            <AutoPilotService />
            <InstallPrompt />
            <LoneWorkerMonitor />
            <GeofencingService />
            <ConflictDiscoveryModal />
        </div>
    );
};
