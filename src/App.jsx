import React, { useState, useEffect, useRef, useMemo } from 'react';
// Importação via CDN compatível com browser para evitar erros de resolução de módulos
import * as mqttModule from 'https://cdn.jsdelivr.net/npm/mqtt@5.10.1/+esm';
import { 
  Scan, Sprout, Activity, Tractor, Bell, WifiOff, Cloud, Database, Home,
  Map as MapIcon, List, ClipboardList, Plus, Coins, Camera, Loader2, Settings, 
  Trash2, AlertTriangle, Brain, Scale, Calendar, Wifi, Zap, X, Check, Milk, 
  ChevronRight, ArrowUpRight, ArrowDownRight, Warehouse, Thermometer, Droplets
} from 'lucide-react';

/** * NOTA PARA O UTILIZADOR:
 * Para que a pré-visualização funcione sem erros, os componentes importados abaixo
 * devem existir na sua pasta local. Se estiver a copiar este código para o seu projeto modular,
 * mantenha os imports. Se quiser testar tudo num único ficheiro, os componentes
 * teriam de ser definidos dentro deste ficheiro.
 */

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
  const [weather, setWeather] = useState({ temp: 23, condition: 'Limpo', precip: 0, loading: true });
  
  // --- 2. ESTADOS MQTT (HARDWARE REAL) ---
  const mqttClient = useRef(null);
  const [mqttStatus, setMqttStatus] = useState('disconnected');

  // --- 3. ESTADOS DE MODAIS DE CRIAÇÃO (TODOS OS CAMPOS) ---
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

  // Estados Globais de UI, IA e Deteção
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false); 
  const [userName, setUserName] = useState(() => localStorage.getItem('agrosmart_username') || 'Agricultor');
  const [isPredictionOpen, setIsPredictionOpen] = useState(false);
  const [predictionData, setPredictionData] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Modal de Confirmação Profissional
  const [confirmation, setConfirmation] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isDanger: true });

  // --- 4. ESTADOS COM PERSISTÊNCIA (BASE DE DADOS LOCAL) ---
  const [animals, setAnimals] = useState(() => { try { return JSON.parse(localStorage.getItem('agrosmart_animals')) || INITIAL_ANIMALS; } catch { return INITIAL_ANIMALS; } });
  const [fields, setFields] = useState(() => { try { return JSON.parse(localStorage.getItem('agrosmart_fields')) || INITIAL_FIELDS; } catch { return INITIAL_FIELDS; } });
  const [fieldLogs, setFieldLogs] = useState(() => { try { return JSON.parse(localStorage.getItem('agrosmart_field_logs')) || INITIAL_FIELD_LOGS; } catch { return []; } });
  const [tasks, setTasks] = useState(() => { try { return JSON.parse(localStorage.getItem('agrosmart_tasks')) || INITIAL_TASKS; } catch { return INITIAL_TASKS; } });
  const [stocks, setStocks] = useState(() => { try { return JSON.parse(localStorage.getItem('agrosmart_stocks')) || INITIAL_STOCKS; } catch { return INITIAL_STOCKS; } });
  const [transactions, setTransactions] = useState(() => { try { return JSON.parse(localStorage.getItem('agrosmart_finance')) || []; } catch { return []; } });
  const [batches, setBatches] = useState(() => { try { return JSON.parse(localStorage.getItem('agrosmart_batches')) || INITIAL_BATCHES; } catch { return []; } });

  // --- 5. LÓGICA MQTT REESCRITA (RESOLVE ERROS DE CONEXÃO E REFERÊNCIA) ---
  useEffect(() => {
    // Garantir que a função connect existe no módulo carregado
    const mqttConnect = mqttModule.connect || (mqttModule.default && mqttModule.default.connect);
    
    if (!mqttConnect) {
      console.warn('[MQTT] Função de conexão não encontrada. Verifique a importação.');
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
      console.log('[MQTT] A tentar ligar ao broker...');
      mqttClient.current = mqttConnect(host, options);

      mqttClient.current.on('connect', () => {
        setMqttStatus('connected');
        showNotification('Hardware Sincronizado 📡');
        // Subscrever tópicos de todos os campos para humidade real
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
                humidityHistory: [...(f.humidityHistory || []).slice(-10), { 
                  time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
                  hum: val 
                }]
              };
            }
            if (topic.includes('irrigation/status')) {
              return { ...f, irrigation: message === 'ON' };
            }
          }
          return f;
        }));
      });

      mqttClient.current.on('error', (err) => {
        setMqttStatus('error');
        console.error('[MQTT] Erro:', err);
      });

      mqttClient.current.on('close', () => setMqttStatus('disconnected'));
    }

    // Cleanup ao desmontar
    return () => {
      if (mqttClient.current) {
        mqttClient.current.end();
        mqttClient.current = null;
      }
    };
  }, [fields.length]); // Re-subscreve se novos campos forem adicionados

  // --- 6. PERSISTÊNCIA E MONITORIZAÇÃO ---
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

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); showNotification('Online'); };
    const handleOffline = () => { setIsOnline(false); showNotification('Modo Offline'); };
    window.addEventListener('online', handleOnline); window.addEventListener('offline', handleOffline);
    
    const weatherTimer = setTimeout(() => {
      setWeather({ temp: 21, condition: 'Céu Limpo', precip: 0, loading: false });
    }, 1500);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(weatherTimer);
    };
  }, []);

  const showNotification = (msg) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };

  // --- 7. LÓGICA DE COMANDO DE REGA (MQTT REAL) ---
  const toggleIrrigation = (fieldId) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;

    if (mqttClient.current && mqttStatus === 'connected') {
      const command = !field.irrigation ? 'ON' : 'OFF';
      // Publicar comando para o ESP32/Arduino
      mqttClient.current.publish(`agrosmart/fields/${fieldId}/irrigation/cmd`, command, { qos: 1 });
      showNotification(`Enviando ${command} para o hardware...`);
      
      // Atualização imediata para UI
      setFields(fields.map(f => f.id === fieldId ? { ...f, irrigation: !field.irrigation } : f));
      addFieldLog(fieldId, `Rega ${command} solicitada via App`);
    } else {
      showNotification('Hardware Offline ❌ Verifique a ligação MQTT.');
    }
  };

  // --- 8. LÓGICA DE NEGÓCIO: IA E GESTÃO ---
  const handlePredictYield = (field) => {
    if (!field.area || !field.cropCycle) { showNotification("Dados insuficientes."); return; }
    const yieldHa = field.cropCycle.yieldPerHa || 10;
    const healthFactor = field.health === 'Excelente' ? 1.2 : field.health === 'Bom' ? 1.0 : 0.7;
    const result = (field.area * yieldHa * healthFactor).toFixed(1);
    setPredictionData({ 
      field: field.name, crop: field.cropCycle.label, img: field.img, 
      area: field.area, health: field.health, harvestDate: field.cropCycle.harvest, 
      yield: result 
    });
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
    if (!newFieldName.trim()) { showNotification('Dê um nome ao campo.'); return; }
    const area = parseFloat(newFieldArea) || 1.0;
    const cycle = CROP_CALENDAR[newFieldType] || { label: 'Geral', plant: 'N/A', harvest: 'N/A' };
    const newF = { id: Date.now(), name: newFieldName, humidity: 0, temp: 20, irrigation: false, health: 'Bom', img: newFieldType, area, cropCycle: cycle };
    setFields(prev => [...prev, newF]);
    setIsAddingField(false); setNewFieldName(''); setNewFieldArea('');
    showNotification(`Campo criado e sincronizado.`);
  };

  const deleteField = (id) => {
    requestConfirmation("Eliminar Campo", "Perderá todos os dados deste campo e desligará os sensores virtuais.", () => {
      setFields(prev => prev.filter(f => f.id !== id));
      showNotification('Campo eliminado.');
    });
  };

  const handleAddAnimal = () => {
    if (!newAnimalName.trim() || !newAnimalTag.trim()) { showNotification('Preencha os dados.'); return; }
    const newA = { id: newAnimalTag, name: newAnimalName, type: newAnimalType, age: 'N/A', weight: 'N/A', status: 'Saudável', lastVetVisit: 'N/A', notes: 'Manual', feed: 'Padrão', needs: [], productionHistory: [] };
    setAnimals(prev => [...prev, newA]);
    setIsAddingAnimal(false); setNewAnimalName(''); setNewAnimalTag('');
    showNotification('Animal registado!');
  };

  const addAnimalProduction = (animalId, value) => {
    const today = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
    setAnimals(prev => prev.map(a => a.id === animalId ? { ...a, productionHistory: [...(a.productionHistory || []), { day: today, value }] } : a));
    showNotification(`Produção de ${value}L registada.`);
  };

  const updateStock = (id, amount) => {
    setStocks(prev => prev.map(s => s.id === id ? { ...s, quantity: Math.max(0, s.quantity + amount) } : s));
  };

  const handleAddSale = () => {
    const amount = parseFloat(saleAmount);
    if (!isNaN(amount) && saleDesc.trim()) {
      setTransactions(prev => [...prev, { id: Date.now(), description: saleDesc, amount, type: 'income', date: new Date().toLocaleDateString('pt-PT') }]);
      setIsAddingSale(false); setSaleDesc(''); setSaleAmount('');
      showNotification('Receita registada.');
    }
  };

  const handleAddStock = () => {
    if (!newStockData.name || !newStockData.quantity || !newStockData.price) { showNotification('Dados em falta.'); return; }
    const newS = { id: `s${Date.now()}`, ...newStockData, quantity: parseFloat(newStockData.quantity), minLevel: parseFloat(newStockData.minLevel) || 0, price: parseFloat(newStockData.price) };
    setStocks(prev => [...prev, newS]);
    setIsAddingStock(false);
    setNewStockData({ name: '', category: 'feed', quantity: '', unit: 'kg', minLevel: '', price: '' });
    showNotification('Produto adicionado ao armazém!');
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
        setAnalysisResult({ status: 'Atenção', disease: 'Míldio detetado', treatment: 'Aplicar fungicida à base de cobre.', confidence: '94.2%' });
      }, 2000);
    };
    reader.readAsDataURL(file);
  };

  const handleScanNFC = () => {
    setIsScanning(true);
    setTimeout(() => {
      if (animals.length > 0) {
        const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
        setScannedAnimalId(randomAnimal.id);
        showNotification(`Tag detetada: ${randomAnimal.name}`);
      }
      setIsScanning(false);
    }, 1500);
  };

  // --- 9. UTILITÁRIOS ---
  const requestConfirmation = (title, message, action, isDanger = true) => {
    setConfirmation({ isOpen: true, title, message, onConfirm: () => { action(); setConfirmation(prev => ({ ...prev, isOpen: false })); }, isDanger });
  };
  const closeConfirmation = () => setConfirmation(prev => ({ ...prev, isOpen: false }));
  
  const addFieldLog = (fieldId, description, location = null) => {
    const newLog = { id: Date.now(), fieldId, date: new Date().toLocaleDateString('pt-PT'), description, type: 'intervencao', location };
    setFieldLogs(prev => [newLog, ...prev]);
  };
  
  const handleResetData = () => { localStorage.clear(); window.location.reload(); };
  const handleSaveName = (n) => { setUserName(n); setIsSettingsOpen(false); showNotification(`Perfil atualizado.`); };

  const scannedAnimal = scannedAnimalId ? animals.find(a => a.id === scannedAnimalId) : null;
  const notificationCount = (animals.filter(a => a.status !== 'Saudável').length) + (stocks.filter(s => s.quantity <= (s.minLevel || 0)).length) + (fields.filter(f => f.health.includes('Atenção')).length);

  return (
    <div className="relative flex flex-col h-[100dvh] bg-[#FDFDF5] font-sans text-[#1A1C18] w-full max-w-md mx-auto shadow-2xl border-x border-gray-100 overflow-hidden">
      
      {/* Top Bar - Indicador Hardware Online */}
      <div className="px-4 py-5 bg-[#FDFDF5] flex justify-between items-center z-30 sticky top-0 border-b border-[#E0E4D6] backdrop-blur-lg bg-opacity-95 flex-none">
        <div className="flex gap-2">
            <button onClick={() => setIsSettingsOpen(true)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#EFF2E6] text-[#43483E] active:scale-90 transition-all shadow-sm"><Settings size={22} /></button>
        </div>
        <div className="flex flex-col items-center">
            <span className="text-xl font-black tracking-tight leading-none uppercase italic text-[#3E6837]">AgroSmart</span>
            <div className="flex items-center gap-1.5 mt-1">
               <div className={`w-1.5 h-1.5 rounded-full ${mqttStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`}></div>
               <span className="text-[9px] text-[#43483E] font-black tracking-widest uppercase">{userName} • {mqttStatus === 'connected' ? 'LIVE' : 'OFFLINE'}</span>
            </div>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setIsNotificationsOpen(true)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#EFF2E6] text-[#43483E] active:scale-90 transition-all relative">
            <Bell size={24} />
            {notificationCount > 0 && <span className="absolute top-3 right-3 w-3 h-3 bg-[#BA1A1A] border-[3px] border-[#FDFDF5] rounded-full animate-pulse"></span>}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-40 space-y-5 scroll-smooth w-full">
        {notification && <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-[#1A1C18] text-white px-5 py-4 rounded-[1.5rem] shadow-2xl text-sm z-[60] flex items-center justify-between animate-slide-up border border-white/5 w-11/12 max-w-xs"><span>{notification}</span><button onClick={() => setNotification(null)} className="text-[#CBE6A2] font-black px-4 py-2 bg-white/5 rounded-xl text-xs">OK</button></div>}

        {/* --- MODAIS GLOBAIS --- */}
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onResetData={handleResetData} currentName={userName} onSaveName={handleSaveName} />
        <NotificationsModal isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} weather={weather} animals={animals} fields={fields} stocks={stocks} onNavigate={(tab) => { setActiveTab(tab); setIsNotificationsOpen(false); }} />
        <WeatherForecastModal isOpen={isWeatherModalOpen} onClose={() => setIsWeatherModalOpen(false)} forecast={MOCK_FORECAST || []} />

        {/* Modal IA Previsão Premium */}
        {isPredictionOpen && predictionData && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-0">
            <div className="bg-white rounded-t-[2.5rem] w-full max-w-md shadow-2xl animate-slide-up pb-10 border-t border-[#E0E4D6] overflow-hidden">
               <div className="bg-[#3E6837] p-8 text-white text-center relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                 <div className="relative z-10">
                   <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/30 shadow-lg"><Brain size={32} /></div>
                   <h3 className="text-2xl font-black uppercase tracking-widest mb-1">Previsão IA</h3>
                   <button onClick={() => setIsPredictionOpen(false)} className="absolute top-0 right-0 p-4 text-white/50 hover:text-white"><X size={24} /></button>
                 </div>
               </div>
               <div className="p-6 space-y-6 text-center">
                 <p className="text-xs font-bold text-[#74796D] uppercase mb-2 tracking-widest">{predictionData.field} ({predictionData.crop})</p>
                 <div className="flex items-baseline justify-center gap-2 text-[#1A1C18]"><span className="text-6xl font-black tracking-tighter">{predictionData.yield}</span><span className="text-sm font-black opacity-40">TON</span></div>
                 <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-[#FDFDF5] p-4 rounded-3xl border border-[#EFF2E6] flex flex-col items-center"><Scale size={16} className="text-[#3E6837] mb-1" /><span className="text-[10px] font-black uppercase">Área</span><p className="text-xl font-bold">{predictionData.area} ha</p></div>
                    <div className="bg-[#FDFDF5] p-4 rounded-3xl border border-[#EFF2E6] flex flex-col items-center"><Activity size={16} className="text-[#3E6837] mb-1" /><span className="text-[10px] font-black uppercase">Vigor</span><p className="text-xl font-bold">{predictionData.health}</p></div>
                 </div>
                 <button onClick={() => setIsPredictionOpen(false)} className="w-full mt-6 py-5 bg-[#1A1C18] text-white rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all">Fechar Relatório</button>
               </div>
            </div>
          </div>
        )}

        {confirmation.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm px-0 animate-fade-in">
            <div className="bg-white rounded-t-[2.5rem] p-6 w-full max-w-md shadow-2xl animate-slide-up pb-10 border-t border-[#E0E4D6]">
              <div className="w-14 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 shadow-inner"></div>
              <div className="text-center mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmation.isDanger ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}><Trash2 size={32} /></div>
                <h3 className="text-xl font-black text-[#1A1C18] mb-2">{confirmation.title}</h3>
                <p className="text-sm text-[#43483E] px-4">{confirmation.message}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={closeConfirmation} className="flex-1 py-4 border-2 border-[#E0E4D6] rounded-2xl font-black text-xs uppercase text-[#43483E]">Cancelar</button>
                <button onClick={confirmation.onConfirm} className={`flex-1 py-4 text-white rounded-2xl font-black text-xs uppercase shadow-xl ${confirmation.isDanger ? 'bg-red-600' : 'bg-blue-600'}`}>Confirmar</button>
              </div>
            </div>
          </div>
        )}

        {/* --- RENDERIZAÇÃO DAS ABAS --- */}
        {activeTab === 'home' && <DashboardHome weather={weather} fields={fields} tasks={tasks} onNavigate={setActiveTab} onToggleTask={toggleTask} onAddTask={handleAddTask} onDeleteTask={deleteTask} onWeatherClick={() => setIsWeatherModalOpen(true)} />}

        {activeTab === 'animal' && (
          <div className="space-y-10 max-w-md mx-auto pb-4 pt-4">
            {!scannedAnimalId && (
              <div className="text-center space-y-6 animate-fade-in px-6">
                <div className="w-28 h-28 bg-[#E1E4D5] rounded-full flex items-center justify-center mx-auto text-[#3E6837] mb-4 shadow-inner border-4 border-white"><Scan size={56} /></div>
                <h2 className="text-3xl font-black text-[#1A1C18] tracking-tighter uppercase italic">NFC Scanner</h2>
                <p className="text-[#43483E] text-md font-medium">Aproxime o smartphone da tag auricular do animal para identificar.</p>
                <button onClick={() => setIsAddingAnimal(true)} className="bg-white px-6 py-3 rounded-2xl text-[#3E6837] font-bold shadow-sm border border-[#CBE6A2] active:scale-95 transition-all">Registo Manual</button>
              </div>
            )}
            <div className="flex flex-col items-center justify-center gap-6 py-4">
              <button onClick={handleScanNFC} disabled={isScanning} className={`relative w-48 h-48 rounded-[4rem] flex flex-col items-center justify-center transition-all duration-500 shadow-2xl border-[12px] border-white active:scale-90 ${isScanning ? 'bg-[#E1E4D5]' : 'bg-[#CBE6A2] text-[#2D4F00]'}`}>
                {isScanning ? <><Loader2 className="w-16 h-16 text-[#3E6837] animate-spin mb-4" /><span className="font-black text-[10px] tracking-widest uppercase">A LER...</span></> : <><Scan className="w-16 h-16 mb-4" /><span className="font-black text-[10px] tracking-widest uppercase">LER ANIMAL</span></>}
                <div className="absolute inset-0 rounded-[4rem] border-4 border-[#2D4F00]/5 animate-pulse"></div>
              </button>
            </div>
            {scannedAnimal && <AnimalCard data={scannedAnimal} onAddProduction={addAnimalProduction} />}
            {scannedAnimalId && <button onClick={() => setScannedAnimalId(null)} className="w-full py-5 text-[11px] font-black text-[#74796D] uppercase tracking-widest active:bg-gray-100 rounded-2xl">Limpar / Nova Leitura</button>}
          </div>
        )}

        {activeTab === 'cultivo' && (
          <div className="space-y-4 max-w-md mx-auto pb-4">
            <PestDetection selectedImage={selectedImage} isAnalyzing={isAnalyzing} result={analysisResult} onClose={() => {setSelectedImage(null); setAnalysisResult(null);}} />
            <div className="flex items-center justify-between px-1">
              <div><h2 className="text-[#1A1C18] font-black text-xl uppercase italic leading-none">Meus Cultivos</h2><span className="text-[9px] font-bold text-[#74796D] uppercase">{mqttStatus === 'connected' ? 'Hardware Online ✅' : 'Hardware Offline ❌'}</span></div>
              <div className="flex gap-2">
                <label className="flex items-center justify-center w-10 h-10 bg-white rounded-xl border border-[#E0E4D6] text-[#3E6837] cursor-pointer shadow-sm active:scale-90 transition-all"><Camera size={20} /><input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleImageUpload} /></label>
                <button onClick={() => setIsAddingField(true)} className="bg-[#3E6837] text-white w-10 h-10 rounded-xl active:scale-90 flex items-center justify-center shadow-sm"><Plus size={24} /></button>
              </div>
            </div>
            <div className="space-y-3">
              {fields.map(field => (
                <FieldCard 
                  key={field.id} field={field} isExpanded={expandedFieldId === field.id}
                  onToggleHistory={() => setExpandedFieldId(expandedFieldId === field.id ? null : field.id)}
                  logs={fieldLogs.filter(l => l.fieldId === field.id)}
                  onAddLog={addFieldLog} 
                  onToggleIrrigation={toggleIrrigation} 
                  onPredictYield={handlePredictYield}
                  onDelete={(id) => deleteField(id)}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'stocks' && (
          <div className="space-y-4 max-w-md mx-auto">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-[#1A1C18] font-black text-xl uppercase italic">Armazém</h2>
              <button onClick={() => setIsAddingStock(true)} className="bg-[#3E6837] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm active:scale-95"><Plus size={16} className="inline mr-1" /> Produto</button>
            </div>
            <StockManager stocks={stocks} onUpdateStock={updateStock} onUpdatePrice={(id, p) => setStocks(prev => prev.map(s => s.id === id ? {...s, price: parseFloat(p)} : s))} />
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-4 max-w-md mx-auto">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-[#1A1C18] font-black text-xl uppercase italic">Finanças</h2>
              <button onClick={() => setIsAddingSale(true)} className="bg-[#3E6837] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm active:scale-95"><Plus size={16} className="inline mr-1" /> Receita</button>
            </div>
            <FinanceManager transactions={transactions} stocks={stocks} />
          </div>
        )}
      </div>

      {/* --- MODAIS DE CRIAÇÃO --- */}
      {isAddingField && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm px-0 animate-fade-in">
          <div className="bg-white rounded-t-[2.5rem] p-7 w-full max-w-md shadow-2xl animate-slide-up pb-12 border-t border-[#E0E4D6] max-h-[85vh] overflow-y-auto">
            <div className="w-14 h-1.5 bg-gray-200 rounded-full mx-auto mb-8 shadow-inner sticky top-0"></div>
            <h3 className="text-2xl font-black text-[#1A1C18] mb-8 uppercase italic text-center">Novo Campo</h3>
            <div className="space-y-7 pb-10">
              <input type="text" className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-2xl px-5 py-5 text-lg font-bold outline-none focus:border-[#3E6837] transition-all" placeholder="Nome (Ex: Vinha Sul)" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} />
              <input type="number" className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-2xl px-5 py-5 text-lg font-bold outline-none focus:border-[#3E6837] transition-all" placeholder="Área (Hectares)" value={newFieldArea} onChange={(e) => setNewFieldArea(e.target.value)} />
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {Object.keys(CROP_CALENDAR).map(emoji => (
                  <button key={emoji} onClick={() => setNewFieldType(emoji)} className={`w-20 h-20 shrink-0 rounded-3xl flex items-center justify-center text-4xl border-4 transition-all active:scale-90 ${newFieldType === emoji ? 'border-[#3E6837] bg-[#CBE6A2]' : 'border-transparent bg-[#FDFDF5]'}`}>{emoji}</button>
                ))}
              </div>
              <div className="flex gap-4">
                <button onClick={() => setIsAddingField(false)} className="flex-1 py-5 rounded-2xl border-2 border-[#E0E4D6] text-[#43483E] font-black text-xs uppercase active:bg-gray-100">Cancelar</button>
                <button onClick={handleAddField} className="flex-1 py-5 rounded-2xl bg-[#3E6837] text-white font-black text-xs uppercase shadow-xl active:scale-95 transition-all">Criar Campo</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddingAnimal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm px-0 animate-fade-in">
          <div className="bg-white rounded-t-[2.5rem] p-7 w-full max-w-md shadow-2xl animate-slide-up pb-12 border-t border-[#E0E4D6] max-h-[85vh] overflow-y-auto">
            <h3 className="text-xl font-black text-[#1A1C18] mb-8 uppercase italic text-center">Registar Animal</h3>
            <div className="space-y-5">
              <input type="text" className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-2xl px-5 py-4 text-base font-bold outline-none focus:border-[#3E6837]" placeholder="Nome do Animal" value={newAnimalName} onChange={e => setNewAnimalName(e.target.value)} />
              <input type="text" className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-2xl px-5 py-4 text-base font-bold outline-none focus:border-[#3E6837]" placeholder="ID da Tag (NFC)" value={newAnimalTag} onChange={e => setNewAnimalTag(e.target.value)} />
              <div className="flex gap-2">
                {['Vaca', 'Bezerro', 'Cavalo', 'Porco'].map(type => (
                  <button key={type} onClick={() => setNewAnimalType(type)} className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all ${newAnimalType === type ? 'border-[#3E6837] bg-[#E1E4D5]' : 'border-[#E0E4D6]'}`}>{type}</button>
                ))}
              </div>
              <div className="flex gap-3 pt-8">
                <button onClick={() => setIsAddingAnimal(false)} className="flex-1 py-5 border-2 rounded-2xl font-black text-xs uppercase text-[#43483E] active:bg-gray-100">Cancelar</button>
                <button onClick={handleAddAnimal} className="flex-1 py-5 bg-[#3E6837] text-white rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddingStock && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm px-0 animate-fade-in">
          <div className="bg-white rounded-t-[2.5rem] p-7 w-full max-w-md shadow-2xl animate-slide-up border-t border-[#E0E4D6]">
            <h3 className="text-xl font-black text-[#1A1C18] mb-6 text-center uppercase italic">Novo Produto</h3>
            <div className="space-y-4 p-4">
              <input type="text" className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-2xl px-5 py-4 font-bold outline-none" placeholder="Nome do Produto" value={newStockData.name} onChange={e => setNewStockData({...newStockData, name: e.target.value})} />
              <div className="flex gap-2">
                <select className="flex-1 bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-2xl px-4 py-4 font-bold outline-none" value={newStockData.category} onChange={e => setNewStockData({...newStockData, category: e.target.value})}><option value="feed">Ração</option><option value="meds">Medicamento</option><option value="fertilizer">Adubo</option><option value="fuel">Combustível</option></select>
                <input type="text" className="w-1/3 bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-2xl px-4 py-4 font-bold text-center outline-none" placeholder="Unid." value={newStockData.unit} onChange={e => setNewStockData({...newStockData, unit: e.target.value})} />
              </div>
              <div className="flex gap-2">
                <input type="number" className="flex-1 bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-2xl px-4 py-4 font-bold outline-none" placeholder="Qtd Inicial" value={newStockData.quantity} onChange={e => setNewStockData({...newStockData, quantity: e.target.value})} />
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[#3E6837]">€</span>
                  <input type="number" className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-2xl pl-8 pr-4 py-4 font-bold outline-none" placeholder="Preço" value={newStockData.price} onChange={e => setNewStockData({...newStockData, price: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-3 pt-6">
                <button onClick={() => setIsAddingStock(false)} className="flex-1 py-4 border-2 rounded-2xl font-black text-xs uppercase active:bg-gray-100">Cancelar</button>
                <button onClick={handleAddStock} className="flex-1 py-4 bg-[#3E6837] text-white rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all">Adicionar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddingSale && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm px-0 animate-fade-in">
          <div className="bg-white rounded-t-[2.5rem] p-7 w-full max-w-md shadow-2xl animate-slide-up border-t border-[#E0E4D6]">
            <h3 className="text-xl font-black text-[#1A1C18] mb-6 text-center uppercase italic">Registar Receita</h3>
            <div className="space-y-5 p-4">
              <input type="text" className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-2xl px-5 py-4 font-bold outline-none" placeholder="Descrição da Venda (Ex: Leite)" value={saleDesc} onChange={e => setSaleDesc(e.target.value)} />
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-[#3E6837]">€</span>
                <input type="number" className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-2xl pl-10 pr-5 py-4 text-xl font-black text-[#3E6837] outline-none" placeholder="0.00" value={saleAmount} onChange={e => setSaleAmount(e.target.value)} />
              </div>
              <div className="flex gap-3 pt-6">
                <button onClick={() => setIsAddingSale(false)} className="flex-1 py-4 border-2 rounded-2xl font-black text-xs uppercase text-[#43483E] active:bg-gray-100">Cancelar</button>
                <button onClick={handleAddSale} className="flex-1 py-4 bg-[#3E6837] text-white rounded-2xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#FDFDF5]/95 backdrop-blur-2xl h-20 pb-4 flex justify-around items-center z-40 border-t border-[#E0E4D6] px-4 shadow-lg">
        {[ {id: 'home', icon: Home, label: 'Início'}, {id: 'animal', icon: Scan, label: 'Animal'}, {id: 'cultivo', icon: Sprout, label: 'Cultivo'}, {id: 'stocks', icon: ClipboardList, label: 'Stocks'}, {id: 'finance', icon: Coins, label: 'Contas'} ].map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); const container = document.querySelector('.overflow-y-auto'); if (container) container.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex flex-col items-center gap-1 flex-1 py-1 relative active:scale-90 transition-transform">
            <div className={`h-9 w-14 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === tab.id ? 'bg-[#3E6837] text-white shadow-md' : 'bg-transparent text-[#74796D]'}`}><tab.icon size={26} /></div>
            <span className={`text-[9px] font-black uppercase tracking-tighter transition-colors duration-300 ${activeTab === tab.id ? 'text-[#042100]' : 'text-[#74796D]'}`}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}