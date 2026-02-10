import React, { useState, useEffect } from 'react';
import { 
  Scan, Sprout, Activity, Tractor, Bell, WifiOff, Cloud, Database, Home,
  Map as MapIcon, List, ClipboardList, Plus, Coins, Camera, Loader2
} from 'lucide-react';

// --- IMPORTAR COMPONENTES LOCAIS (VS Code) ---
import WeatherWidget from './components/WeatherWidget';
import PestDetection from './components/PestDetection';
import FieldCard from './components/FieldCard';
import AnimalCard from './components/AnimalCard';
import DashboardHome from './components/DashboardHome';
import FieldMap from './components/FieldMap'; 
import StockManager from './components/StockManager'; 
import FinanceManager from './components/FinanceManager';

// --- IMPORTAR DADOS ---
import { 
  INITIAL_ANIMALS, 
  INITIAL_FIELDS, 
  INITIAL_STOCKS, 
  INITIAL_TASKS, 
  CROP_CALENDAR, 
  INITIAL_BATCHES
} from './data/mockData';

const INITIAL_FIELD_LOGS = [
  { id: 101, fieldId: 2, date: '15/01/2026', description: 'Poda de Inverno realizada', type: 'intervention' },
  { id: 102, fieldId: 1, date: '01/02/2026', description: 'Adubação de fundo (NPK)', type: 'treatment' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedAnimalId, setScannedAnimalId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [expandedFieldId, setExpandedFieldId] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);
  
  const [cultivoView, setCultivoView] = useState('list');
  const [weather, setWeather] = useState({ temp: 23, condition: 'Limpo', precip: 0, loading: true });
  
  // --- Estados de Modais ---
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

  // --- Estados com Persistência ---
  const [animals, setAnimals] = useState(() => {
    try { return JSON.parse(localStorage.getItem('agrosmart_animals')) || INITIAL_ANIMALS; } catch { return INITIAL_ANIMALS; }
  });
  const [fields, setFields] = useState(() => {
    try { return JSON.parse(localStorage.getItem('agrosmart_fields')) || INITIAL_FIELDS; } catch { return INITIAL_FIELDS; }
  });
  const [fieldLogs, setFieldLogs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('agrosmart_field_logs')) || INITIAL_FIELD_LOGS; } catch { return []; }
  });
  const [tasks, setTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('agrosmart_tasks')) || INITIAL_TASKS; } catch { return INITIAL_TASKS; }
  });
  const [stocks, setStocks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('agrosmart_stocks')) || INITIAL_STOCKS; } catch { return INITIAL_STOCKS; }
  });
  const [transactions, setTransactions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('agrosmart_finance')) || []; } catch { return []; }
  });
  const [batches, setBatches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('agrosmart_batches')) || INITIAL_BATCHES; } catch { return []; }
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Efeitos de Persistência
  useEffect(() => {
    localStorage.setItem('agrosmart_animals', JSON.stringify(animals));
    localStorage.setItem('agrosmart_fields', JSON.stringify(fields));
    localStorage.setItem('agrosmart_field_logs', JSON.stringify(fieldLogs));
    localStorage.setItem('agrosmart_tasks', JSON.stringify(tasks));
    localStorage.setItem('agrosmart_stocks', JSON.stringify(stocks));
    localStorage.setItem('agrosmart_finance', JSON.stringify(transactions));
    localStorage.setItem('agrosmart_batches', JSON.stringify(batches));
  }, [animals, fields, fieldLogs, tasks, stocks, transactions, batches]);

  // Monitorizar rede
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); if (pendingSync > 0) { showNotification(`Sincronizado!`); setTimeout(() => { setPendingSync(0); }, 2000); } };
    const handleOffline = () => { setIsOnline(false); showNotification('Modo Offline Ativo'); };
    window.addEventListener('online', handleOnline); window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, [pendingSync]);

  // Simulação Sensores
  useEffect(() => {
    const sensorInterval = setInterval(() => {
      setFields(curr => curr.map(f => ({
        ...f,
        humidity: f.irrigation ? Math.min(100, f.humidity + 1) : Math.max(0, f.humidity + (Math.random() * 2 - 1.5)),
        temp: f.temp + (Math.random() * 0.4 - 0.2)
      })));
    }, 3000);

    const weatherTimeout = setTimeout(() => {
      const newWeather = { temp: 18, condition: 'Chuva', precip: 25, loading: false };
      setWeather(newWeather);
    }, 4000);

    return () => { clearInterval(sensorInterval); clearTimeout(weatherTimeout); };
  }, []);

  const showNotification = (msg) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };

  // --- LÓGICA DE NEGÓCIO ---

  const addFieldLog = (fieldId, description, location = null) => {
    const newLog = {
      id: Date.now(),
      fieldId,
      date: new Date().toLocaleDateString('pt-PT'),
      description,
      type: 'intervencao',
      location 
    };
    setFieldLogs(prev => [newLog, ...prev]);
    showNotification(location ? 'Registo com GPS gravado! 📍' : 'Registo gravado.');
  };

  const handleAddBatch = (newBatch) => {
    setBatches(prev => [newBatch, ...prev]);
    showNotification('Lote de produção criado!');
  };

  const handleScanNFC = () => {
    setIsScanning(true); setScannedAnimalId(null);
    setTimeout(() => {
      if (animals && animals.length > 0) {
        const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
        setScannedAnimalId(randomAnimal.id);
        showNotification(`NFC Lido: ${randomAnimal.name}`);
      }
      setIsScanning(false); 
    }, 2000);
  };

  const handleScanForAdd = () => {
    setIsScanning(true);
    setTimeout(() => {
      const randomId = `PT-${Math.floor(10000 + Math.random() * 90000)}`;
      setNewAnimalTag(randomId);
      setIsScanning(false);
      setIsAddingAnimal(true);
      showNotification("Nova Tag NFC detetada!");
    }, 2000);
  };

  const addAnimalProduction = (animalId, value) => {
    const todayStr = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
    setAnimals(prev => prev.map(a => a.id === animalId ? { ...a, productionHistory: [...(a.productionHistory || []), { day: todayStr, value }] } : a));
    showNotification(`Registo guardado: ${value}`);
  };

  const toggleIrrigation = (fieldId) => {
    setFields(fields.map(f => {
      if (f.id === fieldId) {
        const newState = !f.irrigation;
        if (newState) addFieldLog(fieldId, "Rega Iniciada");
        return { ...f, irrigation: newState };
      }
      return f;
    }));
  };

  const updateStock = (id, amount, reason = "Ajuste Manual") => {
    setStocks(prev => prev.map(s => {
      if (s.id === id) {
        const newQty = Math.max(0, s.quantity + amount);
        if (amount < 0) {
           const cost = Math.abs(amount) * (s.price || 0);
           const newRecord = {
             id: Date.now(),
             description: `${reason}: ${s.name} (${Math.abs(amount)}${s.unit})`,
             amount: cost,
             type: 'expense',
             date: new Date().toLocaleDateString('pt-PT')
           };
           setTransactions(prevHist => [newRecord, ...prevHist]);
        }
        if (newQty <= s.minLevel && s.quantity > s.minLevel) {
           showNotification(`⚠️ Alerta: ${s.name} em baixo nível!`);
        }
        return { ...s, quantity: newQty };
      }
      return s;
    }));
  };

  const updateStockPrice = (id, newPrice) => {
    const price = parseFloat(newPrice);
    if (!isNaN(price)) {
      setStocks(prev => prev.map(s => s.id === id ? { ...s, price } : s));
      showNotification('Preço atualizado.');
    }
  };

  const handleAddSale = () => {
    const amount = parseFloat(saleAmount);
    if (!isNaN(amount) && saleDesc.trim()) {
      setTransactions(prev => [...prev, { 
        id: Date.now(), 
        description: saleDesc, 
        amount, 
        type: 'income', 
        date: new Date().toLocaleDateString('pt-PT') 
      }]);
      setIsAddingSale(false);
      setSaleDesc('');
      setSaleAmount('');
      showNotification('Receita registada.');
    }
  };

  const handleAddStock = () => {
    if (!newStockData.name || !newStockData.quantity || !newStockData.price) {
      showNotification('Preencha os campos obrigatórios.');
      return;
    }
    const newStock = {
      id: `s${Date.now()}`,
      name: newStockData.name, category: newStockData.category,
      quantity: parseFloat(newStockData.quantity), unit: newStockData.unit || 'un',
      minLevel: parseFloat(newStockData.minLevel) || 0, price: parseFloat(newStockData.price)
    };
    setStocks(prev => [...prev, newStock]);
    setNewStockData({ name: '', category: 'feed', quantity: '', unit: 'kg', minLevel: '', price: '' });
    setIsAddingStock(false);
    showNotification('Produto adicionado ao armazém!');
  };

  const handleAddTask = (title) => {
    setTasks(prev => [...prev, { id: Date.now(), title, date: 'Hoje', done: false }]);
    showNotification('Tarefa adicionada.');
  };

  const toggleTask = (id) => {
    const task = tasks.find(t => t.id === id);
    if (task && !task.done && task.stockId) {
      updateStock(task.stockId, -task.usage, `Tarefa: ${task.title}`);
      const stockItem = stocks.find(s => s.id === task.stockId);
      const cost = stockItem ? (stockItem.price * task.usage) : 0;
      setTasks(prev => prev.map(t => t.id === id ? { ...t, done: true, cost: cost } : t));
      showNotification(`Concluído! Custo: ${cost.toFixed(2)}€`);
      
      if (task.fieldId) addFieldLog(task.fieldId, `Tarefa Concluída: ${task.title}`);
    } else {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
    }
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    showNotification('Tarefa removida.');
  };

  const handleAddField = () => {
    if (!newFieldName.trim()) {
      showNotification('Por favor, dê um nome ao campo.');
      return;
    }
    const area = parseFloat(newFieldArea) || 1.0;
    const cycle = CROP_CALENDAR[newFieldType] || { plant: 'Primavera', harvest: 'Outono', label: 'Cultura Geral' };

    const newField = { 
      id: Date.now(), 
      name: newFieldName, 
      humidity: 50, temp: 20, irrigation: false, health: 'Bom', 
      img: newFieldType, 
      area: area, 
      cropCycle: cycle 
    };

    setFields(prev => [...prev, newField]);
    setNewFieldName('');
    setNewFieldArea('');
    setIsAddingField(false);
    showNotification(`Campo criado! 🌱 Sementeira ideal: ${cycle.plant}`);
  };

  const deleteField = (id) => {
    if (window.confirm('Tem a certeza que deseja eliminar este campo?')) {
      setFields(prev => prev.filter(f => f.id !== id));
      showNotification('Campo eliminado.');
    }
  };

  const handleAddAnimal = () => {
    if (!newAnimalName.trim() || !newAnimalTag.trim()) { showNotification('Preencha os dados.'); return; }
    const newAnimal = { id: newAnimalTag, name: newAnimalName, type: newAnimalType, age: 'N/A', weight: 'N/A', status: 'Saudável', lastVetVisit: 'N/A', notes: 'Manual', feed: 'Padrão', needs: [], productionHistory: [] };
    setAnimals(prev => [...prev, newAnimal]); setNewAnimalName(''); setNewAnimalTag(''); setIsAddingAnimal(false); showNotification('Animal adicionado!');
  };

  // --- LÓGICA DE IA COM GOOGLE GEMINI ---
  // API Key do ambiente (substituir por chave real se necessário no VS Code)
  const apiKey = ""; 

  const analyzePlantImageWithAI = async (base64Image) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // Remover cabeçalho data URL se existir
      const base64Data = base64Image.split(',')[1];

      const prompt = `Analise esta imagem agrícola. Identifique pragas, doenças ou deficiências.
      Responda APENAS com este JSON exato (sem markdown):
      {
        "status": "Saudável" | "Atenção" | "Crítico",
        "disease": "Nome da praga/doença ou 'Nenhuma'",
        "confidence": "Percentagem (ex: '95%')",
        "treatment": "Tratamento curto recomendado (ou 'Manter monitorização')"
      }`;

      // Se não houver chave API configurada, simular para não quebrar a demo
      if (!apiKey) {
         console.warn("API Key não configurada. A usar simulação.");
         setTimeout(() => {
            setIsAnalyzing(false);
            setAnalysisResult({ 
              status: 'Atenção (Simulado)', 
              disease: 'Míldio (Simulação)', 
              treatment: 'Aplicar fungicida à base de cobre. (Configure a API Key para resultados reais)', 
              confidence: '98%' 
            });
         }, 2000);
         return;
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/jpeg", data: base64Data } }
            ]
          }]
        })
      });

      const data = await response.json();
      
      if (data.error) throw new Error(data.error.message);

      const textResponse = data.candidates[0].content.parts[0].text;
      // Limpar formatação markdown ```json ... ``` se existir
      const jsonStr = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(jsonStr);

      setAnalysisResult(result);

    } catch (error) {
      console.error("Erro IA:", error);
      setAnalysisResult({ 
        status: 'Erro', 
        disease: 'Falha na Análise', 
        treatment: 'Verifique a conexão ou a chave de API.', 
        confidence: '0%' 
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
      // Chama a função de IA em vez do timeout simples
      analyzePlantImageWithAI(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const scannedAnimal = scannedAnimalId ? animals.find(a => a.id === scannedAnimalId) : null;

  return (
    <div className="relative flex flex-col h-[100dvh] bg-[#FDFDF5] font-sans text-[#1A1C18] w-full max-w-md mx-auto shadow-2xl border-x border-gray-100 overflow-hidden">
      
      {/* Top Bar */}
      <div className="px-4 py-5 bg-[#FDFDF5] flex justify-between items-center z-30 sticky top-0 border-b border-[#E0E4D6] backdrop-blur-lg bg-opacity-95 flex-none">
        <div className="flex items-center gap-3 active:scale-95 transition-transform cursor-pointer" onClick={() => setActiveTab('home')}>
          <div className="w-12 h-12 bg-[#CBE6A2] rounded-[1.25rem] flex items-center justify-center text-[#2D4F00] shadow-sm">
            <Tractor size={26} />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight leading-none uppercase italic">AgroSmart</span>
            <span className="text-[10px] text-[#43483E] font-black mt-1 flex items-center gap-1 tracking-widest">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
              {isOnline ? 'SISTEMA ONLINE' : 'MODO OFFLINE'}
            </span>
          </div>
        </div>
        <div className="flex gap-1.5">
          {!isOnline && <div className="w-10 h-10 flex items-center justify-center text-orange-600 bg-orange-50 rounded-xl"><WifiOff size={20} /></div>}
          <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#EFF2E6] text-[#43483E] active:scale-90 transition-all relative">
            <Bell size={24} />
            <span className="absolute top-3 right-3 w-3 h-3 bg-[#BA1A1A] border-[3px] border-[#FDFDF5] rounded-full"></span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-40 space-y-5 scroll-smooth w-full">
        {notification && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-[#1A1C18] text-white px-5 py-4 rounded-[1.5rem] shadow-2xl text-sm z-[60] flex items-center justify-between animate-slide-up border border-white/5 w-11/12 max-w-xs">
            <span className="font-bold tracking-tight">{notification}</span>
            <button onClick={() => setNotification(null)} className="text-[#CBE6A2] font-black px-4 py-2 bg-white/5 rounded-xl text-xs">OK</button>
          </div>
        )}

        {/* --- MODAIS DE CRIAÇÃO --- */}
        
        {isAddingField && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm px-0">
            <div className="bg-white rounded-t-[2.5rem] p-7 w-full max-w-md shadow-2xl animate-slide-up pb-12 border-t border-[#E0E4D6] max-h-[85vh] overflow-y-auto">
              <div className="w-14 h-1.5 bg-gray-200 rounded-full mx-auto mb-8 shadow-inner sticky top-0"></div>
              <h3 className="text-2xl font-black text-[#1A1C18] mb-8 tracking-tighter uppercase italic">Novo Campo</h3>
              <div className="space-y-7 pb-10">
                <div>
                  <label className="text-[11px] font-black text-[#74796D] uppercase ml-1 block mb-3 tracking-[0.15em]">Identificação</label>
                  <input 
                    type="text" 
                    className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-2xl px-5 py-5 text-lg focus:border-[#3E6837] outline-none transition-all shadow-sm font-bold" 
                    placeholder="Ex: Vinha Sul" 
                    value={newFieldName} 
                    onChange={(e) => setNewFieldName(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black text-[#74796D] uppercase ml-1 block mb-3 tracking-[0.15em]">Área (Hectares)</label>
                  <input type="number" className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-2xl px-5 py-5 text-lg focus:border-[#3E6837] outline-none transition-all shadow-sm font-bold" placeholder="Ex: 5.5" value={newFieldArea} onChange={(e) => setNewFieldArea(e.target.value)} />
                  <p className="text-[10px] text-[#74796D] mt-2 ml-2 italic">Necessário para cálculo de previsão IA.</p>
                </div>
                <div>
                  <label className="text-[11px] font-black text-[#74796D] uppercase ml-1 block mb-3 tracking-[0.15em]">Tipo de Cultura</label>
                  <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar pt-2 snap-x">
                    {Object.keys(CROP_CALENDAR).map(emoji => (
                      <button key={emoji} onClick={() => setNewFieldType(emoji)} className={`w-20 h-20 shrink-0 rounded-3xl flex items-center justify-center text-4xl border-4 transition-all shadow-md active:scale-90 snap-center ${newFieldType === emoji ? 'border-[#3E6837] bg-[#CBE6A2] scale-105 shadow-lg' : 'border-transparent bg-[#FDFDF5]'}`}>{emoji}</button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setIsAddingField(false)} className="flex-1 py-5 rounded-2xl border-2 border-[#E0E4D6] text-[#43483E] font-black text-xs uppercase tracking-widest active:bg-gray-100">Cancelar</button>
                  <button onClick={handleAddField} className="flex-1 py-5 rounded-2xl bg-[#3E6837] text-white font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Criar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isAddingSale && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm px-0">
            <div className="bg-white rounded-t-[2.5rem] p-7 w-full max-w-md shadow-2xl animate-slide-up border-t border-[#E0E4D6] max-h-[85vh] overflow-y-auto">
              <div className="w-14 h-1.5 bg-gray-200 rounded-full mx-auto mb-8 shadow-inner sticky top-0"></div>
              <h3 className="text-xl font-black text-[#1A1C18] mb-8 tracking-tighter uppercase italic text-center">Registar Receita</h3>
              <div className="space-y-5 pb-10">
                <input type="text" className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-2xl px-5 py-4 text-base outline-none focus:border-[#3E6837] font-bold" placeholder="Descrição da Venda" value={saleDesc} onChange={e => setSaleDesc(e.target.value)} />
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-[#3E6837]">€</span>
                  <input type="number" className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-2xl pl-10 pr-5 py-4 text-xl outline-none focus:border-[#3E6837] font-black text-[#3E6837]" placeholder="0.00" value={saleAmount} onChange={e => setSaleAmount(e.target.value)} />
                </div>
                <div className="flex gap-3 mt-8">
                  <button onClick={() => setIsAddingSale(false)} className="flex-1 py-5 border-2 rounded-2xl font-black text-[10px] uppercase tracking-widest active:bg-gray-50 text-[#43483E]">Cancelar</button>
                  <button onClick={handleAddSale} className="flex-1 py-5 bg-[#3E6837] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Salvar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isAddingStock && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm px-0">
            <div className="bg-white rounded-t-[2.5rem] p-7 w-full max-w-md shadow-2xl animate-slide-up border-t border-[#E0E4D6] max-h-[85vh] overflow-y-auto">
              <div className="w-14 h-1.5 bg-gray-200 rounded-full mx-auto mb-8 shadow-inner sticky top-0"></div>
              <h3 className="text-xl font-black text-[#1A1C18] mb-6 tracking-tighter uppercase italic text-center">Novo Produto</h3>
              <div className="space-y-4 pb-10">
                <input type="text" className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-2xl px-5 py-4 text-sm font-bold" placeholder="Nome do Produto" value={newStockData.name} onChange={e => setNewStockData({...newStockData, name: e.target.value})} />
                
                <div className="flex gap-2">
                  <select className="flex-1 bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-2xl px-3 py-4 text-sm font-bold" value={newStockData.category} onChange={e => setNewStockData({...newStockData, category: e.target.value})}>
                    <option value="feed">Ração</option>
                    <option value="meds">Medicamento</option>
                    <option value="fertilizer">Adubo</option>
                    <option value="fuel">Combustível</option>
                  </select>
                  <input type="text" className="w-1/3 bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-2xl px-3 py-4 text-sm font-bold" placeholder="Unid." value={newStockData.unit} onChange={e => setNewStockData({...newStockData, unit: e.target.value})} />
                </div>

                <div className="flex gap-2">
                  <input type="number" className="flex-1 bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-2xl px-4 py-4 text-sm font-bold" placeholder="Qtd" value={newStockData.quantity} onChange={e => setNewStockData({...newStockData, quantity: e.target.value})} />
                  <input type="number" className="flex-1 bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-2xl px-4 py-4 text-sm font-bold" placeholder="Min" value={newStockData.minLevel} onChange={e => setNewStockData({...newStockData, minLevel: e.target.value})} />
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-[#3E6837]">€</span>
                  <input type="number" className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-2xl pl-8 pr-4 py-4 text-sm font-bold" placeholder="Preço Unitário" value={newStockData.price} onChange={e => setNewStockData({...newStockData, price: e.target.value})} />
                </div>

                <div className="flex gap-3 mt-4">
                  <button onClick={() => setIsAddingStock(false)} className="flex-1 py-4 border-2 rounded-2xl font-black text-[10px] uppercase tracking-widest active:bg-gray-50 text-[#43483E]">Cancelar</button>
                  <button onClick={handleAddStock} className="flex-1 py-4 bg-[#3E6837] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Adicionar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isAddingAnimal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm px-0">
            <div className="bg-white rounded-t-[2.5rem] p-7 w-full max-w-md shadow-2xl animate-slide-up border-t border-[#E0E4D6] max-h-[85vh] overflow-y-auto">
              <div className="w-14 h-1.5 bg-gray-200 rounded-full mx-auto mb-8 shadow-inner sticky top-0"></div>
              <h3 className="text-xl font-black text-[#1A1C18] mb-8 tracking-tighter uppercase italic text-center">Novo Animal</h3>
              <div className="space-y-5 pb-10">
                <input type="text" className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-2xl px-5 py-4 text-base outline-none focus:border-[#3E6837] font-bold" placeholder="Nome (Ex: Mimosa)" value={newAnimalName} onChange={e => setNewAnimalName(e.target.value)} />
                <input type="text" className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-2xl px-5 py-4 text-base outline-none focus:border-[#3E6837] font-bold" placeholder="ID da Tag (NFC)" value={newAnimalTag} onChange={e => setNewAnimalTag(e.target.value)} />
                <div className="flex gap-2 mt-2">
                  {['Vaca', 'Bezerro', 'Cavalo', 'Porco'].map(type => (
                    <button key={type} onClick={() => setNewAnimalType(type)} className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all ${newAnimalType === type ? 'border-[#3E6837] bg-[#E1E4D5] text-[#3E6837]' : 'border-[#E0E4D6] text-[#74796D]'}`}>{type}</button>
                  ))}
                </div>
                <div className="flex gap-3 mt-8">
                  <button onClick={() => setIsAddingAnimal(false)} className="flex-1 py-5 border-2 rounded-2xl font-black text-[10px] uppercase tracking-widest active:bg-gray-50 text-[#43483E]">Cancelar</button>
                  <button onClick={handleAddAnimal} className="flex-1 py-5 bg-[#3E6837] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Guardar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- CONTEÚDO DAS ABAS --- */}
        {activeTab === 'home' && (
          <DashboardHome 
            weather={weather} animals={animals} fields={fields} stocks={stocks}
            onNavigate={setActiveTab} tasks={tasks} onToggleTask={toggleTask} onAddTask={handleAddTask} onDeleteTask={deleteTask}
          />
        )}

        {activeTab === 'animal' && (
          <div className="space-y-10 max-w-md mx-auto pb-4 pt-4">
            {!scannedAnimalId && (
              <div className="text-center space-y-6 animate-fade-in px-6">
                <div>
                  <h2 className="text-3xl font-black text-[#1A1C18] tracking-tighter uppercase italic">NFC Scanner</h2>
                  <p className="text-[#43483E] text-md leading-relaxed font-medium mt-2">Aproxime o smartphone da tag auricular do animal para ver o histórico.</p>
                </div>
              </div>
            )}
            <div className="flex flex-col items-center justify-center gap-6 py-4">
              <button 
                onClick={handleScanNFC} 
                disabled={isScanning} 
                className={`relative w-48 h-48 rounded-[4rem] flex flex-col items-center justify-center transition-all duration-500 shadow-2xl border-[12px] border-white active:scale-90 ${isScanning ? 'bg-[#E1E4D5]' : 'bg-[#CBE6A2] text-[#2D4F00] hover:shadow-green-900/15'}`}
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-16 h-16 text-[#3E6837] animate-spin mb-4" />
                    <span className="font-black text-[10px] tracking-widest uppercase">A LER...</span>
                  </>
                ) : (
                  <>
                    <Scan className="w-16 h-16 mb-4" />
                    <span className="font-black text-[10px] tracking-widest uppercase">LER ANIMAL</span>
                  </>
                )}
                <div className="absolute inset-0 rounded-[4rem] border-4 border-[#2D4F00]/5 animate-pulse"></div>
              </button>
              
              {!scannedAnimalId && (
                <button onClick={handleScanForAdd} className="flex items-center gap-2 bg-white px-6 py-3 rounded-2xl text-[#3E6837] font-bold shadow-sm border border-[#CBE6A2] hover:bg-[#E1E4D5] transition-all active:scale-95">
                  <Plus size={18} /> Adicionar Tag Manual
                </button>
              )}
            </div>
            {scannedAnimal && <AnimalCard data={scannedAnimal} onAddProduction={addAnimalProduction} />}
            {scannedAnimalId && (
              <button onClick={() => setScannedAnimalId(null)} className="w-full py-5 text-[11px] font-black text-[#74796D] uppercase tracking-[0.3em] hover:text-[#3E6837] transition-colors active:bg-gray-100 rounded-2xl mt-2 mb-8">
                Nova Leitura / Limpar
              </button>
            )}
          </div>
        )}

        {activeTab === 'cultivo' && (
          <div className="space-y-7 max-w-md mx-auto pb-4">
            <PestDetection selectedImage={selectedImage} isAnalyzing={isAnalyzing} result={analysisResult} onClose={() => {setSelectedImage(null); setAnalysisResult(null);}} />

            <div className="flex items-center justify-between mt-6 px-1">
              <h2 className="text-[#1A1C18] font-black text-2xl tracking-tighter uppercase italic">Cultivos</h2>
              <div className="flex gap-2.5">
                <label className="flex items-center gap-2.5 p-4 bg-white rounded-2xl border-1 border-[#E0E4D6] text-[#3E6837] cursor-pointer shadow-sm active:scale-90 active:bg-[#FDFDF5] transition-all px-5">
                  <Camera size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Usar IA</span>
                  <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleImageUpload} />
                </label>
                <button 
                  onClick={() => setIsAddingField(true)} 
                  className="bg-[#3E6837] text-white p-4 rounded-2xl active:scale-85 shadow-lg shadow-green-900/20 transition-all border-1 border-[#2D4F00]"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div className="grid gap-6">
              {cultivoView === 'list' ? fields.map(field => (
                <FieldCard 
                  key={field.id} field={field} 
                  isExpanded={expandedFieldId === field.id}
                  onToggleHistory={() => setExpandedFieldId(expandedFieldId === field.id ? null : field.id)}
                  logs={fieldLogs.filter(l => l.fieldId === field.id)}
                  onAddLog={addFieldLog} onToggleIrrigation={toggleIrrigation}
                  onDelete={(id) => {
                    if(window.confirm(`Remover permanentemente "${field.name}"?`)) {
                      setFields(fields.filter(f => f.id !== id));
                    }
                  }}
                />
              )) : <FieldMap fields={fields} />}
            </div>
          </div>
        )}

        {activeTab === 'stocks' && (
          <div className="mt-4 space-y-4 max-w-md mx-auto">
            <div className="flex justify-between items-center px-2">
               <h2 className="text-[#1A1C18] font-black text-2xl tracking-tighter uppercase italic">Armazém</h2>
               <button 
                 onClick={() => setIsAddingStock(true)}
                 className="bg-[#3E6837] text-white px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
               >
                 <Plus size={18} /> Produto
               </button>
            </div>
            <StockManager stocks={stocks} onUpdateStock={updateStock} onUpdatePrice={updateStockPrice} />
          </div>
        )}
        
        {activeTab === 'finance' && (
          <div className="mt-4 space-y-4 max-w-md mx-auto">
            <div className="flex items-center justify-between mt-6 px-1">
              <h2 className="text-[#1A1C18] font-black text-2xl tracking-tighter uppercase italic">Finanças</h2>
              <button 
                onClick={() => setIsAddingSale(true)} 
                className="bg-[#3E6837] text-white px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <Plus size={18} /> Receita
              </button>
            </div>
            <FinanceManager transactions={transactions} stocks={stocks} onAddSale={() => setIsAddingSale(true)} />
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#FDFDF5]/95 backdrop-blur-2xl h-20 pb-4 flex justify-around items-center z-40 border-t border-[#E0E4D6] px-2 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        {[
          {id: 'home', icon: Home, label: 'Início'},
          {id: 'animal', icon: Scan, label: 'Animal'},
          {id: 'cultivo', icon: Sprout, label: 'Cultivo'},
          {id: 'stocks', icon: ClipboardList, label: 'Stocks'},
          {id: 'finance', icon: Coins, label: 'Contas'}
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => {
              setActiveTab(tab.id);
              const container = document.querySelector('.overflow-y-auto');
              if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
            className="flex flex-col items-center gap-1 flex-1 py-1 relative active:scale-90 transition-transform"
          >
            <div className={`h-9 w-14 rounded-xl flex items-center justify-center transition-all duration-300 ${activeTab === tab.id ? 'bg-[#3E6837] text-white shadow-md' : 'bg-transparent text-[#74796D]'}`}>
              <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-tight ${activeTab === tab.id ? 'text-[#3E6837]' : 'text-[#74796D]'}`}>
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <div className="absolute -bottom-1 w-2 h-2 bg-[#3E6837] rounded-full animate-bounce shadow-md"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}