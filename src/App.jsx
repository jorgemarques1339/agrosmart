import React, { useState, useEffect, useRef } from 'react';
// Importação MQTT via CDN para garantir compatibilidade no browser
import * as mqttModule from 'https://cdn.jsdelivr.net/npm/mqtt@5.10.1/+esm';
import { 
  Scan, Sprout, Activity, Tractor, Bell, WifiOff, Cloud, Database, Home,
  Map as MapIcon, List, ClipboardList, Plus, Coins, Camera, Loader2, Settings, 
  Trash2, AlertTriangle, Brain, Scale, Calendar, Wifi, Zap, X, MapPin, ArrowRight
} from 'lucide-react';

// --- IMPORTAR COMPONENTES (Estrutura modular para VS Code) ---
import WeatherWidget from './components/WeatherWidget';
import PestDetection from './components/PestDetection';
import FieldCard, { AddFieldModal } from './components/FieldCard';
import AnimalCard from './components/AnimalCard';
import DashboardHome from './components/DashboardHome';
import StockManager from './components/StockManager'; 
import FinanceManager from './components/FinanceManager';
import SettingsModal from './components/SettingsModal';
import NotificationsModal from './components/NotificationsModal';
import WeatherForecastModal from './components/WeatherForecastModal';

// --- IMPORTAR DADOS ---
import { 
  INITIAL_ANIMALS, 
  INITIAL_FIELDS, 
  INITIAL_STOCKS, 
  INITIAL_TASKS, 
  CROP_CALENDAR, 
  MOCK_FORECAST
} from './data/mockData';

