import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Home, Leaf, ScanLine, Package, PieChart, 
  Settings, Bell, Plus, Minus, Droplets, Map as MapIcon, 
  Navigation, Tractor, AlertTriangle, CloudRain, Thermometer,
  Wind, MapPin, Brain, Scan, Camera, Sprout, CheckCircle, AlertCircle,
  X, ChevronRight, Activity, Loader2, Save
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import mqtt from 'mqtt';
import L from 'leaflet';

import { AppState, Animal, Field, StockItem, Task, Transaction, WeatherForecast, FieldLog } from './types';
import { INITIAL_WEATHER, MQTT_BROKER, MQTT_TOPIC_PREFIX, MOCK_STATE, STORAGE_KEY } from './constants';
import { loadState, saveState } from './services/storageService';
import SettingsModal from './components/SettingsModal';
import NotificationsModal from './components/NotificationsModal';
import AnimalCard from './components/AnimalCard';
import StockManager from './components/StockManager';
import FieldCard from './components/FieldCard';
import FinanceManager from './components/FinanceManager';
import DashboardHome from './components/DashboardHome';

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

// --- Componentes ---

// 1. Navegação Inferior (Bottom Navigation)
// Implementação Flutuante com Glassmorphism conforme especificações
const BottomNav = ({ activeTab, setTab }: { activeTab: string, setTab: (t: string) => void }) => {
  const tabs = [
    { id: 'dashboard', icon: Home, label: 'Início' },
    { id: 'animal', icon: ScanLine, label: 'Animal' },
    { id: 'cultivation', icon: Leaf, label: 'Cultivo' },
    { id: 'stocks', icon: Package, label: 'Stocks' },
    { id: 'accounts', icon: PieChart, label: 'Contas' },
  ];

  return (
    // Container fixo flutuante (Bottom 6 = 1.5rem acima da borda)
    // Z-Index 100 para garantir prioridade sobre conteúdo
    <div className="fixed bottom-6 left-4 right-4 z-[100] pointer-events-none animate-slide-up">
      <div className="mx-auto max-w-md pointer-events-auto">
        <nav className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/20 dark:border-neutral-800 shadow-2xl rounded-[2.5rem] h-[5.5rem] flex items-center justify-around px-2 transition-all duration-300">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 active:scale-75 ${
                  isActive 
                    ? 'bg-agro-green text-white shadow-lg shadow-agro-green/30 translate-y-[-4px]' 
                    : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800'
                }`}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {/* Indicador visual opcional para estado ativo (ponto) */}
                {isActive && <div className="absolute -bottom-2 w-1 h-1 bg-agro-green rounded-full hidden"></div>}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

// 3. Visualização Animal
const AnimalView = ({ animals, addProduction }: { animals: Animal[], addProduction: (id: string, value: number, type: 'milk' | 'weight') => void }) => {
  const [viewState, setViewState] = useState<'scanning' | 'loading' | 'profile'>('scanning');
  const [foundAnimal, setFoundAnimal] = useState<Animal | null>(null);

  const startScan = () => {
    setViewState('loading');
    setTimeout(() => {
      const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
      setFoundAnimal(randomAnimal);
      setViewState('profile');
    }, 2000);
  };

  const handleReset = () => {
    setFoundAnimal(null);
    setViewState('scanning');
  };

  if (viewState === 'scanning' || viewState === 'loading') {
    return (
      <div className="h-full flex flex-col items-center justify-center relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-neutral-900 shadow-2xl animate-fade-in min-h-[60vh]">
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
           <div className={`w-64 h-64 border border-agro-green/30 rounded-full ${viewState === 'scanning' ? 'animate-ping' : ''} absolute`}></div>
           <div className={`w-96 h-96 border border-agro-green/20 rounded-full ${viewState === 'scanning' ? 'animate-ping' : ''} animation-delay-500 absolute`}></div>
        </div>
        <div className="relative z-10 flex flex-col items-center text-center p-6">
          <div className="w-32 h-32 bg-gray-50 dark:bg-neutral-800/80 backdrop-blur-sm rounded-full flex items-center justify-center mb-10 border border-gray-100 dark:border-neutral-700 shadow-xl relative">
             {viewState === 'loading' ? (
               <Loader2 className="text-agro-green w-12 h-12 animate-spin" />
             ) : (
               <button onClick={startScan} className="w-24 h-24 bg-agro-green rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(62,104,55,0.6)] active:scale-95 transition-transform">
                 <Scan className="text-white w-10 h-10" />
               </button>
             )}
          </div>
          <h2 className="text-3xl font-black italic text-gray-900 dark:text-white mb-2">
            {viewState === 'loading' ? 'A Sincronizar...' : 'Identificação'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-[200px]">
            {viewState === 'loading' ? 'A obter dados biométricos da cloud.' : 'Aproxime o seu dispositivo da Tag NFC do animal.'}
          </p>
        </div>
      </div>
    );
  }

  if (foundAnimal && viewState === 'profile') {
    return <AnimalCard animal={foundAnimal} onReset={handleReset} onAddProduction={addProduction} />;
  }
  return null;
};

// 4. Visualização Cultivo
const CultivationView = ({ 
  fields, 
  toggleIrrigation, 
  onAddLog,
  onAddField,
  onModalChange
}: { 
  fields: Field[], 
  toggleIrrigation: (id: string, s: boolean) => void,
  onAddLog: (fieldId: string, log: Omit<FieldLog, 'id'>) => void,
  onAddField: (field: Pick<Field, 'name' | 'areaHa' | 'crop' | 'emoji'>) => void,
  onModalChange?: (isOpen: boolean) => void
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newArea, setNewArea] = useState('');
  const [selectedCrop, setSelectedCrop] = useState(CROP_TYPES[0]);

  // Notificar o pai quando o estado do modal muda
  useEffect(() => {
    if (onModalChange) {
      onModalChange(isModalOpen);
    }
  }, [isModalOpen, onModalChange]);

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
      
      {/* Control Section Header */}
      <div className="flex justify-between items-end px-2">
        <h2 className="text-2xl font-black uppercase italic text-gray-800 dark:text-white">Meus<br/>Cultivos</h2>
        <div className="flex gap-2">
           <button 
             onClick={() => setIsModalOpen(true)}
             className="w-12 h-12 rounded-full bg-agro-green text-white shadow-lg shadow-agro-green/30 flex items-center justify-center active:scale-95 transition-transform"
           >
             <Plus size={24} />
           </button>
        </div>
      </div>

      {/* Field Cards List */}
      <div className="space-y-4">
        {fields.map(field => (
          <FieldCard 
            key={field.id}
            field={field}
            onToggleIrrigation={toggleIrrigation}
            onAddLog={onAddLog}
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
    </div>
  );
};

// --- APP PRINCIPAL ---
const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [state, setState] = useState<AppState>(loadState());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem('agro_username') || 'Sr. Silva');
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  
  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('agro_theme') === 'dark' || 
        (!localStorage.getItem('agro_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
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

  // Apply Dark Mode Class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('agro_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('agro_theme', 'light');
    }
  }, [isDarkMode]);

  // Persist User Name
  useEffect(() => {
    localStorage.setItem('agro_username', userName);
  }, [userName]);

  // MQTT Logic
  useEffect(() => {
    const client = mqtt.connect(MQTT_BROKER);
    
    client.on('connect', () => {
      console.log('Connected to MQTT Broker');
      client.subscribe(`${MQTT_TOPIC_PREFIX}/+/humidity`);
    });

    client.on('message', (topic, message) => {
      // Topic format: agrosmart/fields/{FIELD_ID}/humidity
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
  }, []);

  // Persist State
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Compute Alert Count for Dashboard Header
  const alertCount = useMemo(() => {
    let count = 0;
    // Weather
    if (INITIAL_WEATHER[0]?.condition === 'rain' || INITIAL_WEATHER[0]?.condition === 'storm') count++;
    // Animals
    count += state.animals.filter(a => a.status === 'sick').length;
    // Fields
    count += state.fields.filter(f => f.humidity < 30 || f.healthScore < 70).length;
    // Stocks
    count += state.stocks.filter(s => s.quantity <= s.minStock).length;
    return count;
  }, [state]);

  // Actions
  const toggleTask = (id: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    }));
  };

  const addTask = (title: string, type: 'task' | 'harvest', date?: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      type,
      date: date || new Date().toISOString().split('T')[0],
      completed: false
    };
    setState(prev => ({
      ...prev,
      tasks: [newTask, ...prev.tasks]
    }));
  };

  const deleteTask = (id: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id)
    }));
  };

  const addProduction = (animalId: string, value: number, type: 'milk' | 'weight') => {
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
    setState(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === fieldId ? { ...f, irrigationStatus: status } : f)
    }));
    // Publish to MQTT would go here in real app
    console.log(`MQTT Pub: agrosmart/fields/${fieldId}/irrigation -> ${status}`);
  };

  // Add New Field
  const addField = (fieldData: Pick<Field, 'name' | 'areaHa' | 'crop' | 'emoji'>) => {
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
     setState(prev => ({
       ...prev,
       stocks: prev.stocks.map(s => s.id === id ? { ...s, quantity: Math.max(0, s.quantity + delta) } : s)
     }));
  };

  const addStock = (item: Omit<StockItem, 'id'>) => {
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
    setState(prev => ({
      ...prev,
      stocks: prev.stocks.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  };

  const handleAddLog = (fieldId: string, log: Omit<FieldLog, 'id'>) => {
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
    const newTx: Transaction = { ...transaction, id: Date.now().toString() };
    setState(prev => ({
      ...prev,
      transactions: [newTx, ...prev.transactions]
    }));
  };

  const handleResetData = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('agro_username');
    localStorage.removeItem('agro_theme');
    window.location.reload();
  };

  return (
    // Contentor Principal: Altura fixa na viewport (100dvh) para evitar scroll do body
    <div className="h-[100dvh] w-full flex flex-col bg-[#FDFDF5] dark:bg-[#0A0A0A] overflow-hidden font-sans text-gray-800 dark:text-gray-100 selection:bg-agro-green selection:text-white">
      
      {/* Área de Conteúdo: Ocupa o espaço restante e permite scroll interno */}
      {/* pb-36 adicionado para garantir que o conteúdo final não fica escondido atrás da barra flutuante */}
      <main className="flex-1 overflow-y-auto scrollbar-hide w-full max-w-md mx-auto relative px-4 pt-2 pb-36">
        {activeTab === 'dashboard' && (
          <DashboardHome 
            userName={userName}
            weather={INITIAL_WEATHER}
            tasks={state.tasks}
            fields={state.fields}
            onToggleTask={toggleTask}
            onAddTask={addTask}
            onDeleteTask={deleteTask}
            onWeatherClick={() => setIsNotificationsOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onModalChange={handleChildModalChange}
            alertCount={alertCount}
          />
        )}
        {activeTab === 'animal' && <AnimalView animals={state.animals} addProduction={addProduction} />}
        {activeTab === 'cultivation' && (
          <CultivationView 
            fields={state.fields} 
            toggleIrrigation={toggleIrrigation}
            onAddLog={handleAddLog}
            onAddField={addField}
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
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        weather={INITIAL_WEATHER}
        animals={state.animals}
        fields={state.fields}
        stocks={state.stocks}
        onNavigate={setActiveTab}
      />
    </div>
  );
};

export default App;