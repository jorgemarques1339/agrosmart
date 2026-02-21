
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LayoutDashboard, Sprout, PawPrint, Package,
  Tractor, Wallet, Settings, Bell, X,
  FileText, Wifi, Plus, Save,
  Radio, Signal, Loader2, Droplets, Activity, CheckCircle2, ChevronDown,
  Truck, FileCheck, WifiOff, CloudOff, ArrowRight, QrCode, Calendar,
  Lock, Users, MapPin
} from 'lucide-react';
import mqtt from 'mqtt';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { AppState, Field, StockItem, FieldLog, RegistryType, Sensor, Task, Animal, Machine, Transaction, MaintenanceLog, WeatherForecast, DetailedForecast, Employee, ProductBatch, UserProfile, Notification } from './types';
import { useStore, isAnyModalOpen } from './store/useStore';
import { useWeatherSync } from './hooks/useWeatherSync';
import { INITIAL_WEATHER, CROP_TYPES } from './constants';

import DashboardHome from './components/DashboardHome';
import AnimalCard from './components/AnimalCard';
import FieldCard from './components/FieldCard';
import StockManager from './components/StockManager';
import MachineManager from './components/MachineManager';
import FinanceManager from './components/FinanceManager';
import SettingsModal from './components/SettingsModal';
import NotificationsModal, { TabId } from './components/NotificationsModal';
import FieldNotebook from './components/FieldNotebook';
import InstallPrompt from './components/InstallPrompt';
import VoiceAssistant, { VoiceActionType } from './components/VoiceAssistant';
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
import { supabaseRealtime } from './services/SupabaseRealtime';
import { syncManager } from './services/SyncManager';
import OmniSearch from './components/OmniSearch';
import { haptics } from './utils/haptics';

// API Configuration
const WEATHER_API_KEY = 'c7f76605724ecafb54933077ede4166a';
const LAT = 41.442;
const LON = -8.723;

// ... [IoTPairingWizard Component] ...


