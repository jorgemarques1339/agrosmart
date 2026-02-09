import React, { useState } from 'react';
import { Check, Droplets, Thermometer, BarChart3, Calendar, Trash2, FileText, Plus } from 'lucide-react';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const HUMIDITY_HISTORY_DATA = [
  { time: '08:00', hum: 45 }, { time: '10:00', hum: 40 }, { time: '12:00', hum: 35 },
  { time: '14:00', hum: 30 }, { time: '16:00', hum: 42 }, { time: '18:00', hum: 55 },
];

const FieldCard = ({ field, onToggleIrrigation, isExpanded, onToggleHistory, isOnline, onDelete, logs = [], onAddLog }) => {
  const [viewMode, setViewMode] = useState('chart'); // 'chart' ou 'history'
  const [newLogText, setNewLogText] = useState('');

  const handleAddLog = () => {
    if (newLogText.trim()) {
        onAddLog(field.id, newLogText);
        setNewLogText('');
    }
  };

  return (
    <div className="bg-[#EFF2E6] rounded-[20px] p-4 transition-all overflow-hidden">
      <div className="flex gap-4">
        <div className="w-24 h-24 bg-[#E1E4D5] rounded-2xl flex items-center justify-center text-4xl shadow-inner shrink-0">{field.img}</div>
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
            <div className="flex gap-2">
                <button 
                  onClick={() => onDelete(field.id)} 
                  className="bg-white p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                  title="Eliminar Campo"
                >
                  <Trash2 size={16} />
                </button>
                <button onClick={() => onToggleHistory(field.id)} className={`bg-white p-1.5 rounded-lg border transition-colors ${isExpanded ? 'border-[#3E6837] text-[#3E6837] bg-[#E1E4D5]' : 'border-[#CBE6A2] text-[#3E6837] hover:bg-[#CBE6A2]'}`}>
                  {isExpanded ? <FileText size={16} /> : <BarChart3 size={16} />}
                </button>
            </div>
          </div>
        </div>
      </div>

      {field.cropCycle && (
        <div className="mt-3 pt-3 border-t border-[#D8E6C6] flex justify-between text-[10px] text-[#43483E]">
          <div className="flex items-center gap-1">
            <Calendar size={12} className="text-[#3E6837]" />
            <div>
              <span className="block font-bold">Plantar</span>
              {field.cropCycle.plant}
            </div>
          </div>
          <div className="text-right">
            <span className="block font-bold">Colher</span>
            {field.cropCycle.harvest}
          </div>
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
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={HUMIDITY_HISTORY_DATA}>
                    <defs><linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#006E1C" stopOpacity={0.3}/><stop offset="95%" stopColor="#006E1C" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E4D6" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#74796D'}} />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="hum" stroke="#006E1C" fillOpacity={1} fill="url(#colorHum)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           ) : (
              <div className="space-y-2">
                 <div className="max-h-32 overflow-y-auto space-y-2 pr-1">
                    {logs.length > 0 ? logs.map(log => (
                        <div key={log.id} className="bg-white p-2 rounded-lg border border-[#EFF2E6] text-xs">
                           <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-[#1A1C18]">{log.date}</span>
                              <span className="bg-[#E1E4D5] text-[#3E6837] px-1.5 py-0.5 rounded text-[10px] uppercase">{log.type}</span>
                           </div>
                           <p className="text-[#43483E]">{log.description}</p>
                        </div>
                    )) : <p className="text-center text-xs text-[#74796D] py-2">Sem registos.</p>}
                 </div>
                 <div className="flex gap-2 pt-2 border-t border-[#D8E6C6]">
                    <input 
                      type="text" 
                      placeholder="Novo registo..." 
                      className="flex-1 bg-[#FDFDF5] border border-[#E0E4D6] rounded-lg px-2 py-1.5 text-xs outline-none focus:border-[#3E6837]"
                      value={newLogText}
                      onChange={(e) => setNewLogText(e.target.value)}
                    />
                    <button onClick={handleAddLog} className="bg-[#3E6837] text-white p-1.5 rounded-lg">
                       <Plus size={14} />
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