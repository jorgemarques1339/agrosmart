import React, { useState, useEffect } from 'react';
import { 
  Scan, Sprout, Activity, Tractor, Bell, WifiOff, Cloud, Database, Home,
  Map as MapIcon, List, ClipboardList, Plus, Coins
} from 'lucide-react';

// Importar os componentes locais
import WeatherWidget from './components/WeatherWidget';
import PestDetection from './components/PestDetection';
import FieldCard from './components/FieldCard';
import AnimalCard from './components/AnimalCard';
import DashboardHome from './components/DashboardHome';
import FieldMap from './components/FieldMap'; 
import StockManager from './components/StockManager'; 
import FinanceManager from './components/FinanceManager';

// --- DADOS INICIAIS (CORRIGIDO PARA ARRAY 'INITIAL_ANIMALS') ---

const INITIAL_ANIMALS = [
  {
    id: 'PT-12345', name: 'Mimosa', type: 'Vaca Leiteira', age: '4 Anos', weight: '650kg',
    status: 'Saudável', lastVetVisit: '10/01/2026', notes: 'Produção leite acima da média.',
    feed: 'Ração A + Silagem', needs: ['Suplemento Cálcio', 'Verificar Cascos'],
    productionHistory: [
      { day: '01/02', value: 28 }, { day: '02/02', value: 30 }, { day: '03/02', value: 29 },
      { day: '04/02', value: 32 }, { day: '05/02', value: 31 }, { day: '06/02', value: 33 },
    ]
  },
  {
    id: 'PT-67890', name: 'Bebé', type: 'Bezerro', age: '3 Meses', weight: '120kg',
    status: 'Atenção', lastVetVisit: '02/02/2026', notes: 'Ligeira febre.',
    feed: 'Leite Materno + Ração', needs: ['Monitorizar Febre', 'Vacina B dia 15'],
    productionHistory: [] 
  },
  {
    id: 'PT-11223', name: 'Trovão', type: 'Cavalo Lusitano', age: '6 Anos', weight: '580kg',
    status: 'Saudável', lastVetVisit: '15/12/2025', notes: 'Prep. feira.',
    feed: 'Feno + Aveia', needs: ['Treino Diário', 'Escovagem'],
    productionHistory: []
  }
];

const CROP_CALENDAR = {
  '🌽': { plant: '15 Abril', harvest: '15 Setembro', label: 'Milho' },
  '🍇': { plant: 'Jan-Mar (Poda)', harvest: 'Set-Out (Vindima)', label: 'Vinha' },
  '🍅': { plant: '15 Março', harvest: '15 Julho', label: 'Tomate' },
  '🥔': { plant: 'Fevereiro', harvest: 'Junho', label: 'Batata' },
  '🥕': { plant: 'Março', harvest: 'Junho', label: 'Cenoura' },
  '🌻': { plant: 'Abril', harvest: 'Agosto', label: 'Girassol' },
  '🌾': { plant: 'Outubro', harvest: 'Junho', label: 'Trigo' },
  '🍓': { plant: 'Novembro', harvest: 'Maio', label: 'Morango' },
};

const INITIAL_FIELDS = [
  { id: 1, name: 'Campo Milho Norte', humidity: 45, temp: 24, irrigation: false, health: 'Excelente', img: '🌽', cropCycle: CROP_CALENDAR['🌽'] },
  { id: 2, name: 'Vinha do Vale', humidity: 30, temp: 22, irrigation: true, health: 'Bom', img: '🍇', cropCycle: CROP_CALENDAR['🍇'] },
  { id: 3, name: 'Estufa Tomates', humidity: 60, temp: 28, irrigation: false, health: 'Atenção (Praga)', img: '🍅', cropCycle: CROP_CALENDAR['🍅'] },
];

