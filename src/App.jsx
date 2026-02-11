import React, { useState, useEffect, useRef } from 'react';
// Importação MQTT via CDN para compatibilidade robusta
import * as mqttModule from 'https://cdn.jsdelivr.net/npm/mqtt@5.10.1/+esm';
import { 
  Scan, Sprout, Activity, Tractor, Bell, WifiOff, Cloud, Database, Home,
  Map as MapIcon, List, ClipboardList, Plus, Coins, Camera, Loader2, Settings, 
  Trash2, AlertTriangle, Brain, Scale, Calendar, Wifi, Zap, X, Check, Milk, 
  ChevronRight, ArrowUpRight, ArrowDownRight, Warehouse, Thermometer, Droplets,
  CloudLightning, Snowflake
} from 'lucide-react';

// --- IMPORTAR COMPONENTES LOCAIS ---
import WeatherWidget from './components/WeatherWidget';
import PestDetection from './components/PestDetection';
import FieldCard from './components/FieldCard';
import AnimalCard from './components/AnimalCard';
import DashboardHome from './components/DashboardHome';
import FieldMap from './components/FieldMap'; 
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
  INITIAL_BATCHES,
  MOCK_FORECAST
} from './data/mockData';

// Chave OpenWeatherMap Real
const OPENWEATHER_API_KEY = "c7f76605724ecafb54933077ede4166a"; 

const INITIAL_FIELD_LOGS = [
  { id: 101, fieldId: 2, date: '15/01/2026', description: 'Poda de Inverno realizada', type: 'intervention' },
  { id: 102, fieldId: 1, date: '01/02/2026', description: 'Adubação de fundo (NPK)', type: 'treatment' }
];

