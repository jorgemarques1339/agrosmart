import React, { useState } from 'react';
import { 
  Check, Droplets, Thermometer, BarChart3, Calendar, 
  Trash2, FileText, Plus, MapPin, Download, Loader2, Satellite, Brain 
} from 'lucide-react';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, YAxis } from 'recharts';

// IMPORTAR DADOS CENTRALIZADOS
// Certifica-te que o caminho '../data/mockData' está correto em relação à pasta 'components'
import { HUMIDITY_HISTORY_DATA } from '../data/mockData';

const FieldCard = ({ field, onToggleIrrigation, isExpanded, onToggleHistory, isOnline, onDelete, logs = [], onAddLog }) => {
  const [viewMode, setViewMode] = useState('chart'); // 'chart' ou 'history'
  const [chartSource, setChartSource] = useState('humidity'); // 'humidity' ou 'ndvi'
  const [newLogText, setNewLogText] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  // Função de previsão IA (Simulada)
  const handlePredictYield = () => {
    if (!field.area || !field.cropCycle) {
      alert("Faltam dados de área ou cultura para previsão.");
      return;
    }
    const yieldPerHa = field.cropCycle.yieldPerHa || 10;
    // Fatores simples: Excelente=1.2, Bom=1.0, Outros=0.7
    const healthFactor = field.health === 'Excelente' ? 1.2 : field.health === 'Bom' ? 1.0 : 0.7;
    const predicted = (field.area * yieldPerHa * healthFactor).toFixed(1);
    
    alert(`🤖 Previsão IA para ${field.name}:\n\n` +
          `📏 Área: ${field.area} ha\n` +
          `🌱 Cultura: ${field.cropCycle.label}\n` +
          `--------------------------\n` +
          `⚖️ Colheita Estimada: ${predicted} toneladas\n` +
          `📅 Data Prevista: ${field.cropCycle.harvest}`);
  };

  const handleAddLog = () => {
    if (!newLogText.trim()) return;

    setIsLocating(true);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { 
            lat: position.coords.latitude, 
            lng: position.coords.longitude 
          };
          onAddLog(field.id, newLogText, loc);
          setNewLogText('');
          setIsLocating(false);
        },
        (error) => {
          console.warn("Erro GPS:", error);
          // Se falhar, guarda sem localização
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

  const handleExportNotebook = () => {
    if (logs.length === 0) {
      alert("Não há registos para exportar neste campo.");
      return;
    }
    const headers = ["Data", "Campo", "Descricao", "Tipo", "Latitude", "Longitude"];
    const rows = logs.map(log => [
      log.date, field.name, `"${log.description}"`, log.type,
      log.location ? log.location.lat : "N/A", log.location ? log.location.lng : "N/A"
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Caderno_${field.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Preparar dados do gráfico consoante a seleção
  // field.ndviHistory vem via props do App.jsx (que carrega do mockData ou localStorage)
  // HUMIDITY_HISTORY_DATA vem importado diretamente do mockData
  const chartData = chartSource === 'ndvi' ? (field.ndviHistory || []) : HUMIDITY_HISTORY_DATA;
  const dataKey = chartSource === 'ndvi' ? 'value' : 'hum';
  const color = chartSource === 'ndvi' ? '#3E6837' : '#0ea5e9'; // Verde para NDVI, Azul para Humidade
  const xKey = chartSource === 'ndvi' ? 'date' : 'time';

  return (
    <div className="bg-[#EFF2E6] rounded-[20px] p-4 transition-all overflow-hidden border border-[#E0E4D6]">
      <div className="flex gap-4">
        <div className="w-24 h-24 bg-[#E1E4D5] rounded-2xl flex items-center justify-center text-4xl shadow-inner shrink-0 relative">
          {field.img}
          {field.area && (
             <div className="absolute -bottom-2 bg-white px-2 py-0.5 rounded-full text-[9px] font-bold text-[#3E6837] shadow-sm border border-[#E0E4D6]">
               {field.area}ha
             </div>
          )}
          {/* Indicador de satélite se existirem dados NDVI */}
          {field.ndviHistory && (
             <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 border border-[#E0E4D6] shadow-sm">
               <Satellite size={12} className="text-[#3E6837]" />
             </div>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-between py-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-[#1A1C18] text-base leading-tight">{field.name}</h3>
              <span className={`text-xs mt-1 inline-block ${field.health.includes('Atenção') ? 'text-[#BA1A1A] font-bold' : 'text-[#3E6837]'}`}>{field.health}</span>
            </div>
            <button onClick={() => onToggleIrrigation(field.id)} className={`w-12 h-7 rounded-full transition-colors duration-300 relative flex items-center ${field.irrigation ? 'bg-[#3E6837]' : 'bg-[#74796D] border-2 border-[#74796D] bg-opacity-0'}`}>
              <span className={`absolute w-4 h-4 rounded-full transition-all duration-300 ${field.irrigation ? 'bg-white right-1.5 w-5 h-5' : 'bg-[#74796D] left-1.5 w-3 h-3'}`}>
                {field.irrigation && <Check size={12} className="text-[#3E6837] m-auto mt-0.5" />}
              </span>
            </button>
          </div>
          <div className="flex items-end justify-between mt-2">
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 bg-[#FDFDF5] px-2 py-1 rounded-lg"><Droplets size={14} className="text-[#006E1C]" /><span className="text-sm font-medium text-[#1A1C18]">{field.humidity.toFixed(0)}%</span></div>
              <div className="flex items-center gap-1.5 bg-[#FDFDF5] px-2 py-1 rounded-lg"><Thermometer size={14} className="text-[#A43C00]" /><span className="text-sm font-medium text-[#1A1C18]">{field.temp.toFixed(0)}°</span></div>
            </div>
            <div className="flex gap-1">
                {/* Botão IA Previsão */}
                <button onClick={handlePredictYield} className="bg-[#3E6837] text-white p-1.5 rounded-lg shadow-sm active:scale-95 transition-transform" title="Previsão IA"><Brain size={16} /></button>
                <button onClick={() => onDelete(field.id)} className="bg-white p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={16} /></button>
                <button onClick={() => onToggleHistory(field.id)} className={`bg-white p-1.5 rounded-lg border transition-colors ${isExpanded ? 'border-[#3E6837] text-[#3E6837] bg-[#E1E4D5]' : 'border-[#CBE6A2] text-[#3E6837] hover:bg-[#CBE6A2]'}`}>
                  {isExpanded ? <FileText size={16} /> : <BarChart3 size={16} />}
                </button>
            </div>
          </div>
        </div>
      </div>

      {field.cropCycle && (
        <div className="mt-3 pt-3 border-t border-[#D8E6C6] flex justify-between text-[10px] text-[#43483E]">
          <div className="flex items-center gap-1"><Calendar size={12} className="text-[#3E6837]" /><div><span className="block font-bold">Plantar</span>{field.cropCycle.plant}</div></div>
          <div className="text-right"><span className="block font-bold">Colher</span>{field.cropCycle.harvest}</div>
        </div>
      )}

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-[#E0E4D6] animate-fade-in">
           {/* Toggle Tabs */}
           <div className="flex mb-3 bg-[#E1E4D5] p-1 rounded-xl">
             <button onClick={() => setViewMode('chart')} className={`flex-1 py-1 rounded-lg text-xs font-medium transition-all ${viewMode === 'chart' ? 'bg-white text-[#3E6837] shadow-sm' : 'text-[#74796D]'}`}>Gráfico</button>
             <button onClick={() => setViewMode('history')} className={`flex-1 py-1 rounded-lg text-xs font-medium transition-all ${viewMode === 'history' ? 'bg-white text-[#3E6837] shadow-sm' : 'text-[#74796D]'}`}>Caderno Campo</button>
           </div>

           {viewMode === 'chart' ? (
              <div className="space-y-2">
                <div className="flex justify-center gap-4 text-[10px] uppercase font-bold text-[#74796D] mb-1">
                  <button onClick={() => setChartSource('humidity')} className={`flex items-center gap-1 pb-1 border-b-2 transition-all ${chartSource === 'humidity' ? 'text-blue-600 border-blue-600' : 'border-transparent hover:text-blue-500'}`}><Droplets size={12} /> Sensores</button>
                  <button onClick={() => setChartSource('ndvi')} className={`flex items-center gap-1 pb-1 border-b-2 transition-all ${chartSource === 'ndvi' ? 'text-[#3E6837] border-[#3E6837]' : 'border-transparent hover:text-[#3E6837]'}`}><Satellite size={12} /> Satélite (NDVI)</button>
                </div>
                <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorChart" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={color} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E4D6" />
                      <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#74796D'}} />
                      <YAxis hide domain={chartSource === 'ndvi' ? [0, 1] : [0, 100]} />
                      <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                      <Area type="monotone" dataKey={dataKey} stroke={color} fillOpacity={1} fill="url(#colorChart)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
           ) : (
              <div className="space-y-3">
                 <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold text-[#43483E] uppercase tracking-wider">Registos ({logs.length})</span>
                    <button onClick={handleExportNotebook} className="flex items-center gap-1 text-[10px] font-bold text-[#3E6837] bg-white px-2 py-1 rounded-lg border border-[#E0E4D6] shadow-sm hover:bg-[#FDFDF5]"><Download size={12} /> Exportar CSV</button>
                 </div>
                 <div className="max-h-32 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {logs.length > 0 ? logs.map(log => (
                        <div key={log.id} className="bg-white p-2 rounded-lg border border-[#EFF2E6] text-xs shadow-sm">
                           <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-[#1A1C18]">{log.date}</span>
                              <div className="flex items-center gap-1">
                                {log.location && <a href={`https://www.google.com/maps/search/?api=1&query=${log.location.lat},${log.location.lng}`} target="_blank" rel="noopener noreferrer" className="text-[#3E6837]" title="Ver no Mapa"><MapPin size={12} /></a>}
                                <span className="bg-[#E1E4D5] text-[#3E6837] px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">{log.type}</span>
                              </div>
                           </div>
                           <p className="text-[#43483E]">{log.description}</p>
                        </div>
                    )) : <p className="text-center text-xs text-[#74796D] py-4 bg-white/50 rounded-lg border border-dashed border-[#E0E4D6]">Sem registos.</p>}
                 </div>
                 <div className="flex gap-2 pt-2 border-t border-[#D8E6C6]">
                    <input type="text" placeholder="Novo registo..." className="flex-1 bg-[#FDFDF5] border border-[#E0E4D6] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#3E6837] transition-all" value={newLogText} onChange={(e) => setNewLogText(e.target.value)} disabled={isLocating} />
                    <button onClick={handleAddLog} className="bg-[#3E6837] text-white p-2 rounded-lg disabled:opacity-50 shadow-sm active:scale-95 transition-transform" disabled={isLocating}>
                       {isLocating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    </button>
                 </div>
              </div>
           )}
        </div>
      )}
      {field.irrigation && <div className="mt-3 w-full bg-[#E1E4D5] h-1 rounded-full overflow-hidden"><div className="h-full bg-[#006E1C] w-full animate-progress-indeterminate"></div></div>}
    </div>
  );
};

export default FieldCard;