export default function App() {
  // --- 1. ESTADOS DE NAVEGAÇÃO E UI ---
  const [activeTab, setActiveTab] = useState('home');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedAnimalId, setScannedAnimalId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [expandedFieldId, setExpandedFieldId] = useState(null);
  
  // --- ESTADO MODO NOTURNO (Manual) ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('agrosmart_theme') === 'dark';
  });

  // --- ESTADO METEOROLOGIA ---
  const [weather, setWeather] = useState({ 
    temp: 23, 
    condition: 'Céu Limpo', 
    precip: 0, 
    loading: false, 
    locationName: 'Laundos, PT' 
  });

  // --- ESTADOS MQTT ---
  const mqttClient = useRef(null);
  const [mqttStatus, setMqttStatus] = useState('desligado');

  // --- ESTADOS DE MODAIS ---
  const [isAddingField, setIsAddingField] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false); 
  const [userName, setUserName] = useState(() => localStorage.getItem('agrosmart_username') || 'Agricultor');

  // --- ESTADOS DE DETEÇÃO DE PRAGAS ---
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // --- 2. ESTADOS COM PERSISTÊNCIA ---
  const [animals, setAnimals] = useState(() => {
    const saved = localStorage.getItem('agrosmart_animals');
    return saved ? JSON.parse(saved) : INITIAL_ANIMALS;
  });
  const [fields, setFields] = useState(() => {
    const saved = localStorage.getItem('agrosmart_fields');
    return saved ? JSON.parse(saved) : INITIAL_FIELDS;
  });
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('agrosmart_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });
  const [stocks, setStocks] = useState(() => {
    const saved = localStorage.getItem('agrosmart_stocks');
    return saved ? JSON.parse(saved) : INITIAL_STOCKS;
  });
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('agrosmart_finance');
    return saved ? JSON.parse(saved) : [];
  });
  const [fieldLogs, setFieldLogs] = useState(() => {
    const saved = localStorage.getItem('agrosmart_field_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // --- 3. EFEITOS ---

  // Aplicação do Tema
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('agrosmart_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('agrosmart_theme', 'light');
    }
  }, [isDarkMode]);

  // Sincronização LocalStorage
  useEffect(() => {
    localStorage.setItem('agrosmart_animals', JSON.stringify(animals));
    localStorage.setItem('agrosmart_fields', JSON.stringify(fields));
    localStorage.setItem('agrosmart_tasks', JSON.stringify(tasks));
    localStorage.setItem('agrosmart_stocks', JSON.stringify(stocks));
    localStorage.setItem('agrosmart_finance', JSON.stringify(transactions));
    localStorage.setItem('agrosmart_field_logs', JSON.stringify(fieldLogs));
    localStorage.setItem('agrosmart_username', userName);
  }, [animals, fields, tasks, stocks, transactions, fieldLogs, userName]);

  // Lógica MQTT
  useEffect(() => {
    const connectFn = mqttModule.connect || (mqttModule.default && mqttModule.default.connect);
    if (!connectFn) return;

    const host = 'wss://broker.emqx.io:8084/mqtt';
    const options = {
      keepalive: 60,
      clientId: 'agrosmart_web_' + Math.random().toString(16).substring(2, 10),
      clean: true,
      connectTimeout: 30 * 1000,
    };

    if (!mqttClient.current) {
      mqttClient.current = connectFn(host, options);

      mqttClient.current.on('connect', () => {
        setMqttStatus('ligado');
        fields.forEach(f => {
          mqttClient.current.subscribe(`agrosmart/fields/${f.id}/humidity`);
          mqttClient.current.subscribe(`agrosmart/fields/${f.id}/irrigation/status`);
        });
      });

      mqttClient.current.on('message', (topic, payload) => {
        const message = payload.toString();
        const parts = topic.split('/');
        const fieldId = parseInt(parts[2]);

        setFields(curr => curr.map(f => {
          if (f.id === fieldId) {
            if (topic.includes('humidity')) return { ...f, humidity: parseFloat(message) };
            if (topic.includes('irrigation/status')) return { ...f, irrigation: message === 'ON' };
          }
          return f;
        }));
      });

      mqttClient.current.on('error', () => setMqttStatus('erro'));
    }
    return () => { if (mqttClient.current) mqttClient.current.end(); };
  }, [fields.length]);

  // --- 4. HANDLERS ---

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddField = (data) => {
    const cycle = CROP_CALENDAR[data.type] || { label: 'Geral', yieldPerHa: 5 };
    const newField = { 
        id: Date.now(), 
        ...data, 
        health: 'Bom', 
        humidity: 0, 
        temp: 20, 
        irrigation: false, 
        cropCycle: cycle, 
        ndviHistory: [], 
        humidityHistory: [] 
    };
    setFields(prev => [...prev, newField]);
    showNotification(`Campo "${data.name}" criado!`);
  };

  const toggleIrrigation = (fieldId) => {
    const field = fields.find(f => f.id === fieldId);
    if (mqttClient.current && mqttStatus === 'ligado') {
      const command = !field.irrigation ? 'ON' : 'OFF';
      mqttClient.current.publish(`agrosmart/fields/${fieldId}/irrigation/cmd`, command);
      setFields(prev => prev.map(f => f.id === fieldId ? { ...f, irrigation: !field.irrigation } : f));
    } else {
      showNotification('Hardware Offline ❌');
    }
  };

  const addFieldLog = (fieldId, description) => {
    const newLog = { id: Date.now(), fieldId, date: new Date().toLocaleDateString('pt-PT'), description, type: 'Nota' };
    setFieldLogs(prev => [newLog, ...prev]);
  };

  const deleteField = (id) => {
    if (window.confirm("Apagar este campo?")) {
      setFields(prev => prev.filter(f => f.id !== id));
      showNotification('Campo removido.');
    }
  };

  const handleAddTask = (title) => {
    setTasks(prev => [...prev, { id: Date.now(), title, date: 'Hoje', done: false }]);
    showNotification('Tarefa agendada!');
  };

  const toggleTask = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result);
        setIsAnalyzing(true);
        setTimeout(() => {
          setIsAnalyzing(false);
          setAnalysisResult({ 
            status: 'Atenção', 
            disease: 'Míldio (Fungo)', 
            treatment: 'Aplicar fungicida à base de cobre.', 
            confidence: '94%' 
          });
        }, 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`relative flex flex-col h-[100dvh] w-full max-w-md mx-auto shadow-2xl border-x overflow-hidden transition-colors duration-300 ${isDarkMode ? 'dark bg-neutral-950 text-white border-neutral-800' : 'bg-[#FDFDF5] text-[#1A1C18] border-gray-100'}`}>
      
      {/* Barra Superior */}
      <div className={`px-4 py-5 flex justify-between items-center z-30 sticky top-0 border-b backdrop-blur-lg bg-opacity-95 transition-colors duration-300 ${isDarkMode ? 'bg-neutral-950/95 border-neutral-800' : 'bg-[#FDFDF5]/95 border-[#E0E4D6]'}`}>
        <button onClick={() => setIsSettingsOpen(true)} className={`w-12 h-12 flex items-center justify-center rounded-2xl active:scale-90 transition-all shadow-sm ${isDarkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-[#EFF2E6] text-[#43483E]'}`}>
          <Settings size={22} />
        </button>
        <div className="flex flex-col items-center">
            <span className={`text-xl font-black tracking-tight leading-none uppercase italic ${isDarkMode ? 'text-[#4ade80]' : 'text-[#3E6837]'}`}>AgroSmart</span>
            <div className="flex items-center gap-1.5 mt-1">
               <div className={`w-1.5 h-1.5 rounded-full ${mqttStatus === 'ligado' ? 'bg-green-500' : 'bg-red-400'}`}></div>
               <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-neutral-500' : 'text-[#74796D]'}`}>{userName}</span>
            </div>
        </div>
        <button onClick={() => setIsNotificationsOpen(true)} className={`w-12 h-12 flex items-center justify-center rounded-2xl active:scale-90 transition-all relative ${isDarkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-[#EFF2E6] text-[#43483E]'}`}>
          <Bell size={24} />
        </button>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-40 space-y-5 scroll-smooth w-full">
        {notification && <div className={`fixed top-24 left-1/2 -translate-x-1/2 px-5 py-4 rounded-[1.5rem] shadow-2xl text-sm z-[60] flex items-center justify-between border w-11/12 max-w-xs ${isDarkMode ? 'bg-white text-black border-white/5' : 'bg-[#1A1C18] text-white border-white/5'}`}><span>{notification}</span><button onClick={() => setNotification(null)} className="font-black text-[#CBE6A2] ml-4">OK</button></div>}

        {/* Modais */}
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onResetData={() => { localStorage.clear(); window.location.reload(); }} currentName={userName} onSaveName={(n) => { setUserName(n); setIsSettingsOpen(false); }} isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} />
        <NotificationsModal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} weather={weather} animals={animals} fields={fields} stocks={stocks} onNavigate={setActiveTab} />
        <WeatherForecastModal isOpen={isWeatherModalOpen} onClose={() => setIsWeatherModalOpen(false)} forecast={MOCK_FORECAST} locationName={weather.locationName} />
        
        <AddFieldModal 
          isOpen={isAddingField} 
          onClose={() => setIsAddingField(false)} 
          onAdd={handleAddField} 
          cropCalendar={CROP_CALENDAR} 
        />

        {/* PestDetection na aba Cultivo */}
        {activeTab === 'cultivo' && (
          <PestDetection 
            selectedImage={selectedImage} 
            isAnalyzing={isAnalyzing} 
            result={analysisResult} 
            onClose={() => { setSelectedImage(null); setAnalysisResult(null); }} 
          />
        )}

        {/* Abas */}
        {activeTab === 'home' && (
          <DashboardHome 
            weather={weather} fields={fields} tasks={tasks} 
            onToggleTask={toggleTask} onAddTask={handleAddTask} onDeleteTask={deleteTask} 
            onWeatherClick={() => setIsWeatherModalOpen(true)} 
          />
        )}

        {activeTab === 'cultivo' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div><h2 className="text-xl font-black uppercase italic leading-none dark:text-white">Meus Cultivos</h2><span className="text-[9px] font-bold text-[#74796D] uppercase">{mqttStatus === 'ligado' ? 'Hardware Online ✅' : 'Hardware Offline ❌'}</span></div>
              <div className="flex gap-2">
                <label className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer shadow-sm active:scale-90 transition-all ${isDarkMode ? 'bg-neutral-800 text-[#4ade80]' : 'bg-white text-[#3E6837] border border-[#E0E4D6]'}`}>
                  <Camera size={20} /><input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                </label>
                <button onClick={() => setIsAddingField(true)} className="bg-[#3E6837] text-white w-10 h-10 rounded-xl active:scale-90 flex items-center justify-center shadow-sm"><Plus size={24} /></button>
              </div>
            </div>
            {fields.map(f => (
              <FieldCard 
                key={f.id} field={f} 
                isExpanded={expandedFieldId === f.id} 
                onToggleHistory={() => setExpandedFieldId(expandedFieldId === f.id ? null : f.id)} 
                logs={fieldLogs.filter(l => l.fieldId === f.id)} 
                onAddLog={addFieldLog} 
                onToggleIrrigation={toggleIrrigation} 
                onDelete={deleteField} 
              />
            ))}
          </div>
        )}

        {activeTab === 'animal' && (
          <div className="space-y-4">
            <div className="text-center py-10">
              <div className="w-32 h-32 bg-[#EFF2E6] dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-neutral-700 shadow-inner">
                <Scan size={48} className="text-[#3E6837] dark:text-[#4ade80]" />
              </div>
              <h2 className="text-2xl font-black uppercase italic dark:text-white">Identificação NFC</h2>
              <p className="text-xs text-[#74796D] px-10">Aproxime o dispositivo da tag auricular do animal para ler os dados.</p>
              <button onClick={() => { setIsScanning(true); setTimeout(() => { setScannedAnimalId(animals[0]?.id || null); setIsScanning(false); showNotification('Leitura concluída'); }, 2000); }} disabled={isScanning} className="mt-8 bg-[#3E6837] dark:bg-[#4ade80] text-white dark:text-neutral-900 px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-lg active:scale-95 transition-all">{isScanning ? 'A Ler Tag...' : 'Iniciar Scanner'}</button>
            </div>
            {scannedAnimalId && animals.find(a => a.id === scannedAnimalId) && (
              <AnimalCard 
                animal={animals.find(a => a.id === scannedAnimalId)} 
                onAddProduction={(id, val) => showNotification(`Produção registada.`)} 
              />
            )}
          </div>
        )}

        {activeTab === 'stocks' && <StockManager stocks={stocks} onUpdateStock={(id, val) => setStocks(prev => prev.map(s => s.id === id ? {...s, quantity: Math.max(0, s.quantity + val)} : s))} />}
        {activeTab === 'finance' && <FinanceManager transactions={transactions} stocks={stocks} />}

      </div>

      {/* Navegação Inferior */}
      <div className={`absolute bottom-0 left-0 right-0 h-20 pb-4 flex justify-around items-center z-40 border-t px-4 shadow-lg transition-colors ${isDarkMode ? 'bg-neutral-950/95 border-neutral-800' : 'bg-[#FDFDF5]/95 border-[#E0E4D6]'}`}>
        {[ {id: 'home', icon: Home, label: 'Início'}, {id: 'animal', icon: Scan, label: 'Animal'}, {id: 'cultivo', icon: Sprout, label: 'Cultivo'}, {id: 'stocks', icon: ClipboardList, label: 'Stocks'}, {id: 'finance', icon: Coins, label: 'Contas'} ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex flex-col items-center gap-1 flex-1 active:scale-90 transition-transform">
            <div className={`h-9 w-14 rounded-xl flex items-center justify-center transition-colors ${activeTab === tab.id ? (isDarkMode ? 'bg-[#4ade80] text-neutral-900' : 'bg-[#3E6837] text-white shadow-md') : (isDarkMode ? 'text-neutral-500' : 'text-[#74796D]')}`}><tab.icon size={26} /></div>
            <span className={`text-[9px] font-black uppercase transition-colors ${activeTab === tab.id ? (isDarkMode ? 'text-white' : 'text-[#042100]') : (isDarkMode ? 'text-neutral-500' : 'text-[#74796D]')}`}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}