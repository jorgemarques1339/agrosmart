import React, { useState } from 'react';
import { 
  Check, Droplets, Thermometer, BarChart3, 
  Trash2, Plus, Loader2, Brain, Wifi, Zap, X,
  Sparkles, TrendingUp, Leaf, CalendarCheck,
  ChevronDown
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
      <div className="bg-white dark:bg-neutral-900 rounded-t-[2rem] p-5 pb-10 w-full max-w-md shadow-2xl animate-slide-up border-t border-[#E0E4D6] dark:border-neutral-800 max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-[#1A1C18] dark:text-white tracking-tight uppercase italic leading-none">Novo Campo</h3>
          <button type="button" onClick={onClose} className="p-2 bg-[#FDFDF5] dark:bg-neutral-800 rounded-full text-[#74796D] border border-[#EFF2E6] dark:border-neutral-700">
            <X size={18}/>
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-[#74796D] dark:text-neutral-500 uppercase tracking-widest ml-1">Identificação</label>
            <input 
              className="w-full bg-[#FDFDF5] dark:bg-neutral-800 border-2 border-[#E0E4D6] dark:border-neutral-700 rounded-xl px-4 py-3 text-sm font-bold text-[#1A1C18] dark:text-white focus:border-[#3E6837] outline-none transition-all" 
              placeholder="Ex: Vinha Norte" 
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-[#74796D] dark:text-neutral-500 uppercase tracking-widest ml-1">Área (Hectares)</label>
            <input 
              className="w-full bg-[#FDFDF5] dark:bg-neutral-800 border-2 border-[#E0E4D6] dark:border-neutral-700 rounded-xl px-4 py-3 text-sm font-bold text-[#1A1C18] dark:text-white focus:border-[#3E6837] outline-none transition-all" 
              type="number" 
              inputMode="decimal"
              placeholder="Ex: 2.5" 
              value={area} 
              onChange={e => setArea(e.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#74796D] dark:text-neutral-500 uppercase tracking-widest ml-1">Cultivo</label>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar snap-x">
              {cropIcons.map(emoji => (
                <button 
                  key={emoji} 
                  type="button"
                  onClick={() => setType(emoji)}
                  className={`w-12 h-12 shrink-0 rounded-xl text-2xl flex items-center justify-center transition-all border-2 snap-start ${
                    type === emoji ? 'bg-[#EFF2E6] border-[#3E6837] shadow-sm scale-105' : 'bg-[#FDFDF5] dark:bg-neutral-800 border-transparent opacity-60'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-4 border border-[#E0E4D6] rounded-xl font-black text-[10px] uppercase text-[#43483E] dark:text-neutral-300">Cancelar</button>
            <button 
              type="button" 
              onClick={handleCreate} 
              disabled={!name.trim()}
              className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase shadow-md ${
                !name.trim() ? 'bg-gray-200 text-gray-400' : 'bg-[#3E6837] dark:bg-[#4ade80] text-white dark:text-neutral-900'
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
  const [viewMode, setViewMode] = useState('chart');
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
    onAddLog(field.id, newLogText);
    setNewLogText('');
    setIsLocating(false);
  };
  const handleIrrigationClick = async (e) => {
    e.stopPropagation(); // Evita expandir/fechar o card ao clicar no botão
    if (isWaiting) return;
    
    setIsWaiting(true);
    try {
      if (onToggleIrrigation) {
        await onToggleIrrigation(field.id);
      }
    } catch (err) {
      console.error("Erro ao alternar rega:", err);
    } finally {
      // Pequeno delay para feedback visual do hardware
      setTimeout(() => setIsWaiting(false), 600);
    }
  };
  const chartData = chartSource === 'ndvi' 
    ? (field.ndviHistory || []) 
    : (field.humidityHistory || DEFAULT_HISTORY);

  const dataKey = chartSource === 'ndvi' ? 'value' : 'hum';
  const color = chartSource === 'ndvi' ? '#3E6837' : '#0ea5e9';

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] p-3.5 transition-all border border-gray-100 dark:border-neutral-800 shadow-sm active:shadow-md mb-3 overflow-hidden">
      
      {/* Cabeçalho Principal (Informação Resumida e Compacta) */}
      <div className="flex gap-3 items-center">
        {/* Ícone de Cultura Reduzido: w-16 -> w-12 */}
        <div className="w-12 h-12 bg-[#FDFDF5] dark:bg-neutral-800 rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0 relative border border-[#EFF2E6] dark:border-neutral-700">
          {field.img}
          <div className="absolute -top-0.5 -left-0.5 bg-green-500 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-neutral-900 animate-pulse"></div>
          {field.area && (
            <div className="absolute -bottom-1 -right-1 bg-[#3E6837] dark:bg-[#4ade80] px-1.5 py-0.5 rounded-md text-[8px] font-black text-white dark:text-neutral-900 shadow-sm leading-none">
              {field.area}ha
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="truncate pr-1">
              <h3 className="font-bold text-[#1A1C18] dark:text-white text-sm truncate uppercase italic tracking-tight leading-tight">{field.name}</h3>
              <p className={`text-[8px] font-black uppercase tracking-wider ${field.health.includes('Atenção') ? 'text-red-500' : 'text-[#3E6837] dark:text-[#4ade80]'}`}>
                {field.health}
              </p>
            </div>
            
            {/* Switch de Rega MQTT Reduzido: w-14 -> w-11 */}
            <button 
              type="button"
              onClick={handleToggleCommand}
              disabled={isWaitingHardware}
              className={`w-11 h-6 rounded-full transition-all duration-300 relative flex items-center shrink-0 shadow-inner ${isWaitingHardware ? 'opacity-50' : 'active:scale-90'} ${field.irrigation ? 'bg-[#3E6837] dark:bg-[#4ade80]' : 'bg-[#E0E4D6] dark:bg-neutral-700'}`}
            >
              {isWaitingHardware ? (
                <Loader2 size={10} className="animate-spin mx-auto text-white dark:text-neutral-900" />
              ) : (
                <span className={`absolute w-4.5 h-4.5 rounded-full transition-all duration-300 bg-white shadow-md ${field.irrigation ? 'right-0.5' : 'left-0.5'}`} />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between mt-1.5">
            <div className="flex gap-1.5">
              {/* Sensores Visuais Compactos */}
              <div className="flex items-center gap-1 bg-[#F0F9FF] dark:bg-blue-900/20 px-1.5 py-0.5 rounded-lg border border-[#BAE6FD] dark:border-blue-900/30">
                <Droplets size={12} className="text-blue-500" />
                <span className="text-[10px] font-black text-blue-700 dark:text-blue-300">{field.humidity ? field.humidity.toFixed(0) : 0}%</span>
              </div>
              <div className="flex items-center gap-1 bg-[#FDFDF5] dark:bg-neutral-800 px-1.5 py-0.5 rounded-lg border border-[#EFF2E6] dark:border-neutral-700">
                <Thermometer size={12} className="text-red-500" />
                <span className="text-[10px] font-black text-[#1A1C18] dark:text-white">{field.temp ? field.temp.toFixed(0) : 20}°</span>
              </div>
            </div>

            {/* Ações Rápidas Reduzidas: p-3 -> p-1.5 */}
            <div className="flex gap-1">
              <button 
                type="button" 
                onClick={() => { setViewMode('ai'); if(!isExpanded) onToggleHistory(); }} 
                className={`p-1.5 rounded-lg active:scale-90 shadow-sm transition-all border ${viewMode === 'ai' && isExpanded ? 'bg-purple-600 text-white border-transparent' : 'bg-[#F5F3FF] dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/30'}`} 
              >
                <Brain size={16} />
              </button>
              <button type="button" onClick={onToggleHistory} className={`p-1.5 rounded-lg border active:scale-90 transition-all shadow-sm ${isExpanded && viewMode !== 'ai' ? 'bg-[#3E6837] dark:bg-[#4ade80] text-white dark:text-neutral-900 border-transparent' : 'bg-white dark:bg-neutral-800 text-[#3E6837] dark:text-[#4ade80] border-[#E0E4D6] dark:border-neutral-700'}`}>
                <ChevronDown size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
              <button type="button" onClick={() => onDelete && onDelete(field.id)} className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-lg active:scale-90 shadow-sm border border-transparent dark:border-red-900/30">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Secção Expandida */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-[#EFF2E6] dark:border-neutral-800 animate-fade-in block">
           
           <div className="flex mb-4 bg-[#FDFDF5] dark:bg-neutral-950 p-1 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-inner">
             <button type="button" onClick={() => setViewMode('chart')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'chart' ? 'bg-white dark:bg-neutral-800 text-[#3E6837] dark:text-[#4ade80] shadow-sm' : 'text-[#74796D]'}`}>Sensores</button>
             <button type="button" onClick={() => setViewMode('history')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'history' ? 'bg-white dark:bg-neutral-800 text-[#3E6837] dark:text-[#4ade80] shadow-sm' : 'text-[#74796D]'}`}>Diário</button>
             <button type="button" onClick={() => setViewMode('ai')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'ai' ? 'bg-purple-600 text-white shadow-sm' : 'text-purple-400 dark:text-purple-900/60'}`}>AI ✨</button>
           </div>

           {viewMode === 'chart' && (
              <div className="space-y-4 px-1">
                <div className="flex justify-center gap-6 text-[9px] font-black uppercase tracking-widest text-[#74796D]">
                  <button type="button" onClick={() => setChartSource('humidity')} className={`pb-1 border-b-2 transition-all ${chartSource === 'humidity' ? 'text-blue-500 border-blue-500' : 'border-transparent opacity-40'}`}>Solo</button>
                  <button type="button" onClick={() => setChartSource('ndvi')} className={`pb-1 border-b-2 transition-all ${chartSource === 'ndvi' ? 'text-[#3E6837] dark:text-[#4ade80] border-[#3E6837] dark:border-[#4ade80]' : 'border-transparent opacity-40'}`}>Vigor</button>
                </div>
                <div className="h-36 w-full bg-gray-50/50 dark:bg-neutral-950/50 rounded-2xl p-2 shadow-inner">
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
                      <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} fillOpacity={1} fill={`url(#colorField-${field.id})`} animationDuration={1000} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontWeight: '900', fontSize: '10px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
           )}

           {viewMode === 'history' && (
              <div className="space-y-3">
                 <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {logs && logs.length > 0 ? logs.map(log => (
                        <div key={log.id} className="bg-[#FDFDF5] dark:bg-neutral-950 p-3 rounded-xl border border-[#EFF2E6] dark:border-neutral-800 shadow-sm">
                           <div className="flex justify-between font-black text-[8px] uppercase mb-1 tracking-wider">
                             <span className="text-gray-400">{log.date}</span>
                             <span className="text-[#3E6837] dark:text-[#4ade80]">{log.type}</span>
                           </div>
                           <p className="text-[#1A1C18] dark:text-gray-300 text-[11px] font-medium leading-tight">{log.description}</p>
                        </div>
                    )) : <p className="text-center py-6 text-[10px] italic text-gray-400">Nenhum registo.</p>}
                 </div>
                 <div className="flex gap-2 pt-1">
                    <input 
                      type="text" 
                      placeholder="Nova nota..." 
                      className="flex-1 bg-[#FDFDF5] dark:bg-neutral-950 border-2 border-[#E0E4D6] dark:border-neutral-800 rounded-xl px-3 py-3 text-[11px] font-bold outline-none focus:border-[#3E6837] dark:text-white" 
                      value={newLogText} 
                      onChange={(e) => setNewLogText(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && handleAddLog()} 
                    />
                    <button type="button" onClick={handleAddLog} className="bg-[#3E6837] dark:bg-[#4ade80] text-white dark:text-neutral-900 px-4 rounded-xl active:scale-95 shadow-md flex items-center justify-center">
                      <Plus size={18} />
                    </button>
                 </div>
              </div>
           )}

           {viewMode === 'ai' && (
              <div className="space-y-3 animate-fade-in">
                 <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[1.5rem] p-4 text-white shadow-md relative overflow-hidden">
                    <div className="absolute -top-5 -right-5 opacity-10"><Sparkles size={80} /></div>
                    <div className="relative z-10">
                       <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Colheita Estimada</p>
                       <div className="flex items-baseline gap-1">
                          <h4 className="text-3xl font-black italic tracking-tighter leading-none">
                            {(field.area * (field.cropCycle?.yieldPerHa || 10)).toFixed(1)}
                          </h4>
                          <span className="text-lg font-black opacity-60 italic">Ton</span>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#FDFDF5] dark:bg-neutral-950 p-3 rounded-2xl border border-[#E0E4D6] dark:border-neutral-800">
                       <p className="text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest mb-1">NDVI</p>
                       <p className="text-lg font-black text-[#1A1C18] dark:text-white leading-none">0.82</p>
                       <div className="w-full bg-gray-200 dark:bg-neutral-800 h-1 rounded-full mt-2 overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full w-[82%]"></div>
                       </div>
                    </div>

                    <div className="bg-[#FDFDF5] dark:bg-neutral-950 p-3 rounded-2xl border border-[#E0E4D6] dark:border-neutral-800">
                       <p className="text-[8px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-widest mb-1">Previsão</p>
                       <p className="text-[10px] font-black text-[#1A1C18] dark:text-white uppercase leading-tight italic">{field.cropCycle?.harvest || 'Setembro'}</p>
                    </div>
                 </div>

                 <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20 p-3 rounded-2xl flex gap-3 items-start">
                    <div className="p-2 bg-white dark:bg-neutral-900 rounded-lg text-purple-600 shrink-0 shadow-sm">
                       <Brain size={14} />
                    </div>
                    <p className="text-[10px] font-bold text-[#43483E] dark:text-gray-400 leading-tight">
                       {field.humidity < 40 
                          ? "Humidade baixa. Rega recomendada por 25 min."
                          : "Condições ótimas. Estabilidade detetada."}
                    </p>
                 </div>
              </div>
           )}
        </div>
      )}
    </div>
  );
};

export default FieldCard;