import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Sprout, PawPrint, Package,
  Tractor, Wallet, Bell, X,
  FileCheck, Loader2,
  Truck, Users, Lock
} from 'lucide-react';
import { useStore, isAnyModalOpen } from './store/useStore';
import { useWeatherSync } from './hooks/useWeatherSync';
import { useAppSync } from './hooks/useAppSync';
import { useUIPreferences } from './hooks/useUIPreferences';
import { useExportHandlers } from './hooks/useExportHandlers';
import { useFarmOperations } from './hooks/useFarmOperations';
import { useIoTManager } from './hooks/useIoTManager';
import { UserProfile, MaintenanceLog, Machine } from './types';

import DashboardHome from './components/DashboardHome';
import AnimalCard from './components/AnimalCard';
import StockManager from './components/StockManager';
import MachineManager from './components/MachineManager';
import FinanceManager from './components/FinanceManager';
import SettingsModal from './components/SettingsModal';
import NotificationsModal from './components/NotificationsModal';
import InstallPrompt from './components/InstallPrompt';
import VoiceAssistant from './components/VoiceAssistant';
import TraceabilityModal from './components/TraceabilityModal';
import PublicProductPage from './components/PublicProductPage';
import TeamManager from './components/TeamManager';
import FieldFeed from './components/FieldFeed';
import TaskProofModal from './components/TaskProofModal';
import { NotificationCenter } from './components/NotificationCenter';
import LoneWorkerMonitor from './components/LoneWorkerMonitor';
import IoTPairingWizard from './components/IoTPairingWizard';
import CultivationView from './components/CultivationView';
import CarbonDashboard from './components/CarbonDashboard';
import OmniSearch from './components/OmniSearch';
import { ConflictDiscoveryModal } from './components/ConflictDiscoveryModal';
import { haptics } from './utils/haptics';
import { Login } from './components/Login';
import AppSkeleton from './components/AppSkeleton';

/**
 * Internal helper component for restricted access sections.
 */
const AccessDenied = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-neutral-800 rounded-[2.5rem] mt-8 animate-fade-in shadow-sm border border-gray-100 dark:border-neutral-700/50">
    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
      <Lock className="text-red-500" size={40} strokeWidth={1.5} />
    </div>
    <h3 className="text-2xl font-black dark:text-white mb-3 tracking-tight">{title}</h3>
    <p className="text-gray-500 dark:text-neutral-400 text-sm max-w-xs leading-relaxed font-medium">
      Apenas administradores têm permissão para aceder a esta secção. Contacte o gestor da exploração se necessitar de acesso.
    </p>
  </div>
);

