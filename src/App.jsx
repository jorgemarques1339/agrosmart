import React, { useState, useEffect } from 'react';
import { 
  Scan, Sprout, Activity, Tractor, Bell, WifiOff, Cloud, Database, Home,
  Map as MapIcon, List, ClipboardList, Plus, Coins, Camera, X, Check, 
  Trash2, BarChart3, FileText, MapPin, Droplets, Thermometer, Calendar,
  Loader2, Syringe, Package, Utensils, AlertTriangle, CheckCircle, ArrowRight,
  TrendingUp, TrendingDown, Sun, CloudRain, Wind, ArrowUpRight, ArrowDownRight,
  PieChart, Edit2, AlertCircle, Wallet, ArrowUp, ArrowDown, Milk
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, BarChart, Bar, YAxis, Cell
} from 'recharts';

// --- DADOS INICIAIS ---

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

// --- COMPONENTES AUXILIARES ---

const DashboardHome = ({ weather, animals, fields, onNavigate, tasks, onToggleTask, onAddTask, onDeleteTask, stocks }) => {
  const sickAnimals = Array.isArray(animals) ? animals.filter(a => a.status !== 'Saudável') : [];
  const lowStocks = Array.isArray(stocks) ? stocks.filter(s => s.quantity <= s.minLevel) : [];
  const rainAlert = weather.precip >= 20;
  const today = new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
  const [newTaskInput, setNewTaskInput] = useState('');

  const handleAddTask = () => { if (newTaskInput.trim()) { onAddTask(newTaskInput); setNewTaskInput(''); } };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="bg-white p-5 rounded-[24px] shadow-sm border border-[#E0E4D6]">
        <p className="text-xs font-bold text-[#74796D] uppercase tracking-wider mb-1 capitalize">{today}</p>
        <h1 className="text-2xl font-normal text-[#1A1C18]">Olá, <span className="font-semibold text-[#3E6837]">Agricultor!</span></h1>
        <div className="mt-4 flex items-center gap-3 bg-[#FDFDF5] p-3 rounded-xl border border-[#EFF2E6]">
          <div className={`p-2 rounded-full ${rainAlert ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
            {rainAlert ? <CloudRain size={20} /> : <Sun size={20} />}
          </div>
          <div>
            <p className="text-sm font-medium text-[#1A1C18]">{rainAlert ? 'Chuva Prevista' : 'Céu Limpo'}</p>
            <p className="text-xs text-[#43483E]">{weather.temp}°C • {weather.precip}mm</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium text-[#1A1C18] px-2 mb-3 flex items-center gap-2"><Bell size={18} className="text-[#BA1A1A]" />Atenção Necessária</h2>
        <div className="space-y-3">
          {sickAnimals.length > 0 && sickAnimals.map(animal => (
            <div key={animal.id} onClick={() => onNavigate('animal')} className="bg-white p-4 rounded-[20px] border border-[#FFDAD6] shadow-sm flex items-center justify-between cursor-pointer active:scale-95 transition-transform">
              <div className="flex items-center gap-3">
                <div className="bg-[#FFDAD6] p-2 rounded-full text-[#BA1A1A]"><AlertTriangle size={20} /></div>
                <div>
                  <h3 className="font-bold text-[#1A1C18] text-sm">{animal.name} ({animal.type})</h3>
                  <p className="text-[#43483E] text-xs">{animal.notes}</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-[#74796D]" />
            </div>
          ))}

          {lowStocks.length > 0 && lowStocks.map(stock => (
            <div key={stock.id} onClick={() => onNavigate('stocks')} className="bg-white p-4 rounded-[20px] border border-orange-200 shadow-sm flex items-center justify-between cursor-pointer active:scale-95 transition-transform">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-full text-orange-600"><Package size={20} /></div>
                <div>
                  <h3 className="font-bold text-[#1A1C18] text-sm">Stock Baixo: {stock.name}</h3>
                  <p className="text-[#43483E] text-xs">Resta apenas {stock.quantity}{stock.unit}</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-[#74796D]" />
            </div>
          ))}

          {sickAnimals.length === 0 && lowStocks.length === 0 && (
            <div className="bg-[#CBE6A2]/20 p-4 rounded-[20px] flex items-center gap-3 border border-[#CBE6A2]">
              <CheckCircle className="text-[#2D4F00]" size={20} />
              <p className="text-[#2D4F00] text-sm font-medium">Tudo sob controlo na quinta.</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center px-2 mb-3">
          <h2 className="text-lg font-medium text-[#1A1C18] flex items-center gap-2"><Calendar size={18} className="text-[#3E6837]" />AgroAgenda</h2>
        </div>
        <div className="bg-white rounded-[24px] p-4 border border-[#E0E4D6] shadow-sm">
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-[#FDFDF5] rounded-xl transition-colors">
                <div onClick={() => onToggleTask(task.id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors shrink-0 cursor-pointer ${task.done ? 'bg-[#3E6837] border-[#3E6837]' : 'border-[#74796D]'}`}>
                  {task.done && <Check size={14} className="text-white" />}
                </div>
                <div className="flex-1 cursor-pointer" onClick={() => onToggleTask(task.id)}>
                  <p className={`text-sm font-medium transition-all ${task.done ? 'line-through text-[#74796D] opacity-60' : 'text-[#1A1C18]'}`}>{task.title}</p>
                </div>
                <button onClick={() => onDeleteTask(task.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-[#EFF2E6] flex gap-2">
            <input type="text" placeholder="Nova tarefa..." className="flex-1 bg-[#FDFDF5] border border-[#E0E4D6] rounded-xl px-4 py-2 text-sm outline-none focus:border-[#3E6837]" value={newTaskInput} onChange={(e) => setNewTaskInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddTask()} />
            <button onClick={handleAddTask} className="bg-[#3E6837] text-white p-2.5 rounded-xl active:scale-95 shadow-sm"><Plus size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

const WeatherWidget = ({ weather }) => (
  <div className={`bg-[#CBE6A2] text-[#1A3400] rounded-[24px] p-5 mb-2 relative overflow-hidden transition-all duration-700`}>
    <div className="relative z-10 flex justify-between items-start">
      <div>
        <p className="text-sm font-medium opacity-70">Meteorologia (Laundos)</p>
        <h2 className="text-4xl font-normal mt-1 flex items-start gap-1">{weather.temp}°<span className="text-lg mt-2 opacity-80">C</span></h2>
        <p className="text-sm mt-1 font-bold">{weather.condition} {weather.precip > 0 ? `(${weather.precip}mm)` : ''}</p>
      </div>
      <div className="p-2 bg-white/20 rounded-full">
        {weather.condition === 'Chuva' ? <CloudRain size={32} /> : <Sun size={32} />}
      </div>
    </div>
  </div>
);

const PestDetection = ({ selectedImage, isAnalyzing, result, onClose }) => {
  if (!selectedImage) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[28px] overflow-hidden border border-[#E0E4D6] shadow-2xl w-full max-w-sm">
        <div className="relative h-64 bg-black">
          <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
          <button onClick={onClose} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full"><X size={20} /></button>
          {isAnalyzing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
              <Loader2 className="w-12 h-12 text-[#CBE6A2] animate-spin mb-3" />
              <p className="text-white font-bold text-sm uppercase">Analisando Praga...</p>
            </div>
          )}
        </div>
        {result && (
          <div className="p-6 bg-[#FDFDF5]">
            <div className="flex items-center justify-between mb-4">
              <div><p className="text-[10px] text-[#43483E] font-bold uppercase tracking-widest mb-1">Resultado da IA</p><h3 className="text-xl font-bold text-[#1A1C18]">{result.disease}</h3></div>
              <div className={`p-2 rounded-full ${result.status === 'Saudável' ? 'bg-[#CBE6A2] text-[#2D4F00]' : 'bg-[#FFDAD6] text-[#BA1A1A]'}`}>{result.status === 'Saudável' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}</div>
            </div>
            <div className={`p-4 rounded-2xl mb-4 ${result.status === 'Saudável' ? 'bg-[#CBE6A2]/20' : 'bg-[#BA1A1A]/10'}`}><p className="text-sm text-[#1A1C18] leading-relaxed font-medium">{result.treatment}</p></div>
            <button onClick={onClose} className="w-full py-3 bg-[#3E6837] text-white rounded-xl font-bold">Concluir</button>
          </div>
        )}
      </div>
    </div>
  );
};

const FieldCard = ({ field, onToggleIrrigation, isExpanded, onToggleHistory, logs = [], onAddLog, onDelete }) => {
  const [viewMode, setViewMode] = useState('chart'); 
  const [newLogText, setNewLogText] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const handleAddLog = () => {
    if (!newLogText.trim()) return;
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          onAddLog(field.id, newLogText, loc);
          setNewLogText('');
          setIsLocating(false);
        },
        () => {
          onAddLog(field.id, newLogText, null);
          setNewLogText('');
          setIsLocating(false);
        },
        { timeout: 5000 }
      );
    } else {
      onAddLog(field.id, newLogText, null);
      setNewLogText('');
      setIsLocating(false);
    }
  };

  return (
    <div className="bg-[#EFF2E6] rounded-[20px] p-4 transition-all overflow-hidden border border-[#E0E4D6]">
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-[#E1E4D5] rounded-2xl flex items-center justify-center text-3xl shadow-inner shrink-0">{field.img}</div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-[#1A1C18] text-sm leading-tight">{field.name}</h3>
              <span className={`text-[10px] mt-1 inline-block ${field.health.includes('Atenção') ? 'text-[#BA1A1A]' : 'text-[#3E6837]'}`}>{field.health}</span>
            </div>
            <button onClick={() => onToggleIrrigation(field.id)} className={`w-10 h-6 rounded-full transition-all flex items-center px-1 ${field.irrigation ? 'bg-[#3E6837] justify-end' : 'bg-[#74796D] justify-start'}`}><div className="w-4 h-4 bg-white rounded-full shadow-sm" /></button>
          </div>
          <div className="flex items-center gap-3 mt-3">
             <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg text-[10px] font-bold"><Droplets size={12} className="text-blue-500" /> {field.humidity.toFixed(0)}%</div>
             <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg text-[10px] font-bold"><Thermometer size={12} className="text-orange-500" /> {field.temp.toFixed(0)}°</div>
             <div className="flex-1" />
             <div className="flex gap-2">
               <button onClick={() => onDelete(field.id)} className="p-1.5 bg-white text-red-500 rounded-lg"><Trash2 size={14} /></button>
               <button onClick={onToggleHistory} className="p-1.5 bg-white text-[#3E6837] rounded-lg"><BarChart3 size={14} /></button>
             </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-[#D8E6C6] animate-fade-in">
           <div className="flex mb-3 bg-[#E1E4D5] p-1 rounded-xl">
             <button onClick={() => setViewMode('chart')} className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all ${viewMode === 'chart' ? 'bg-white text-[#3E6837]' : 'text-[#74796D]'}`}>Gráfico</button>
             <button onClick={() => setViewMode('history')} className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all ${viewMode === 'history' ? 'bg-white text-[#3E6837]' : 'text-[#74796D]'}`}>Histórico</button>
           </div>
           {viewMode === 'chart' ? (
              <div className="h-24"><ResponsiveContainer><AreaChart data={[{v:20},{v:40},{v:30},{v:50}]}><Area type="monotone" dataKey="v" stroke="#3E6837" fill="#CBE6A2" /></AreaChart></ResponsiveContainer></div>
           ) : (
              <div className="space-y-2">
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {logs.length > 0 ? logs.map(log => (
                    <div key={log.id} className="bg-white p-2 rounded-lg text-[10px]">
                      <div className="flex justify-between font-bold mb-1"><span>{log.date}</span>{log.location && <MapPin size={10} className="text-green-600" />}</div>
                      <p>{log.description}</p>
                    </div>
                  )) : <p className="text-[10px] text-center text-gray-400 py-2">Sem registos.</p>}
                </div>
                <div className="flex gap-2 pt-2">
                  <input type="text" placeholder="Novo registo..." className="flex-1 bg-white border border-[#E0E4D6] rounded-lg px-2 py-1 text-[10px]" value={newLogText} onChange={e => setNewLogText(e.target.value)} disabled={isLocating} />
                  <button onClick={handleAddLog} disabled={isLocating} className="bg-[#3E6837] text-white p-1 rounded-lg">{isLocating ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}</button>
                </div>
              </div>
           )}
        </div>
      )}
    </div>
  );
};

