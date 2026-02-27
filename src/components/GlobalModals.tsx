import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, FileCheck } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useExportHandlers } from '../hooks/useExportHandlers';
import { useIoTManager } from '../hooks/useIoTManager';
import { useFarmOperations } from '../hooks/useFarmOperations';
import { UserProfile } from '../types';
import { haptics } from '../utils/haptics';

import SettingsModal from './SettingsModal';
import NotificationsModal from './NotificationsModal';
import OmniSearch from './OmniSearch';
import { NotificationCenter } from './NotificationCenter';
import FieldFeed from './FieldFeed';
import TeamManager from '../features/team/TeamManager';
import TaskProofModal from '../features/traceability/TaskProofModal';
import TraceabilityModal from '../features/traceability/TraceabilityModal';
import IoTPairingWizard from './IoTPairingWizard';

export const GlobalModals: React.FC = () => {
    const navigate = useNavigate();

    const fields = useStore(state => state.fields);
    const animals = useStore(state => state.animals);
    const machines = useStore(state => state.machines);
    const tasks = useStore(state => state.tasks);
    const notifications = useStore(state => state.notifications);
    const users = useStore(state => state.users);
    const isDarkMode = useStore(state => state.isDarkMode);
    const isSolarMode = useStore(state => state.isSolarMode);
    const weatherData = useStore(state => state.weatherData);
    const currentUserId = useStore(state => state.currentUserId);
    const setDarkMode = useStore(state => state.setDarkMode);
    const setSolarMode = useStore(state => state.setSolarMode);
    const setCurrentUserId = useStore(state => state.setCurrentUserId);
    const addUser = useStore(state => state.addUser);
    const deleteUser = useStore(state => state.deleteUser);
    const ui = useStore(state => state.ui);
    const closeModal = useStore(state => state.closeModal);
    const markNotificationRead = useStore(state => state.markNotificationRead);
    const syncStatus = useStore(state => state.syncStatus);
    const lastSyncTime = useStore(state => state.lastSyncTime);
    const resetAllData = useStore(state => state.resetAllData);
    const stocks = useStore(state => state.stocks);

    const { generateGuidePDF } = useExportHandlers();
    const { handleRegisterSensor } = useIoTManager();

    const currentUser = useMemo(() => {
        if (!users) return { id: 'guest', name: 'Convidado', role: 'operator', avatar: 'C' } as UserProfile;
        return users.find(u => u && u.id === currentUserId) || { id: 'guest', name: 'Convidado', role: 'operator', avatar: 'C' } as UserProfile;
    }, [users, currentUserId]);

    const { handleSubmitProof, handleReviewTask } = useFarmOperations(currentUser.name);

    return (
        <>
            <SettingsModal
                isOpen={ui.modals.settings}
                onClose={() => closeModal('settings')}
                onResetData={() => resetAllData()}
                currentName={currentUser.name}
                onSaveName={(name) => {
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
        </>
    );
};
