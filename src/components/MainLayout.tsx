import React, { useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Sprout, PawPrint, Package,
    Tractor, Wallet, Truck, FileCheck, Loader2
} from 'lucide-react';

import { useStore, isAnyModalOpen } from '../store/useStore';
import { useUIPreferences } from '../hooks/useUIPreferences';
import { useExportHandlers } from '../hooks/useExportHandlers';
import { useIoTManager } from '../hooks/useIoTManager';
import { useAppSync } from '../hooks/useAppSync';
import { useFarmOperations } from '../hooks/useFarmOperations';
import { UserProfile } from '../types';
import { haptics } from '../utils/haptics';

// Components
import SettingsModal from './SettingsModal';
import NotificationsModal from './NotificationsModal';
import OmniSearch from './OmniSearch';
import { NotificationCenter } from './NotificationCenter';
import FieldFeed from './FieldFeed';
import TeamManager from './TeamManager';
import TaskProofModal from './TaskProofModal';
import TraceabilityModal from './TraceabilityModal';
import IoTPairingWizard from './IoTPairingWizard';
import VoiceAssistant from './VoiceAssistant';
import InstallPrompt from './InstallPrompt';
import LoneWorkerMonitor from './LoneWorkerMonitor';
import GeofencingService from './GeofencingService';
import { ConflictDiscoveryModal } from './ConflictDiscoveryModal';
import { AutoPilotService } from './AutoPilotService';
import AppSkeleton from './AppSkeleton';

