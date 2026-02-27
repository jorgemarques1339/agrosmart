import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { Lock, Shield } from 'lucide-react';

import { useStore } from './store/useStore';
import { useWeatherSync } from './hooks/useWeatherSync';
import { useAppSync } from './hooks/useAppSync';
import { UserProfile } from './types';

// Core Components (Eager loaded)
import { Login } from './components/Login';
import AppSkeleton from './components/AppSkeleton';
import { MainLayout } from './components/MainLayout';
import { PublicClockInPortal } from './components/PublicClockInPortal';

// Lazy Loaded Components
const DashboardHome = React.lazy(() => import('./components/DashboardHome'));
const AnimalCard = React.lazy(() => import('./components/AnimalCard'));
const StockManager = React.lazy(() => import('./components/StockManager'));
const MachineManager = React.lazy(() => import('./components/MachineManager'));
const FinanceManager = React.lazy(() => import('./components/FinanceManager'));
const CultivationView = React.lazy(() => import('./components/CultivationView'));
const CarbonDashboard = React.lazy(() => import('./components/CarbonDashboard'));
const PublicProductPage = React.lazy(() => import('./components/PublicProductPage'));

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


// --- ERROR BOUNDARY ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any, errorInfo: any) { console.error("[ErrorBoundary] Caught error:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-black">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-3xl flex items-center justify-center mb-6">
            <Shield size={40} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-black dark:text-white mb-2">Ops! Algo correu mal.</h2>
          <p className="text-gray-500 dark:text-neutral-400 text-sm max-w-xs mb-8">
            Ocorreu um erro ao carregar esta secção. Tente atualizar a página ou limpar os dados locais.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
            >
              Recarregar Aplicação
            </button>
            <button
              onClick={async () => {
                const { db } = await import('./services/db');
                await db.delete();
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full py-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
            >
              Limpar Tudo e Reiniciar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Protected Route Wrapper
const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { isAuthenticated, currentUserId, users } = useStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const currentUser = useMemo(() => {
    if (!users) return { id: 'guest', name: 'Convidado', role: 'operator', avatar: 'C' } as UserProfile;
    return users.find(u => u && u.id === currentUserId) || { id: 'guest', name: 'Convidado', role: 'operator', avatar: 'C' } as UserProfile;
  }, [users, currentUserId]);

  if (requireAdmin && currentUser.role !== 'admin') {
    return <AccessDenied title="Acesso Negado" />;
  }

  return <>{children}</>;
};

// Global Data Provider (Initializes core syncs used everywhere)
const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
  const { isHydrated } = useAppSync();
  useWeatherSync();

  if (!isHydrated) return <AppSkeleton />;

  return <>{children}</>;
};

