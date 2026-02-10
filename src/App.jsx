import React, { useState, useEffect, useRef, useMemo } from 'react';
// Importação via CDN para garantir compatibilidade total no browser e evitar erros de compilação
import * as mqttModule from 'https://cdn.jsdelivr.net/npm/mqtt@5.10.1/+esm';
import { 
  Scan, Sprout, Activity, Tractor, Bell, WifiOff, Cloud, Database, Home,
  Map as MapIcon, List, ClipboardList, Plus, Coins, Camera, Loader2, Settings, 
  Trash2, AlertTriangle, Brain, Scale, Calendar, Wifi, Zap, X, Check, Milk, 
  ChevronRight, ArrowUpRight, ArrowDownRight, Warehouse, Thermometer, Droplets,
  CloudLightning, Snowflake, RefreshCcw, MapPin, Search, Wind, Filter, Package,
  TrendingUp, TrendingDown, Wallet, PieChart, Syringe, Utensils, Sun, CloudRain
} from 'lucide-react';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, YAxis, BarChart, Bar, Cell, LineChart, Line } from 'recharts';

// --- IMPORTAR COMPONENTES LOCAIS (VS Code) ---
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

/** * CONFIGURAÇÃO GLOBAL
 * Substitua a variável abaixo pela sua chave real do OpenWeatherMap.
 */
const OPENWEATHER_API_KEY = "c7f76605724ecafb54933077ede4166a"; 

const INITIAL_FIELD_LOGS = [
  { id: 101, fieldId: 2, date: '15/01/2026', description: 'Poda de Inverno realizada', type: 'intervention' },
  { id: 102, fieldId: 1, date: '01/02/2026', description: 'Adubação de fundo (NPK)', type: 'treatment' }
];

// --- COMPONENTE PRINCIPAL APP ---