export const MainLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Active tab based on current path
    const activeTab = location.pathname === '/' ? 'dashboard'
        : location.pathname.substring(1);

    const {
        fields, animals, machines, tasks, notifications, users,
        isDarkMode, isSolarMode, weatherData, currentUserId,
        setDarkMode, setSolarMode, setCurrentUserId,
        addUser, deleteUser,
        ui, openModal, closeModal, markNotificationRead,
        syncStatus, lastSyncTime, resetAllData, stocks
    } = useStore();

    const isAnyModalOpenValue = useStore(isAnyModalOpen);
    const { syncQueueCount } = useAppSync();
    const { generateGuidePDF } = useExportHandlers();
    const { handleRegisterSensor, handleVoiceCommand } = useIoTManager();

    const currentUser = useMemo(() => {
        if (!users) return { id: 'guest', name: 'Convidado', role: 'operator', avatar: 'C' } as UserProfile;
        return users.find(u => u && u.id === currentUserId) || { id: 'guest', name: 'Convidado', role: 'operator', avatar: 'C' } as UserProfile;
    }, [users, currentUserId]);

    const { handleSubmitProof, handleReviewTask } = useFarmOperations(currentUser.name);

    return (
        <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} ${isSolarMode ? 'theme-solar' : ''} bg-gray-50 dark:bg-black transition-all duration-500 overflow-x-hidden`}>
            {/* Top Banner for Offline / Syncing Status */}
            {(syncQueueCount > 0) && (
                <div className="fixed top-0 left-0 right-0 z-[100] bg-orange-500 text-white py-1 px-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 animate-slide-down">
                    <Loader2 size={12} className="animate-spin" />
                    A sincronizar alterações ({syncQueueCount} pendentes)
                </div>
            )}

            {/* Main Content Area */}
            <main className={`flex-1 overflow-y-auto scrollbar-hide w-full max-w-md md:max-w-5xl mx-auto relative px-4 md:px-8 pb-32 ${syncQueueCount > 0 ? 'pt-10' : 'pt-4'} transition-all duration-300`}>
                <React.Suspense fallback={<AppSkeleton />}>
                    <Outlet />
                </React.Suspense>
            </main>

            {/* Voice Assistant */}
            <VoiceAssistant onCommand={handleVoiceCommand} />

            {/* Bottom Navigation */}
            <nav className={`fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-neutral-900/90 border border-gray-100 dark:border-neutral-800 shadow-2xl rounded-[2.5rem] px-2 py-3 flex items-end justify-center gap-2 z-40 w-[96%] max-w-sm md:max-w-md mx-auto backdrop-blur-md transition-all duration-300 ease-in-out ${isAnyModalOpenValue ? 'translate-y-[200%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
                {[
                    { id: 'dashboard', icon: LayoutDashboard, label: 'Home', path: '/' },
                    { id: 'cultivation', icon: Sprout, label: 'Cultivo', path: '/cultivation' },
                    { id: 'animal', icon: PawPrint, label: 'Animais', path: '/animal' },
                    { id: 'stocks', icon: Package, label: 'Stock', path: '/stocks' },
                    { id: 'machines', icon: Tractor, label: 'Frota', path: '/machines' },
                    { id: 'finance', icon: Wallet, label: 'Finanças', path: '/finance' },
                ].filter(tab => {
                    const role = currentUser.role;
                    if (role === 'admin') return true;
                    if (tab.id === 'dashboard') return true;
                    if (tab.id === 'finance') return false;

                    const specialty = currentUser.specialty?.toLowerCase() || '';
                    if (tab.id === 'animal' && (role === 'vet' || specialty.includes('anim'))) return true;
                    if (tab.id === 'machines' && (role === 'mechanic' || specialty.includes('mecan'))) return true;
                    if (['cultivation', 'stocks'].includes(tab.id) && (role === 'farmer' || specialty.includes('agric'))) return true;

                    return false;
                }).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { haptics.light(); navigate(tab.path); }}
                        className={`transition-all duration-300 flex flex-col items-center justify-center rounded-2xl relative ${activeTab === tab.id
                            ? 'bg-agro-green text-white shadow-lg shadow-agro-green/30 -translate-y-2 py-2 px-3 min-w-[56px] mb-1'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-transparent p-2 mb-1'
                            }`}
                    >
                        <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                        {activeTab === tab.id && (
                            <span className="text-[9px] font-bold mt-1 animate-fade-in whitespace-nowrap leading-none">
                                {tab.label}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            {/* Global Modals */}
            <SettingsModal
                isOpen={ui.modals.settings}
                onClose={() => closeModal('settings')}
                onResetData={() => resetAllData()}
                currentName={currentUser.name}
                onSaveName={(name) => {
                    // Update User Profile would go here in proper flow, for now handled by direct store call in hook
                    haptics.success();
                }}
                isDarkMode={isDarkMode}
                onToggleDarkMode={() => setDarkMode(!isDarkMode)}
                isSolarMode={isSolarMode}
                onToggleSolarMode={() => setSolarMode(!isSolarMode)}
                syncStatus={syncStatus}
                lastSyncTime={lastSyncTime}
            />

            <OmniSearch
                isOpen={ui.modals.omniSearch}
                onClose={() => closeModal('omniSearch')}
                fields={fields}
                animals={animals}
                machines={machines}
                tasks={tasks}
                onNavigate={(tab) => {
                    navigate(tab === 'dashboard' ? '/' : `/${tab}`);
                    closeModal('omniSearch');
                }}
            />

            <NotificationsModal
                isOpen={ui.modals.notifications}
                onClose={() => closeModal('notifications')}
                weather={weatherData}
                animals={animals}
                fields={fields}
                stocks={stocks}
                machines={machines}
                onNavigate={(tab) => navigate(tab === 'dashboard' ? '/' : `/${tab}`)}
            />

            <NotificationCenter
                isOpen={ui.modals.notificationCenter}
                onClose={() => closeModal('notificationCenter')}
                notifications={notifications}
                onMarkAsRead={markNotificationRead}
                onMarkAllAsRead={() => notifications.forEach(n => markNotificationRead(n.id))}
                onClearHistory={() => { }}
                onNavigate={(path) => navigate(path === 'dashboard' ? '/' : `/${path}`)}
            />

            {ui.modals.fieldFeed && (
                <FieldFeed
                    onClose={() => closeModal('fieldFeed')}
                />
            )}

            {ui.modals.teamManager && (
                <TeamManager
                    onClose={() => closeModal('teamManager')}
                    users={users}
                    currentUser={currentUser}
                    onAddUser={addUser}
                    onDeleteUser={deleteUser}
                    onSwitchUser={(id) => {
                        setCurrentUserId(id);
                        closeModal('teamManager');
                        navigate('/');
                    }}
                />
            )}

            {ui.modals.taskProof && (
                <TaskProofModal
                    isOpen={true}
                    task={ui.modals.taskProof}
                    onClose={() => closeModal('taskProof')}
                    onSubmitProof={handleSubmitProof}
                    onReviewTask={handleReviewTask}
                    currentUser={currentUser}
                />
            )}

            {ui.modals.traceability && (
                <TraceabilityModal
                    isOpen={true}
                    batch={ui.modals.traceability}
                    onClose={() => closeModal('traceability')}
                />
            )}

            {ui.modals.guide && (
                <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => closeModal('guide')}>
                    <div className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="p-8 border-b dark:border-neutral-800">
                            <div className="w-16 h-16 bg-agro-green/10 rounded-2xl flex items-center justify-center mb-6">
                                <Truck className="text-agro-green" size={32} />
                            </div>
                            <h3 className="text-2xl font-black dark:text-white leading-tight">Guia de Transporte</h3>
                            <p className="text-gray-500 text-sm mt-2">Pronto para gerar o documento PDF de expedição.</p>
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl">
                                <FileCheck className="text-agro-green" size={20} />
                                <div className="flex-1">
                                    <p className="text-[10px] uppercase font-black text-gray-400">Cliente</p>
                                    <p className="text-sm font-bold dark:text-white">{ui.modals.guideData?.clientName || 'Consumidor Final'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 pt-0 flex gap-3">
                            <button
                                onClick={() => closeModal('guide')}
                                className="flex-1 py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={generateGuidePDF}
                                className="flex-1 py-4 bg-agro-green text-white rounded-2xl font-black shadow-lg shadow-agro-green/30 hover:scale-105 active:scale-95 transition-all"
                            >
                                GERAR PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {ui.modals.iotWizard && (
                <IoTPairingWizard
                    onClose={() => closeModal('iotWizard')}
                    fields={fields}
                    onPair={handleRegisterSensor}
                />
            )}

            <AutoPilotService />
            <InstallPrompt />
            <LoneWorkerMonitor />
            <GeofencingService />
            <ConflictDiscoveryModal />
        </div>
    );
};
