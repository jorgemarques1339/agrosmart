
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Home, Leaf, ScanLine, Package, PieChart, 
  Settings, Bell, Plus, Minus, Droplets, Map as MapIcon, 
  Navigation, Tractor, AlertTriangle, CloudRain, Thermometer,
  Wind, MapPin, Brain, Scan, Camera, Sprout, CheckCircle, AlertCircle,
  X, ChevronRight, Activity, Loader2, Save, FileText, Wifi, WifiOff, RefreshCw, CloudOff,
  Radio, Cpu, CheckCircle2, Smartphone, Tag, Signal
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import mqtt from 'mqtt';
import L from 'leaflet';

import { AppState, Animal, Field, StockItem, Task, Transaction, WeatherForecast, FieldLog, Machine, MaintenanceLog, Sensor } from './types';
import { INITIAL_WEATHER, MQTT_BROKER, MQTT_TOPIC_PREFIX, MOCK_STATE, STORAGE_KEY } from './constants';
import { loadState, saveState } from './services/storageService';
import SettingsModal from './components/SettingsModal';
import NotificationsModal from './components/NotificationsModal';
import AnimalCard from './components/AnimalCard';
import StockManager from './components/StockManager';
import FieldCard from './components/FieldCard';
import FinanceManager from './components/FinanceManager';
import DashboardHome from './components/DashboardHome';
import FieldNotebook from './components/FieldNotebook';
import MachineManager from './components/MachineManager';

// --- Corrigir Ícones do Leaflet ---
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
});

// --- Constantes ---
const CROP_TYPES = [
  { label: 'Milho', emoji: '🌽' },
  { label: 'Vinha', emoji: '🍇' },
  { label: 'Trigo', emoji: '🌾' },
  { label: 'Olival', emoji: '🫒' },
  { label: 'Batata', emoji: '🥔' },
  { label: 'Girassol', emoji: '🌻' },
  { label: 'Hortícola', emoji: '🥬' },
  { label: 'Fruta', emoji: '🍎' },
];

const WEATHER_API_KEY = "c7f76605724ecafb54933077ede4166a";

