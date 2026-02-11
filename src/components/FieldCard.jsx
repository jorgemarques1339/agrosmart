import React, { useState } from 'react';
import { 
  Check, Droplets, Thermometer, BarChart3, 
  Trash2, Plus, Loader2, Brain, Wifi, Zap, X,
  Sparkles, TrendingUp, Leaf, CalendarCheck,
  Info, AlertTriangle, ChevronDown
} from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, YAxis } from 'recharts';

// --- DADOS DE EXEMPLO (Fallback para Gráficos) ---
const DEFAULT_HISTORY = [
  { time: '08:00', hum: 45 }, { time: '10:00', hum: 40 }, { time: '12:00', hum: 35 },
  { time: '14:00', hum: 30 }, { time: '16:00', hum: 42 }, { time: '18:00', hum: 55 }
];

// --- COMPONENTE 1: MODAL DE CRIAÇÃO (Novo Campo) ---
export const AddFieldModal = ({ isOpen, onClose, onAdd, cropCalendar = {} }) => {
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [type, setType] = useState('🌽');

  if (!isOpen) return null;

  const cropIcons = Object.keys(cropCalendar).length > 0 
    ? Object.keys(cropCalendar) 
    : ['🌽', '🍇', '🥔', '🍅', '🌿', '🥕', '🌻', '🌾', '🍓'];

  const handleCreate = () => {
    if (!name.trim()) return;
    onAdd({ name, area, type });
    setName('');
    setArea('');
    setType('🌽');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-end justify-center bg-black/70 backdrop-blur-sm p-0 animate-fade-in">
      {/* Modal Slide Up: Formato ideal para Mobile */}
      <div className="bg-white dark:bg-neutral-900 rounded-t-[2.5rem] p-6 pb-12 w-full max-w-md shadow-2xl animate-slide-up border-t border-[#E0E4D6] dark:border-neutral-800 max-h-[95vh] overflow-y-auto">
        
        {/* Header do Modal */}
        <div className="flex justify-between items-center mb-8">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-[#1A1C18] dark:text-white tracking-tight uppercase italic leading-none">Novo Campo</h3>
            <p className="text-[10px] font-bold text-[#74796D] uppercase tracking-widest">Configuração de Monitorização</p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-3 bg-[#FDFDF5] dark:bg-neutral-800 rounded-full text-[#74796D] active:scale-90 transition-all border border-[#EFF2E6] dark:border-neutral-700"
          >
            <X size={20}/>
          </button>
        </div>

        <div className="space-y-6">
          {/* Input: Nome */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-[#74796D] dark:text-neutral-500 uppercase tracking-widest ml-1">Identificação</label>
            <input 
              className="w-full bg-[#FDFDF5] dark:bg-neutral-800 border-2 border-[#E0E4D6] dark:border-neutral-700 rounded-2xl px-5 py-4 text-base font-bold text-[#1A1C18] dark:text-white focus:border-[#3E6837] dark:focus:border-[#4ade80] outline-none transition-all placeholder:text-gray-300" 
              placeholder="Ex: Vinha Norte" 
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
          </div>

          {/* Input: Área */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-[#74796D] dark:text-neutral-500 uppercase tracking-widest ml-1">Área (Hectares)</label>
            <input 
              className="w-full bg-[#FDFDF5] dark:bg-neutral-800 border-2 border-[#E0E4D6] dark:border-neutral-700 rounded-2xl px-5 py-4 text-base font-bold text-[#1A1C18] dark:text-white focus:border-[#3E6837] dark:focus:border-[#4ade80] outline-none transition-all placeholder:text-gray-300" 
              type="number" 
              inputMode="decimal"
              placeholder="Ex: 2.5" 
              value={area} 
              onChange={e => setArea(e.target.value)} 
            />
          </div>

          {/* Seletor de Cultura Otimizado */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-[#74796D] dark:text-neutral-500 uppercase tracking-widest ml-1">Cultivo Principal</label>
            <div className="flex gap-3 overflow-x-auto pb-4 px-1 no-scrollbar scroll-smooth snap-x">
              {cropIcons.map(emoji => (
                <button 
                  key={emoji} 
                  type="button"
                  onClick={() => setType(emoji)}
                  className={`w-16 h-16 shrink-0 rounded-2xl text-3xl flex items-center justify-center transition-all border-4 snap-start ${
                    type === emoji 
                      ? 'bg-[#EFF2E6] border-[#3E6837] dark:border-[#4ade80] scale-105 shadow-md' 
                      : 'bg-[#FDFDF5] dark:bg-neutral-800 border-transparent opacity-60'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          
          {/* Botões de Ação Mobile */}
          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose} 
              className="flex-1 py-5 border-2 border-[#E0E4D6] dark:border-neutral-700 rounded-2xl font-black text-xs uppercase text-[#43483E] dark:text-neutral-300 active:scale-95 transition-transform"
            >
              Cancelar
            </button>
            <button 
              type="button"
              onClick={handleCreate} 
              disabled={!name.trim()}
              className={`flex-1 py-5 rounded-2xl font-black text-xs uppercase shadow-lg transition-all active:scale-95 ${
                !name.trim() 
                  ? 'bg-gray-200 text-gray-400' 
                  : 'bg-[#3E6837] dark:bg-[#4ade80] text-white dark:text-neutral-900'
              }`}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE 2: CARTÃO DO CAMPO ---
const FieldCard = ({ 
  field, 
  onToggleIrrigation, 
  isExpanded, 
  onToggleHistory, 
  onDelete, 
  logs = [], 
  onAddLog 
}) => {
  const [viewMode, setViewMode] = useState('chart'); // 'chart', 'history', 'ai'
  const [chartSource, setChartSource] = useState('humidity');
  const [newLogText, setNewLogText] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isWaitingHardware, setIsWaitingHardware] = useState(false);

  const handleToggleCommand = async () => {
    setIsWaitingHardware(true);
    if (onToggleIrrigation) await onToggleIrrigation(field.id);
    setTimeout(() => setIsWaitingHardware(false), 800);
  };

  const handleAddLog = () => {
    if (!newLogText.trim()) return;
    setIsLocating(true);
    // Simulação ou Geolocation real
    onAddLog(field.id, newLogText);
    setNewLogText('');
    setIsLocating(false);
  };

  const chartData = chartSource === 'ndvi' 
    ? (field.ndviHistory || []) 
    : (field.humidityHistory || DEFAULT_HISTORY);

  const dataKey = chartSource === 'ndvi' ? 'value' : 'hum';
  const color = chartSource === 'ndvi' ? '#3E6837' : '#0ea5e9';

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-5 transition-all border border-gray-100 dark:border-neutral-800 shadow-sm active:shadow-md mb-4 overflow-hidden">
      
      {/* Cabeçalho Principal (Informação Resumida) */}
      <div className="flex gap-4 items-center">
        <div className="w-16 h-16 bg-[#FDFDF5] dark:bg-neutral-800 rounded-3xl flex items-center justify-center text-3xl shadow-inner shrink-0 relative border border-[#EFF2E6] dark:border-neutral-700">
          {field.img}
          <div className="absolute -top-0.5 -left-0.5 bg-green-500 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-neutral-900 animate-pulse"></div>
          {field.area && (
            <div className="absolute -bottom-1 -right-1 bg-[#3E6837] dark:bg-[#4ade80] px-2 py-0.5 rounded-lg text-[9px] font-black text-white dark:text-neutral-900 shadow-sm">
              {field.area}ha
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div className="truncate pr-2">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-[#1A1C18] dark:text-white text-base truncate uppercase italic tracking-tight">{field.name}</h3>
                <Wifi size={12} className="text-[#3E6837] dark:text-[#4ade80] opacity-40" />
              </div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${field.health.includes('Atenção') ? 'text-red-500' : 'text-[#3E6837] dark:text-[#4ade80]'}`}>
                {field.health}
              </p>
            </div>
            
            {/* Switch de Rega MQTT - Chunky para Mobile */}
            <button 
              type="button"
              onClick={handleToggleCommand}
              disabled={isWaitingHardware}
              className={`w-14 h-8 rounded-full transition-all duration-300 relative flex items-center shrink-0 shadow-inner ${isWaitingHardware ? 'opacity-50 scale-95' : 'active:scale-90'} ${field.irrigation ? 'bg-[#3E6837] dark:bg-[#4ade80]' : 'bg-[#E0E4D6] dark:bg-neutral-700'}`}
            >
              {isWaitingHardware ? (
                <Loader2 size={14} className="animate-spin mx-auto text-white dark:text-neutral-900" />
              ) : (
                <span className={`absolute w-6 h-6 rounded-full transition-all duration-300 bg-white shadow-md ${field.irrigation ? 'right-1' : 'left-1'}`} />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 bg-[#F0F9FF] dark:bg-blue-900/20 px-2.5 py-1.5 rounded-xl border border-[#BAE6FD] dark:border-blue-900/30 shadow-sm">
                <Droplets size={14} className="text-blue-500" />
                <span className="text-xs font-black text-blue-700 dark:text-blue-300">{field.humidity ? field.humidity.toFixed(0) : 0}%</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#FDFDF5] dark:bg-neutral-800 px-2.5 py-1.5 rounded-xl border border-[#EFF2E6] dark:border-neutral-700 shadow-sm">
                <Thermometer size={14} className="text-red-500" />
                <span className="text-xs font-black text-[#1A1C18] dark:text-white">{field.temp ? field.temp.toFixed(0) : 20}°</span>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="flex gap-1.5">
              <button 
                type="button" 
                onClick={() => { setViewMode('ai'); if(!isExpanded) onToggleHistory(); }} 
                className={`p-3 rounded-xl active:scale-90 shadow-sm transition-all border ${viewMode === 'ai' && isExpanded ? 'bg-purple-600 text-white border-transparent scale-110' : 'bg-[#F5F3FF] dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30'}`} 
              >
                <Brain size={20} />
              </button>
              <button type="button" onClick={onToggleHistory} className={`p-3 rounded-xl border active:scale-90 transition-all shadow-sm ${isExpanded && viewMode !== 'ai' ? 'bg-[#3E6837] dark:bg-[#4ade80] text-white dark:text-neutral-900 border-transparent' : 'bg-white dark:bg-neutral-800 text-[#3E6837] dark:text-[#4ade80] border-[#E0E4D6] dark:border-neutral-700'}`}>
                <ChevronDown size={20} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
              <button type="button" onClick={() => onDelete && onDelete(field.id)} className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-xl active:scale-90 shadow-sm border border-transparent dark:border-red-900/30">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Secção Expandida: Abas Dinâmicas */}
      {isExpanded && (
        <div className="mt-5 pt-5 border-t border-[#EFF2E6] dark:border-neutral-800 animate-fade-in block">
           
           {/* Tab Bar - Otimizada para o polegar */}
           <div className="flex mb-5 bg-[#FDFDF5] dark:bg-neutral-950 p-1.5 rounded-[1.5rem] border border-gray-100 dark:border-neutral-800 shadow-inner">
             <button type="button" onClick={() => setViewMode('chart')} className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'chart' ? 'bg-white dark:bg-neutral-800 text-[#3E6837] dark:text-[#4ade80] shadow-md' : 'text-[#74796D] dark:text-neutral-500'}`}>Sensores</button>
             <button type="button" onClick={() => setViewMode('history')} className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'history' ? 'bg-white dark:bg-neutral-800 text-[#3E6837] dark:text-[#4ade80] shadow-md' : 'text-[#74796D] dark:text-neutral-500'}`}>Diário</button>
             <button type="button" onClick={() => setViewMode('ai')} className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'ai' ? 'bg-purple-600 text-white shadow-md scale-105' : 'text-purple-400 dark:text-purple-900/60'}`}>AI ✨</button>
           </div>

           {/* 1. ABA: SENSORES */}
           {viewMode === 'chart' && (
              <div className="space-y-5 px-1">
                <div className="flex justify-center gap-8 text-[11px] font-black uppercase tracking-widest text-[#74796D]">
                  <button type="button" onClick={() => setChartSource('humidity')} className={`pb-2 border-b-4 transition-all ${chartSource === 'humidity' ? 'text-blue-500 border-blue-500' : 'border-transparent opacity-40'}`}>Solo</button>
                  <button type="button" onClick={() => setChartSource('ndvi')} className={`pb-2 border-b-4 transition-all ${chartSource === 'ndvi' ? 'text-[#3E6837] dark:text-[#4ade80] border-[#3E6837] dark:border-[#4ade80]' : 'border-transparent opacity-40'}`}>Vigor</button>
                </div>
                <div className="h-44 w-full bg-gray-50/50 dark:bg-neutral-950/50 rounded-[2rem] p-3 shadow-inner">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id={`colorField-${field.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={color} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey={chartSource === 'ndvi' ? 'date' : 'time'} hide />
                      <YAxis hide domain={chartSource === 'ndvi' ? [0, 1] : [0, 100]} />
                      <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={4} fillOpacity={1} fill={`url(#colorField-${field.id})`} animationDuration={1500} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: '900', fontSize: '11px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
           )}

           {/* 2. ABA: DIÁRIO */}
           {viewMode === 'history' && (
              <div className="space-y-4">
                 <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar scroll-smooth">
                    {logs && logs.length > 0 ? logs.map(log => (
                        <div key={log.id} className="bg-[#FDFDF5] dark:bg-neutral-950 p-4 rounded-2xl border border-[#EFF2E6] dark:border-neutral-800 shadow-sm animate-fade-in">
                           <div className="flex justify-between font-black text-[9px] uppercase mb-1.5 tracking-wider">
                             <span className="text-gray-400 dark:text-neutral-600">{log.date}</span>
                             <span className="text-[#3E6837] dark:text-[#4ade80]">{log.type}</span>
                           </div>
                           <p className="text-[#1A1C18] dark:text-gray-300 text-sm font-medium leading-relaxed">{log.description}</p>
                        </div>
                    )) : <p className="text-center py-8 text-xs italic text-gray-400">Nenhum registo encontrado.</p>}
                 </div>
                 <div className="flex gap-2.5 pt-2">
                    <input 
                      type="text" 
                      placeholder="Adicionar nota..." 
                      className="flex-1 bg-[#FDFDF5] dark:bg-neutral-950 border-2 border-[#E0E4D6] dark:border-neutral-800 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-[#3E6837] dark:focus:border-[#4ade80] dark:text-white transition-all" 
                      value={newLogText} 
                      onChange={(e) => setNewLogText(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && handleAddLog()} 
                    />
                    <button type="button" onClick={handleAddLog} className="bg-[#3E6837] dark:bg-[#4ade80] text-white dark:text-neutral-900 px-6 rounded-2xl active:scale-95 shadow-lg flex items-center justify-center transition-all">
                      <Plus size={24} />
                    </button>
                 </div>
              </div>
           )}

           {/* 3. ABA: PREVISÃO AI (DESIGN PREMIUM) */}
           {viewMode === 'ai' && (
              <div className="space-y-4 animate-fade-in">
                 {/* Card Principal de Produção */}
                 <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 opacity-10"><Sparkles size={140} /></div>
                    <div className="relative z-10">
                       <div className="flex items-center gap-2 mb-4">
                         <div className="bg-white/20 p-1.5 rounded-lg"><TrendingUp size={16} /></div>
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Estimativa de Colheita</p>
                       </div>
                       <div className="flex items-baseline gap-2">
                          <h4 className="text-5xl font-black italic tracking-tighter leading-none">
                            {(field.area * (field.cropCycle?.yieldPerHa || 10)).toFixed(1)}
                          </h4>
                          <span className="text-2xl font-black opacity-60 italic">Toneladas</span>
                       </div>
                       <p className="text-[11px] font-bold opacity-70 mt-3 flex items-center gap-1.5 uppercase tracking-wider">
                         <CalendarCheck size={14} /> Ciclo previsto: {field.cropCycle?.harvest || 'Setembro'}
                       </p>
                    </div>
                 </div>

                 {/* Grelha de Performance AI */}
                 <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#FDFDF5] dark:bg-neutral-950 p-4 rounded-[2rem] border border-[#E0E4D6] dark:border-neutral-800 shadow-sm">
                       <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                          <Leaf size={16} />
                          <span className="text-[9px] font-black uppercase tracking-widest">Índice NDVI</span>
                       </div>
                       <p className="text-2xl font-black text-[#1A1C18] dark:text-white leading-none">0.82</p>
                       <div className="w-full bg-gray-200 dark:bg-neutral-800 h-2 rounded-full mt-3 overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full w-[82%]"></div>
                       </div>
                    </div>

                    <div className="bg-[#FDFDF5] dark:bg-neutral-950 p-4 rounded-[2rem] border border-[#E0E4D6] dark:border-neutral-800 shadow-sm">
                       <div className="flex items-center gap-2 mb-2 text-purple-600 dark:text-purple-400">
                          <Zap size={16} />
                          <span className="text-[9px] font-black uppercase tracking-widest">Status IA</span>
                       </div>
                       <p className="text-xs font-black text-[#1A1C18] dark:text-white uppercase leading-tight italic">Otimização Ativa</p>
                       <p className="text-[9px] text-[#74796D] mt-2 font-bold uppercase tracking-wider">Algoritmo Agro-v4</p>
                    </div>
                 </div>

                 {/* Insights Inteligentes Contextuais */}
                 <div className="bg-purple-50 dark:bg-purple-900/10 border-2 border-purple-100 dark:border-purple-900/20 p-5 rounded-[2rem] flex gap-4 items-start shadow-sm">
                    <div className="p-3 bg-white dark:bg-neutral-900 rounded-2xl text-purple-600 shadow-sm shrink-0">
                       <Brain size={20} />
                    </div>
                    <div className="space-y-1">
                       <h5 className="text-[10px] font-black uppercase tracking-[0.1em] text-purple-800 dark:text-purple-300">Sugestão AgroSmart</h5>
                       <p className="text-xs font-bold text-[#43483E] dark:text-gray-400 leading-relaxed">
                          {field.humidity < 40 
                             ? "Humidade do solo abaixo do ideal para o estágio vegetativo atual. Ative a rega suplementar por 25 min para evitar stress hídrico."
                             : "As condições térmicas e de humidade estão no ponto ótimo. Próxima janela de fertilização recomendada em 48 horas."}
                       </p>
                    </div>
                 </div>
              </div>
           )}
        </div>
      )}
    </div>
  );
};

export default FieldCard;