const AnimalCard = ({ data, onAddProduction }) => {
  const [prodValue, setProdValue] = useState('');
  const handleRegister = () => { if (!prodValue || isNaN(prodValue)) return; onAddProduction(data.id, parseFloat(prodValue)); setProdValue(''); };
  const history = data.productionHistory || [];
  const avgProd = history.length > 0 ? (history.reduce((acc, curr) => acc + curr.value, 0) / history.length).toFixed(1) : 0;
  const unit = data.type.includes('Vaca') ? 'L' : 'Kg';

  return (
    <div className="bg-[#EFF2E6] rounded-[24px] overflow-hidden animate-slide-up transition-all mb-4 border border-[#E0E4D6]">
      <div className="bg-[#D8E6C6] p-4 flex justify-between items-start">
        <div><h3 className="text-xl font-bold text-[#1A1C18]">{data.name}</h3><p className="text-[#43483E] text-xs font-medium">{data.id}</p></div>
        <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${data.status === 'Saudável' ? 'bg-[#CBE6A2] text-[#2D4F00]' : 'bg-[#FFDAD6] text-[#BA1A1A]'}`}>{data.status}</div>
      </div>
      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#E0E4D6]">
          <div className="flex justify-between items-center mb-2">
             <div className="flex items-center gap-2"><Milk size={16} className="text-[#3E6837]" /><h4 className="font-bold text-[#1A1C18] text-xs">Produção Diária</h4></div>
             <span className="text-[10px] text-[#74796D]">Média: <b>{avgProd}{unit}</b></span>
          </div>
          <div className="flex gap-2 mb-3"><input type="number" placeholder={`Qtd (${unit})`} className="flex-1 bg-[#FDFDF5] border border-[#E0E4D6] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#3E6837]" value={prodValue} onChange={(e) => setProdValue(e.target.value)} /><button onClick={handleRegister} className="bg-[#3E6837] text-white px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-transform"><Plus size={14} /></button></div>
          {history.length > 0 && (
            <div className="h-24 w-full">
              <ResponsiveContainer><LineChart data={history}><XAxis dataKey="day" hide /><Tooltip /><Line type="monotone" dataKey="value" stroke="#3E6837" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
           <div className="bg-white p-2 rounded-lg border border-[#E0E4D6] text-[10px] font-bold"><p className="text-[#74796D] uppercase">Tipo</p>{data.type}</div>
           <div className="bg-white p-2 rounded-lg border border-[#E0E4D6] text-[10px] font-bold"><p className="text-[#74796D] uppercase">Peso</p>{data.weight}</div>
        </div>
      </div>
    </div>
  );
};

const StockManager = ({ stocks, onUpdateStock, onUpdatePrice }) => (
  <div className="space-y-4 animate-fade-in">
    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-[#E0E4D6] flex justify-between items-center">
      <div><h2 className="text-xl font-normal text-[#1A1C18]">Armazém Digital</h2><p className="text-xs text-[#43483E]">Insumos e Recursos</p></div>
      <div className="w-10 h-10 bg-[#E1E4D5] rounded-full flex items-center justify-center"><ClipboardList size={20} className="text-[#3E6837]" /></div>
    </div>
    <div className="grid gap-3">
      {Array.isArray(stocks) && stocks.map(stock => {
        const isLow = stock.quantity <= stock.minLevel;
        return (
          <div key={stock.id} className="bg-white p-4 rounded-[20px] border border-[#EFF2E6] shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <div className="bg-[#FDFDF5] p-2 rounded-xl border border-[#E0E4D6] text-[#3E6837]"><Package size={20} /></div>
                <div><h3 className="font-bold text-[#1A1C18] text-sm">{stock.name}</h3><p className={`text-[10px] ${isLow ? 'text-red-500 font-bold' : 'text-[#43483E]'}`}>{isLow ? 'Stock Baixo!' : 'Nível Adequado'}</p></div>
              </div>
              <div className="text-right"><span className="text-lg font-bold text-[#1A1C18]">{stock.quantity}</span><span className="text-xs text-[#74796D] ml-1">{stock.unit}</span></div>
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#FDFDF5]">
               <button onClick={() => {
                 const price = prompt('Novo preço:', stock.price);
                 if (price !== null) onUpdatePrice(stock.id, price);
               }} className="text-[10px] font-bold text-[#3E6837] flex items-center gap-1"><Edit2 size={12} /> {(stock.price || 0).toFixed(2)}€/{stock.unit}</button>
               <div className="flex gap-2">
                  <button onClick={() => onUpdateStock(stock.id, -10)} className="p-1 bg-red-50 text-red-600 rounded-lg text-[10px] px-2 font-bold">-10</button>
                  <button onClick={() => onUpdateStock(stock.id, 50)} className="p-1 bg-green-50 text-green-600 rounded-lg text-[10px] px-2 font-bold">+50</button>
               </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const FinanceManager = ({ transactions, stocks, onAddSale }) => {
  const safeTrans = Array.isArray(transactions) ? transactions : [];
  const safeStocks = Array.isArray(stocks) ? stocks : [];
  
  const totalIncome = safeTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalExpense = safeTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalStockValue = safeStocks.reduce((acc, s) => acc + ((s.quantity || 0) * (s.price || 0)), 0);
  const net = totalIncome - totalExpense;

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="bg-white p-5 rounded-[24px] shadow-sm border border-[#E0E4D6] flex justify-between items-center">
        <div><h2 className="text-xl font-normal text-[#1A1C18]">Gestão Financeira</h2><p className="text-xs text-[#43483E]">Balanço e Lucros</p></div>
        <div className="w-10 h-10 bg-[#E1E4D5] rounded-full flex items-center justify-center"><Coins size={20} className="text-[#3E6837]" /></div>
      </div>
      
      <div className="bg-white p-6 rounded-[24px] border border-[#E0E4D6] text-center shadow-sm">
        <span className="text-xs font-bold text-[#74796D] uppercase tracking-widest">Lucro Líquido Realizado</span>
        <h2 className={`text-4xl font-bold mt-1 ${net >= 0 ? 'text-[#3E6837]' : 'text-red-600'}`}>{net.toFixed(2)}€</h2>
        <div className="mt-4 pt-4 border-t border-[#FDFDF5] flex justify-center items-center gap-2 text-[#43483E]">
          <Wallet size={16} />
          <span className="text-xs font-medium">Ativos em Armazém: <b>{totalStockValue.toFixed(2)}€</b></span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-[20px] border border-[#EFF2E6] shadow-sm">
          <p className="text-[10px] font-bold text-green-600 uppercase mb-1">Receitas</p>
          <p className="text-lg font-bold text-[#1A1C18]">{totalIncome.toFixed(2)}€</p>
        </div>
        <div className="bg-white p-4 rounded-[20px] border border-[#EFF2E6] shadow-sm">
          <p className="text-[10px] font-bold text-red-600 uppercase mb-1">Despesas</p>
          <p className="text-lg font-bold text-[#1A1C18]">{totalExpense.toFixed(2)}€</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-[24px] border border-[#E0E4D6] shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-[#43483E] uppercase px-1">Histórico Recente</h3>
          <button onClick={() => {
            const desc = prompt('Descrição da venda:');
            const valor = prompt('Valor (€):');
            if (desc && valor) onAddSale(desc, valor);
          }} className="text-[10px] font-bold text-[#3E6837] flex items-center gap-1 bg-[#CBE6A2] px-2 py-1 rounded-lg"><Plus size={12} /> Nova Receita</button>
        </div>
        <div className="space-y-2">
          {safeTrans.length > 0 ? safeTrans.slice().reverse().slice(0, 5).map(t => (
            <div key={t.id} className="flex justify-between items-center p-3 rounded-xl hover:bg-[#FDFDF5] transition-colors border-b border-[#FDFDF5] last:border-0">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {t.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                </div>
                <div><p className="text-xs font-bold text-[#1A1C18]">{t.description}</p><p className="text-[10px] text-[#74796D]">{t.date}</p></div>
              </div>
              <span className={`text-xs font-bold ${t.type === 'income' ? 'text-green-700' : 'text-red-600'}`}>{(t.amount || 0).toFixed(2)}€</span>
            </div>
          )) : <p className="text-xs text-center text-gray-400 py-4 italic">Sem movimentos registados.</p>}
        </div>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedAnimalId, setScannedAnimalId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [expandedFieldId, setExpandedFieldId] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [weather, setWeather] = useState({ temp: 23, condition: 'Limpo', precip: 0, loading: false });
  const [isAddingField, setIsAddingField] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Inicialização Segura de Estados
  const [animals, setAnimals] = useState(() => {
    try {
      const saved = localStorage.getItem('agrosmart_animals');
      return saved ? JSON.parse(saved) : INITIAL_ANIMALS;
    } catch { return INITIAL_ANIMALS; }
  });

  const [fields, setFields] = useState(() => {
    try {
      const saved = localStorage.getItem('agrosmart_fields');
      return saved ? JSON.parse(saved) : INITIAL_FIELDS;
    } catch { return INITIAL_FIELDS; }
  });

  const [fieldLogs, setFieldLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('agrosmart_field_logs');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('agrosmart_tasks');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch { return INITIAL_TASKS; }
  });

  const [stocks, setStocks] = useState(() => {
    try {
      const saved = localStorage.getItem('agrosmart_stocks');
      return saved ? JSON.parse(saved) : INITIAL_STOCKS;
    } catch { return INITIAL_STOCKS; }
  });

  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('agrosmart_finance');
      // CORREÇÃO: Não usar INITIAL_STOCKS se estiver vazio, usar array vazio
      return (saved && Array.isArray(JSON.parse(saved))) ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('agrosmart_animals', JSON.stringify(animals));
    localStorage.setItem('agrosmart_fields', JSON.stringify(fields));
    localStorage.setItem('agrosmart_field_logs', JSON.stringify(fieldLogs));
    localStorage.setItem('agrosmart_tasks', JSON.stringify(tasks));
    localStorage.setItem('agrosmart_stocks', JSON.stringify(stocks));
    localStorage.setItem('agrosmart_finance', JSON.stringify(transactions));
  }, [animals, fields, fieldLogs, tasks, stocks, transactions]);

  const showNotification = (msg) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };

  const addFieldLog = (fieldId, description, location = null) => {
    const newLog = { id: Date.now(), fieldId, date: new Date().toLocaleDateString('pt-PT'), description, type: 'intervencao', location };
    setFieldLogs(prev => [newLog, ...prev]);
    showNotification(location ? 'Registo com GPS gravado! 📍' : 'Registo gravado.');
  };

  const updateStock = (id, amount, reason = "Ajuste") => {
    setStocks(prevStocks => {
      const stockItem = prevStocks.find(s => s.id === id);
      if (!stockItem) return prevStocks;

      const newQuantity = Math.max(0, stockItem.quantity + amount);
      const cost = Math.abs(amount) * (stockItem.price || 0);

      if (amount < 0) {
        const newTransaction = {
          id: Date.now(),
          description: `${reason}: ${stockItem.name}`,
          amount: cost,
          type: 'expense',
          date: new Date().toLocaleDateString('pt-PT')
        };
        setTransactions(prevT => [...prevT, newTransaction]);
      }

      return prevStocks.map(s => s.id === id ? { ...s, quantity: newQuantity } : s);
    });
    showNotification(amount < 0 ? `Stock consumido.` : 'Stock reposto.');
  };

  const updateStockPrice = (id, newPrice) => {
    const price = parseFloat(newPrice);
    if (!isNaN(price)) {
      setStocks(prev => prev.map(s => s.id === id ? { ...s, price } : s));
      showNotification('Preço atualizado.');
    }
  };

  const handleAddSale = (desc, valor) => {
    const amount = parseFloat(valor);
    if (!isNaN(amount)) {
      const newT = { id: Date.now(), description: desc, amount, type: 'income', date: new Date().toLocaleDateString('pt-PT') };
      setTransactions(prev => [...prev, newT]);
      showNotification('Venda registada.');
    }
  };

  const handleAddTask = (title) => {
    const newTask = { id: Date.now(), title, date: 'Hoje', done: false };
    setTasks(prev => [...prev, newTask]);
    showNotification('Tarefa adicionada.');
  };

  const handleToggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const handleDeleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addAnimalProduction = (animalId, value) => {
    const todayStr = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
    setAnimals(prev => prev.map(a => a.id === animalId ? { ...a, productionHistory: [...(a.productionHistory || []), { day: todayStr, value }] } : a));
    showNotification(`Registo guardado.`);
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
        setAnalysisResult({ status: 'Atenção', disease: 'Míldio', treatment: 'Aplicar fungicida à base de cobre.', confidence: '94%' });
      }, 2000);
    };
    reader.readAsDataURL(file);
  };

  const toggleIrrigation = (id) => {
    setFields(fields.map(f => f.id === id ? { ...f, irrigation: !f.irrigation } : f));
    showNotification('Estado da rega alterado.');
  };

  const handleScanNFC = () => {
    setIsScanning(true);
    setTimeout(() => {
      if (animals.length > 0) {
        const random = animals[Math.floor(Math.random() * animals.length)];
        setScannedAnimalId(random.id);
        showNotification(`Animal Identificado: ${random.name}`);
      }
      setIsScanning(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-screen bg-[#FDFDF5] font-sans text-[#1A1C18] overflow-hidden max-w-md mx-auto shadow-2xl border-x border-gray-100">
      <div className="px-4 py-3 bg-[#FDFDF5] flex justify-between items-center z-10 border-b border-[#E0E4D6]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#CBE6A2] rounded-full flex items-center justify-center text-[#2D4F00]"><Tractor size={18} /></div>
          <span className="text-lg font-bold tracking-tight">AgroSmart</span>
        </div>
        <div className="flex gap-2">
          {!isOnline && <div className="text-orange-500"><WifiOff size={18} /></div>}
          <div className="relative text-[#43483E]"><Bell size={20} /><span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" /></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        {notification && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-[#2D3228] text-white px-4 py-2 rounded-full text-xs z-50 animate-fade-in shadow-lg">
            {notification}
          </div>
        )}

        <PestDetection selectedImage={selectedImage} isAnalyzing={isAnalyzing} result={analysisResult} onClose={() => {setSelectedImage(null); setAnalysisResult(null);}} />

        {activeTab === 'home' && (
          <DashboardHome 
            weather={weather} animals={animals} fields={fields} 
            onNavigate={setActiveTab} tasks={tasks} stocks={stocks}
            onToggleTask={handleToggleTask} onAddTask={handleAddTask} onDeleteTask={handleDeleteTask} 
          />
        )}

        {activeTab === 'animal' && (
          <div className="mt-4 space-y-6 max-w-md mx-auto">
            {!scannedAnimalId && (
              <div className="text-center py-10 space-y-4 animate-fade-in">
                <h2 className="text-3xl font-normal text-[#1A1C18]">Identificação NFC</h2>
                <p className="text-[#43483E] text-md px-6 italic">Aproxime o dispositivo da tag do animal.</p>
              </div>
            )}
            <div className="flex justify-center">
              <button onClick={handleScanNFC} disabled={isScanning} className={`relative w-40 h-40 rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-500 shadow-sm ${isScanning ? 'bg-[#E1E4D5] scale-95' : 'bg-[#CBE6A2] hover:bg-[#BBD692] text-[#2D4F00]'}`}>
                {isScanning ? <Loader2 className="w-12 h-12 text-[#3E6837] animate-spin" /> : <Scan className="w-12 h-12 mb-3" />}
                <span className="font-bold text-sm">{isScanning ? "A LER..." : "LER TAG"}</span>
              </button>
            </div>
            {scannedAnimalId && <AnimalCard data={animals.find(a => a.id === scannedAnimalId)} onAddProduction={addAnimalProduction} />}
            {scannedAnimalId && <button onClick={() => setScannedAnimalId(null)} className="w-full py-2 text-xs font-bold text-[#74796D] uppercase">Nova Leitura</button>}
          </div>
        )}

        {activeTab === 'cultivo' && (
          <div className="space-y-4 animate-fade-in">
            <WeatherWidget weather={weather} />
            <div className="flex items-center justify-between mt-6 px-1">
              <p className="text-[#1A1C18] font-bold text-lg">Meus Campos</p>
              <div className="flex gap-2">
                <label className="flex items-center gap-1.5 p-2 bg-white rounded-xl border border-[#E0E4D6] text-[#3E6837] cursor-pointer hover:bg-[#FDFDF5] shadow-sm active:scale-95 px-3">
                  <Camera size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Usar IA</span>
                  <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleImageUpload} />
                </label>
                <button onClick={() => showNotification('Funcionalidade de adição em desenvolvimento.')} className="bg-[#3E6837] text-white p-2 rounded-xl active:scale-95 shadow-md"><Plus size={18} /></button>
              </div>
            </div>
            <div className="grid gap-3">
              {fields.map(field => (
                <FieldCard 
                  key={field.id} field={field} 
                  isExpanded={expandedFieldId === field.id}
                  onToggleHistory={() => setExpandedFieldId(expandedFieldId === field.id ? null : field.id)}
                  logs={fieldLogs.filter(l => l.fieldId === field.id)}
                  onAddLog={addFieldLog} onToggleIrrigation={toggleIrrigation}
                  onDelete={(id) => setFields(fields.filter(f => f.id !== id))}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'stocks' && <StockManager stocks={stocks} onUpdateStock={updateStock} onUpdatePrice={updateStockPrice} />}
        {activeTab === 'finance' && <FinanceManager transactions={transactions} stocks={stocks} onAddSale={handleAddSale} />}
      </div>

      <div className="bg-[#F0F5E9] h-20 pb-4 flex justify-around items-center fixed bottom-0 w-full max-w-md border-t border-[#D8E6C6] z-40">
        {[
          {id: 'home', icon: Home, label: 'Início'},
          {id: 'animal', icon: Scan, label: 'Animal'},
          {id: 'cultivo', icon: Sprout, label: 'Cultivo'},
          {id: 'stocks', icon: ClipboardList, label: 'Armazém'},
          {id: 'finance', icon: Coins, label: 'Finanças'}
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex flex-col items-center gap-1 group">
            <div className={`h-8 w-12 rounded-full flex items-center justify-center transition-all ${activeTab === tab.id ? 'bg-[#CBE6A2]' : ''}`}>
              <tab.icon size={20} className={activeTab === tab.id ? 'text-[#042100]' : 'text-[#43483E]'} />
            </div>
            <span className={`text-[9px] font-bold ${activeTab === tab.id ? 'text-[#042100]' : 'text-[#43483E]'}`}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}