// --- Componente Global: IoT Pairing Wizard ---
const IoTPairingWizard = ({ onClose, onPair, fields }: { onClose: () => void, onPair: (fieldId: string, s: Sensor) => void, fields: Field[] }) => {
  const [step, setStep] = useState<'scan' | 'found' | 'select_field' | 'connecting' | 'success'>('scan');
  const [foundDevice, setFoundDevice] = useState<Partial<Sensor> | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');

  // Simular processo de scanning
  useEffect(() => {
    if (step === 'scan') {
      const timer = setTimeout(() => {
        setFoundDevice({
          id: `sensor-${Math.floor(Math.random() * 1000)}`,
          type: 'moisture',
          name: 'Oriva-Sense-X1',
          batteryLevel: 100,
          signalStrength: 95,
          status: 'online'
        });
        setStep('found');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleDeviceFound = () => {
    setStep('select_field');
  };

  const handleConnect = () => {
    if (!selectedFieldId) return;
    
    setStep('connecting');
    setTimeout(() => {
      if (foundDevice) {
        onPair(selectedFieldId, {
          ...foundDevice,
          lastSeen: new Date().toISOString()
        } as Sensor);
        setStep('success');
        setTimeout(onClose, 1500);
      }
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-6">
      <div className="bg-black border border-green-500/30 w-full max-w-sm rounded-[2rem] p-8 shadow-[0_0_50px_rgba(0,255,0,0.1)] relative overflow-hidden text-green-500 font-mono">
        
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0, 255, 0, .3) 25%, rgba(0, 255, 0, .3) 26%, transparent 27%, transparent 74%, rgba(0, 255, 0, .3) 75%, rgba(0, 255, 0, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 255, 0, .3) 25%, rgba(0, 255, 0, .3) 26%, transparent 27%, transparent 74%, rgba(0, 255, 0, .3) 75%, rgba(0, 255, 0, .3) 76%, transparent 77%, transparent)', backgroundSize: '30px 30px' }}></div>

        <button onClick={onClose} className="absolute top-4 right-4 text-green-700 hover:text-green-400">
          <X size={24} />
        </button>

        {step === 'scan' && (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="relative w-32 h-32 flex items-center justify-center mb-8">
               <div className="absolute inset-0 border-2 border-green-500/30 rounded-full animate-ping"></div>
               <div className="absolute inset-0 border-2 border-green-500/50 rounded-full animate-pulse"></div>
               <Radio size={48} className="text-green-400" />
            </div>
            <h3 className="text-xl font-bold animate-pulse">A procurar sinal...</h3>
            <p className="text-xs text-green-700 mt-2">Mantenha o dispositivo próximo</p>
          </div>
        )}

        {step === 'found' && foundDevice && (
          <div className="animate-slide-up">
            <h3 className="text-lg font-bold mb-6 text-center border-b border-green-900 pb-4">Dispositivo Encontrado</h3>
            <div className="bg-green-900/20 p-4 rounded-xl border border-green-500/30 mb-6 flex items-center gap-4">
               <div className="w-12 h-12 bg-green-900/40 rounded-full flex items-center justify-center">
                 <Cpu size={24} />
               </div>
               <div>
                 <p className="font-bold text-white">{foundDevice.name}</p>
                 <p className="text-xs text-green-600">ID: {foundDevice.id}</p>
               </div>
               <div className="ml-auto flex flex-col items-end">
                 <Wifi size={16} />
                 <span className="text-[10px]">{foundDevice.signalStrength}%</span>
               </div>
            </div>
            <button 
              onClick={handleDeviceFound}
              className="w-full py-4 bg-green-600 text-black font-bold rounded-xl hover:bg-green-500 transition-colors shadow-[0_0_20px_rgba(34,197,94,0.4)]"
            >
              Configurar
            </button>
          </div>
        )}

        {step === 'select_field' && (
          <div className="animate-slide-up">
             <h3 className="text-lg font-bold mb-4 text-center border-b border-green-900 pb-4">Associar a Cultivo</h3>
             <p className="text-xs text-green-600 mb-4 text-center">Selecione onde este sensor será instalado:</p>
             
             <div className="space-y-2 mb-6 max-h-[200px] overflow-y-auto custom-scrollbar">
                {fields.map(f => (
                  <button 
                    key={f.id}
                    onClick={() => setSelectedFieldId(f.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedFieldId === f.id 
                        ? 'bg-green-600 text-black border-green-400' 
                        : 'bg-green-900/10 border-green-900 text-green-400 hover:bg-green-900/20'
                    }`}
                  >
                    <span className="font-bold">{f.name}</span>
                    <span className="block text-[10px] opacity-70">{f.crop}</span>
                  </button>
                ))}
             </div>

             <button 
              onClick={handleConnect}
              disabled={!selectedFieldId}
              className={`w-full py-4 font-bold rounded-xl transition-colors shadow-[0_0_20px_rgba(34,197,94,0.4)] ${
                selectedFieldId ? 'bg-green-600 text-black hover:bg-green-500' : 'bg-green-900/30 text-green-800 cursor-not-allowed'
              }`}
            >
              Concluir Emparelhamento
            </button>
          </div>
        )}

        {step === 'connecting' && (
          <div className="flex flex-col items-center justify-center py-12">
             <Loader2 size={48} className="animate-spin text-green-400 mb-4" />
             <p className="text-sm">A estabelecer handshake...</p>
             <p className="text-xs text-green-800 mt-2">A provisionar chaves MQTT</p>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-10 animate-scale-up">
             <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-black mb-6 shadow-[0_0_30px_#22c55e]">
               <CheckCircle2 size={40} />
             </div>
             <h3 className="text-2xl font-bold text-white">Conectado!</h3>
             <p className="text-sm text-green-600 mt-2">Recebendo telemetria...</p>
          </div>
        )}

      </div>
    </div>
  );
};

// --- Componentes ---

// 1. Navegação Inferior (Bottom Navigation)
// Implementação Flutuante Otimizada com Textos
const BottomNav = ({ activeTab, setTab }: { activeTab: string, setTab: (t: string) => void }) => {
  const tabs = [
    { id: 'dashboard', icon: Home, label: 'Início' },
    { id: 'animal', icon: ScanLine, label: 'Animal' },
    { id: 'cultivation', icon: Leaf, label: 'Cultivo' },
    { id: 'machines', icon: Tractor, label: 'Máq.' }, // Shortened for small screens
    { id: 'stocks', icon: Package, label: 'Stock' },
    { id: 'accounts', icon: PieChart, label: 'Contas' },
  ];

  return (
    // Container fixo flutuante
    <div className="fixed bottom-3 left-2 right-2 z-[100] pointer-events-none animate-slide-up">
      <div className="mx-auto max-w-lg pointer-events-auto">
        <nav className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-white/20 dark:border-neutral-800 shadow-2xl rounded-[2.5rem] py-3 px-1 flex items-end justify-between">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className="group flex-1 flex flex-col items-center justify-end gap-1 transition-all duration-300 active:scale-95 touch-manipulation"
              >
                {/* Icon Container */}
                <div className={`p-2.5 rounded-2xl transition-all duration-300 ${
                   isActive 
                   ? 'bg-agro-green text-white shadow-lg shadow-agro-green/30 -translate-y-1' 
                   : 'text-gray-400 dark:text-gray-500 group-hover:bg-gray-50 dark:group-hover:bg-neutral-800'
                }`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                
                {/* Label */}
                <span className={`text-[9px] font-bold tracking-wide transition-all duration-300 ${
                  isActive 
                  ? 'text-agro-green dark:text-green-400 opacity-100' 
                  : 'text-gray-400 opacity-70'
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

// 4. Visualização Cultivo
const CultivationView = ({ 
  fields, 
  stocks,
  toggleIrrigation, 
  onAddLog,
  onUseStock,
  onAddField,
  onRegisterSensor,
  onModalChange,
  operatorName
}: { 
  fields: Field[], 
  stocks: StockItem[],
  toggleIrrigation: (id: string, s: boolean) => void,
  onAddLog: (fieldId: string, log: Omit<FieldLog, 'id'>) => void,
  onUseStock: (fieldId: string, stockId: string, quantity: number, date: string) => void,
  onAddField: (field: Pick<Field, 'name' | 'areaHa' | 'crop' | 'emoji'>) => void,
  onRegisterSensor: (fieldId: string, sensor: Sensor) => void,
  onModalChange?: (isOpen: boolean) => void,
  operatorName: string
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [showIoTWizard, setShowIoTWizard] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newArea, setNewArea] = useState('');
  const [selectedCrop, setSelectedCrop] = useState(CROP_TYPES[0]);

  // Notificar o pai quando o estado do modal muda
  useEffect(() => {
    if (onModalChange) {
      onModalChange(isModalOpen || isNotebookOpen || showIoTWizard);
    }
  }, [isModalOpen, isNotebookOpen, showIoTWizard, onModalChange]);

  const handleSubmit = () => {
    if (newName && newArea) {
      onAddField({
        name: newName,
        areaHa: parseFloat(newArea),
        crop: selectedCrop.label,
        emoji: selectedCrop.emoji
      });
      setIsModalOpen(false);
      setNewName('');
      setNewArea('');
      setSelectedCrop(CROP_TYPES[0]);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pt-4">
      
      {/* Control Section Header - Centered Buttons Dock, Title Removed */}
      <div className="flex justify-center items-center px-2 mb-4">
        <div className="flex gap-5 bg-white/60 dark:bg-neutral-900/60 p-3 rounded-[2.5rem] border border-white/20 shadow-sm backdrop-blur-md">
           {/* Botão Caderno de Campo */}
           <div className="flex flex-col items-center gap-1">
             <button 
               onClick={() => setIsNotebookOpen(true)}
               className="w-12 h-12 rounded-full bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-300 shadow-md border border-gray-100 dark:border-neutral-700 flex items-center justify-center active:scale-95 transition-transform"
               title="Caderno de Campo"
             >
               <FileText size={22} />
             </button>
             <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">Registo</span>
           </div>

           {/* Botão IoT Pairing (NEW) */}
           <div className="flex flex-col items-center gap-1">
             <button 
               onClick={() => setShowIoTWizard(true)}
               className="w-12 h-12 rounded-full bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-300 shadow-md border border-gray-100 dark:border-neutral-700 flex items-center justify-center active:scale-95 transition-transform"
               title="Adicionar Sensor IoT"
             >
               <Wifi size={22} />
             </button>
             <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">IoT</span>
           </div>

           {/* Botão Adicionar Campo */}
           <div className="flex flex-col items-center gap-1">
             <button 
               onClick={() => setIsModalOpen(true)}
               className="w-12 h-12 rounded-full bg-agro-green text-white shadow-lg shadow-agro-green/30 flex items-center justify-center active:scale-95 transition-transform"
             >
               <Plus size={24} />
             </button>
             <span className="text-[10px] font-bold text-agro-green dark:text-green-400 whitespace-nowrap">Novo</span>
           </div>
        </div>
      </div>

      {/* Field Cards List */}
      <div className="space-y-4">
        {fields.map(field => (
          <FieldCard 
            key={field.id}
            field={field}
            stocks={stocks}
            onToggleIrrigation={toggleIrrigation}
            onAddLog={onAddLog}
            onUseStock={onUseStock}
            onRegisterSensor={onRegisterSensor}
          />
        ))}
      </div>

      {/* ADD FIELD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)}>
          <div 
            className="bg-white dark:bg-neutral-900 w-full max-w-md p-6 rounded-t-[2.5rem] shadow-2xl animate-slide-up border-t border-white/20" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold dark:text-white">Novo Cultivo</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                <X size={20} className="dark:text-white" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Nome */}
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 ml-2">Nome do Campo</label>
                <input 
                  autoFocus
                  className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl mt-1 dark:text-white border-2 border-transparent focus:border-agro-green outline-none text-lg font-bold"
                  placeholder="Ex: Vinha Norte"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
              </div>

              {/* Área */}
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 ml-2">Área (Hectares)</label>
                <div className="relative">
                  <input 
                    type="number"
                    inputMode="decimal"
                    className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl mt-1 dark:text-white outline-none text-lg font-bold"
                    placeholder="0.0"
                    value={newArea}
                    onChange={e => setNewArea(e.target.value)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold bg-gray-200 dark:bg-neutral-700 px-2 py-1 rounded-lg text-xs">
                    ha
                  </span>
                </div>
              </div>

              {/* Tipo de Cultura Grid */}
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 ml-2">Tipo de Cultura</label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {CROP_TYPES.map((crop) => (
                    <button
                      key={crop.label}
                      onClick={() => setSelectedCrop(crop)}
                      className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all border-2 ${
                        selectedCrop.label === crop.label
                          ? 'bg-agro-green/10 border-agro-green'
                          : 'bg-gray-50 dark:bg-neutral-800 border-transparent hover:bg-gray-100 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <span className="text-2xl mb-1">{crop.emoji}</span>
                      <span className={`text-[10px] font-bold ${selectedCrop.label === crop.label ? 'text-agro-green' : 'text-gray-500'}`}>
                        {crop.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={!newName || !newArea}
                className={`w-full py-4 rounded-[1.5rem] font-bold text-lg shadow-lg flex items-center justify-center gap-2 mt-4 transition-all ${
                  !newName || !newArea 
                    ? 'bg-gray-300 dark:bg-neutral-800 text-gray-500 cursor-not-allowed' 
                    : 'bg-agro-green text-white active:scale-95 shadow-agro-green/30'
                }`}
              >
                <Save size={20} />
                Criar Cultivo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FIELD NOTEBOOK COMPONENT */}
      <FieldNotebook 
        isOpen={isNotebookOpen}
        onClose={() => setIsNotebookOpen(false)}
        fields={fields}
        operatorName={operatorName}
      />

      {/* IOT PAIRING WIZARD */}
      {showIoTWizard && (
        <IoTPairingWizard 
          onClose={() => setShowIoTWizard(false)}
          fields={fields}
          onPair={(fieldId, sensor) => {
            onRegisterSensor(fieldId, sensor);
          }}
        />
      )}
    </div>
  );
};

// --- APP PRINCIPAL ---
const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [state, setState] = useState<AppState>(loadState());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  // Using Oriva key
  const [userName, setUserName] = useState(() => localStorage.getItem('oriva_username') || 'Sr. Silva');
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  
  // Real Weather State
  const [weatherData, setWeatherData] = useState<WeatherForecast[]>(INITIAL_WEATHER);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [alertActive, setAlertActive] = useState<string | null>(null);

  // Connectivity & Sync State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueueCount, setSyncQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showOnlineSuccess, setShowOnlineSuccess] = useState(true); // Inicializa a true para feedback de arranque

  // Audio Ref for Alarm
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);

  // --- DARK MODE ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      // Using Oriva key
      return localStorage.getItem('oriva_theme') === 'dark' || 
        (!localStorage.getItem('oriva_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // --- SOLAR MODE (HIGH CONTRAST) ---
  const [isSolarMode, setIsSolarMode] = useState(() => {
    if (typeof window !== 'undefined') {
      // Using Oriva key
      return localStorage.getItem('oriva_solar') === 'true';
    }
    return false;
  });

  // Handler para ocultar a barra de navegação quando modais estão abertos nos filhos
  const handleChildModalChange = (isOpen: boolean) => {
    setIsChildModalOpen(isOpen);
  };

  // Assegurar que a barra volta quando se muda de tab e reset do estado child
  useEffect(() => {
    setIsChildModalOpen(false);
    if (!isSettingsOpen && !isNotificationsOpen) {
      setIsTabBarVisible(true);
    }
  }, [activeTab]);

  // Gestão centralizada da visibilidade da barra de navegação
  useEffect(() => {
    const shouldHide = isSettingsOpen || isNotificationsOpen || isChildModalOpen;
    setIsTabBarVisible(!shouldHide);
  }, [isSettingsOpen, isNotificationsOpen, isChildModalOpen]);

  // Connectivity Listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineSuccess(true); // Mostrar barra verde

      if (syncQueueCount > 0) {
        setIsSyncing(true);
        // Simular tempo de sync com a cloud
        setTimeout(() => {
          setIsSyncing(false);
          setSyncQueueCount(0);
          // Esconder mensagem de sucesso após sync
          setTimeout(() => setShowOnlineSuccess(false), 2500);
        }, 2000);
      } else {
        // Se não houver nada para sync, esconder após breve delay
        setTimeout(() => setShowOnlineSuccess(false), 2500);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineSuccess(false); // Reset imediato do sucesso
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check timeout for startup feedback
    setTimeout(() => {
       if (navigator.onLine && syncQueueCount === 0) {
         setShowOnlineSuccess(false);
       }
    }, 2500);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncQueueCount]);

  // Helper para rastrear ações offline
  const trackOfflineAction = () => {
    if (!isOnline) {
      setSyncQueueCount(prev => prev + 1);
    }
  };

  // Apply Dark Mode Class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('oriva_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('oriva_theme', 'light');
    }
  }, [isDarkMode]);

  // Apply Solar Mode Class
  useEffect(() => {
    if (isSolarMode) {
      document.documentElement.classList.add('solar');
      localStorage.setItem('oriva_solar', 'true');
    } else {
      document.documentElement.classList.remove('solar');
      localStorage.setItem('oriva_solar', 'false');
    }
  }, [isSolarMode]);

  // Handlers para Toggles Exclusivos
  const toggleDarkMode = () => {
    if (!isDarkMode) {
      // Se ativar Dark, desativa Solar
      setIsSolarMode(false);
    }
    setIsDarkMode(!isDarkMode);
  };

  const toggleSolarMode = () => {
    if (!isSolarMode) {
      // Se ativar Solar, desativa Dark
      setIsDarkMode(false);
    }
    setIsSolarMode(!isSolarMode);
  };

  // Persist User Name
  useEffect(() => {
    localStorage.setItem('oriva_username', userName);
  }, [userName]);

  // --- WEATHER & ALERTS INTEGRATION ---
  
  // Initialize Alarm Audio
  useEffect(() => {
    // Simple beep/siren sound (base64 for offline capability)
    // Este é um som de alerta simples e contínuo
    const sirenUrl = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; // Placeholder curto
    // Usaremos um objeto Audio real, mas para demo vou simular o disparo
    alarmAudioRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
    alarmAudioRef.current.loop = true;
  }, []);

  const triggerAlert = useCallback((type: 'frost' | 'wind') => {
    // 1. Vibration
    if (navigator.vibrate) {
      navigator.vibrate([1000, 500, 1000]); // Vibrate pattern
    }

    // 2. Sound (Only if interaction allowed or already playing)
    if (alarmAudioRef.current) {
      alarmAudioRef.current.play().catch(e => console.log("Audio play prevented by browser policy", e));
    }

    setAlertActive(type === 'frost' ? '❄️ Alerta de Geada! Temperatura Crítica.' : '💨 Alerta de Vento Forte!');
  }, []);

  const stopAlert = () => {
    if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current.currentTime = 0;
    }
    setAlertActive(null);
  };

  const fetchWeather = async (lat: number, lon: number) => {
    // Ignorar fetch se offline
    if (!navigator.onLine) return;

    setWeatherLoading(true);
    try {
      // 1. Current Weather
      const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=pt&appid=${WEATHER_API_KEY}`);
      const currentData = await currentRes.json();

      // 2. Forecast (5 Days / 3 Hour)
      const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=pt&appid=${WEATHER_API_KEY}`);
      const forecastData = await forecastRes.json();

      if (currentData && forecastData.list) {
        // --- ALERT CHECK LOGIC ---
        // Frost Check (< 2 C)
        if (currentData.main.temp < 2) {
          triggerAlert('frost');
        } 
        // Wind Check (> 30 km/h) -> API returns m/s. 30km/h ~= 8.33 m/s
        else if (currentData.wind.speed > 8.33) {
          triggerAlert('wind');
        } else {
          // If safe, verify if we should stop an existing alert
          // (Simple version: manual stop only via UI usually, but here we reset if safe)
          // stopAlert(); // Optional: Auto-stop
        }

        // Map API data to App Types
        const mapCondition = (id: number): 'sunny' | 'cloudy' | 'rain' | 'storm' => {
          if (id >= 200 && id < 600) return 'rain';
          if (id >= 600 && id < 700) return 'storm'; // Snow maps to storm icon for visual urgency
          if (id >= 801) return 'cloudy';
          return 'sunny';
        };

        const today: WeatherForecast = {
          day: 'Agora',
          temp: Math.round(currentData.main.temp),
          condition: mapCondition(currentData.weather[0].id),
          description: currentData.weather[0].description,
          windSpeed: Math.round(currentData.wind.speed * 3.6), // m/s to km/h
          humidity: currentData.main.humidity
        };

        // Filter forecast to get 1 entry per day (approx noon)
        const daily: WeatherForecast[] = forecastData.list
          .filter((item: any) => item.dt_txt.includes('12:00:00'))
          .slice(0, 4)
          .map((item: any) => ({
            day: new Date(item.dt * 1000).toLocaleDateString('pt-PT', { weekday: 'short' }).replace('.', ''),
            temp: Math.round(item.main.temp),
            condition: mapCondition(item.weather[0].id),
            description: item.weather[0].description
          }));

        setWeatherData([today, ...daily]);
      }
    } catch (error) {
      console.error("Weather fetch failed", error);
    } finally {
      setWeatherLoading(false);
    }
  };

  // Initial Fetch & Geo
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (err) => {
          console.error("Geo error", err);
          // Fallback location (Laundos)
          fetchWeather(41.442, -8.723); 
        }
      );
    } else {
      fetchWeather(41.442, -8.723);
    }

    // --- CRITICAL MONITORING LOOP ---
    // Check weather every 15 minutes (900000ms) to save battery but keep safe
    const interval = setInterval(() => {
       if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((p) => fetchWeather(p.coords.latitude, p.coords.longitude));
       }
    }, 900000); 

    return () => clearInterval(interval);
  }, []);


  // MQTT Logic (Existing)
  useEffect(() => {
    if (!isOnline) return; // Skip MQTT if offline

    const client = mqtt.connect(MQTT_BROKER);
    
    client.on('connect', () => {
      console.log('Connected to MQTT Broker');
      // Using Oriva prefix
      client.subscribe(`${MQTT_TOPIC_PREFIX}/+/humidity`);
    });

    client.on('message', (topic, message) => {
      // Topic format: oriva/fields/{FIELD_ID}/humidity
      const parts = topic.split('/');
      const fieldId = parts[2];
      const humidityVal = parseFloat(message.toString());

      setState(prev => {
        const newFields = prev.fields.map(f => {
          if (f.id === fieldId) return { ...f, humidity: humidityVal };
          return f;
        });
        return { ...prev, fields: newFields };
      });
    });

    return () => { client.end(); };
  }, [isOnline]);

  // Persist State
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Compute Alert Count for Dashboard Header
  const alertCount = useMemo(() => {
    let count = 0;
    // Weather
    if (weatherData[0]?.condition === 'rain' || weatherData[0]?.condition === 'storm' || alertActive) count++;
    // Animals
    count += state.animals.filter(a => a.status === 'sick').length;
    // Fields
    count += state.fields.filter(f => f.humidity < 30 || f.healthScore < 70).length;
    // Stocks
    count += state.stocks.filter(s => s.quantity <= s.minStock).length;
    // Machines (Agora inclui Alertas Preditivos < 50h)
    count += (state.machines || []).filter(m => (m.engineHours - m.lastServiceHours) > (m.serviceInterval - 50)).length;
    return count;
  }, [state, weatherData, alertActive]);

  // --- NEW INTEGRATION LOGIC: Stock -> Field -> Finance ---
  const handleUseStockOnField = (fieldId: string, stockId: string, quantity: number, date: string) => {
    trackOfflineAction();
    // 1. Encontrar o Stock
    const stockItem = state.stocks.find(s => s.id === stockId);
    if(!stockItem) return;

    // 2. Calcular Custo Total (Valorização do stock usado)
    const totalCost = stockItem.pricePerUnit * quantity;

    // 3. Atualizar Stock (Decrementar)
    const newStocks = state.stocks.map(s => 
      s.id === stockId ? { ...s, quantity: Math.max(0, s.quantity - quantity) } : s
    );

    // 4. Adicionar Log ao Campo (com custo e quantidade)
    const field = state.fields.find(f => f.id === fieldId);
    const newLog: FieldLog = {
      id: Date.now().toString(),
      date,
      type: 'treatment', // Assumimos tratamento por defeito para uso de stock
      description: `Aplicação: ${stockItem.name}`,
      cost: totalCost,
      quantity: quantity,
      unit: stockItem.unit
    };
    
    const newFields = state.fields.map(f => 
      f.id === fieldId ? { ...f, logs: [...(f.logs || []), newLog] } : f
    );

    // 5. Adicionar Transação Financeira (Despesa Alocada)
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      date,
      type: 'expense',
      amount: totalCost,
      category: 'Campo', // Categoria genérica para alocação de custos de campo
      description: `Aplicação ${field ? field.name : 'Campo'}: ${stockItem.name} (${quantity}${stockItem.unit})`
    };

    // Atualizar Estado Global de uma só vez
    setState(prev => ({
      ...prev,
      stocks: newStocks,
      fields: newFields,
      transactions: [newTransaction, ...prev.transactions]
    }));
  };

  // Actions with Offline Tracking
  const toggleTask = (id: string) => {
    trackOfflineAction();
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    // LOGIC: If completing a task with linked resources that hasn't been deducted yet
    if (!task.completed && task.relatedFieldId && task.relatedStockId && task.plannedQuantity && !task.resourceDeducted) {
       // Execute the business logic for stock and fields
       handleUseStockOnField(
          task.relatedFieldId, 
          task.relatedStockId, 
          task.plannedQuantity, 
          new Date().toISOString().split('T')[0]
       );
       
       // Update task state (mark as completed AND deducted)
       setState(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: true, resourceDeducted: true } : t)
       }));
    } else {
       // Standard toggle for normal tasks or unchecking
       setState(prev => ({
         ...prev,
         tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
       }));
    }
  };

  const addTask = (title: string, type: 'task' | 'harvest', date?: string, relatedFieldId?: string, relatedStockId?: string, plannedQuantity?: number) => {
    trackOfflineAction();
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      type,
      date: date || new Date().toISOString().split('T')[0],
      completed: false,
      relatedFieldId,
      relatedStockId,
      plannedQuantity,
      resourceDeducted: false
    };
    setState(prev => ({
      ...prev,
      tasks: [newTask, ...prev.tasks]
    }));
  };

  const deleteTask = (id: string) => {
    trackOfflineAction();
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id)
    }));
  };

  // Add Action for Animal Updates (Notes, etc)
  const updateAnimal = (id: string, updates: Partial<Animal>) => {
    trackOfflineAction();
    setState(prev => ({
      ...prev,
      animals: prev.animals.map(a => a.id === id ? { ...a, ...updates } : a)
    }));
  };

  const addProduction = (animalId: string, value: number, type: 'milk' | 'weight') => {
    trackOfflineAction();
    const date = new Date().toISOString().split('T')[0];
    setState(prev => ({
      ...prev,
      animals: prev.animals.map(a => 
        a.id === animalId 
        ? { ...a, productionHistory: [...a.productionHistory, { date, value, type }] } 
        : a
      )
    }));
  };

  const toggleIrrigation = (fieldId: string, status: boolean) => {
    trackOfflineAction();
    setState(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === fieldId ? { ...f, irrigationStatus: status } : f)
    }));
    // Publish to MQTT using ORIVA prefix
    console.log(`MQTT Pub: ${MQTT_TOPIC_PREFIX}/${fieldId}/irrigation -> ${status}`);
  };

  // Add New Field
  const addField = (fieldData: Pick<Field, 'name' | 'areaHa' | 'crop' | 'emoji'>) => {
    trackOfflineAction();
    const newField: Field = {
      id: Date.now().toString(),
      ...fieldData,
      yieldPerHa: 0, // Default
      coordinates: [41.442 + (Math.random() * 0.01), -8.723 + (Math.random() * 0.01)], // Random nearby location
      polygon: [
        [41.442, -8.723], 
        [41.443, -8.721], 
        [41.441, -8.720]
      ], // Mock geometry
      irrigationStatus: false,
      humidity: 50,
      temp: 20,
      healthScore: 100,
      harvestWindow: 'A calcular...',
      history: [],
      logs: []
    };
    setState(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
  };

  const updateStock = (id: string, delta: number) => {
     trackOfflineAction();
     setState(prev => ({
       ...prev,
       stocks: prev.stocks.map(s => s.id === id ? { ...s, quantity: Math.max(0, s.quantity + delta) } : s)
     }));
  };

  const addStock = (item: Omit<StockItem, 'id'>) => {
    trackOfflineAction();
    const newItem: StockItem = { ...item, id: Date.now().toString(), minStock: 10, pricePerUnit: 0 };
    // Auto-generate expense transaction
    const transaction: Transaction = {
       id: Date.now().toString(),
       date: new Date().toISOString().split('T')[0],
       type: 'expense',
       amount: item.pricePerUnit * item.quantity,
       category: 'Stock',
       description: `Compra: ${item.name}`
    };
    
    setState(prev => ({
      ...prev,
      stocks: [...prev.stocks, newItem],
      transactions: [transaction, ...prev.transactions]
    }));
  };

  const editStock = (id: string, updates: Partial<StockItem>) => {
    trackOfflineAction();
    setState(prev => ({
      ...prev,
      stocks: prev.stocks.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  };

  const handleAddLog = (fieldId: string, log: Omit<FieldLog, 'id'>) => {
    trackOfflineAction();
    const newLog: FieldLog = { ...log, id: Date.now().toString() };
    setState(prev => ({
      ...prev,
      fields: prev.fields.map(f => 
        f.id === fieldId 
        ? { ...f, logs: [...(f.logs || []), newLog] } 
        : f
      )
    }));
  };

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    trackOfflineAction();
    const newTx: Transaction = { ...transaction, id: Date.now().toString() };
    setState(prev => ({
      ...prev,
      transactions: [newTx, ...prev.transactions]
    }));
  };

  // Add Animal Action
  const addAnimal = (animalData: Omit<Animal, 'id'>) => {
    trackOfflineAction();
    const newAnimal: Animal = {
      ...animalData,
      id: Date.now().toString(),
    };
    setState(prev => ({
      ...prev,
      animals: [...prev.animals, newAnimal]
    }));
  };

  // Machine Actions
  const updateMachineHours = (id: string, hours: number) => {
    trackOfflineAction();
    setState(prev => ({
      ...prev,
      machines: (prev.machines || []).map(m => m.id === id ? { ...m, engineHours: hours } : m)
    }));
  };

  const addMachineLog = (machineId: string, log: Omit<MaintenanceLog, 'id'>) => {
    trackOfflineAction();
    const newLog: MaintenanceLog = { ...log, id: Date.now().toString() };
    
    // Auto generate expense
    if (log.cost > 0) {
      const machine = state.machines?.find(m => m.id === machineId);
      addTransaction({
        date: log.date,
        type: 'expense',
        amount: log.cost,
        category: log.type === 'fuel' ? 'Combustível' : 'Manutenção',
        description: `${machine?.name || 'Máquina'}: ${log.description}`
      });
    }

    // Deduct Fuel from Stock
    // Esta lógica garante que se o agricultor disser que abasteceu, isso sai do inventário
    if (log.type === 'fuel' && log.quantity) {
       const qtyToDeduct = log.quantity;
       setState(prev => ({
         ...prev,
         stocks: prev.stocks.map(s => {
           // Procura inteligente por items de combustível
           // Verifica categoria 'Combustível' OU nomes comuns como 'gasóleo', 'diesel'
           if (s.category === 'Combustível' || s.name.toLowerCase().includes('gasóleo') || s.name.toLowerCase().includes('diesel')) {
             return { ...s, quantity: Math.max(0, s.quantity - qtyToDeduct) };
           }
           return s;
         })
       }));
    }

    setState(prev => ({
      ...prev,
      machines: (prev.machines || []).map(m => {
        if (m.id === machineId) {
          const updates: Partial<Machine> = { logs: [...m.logs, newLog] };
          // If oil change, update last service hours
          if (log.type === 'oil_change') {
             updates.lastServiceHours = m.engineHours;
          }
          return { ...m, ...updates };
        }
        return m;
      })
    }));
  };

  const addMachine = (machineData: Omit<Machine, 'id' | 'logs'>) => {
    trackOfflineAction();
    const newMachine: Machine = {
      ...machineData,
      id: Date.now().toString(),
      logs: [],
      // Initialize with provided values or safe defaults
      lastServiceHours: machineData.engineHours, 
      fuelLevel: 100,
      status: 'active'
    };
    
    setState(prev => ({
      ...prev,
      machines: [...(prev.machines || []), newMachine]
    }));
  };

  // IoT Sensor Registration
  const handleRegisterSensor = (fieldId: string, sensor: Sensor) => {
    trackOfflineAction();
    setState(prev => ({
      ...prev,
      fields: prev.fields.map(f => {
        if (f.id === fieldId) {
          // Add sensor to existing list or create new list
          const updatedSensors = f.sensors ? [...f.sensors, sensor] : [sensor];
          return { ...f, sensors: updatedSensors };
        }
        return f;
      })
    }));
  };

  const handleResetData = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('oriva_username');
    localStorage.removeItem('oriva_theme');
    localStorage.removeItem('oriva_solar');
    window.location.reload();
  };

  // --- UI Components for Offline ---
  const OfflineStatusBanner = () => {
    // VISIBILITY LOGIC:
    // Visible if Offline OR Syncing OR showing Success Message
    const isVisible = !isOnline || isSyncing || showOnlineSuccess;

    return (
      <div className={`fixed top-0 left-0 right-0 z-[160] transition-transform duration-500 ease-in-out ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
         {/* Status Bar with Dynamic Colors */}
         <div className={`w-full px-4 py-3 shadow-lg flex items-center justify-center gap-2 backdrop-blur-md transition-colors duration-500 ${
           !isOnline 
             ? 'bg-amber-500/95 text-white'  // OFFLINE: Amber
             : isSyncing 
               ? 'bg-blue-500/95 text-white' // SYNCING: Blue
               : 'bg-green-500/95 text-white' // SUCCESS: Green
         }`}>
           {!isOnline ? (
             <>
                <CloudOff size={18} className="animate-pulse" />
                <span className="font-bold text-sm">Modo Offline</span>
                {syncQueueCount > 0 && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-mono font-bold ml-1">
                    {syncQueueCount} pendentes
                  </span>
                )}
             </>
           ) : isSyncing ? (
             <>
               <RefreshCw size={18} className="animate-spin" />
               <span className="font-bold text-sm">A Sincronizar com a Cloud...</span>
             </>
           ) : (
             <>
               <Wifi size={18} />
               <span className="font-bold text-sm">Sistema Online</span>
             </>
           )}
         </div>
      </div>
    );
  };

  return (
    // Contentor Principal: Altura fixa na viewport (100dvh) para evitar scroll do body
    <div className="h-[100dvh] w-full flex flex-col bg-[#FDFDF5] dark:bg-[#0A0A0A] overflow-hidden font-sans text-gray-800 dark:text-gray-100 selection:bg-agro-green selection:text-white">
      
      {/* Offline / Sync Banner */}
      <OfflineStatusBanner />

      {/* ALERTA CRÍTICO FULLSCREEN */}
      {alertActive && (
        <div className="fixed inset-0 z-[200] bg-red-600 animate-pulse flex flex-col items-center justify-center text-white p-8 text-center">
          <AlertTriangle size={80} className="mb-4 animate-bounce" />
          <h1 className="text-4xl font-black mb-2">ALERTA METEOROLÓGICO</h1>
          <p className="text-2xl font-bold mb-8">{alertActive}</p>
          <button 
            onClick={stopAlert}
            className="px-8 py-4 bg-white text-red-600 rounded-full font-black text-xl shadow-xl active:scale-95"
          >
            CONFIRMAR E PARAR ALARME
          </button>
        </div>
      )}

      {/* Área de Conteúdo: Ocupa o espaço restante e permite scroll interno */}
      {/* Dynamic Padding logic based on banner visibility */}
      <main className={`flex-1 overflow-y-auto scrollbar-hide w-full max-w-md mx-auto relative px-4 pb-28 ${(!isOnline || isSyncing || showOnlineSuccess) ? 'pt-14' : 'pt-2'} transition-all duration-300`}>
        {activeTab === 'dashboard' && (
          <DashboardHome 
            userName={userName}
            weather={weatherData} // Passing REAL Data
            tasks={state.tasks}
            fields={state.fields}
            machines={state.machines || []} 
            stocks={state.stocks} // Pass stocks for task resource linking
            onToggleTask={toggleTask}
            onAddTask={addTask}
            onDeleteTask={deleteTask}
            onWeatherClick={() => setIsNotificationsOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onModalChange={handleChildModalChange}
            onUpdateMachineHours={updateMachineHours} 
            onAddMachineLog={addMachineLog} 
            alertCount={alertCount}
          />
        )}
        {activeTab === 'animal' && (
          <AnimalCard 
            animals={state.animals} 
            onAddProduction={addProduction} 
            onAddAnimal={addAnimal}
            onUpdateAnimal={updateAnimal} 
            onScheduleTask={addTask}
          />
        )}
        {activeTab === 'cultivation' && (
          <CultivationView 
            fields={state.fields}
            stocks={state.stocks} 
            toggleIrrigation={toggleIrrigation}
            onAddLog={handleAddLog}
            onUseStock={handleUseStockOnField}
            onAddField={addField}
            onRegisterSensor={handleRegisterSensor}
            onModalChange={handleChildModalChange}
            operatorName={userName}
          />
        )}
        {activeTab === 'machines' && (
          <MachineManager 
             machines={state.machines || []}
             stocks={state.stocks}
             onUpdateHours={updateMachineHours}
             onAddLog={addMachineLog}
             onAddMachine={addMachine}
             onModalChange={handleChildModalChange}
          />
        )}
        {activeTab === 'stocks' && (
          <StockManager 
            stocks={state.stocks} 
            onUpdateStock={updateStock} 
            onAddStock={addStock}
            onEditStock={editStock}
            onModalChange={handleChildModalChange}
          />
        )}
        {activeTab === 'accounts' && (
          <FinanceManager 
            transactions={state.transactions} 
            stocks={state.stocks} 
            onAddTransaction={addTransaction}
            onModalChange={handleChildModalChange}
          />
        )}
      </main>
      
      {/* Navegação Flutuante Fixa */}
      {isTabBarVisible && <BottomNav activeTab={activeTab} setTab={setActiveTab} />}
      
      {/* Modais Globais */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onResetData={handleResetData}
        currentName={userName}
        onSaveName={(name) => {
          setUserName(name);
          setIsSettingsOpen(false);
        }}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        isSolarMode={isSolarMode}
        onToggleSolarMode={toggleSolarMode}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        weather={weatherData} // Passing REAL Data
        animals={state.animals}
        fields={state.fields}
        stocks={state.stocks}
        machines={state.machines || []}
        onNavigate={setActiveTab}
      />
    </div>
  );
};

export default App;