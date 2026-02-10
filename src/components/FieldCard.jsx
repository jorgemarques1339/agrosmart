import React, { useState } from 'react';
import { 
  Check, Droplets, Thermometer, BarChart3, Calendar, 
  Trash2, FileText, Plus, MapPin, Download, Loader2, Satellite, Brain,
  Wifi, Zap
} from 'lucide-react';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, YAxis } from 'recharts';

// Estes dados serão substituídos pelos valores recebidos do ESP32 via MQTT no App.jsx
const HUMIDITY_HISTORY_DATA = [
  { time: '08:00', hum: 45 }, { time: '10:00', hum: 40 }, { time: '12:00', hum: 35 },
  { time: '14:00', hum: 30 }, { time: '16:00', hum: 42 }, { time: '18:00', hum: 55 }
];

const FieldCard = ({ 
  field, 
  onToggleIrrigation, // Agora envia o comando MQTT "ON/OFF" para o hardware
  isExpanded, 
  onToggleHistory, 
  onDelete, 
  logs = [], 
  onAddLog, 
  onPredictYield 
}) => {
  const [viewMode, setViewMode] = useState('chart');
  const [chartSource, setChartSource] = useState('humidity');
  const [newLogText, setNewLogText] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  // Simulação de estado de processamento do comando (feedback do hardware)
  const [isSyncing, setIsSyncing] = useState(false);

  const handleToggleCommand = async () => {
    setIsSyncing(true);
    // Chamada da função que comunica com o Broker MQTT
    await onToggleIrrigation(field.id);
    // Simula o tempo de resposta do hardware (confirmação do ESP32)
    setTimeout(() => setIsSyncing(false), 800);
  };

  const handleAddLog = () => {
    if (!newLogText.trim()) return;
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          onAddLog(field.id, newLogText, { lat: p.coords.latitude, lng: p.coords.longitude });
          setNewLogText(''); setIsLocating(false);
        },
        () => { onAddLog(field.id, newLogText, null); setNewLogText(''); setIsLocating(false); }
      );
    } else {
      onAddLog(field.id, newLogText, null); setNewLogText(''); setIsLocating(false);
    }
  };

  const chartData = chartSource === 'ndvi' ? (field.ndviHistory || []) : (field.humidityHistory || HUMIDITY_HISTORY_DATA);
  const dataKey = chartSource === 'ndvi' ? 'value' : 'hum';
  const color = chartSource === 'ndvi' ? '#3E6837' : '#0ea5e9';

  return (
    <div className="bg-white rounded-[24px] p-3 transition-all border border-[#E0E4D6] shadow-sm active:shadow-md">
      <div className="flex gap-3 items-center">
        
        {/* Ícone Reduzido com Indicador de Conetividade Hardware */}
        <div className="w-14 h-14 bg-[#FDFDF5] rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0 relative border border-[#EFF2E6]">
          {field.img}
          <div className="absolute -top-1 -left-1 bg-green-500 w-3 h-3 rounded-full border-2 border-white animate-pulse" title="Hardware Online"></div>
          {field.area && (
            <div className="absolute -bottom-1 -right-1 bg-[#3E6837] px-1.5 py-0.5 rounded-lg text-[8px] font-black text-white shadow-sm">
              {field.area}ha
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <div className="truncate pr-2">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-[#1A1C18] text-sm truncate leading-tight">{field.name}</h3>
                <Wifi size={10} className="text-[#3E6837] opacity-40" />
              </div>
              <p className={`text-[9px] font-black uppercase tracking-tighter ${field.health.includes('Atenção') ? 'text-[#BA1A1A]' : 'text-[#3E6837]'}`}>
                {field.health}
              </p>
            </div>
            
            {/* Switch de Comando MQTT (Eletroválvula) */}
            <button 
              onClick={handleToggleCommand}
              disabled={isSyncing}
              className={`w-10 h-6 rounded-full transition-all duration-300 relative flex items-center shrink-0 ${isSyncing ? 'opacity-50' : ''} ${field.irrigation ? 'bg-[#3E6837]' : 'bg-[#E0E4D6]'}`}
            >
              {isSyncing ? (
                <Loader2 size={10} className="animate-spin mx-auto text-white" />
              ) : (
                <span className={`absolute w-4 h-4 rounded-full transition-all duration-300 bg-white shadow-sm ${field.irrigation ? 'right-1' : 'left-1'}`} />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {/* Sensor de Humidade Real (via MQTT) */}
              <div className="flex items-center gap-1 bg-[#F0F9FF] px-1.5 py-0.5 rounded-md border border-[#BAE6FD]">
                <Droplets size={12} className="text-[#0ea5e9]" />
                <span className="text-[10px] font-bold text-[#0369a1]">{field.humidity.toFixed(0)}%</span>
                <Zap size={8} className="text-[#0ea5e9] animate-pulse" />
              </div>
              <div className="flex items-center gap-1 bg-[#FDFDF5] px-1.5 py-0.5 rounded-md border border-[#EFF2E6]">
                <Thermometer size={12} className="text-[#f97316]" />
                <span className="text-[10px] font-bold text-[#1A1C18]">{field.temp.toFixed(0)}°</span>
              </div>
            </div>

            {/* Ações Compactas */}
            <div className="flex gap-1">
              <button onClick={() => onPredictYield(field)} className="p-1.5 bg-[#EFF2E6] text-[#3E6837] rounded-lg active:scale-90" title="Análise IA"><Brain size={16} /></button>
              <button onClick={() => onToggleHistory(field.id)} className={`p-1.5 rounded-lg border active:scale-90 transition-all ${isExpanded ? 'bg-[#3E6837] text-white' : 'bg-white text-[#3E6837] border-[#E0E4D6]'}`}><BarChart3 size={16} /></button>
              <button onClick={() => onDelete(field.id)} className="p-1.5 bg-red-50 text-[#BA1A1A] rounded-lg active:scale-90"><Trash2 size={16} /></button>
            </div>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-[#EFF2E6] animate-fade-in">
           <div className="flex mb-3 bg-[#EFF2E6] p-0.5 rounded-lg">
             <button onClick={() => setViewMode('chart')} className={`flex-1 py-1 rounded-md text-[10px] font-black uppercase transition-all ${viewMode === 'chart' ? 'bg-white text-[#3E6837] shadow-sm' : 'text-[#74796D]'}`}>Gráfico Tempo Real</button>
             <button onClick={() => setViewMode('history')} className={`flex-1 py-1 rounded-md text-[10px] font-black uppercase transition-all ${viewMode === 'history' ? 'bg-white text-[#3E6837] shadow-sm' : 'text-[#74796D]'}`}>Caderno</button>
           </div>

           {viewMode === 'chart' ? (
              <div className="space-y-3">
                <div className="flex justify-center gap-4 text-[9px] font-black uppercase text-[#74796D]">
                  <button onClick={() => setChartSource('humidity')} className={`pb-0.5 border-b ${chartSource === 'humidity' ? 'text-blue-600 border-blue-600' : 'border-transparent'}`}>Sensores (ESP32)</button>
                  <button onClick={() => setChartSource('ndvi')} className={`pb-0.5 border-b ${chartSource === 'ndvi' ? 'text-[#3E6837] border-[#3E6837]' : 'border-transparent'}`}>Satélite</button>
                </div>
                <div className="h-28 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorF" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
                          <stop offset="95%" stopColor={color} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFF2E6" />
                      <XAxis dataKey={chartSource === 'ndvi' ? 'date' : 'time'} hide />
                      <YAxis hide domain={chartSource === 'ndvi' ? [0, 1] : [0, 100]} />
                      <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fillOpacity={1} fill="url(#colorF)" />
                      <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[8px] text-center text-[#74796D] uppercase font-bold tracking-widest">
                  {chartSource === 'humidity' ? 'Atualizado há poucos segundos via MQTT' : 'Dados Sentinel-2'}
                </p>
              </div>
           ) : (
              <div className="space-y-2">
                 <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                    {logs.map(log => (
                        <div key={log.id} className="bg-[#FDFDF5] p-2 rounded-lg border border-[#EFF2E6] text-[10px]">
                           <div className="flex justify-between font-black uppercase mb-0.5"><span>{log.date}</span><span className="text-[#3E6837]">{log.type}</span></div>
                           <p className="text-[#43483E] font-medium leading-tight">{log.description}</p>
                        </div>
                    ))}
                 </div>
                 <div className="flex gap-1.5 pt-2">
                    <input type="text" placeholder="Nota rápida..." className="flex-1 bg-white border border-[#E0E4D6] rounded-lg px-3 py-2 text-[11px] font-bold outline-none focus:border-[#3E6837]" value={newLogText} onChange={(e) => setNewLogText(e.target.value)} disabled={isLocating} />
                    <button onClick={handleAddLog} className="bg-[#3E6837] text-white p-2 rounded-lg active:scale-90">{isLocating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}</button>
                 </div>
              </div>
           )}
        </div>
      )}
      
      {/* Indicador de Válvula de Rega Ativa (Feedback Visual Profissional) */}
      {field.irrigation && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 bg-[#E0F2FE] h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-[#0ea5e9] w-full animate-progress-indeterminate"></div>
          </div>
          <span className="text-[8px] font-black text-[#0ea5e9] uppercase animate-pulse">Válvula Aberta</span>
        </div>
      )}
    </div>
  );
};

export default FieldCard;