const INITIAL_STOCKS = [
  { id: 's1', name: 'Ração A', category: 'feed', quantity: 500, unit: 'kg', minLevel: 100, price: 1.50 },
  { id: 's2', name: 'Vacina B', category: 'meds', quantity: 10, unit: 'doses', minLevel: 5, price: 25.00 },
  { id: 's3', name: 'Adubo NPK', category: 'fertilizer', quantity: 200, unit: 'kg', minLevel: 50, price: 0.80 },
  { id: 's4', name: 'Gasóleo', category: 'fuel', quantity: 45, unit: 'L', minLevel: 20, price: 1.65 },
];

const INITIAL_TASKS = [
  { id: 1, title: 'Vacinar Gado (Mimosa)', date: 'Hoje', done: false, stockId: 's2', usage: 1 },
  { id: 2, title: 'Comprar Adubo', date: 'Amanhã', done: false },
  { id: 3, title: 'Verificar sensores', date: 'Hoje', done: true }
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
  
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('🌽');
  
  const [isAddingSale, setIsAddingSale] = useState(false);
  const [saleDesc, setSaleDesc] = useState('');
  const [saleAmount, setSaleAmount] = useState('');

  // Estados: Adicionar Animal
  const [isAddingAnimal, setIsAddingAnimal] = useState(false);
  const [newAnimalName, setNewAnimalName] = useState('');
  const [newAnimalTag, setNewAnimalTag] = useState('');
  const [newAnimalType, setNewAnimalType] = useState('Vaca');

  // --- ESTADOS COM PERSISTÊNCIA ---

  // Aqui estava o erro: chamava INITIAL_ANIMALS mas só existia MOCK_ANIMALS
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

  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // --- EFEITOS (Persistência) ---
  useEffect(() => { localStorage.setItem('agrosmart_animals', JSON.stringify(animals)); }, [animals]);
  useEffect(() => { localStorage.setItem('agrosmart_fields', JSON.stringify(fields)); }, [fields]);
  useEffect(() => { localStorage.setItem('agrosmart_tasks', JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem('agrosmart_stocks', JSON.stringify(stocks)); }, [stocks]);
  useEffect(() => { localStorage.setItem('agrosmart_finance', JSON.stringify(transactions)); }, [transactions]);

  // Monitorizar rede
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); if (pendingSync > 0) { showNotification(`Sincronizar ${pendingSync} itens...`); setTimeout(() => { setPendingSync(0); }, 2000); } };
    const handleOffline = () => { setIsOnline(false); showNotification('Modo Offline Ativo 💾'); };
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
      if (newWeather.precip >= 20) {
        showNotification("Rega cancelada: Chuva prevista!");
        setFields(curr => curr.map(f => ({ ...f, irrigation: false })));
      }
    }, 4000);

    return () => { clearInterval(sensorInterval); clearTimeout(weatherTimeout); };
  }, []);

  // --- FUNÇÕES ---

  const handleScanNFC = () => {
    setIsScanning(true); setScannedAnimalId(null);
    setTimeout(() => {
      // Como animals agora é um array, isto funciona perfeitamente
      const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
      if (randomAnimal) {
        setScannedAnimalId(randomAnimal.id);
        showNotification(`NFC Lido: ${randomAnimal.name}`);
      }
      setIsScanning(false); 
    }, 2000);
  };

  const handleAddAnimal = () => {
    if (!newAnimalName.trim() || !newAnimalTag.trim()) {
      showNotification('Preencha o nome e o ID do animal.');
      return;
    }
    const newAnimal = {
      id: newAnimalTag,
      name: newAnimalName,
      type: newAnimalType,
      age: 'N/A',
      weight: 'N/A',
      status: 'Saudável',
      lastVetVisit: 'N/A',
      notes: 'Registado manualmente',
      feed: 'Padrão',
      needs: [],
      productionHistory: []
    };
    
    setAnimals([...animals, newAnimal]);
    setNewAnimalName('');
    setNewAnimalTag('');
    setIsAddingAnimal(false);
    showNotification('Animal adicionado com sucesso!');
  };

  const addAnimalProduction = (animalId, value) => {
    const todayStr = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
    
    setAnimals(prevAnimals => prevAnimals.map(animal => {
      if (animal.id === animalId) {
        const newHistory = [...(animal.productionHistory || []), { day: todayStr, value: value }];
        return { ...animal, productionHistory: newHistory.slice(-10) };
      }
      return animal;
    }));
    
    showNotification(`Registo guardado: ${value}`);
  };

  const toggleIrrigation = (fieldId) => {
    if (weather.precip >= 20 && !window.confirm("Chuva prevista. Ligar rega mesmo assim?")) return;
    setFields(fields.map(f => {
      if (f.id === fieldId) {
        const newState = !f.irrigation;
        showNotification(isOnline ? (newState ? 'Rega iniciada' : 'Rega parada') : 'Ação guardada offline');
        if (!isOnline) setPendingSync(p => p + 1);
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
             id: Date.now(), description: `${reason}: ${s.name} (${Math.abs(amount)}${s.unit})`,
             amount: cost, type: 'expense', date: new Date().toLocaleDateString('pt-PT')
           };
           setTransactions(prevHist => [newRecord, ...prevHist]);
        }
        if (newQty <= s.minLevel && s.quantity > s.minLevel) showNotification(`⚠️ Alerta: ${s.name} em baixo nível!`);
        return { ...s, quantity: newQty };
      }
      return s;
    }));
  };

  const updateStockPrice = (id, newPrice) => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) { showNotification('Preço inválido.'); return; }
    setStocks(prev => prev.map(s => s.id === id ? { ...s, price: price } : s));
    showNotification('Preço unitário atualizado!');
  };

  const handleAddSale = () => {
    if (!saleDesc.trim() || !saleAmount) { showNotification('Preencha a descrição e valor.'); return; }
    const amount = parseFloat(saleAmount);
    if (isNaN(amount) || amount <= 0) { showNotification('Valor inválido.'); return; }
    const newTransaction = { id: Date.now(), description: saleDesc, amount: amount, type: 'income', date: new Date().toLocaleDateString('pt-PT') };
    setTransactions(prev => [newTransaction, ...prev]);
    setSaleDesc(''); setSaleAmount(''); setIsAddingSale(false);
    showNotification(`Venda registada: +${amount.toFixed(2)}€`);
  };

  const toggleTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && !task.done && task.stockId) {
      updateStock(task.stockId, -task.usage, `Tarefa: ${task.title}`);
      const stockItem = stocks.find(s => s.id === task.stockId);
      const cost = stockItem ? (stockItem.price * task.usage) : 0;
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: true, cost: cost } : t));
      showNotification(`Concluído! Custo registado: ${cost.toFixed(2)}€`);
      return;
    }
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: !t.done } : t));
  };

  const deleteTask = (taskId) => { setTasks(prev => prev.filter(t => t.id !== taskId)); showNotification('Tarefa removida.'); };
  const addTask = (title) => { const newTask = { id: Date.now(), title, date: 'Hoje', done: false }; setTasks(prev => [...prev, newTask]); showNotification('Tarefa adicionada à AgroAgenda!'); };

  const handleAddField = () => {
    if (!newFieldName.trim()) { showNotification('Por favor, dê um nome ao campo.'); return; }
    const cycleInfo = CROP_CALENDAR[newFieldType] || { plant: 'Primavera', harvest: 'Outono', label: 'Cultura Geral' };
    const newField = { id: Date.now(), name: newFieldName, humidity: 50, temp: 20, irrigation: false, health: 'Bom', img: newFieldType, cropCycle: cycleInfo };
    setFields([...fields, newField]); setNewFieldName(''); setIsAddingField(false);
    showNotification(`Campo criado! 🌱 Sementeira ideal: ${cycleInfo.plant}`);
  };

  const deleteField = (id) => {
    if (window.confirm('Tem a certeza que deseja eliminar este campo?')) {
      setFields(prev => prev.filter(f => f.id !== id));
      showNotification('Campo eliminado.');
    }
  };

  const handleImageUpload = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { setSelectedImage(reader.result); analyzePlantImage(); }; reader.readAsDataURL(file); } };
  const analyzePlantImage = () => { setIsAnalyzing(true); setAnalysisResult(null); setTimeout(() => { setIsAnalyzing(false); const isSick = Math.random() > 0.5; setAnalysisResult(isSick ? { status: 'Doente', disease: 'Míldio (Fungo)', confidence: '94%', treatment: 'Fungicida à base de cobre.' } : { status: 'Saudável', disease: 'Nenhuma anomalia', confidence: '98%', treatment: 'Manter monitorização.' }); }, 2500); };
  const showNotification = (msg) => { setNotification(msg); setTimeout(() => setNotification(null), 5000); };

  // --- RENDER ---
  
  const scannedAnimalData = scannedAnimalId ? animals.find(a => a.id === scannedAnimalId) : null;

  return (
    <div className="flex flex-col h-screen bg-[#FDFDF5] font-sans text-[#1A1C18] overflow-hidden">
      {/* Top Bar */}
      <div className="px-4 py-3 bg-[#FDFDF5] flex justify-between items-center z-10 sticky top-0 border-b border-[#E0E4D6]">
        <div className="flex items-center gap-3"><div className="w-10 h-10 bg-[#CBE6A2] rounded-full flex items-center justify-center text-[#2D4F00]"><Tractor size={20} /></div><div><span className="text-xl font-normal tracking-wide text-[#1A1C18] block leading-none">AgroSmart</span><span className="text-[10px] text-[#43483E] font-medium flex items-center gap-1 mt-1"><div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`}></div>{isOnline ? ' Online' : ' Offline'}</span></div></div>
        <div className="flex gap-2">
          {!isOnline && <div className="w-10 h-10 flex items-center justify-center rounded-full bg-orange-100 text-orange-600 animate-pulse"><WifiOff size={20} /></div>}
          {isOnline && pendingSync > 0 && <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 animate-spin"><Cloud size={20} /></div>}
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#E0E4D6] relative text-[#43483E]"><Bell size={24} /><span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#BA1A1A] border-2 border-[#FDFDF5] rounded-full"></span></button>
        </div>
      </div>

      {!isOnline && <div className="bg-orange-100 px-4 py-2 text-orange-800 text-xs font-medium flex items-center justify-center gap-2 animate-fade-in"><Database size={14} />Modo Offline Ativo. Alterações guardadas localmente.</div>}

      <div className="flex-1 overflow-y-auto pb-28 px-4">
        {notification && <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-[#2D3228] text-[#F1F1F1] px-6 py-3 rounded-lg shadow-lg text-sm z-50 flex items-center gap-3 animate-fade-in min-w-[300px] justify-between"><span>{notification}</span><button onClick={() => setNotification(null)} className="text-[#CBE6A2] font-bold text-sm">OK</button></div>}

        {activeTab === 'home' && <DashboardHome weather={weather} animals={animals} fields={fields} onNavigate={setActiveTab} tasks={tasks} onToggleTask={toggleTask} onAddTask={addTask} onDeleteTask={deleteTask} />}

        {activeTab === 'animal' && (
          <div className="mt-4 space-y-6 max-w-md mx-auto">
            {!scannedAnimalData && <div className="text-center py-10 space-y-4 animate-fade-in"><h2 className="text-3xl font-normal text-[#1A1C18]">Leitura NFC</h2><p className="text-[#43483E] text-md px-6">Aproxime o seu dispositivo da tag auricular do animal para identificar.</p></div>}
            
            <div className="flex flex-col items-center gap-4">
               <button onClick={handleScanNFC} disabled={isScanning} className={`relative w-40 h-40 rounded-[2rem] flex flex-col items-center justify-center transition-all duration-500 shadow-sm ${isScanning ? 'bg-[#E1E4D5] scale-95' : 'bg-[#CBE6A2] hover:bg-[#BBD692] hover:shadow-md active:scale-95 text-[#2D4F00]'}`}>{isScanning ? <><Activity className="w-12 h-12 text-[#3E6837] animate-pulse mb-2" /><span className="text-[#3E6837] font-medium text-sm tracking-wide">A LER...</span></> : <><Scan className="w-12 h-12 mb-3" /><span className="font-medium tracking-wide">LER TAG</span></>}</button>
               <button onClick={() => setIsAddingAnimal(true)} className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-[#3E6837] font-medium shadow-sm border border-[#CBE6A2] hover:bg-[#E1E4D5] transition-colors"><Plus size={16} /> Adicionar Tag</button>
            </div>
            
            {isAddingAnimal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in"><div className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-2xl"><h3 className="text-lg font-bold text-[#1A1C18] mb-4">Novo Animal</h3>
              <div className="space-y-4">
                  <div><label className="text-xs text-[#43483E] font-medium ml-1">Nome</label><input type="text" className="w-full bg-[#FDFDF5] border border-[#E0E4D6] rounded-xl px-4 py-3 text-sm" value={newAnimalName} onChange={(e) => setNewAnimalName(e.target.value)} placeholder="Ex: Mimosa" /></div>
                  <div><label className="text-xs text-[#43483E] font-medium ml-1">ID da Tag (NFC)</label><input type="text" className="w-full bg-[#FDFDF5] border border-[#E0E4D6] rounded-xl px-4 py-3 text-sm" value={newAnimalTag} onChange={(e) => setNewAnimalTag(e.target.value)} placeholder="Ex: PT-12345" /></div>
                  <div><label className="text-xs text-[#43483E] font-medium ml-1">Tipo</label><div className="flex gap-2 mt-2">{['Vaca Leiteira', 'Bezerro', 'Cavalo', 'Porco'].map(type => (<button key={type} onClick={() => setNewAnimalType(type)} className={`px-3 py-2 rounded-lg text-xs font-medium border ${newAnimalType === type ? 'bg-[#3E6837] text-white border-[#3E6837]' : 'bg-[#FDFDF5] text-[#43483E] border-[#E0E4D6]'}`}>{type}</button>))}</div></div>
                  <div className="flex gap-3 pt-2"><button onClick={() => setIsAddingAnimal(false)} className="flex-1 py-3 rounded-xl border border-[#E0E4D6] text-[#43483E] font-medium">Cancelar</button><button onClick={handleAddAnimal} className="flex-1 py-3 rounded-xl bg-[#3E6837] text-white font-medium">Salvar</button></div>
              </div></div></div>
            )}

            {scannedAnimalData && <AnimalCard data={scannedAnimalData} onAddProduction={addAnimalProduction} />}
          </div>
        )}

        {activeTab === 'cultivo' && (
          <div className="mt-4 space-y-4 max-w-md mx-auto">
            <PestDetection selectedImage={selectedImage} isAnalyzing={isAnalyzing} result={analysisResult} onUpload={handleImageUpload} onClose={() => { setSelectedImage(null); setAnalysisResult(null); }} />
            <div className="flex items-center justify-between mt-6 px-2"><p className="text-[#1A1C18] font-medium text-lg">Meus Campos</p><div className="flex gap-2"><button onClick={() => setIsAddingField(true)} className="bg-[#3E6837] text-white p-2 rounded-xl hover:bg-[#2D4F00] shadow-sm"><Plus size={20} /></button><div className="flex bg-[#E1E4D5] p-1 rounded-xl"><button onClick={() => setCultivoView('list')} className={`p-2 rounded-lg ${cultivoView === 'list' ? 'bg-white shadow-sm text-[#3E6837]' : 'text-[#74796D]'}`}><List size={20} /></button><button onClick={() => setCultivoView('map')} className={`p-2 rounded-lg ${cultivoView === 'map' ? 'bg-white shadow-sm text-[#3E6837]' : 'text-[#74796D]'}`}><MapIcon size={20} /></button></div></div></div>
            {isAddingField && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in"><div className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-2xl"><h3 className="text-lg font-bold text-[#1A1C18] mb-4">Novo Campo</h3>
              <div className="space-y-4"><div><label className="text-xs text-[#43483E] font-medium ml-1">Nome</label><input type="text" className="w-full bg-[#FDFDF5] border border-[#E0E4D6] rounded-xl px-4 py-3 text-sm" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} /></div>
              <div><label className="text-xs text-[#43483E] font-medium ml-1">Cultura</label><div className="flex gap-2 mt-2 overflow-x-auto pb-2 no-scrollbar">{Object.keys(CROP_CALENDAR).map(emoji => (<button key={emoji} onClick={() => setNewFieldType(emoji)} className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-xl border-2 ${newFieldType === emoji ? 'border-[#3E6837] bg-[#E1E4D5]' : 'border-transparent bg-[#FDFDF5]'}`}>{emoji}</button>))}</div><div className="mt-2 text-xs text-[#43483E] bg-[#FDFDF5] p-2 rounded-lg border border-[#E0E4D6]"><span className="font-bold">Ciclo Sugerido:</span> Plantar em {CROP_CALENDAR[newFieldType]?.plant || 'Primavera'}, Colher em {CROP_CALENDAR[newFieldType]?.harvest || 'Outono'}.</div></div>
              <div className="flex gap-3 pt-2"><button onClick={() => setIsAddingField(false)} className="flex-1 py-3 rounded-xl border border-[#E0E4D6]">Cancelar</button><button onClick={handleAddField} className="flex-1 py-3 rounded-xl bg-[#3E6837] text-white">Criar</button></div></div></div></div>
            )}
            <div className="space-y-3 pb-4">{cultivoView === 'list' ? fields.map((field) => (<FieldCard key={field.id} field={field} onToggleIrrigation={toggleIrrigation} isExpanded={expandedFieldId === field.id} onToggleHistory={() => setExpandedFieldId(expandedFieldId === field.id ? null : field.id)} isOnline={isOnline} onDelete={deleteField} />)) : <FieldMap fields={fields} />}</div>
          </div>
        )}

        {activeTab === 'stocks' && <div className="mt-4 space-y-4 max-w-md mx-auto"><StockManager stocks={stocks} onUpdateStock={updateStock} onUpdatePrice={updateStockPrice} /></div>}

        {activeTab === 'finance' && (
          <div className="mt-4 space-y-4 max-w-md mx-auto">
            <div className="flex justify-between items-center px-2"><h2 className="text-[#1A1C18] font-medium text-lg">Finanças</h2><button onClick={() => setIsAddingSale(true)} className="bg-[#3E6837] text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm hover:bg-[#2D4F00]"><Plus size={16} /> Registar Venda</button></div>
            <FinanceManager stocks={stocks} transactions={transactions} />
            {isAddingSale && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in"><div className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-2xl"><h3 className="text-lg font-bold text-[#1A1C18] mb-4">Registar Receita</h3>
              <div className="space-y-4"><div><label className="text-xs text-[#43483E] font-medium ml-1">Descrição</label><input type="text" className="w-full bg-[#FDFDF5] border border-[#E0E4D6] rounded-xl px-4 py-3 text-sm" placeholder="Ex: Venda de Leite" value={saleDesc} onChange={(e) => setSaleDesc(e.target.value)} /></div><div><label className="text-xs text-[#43483E] font-medium ml-1">Valor (€)</label><input type="number" className="w-full bg-[#FDFDF5] border border-[#E0E4D6] rounded-xl px-4 py-3 text-sm" placeholder="0.00" value={saleAmount} onChange={(e) => setSaleAmount(e.target.value)} /></div><div className="flex gap-3 pt-2"><button onClick={() => setIsAddingSale(false)} className="flex-1 py-3 rounded-xl border border-[#E0E4D6]">Cancelar</button><button onClick={handleAddSale} className="flex-1 py-3 rounded-xl bg-[#3E6837] text-white font-bold">Registar</button></div></div></div></div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-[#F0F5E9] h-20 pb-4 flex justify-around items-center gap-1 fixed bottom-0 w-full z-20 shadow-[0_-5px_10px_rgba(0,0,0,0.05)] px-2">
        <button onClick={() => setActiveTab('home')} className="flex flex-col items-center gap-1 w-14 group"><div className={`h-8 w-12 rounded-full flex items-center justify-center transition-all duration-300 ${activeTab === 'home' ? 'bg-[#CBE6A2]' : 'bg-transparent'}`}><Home size={22} className={`${activeTab === 'home' ? 'text-[#042100]' : 'text-[#43483E]'}`} /></div><span className={`text-[9px] font-medium tracking-wide ${activeTab === 'home' ? 'text-[#042100]' : 'text-[#43483E]'}`}>Início</span></button>
        <button onClick={() => setActiveTab('animal')} className="flex flex-col items-center gap-1 w-14 group"><div className={`h-8 w-12 rounded-full flex items-center justify-center transition-all duration-300 ${activeTab === 'animal' ? 'bg-[#CBE6A2]' : 'bg-transparent'}`}><Scan size={22} className={`${activeTab === 'animal' ? 'text-[#042100]' : 'text-[#43483E]'}`} /></div><span className={`text-[9px] font-medium tracking-wide ${activeTab === 'animal' ? 'text-[#042100]' : 'text-[#43483E]'}`}>Animal</span></button>
        <button onClick={() => setActiveTab('cultivo')} className="flex flex-col items-center gap-1 w-14 group"><div className={`h-8 w-12 rounded-full flex items-center justify-center transition-all duration-300 ${activeTab === 'cultivo' ? 'bg-[#CBE6A2]' : 'bg-transparent'}`}><Sprout size={22} className={`${activeTab === 'cultivo' ? 'text-[#042100]' : 'text-[#43483E]'}`} /></div><span className={`text-[9px] font-medium tracking-wide ${activeTab === 'cultivo' ? 'text-[#042100]' : 'text-[#43483E]'}`}>Cultivo</span></button>
        <button onClick={() => setActiveTab('stocks')} className="flex flex-col items-center gap-1 w-14 group"><div className={`h-8 w-12 rounded-full flex items-center justify-center transition-all duration-300 ${activeTab === 'stocks' ? 'bg-[#CBE6A2]' : 'bg-transparent'}`}><ClipboardList size={22} className={`${activeTab === 'stocks' ? 'text-[#042100]' : 'text-[#43483E]'}`} /></div><span className={`text-[9px] font-medium tracking-wide ${activeTab === 'stocks' ? 'text-[#042100]' : 'text-[#43483E]'}`}>Armazém</span></button>
        <button onClick={() => setActiveTab('finance')} className="flex flex-col items-center gap-1 w-14 group"><div className={`h-8 w-12 rounded-full flex items-center justify-center transition-all duration-300 ${activeTab === 'finance' ? 'bg-[#CBE6A2]' : 'bg-transparent'}`}><Coins size={22} className={`${activeTab === 'finance' ? 'text-[#042100]' : 'text-[#43483E]'}`} /></div><span className={`text-[9px] font-medium tracking-wide ${activeTab === 'finance' ? 'text-[#042100]' : 'text-[#43483E]'}`}>Finanças</span></button>
      </div>
    </div>
  );
}