export default function App() {
  // --- 1. ESTADOS DE NAVEGAÇÃO E UI ---
  const [activeTab, setActiveTab] = useState('home');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedAnimalId, setScannedAnimalId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [expandedFieldId, setExpandedFieldId] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);
  const [cultivoView, setCultivoView] = useState('list');
  
  // Estado Meteorologia Real
  const [weather, setWeather] = useState({ 
    temp: 0, 
    condition: 'A detetar...', 
    precip: 0, 
    loading: true, 
    locationName: 'Localização GPS', 
    alerts: [],
    wind: 0
  });
  const [forecastData, setForecastData] = useState([]);

  // --- 2. ESTADOS MQTT (HARDWARE REAL) ---
  const mqttClient = useRef(null);
  const [mqttStatus, setMqttStatus] = useState('disconnected');

  // --- 3. ESTADOS DE MODAIS DE CRIAÇÃO ---
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('🌽');
  const [newFieldArea, setNewFieldArea] = useState(''); 
  
  const [isAddingSale, setIsAddingSale] = useState(false);
  const [saleDesc, setSaleDesc] = useState('');
  const [saleAmount, setSaleAmount] = useState('');
  
  const [isAddingAnimal, setIsAddingAnimal] = useState(false);
  const [newAnimalName, setNewAnimalName] = useState('');
  const [newAnimalTag, setNewAnimalTag] = useState('');
  const [newAnimalType, setNewAnimalType] = useState('Vaca');

  const [isAddingStock, setIsAddingStock] = useState(false);
  const [newStockData, setNewStockData] = useState({ name: '', category: 'feed', quantity: '', unit: 'kg', minLevel: '', price: '' });

  // Estados Globais
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false); 
  const [userName, setUserName] = useState(() => localStorage.getItem('agrosmart_username') || 'Agricultor');
  
  // Estado Modo Noturno
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('agrosmart_theme') === 'dark');

  // IA e Confirmação
  const [isPredictionOpen, setIsPredictionOpen] = useState(false);
  const [predictionData, setPredictionData] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [confirmation, setConfirmation] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isDanger: true });

  // --- 4. ESTADOS COM PERSISTÊNCIA ---
  const [animals, setAnimals] = useState(() => { try { return JSON.parse(localStorage.getItem('agrosmart_animals')) || INITIAL_ANIMALS; } catch { return INITIAL_ANIMALS; } });
  const [fields, setFields] = useState(() => { try { return JSON.parse(localStorage.getItem('agrosmart_fields')) || INITIAL_FIELDS; } catch { return INITIAL_FIELDS; } });
  const [fieldLogs, setFieldLogs] = useState(() => { try { return JSON.parse(localStorage.getItem('agrosmart_field_logs')) || INITIAL_FIELD_LOGS; } catch { return []; } });
  const [tasks, setTasks] = useState(() => { try { return JSON.parse(localStorage.getItem('agrosmart_tasks')) || INITIAL_TASKS; } catch { return INITIAL_TASKS; } });
  const [stocks, setStocks] = useState(() => { try { return JSON.parse(localStorage.getItem('agrosmart_stocks')) || INITIAL_STOCKS; } catch { return INITIAL_STOCKS; } });
  const [transactions, setTransactions] = useState(() => { try { return JSON.parse(localStorage.getItem('agrosmart_finance')) || []; } catch { return []; } });
  const [batches, setBatches] = useState(() => { try { return JSON.parse(localStorage.getItem('agrosmart_batches')) || INITIAL_BATCHES; } catch { return []; } });

  // --- EFEITOS ---
  
  // Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('agrosmart_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('agrosmart_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // Monitorizar Rede
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); showNotification('Online'); };
    const handleOffline = () => { setIsOnline(false); showNotification('Modo Offline Ativo'); };
    window.addEventListener('online', handleOnline); window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  // Persistência
  useEffect(() => {
    localStorage.setItem('agrosmart_animals', JSON.stringify(animals));
    localStorage.setItem('agrosmart_fields', JSON.stringify(fields));
    localStorage.setItem('agrosmart_field_logs', JSON.stringify(fieldLogs));
    localStorage.setItem('agrosmart_tasks', JSON.stringify(tasks));
    localStorage.setItem('agrosmart_stocks', JSON.stringify(stocks));
    localStorage.setItem('agrosmart_finance', JSON.stringify(transactions));
    localStorage.setItem('agrosmart_batches', JSON.stringify(batches));
    localStorage.setItem('agrosmart_username', userName);
  }, [animals, fields, fieldLogs, tasks, stocks, transactions, batches, userName]);

  // --- 5. LÓGICA MQTT ---
  useEffect(() => {
    const connect = mqttModule.connect || (mqttModule.default && mqttModule.default.connect);
    if (!connect) {
      console.warn('MQTT module not loaded correctly');
      return;
    }

    const host = 'wss://broker.emqx.io:8084/mqtt';
    const options = {
      keepalive: 60,
      clientId: 'agrosmart_web_' + Math.random().toString(16).substring(2, 10),
      clean: true,
      connectTimeout: 30 * 1000,
    };

    if (!mqttClient.current) {
      mqttClient.current = connect(host, options);

      mqttClient.current.on('connect', () => {
        setMqttStatus('connected');
        showNotification('Hardware Sincronizado 📡');
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
            if (topic.includes('humidity')) {
              const val = parseFloat(message);
              return { 
                ...f, 
                humidity: val,
                humidityHistory: [...(f.humidityHistory || []).slice(-10), { time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), hum: val }]
              };
            }
            if (topic.includes('irrigation/status')) {
              return { ...f, irrigation: message === 'ON' };
            }
          }
          return f;
        }));
      });

      mqttClient.current.on('error', () => setMqttStatus('error'));
      mqttClient.current.on('close', () => setMqttStatus('disconnected'));
    }

    return () => { if (mqttClient.current) { mqttClient.current.end(); mqttClient.current = null; } };
  }, [fields.length]);

  // --- 6. LÓGICA METEOROLOGIA REAL ---
  const fetchWeather = async (lat, lon) => {
    if (!OPENWEATHER_API_KEY) {
      setWeather(prev => ({ ...prev, loading: false, condition: "Sem Chave API" }));
      setForecastData(MOCK_FORECAST);
      return;
    }

    try {
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=pt&appid=${OPENWEATHER_API_KEY}`);
      const data = await res.json();

      if (res.ok) {
        const newAlerts = [];
        if (data.main.temp <= 2) {
          newAlerts.push({ type: 'frost', msg: 'Risco de Geada! Proteja as culturas.' });
          showNotification('⚠️ Alerta de Geada!');
        }
        if (data.wind.speed * 3.6 > 45 || (data.weather[0].main === 'Thunderstorm')) {
          newAlerts.push({ type: 'storm', msg: 'Alerta de Tempestade!' });
          showNotification('⛈️ Alerta de Tempestade!');
        }

        setWeather({
          temp: Math.round(data.main.temp),
          condition: data.weather[0].description,
          precip: data.rain ? (data.rain['1h'] || 0) : 0,
          locationName: data.name,
          loading: false,
          alerts: newAlerts,
          wind: Math.round(data.wind.speed * 3.6)
        });

        const foreRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=pt&appid=${OPENWEATHER_API_KEY}`);
        const foreData = await foreRes.json();
        
        if (foreRes.ok) {
           const dailyData = foreData.list
             .filter(item => item.dt_txt.includes("12:00:00"))
             .map(item => ({
               day: new Date(item.dt * 1000).toLocaleDateString('pt-PT', { weekday: 'long' }),
               tempMax: Math.round(item.main.temp_max),
               tempMin: Math.round(item.main.temp_min),
               condition: item.weather[0].description,
               precip: item.pop * 100 > 0 ? `${(item.pop * 10).toFixed(1)}mm` : '0mm',
               icon: item.weather[0].main.toLowerCase()
             }));
           setForecastData(dailyData);
        }
      }
    } catch (error) {
      console.error("Erro Weather:", error);
      setWeather(prev => ({ ...prev, loading: false, locationName: 'Erro GPS' }));
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => fetchWeather(position.coords.latitude, position.coords.longitude),
        (error) => {
          console.warn("GPS negado. Usando padrão.");
          fetchWeather(41.15, -8.62); 
        },
        { enableHighAccuracy: true }
      );
    }
    
    const timer = setInterval(() => {
       if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition((pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude));
       }
    }, 1800000); 

    return () => clearInterval(timer);
  }, []);

  // --- HANDLERS E UTILITÁRIOS ---
  const showNotification = (msg) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };
  const handleResetData = () => { localStorage.clear(); window.location.reload(); };
  const handleSaveName = (n) => { setUserName(n); setIsSettingsOpen(false); showNotification(`Perfil atualizado.`); };

  const addFieldLog = (fieldId, description, location = null) => {
    const newLog = { id: Date.now(), fieldId, date: new Date().toLocaleDateString('pt-PT'), description, type: 'intervencao', location };
    setFieldLogs(prev => [newLog, ...prev]);
  };

  const handleScanNFC = () => {
    setIsScanning(true);
    setTimeout(() => {
      // Proteção para evitar crash se não houver animais
      if (animals && animals.length > 0) {
        const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
        setScannedAnimalId(randomAnimal.id);
        showNotification(`Tag detetada: ${randomAnimal.name}`);
      } else {
        showNotification("Nenhum animal registado para leitura.");
      }
      setIsScanning(false);
    }, 1500);
  };

  const toggleIrrigation = (fieldId) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    if (mqttClient.current && mqttStatus === 'connected') {
      const command = !field.irrigation ? 'ON' : 'OFF';
      mqttClient.current.publish(`agrosmart/fields/${fieldId}/irrigation/cmd`, command, { qos: 1 });
      showNotification(`Enviando ${command}...`);
      setFields(fields.map(f => f.id === fieldId ? { ...f, irrigation: !field.irrigation } : f));
    } else {
      showNotification('Hardware Offline ❌');
    }
  };

  const handlePredictYield = (field) => {
    if (!field.area) { showNotification("Falta área."); return; }
    const yieldHa = field.cropCycle?.yieldPerHa || 10;
    const healthFactor = field.health === 'Excelente' ? 1.2 : 1.0;
    const result = (field.area * yieldHa * healthFactor).toFixed(1);
    setPredictionData({ field: field.name, crop: field.cropCycle?.label || 'Cultura', yield: result, area: field.area, health: field.health, harvestDate: field.cropCycle?.harvest || 'N/A' });
    setIsPredictionOpen(true);
  };

  // --- FUNÇÕES CRUD CORRIGIDAS ---
  const handleAddTask = (title, dateRaw) => {
    let formattedDate = 'Hoje';
    if (dateRaw) {
        const d = new Date(dateRaw);
        formattedDate = d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    setTasks(prev => [...prev, { id: Date.now(), title, date: formattedDate, done: false }]);
    showNotification('Tarefa agendada!');
  };

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    // Garante que o cropCycle e listas existem
    const cycle = CROP_CALENDAR[newFieldType] || { label: 'Geral', plant: 'N/A', harvest: 'N/A', yieldPerHa: 5 };
    const newF = { 
        id: Date.now(), 
        name: newFieldName, 
        area: parseFloat(newFieldArea) || 1.0, 
        img: newFieldType, 
        health: 'Bom', 
        humidity: 0, 
        temp: 20, 
        irrigation: false, 
        cropCycle: cycle, 
        ndviHistory: [], 
        humidityHistory: [] 
    };
    setFields(prev => [...prev, newF]);
    setIsAddingField(false); setNewFieldName(''); setNewFieldArea('');
    showNotification(`Campo criado e sincronizado.`);
  };

  const handleAddAnimal = () => {
    if (!newAnimalName.trim()) return;
    const newA = { id: newAnimalTag || `PT-${Math.floor(Math.random()*9000)}`, name: newAnimalName, type: newAnimalType, status: 'Saudável', productionHistory: [] };
    setAnimals(prev => [...prev, newA]); setIsAddingAnimal(false);
  };

  const handleAddStock = () => {
    if (!newStockData.name) return;
    const newS = { id: Date.now(), ...newStockData, quantity: parseFloat(newStockData.quantity), price: parseFloat(newStockData.price) };
    setStocks(prev => [...prev, newS]); setIsAddingStock(false);
  };

  const handleAddSale = () => {
    if (!saleAmount) return;
    setTransactions(prev => [...prev, { id: Date.now(), description: saleDesc || 'Venda', amount: parseFloat(saleAmount), type: 'income', date: new Date().toLocaleDateString('pt-PT') }]);
    setIsAddingSale(false);
  };

  const addAnimalProduction = (id, v) => {
    setAnimals(prev => prev.map(a => a.id === id ? {...a, productionHistory: [...(a.productionHistory||[]), {day: 'Hoje', value: v}]} : a));
    showNotification("Registado!");
  };

  const updateStock = (id, amt) => setStocks(prev => prev.map(s => s.id === id ? {...s, quantity: Math.max(0, s.quantity + amt)} : s));
  const updateStockPrice = (id, p) => setStocks(prev => prev.map(s => s.id === id ? {...s, price: parseFloat(p)} : s));
  
  const deleteTask = (id) => requestConfirmation("Apagar", "Remover tarefa?", () => setTasks(prev => prev.filter(t => t.id !== id)));
  const deleteField = (id) => requestConfirmation("Apagar", "Remover campo?", () => setFields(prev => prev.filter(f => f.id !== id)));
  const toggleTask = (id) => setTasks(prev => prev.map(t => t.id === id ? {...t, done: !t.done} : t));

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const r = new FileReader();
      r.onload = () => { setSelectedImage(r.result); setIsAnalyzing(true); setTimeout(() => { setIsAnalyzing(false); setAnalysisResult({status:'Atenção', disease:'Míldio', treatment:'Fungicida'}); }, 2000); };
      r.readAsDataURL(file);
    }
  };

  const requestConfirmation = (title, message, action, isDanger = true) => {
    setConfirmation({ isOpen: true, title, message, onConfirm: () => { action(); setConfirmation(prev => ({ ...prev, isOpen: false })); }, isDanger });
  };
  const closeConfirmation = () => setConfirmation(prev => ({ ...prev, isOpen: false }));

  const scannedAnimal = scannedAnimalId ? animals.find(a => a.id === scannedAnimalId) : null;
  const notificationCount = (animals.filter(a => a.status !== 'Saudável').length) + (stocks.filter(s => s.quantity <= (s.minLevel || 0)).length) + (fields.filter(f => f.health.includes('Atenção')).length) + (weather.alerts.length);

  return (
    <div className={`relative flex flex-col h-[100dvh] w-full max-w-md mx-auto shadow-2xl border-x overflow-hidden transition-colors duration-300 ${isDarkMode ? 'dark bg-neutral-950 text-white border-neutral-800' : 'bg-[#FDFDF5] text-[#1A1C18] border-gray-100'}`}>
      
      {/* Top Bar */}
      <div className={`px-4 py-5 flex justify-between items-center z-30 sticky top-0 border-b backdrop-blur-lg bg-opacity-95 flex-none transition-colors duration-300 ${isDarkMode ? 'bg-neutral-950/95 border-neutral-800' : 'bg-[#FDFDF5]/95 border-[#E0E4D6]'}`}>
        <div className="flex gap-2">
            <button onClick={() => setIsSettingsOpen(true)} className={`w-12 h-12 flex items-center justify-center rounded-2xl active:scale-90 transition-all shadow-sm ${isDarkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-[#EFF2E6] text-[#43483E]'}`}>
                <Settings size={22} />
            </button>
        </div>
        <div className="flex flex-col items-center">
            <span className={`text-xl font-black tracking-tight leading-none uppercase italic ${isDarkMode ? 'text-[#4ade80]' : 'text-[#3E6837]'}`}>AgroSmart</span>
            <div className="flex items-center gap-1.5 mt-1">
               <div className={`w-1.5 h-1.5 rounded-full ${mqttStatus === 'connected' ? 'bg-green-500' : 'bg-red-400'}`}></div>
               <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-neutral-500' : 'text-[#74796D]'}`}>{userName} • {mqttStatus === 'connected' ? 'LIVE' : 'OFF'}</span>
            </div>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setIsNotificationsOpen(true)} className={`w-12 h-12 flex items-center justify-center rounded-2xl active:scale-90 transition-all relative ${isDarkMode ? 'bg-neutral-800 text-neutral-300' : 'bg-[#EFF2E6] text-[#43483E]'}`}>
            <Bell size={24} />
            {notificationCount > 0 && <span className={`absolute top-3 right-3 w-3 h-3 bg-[#BA1A1A] border-[3px] rounded-full animate-pulse ${isDarkMode ? 'border-neutral-900' : 'border-[#FDFDF5]'}`}></span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-40 space-y-5 scroll-smooth w-full">
        {notification && <div className={`fixed top-24 left-1/2 -translate-x-1/2 px-5 py-4 rounded-[1.5rem] shadow-2xl text-sm z-[60] flex items-center justify-between border w-11/12 max-w-xs ${isDarkMode ? 'bg-white text-black border-white/5' : 'bg-[#1A1C18] text-white border-white/5'}`}><span>{notification}</span><button onClick={() => setNotification(null)} className={`font-black px-4 py-2 rounded-xl text-xs ${isDarkMode ? 'text-green-700 bg-black/5' : 'text-[#CBE6A2] bg-white/5'}`}>OK</button></div>}

        {weather.alerts.map((alert, i) => (
          <div key={i} className={`p-4 rounded-2xl flex items-center gap-3 animate-pulse border ${alert.type === 'frost' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-200' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-800 dark:text-red-200'}`}>
            {alert.type === 'frost' ? <Snowflake size={24} /> : <CloudLightning size={24} />}
            <p className="text-xs font-bold leading-tight">{alert.msg}</p>
          </div>
        ))}

        {/* MODAIS GLOBAIS */}
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onResetData={handleResetData} currentName={userName} onSaveName={handleSaveName} isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />
        <NotificationsModal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} weather={weather} animals={animals} fields={fields} stocks={stocks} onNavigate={(tab) => { setActiveTab(tab); setIsNotificationsOpen(false); }} />
        <WeatherForecastModal isOpen={isWeatherModalOpen} onClose={() => setIsWeatherModalOpen(false)} forecast={forecastData} locationName={weather.locationName} />

        {/* Modal IA */}
        {isPredictionOpen && predictionData && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-0">
            <div className={`rounded-t-[2.5rem] w-full max-w-md shadow-2xl animate-slide-up pb-10 border-t overflow-hidden ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-[#E0E4D6]'}`}>
               <div className={`p-8 text-white text-center relative overflow-hidden ${isDarkMode ? 'bg-[#1a472a]' : 'bg-[#3E6837]'}`}>
                 <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                 <div className="relative z-10">
                   <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/30 shadow-lg"><Brain size={32} /></div>
                   <h3 className="text-2xl font-black uppercase tracking-widest mb-1">Previsão IA</h3>
                   <button onClick={() => setIsPredictionOpen(false)} className="absolute top-0 right-0 p-4 text-white/50 hover:text-white"><X size={24} /></button>
                 </div>
               </div>
               <div className="p-6 space-y-6 text-center">
                 <p className={`text-xs font-bold uppercase mb-2 tracking-widest ${isDarkMode ? 'text-neutral-400' : 'text-[#74796D]'}`}>{predictionData.field} ({predictionData.crop})</p>
                 <div className={`flex items-baseline justify-center gap-2 ${isDarkMode ? 'text-white' : 'text-[#1A1C18]'}`}><span className="text-6xl font-black tracking-tighter">{predictionData.yield}</span><span className="text-sm font-black opacity-40 mb-2">TON</span></div>
                 <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className={`p-4 rounded-3xl border flex flex-col items-center ${isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-[#FDFDF5] border-[#EFF2E6]'}`}><Scale size={16} className={`${isDarkMode ? 'text-[#4ade80]' : 'text-[#3E6837]'} mb-1`} /><span className={`text-[10px] font-black uppercase ${isDarkMode ? 'text-neutral-400' : ''}`}>Área</span><p className={`text-xl font-bold ${isDarkMode ? 'text-white' : ''}`}>{predictionData.area} ha</p></div>
                    <div className={`p-4 rounded-3xl border flex flex-col items-center ${isDarkMode ? 'bg-neutral-800 border-neutral-700' : 'bg-[#FDFDF5] border-[#EFF2E6]'}`}><Activity size={16} className={`${isDarkMode ? 'text-[#4ade80]' : 'text-[#3E6837]'} mb-1`} /><span className={`text-[10px] font-black uppercase ${isDarkMode ? 'text-neutral-400' : ''}`}>Vigor</span><p className={`text-xl font-bold ${isDarkMode ? 'text-white' : ''}`}>{predictionData.health}</p></div>
                 </div>
                 <button onClick={() => setIsPredictionOpen(false)} className={`w-full mt-6 py-5 rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all ${isDarkMode ? 'bg-white text-black' : 'bg-[#1A1C18] text-white'}`}>Fechar Relatório</button>
               </div>
            </div>
          </div>
        )}

        {/* Modal Confirmação */}
        {confirmation.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm px-0 animate-fade-in">
            <div className={`rounded-t-[2.5rem] p-6 w-full max-w-md shadow-2xl animate-slide-up pb-10 border-t ${isDarkMode ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-[#E0E4D6]'}`}>
              <div className={`w-14 h-1.5 rounded-full mx-auto mb-6 shadow-inner ${isDarkMode ? 'bg-neutral-700' : 'bg-gray-200'}`}></div>
              <div className="text-center mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmation.isDanger ? (isDarkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-500') : 'bg-blue-50 text-blue-500'}`}><Trash2 size={32} /></div>
                <h3 className={`text-xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-[#1A1C18]'}`}>{confirmation.title}</h3>
                <p className={`text-sm px-4 ${isDarkMode ? 'text-neutral-400' : 'text-[#43483E]'}`}>{confirmation.message}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={closeConfirmation} className={`flex-1 py-4 border-2 rounded-2xl font-black text-xs uppercase active:bg-opacity-50 ${isDarkMode ? 'border-neutral-700 text-neutral-400 active:bg-neutral-800' : 'border-[#E0E4D6] text-[#43483E] active:bg-gray-50'}`}>Cancelar</button>
                <button onClick={confirmation.onConfirm} className={`flex-1 py-4 text-white rounded-2xl font-black text-xs uppercase shadow-xl ${confirmation.isDanger ? 'bg-red-600' : 'bg-blue-600'}`}>Confirmar</button>
              </div>
            </div>
          </div>
        )}

        {/* --- ABAS --- */}
        {activeTab === 'home' && (
          <DashboardHome 
            weather={weather} fields={fields} tasks={tasks} stocks={stocks} animals={animals}
            onNavigate={setActiveTab} onToggleTask={toggleTask} onAddTask={handleAddTask} onDeleteTask={deleteTask} 
            onWeatherClick={() => setIsWeatherModalOpen(true)} 
          />
        )}

        {activeTab === 'animal' && (
          <div className="space-y-8 animate-fade-in">
             {!scannedAnimalId && <div className="text-center py-10"><div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-4 ${isDarkMode ? 'bg-neutral-800 border-neutral-700 text-[#4ade80]' : 'bg-[#E1E4D5] border-white text-[#3E6837]'}`}><Scan size={64} /></div><h2 className={`text-4xl font-black tracking-tighter uppercase italic ${isDarkMode ? 'text-white' : 'text-[#1A1C18]'}`}>Identificação</h2><p className={`text-md font-medium px-8 mt-2 ${isDarkMode ? 'text-neutral-400' : 'text-[#43483E]'}`}>Aproxime o smartphone da tag auricular.</p></div>}
            <div className="flex justify-center"><button onClick={handleScanNFC} disabled={isScanning} className={`w-44 h-44 rounded-[4.5rem] flex flex-col items-center justify-center transition-all shadow-2xl border-[14px] active:scale-90 ${isDarkMode ? 'bg-neutral-700 border-neutral-800 text-[#4ade80]' : (isScanning ? 'bg-[#E1E4D5]' : 'bg-[#CBE6A2] text-[#2D4F00] border-white')}`}>{isScanning ? <Loader2 className="w-14 h-14 animate-spin" /> : <Scan className="w-14 h-14" />}<span className={`mt-3 text-[11px] font-black uppercase tracking-widest ${isDarkMode ? 'text-[#4ade80]' : 'text-[#2D4F00]'}`}>{isScanning ? 'LENDO...' : 'LER TAG'}</span></button></div>
            {scannedAnimal && <AnimalCard animal={scannedAnimal} onAddProduction={addAnimalProduction} />}
            <button onClick={() => setIsAddingAnimal(true)} className={`w-full py-4 text-xs font-black uppercase rounded-3xl border-2 ${isDarkMode ? 'bg-neutral-800 border-neutral-700 text-[#4ade80]' : 'bg-white border-[#E0E4D6] text-[#3E6837]'}`}>Registar Novo Animal</button>
          </div>
        )}

        {activeTab === 'cultivo' && (
          <div className="space-y-4 max-w-md mx-auto pb-4">
            <div className="flex items-center justify-between px-1">
              <div><h2 className={`text-xl font-black uppercase italic leading-none ${isDarkMode ? 'text-white' : 'text-[#1A1C18]'}`}>Meus Cultivos</h2><span className={`text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-neutral-500' : 'text-[#74796D]'}`}>{mqttStatus === 'connected' ? 'Hardware Online ✅' : 'Hardware Offline ❌'}</span></div>
              <div className="flex gap-2">
                <label className={`flex items-center justify-center w-10 h-10 rounded-xl border cursor-pointer shadow-sm active:scale-90 transition-all ${isDarkMode ? 'bg-neutral-800 border-neutral-700 text-[#4ade80]' : 'bg-white border-[#E0E4D6] text-[#3E6837]'}`}><Camera size={20} /><input type="file" className="hidden" onChange={handleImageUpload}/></label>
                <button onClick={() => setIsAddingField(true)} className={`w-10 h-10 rounded-xl active:scale-90 flex items-center justify-center shadow-sm ${isDarkMode ? 'bg-[#4ade80] text-neutral-900' : 'bg-[#3E6837] text-white'}`}><Plus size={24} /></button>
              </div>
            </div>
            <div className="space-y-3">{fields.map(f => <FieldCard key={f.id} field={f} onToggleIrrigation={toggleIrrigation} onPredictYield={handlePredictYield} onDelete={deleteField} onAddLog={addFieldLog} />)}</div>
          </div>
        )}

        {activeTab === 'stocks' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1"><h2 className={`text-xl font-black uppercase italic ${isDarkMode ? 'text-white' : 'text-[#1A1C18]'}`}>Armazém</h2><button onClick={() => setIsAddingStock(true)} className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm active:scale-95 ${isDarkMode ? 'bg-[#4ade80] text-neutral-900' : 'bg-[#3E6837] text-white'}`}><Plus size={16} className="inline mr-1" /> Produto</button></div>
            <StockManager stocks={stocks} onUpdateStock={updateStock} />
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1"><h2 className={`text-xl font-black uppercase italic ${isDarkMode ? 'text-white' : 'text-[#1A1C18]'}`}>Finanças</h2><button onClick={() => setIsAddingSale(true)} className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm active:scale-95 ${isDarkMode ? 'bg-[#4ade80] text-neutral-900' : 'bg-[#3E6837] text-white'}`}><Plus size={16} className="inline mr-1" /> Receita</button></div>
            <FinanceManager transactions={transactions} stocks={stocks} />
          </div>
        )}

        {/* Modais de Criação (Funcionais) */}
        {isAddingField && (<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0"><div className={`rounded-t-[2.5rem] p-7 w-full max-w-md animate-slide-up ${isDarkMode ? 'bg-neutral-900' : 'bg-white'}`}><h3 className={`text-2xl font-black mb-6 ${isDarkMode ? 'text-white' : ''}`}>Novo Campo</h3><input className={`w-full border-2 rounded-xl p-4 mb-3 font-bold ${isDarkMode ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-[#FDFDF5] border-[#E0E4D6]'}`} placeholder="Nome" value={newFieldName} onChange={e => setNewFieldName(e.target.value)} /><input className={`w-full border-2 rounded-xl p-4 mb-3 font-bold ${isDarkMode ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-[#FDFDF5] border-[#E0E4D6]'}`} type="number" placeholder="Área (ha)" value={newFieldArea} onChange={e => setNewFieldArea(e.target.value)} />
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar mb-2">{Object.keys(CROP_CALENDAR).map(e=><button key={e} onClick={()=>setNewFieldType(e)} className={`w-14 h-14 shrink-0 rounded-2xl text-2xl border-4 ${newFieldType===e ? 'border-[#3E6837] dark:border-[#4ade80]' : 'border-transparent'}`}>{e}</button>)}</div>
        <div className="flex gap-3"><button onClick={() => setIsAddingField(false)} className="flex-1 py-4 border-2 rounded-xl font-bold dark:border-neutral-700 dark:text-white">Cancelar</button><button onClick={handleAddField} className="flex-1 py-4 rounded-xl font-bold dark:bg-[#4ade80] dark:text-black bg-[#3E6837] text-white">Criar</button></div></div></div>)}
        
        {isAddingAnimal && (<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0"><div className={`rounded-t-[2.5rem] p-7 w-full max-w-md animate-slide-up ${isDarkMode ? 'bg-neutral-900' : 'bg-white'}`}><h3 className={`text-2xl font-black mb-6 ${isDarkMode ? 'text-white' : ''}`}>Registar Animal</h3><input className={`w-full border-2 rounded-xl p-4 mb-3 font-bold ${isDarkMode ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-[#FDFDF5] border-[#E0E4D6]'}`} placeholder="Nome" value={newAnimalName} onChange={e => setNewAnimalName(e.target.value)} /><input className={`w-full border-2 rounded-xl p-4 mb-3 font-bold ${isDarkMode ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-[#FDFDF5] border-[#E0E4D6]'}`} placeholder="Tag NFC" value={newAnimalTag} onChange={e => setNewAnimalTag(e.target.value)} /><div className="flex gap-3"><button onClick={() => setIsAddingAnimal(false)} className="flex-1 py-4 border-2 rounded-xl font-bold dark:border-neutral-700 dark:text-white">Cancelar</button><button onClick={handleAddAnimal} className="flex-1 py-4 rounded-xl font-bold dark:bg-[#4ade80] dark:text-black bg-[#3E6837] text-white">Guardar</button></div></div></div>)}

        {isAddingStock && (<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0"><div className={`rounded-t-[2.5rem] p-7 w-full max-w-md animate-slide-up ${isDarkMode ? 'bg-neutral-900' : 'bg-white'}`}><h3 className={`text-2xl font-black mb-6 ${isDarkMode ? 'text-white' : ''}`}>Novo Produto</h3><input className={`w-full border-2 rounded-xl p-4 mb-3 font-bold ${isDarkMode ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-[#FDFDF5] border-[#E0E4D6]'}`} placeholder="Nome" value={newStockData.name} onChange={e => setNewStockData({...newStockData, name: e.target.value})} /><input className={`w-full border-2 rounded-xl p-4 mb-3 font-bold ${isDarkMode ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-[#FDFDF5] border-[#E0E4D6]'}`} type="number" placeholder="Quantidade" value={newStockData.quantity} onChange={e => setNewStockData({...newStockData, quantity: e.target.value})} /><div className="flex gap-3"><button onClick={() => setIsAddingStock(false)} className="flex-1 py-4 border-2 rounded-xl font-bold dark:border-neutral-700 dark:text-white">Cancelar</button><button onClick={handleAddStock} className="flex-1 py-4 rounded-xl font-bold dark:bg-[#4ade80] dark:text-black bg-[#3E6837] text-white">Adicionar</button></div></div></div>)}

        {isAddingSale && (<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0"><div className={`rounded-t-[2.5rem] p-7 w-full max-w-md animate-slide-up ${isDarkMode ? 'bg-neutral-900' : 'bg-white'}`}><h3 className={`text-2xl font-black mb-6 ${isDarkMode ? 'text-white' : ''}`}>Registar Receita</h3><input className={`w-full border-2 rounded-xl p-4 mb-3 font-bold ${isDarkMode ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-[#FDFDF5] border-[#E0E4D6]'}`} placeholder="Descrição" value={saleDesc} onChange={e => setSaleDesc(e.target.value)} /><input className={`w-full border-2 rounded-xl p-4 mb-3 font-bold ${isDarkMode ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-[#FDFDF5] border-[#E0E4D6]'}`} type="number" placeholder="Valor (€)" value={saleAmount} onChange={e => setSaleAmount(e.target.value)} /><div className="flex gap-3"><button onClick={() => setIsAddingSale(false)} className="flex-1 py-4 border-2 rounded-xl font-bold dark:border-neutral-700 dark:text-white">Cancelar</button><button onClick={handleAddSale} className="flex-1 py-4 rounded-xl font-bold dark:bg-[#4ade80] dark:text-black bg-[#3E6837] text-white">Guardar</button></div></div></div>)}

      </div>

      {/* Bottom Nav */}
      <div className={`absolute bottom-0 left-0 right-0 backdrop-blur-2xl h-20 pb-4 flex justify-around items-center z-40 border-t px-4 shadow-lg transition-colors ${isDarkMode ? 'bg-neutral-950/95 border-neutral-800' : 'bg-[#FDFDF5]/95 border-[#E0E4D6]'}`}>
        {[ {id: 'home', icon: Home, label: 'Início'}, {id: 'animal', icon: Scan, label: 'Animal'}, {id: 'cultivo', icon: Sprout, label: 'Cultivo'}, {id: 'stocks', icon: ClipboardList, label: 'Stocks'}, {id: 'finance', icon: Coins, label: 'Contas'} ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex flex-col items-center gap-1 flex-1 active:scale-90 transition-transform">
            <div className={`h-9 w-14 rounded-xl flex items-center justify-center transition-colors ${activeTab === tab.id ? (isDarkMode ? 'bg-[#4ade80] text-neutral-900' : 'bg-[#3E6837] text-white shadow-md') : (isDarkMode ? 'text-neutral-500' : 'bg-transparent text-[#74796D]')}`}><tab.icon size={26} strokeWidth={activeTab === tab.id ? 2.5 : 2} /></div>
            <span className={`text-[9px] font-black uppercase tracking-tighter transition-colors ${activeTab === tab.id ? (isDarkMode ? 'text-white' : 'text-[#042100]') : (isDarkMode ? 'text-neutral-500' : 'text-[#74796D]')}`}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}