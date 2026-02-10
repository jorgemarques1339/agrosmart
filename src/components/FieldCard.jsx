import React, { useState } from 'react';
import { 
  Check, Droplets, Thermometer, BarChart3, Calendar, 
  Trash2, FileText, Plus, MapPin, Download, Loader2, Satellite, Brain 
} from 'lucide-react';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, YAxis } from 'recharts';

// Dados estáticos locais para garantir que o gráfico funciona mesmo sem ligação externa
const HUMIDITY_HISTORY_DATA = [
  { time: '08:00', hum: 45 }, { time: '10:00', hum: 40 }, { time: '12:00', hum: 35 },
  { time: '14:00', hum: 30 }, { time: '16:00', hum: 42 }, { time: '18:00', hum: 55 }
];

const FieldCard = ({ 
  field, 
  onToggleIrrigation, 
  isExpanded, 
  onToggleHistory, 
  onDelete, 
  logs = [], 
  onAddLog, 
  onPredictYield // Esta prop liga o cartão ao Modal Premium no App.jsx
}) => {
  const [viewMode, setViewMode] = useState('chart'); // 'chart' ou 'history'
  const [chartSource, setChartSource] = useState('humidity'); // 'humidity' ou 'ndvi'
  const [newLogText, setNewLogText] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  // Função para adicionar registo com GPS
  const handleAddLog = () => {
    if (!newLogText.trim()) return;
    setIsLocating(true);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onAddLog(field.id, newLogText, { 
            lat: position.coords.latitude, 
            lng: position.coords.longitude 
          });
          setNewLogText('');
          setIsLocating(false);
        },
        () => {
          onAddLog(field.id, newLogText, null);
          setNewLogText('');
          setIsLocating(false);
        }
      );
    } else {
      onAddLog(field.id, newLogText, null);
      setNewLogText('');
      setIsLocating(false);
    }
  };

  // Preparar dados do gráfico
  const chartData = chartSource === 'ndvi' ? (field.ndviHistory || []) : HUMIDITY_HISTORY_DATA;
  const dataKey = chartSource === 'ndvi' ? 'value' : 'hum';
  const color = chartSource === 'ndvi' ? '#3E6837' : '#0ea5e9';

  return (
    <div className="bg-[#EFF2E6] rounded-[24px] p-4 transition-all overflow-hidden border border-[#E0E4D6] shadow-sm">
      <div className="flex gap-4">
        
        {/* Ícone e Área */}
        <div className="w-20 h-20 bg-[#E1E4D5] rounded-2xl flex items-center justify-center text-4xl shadow-inner shrink-0 relative">
          {field.img}
          {field.area && (
            <div className="absolute -bottom-2 bg-white px-2 py-0.5 rounded-full text-[9px] font-bold text-[#3E6837] shadow-sm border border-[#E0E4D6]">
              {field.area}ha
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-between py-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-[#1A1C18] text-base leading-tight">{field.name}</h3>
              <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 inline-block ${field.health.includes('Atenção') ? 'text-[#BA1A1A]' : 'text-[#3E6837]'}`}>
                {field.health}
              </span>
            </div>
            
            {/* Switch de Rega */}
            <button 
              onClick={() => onToggleIrrigation(field.id)} 
              className={`w-12 h-7 rounded-full transition-all duration-300 relative flex items-center ${field.irrigation ? 'bg-[#3E6837]' : 'bg-[#74796D] bg-opacity-20 border-2 border-[#74796D]'}`}
            >
              <span className={`absolute w-5 h-5 rounded-full transition-all duration-300 shadow-sm ${field.irrigation ? 'bg-white right-1' : 'bg-[#74796D] left-1 w-3 h-3'}`}>
                {field.irrigation && <Check size={12} className="text-[#3E6837] m-auto mt-1" />}
              </span>
            </button>
          </div>

          <div className="flex items-end justify-between mt-3">
            <div className="flex gap-2">
              <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-[#E0E4D6]">
                <Droplets size={14} className="text-[#0ea5e9]" />
                <span className="text-xs font-bold text-[#1A1C18]">{field.humidity.toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-[#E0E4D6]">
                <Thermometer size={14} className="text-[#f97316]" />
                <span className="text-xs font-bold text-[#1A1C18]">{field.temp.toFixed(0)}°</span>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="flex gap-1.5">
              <button 
                onClick={() => onPredictYield(field)} 
                className="bg-[#1A1C18] text-[#CBE6A2] p-2 rounded-xl shadow-md active:scale-90 transition-all border border-[#CBE6A2]/20"
                title="Previsão IA Premium"
              >
                <Brain size={18} />
              </button>
              <button 
                onClick={() => onDelete(field.id)} 
                className="bg-white p-2 rounded-xl border border-[#FFDAD6] text-[#BA1A1A] shadow-sm active:scale-90"
              >
                <Trash2 size={18} />
              </button>
              <button 
                onClick={() => onToggleHistory(field.id)} 
                className={`p-2 rounded-xl border transition-all shadow-sm active:scale-90 ${isExpanded ? 'bg-[#3E6837] text-white border-[#3E6837]' : 'bg-white text-[#3E6837] border-[#CBE6A2]'}`}
              >
                <BarChart3 size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Secção Expandida: Gráficos e Caderno de Campo */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-[#D8E6C6] animate-fade-in">
           <div className="flex mb-4 bg-[#E1E4D5] p-1 rounded-xl">
             <button 
               onClick={() => setViewMode('chart')} 
               className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'chart' ? 'bg-white text-[#3E6837] shadow-sm' : 'text-[#74796D]'}`}
             >
               Análise
             </button>
             <button 
               onClick={() => setViewMode('history')} 
               className={`flex-1 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'history' ? 'bg-white text-[#3E6837] shadow-sm' : 'text-[#74796D]'}`}
             >
               Caderno
             </button>
           </div>

           {viewMode === 'chart' ? (
              <div className="space-y-4">
                <div className="flex justify-center gap-6 text-[10px] font-black uppercase tracking-tighter text-[#74796D]">
                  <button 
                    onClick={() => setChartSource('humidity')} 
                    className={`flex items-center gap-1 pb-1 border-b-2 transition-all ${chartSource === 'humidity' ? 'text-blue-600 border-blue-600' : 'border-transparent'}`}
                  >
                    <Droplets size={12} /> Humidade Solo
                  </button>
                  <button 
                    onClick={() => setChartSource('ndvi')} 
                    className={`flex items-center gap-1 pb-1 border-b-2 transition-all ${chartSource === 'ndvi' ? 'text-[#3E6837] border-[#3E6837]' : 'border-transparent'}`}
                  >
                    <Satellite size={12} /> Vigor (NDVI)
                  </button>
                </div>
                
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorField" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={color} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D8E6C6" />
                      <XAxis dataKey={chartSource === 'ndvi' ? 'date' : 'time'} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#74796D'}} />
                      <YAxis hide domain={chartSource === 'ndvi' ? [0, 1] : [0, 100]} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} fillOpacity={1} fill="url(#colorField)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
           ) : (
              <div className="space-y-3">
                 <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {logs.length > 0 ? logs.map(log => (
                        <div key={log.id} className="bg-white p-3 rounded-xl border border-[#EFF2E6] text-xs shadow-sm">
                           <div className="flex justify-between items-center mb-1">
                              <span className="font-black text-[#1A1C18]">{log.date}</span>
                              <div className="flex items-center gap-2">
                                {log.location && (
                                  <a href={`https://www.google.com/maps?q=${log.location.lat},${log.location.lng}`} target="_blank" rel="noreferrer" className="text-[#3E6837]">
                                    <MapPin size={12} />
                                  </a>
                                )}
                                <span className="bg-[#EFF2E6] text-[#3E6837] px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter">
                                  {log.type}
                                </span>
                              </div>
                           </div>
                           <p className="text-[#43483E] leading-relaxed font-medium">{log.description}</p>
                        </div>
                    )) : (
                      <div className="text-center py-6 text-[#74796D] italic text-xs border-2 border-dashed border-[#D8E6C6] rounded-2xl">
                        Sem registos no caderno de campo.
                      </div>
                    )}
                 </div>

                 {/* Input de Novo Registo */}
                 <div className="flex gap-2 pt-3 border-t border-[#D8E6C6]">
                    <input 
                      type="text" 
                      placeholder="Adicionar nota ao campo..." 
                      className="flex-1 bg-white border-2 border-[#E0E4D6] rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-[#3E6837] transition-all"
                      value={newLogText}
                      onChange={(e) => setNewLogText(e.target.value)}
                      disabled={isLocating}
                    />
                    <button 
                      onClick={handleAddLog} 
                      className="bg-[#3E6837] text-white p-3 rounded-xl shadow-md active:scale-90 transition-all disabled:opacity-50"
                      disabled={isLocating}
                    >
                       {isLocating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                    </button>
                 </div>
              </div>
           )}
        </div>
      )}
      
      {/* Barra de Progresso de Rega */}
      {field.irrigation && (
        <div className="mt-4 w-full bg-white/50 h-1.5 rounded-full overflow-hidden border border-[#D8E6C6]">
          <div className="h-full bg-[#006E1C] w-full animate-progress-indeterminate opacity-60"></div>
        </div>
      )}
    </div>
  );
};

export default FieldCard;