export default function App() {
  // 1. Estados de Navegação e Sistema
  const [activeTab, setActiveTab] = useState('home');
  const [notification, setNotification] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedAnimalId, setScannedAnimalId] = useState(null);
  const [userName, setUserName] = useState(() => localStorage.getItem('as_user') || 'Agricultor');
  const [expandedFieldId, setExpandedFieldId] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);
  const [cultivoView, setCultivoView] = useState('list');

  // --- ESTADOS METEOROLOGIA REAL ---
  const [weather, setWeather] = useState({ 
    temp: 0, condition: 'A detetar...', precip: 0, loading: true, locationName: 'Localização GPS', alerts: [], wind: 0
  });
  const [forecastData, setForecastData] = useState([]);
  const [isForecastModalOpen, setIsForecastModalOpen] = useState(false);
  
  // MQTT
  const mqttClient = useRef(null);
  const [mqttStatus, setMqttStatus] = useState('disconnected');

  // Estados com Persistência
  const [animals, setAnimals] = useState(() => { try { return JSON.parse(localStorage.getItem('as_animals')) || INITIAL_ANIMALS; } catch { return INITIAL_ANIMALS; } });
  const [fields, setFields] = useState(() => { try { return JSON.parse(localStorage.getItem('as_fields')) || INITIAL_FIELDS; } catch { return INITIAL_FIELDS; } });
  const [fieldLogs, setFieldLogs] = useState(() => { try { return JSON.parse(localStorage.getItem('as_field_logs')) || INITIAL_FIELD_LOGS; } catch { return []; } });
  const [tasks, setTasks] = useState(() => { try { return JSON.parse(localStorage.getItem('as_tasks')) || INITIAL_TASKS; } catch { return INITIAL_TASKS; } });
  const [stocks, setStocks] = useState(() => { try { return JSON.parse(localStorage.getItem('as_stocks')) || INITIAL_STOCKS; } catch { return INITIAL_STOCKS; } });
  const [transactions, setTransactions] = useState(() => { try { return JSON.parse(localStorage.getItem('as_finance')) || []; } catch { return []; } });
  const [batches, setBatches] = useState(() => { try { return JSON.parse(localStorage.getItem('as_batches')) || INITIAL_BATCHES; } catch { return []; } });

  // Modais de Criação
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldArea, setNewFieldArea] = useState('');
  const [newFieldType, setNewFieldType] = useState('🌽');
  const [isAddingAnimal, setIsAddingAnimal] = useState(false);
  const [newAnimalName, setNewAnimalName] = useState('');
  const [newAnimalTag, setNewAnimalTag] = useState('');
  const [newAnimalType, setNewAnimalType] = useState('Vaca');
  const [isAddingSale, setIsAddingSale] = useState(false);
  const [saleDesc, setSaleDesc] = useState('');
  const [saleAmount, setSaleAmount] = useState('');
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [newStockData, setNewStockData] = useState({ name: '', category: 'feed', quantity: '', unit: 'kg', minLevel: '', price: '' });
  
  const [isPredictionOpen, setIsPredictionOpen] = useState(false);
  const [predictionData, setPredictionData] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [confirmation, setConfirmation] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // --- LÓGICA WEATHER REAL COM BACKOFF ---
  const fetchWeather = async (lat, lon) => {
    if (!OPENWEATHER_API_KEY) {
      setWeather({ temp: 18, condition: 'Céu Limpo (Demo)', precip: 0, loading: false, locationName: 'Laundos, PT', alerts: [], wind: 5 });
      return;
    }

    const fetchData = async (url) => {
      let delay = 1000;
      for (let i = 0; i < 5; i++) {
        try {
          const res = await fetch(url);
          if (res.ok) return await res.json();
        } catch (e) {
          await new Promise(r => setTimeout(r, delay));
          delay *= 2;
        }
      }
      throw new Error("Falha na API Weather após 5 tentativas.");
    };

    try {
      // 1. Tempo Atual
      const current = await fetchData(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=pt&appid=${OPENWEATHER_API_KEY}`);
      
      const alerts = [];
      if (current.main.temp <= 2) alerts.push({ type: 'frost', msg: 'Atenção: Risco de Geada!' });
      if (current.wind.speed * 3.6 > 50) alerts.push({ type: 'storm', msg: 'Atenção: Ventos Fortes!' });

      setWeather({ 
        temp: Math.round(current.main.temp), 
        condition: current.weather[0].description, 
        precip: current.rain ? current.rain['1h'] || 0 : 0, 
        locationName: current.name, 
        loading: false, 
        alerts,
        wind: Math.round(current.wind.speed * 3.6)
      });

      // 2. Previsão 5 dias
      const forecast = await fetchData(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=pt&appid=${OPENWEATHER_API_KEY}`);
      
      // Filtrar apenas uma leitura por dia (ex: 12:00)
      const dailyData = forecast.list.filter(item => item.dt_txt.includes("12:00:00")).map(item => ({
        day: new Date(item.dt * 1000).toLocaleDateString('pt-PT', { weekday: 'long' }),
        tempMax: Math.round(item.main.temp_max),
        tempMin: Math.round(item.main.temp_min),
        condition: item.weather[0].description,
        precip: item.pop * 100 > 0 ? `${(item.pop * 10).toFixed(1)}mm` : '0mm',
        icon: item.weather[0].main.toLowerCase() // Adicionado para o modal usar
      }));
      setForecastData(dailyData);

    } catch (e) {
      showNotification("Erro ao obter meteorologia.");
      setWeather(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(41.15, -8.62), // Fallback Porto/Laundos
        { enableHighAccuracy: true }
      );
    }
    const interval = setInterval(() => {
       navigator.geolocation.getCurrentPosition((pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude));
    }, 1800000); // 30min
    return () => clearInterval(interval);
  }, []);

  // --- LÓGICA MQTT ---
  useEffect(() => {
    const connect = mqttModule.connect || (mqttModule.default && mqttModule.default.connect);
    if (!connect) return;
    const host = 'wss://broker.emqx.io:8084/mqtt';
    const options = { keepalive: 60, clientId: 'as_web_' + Math.random().toString(16).slice(2, 8), clean: true };

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
        const fieldId = parseInt(topic.split('/')[2]);
        setFields(curr => curr.map(f => {
          if (f.id === fieldId) {
            if (topic.includes('humidity')) {
              const val = parseFloat(message);
              return { 
                ...f, 
                humidity: val,
                humidityHistory: [...(f.humidityHistory || []).slice(-10), { 
                  time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
                  hum: val 
                }]
              };
            }
            if (topic.includes('irrigation/status')) return { ...f, irrigation: message === 'ON' };
          }
          return f;
        }));
      });
    }
    return () => { if (mqttClient.current) mqttClient.current.end(); };
  }, [fields.length]);

  // PERSISTÊNCIA
  useEffect(() => {
    localStorage.setItem('as_animals', JSON.stringify(animals));
    localStorage.setItem('as_fields', JSON.stringify(fields));
    localStorage.setItem('as_tasks', JSON.stringify(tasks));
    localStorage.setItem('as_stocks', JSON.stringify(stocks));
    localStorage.setItem('as_finance', JSON.stringify(transactions));
    localStorage.setItem('as_user', userName);
    localStorage.setItem('agrosmart_field_logs', JSON.stringify(fieldLogs));
    localStorage.setItem('agrosmart_batches', JSON.stringify(batches));
  }, [animals, fields, tasks, stocks, transactions, userName, fieldLogs, batches]);
  
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); showNotification('Online'); };
    const handleOffline = () => { setIsOnline(false); showNotification('Modo Offline Ativo'); };
    window.addEventListener('online', handleOnline); window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  // HANDLERS
  const showNotification = (msg) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };

  const toggleIrrigation = (fieldId) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    if (mqttClient.current && mqttStatus === 'connected') {
      const command = !field.irrigation ? 'ON' : 'OFF';
      mqttClient.current.publish(`agrosmart/fields/${fieldId}/irrigation/cmd`, command, { qos: 1 });
      showNotification(`Enviando ${command}...`);
      setFields(fields.map(f => f.id === fieldId ? { ...f, irrigation: !field.irrigation } : f));
      addFieldLog(fieldId, `Rega ${command} solicitada via App`);
    } else showNotification('Hardware Offline ❌');
  };

  const handlePredictYield = (field) => {
    if (!field.area) return showNotification("Área em falta.");
    const result = (field.area * field.cropCycle.yieldPerHa * (field.health === 'Excelente' ? 1.2 : 1)).toFixed(1);
    setPredictionData({ field: field.name, crop: field.cropCycle.label, yield: result, area: field.area, health: field.health, harvestDate: field.cropCycle.harvest });
    setIsPredictionOpen(true);
  };

  const handleAddTask = (title, dateRaw) => {
    let formattedDate = 'Hoje';
    if (dateRaw) {
        const d = new Date(dateRaw);
        formattedDate = d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    setTasks(prev => [...prev, { id: Date.now(), title, date: formattedDate, done: false }]);
    showNotification('Tarefa agendada!');
  };

  const toggleTask = (id) => { setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t)); };
  
  const deleteTask = (id) => {
    requestConfirmation("Eliminar Tarefa", "Deseja remover esta tarefa?", () => {
      setTasks(prev => prev.filter(t => t.id !== id));
      showNotification('Tarefa removida.');
    });
  };

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    const newF = { id: Date.now(), name: newFieldName, area: parseFloat(newFieldArea), img: newFieldType, health: 'Bom', humidity: 0, temp: 20, irrigation: false, cropCycle: CROP_CALENDAR[newFieldType], ndviHistory: [], humidityHistory: [] };
    setFields([...fields, newF]); setIsAddingField(false); setNewFieldName('');
  };

  const handleAddAnimal = () => {
    if (!newAnimalName.trim()) return;
    const newA = { id: newAnimalTag || 'PT-TEMP', name: newAnimalName, type: newAnimalType, status: 'Saudável', productionHistory: [] };
    setAnimals([...animals, newA]); setIsAddingAnimal(false); setNewAnimalName('');
  };

  const handleAddStock = () => {
    const newS = { id: Date.now(), ...newStockData, quantity: parseFloat(newStockData.quantity), price: parseFloat(newStockData.price) };
    setStocks([...stocks, newS]); setIsAddingStock(false);
  };

  const handleAddSale = () => {
    const t = { id: Date.now(), description: saleDesc, amount: parseFloat(saleAmount), type: 'income', date: new Date().toLocaleDateString('pt-PT') };
    setTransactions([t, ...transactions]); setIsAddingSale(false);
  };
  
  const updateStock = (id, amount) => {
    setStocks(prev => prev.map(s => s.id === id ? { ...s, quantity: Math.max(0, s.quantity + amount) } : s));
  };
  
  const updateStockPrice = (id, p) => setStocks(prev => prev.map(s => s.id === id ? {...s, price: parseFloat(p)} : s));

  const handleScanNFC = () => {
    setIsScanning(true);
    setTimeout(() => {
      const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
      setScannedAnimalId(randomAnimal.id); setIsScanning(false);
      showNotification(`Detetado: ${randomAnimal.name}`);
    }, 1500);
  };
  
  const handleScanForAdd = () => {
    setIsScanning(true);
    setTimeout(() => {
      const randomId = `PT-${Math.floor(10000 + Math.random() * 90000)}`;
      setNewAnimalTag(randomId);
      setIsScanning(false);
      setIsAddingAnimal(true);
      showNotification("Nova Tag detetada!");
    }, 2000);
  };

  const addAnimalProduction = (animalId, value) => {
    const todayStr = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
    setAnimals(prev => prev.map(a => a.id === animalId ? { ...a, productionHistory: [...(a.productionHistory || []), { day: todayStr, value }] } : a));
    showNotification(`Registo: ${value}L`);
  };
  
  const handleAddBatch = (newBatch) => {
    setBatches(prev => [newBatch, ...prev]);
    showNotification('Lote de produção criado!');
  };
  
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisResult({ status: 'Atenção', disease: 'Míldio', treatment: 'Aplicar fungicida à base de cobre.', confidence: '94.2%' });
      }, 2000);
    };
    reader.readAsDataURL(file);
  };

  const requestConfirmation = (title, message, action) => {
    setConfirmation({ isOpen: true, title, message, onConfirm: () => { action(); setConfirmation(p => ({ ...p, isOpen: false })); }, isDanger: true });
  };
  const closeConfirmation = () => setConfirmation(prev => ({ ...prev, isOpen: false }));
  
  const addFieldLog = (fieldId, description, location = null) => {
    const newLog = { id: Date.now(), fieldId, date: new Date().toLocaleDateString('pt-PT'), description, type: 'intervencao', location };
    setFieldLogs(prev => [newLog, ...prev]);
  };
  
  const handleResetData = () => { localStorage.clear(); window.location.reload(); };
  const handleSaveName = (n) => { setUserName(n); setIsSettingsOpen(false); showNotification(`Perfil atualizado.`); };

  const deleteField = (id) => {
    requestConfirmation("Eliminar Campo", "Deseja remover esta área e desligar os sensores?", () => {
      setFields(prev => prev.filter(f => f.id !== id));
      showNotification('Campo eliminado.');
    });
  };

  const totalIncome = transactions.reduce((acc, t) => acc + t.amount, 0);
  const scannedAnimal = scannedAnimalId ? animals.find(a => a.id === scannedAnimalId) : null;
  const notificationCount = (animals.filter(a => a.status !== 'Saudável').length) + (stocks.filter(s => s.quantity <= (s.minLevel || 0)).length) + (fields.filter(f => f.health.includes('Atenção')).length) + (weather.alerts.length);

  return (
    <div className="relative flex flex-col h-[100dvh] bg-[#FDFDF5] font-sans text-[#1A1C18] w-full max-w-md mx-auto shadow-2xl border-x border-gray-100 overflow-hidden">
      
      {/* Top Bar */}
      <div className="px-4 py-5 bg-[#FDFDF5] flex justify-between items-center z-30 sticky top-0 border-b border-[#E0E4D6] backdrop-blur-lg bg-opacity-95 flex-none">
        <button onClick={() => setIsSettingsOpen(true)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#EFF2E6] text-[#43483E] active:scale-90 shadow-sm transition-all"><Settings size={22} /></button>
        <div className="flex flex-col items-center">
            <span className="text-xl font-black italic text-[#3E6837] tracking-tight">AgroSmart</span>
            <div className="flex items-center gap-1.5 mt-1">
               <div className={`w-1.5 h-1.5 rounded-full ${mqttStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`}></div>
               <span className="text-[9px] text-[#43483E] font-black tracking-widest uppercase">{userName} • {mqttStatus === 'connected' ? 'LIVE' : 'OFF'}</span>
            </div>
        </div>
        <button onClick={() => setIsNotificationsOpen(true)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#EFF2E6] text-[#43483E] relative active:scale-90 transition-all">
          <Bell size={24} />
          {notificationCount > 0 && <span className="absolute top-3 right-3 w-3 h-3 bg-[#BA1A1A] border-[3px] border-[#FDFDF5] rounded-full animate-pulse"></span>}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-40 space-y-6 scroll-smooth">
        {notification && <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-[#1A1C18] text-white px-5 py-4 rounded-[1.5rem] shadow-2xl text-sm z-[150] flex items-center justify-between animate-slide-up border border-white/5 w-11/12 max-w-xs"><span>{notification}</span><button onClick={() => setNotification(null)} className="text-[#CBE6A2] font-black px-4 py-2 bg-white/5 rounded-xl text-xs">OK</button></div>}

        <WeatherForecastModal isOpen={isForecastModalOpen} onClose={() => setIsForecastModalOpen(false)} forecast={forecastData} locationName={weather.locationName} />

        {/* --- ABAS --- */}
        
        {activeTab === 'home' && (
          <DashboardHome 
            weather={weather} fields={fields} tasks={tasks} stocks={stocks} animals={animals}
            onNavigate={setActiveTab} onToggleTask={toggleTask} onAddTask={handleAddTask} onDeleteTask={deleteTask} 
            onWeatherClick={() => setIsForecastModalOpen(true)} 
          />
        )}

        {activeTab === 'animal' && (
          <div className="space-y-8 animate-fade-in">
             {!scannedAnimalId && (
              <div className="text-center py-10">
                <h2 className="text-4xl font-black tracking-tighter uppercase italic text-[#1A1C18]">Tag Reader</h2>
                <p className="text-[#43483E] text-md font-medium px-8 mt-2">Aproxime o NFC ou escolha da lista abaixo.</p>
              </div>
            )}
            <div className="flex justify-center">
              <button onClick={handleScanNFC} disabled={isScanning} className={`w-44 h-44 rounded-[4.5rem] flex flex-col items-center justify-center transition-all duration-500 shadow-2xl border-[14px] border-white active:scale-90 ${isScanning ? 'bg-[#E1E4D5]' : 'bg-[#CBE6A2]'}`}>
                {isScanning ? <Loader2 className="w-14 h-14 text-[#3E6837] animate-spin" /> : <Scan className="w-14 h-14 text-[#2D4F00]" />}
                <span className="mt-3 text-[11px] font-black uppercase text-[#2D4F00] tracking-widest">{isScanning ? 'LENDO...' : 'LER TAG'}</span>
              </button>
            </div>
            {scannedAnimal && <AnimalCard animal={scannedAnimal} onAddProduction={(id, v) => showNotification(`Registo: ${v}`)} />}
            <button onClick={() => setIsAddingAnimal(true)} className="w-full py-4 text-xs font-black uppercase text-[#3E6837] bg-white rounded-3xl border-2 border-[#E0E4D6] active:bg-gray-50">Registar Novo Animal</button>
          </div>
        )}

        {activeTab === 'cultivo' && (
          <div className="space-y-5 animate-fade-in pb-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-[#1A1C18] font-black text-2xl uppercase italic tracking-tighter leading-none">Minhas Áreas</h2>
                <span className="text-[10px] font-black uppercase text-[#74796D] tracking-widest">{mqttStatus === 'connected' ? 'Hardware Sincronizado ✅' : 'Hardware Offline ❌'}</span>
              </div>
              <button onClick={() => setIsAddingField(true)} className="bg-[#3E6837] text-white w-12 h-12 rounded-2xl active:scale-90 shadow-lg flex items-center justify-center"><Plus size={28} /></button>
            </div>
            <div className="space-y-4">
              {fields.map(field => (
                <FieldCard 
                  key={field.id} field={field} isExpanded={expandedFieldId === field.id}
                  onToggleHistory={() => setExpandedFieldId(expandedFieldId === field.id ? null : field.id)}
                  logs={fieldLogs.filter(l => l.fieldId === field.id)}
                  onAddLog={addFieldLog} onToggleIrrigation={toggleIrrigation} onPredictYield={handlePredictYield} 
                  onDelete={deleteField}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'stocks' && (
          <div className="space-y-4 animate-fade-in">
             <div className="flex justify-between items-center px-1">
              <h2 className="text-[#1A1C18] font-black text-2xl uppercase italic tracking-tighter">Armazém</h2>
              <button onClick={() => setIsAddingStock(true)} className="bg-[#3E6837] text-white px-5 py-3 rounded-2xl text-xs font-black uppercase shadow-lg active:scale-95 transition-transform"><Plus size={18} className="inline mr-1" /> Produto</button>
            </div>
            <StockManager stocks={stocks} onUpdateStock={updateStock} onUpdatePrice={updateStockPrice} />
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-[#1A1C18] font-black text-2xl uppercase italic tracking-tighter">Contas</h2>
              <button onClick={() => setIsAddingSale(true)} className="bg-[#3E6837] text-white px-5 py-3 rounded-2xl text-xs font-black uppercase shadow-lg active:scale-95 tracking-widest">Nova Receita</button>
            </div>
            <FinanceManager transactions={transactions} stocks={stocks} />
          </div>
        )}
      </div>

      {/* --- MODAIS GLOBAIS --- */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onResetData={handleResetData} currentName={userName} onSaveName={handleSaveName} />
      <NotificationsModal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} weather={weather} animals={animals} fields={fields} stocks={stocks} onNavigate={(tab) => { setActiveTab(tab); setIsNotificationsOpen(false); }} />

      {/* IA Previsão Modal (Premium) */}
      {isPredictionOpen && predictionData && (
          <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-0">
            <div className="bg-white rounded-t-[3.5rem] w-full max-w-md shadow-2xl animate-slide-up pb-12 border-t border-[#E0E4D6] overflow-hidden">
               <div className="bg-[#3E6837] p-10 text-white text-center relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                 <div className="relative z-10">
                   <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/30 shadow-lg animate-pulse"><Brain size={40} /></div>
                   <h3 className="text-3xl font-black uppercase tracking-widest mb-1 italic">Previsão IA</h3>
                   <button onClick={() => setIsPredictionOpen(false)} className="absolute top-0 right-0 p-8 text-white/50 hover:text-white transition-colors"><X size={32} /></button>
                 </div>
               </div>
               <div className="p-8 space-y-8 text-center">
                 <p className="text-xs font-black text-[#74796D] uppercase tracking-widest">{predictionData.field} • {predictionData.crop}</p>
                 <div className="flex items-baseline justify-center gap-3 text-[#1A1C18]">
                    <span className="text-8xl font-black tracking-tighter">{predictionData.yield}</span>
                    <span className="text-sm font-black opacity-40 uppercase tracking-widest">Toneladas</span>
                 </div>
                 <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-[#FDFDF5] p-5 rounded-[2rem] border border-[#EFF2E6] flex flex-col items-center shadow-sm"><Scale size={20} className="text-[#3E6837] mb-2" /><span className="text-[10px] font-black uppercase text-[#74796D]">Área</span><p className="text-xl font-bold tracking-tighter">{predictionData.area} ha</p></div>
                    <div className="bg-[#FDFDF5] p-5 rounded-[2rem] border border-[#EFF2E6] flex flex-col items-center shadow-sm"><Activity size={20} className="text-[#3E6837] mb-2" /><span className="text-[10px] font-black uppercase text-[#74796D]">Saúde</span><p className="text-xl font-bold tracking-tighter">{predictionData.health}</p></div>
                 </div>
                 <button onClick={() => setIsPredictionOpen(false)} className="w-full mt-8 py-6 bg-[#1A1C18] text-white rounded-3xl font-black text-xs uppercase shadow-2xl active:scale-95 transition-all tracking-[0.2em] shadow-green-900/20">Concluir Relatório</button>
               </div>
            </div>
          </div>
        )}

      {/* Modal de Confirmação */}
      {confirmation.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 backdrop-blur-sm px-0 animate-fade-in">
          <div className="bg-white rounded-t-[3rem] p-8 w-full max-w-md shadow-2xl animate-slide-up pb-12 border-t border-[#E0E4D6]">
            <div className="text-center mb-8">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${confirmation.isDanger ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}><Trash2 size={40} /></div>
              <h3 className="text-2xl font-black text-[#1A1C18] mb-3 tracking-tighter uppercase italic">{confirmation.title}</h3>
              <p className="text-sm text-[#43483E] px-4 font-medium leading-relaxed">{confirmation.message}</p>
            </div>
            <div className="flex gap-4">
              <button onClick={closeConfirmation} className="flex-1 py-6 border-2 border-[#E0E4D6] rounded-3xl font-black text-xs uppercase tracking-widest text-[#43483E]">Cancelar</button>
              <button onClick={confirmation.onConfirm} className={`flex-1 py-6 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl ${confirmation.isDanger ? 'bg-red-600 shadow-red-200' : 'bg-blue-600 shadow-blue-200'}`}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAIS DE CRIAÇÃO --- */}
      {isAddingField && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm px-0 animate-fade-in">
          <div className="bg-white rounded-t-[3.5rem] p-8 w-full max-w-md shadow-2xl animate-slide-up border-t border-[#E0E4D6]">
            <div className="w-16 h-1.5 bg-gray-200 rounded-full mx-auto mb-8 shadow-inner"></div>
            <h3 className="text-3xl font-black text-[#1A1C18] mb-10 uppercase italic tracking-tighter">Novo Campo</h3>
            <div className="space-y-8">
              <input type="text" className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-[2rem] px-6 py-6 text-xl font-black outline-none focus:border-[#3E6837] transition-all shadow-sm" placeholder="Ex: Vinha Norte" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} />
              <input type="number" className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-[2rem] px-6 py-6 text-xl font-black outline-none focus:border-[#3E6837] transition-all shadow-sm" placeholder="Hectares (Ex: 2.5)" value={newFieldArea} onChange={(e) => setNewFieldArea(e.target.value)} />
              <div className="flex gap-4">
                <button onClick={() => setIsAddingField(false)} className="flex-1 py-6 rounded-3xl border-2 border-[#E0E4D6] text-[#43483E] font-black text-xs uppercase tracking-widest active:bg-gray-100 transition-colors">Cancelar</button>
                <button onClick={handleAddField} className="flex-1 py-6 rounded-3xl bg-[#3E6837] text-white font-black text-xs uppercase shadow-xl tracking-widest active:scale-95 transition-all">Criar Área</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddingAnimal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm px-0 animate-fade-in">
          <div className="bg-white rounded-t-[3.5rem] p-8 w-full max-w-md shadow-2xl animate-slide-up border-t border-[#E0E4D6]">
            <h3 className="text-2xl font-black text-[#1A1C18] mb-8 uppercase italic text-center">Registar Animal</h3>
            <div className="space-y-6">
              <input type="text" className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-3xl px-6 py-5 text-lg font-black outline-none focus:border-[#3E6837]" placeholder="Nome do Animal" value={newAnimalName} onChange={e => setNewAnimalName(e.target.value)} />
              <input type="text" className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-3xl px-6 py-5 text-lg font-black outline-none focus:border-[#3E6837]" placeholder="ID da Tag (NFC)" value={newAnimalTag} onChange={e => setNewAnimalTag(e.target.value)} />
              <div className="flex gap-4 pt-6">
                <button onClick={() => setIsAddingAnimal(false)} className="flex-1 py-6 border-2 rounded-3xl font-black text-xs uppercase text-[#43483E] active:bg-gray-100">Cancelar</button>
                <button onClick={handleAddAnimal} className="flex-1 py-6 bg-[#3E6837] text-white rounded-3xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddingSale && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm px-0 animate-fade-in">
          <div className="bg-white rounded-t-[3.5rem] p-8 w-full max-w-md shadow-2xl animate-slide-up border-t border-[#E0E4D6]">
            <h3 className="text-2xl font-black text-[#1A1C18] mb-8 uppercase italic text-center tracking-tighter">Registar Receita</h3>
            <div className="space-y-6">
              <input type="text" className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-3xl px-6 py-5 font-black outline-none" placeholder="Ex: Venda de Leite" value={saleDesc} onChange={e => setSaleDesc(e.target.value)} />
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-2xl text-[#3E6837]">€</span>
                <input type="number" className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-3xl pl-14 pr-6 py-6 text-2xl font-black text-[#3E6837] outline-none" placeholder="0.00" value={saleAmount} onChange={e => setSaleAmount(e.target.value)} />
              </div>
              <div className="flex gap-4 pt-6">
                <button onClick={() => setIsAddingSale(false)} className="flex-1 py-6 border-2 rounded-3xl font-black text-xs uppercase text-[#43483E] active:bg-gray-100">Cancelar</button>
                <button onClick={handleAddSale} className="flex-1 py-6 bg-[#3E6837] text-white rounded-3xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddingStock && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm px-0 animate-fade-in">
          <div className="bg-white rounded-t-[3.5rem] p-8 w-full max-w-md shadow-2xl animate-slide-up border-t border-[#E0E4D6]">
            <h3 className="text-2xl font-black text-[#1A1C18] mb-8 uppercase italic text-center tracking-tighter">Novo Produto</h3>
            <div className="space-y-6">
              <input type="text" className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-3xl px-6 py-5 font-black outline-none" placeholder="Nome do Produto" value={newStockData.name} onChange={e => setNewStockData({...newStockData, name: e.target.value})} />
              <div className="flex gap-3">
                <input type="number" className="flex-1 bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-3xl px-4 py-5 font-black outline-none" placeholder="Qtd" value={newStockData.quantity} onChange={e => setNewStockData({...newStockData, quantity: e.target.value})} />
                <input type="number" className="flex-1 bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-3xl px-4 py-5 font-black outline-none" placeholder="Preço" value={newStockData.price} onChange={e => setNewStockData({...newStockData, price: e.target.value})} />
              </div>
              <div className="flex gap-4 pt-6">
                <button onClick={() => setIsAddingStock(false)} className="flex-1 py-6 border-2 rounded-3xl font-black text-xs uppercase text-[#43483E] active:bg-gray-100">Cancelar</button>
                <button onClick={handleAddStock} className="flex-1 py-6 bg-[#3E6837] text-white rounded-3xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all">Adicionar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#FDFDF5]/95 backdrop-blur-2xl h-20 pb-4 flex justify-around items-center z-40 border-t border-[#E0E4D6] px-4 shadow-lg">
        {[ 
          {id: 'home', icon: Home, label: 'Início'}, 
          {id: 'animal', icon: Scan, label: 'Animal'}, 
          {id: 'cultivo', icon: Sprout, label: 'Cultivo'}, 
          {id: 'stocks', icon: ClipboardList, label: 'Stocks'}, 
          {id: 'finance', icon: Coins, label: 'Contas'} 
        ].map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); const container = document.querySelector('.overflow-y-auto'); if (container) container.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex flex-col items-center gap-1 flex-1 py-1 relative active:scale-90 transition-transform duration-300">
            <div className={`h-9 w-14 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === tab.id ? 'bg-[#3E6837] text-white shadow-md' : 'bg-transparent text-[#74796D]'}`}><tab.icon size={26} /></div>
            <span className={`text-[9px] font-black uppercase tracking-tighter transition-colors duration-300 ${activeTab === tab.id ? 'text-[#042100]' : 'text-[#74796D]'}`}>{tab.label}</span>
          </button>
        ))}
      </div>
      
      {/* --- ESTILOS GLOBAIS --- */}
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes progress-indeterminate { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-progress-indeterminate { animation: progress-indeterminate 1.5s infinite linear; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}