const App = () => {
  const {
    fields, stocks, animals, machines, transactions, tasks, notifications, users, harvests, isHydrated,
    activeTab, isDarkMode, isSolarMode, isOnline, weatherData, detailedForecast, currentUserId,
    hydrate, setActiveTab, setDarkMode, setSolarMode, setOnline, setWeatherData, setDetailedForecast, setCurrentUserId,
    addField, updateField, deleteField,
    addStock, updateStock, deleteStock,
    addAnimal, updateAnimal, addProduction,
    addAnimalBatch, updateAnimalBatch, deleteAnimalBatch, applyBatchAction,
    addMachine, updateMachine,
    addTask, updateTask, deleteTask,
    updateUser, addUser, deleteUser,
    addTransaction, addNotification, markNotificationRead,
    toggleIrrigation, addLogToField, registerSale, harvestField,
    animalBatches, feedItems, hasUnreadFeed,
    ui, openModal, closeModal, setChildModalOpen, updateGuideData
  } = useStore();
  const isAnyModalOpenValue = useStore(isAnyModalOpen);

  useWeatherSync();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Force initial synchronization on load
  useEffect(() => {
    if (isHydrated && isOnline) {
      console.log('[App] Initial hydration complete. Triggering Cloud Sync...');
      syncManager.processQueue();
    }
  }, [isHydrated, isOnline]);

  // Routing Logic (Public vs App)
  const [viewMode, setViewMode] = useState<'app' | 'public'>('app');
  const [publicBatchId, setPublicBatchId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const batchId = params.get('batch');
    if (batchId) {
      setViewMode('public');
      setPublicBatchId(batchId);
    }

    // QR Onboarding
    const onboardId = params.get('onboard');
    if (onboardId && onboardId !== currentUserId) {
      const userExists = users.find(u => u.id === onboardId);
      if (userExists) {
        setCurrentUserId(onboardId);
        // Clear param
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({ path: newUrl }, '', newUrl);

        addNotification({
          id: `onboard-${Date.now()}`,
          title: 'Configuração Concluída',
          message: `Bem-vindo à SmartAgro, ${userExists.name}! O teu perfil foi configurado.`,
          type: 'success',
          timestamp: new Date().toISOString(),
          read: false
        });
      }
    }
  }, [users, currentUserId, setCurrentUserId, addNotification]);

  // UI Local States moved to Store
  const { modals, isChildModalOpen } = ui;
  const { guideStep, guideData } = modals;
  const isSettingsOpen = modals.settings;
  const isNotificationsOpen = modals.notifications;
  const isNotificationCenterOpen = modals.notificationCenter;
  const isTeamManagerOpen = modals.teamManager;
  const taskProofTask = modals.taskProof;
  const traceabilityBatch = modals.traceability;
  const showGuideModal = modals.guide;

  const [showOnlineSuccess, setShowOnlineSuccess] = useState<boolean>(false);
  const [syncQueueCount, setSyncQueueCount] = useState(0);

  // Monitor Sync Queue
  useEffect(() => {
    const interval = setInterval(async () => {
      const { db } = await import('./services/db');
      const count = await db.syncQueue.count();
      setSyncQueueCount(count);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  // Derived Current User
  const currentUser = useMemo(() => {
    return users?.find(u => u.id === currentUserId) || { id: 'guest', name: 'Convidado', role: 'operator', avatar: 'C' } as UserProfile;
  }, [users, currentUserId]);

  const userName = currentUser.name;

  // --- HANDLERS ---
  const handleVoiceCommand = useCallback((action: VoiceActionType) => {
    switch (action.type) {
      case 'NAVIGATE':
        setActiveTab(action.target);
        break;
      case 'OPEN_MODAL':
        if (action.target === 'new_task') setActiveTab('dashboard');
        else if (action.target === 'new_animal') setActiveTab('animal');
        else if (action.target === 'add_stock') setActiveTab('stocks');
        break;
      case 'IOT_CONTROL':
        if (action.action === 'irrigation_on') {
          const f = fields.find(f => !f.irrigationStatus);
          if (f) toggleIrrigation(f.id, true);
        } else if (action.action === 'irrigation_off' || action.action === 'stop_all') {
          fields.forEach(f => { if (f.irrigationStatus) toggleIrrigation(f.id, false); });
        }
        break;
    }
  }, [fields, setActiveTab, toggleIrrigation]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    // Initialize Cloud Sync Listeners
    supabaseRealtime.init();
    syncManager.processQueue(); // Start pushing any pending local changes

    return () => {
      supabaseRealtime.stop();
    };
  }, []);

  useEffect(() => {
    if (isSolarMode) {
      document.documentElement.classList.add('solar-mode');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('solar-mode');
      if (isDarkMode) document.documentElement.classList.add('dark');
    }
  }, [isSolarMode, isDarkMode]);

  // Global OmniSearch Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (modals.omniSearch) closeModal('omniSearch');
        else openModal('omniSearch');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modals.omniSearch, openModal, closeModal]);

  const alertCount = useMemo(() => {
    let count = 0;
    if (weatherData.length > 0 && (weatherData[0].condition === 'rain' || weatherData[0].condition === 'storm')) count++;
    count += animals.filter(a => a.status === 'sick').length;
    count += fields.filter(f => f.humidity < 30 || f.healthScore < 70).length;
    count += stocks.filter(s => s.quantity <= s.minStock).length;
    return count;
  }, [weatherData, animals, fields, stocks]);

  const handleAddTask = (title: string, type: 'task' | 'harvest', date?: string) => {
    addTask({ id: Date.now().toString(), title, date: date || new Date().toISOString().split('T')[0], type, completed: false, status: 'pending' });
  };

  const handleRegisterSensor = (fieldId: string, sensor: Sensor) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    updateField(fieldId, { sensors: [...(field.sensors || []), sensor] });
  };

  const handleSubmitProof = (taskId: string, proof: string) => {
    updateTask(taskId, { completed: true, status: 'done', proofImage: proof });
  };

  const handleReviewTask = (taskId: string, approved: boolean) => {
    updateTask(taskId, { status: approved ? 'done' : 'pending', completed: approved });
  };

  const handleRegisterSale = (data: any) => {
    const tx: Transaction = {
      id: Date.now().toString(),
      date: data.date,
      type: 'income',
      amount: data.quantity * data.pricePerUnit,
      category: 'Vendas',
      description: `Venda: ${data.clientName}`
    };
    registerSale({
      stockId: data.stockId,
      quantity: data.quantity,
      transaction: tx
    });
  };

  const handleHarvest = (fieldId: string, data: any) => {
    const stockItem: StockItem = {
      id: Date.now().toString(),
      name: `Colheita: ${data.batchId}`,
      category: 'Colheita',
      quantity: data.quantity,
      unit: data.unit,
      minStock: 0,
      pricePerUnit: 0
    };
    const harvest: ProductBatch = {
      batchId: data.batchId,
      crop: fields.find(f => f.id === fieldId)?.crop || 'Desconhecido',
      quantity: data.quantity,
      unit: data.unit,
      harvestDate: data.date,
      origin: 'Quinta do Oriva, Laundos',
      coordinates: fields.find(f => f.id === fieldId)?.coordinates || [41.442, -8.723],
      stats: { sunDays: 0, harvestMethod: 'Manual' },
      farmerName: userName
    };
    harvestField(fieldId, stockItem, harvest);
  };

  const generateGuidePDF = () => {
    const selectedStock = stocks.find(s => s.id === guideData.stockId);
    const selectedField = fields.find(f => f.id === guideData.fieldId);
    if (!selectedStock || !selectedField) return;

    handleRegisterSale({
      stockId: guideData.stockId,
      quantity: parseFloat(guideData.quantity),
      pricePerUnit: parseFloat(guideData.price),
      clientName: guideData.clientName,
      date: guideData.date,
      fieldId: selectedField.id
    });

    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(62, 104, 55);
    doc.text("GUIA DE TRANSPORTE", 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Documento de Acompanhamento de Mercadorias", 105, 26, { align: 'center' });
    doc.setDrawColor(200);
    doc.line(14, 32, 196, 32);
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("EXPEDIDOR (Quinta):", 14, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Oriva Farms Enterprise", 14, 48);
    doc.text(`Local Carga: ${selectedField.name} (${selectedField.coordinates.join(', ')})`, 14, 53);
    doc.text(`Data/Hora: ${new Date().toLocaleString()}`, 14, 58);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DESTINATÁRIO:", 110, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(guideData.clientName, 110, 48);
    doc.text(`NIF: ${guideData.clientNif || 'N/A'}`, 110, 53);
    doc.text(`Descarga: ${guideData.destination || 'Morada do Cliente'}`, 110, 58);
    doc.setFillColor(240, 240, 240);
    doc.rect(14, 65, 182, 15, 'F');
    doc.text(`Viatura: ${guideData.plate.toUpperCase()}`, 20, 75);
    doc.text(`Data Início: ${guideData.date}`, 120, 75);

    const tableRows = [[
      selectedStock.name,
      `${guideData.quantity} ${selectedStock.unit}`,
      `${guideData.price} €`,
      `${(parseFloat(guideData.quantity) * parseFloat(guideData.price)).toFixed(2)} €`
    ]];
    autoTable(doc, {
      startY: 85,
      head: [['Mercadoria', 'Quantidade', 'Preço Unit.', 'Total']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [62, 104, 55] },
    });
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Este documento não substitui a fatura oficial. Válido para circulação.", 14, finalY);
    doc.text(`Emitido via OrivaSmart App`, 14, finalY + 5);
    doc.save(`Guia_Transporte_${guideData.clientName.replace(/\s/g, '_')}.pdf`);

    closeModal('guide');
  };



  if (viewMode === 'public' && publicBatchId) {
    return <PublicProductPage batchId={publicBatchId} />;
  }

  const AccessDenied = ({ title }: { title: string }) => (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 animate-fade-in">
      <div className="w-24 h-24 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
        <Lock size={40} className="text-gray-400" />
      </div>
      <h3 className="text-xl font-black dark:text-white mb-2">Acesso Restrito</h3>
      <p className="text-gray-500 max-w-xs">A secção <strong>{title}</strong> está disponível apenas para administradores.</p>
    </div>
  );


  if (!isHydrated) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0b] flex flex-col items-center justify-center z-[9999] p-6">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 border-t-2 border-emerald-500 rounded-full animate-spin opacity-20" />
          <div className="absolute inset-2 border-r-2 border-emerald-400 rounded-full animate-spin [animation-duration:1.5s]" />
          <div className="absolute inset-4 border-b-2 border-emerald-300 rounded-full animate-spin [animation-duration:2s] opacity-40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl blur-xl animate-pulse" />
          </div>
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent animate-pulse tracking-tight">
          AgroSmart
        </h2>
        <p className="text-emerald-500/40 text-[10px] mt-4 font-black tracking-[0.3em] uppercase">
          Inicializando Ecossistema...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-black overflow-hidden transition-colors duration-300">

      {/* OFFLINE INDICATOR BANNER */}
      {!isOnline && (
        <div className="absolute top-0 left-0 right-0 z-[100] bg-orange-500 text-white text-[10px] font-bold text-center py-1 uppercase tracking-widest flex items-center justify-center gap-2 animate-slide-down shadow-md">
          <WifiOff size={12} /> Modo Offline • {syncQueueCount > 0 ? `${syncQueueCount} Registos Pendentes` : 'Dados Guardados'}
        </div>
      )}

      {/* ONLINE / SYNCING BANNER */}
      {isOnline && syncQueueCount > 0 && (
        <div className="absolute top-0 left-0 right-0 z-[100] bg-blue-600 text-white text-[10px] font-bold text-center py-1 uppercase tracking-widest flex items-center justify-center gap-3 animate-slide-down shadow-md">
          <Loader2 size={12} className="animate-spin" /> Sincronizando {syncQueueCount} registos com a base central...
        </div>
      )}

      {/* ONLINE RESTORED BANNER */}
      {showOnlineSuccess && syncQueueCount === 0 && (
        <div className="absolute top-0 left-0 right-0 z-[100] bg-green-500 text-white text-[10px] font-bold text-center py-1 uppercase tracking-widest flex items-center justify-center gap-2 animate-slide-down shadow-md">
          <Wifi size={12} /> Conexão Restaurada • Sincronizado
        </div>
      )}

      {/* CRITICAL ALERT TOAST */}
      {notifications.some(n => n.type === 'critical' && !n.read) && (
        <div
          onClick={() => openModal('notificationCenter')}
          className="fixed top-12 left-1/2 -translate-x-1/2 z-[150] bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-bounce-in cursor-pointer hover:scale-105 transition-transform"
        >
          <div className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span className="text-xs font-black uppercase tracking-wide">
            {notifications.filter(n => n.type === 'critical' && !n.read).length} Alerta(s) Crítico(s)
          </span>
          <ArrowRight size={14} />
        </div>
      )}

      {/* EMERGENCY "MAN DOWN" OVERLAY */}
      {users.some(u => u.safetyStatus?.status === 'emergency') && (
        <div className="fixed inset-0 z-[1000] bg-red-600/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-white text-center animate-pulse-slow">
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-8 animate-bounce shadow-[0_0_50px_rgba(255,255,255,0.5)]">
            <Activity size={64} className="text-red-600" />
          </div>
          <h2 className="text-4xl font-black italic tracking-tighter mb-2 uppercase">Alerta Man Down</h2>
          <p className="text-xl font-bold opacity-90 mb-8 max-w-sm">
            Um operador emitiu um sinal de emergência ou está imóvel há demasiado tempo.
          </p>

          <div className="space-y-4 w-full max-w-sm">
            {users.filter(u => u.safetyStatus?.status === 'emergency').map(u => (
              <div key={u.id} className="bg-white/20 p-6 rounded-[2rem] border border-white/30 backdrop-blur-md flex items-center gap-4 text-left">
                <div className="w-16 h-16 rounded-full border-4 border-white overflow-hidden shadow-lg">
                  <img src={`https://i.pravatar.cc/150?u=${u.id}`} className="w-full h-full object-cover" alt={u.name} />
                </div>
                <div>
                  <h4 className="text-xl font-black">{u.name}</h4>
                  <p className="text-sm font-bold opacity-80 uppercase tracking-widest flex items-center gap-1">
                    <MapPin size={12} /> ÁREA REMOTA: {u.safetyStatus?.location?.join(', ')}
                  </p>
                  <p className="text-xs font-bold mt-1 text-red-200">Último Movimento: {new Date(u.safetyStatus?.lastMovement || '').toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-4 w-full max-w-xs">
            <button
              onClick={() => {
                // Simulação: resolver o estado de emergência para todos
                users.filter(u => u.safetyStatus?.status === 'emergency').forEach(u => {
                  updateUser(u.id, {
                    safetyStatus: { ...u.safetyStatus!, status: 'safe', lastMovement: new Date().toISOString() }
                  });
                });
                setActiveTab('dashboard');
              }}
              className="w-full py-5 bg-white text-red-600 rounded-[2rem] font-black text-xl shadow-2xl active:scale-95 transition-all"
            >
              RESGATE LANÇADO
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-white/60 text-sm font-bold uppercase tracking-widest"
            >
              Ignorar (Apenas Monitorizar)
            </button>
          </div>

          {/* Som de Alerta (Sintético) */}
          <div className="hidden">
            <audio autoPlay loop src="https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3" />
          </div>
        </div>
      )}

      {/* Scrollable Content Area */}
      <main className={`flex-1 overflow-y-auto scrollbar-hide w-full max-w-md md:max-w-5xl mx-auto relative px-4 md:px-8 pb-28 ${(!isOnline || syncQueueCount > 0 || showOnlineSuccess) ? 'pt-14' : 'pt-2'} transition-all duration-300`}>
        {activeTab === 'dashboard' && (
          <DashboardHome
            userName={userName}
            weather={weatherData}
            hourlyForecast={detailedForecast}
            tasks={tasks}
            fields={fields}
            machines={machines || []}
            stocks={stocks}
            users={users}
            currentUser={currentUser}
            animals={animals}
            feedItems={feedItems}
            hasUnreadFeed={hasUnreadFeed}
            syncStatus={useStore.getState().syncStatus}
            lastSyncTime={useStore.getState().lastSyncTime}
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
              if (tab === 'team' || tab === 'feed') openModal('fieldFeed');
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
            employees={users.map(u => ({ ...u, hourlyRate: 10 }))} // Map UserProfile to Employee
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
            onAddField={(f) => addField({ ...f, id: Date.now().toString(), yieldPerHa: 0, coordinates: [41.442, -8.723], polygon: [], irrigationStatus: false, humidity: 50, temp: 20, healthScore: 100, harvestWindow: 'Próxima Época', history: [], logs: [], sensors: [] })}
            onRegisterSensor={handleRegisterSensor}
            operatorName={userName}
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
                logs: [...(machine.logs || []), { ...log, id: logId }]
              });

              // [INTEGRATION] Automated Stock Deduction for Fuel
              if (log.type === 'fuel' && log.quantity) {
                const fuelItem = stocks.find(s =>
                  s.category === 'Combustível' ||
                  s.name.toLowerCase().includes('gasóleo') ||
                  s.name.toLowerCase().includes('diesel')
                );
                if (fuelItem) {
                  updateStock(fuelItem.id, { quantity: fuelItem.quantity - log.quantity });

                  // Add a system notification about stock movement
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
            onAddMachine={(m: Omit<Machine, 'id' | 'logs'>) => addMachine({ ...m, id: Date.now().toString(), logs: [] })}
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

      {/* VOICE ASSISTANT FAB */}
      <VoiceAssistant onCommand={handleVoiceCommand} />

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 shadow-2xl rounded-[2.5rem] px-2 py-3 flex items-end justify-center gap-2 z-40 w-[96%] max-w-sm md:max-w-md mx-auto backdrop-blur-md bg-opacity-90 dark:bg-opacity-90 transition-all duration-300 ease-in-out ${isAnyModalOpenValue ? 'translate-y-[200%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}>
        {(() => {
          const allTabs = [
            { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
            { id: 'cultivation', icon: Sprout, label: 'Cultivo' },
            { id: 'animal', icon: PawPrint, label: 'Animais' },
            { id: 'stocks', icon: Package, label: 'Stock' },
            { id: 'machines', icon: Tractor, label: 'Frota' },
            { id: 'finance', icon: Wallet, label: 'Finanças' },
          ];

          const filteredTabs = allTabs.filter(tab => {
            const role = currentUser.role;
            const specialty = currentUser.specialty?.toLowerCase() || '';

            if (role === 'admin') return true;
            if (tab.id === 'dashboard') return true;

            // Farmer / Cultivation
            if (role === 'farmer' || specialty.includes('agric') || specialty.includes('gest')) {
              if (['cultivation', 'stocks'].includes(tab.id)) return true;
            }

            // Vet / Animals
            if (role === 'vet' || specialty.includes('vet') || specialty.includes('anim')) {
              if (tab.id === 'animal') return true;
            }

            // Mechanic / Fleet
            if (role === 'mechanic' || specialty.includes('mecan') || specialty.includes('máquin')) {
              if (tab.id === 'machines') return true;
            }

            // Admin only for Finance
            if (tab.id === 'finance') return (role as string) === 'admin';

            return tab.id === 'dashboard';
          });

          return filteredTabs.map(tab => (
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
          ));
        })()}
      </nav>

      {/* Global Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => closeModal('settings')}
        onResetData={() => hydrate()}
        currentName={userName}
        onSaveName={(name) => {
          updateUser(currentUserId, { name });
          haptics.success();
        }}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setDarkMode(!isDarkMode)}
        isSolarMode={isSolarMode}
        onToggleSolarMode={() => setSolarMode(!isSolarMode)}
        syncStatus={useStore.getState().syncStatus}
        lastSyncTime={useStore.getState().lastSyncTime}
      />

      <OmniSearch
        isOpen={modals.omniSearch}
        onClose={() => closeModal('omniSearch')}
        fields={fields}
        animals={animals}
        machines={machines}
        tasks={tasks}
        onNavigate={(tab, itemId) => {
          setActiveTab(tab as any);
          // In a more complex app, we would also pass the itemId to the specific screen
          // to auto-open or scroll to the exact item.
        }}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => closeModal('notifications')}
        weather={weatherData}
        animals={animals}
        fields={fields}
        stocks={stocks}
        machines={machines}
        onNavigate={(tab) => setActiveTab(tab as any)}
      />

      {/* TEAM CONNECT MODAL (Opened from Settings Button for now - could be in Settings Menu) */}
      {isSettingsOpen && (
        <button
          onClick={() => { closeModal('settings'); openModal('teamManager'); }}
          className="fixed top-24 right-6 z-[160] bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg animate-slide-left flex items-center gap-2"
        >
          <Users size={16} /> Equipa
        </button>
      )}

      {isTeamManagerOpen && (
        <TeamManager
          users={users}
          currentUser={currentUser}
          onAddUser={addUser}
          onDeleteUser={deleteUser}
          onSwitchUser={(id) => {
            setCurrentUserId(id);
            closeModal('teamManager');
            setActiveTab('dashboard');
          }}
          onClose={() => closeModal('teamManager')}
        />
      )}

      {modals.fieldFeed && (
        <FieldFeed
          onClose={() => closeModal('fieldFeed')}
        />
      )}

      {taskProofTask && (
        <TaskProofModal
          isOpen={!!taskProofTask}
          onClose={() => closeModal('taskProof')}
          task={taskProofTask}
          currentUser={currentUser}
          onSubmitProof={handleSubmitProof}
          onReviewTask={handleReviewTask}
        />
      )}

      {/* TRACEABILITY MODAL (GENERATOR) */}
      {traceabilityBatch && (
        <TraceabilityModal
          isOpen={!!traceabilityBatch}
          onClose={() => closeModal('traceability')}
          batch={traceabilityBatch}
        />
      )}

      {/* --- e-GUIAS MODAL (GLOBAL) --- */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => closeModal('guide')}>
          <div
            className="bg-white dark:bg-neutral-900 w-full max-w-md p-6 rounded-t-[2.5rem] shadow-2xl animate-slide-up border-t border-white/20 max-h-[95vh] overflow-y-auto custom-scrollbar"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black dark:text-white flex items-center gap-2">
                  <Truck className="text-orange-500" size={24} /> Expedição
                </h3>
                <p className="text-xs font-bold text-gray-400 uppercase mt-1">Comercialização & Guia</p>
              </div>
              <button onClick={() => closeModal('guide')} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                <X size={20} className="dark:text-white" />
              </button>
            </div>

            {guideStep === 1 ? (
              <div className="space-y-5">
                {/* Field Selector (Location) */}
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Local de Carga (Parcela)</label>
                  <select
                    value={guideData.fieldId}
                    onChange={(e) => updateGuideData({ guideData: { fieldId: e.target.value } })}
                    className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                  >
                    <option value="">Selecione o local...</option>
                    {fields.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                {/* Stock Selector */}
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">O que vai vender?</label>
                  <select
                    value={guideData.stockId}
                    onChange={(e) => updateGuideData({ guideData: { stockId: e.target.value } })}
                    className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                  >
                    <option value="">Selecione o produto...</option>
                    {stocks.filter(s => s.quantity > 0).map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.quantity} {s.unit})</option>
                    ))}
                  </select>
                </div>

                {/* Quantidade & Preço */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Quantidade</label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                      value={guideData.quantity}
                      onChange={(e) => updateGuideData({ guideData: { quantity: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Preço Un. (€)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                      value={guideData.price}
                      onChange={(e) => updateGuideData({ guideData: { price: e.target.value } })}
                    />
                  </div>
                </div>

                <button
                  onClick={() => updateGuideData({ guideStep: 2 })}
                  disabled={!guideData.stockId || !guideData.quantity || !guideData.price || !guideData.fieldId}
                  className={`w-full py-4 rounded-[1.5rem] font-bold text-white flex items-center justify-center gap-2 mt-4 transition-all ${!guideData.stockId || !guideData.quantity || !guideData.fieldId ? 'bg-gray-300 dark:bg-neutral-800 cursor-not-allowed text-gray-500' : 'bg-orange-500 shadow-lg shadow-orange-500/30 active:scale-95'}`}
                >
                  Próximo: Dados de Transporte
                </button>
              </div>
            ) : (
              <div className="space-y-5 animate-slide-up">
                {/* Client Info */}
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Cliente</label>
                  <input
                    placeholder="Nome do Cliente"
                    className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-orange-500 mb-2"
                    value={guideData.clientName}
                    onChange={(e) => updateGuideData({ guideData: { clientName: e.target.value } })}
                  />
                  <input
                    placeholder="NIF (Opcional)"
                    className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                    value={guideData.clientNif}
                    onChange={(e) => updateGuideData({ guideData: { clientNif: e.target.value } })}
                  />
                </div>

                {/* Transport Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Matrícula</label>
                    <input
                      placeholder="AA-00-BB"
                      className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none uppercase focus:ring-2 focus:ring-orange-500"
                      value={guideData.plate}
                      onChange={(e) => updateGuideData({ guideData: { plate: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Data</label>
                    <input
                      type="date"
                      className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                      value={guideData.date}
                      onChange={(e) => updateGuideData({ guideData: { date: e.target.value } })}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => updateGuideData({ guideStep: 1 })} className="px-6 py-4 bg-gray-200 dark:bg-neutral-800 rounded-[1.5rem] font-bold text-gray-600 dark:text-gray-300">Voltar</button>
                  <button
                    onClick={generateGuidePDF}
                    disabled={!guideData.clientName || !guideData.plate}
                    className={`flex-1 py-4 rounded-[1.5rem] font-bold text-white flex items-center justify-center gap-2 transition-all ${!guideData.clientName ? 'bg-gray-300 cursor-not-allowed' : 'bg-agro-green shadow-lg shadow-agro-green/30 active:scale-95'}`}
                  >
                    <FileCheck size={20} /> Emitir Guia & Registar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NOTIFICATION CENTER */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => closeModal('notificationCenter')}
        notifications={notifications}
        onMarkAsRead={markNotificationRead}
        onMarkAllAsRead={() => notifications.forEach(n => markNotificationRead(n.id))}
        onClearHistory={() => { }} // Not implemented in slice yet, but could be a bulk delete
        onNavigate={(path) => {
          if (path.startsWith('app://')) {
            try {
              // Parse pseudo-protocol
              // Format: app://dashboard/map?lat=...&lng=...&sensorId=...
              // Actually we just need sensorId and tab
              const url = new URL(path);

              // Extract Params
              const params = new URLSearchParams(url.search);
              const sensorId = params.get('sensorId');

              if (url.hostname === 'dashboard' && url.pathname === '/map' && sensorId) {
                setActiveTab('cultivation'); // Switch to Cultivation/Map view
                useStore.getState().setFocusedTarget({ type: 'sensor', id: sensorId });
              }
            } catch (e) {
              console.error("Invalid deep link", path);
            }
          } else {
            setActiveTab(path as any);
          }
          closeModal('notificationCenter');
        }}
      />

      <InstallPrompt />

    </div>
  );
};

export default App;