const App = () => {
  const {
    fields, stocks, animals, machines, transactions, tasks, notifications, users, harvests,
    activeTab, isDarkMode, isSolarMode, weatherData, detailedForecast, currentUserId, isAuthenticated,
    setActiveTab, setDarkMode, setSolarMode, setCurrentUserId,
    addField, deleteField,
    addStock, updateStock, deleteStock,
    addAnimal, updateAnimal, addProduction,
    addAnimalBatch, updateAnimalBatch, applyBatchAction,
    addMachine, updateMachine,
    addTask, updateTask, deleteTask,
    updateUser, addUser, deleteUser,
    addTransaction, addNotification,
    toggleIrrigation, addLogToField,
    animalBatches, feedItems, hasUnreadFeed,
    ui, openModal, closeModal, markNotificationRead, addFeedItem,
    syncStatus, lastSyncTime, resetAllData
  } = useStore();

  const isAnyModalOpenValue = useStore(isAnyModalOpen);

  // --- CUSTOM HOOKS (Business Logic Abstraction) ---
  const { isHydrated, syncQueueCount } = useAppSync();
  const { setDarkMode: toggleDarkMode, setSolarMode: toggleSolarMode } = useUIPreferences();
  const { generateGuidePDF } = useExportHandlers();
  useWeatherSync();

  const currentUser = useMemo(() => {
    return users?.find(u => u.id === currentUserId) || { id: 'guest', name: 'Convidado', role: 'operator', avatar: 'C' } as UserProfile;
  }, [users, currentUserId]);

  const {
    handleAddTask, handleSubmitProof, handleReviewTask,
    handleRegisterSale, handleHarvest
  } = useFarmOperations(currentUser.name);

  const { handleVoiceCommand, handleRegisterSensor } = useIoTManager();

  // --- PUBLIC VIEW LOGIC (QR Code Traceability) ---
  const [viewMode, setViewMode] = useState<'app' | 'public'>('app');
  const [publicBatchId, setPublicBatchId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const batchId = params.get('batch');
    if (batchId) {
      setViewMode('public');
      setPublicBatchId(batchId);
    }
  }, []);

  const alertCount = useMemo(() => {
    let count = 0;
    if (weatherData.length > 0 && (weatherData[0].condition === 'rain' || weatherData[0].condition === 'storm')) count++;
    count += animals.filter(a => a.status === 'sick').length;
    count += fields.filter(f => f.humidity < 30 || f.healthScore < 70).length;
    count += stocks.filter(s => s.quantity <= s.minStock).length;
    return count;
  }, [weatherData, animals, fields, stocks]);

  // Render Public Page if requested
  if (viewMode === 'public' && publicBatchId) {
    return <PublicProductPage batchId={publicBatchId} />;
  }

  // Render Auth if not logged in
  if (!isAuthenticated) {
    return <Login />;
  }

  // Render Loader if data is not ready
  if (!isHydrated) {
    return <AppSkeleton />;
  }

  const { modals } = ui;

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
        {activeTab === 'dashboard' && (
          <DashboardHome
            userName={currentUser.name}
            weather={weatherData}
            hourlyForecast={detailedForecast}
            tasks={tasks}
            fields={fields}
            machines={machines}
            stocks={stocks}
            users={users}
            currentUser={currentUser}
            animals={animals}
            feedItems={feedItems}
            hasUnreadFeed={hasUnreadFeed}
            syncStatus={syncStatus}
            lastSyncTime={lastSyncTime}
            alertCount={alertCount}
            onToggleTask={(id) => updateTask(id, { completed: !tasks.find(t => t.id === id)?.completed })}
            onAddTask={handleAddTask}
            onDeleteTask={deleteTask}
            onWeatherClick={() => openModal('notifications')}
            onOpenSettings={() => openModal('settings')}
            onOpenNotifications={() => openModal('notificationCenter')}
            onUpdateMachineHours={(id, hours) => updateMachine(id, { engineHours: hours })}
            onAddMachineLog={(id, log) => {
              const machine = machines.find(m => m.id === id);
              if (!machine) return;
              const stressIncrease = log.workIntensity === 'heavy' ? 15 : log.workIntensity === 'standard' ? 5 : 0;
              const newStress = Math.min((machine.stressLevel || 0) + stressIncrease, 100);
              const logId = Date.now().toString();

              updateMachine(id, {
                logs: [...(machine.logs || []), { ...log, id: logId }],
                stressLevel: newStress
              });

              if (log.cost > 0) {
                addTransaction({
                  id: `tx-maint-${logId}`,
                  date: log.date,
                  type: 'expense',
                  amount: log.cost,
                  category: 'Manutenção',
                  description: `Manutenção: ${machine.name} - ${log.description}`
                });
              }
            }}
            onTaskClick={(task) => openModal('taskProof', task)}
            onNavigate={(tab) => {
              if (tab === 'team') openModal('teamManager');
              else if (tab === 'feed') openModal('fieldFeed');
              else setActiveTab(tab as any);
            }}
          />
        )}

        {activeTab === 'animal' && (
          <AnimalCard
            animals={animals}
            animalBatches={animalBatches}
            onAddAnimal={(a) => addAnimal({ ...a, id: Date.now().toString() })}
            onAddProduction={addProduction}
            onUpdateAnimal={updateAnimal}
            onApplyBatchAction={applyBatchAction}
            onAddAnimalBatch={addAnimalBatch}
            onScheduleTask={(title, type, date) => addTask({
              id: Date.now().toString(),
              title,
              type,
              date,
              completed: false,
              status: 'pending'
            })}
          />
        )}

        {activeTab === 'cultivation' && (
          <CultivationView
            fields={fields}
            stocks={stocks}
            employees={users as any}
            harvests={harvests}
            toggleIrrigation={toggleIrrigation}
            onAddLog={(fId, log) => addLogToField(fId, { ...log, id: Date.now().toString() })}
            onUseStock={(fieldId, stockId, qty, date) => {
              const stock = stocks.find(s => s.id === stockId);
              if (!stock) return;
              updateStock(stockId, { quantity: stock.quantity - qty });
              addTransaction({ id: Date.now().toString(), date, type: 'expense', amount: qty * stock.pricePerUnit, category: 'Insumos', description: 'Uso em campo' });
              addLogToField(fieldId, { id: Date.now().toString(), date, type: 'treatment', description: `Uso de ${qty} ${stock.unit} de ${stock.name}` });
            }}
            onAddField={(f) => {
              const newField = {
                yieldPerHa: 0,
                polygon: [] as [number, number][],
                irrigationStatus: false,
                humidity: 50,
                temp: 20,
                healthScore: 100,
                harvestWindow: 'Próxima Época',
                history: [],
                logs: [],
                sensors: [],
                ...f,
                id: Date.now().toString()
              };
              addField(newField as any);
            }}
            onRegisterSensor={handleRegisterSensor}
            operatorName={currentUser.name}
            onRegisterSale={handleRegisterSale}
            onHarvest={handleHarvest}
            onViewTraceability={(batch) => openModal('traceability', batch)}
            onDeleteField={deleteField}
          />
        )}

        {activeTab === 'stocks' && (
          currentUser.role === 'admin' ? (
            <StockManager
              stocks={stocks}
              onUpdateStock={(id, delta) => updateStock(id, { quantity: (stocks.find(s => s.id === id)?.quantity || 0) + delta })}
              onAddStock={(item) => addStock({ ...item, id: Date.now().toString() })}
              onEditStock={(id, updates) => updateStock(id, updates)}
              onDeleteStock={deleteStock}
              onOpenGuide={() => openModal('guide')}
            />
          ) : (
            <AccessDenied title="Stocks & Armazém" />
          )
        )}

        {activeTab === 'machines' && (
          <MachineManager
            machines={machines}
            stocks={stocks}
            onUpdateHours={(id: string, hours: number) => updateMachine(id, { engineHours: hours })}
            onAddLog={(id: string, log: Omit<MaintenanceLog, 'id'>) => {
              const machine = machines.find(m => m.id === id);
              if (!machine) return;
              const logId = Date.now().toString();

              updateMachine(id, {
                logs: [...(machine.logs || []), { ...log, id: logId } as MaintenanceLog]
              });

              // Automated Stock Deduction for Fuel
              if (log.type === 'fuel' && log.quantity) {
                const fuelItem = stocks.find(s =>
                  s.category === 'Combustível' ||
                  s.name.toLowerCase().includes('gasóleo')
                );
                if (fuelItem) {
                  updateStock(fuelItem.id, { quantity: fuelItem.quantity - log.quantity });
                  addNotification({
                    id: `notif-fuel-${logId}`,
                    title: 'Stock: Saída de Combustível',
                    message: `${log.quantity}L de ${fuelItem.name} consumidos por ${machine.name}.`,
                    type: 'info',
                    timestamp: new Date().toISOString(),
                    read: false
                  });
                }
              }

              if (log.cost > 0) {
                addTransaction({
                  id: `tx-maint-${logId}`,
                  date: log.date,
                  type: 'expense',
                  amount: log.cost,
                  category: 'Manutenção',
                  description: `Manutenção: ${machine.name} - ${log.description}`
                });
              }
            }}
            onUpdateMachine={updateMachine}
            onAddMachine={(m: Omit<Machine, 'id' | 'logs'>) => addMachine({ ...m, id: Date.now().toString(), logs: [] } as Machine)}
          />
        )}

        {activeTab === 'finance' && (
          currentUser.role === 'admin' ? (
            <FinanceManager
              transactions={transactions}
              stocks={stocks}
              onAddTransaction={(tx) => addTransaction({ ...tx, id: Date.now().toString() })}
            />
          ) : (
            <AccessDenied title="Finanças" />
          )
        )}

        {activeTab === 'carbon' && <CarbonDashboard />}
      </main>

      {/* Voice Assistant & Floating Components */}
      <VoiceAssistant onCommand={handleVoiceCommand} />

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-neutral-900/90 border border-gray-100 dark:border-neutral-800 shadow-2xl rounded-[2.5rem] px-2 py-3 flex items-end justify-center gap-2 z-40 w-[96%] max-w-sm md:max-w-md mx-auto backdrop-blur-md transition-all duration-300 ease-in-out ${isAnyModalOpenValue ? 'translate-y-[200%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
          { id: 'cultivation', icon: Sprout, label: 'Cultivo' },
          { id: 'animal', icon: PawPrint, label: 'Animais' },
          { id: 'stocks', icon: Package, label: 'Stock' },
          { id: 'machines', icon: Tractor, label: 'Frota' },
          { id: 'finance', icon: Wallet, label: 'Finanças' },
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
            onClick={() => { haptics.light(); setActiveTab(tab.id as any); }}
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
        isOpen={modals.settings}
        onClose={() => closeModal('settings')}
        onResetData={() => resetAllData()}
        currentName={currentUser.name}
        onSaveName={(name) => {
          updateUser(currentUser.id, { name });
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
        isOpen={modals.omniSearch}
        onClose={() => closeModal('omniSearch')}
        fields={fields}
        animals={animals}
        machines={machines}
        tasks={tasks}
        onNavigate={(tab) => {
          setActiveTab(tab as any);
          closeModal('omniSearch');
        }}
      />

      <NotificationsModal
        isOpen={modals.notifications}
        onClose={() => closeModal('notifications')}
        weather={weatherData}
        animals={animals}
        fields={fields}
        stocks={stocks}
        machines={machines}
        onNavigate={(tab) => setActiveTab(tab as any)}
      />

      <NotificationCenter
        isOpen={modals.notificationCenter}
        onClose={() => closeModal('notificationCenter')}
        notifications={notifications}
        onMarkAsRead={markNotificationRead}
        onMarkAllAsRead={() => notifications.forEach(n => markNotificationRead(n.id))}
        onClearHistory={() => { }}
        onNavigate={(path) => setActiveTab(path as any)}
      />

      {modals.fieldFeed && (
        <FieldFeed
          onClose={() => closeModal('fieldFeed')}
        />
      )}

      {modals.teamManager && (
        <TeamManager
          onClose={() => closeModal('teamManager')}
          users={users}
          currentUser={currentUser}
          onAddUser={addUser}
          onDeleteUser={deleteUser}
          onSwitchUser={(id) => {
            setCurrentUserId(id);
            closeModal('teamManager');
            setActiveTab('dashboard');
          }}
        />
      )}

      {modals.taskProof && (
        <TaskProofModal
          isOpen={true}
          task={modals.taskProof}
          onClose={() => closeModal('taskProof')}
          onSubmitProof={handleSubmitProof}
          onReviewTask={handleReviewTask}
          currentUser={currentUser}
        />
      )}

      {modals.traceability && (
        <TraceabilityModal
          isOpen={true}
          batch={modals.traceability}
          onClose={() => closeModal('traceability')}
        />
      )}

      {modals.guide && (
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
                  <p className="text-sm font-bold dark:text-white">{modals.guideData?.clientName || 'Consumidor Final'}</p>
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

      {modals.iotWizard && (
        <IoTPairingWizard
          onClose={() => closeModal('iotWizard')}
          fields={fields}
          onPair={handleRegisterSensor}
        />
      )}

      <InstallPrompt />
      <LoneWorkerMonitor />
      <ConflictDiscoveryModal />
    </div>
  );
};

export default App;
