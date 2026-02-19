
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LayoutDashboard, Sprout, PawPrint, Package,
  Tractor, Wallet, Settings, Bell, X,
  FileText, Wifi, Plus, Save,
  Radio, Signal, Loader2, Droplets, Activity, CheckCircle2, ChevronDown,
  Truck, FileCheck, WifiOff, CloudOff, ArrowRight, QrCode, Calendar,
  Lock, Users
} from 'lucide-react';
import mqtt from 'mqtt';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { AppState, Field, StockItem, FieldLog, RegistryType, Sensor, Task, Animal, Machine, Transaction, MaintenanceLog, WeatherForecast, DetailedForecast, Employee, ProductBatch, UserProfile, Notification } from './types';
import { useStore } from './store/useStore';
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
import TaskProofModal from './components/TaskProofModal';
import { NotificationCenter } from './components/NotificationCenter';
import IoTPairingWizard from './components/IoTPairingWizard';
import CultivationView from './components/CultivationView';
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
    addAnimal, updateAnimal,
    addMachine, updateMachine,
    addTask, updateTask, deleteTask,
    addTransaction, addNotification, markNotificationRead,
    toggleIrrigation, addLogToField, registerSale, harvestField
  } = useStore();

  useWeatherSync();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

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
  }, []);

  // UI Local States
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);
  const [taskProofTask, setTaskProofTask] = useState<Task | null>(null);
  const [traceabilityBatch, setTraceabilityBatch] = useState<ProductBatch | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [saleStep, setSaleStep] = useState(1);
  const [saleData, setSaleData] = useState({
    stockId: '',
    quantity: '',
    clientName: '',
    clientNif: '',
    destination: '',
    plate: '',
    date: new Date().toISOString().split('T')[0],
    price: '',
    fieldId: ''
  });

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
    if (isSolarMode) {
      document.documentElement.classList.add('solar-mode');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('solar-mode');
      if (isDarkMode) document.documentElement.classList.add('dark');
    }
  }, [isSolarMode, isDarkMode]);

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
    const selectedStock = stocks.find(s => s.id === saleData.stockId);
    const selectedField = fields.find(f => f.id === saleData.fieldId);
    if (!selectedStock || !selectedField) return;

    handleRegisterSale({
      stockId: saleData.stockId,
      quantity: parseFloat(saleData.quantity),
      pricePerUnit: parseFloat(saleData.price),
      clientName: saleData.clientName,
      date: saleData.date,
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
    doc.text(saleData.clientName, 110, 48);
    doc.text(`NIF: ${saleData.clientNif || 'N/A'}`, 110, 53);
    doc.text(`Descarga: ${saleData.destination || 'Morada do Cliente'}`, 110, 58);
    doc.setFillColor(240, 240, 240);
    doc.rect(14, 65, 182, 15, 'F');
    doc.text(`Viatura: ${saleData.plate.toUpperCase()}`, 20, 75);
    doc.text(`Data Início: ${saleData.date}`, 120, 75);

    const tableRows = [[
      selectedStock.name,
      `${saleData.quantity} ${selectedStock.unit}`,
      `${saleData.price} €`,
      `${(parseFloat(saleData.quantity) * parseFloat(saleData.price)).toFixed(2)} €`
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
    doc.save(`Guia_Transporte_${saleData.clientName.replace(/\s/g, '_')}.pdf`);

    setShowGuideModal(false);
    setSaleStep(1);
    setSaleData({ stockId: '', quantity: '', clientName: '', clientNif: '', destination: '', plate: '', date: new Date().toISOString().split('T')[0], price: '', fieldId: '' });
  };

  const shouldHideNav = isChildModalOpen || isSettingsOpen || isNotificationCenterOpen || isTeamManagerOpen || !!taskProofTask || showGuideModal;

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
            onToggleTask={(id) => updateTask(id, { completed: !tasks.find(t => t.id === id)?.completed })}
            onAddTask={handleAddTask}
            onDeleteTask={deleteTask}
            onWeatherClick={() => setIsNotificationsOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenNotifications={() => setIsNotificationCenterOpen(true)}
            onModalChange={setIsChildModalOpen}
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
            onTaskClick={(task) => setTaskProofTask(task)}
            onNavigate={(tab) => setActiveTab(tab as any)}
            alertCount={alertCount}
          />
        )}
        {activeTab === 'animal' && (
          <AnimalCard
            animals={animals}
            onAddProduction={(id, prod: any) => {
              const animal = animals.find(a => a.id === id);
              if (!animal) return;
              updateAnimal(id, {
                productionHistory: [...(animal.productionHistory || []), prod],
                weight: prod.type === 'weight' ? prod.value : animal.weight
              });
            }}
            onAddAnimal={(a) => addAnimal({ ...a, id: Date.now().toString() })}
            onUpdateAnimal={updateAnimal}
            onScheduleTask={(title, type, date) => handleAddTask(title, type as any, date)}
            onModalChange={setIsChildModalOpen}
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
            onModalChange={setIsChildModalOpen}
            operatorName={userName}
            onRegisterSale={handleRegisterSale}
            onHarvest={handleHarvest}
            onViewTraceability={setTraceabilityBatch}
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
              onModalChange={setIsChildModalOpen}
              onOpenGuide={() => setShowGuideModal(true)}
            />
          ) : (
            <AccessDenied title="Stocks & Armazém" />
          )
        )}
        {activeTab === 'machines' && (
          <MachineManager
            machines={machines}
            stocks={stocks}
            onUpdateHours={(id, hours) => updateMachine(id, { engineHours: hours })}
            onAddLog={(id, log) => {
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
            onAddMachine={(m) => addMachine({ ...m, id: Date.now().toString(), logs: [] })}
            onModalChange={setIsChildModalOpen}
          />
        )}
        {activeTab === 'finance' && (
          currentUser.role === 'admin' ? (
            <FinanceManager
              transactions={transactions}
              stocks={stocks}
              onAddTransaction={(tx) => addTransaction({ ...tx, id: Date.now().toString() })}
              onModalChange={setIsChildModalOpen}
            />
          ) : (
            <AccessDenied title="Finanças" />
          )
        )}
      </main>

      {/* VOICE ASSISTANT FAB */}
      <VoiceAssistant onCommand={handleVoiceCommand} />

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 shadow-2xl rounded-[2.5rem] px-2 py-3 flex items-end justify-between z-40 w-[96%] max-w-sm md:max-w-md mx-auto backdrop-blur-md bg-opacity-90 dark:bg-opacity-90 transition-all duration-300 ease-in-out ${shouldHideNav ? 'translate-y-[200%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}>
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
          { id: 'cultivation', icon: Sprout, label: 'Cultivo' },
          { id: 'animal', icon: PawPrint, label: 'Animais' },
          { id: 'stocks', icon: Package, label: 'Stock', restricted: currentUser.role !== 'admin' },
          { id: 'machines', icon: Tractor, label: 'Frota' },
          { id: 'finance', icon: Wallet, label: 'Finanças', restricted: currentUser.role !== 'admin' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { haptics.light(); setActiveTab(tab.id as any); }}
            className={`transition-all duration-300 flex flex-col items-center justify-center rounded-2xl relative ${activeTab === tab.id
              ? 'bg-agro-green text-white shadow-lg shadow-agro-green/30 -translate-y-2 py-2 px-3 min-w-[56px] mb-1'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-transparent p-2 mb-1'
              }`}
          >
            {tab.restricted ? (
              <div className="relative">
                <tab.icon size={22} strokeWidth={2} className="opacity-50" />
                <div className="absolute -top-1 -right-1 bg-gray-200 dark:bg-neutral-700 rounded-full p-0.5">
                  <Lock size={8} className="text-gray-500" />
                </div>
              </div>
            ) : (
              <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            )}

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
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onResetData={() => hydrate()}
        currentName={userName}
        onSaveName={() => { }} // Name managed by Team Profile now
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setDarkMode(!isDarkMode)}
        isSolarMode={isSolarMode}
        onToggleSolarMode={() => setSolarMode(!isSolarMode)}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
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
          onClick={() => { setIsSettingsOpen(false); setIsTeamManagerOpen(true); }}
          className="fixed top-24 right-6 z-[160] bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg animate-slide-left flex items-center gap-2"
        >
          <Users size={16} /> Equipa
        </button>
      )}

      {isTeamManagerOpen && (
        <TeamManager
          users={users}
          currentUser={currentUser}
          onSwitchUser={(id) => setCurrentUserId(id)}
          onClose={() => setIsTeamManagerOpen(false)}
        />
      )}

      {taskProofTask && (
        <TaskProofModal
          isOpen={!!taskProofTask}
          onClose={() => setTaskProofTask(null)}
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
          onClose={() => setTraceabilityBatch(null)}
          batch={traceabilityBatch}
        />
      )}

      {/* --- e-GUIAS MODAL (GLOBAL) --- */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowGuideModal(false)}>
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
              <button onClick={() => setShowGuideModal(false)} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                <X size={20} className="dark:text-white" />
              </button>
            </div>

            {saleStep === 1 ? (
              <div className="space-y-5">
                {/* Field Selector (Location) */}
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Local de Carga (Parcela)</label>
                  <select
                    value={saleData.fieldId}
                    onChange={(e) => setSaleData({ ...saleData, fieldId: e.target.value })}
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
                    value={saleData.stockId}
                    onChange={(e) => setSaleData({ ...saleData, stockId: e.target.value })}
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
                      value={saleData.quantity}
                      onChange={(e) => setSaleData({ ...saleData, quantity: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Preço Un. (€)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                      value={saleData.price}
                      onChange={(e) => setSaleData({ ...saleData, price: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setSaleStep(2)}
                  disabled={!saleData.stockId || !saleData.quantity || !saleData.price || !saleData.fieldId}
                  className={`w-full py-4 rounded-[1.5rem] font-bold text-white flex items-center justify-center gap-2 mt-4 transition-all ${!saleData.stockId || !saleData.quantity || !saleData.fieldId ? 'bg-gray-300 dark:bg-neutral-800 cursor-not-allowed text-gray-500' : 'bg-orange-500 shadow-lg shadow-orange-500/30 active:scale-95'}`}
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
                    value={saleData.clientName}
                    onChange={(e) => setSaleData({ ...saleData, clientName: e.target.value })}
                  />
                  <input
                    placeholder="NIF (Opcional)"
                    className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                    value={saleData.clientNif}
                    onChange={(e) => setSaleData({ ...saleData, clientNif: e.target.value })}
                  />
                </div>

                {/* Transport Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Matrícula</label>
                    <input
                      placeholder="AA-00-BB"
                      className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none uppercase focus:ring-2 focus:ring-orange-500"
                      value={saleData.plate}
                      onChange={(e) => setSaleData({ ...saleData, plate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Data</label>
                    <input
                      type="date"
                      className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                      value={saleData.date}
                      onChange={(e) => setSaleData({ ...saleData, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setSaleStep(1)} className="px-6 py-4 bg-gray-200 dark:bg-neutral-800 rounded-[1.5rem] font-bold text-gray-600 dark:text-gray-300">Voltar</button>
                  <button
                    onClick={generateGuidePDF}
                    disabled={!saleData.clientName || !saleData.plate}
                    className={`flex-1 py-4 rounded-[1.5rem] font-bold text-white flex items-center justify-center gap-2 transition-all ${!saleData.clientName ? 'bg-gray-300 cursor-not-allowed' : 'bg-agro-green shadow-lg shadow-agro-green/30 active:scale-95'}`}
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
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={notifications}
        onMarkAsRead={markNotificationRead}
        onMarkAllAsRead={() => notifications.forEach(n => markNotificationRead(n.id))}
        onClearHistory={() => { }} // Not implemented in slice yet, but could be a bulk delete
        onNavigate={(path) => {
          setActiveTab(path as any);
          setIsNotificationCenterOpen(false);
        }}
      />

      <InstallPrompt />

    </div>
  );
};

export default App;