const AppRoutes = () => {
  const {
    fields, stocks, animals, machines, transactions, tasks, harvests,
    weatherData, detailedForecast, currentUserId, users,
    addField, deleteField,
    addStock, updateStock, deleteStock,
    addAnimal, updateAnimal, addProduction,
    addAnimalBatch, updateAnimalBatch, applyBatchAction,
    addMachine, updateMachine,
    addTask, updateTask, deleteTask,
    addTransaction, addLogToField, toggleIrrigation,
    animalBatches, feedItems, hasUnreadFeed,
    syncStatus, lastSyncTime,
    activeSession, startSession, endSession, openModal, addNotification
  } = useStore();

  const currentUser = useMemo(() => {
    if (!users) return { id: 'guest', name: 'Convidado', role: 'operator', avatar: 'C' } as UserProfile;
    return users.find(u => u && u.id === currentUserId) || { id: 'guest', name: 'Convidado', role: 'operator', avatar: 'C' } as UserProfile;
  }, [users, currentUserId]);

  const navigate = useNavigate();

  const alertCount = useMemo(() => {
    let count = 0;
    if (weatherData.length > 0 && (weatherData[0].condition === 'rain' || weatherData[0].condition === 'storm')) count++;
    count += animals.filter(a => a.status === 'sick').length;
    count += fields.filter(f => f.humidity < 30 || f.healthScore < 70).length;
    count += stocks.filter(s => s.quantity <= s.minStock).length;
    return count;
  }, [weatherData, animals, fields, stocks]);

  // Public intercepters
  const params = new URLSearchParams(window.location.search);
  const isPublicClockIn = params.get('clockin') === 'true';
  const publicBatchId = params.get('batchId');

  if (publicBatchId) {
    return (
      <Suspense fallback={<AppSkeleton />}>
        <PublicProductPage batchId={publicBatchId} harvests={harvests} fields={fields} />
      </Suspense>
    );
  }

  if (isPublicClockIn) {
    return (
      <ErrorBoundary>
        <PublicClockInPortal />
      </ErrorBoundary>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <GlobalProvider>
          <ProtectedRoute><MainLayout /></ProtectedRoute>
        </GlobalProvider>
      }>
        <Route index element={
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
            activeSession={activeSession}
            onStartSession={startSession}
            onEndSession={endSession}
            onAddTask={(title, priority, date, assignee) => {
              addTask({ id: Date.now().toString(), title, priority, date, assignedTo: assignee, status: 'pending', completed: false });
            }}
            onUpdateTask={updateTask}
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
            onNavigate={(tab) => {
              if (tab === 'team') openModal('teamManager');
              else if (tab === 'feed') openModal('fieldFeed');
              else navigate(`/${tab}`);
            }}
          />
        } />

        <Route path="cultivation" element={
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
                yieldPerHa: 0, polygon: [], irrigationStatus: false, humidity: 50, temp: 20, healthScore: 100,
                harvestWindow: 'Próxima Época', history: [], logs: [], sensors: [], ...f, id: Date.now().toString()
              };
              addField(newField as any);
            }}
            onRegisterSensor={() => { }}
            operatorName={currentUser.name}
            onRegisterSale={() => { }}
            onHarvest={() => { }}
            onViewTraceability={(batch) => openModal('traceability', batch)}
            onDeleteField={deleteField}
          />
        } />

        <Route path="animal" element={
          <AnimalCard
            animals={animals}
            animalBatches={animalBatches}
            onAddAnimal={(a) => addAnimal({ ...a, id: Date.now().toString() })}
            onAddProduction={addProduction}
            onUpdateAnimal={updateAnimal}
            onApplyBatchAction={applyBatchAction}
            onAddAnimalBatch={addAnimalBatch}
            onScheduleTask={(title, type, date) => addTask({ id: Date.now().toString(), title, type, date, completed: false, status: 'pending' })}
          />
        } />

        <Route path="stocks" element={
          <ProtectedRoute requireAdmin>
            <StockManager
              stocks={stocks}
              onUpdateStock={(id, delta) => updateStock(id, { quantity: (stocks.find(s => s.id === id)?.quantity || 0) + delta })}
              onAddStock={(item) => addStock({ ...item, id: Date.now().toString() })}
              onEditStock={(id, updates) => updateStock(id, updates)}
              onDeleteStock={deleteStock}
              onOpenGuide={() => openModal('guide')}
            />
          </ProtectedRoute>
        } />

        <Route path="machines" element={
          <MachineManager
            machines={machines}
            stocks={stocks}
            onUpdateHours={(id, hours) => updateMachine(id, { engineHours: hours })}
            onAddLog={(id, log) => {
              const machine = machines.find(m => m.id === id);
              if (!machine) return;
              const logId = Date.now().toString();

              updateMachine(id, { logs: [...(machine.logs || []), { ...log, id: logId } as any] });

              if (log.type === 'fuel' && log.quantity) {
                const fuelItem = stocks.find(s => s.category === 'Combustível' || s.name.toLowerCase().includes('gasóleo'));
                if (fuelItem) {
                  updateStock(fuelItem.id, { quantity: fuelItem.quantity - log.quantity });
                  addNotification({
                    id: `notif-fuel-${logId}`, title: 'Stock: Saída de Combustível',
                    message: `${log.quantity}L de ${fuelItem.name} consumidos por ${machine.name}.`,
                    type: 'info', timestamp: new Date().toISOString(), read: false
                  });
                }
              }

              if (log.cost > 0) {
                addTransaction({
                  id: `tx-maint-${logId}`, date: log.date, type: 'expense', amount: log.cost,
                  category: 'Manutenção', description: `Manutenção: ${machine.name} - ${log.description}`
                });
              }
            }}
            onUpdateMachine={updateMachine}
            onAddMachine={(m) => addMachine({ ...m, id: Date.now().toString(), logs: [] } as any)}
          />
        } />

        <Route path="finance" element={
          <ProtectedRoute requireAdmin>
            <FinanceManager
              transactions={transactions}
              stocks={stocks}
              onAddTransaction={(tx) => addTransaction({ ...tx, id: Date.now().toString() })}
            />
          </ProtectedRoute>
        } />

        <Route path="carbon" element={<CarbonDashboard />} />
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
