import React, { useState } from 'react';
import { 
  Droplets, Thermometer, Brain, Sprout, ChevronDown, 
  MapPin, Loader2, Activity, Wifi, Plus, Trash2, Calendar
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import { Field, FieldLog } from '../types';
import PestDetection from './PestDetection';

interface FieldCardProps {
  field: Field;
  onToggleIrrigation: (id: string, status: boolean) => void;
  onAddLog: (fieldId: string, log: Omit<FieldLog, 'id'>) => void;
}

const FieldCard: React.FC<FieldCardProps> = ({ field, onToggleIrrigation, onAddLog }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'sensors' | 'journal' | 'ai'>('sensors');
  const [isLoadingIoT, setIsLoadingIoT] = useState(false);
  const [newLogText, setNewLogText] = useState('');

  // Simular latência de hardware
  const handleIoTToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoadingIoT(true);
    setTimeout(() => {
      onToggleIrrigation(field.id, !field.irrigationStatus);
      setIsLoadingIoT(false);
    }, 1200);
  };

  const handleAddLogSubmit = () => {
    if (!newLogText.trim()) return;
    onAddLog(field.id, {
      date: new Date().toISOString().split('T')[0],
      type: 'observation',
      description: newLogText
    });
    setNewLogText('');
  };

  return (
    <div 
      className={`bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'ring-2 ring-agro-green/20' : ''}`}
    >
      {/* Header do Card (Sempre Visível) */}
      <div 
        className="p-5 cursor-pointer relative"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          {/* Ícone da Cultura */}
          <div className="relative w-16 h-16 rounded-3xl bg-gray-50 dark:bg-neutral-800 shadow-inner flex items-center justify-center text-3xl shrink-0">
            {field.emoji}
            {/* Status Indicator */}
            <div className={`absolute top-1 right-1 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-800 ${field.healthScore > 80 ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
          </div>

          {/* Informação Principal */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white uppercase tracking-tight truncate">
              {field.name}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
               <span className="flex items-center gap-1"><Sprout size={12}/> {field.crop}</span>
               <span className="w-1 h-1 rounded-full bg-gray-300"></span>
               <span>{field.areaHa} ha</span>
            </div>
            
            {/* Sensor Pills Mini */}
            <div className="flex gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${field.humidity < 40 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                <Droplets size={10} /> {field.humidity}%
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                <Thermometer size={10} /> {field.temp}°C
              </span>
            </div>
          </div>

          {/* IoT Switch */}
          <button
            onClick={handleIoTToggle}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-95 shrink-0 ${field.irrigationStatus ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-gray-500'}`}
          >
            {isLoadingIoT ? (
              <Loader2 size={24} className="animate-spin" />
            ) : field.irrigationStatus ? (
              <Wifi size={24} />
            ) : (
              <Droplets size={24} className="opacity-50" />
            )}
          </button>
        </div>

        {/* Expand Indicator */}
        <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronDown size={16} className="text-gray-300 dark:text-neutral-700" />
        </div>
      </div>

      {/* Conteúdo Expandido */}
      {isExpanded && (
        <div className="px-5 pb-8 animate-fade-in border-t border-gray-100 dark:border-neutral-800">
          
          {/* Tabs Navegação */}
          <div className="flex p-1 bg-gray-100 dark:bg-neutral-800 rounded-2xl my-6">
             {(['sensors', 'journal', 'ai'] as const).map(tab => (
               <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
                  activeTab === tab 
                    ? 'bg-white dark:bg-neutral-700 shadow-sm text-agro-green dark:text-white' 
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {tab === 'ai' ? 'AI ✨' : tab === 'sensors' ? 'Sensores' : 'Diário'}
              </button>
             ))}
          </div>

          {/* TAB: SENSORES */}
          {activeTab === 'sensors' && (
            <div className="space-y-6 animate-slide-up">
              {/* Mini Mapa - Optimized Height for Tablet */}
              <div className="h-48 md:h-64 w-full rounded-[2rem] overflow-hidden shadow-inner border border-gray-100 dark:border-neutral-800 relative z-0">
                <MapContainer 
                  center={field.coordinates} 
                  zoom={14} 
                  scrollWheelZoom={false} 
                  dragging={false}
                  zoomControl={false}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                  <Polygon positions={field.polygon} pathOptions={{ color: '#4ade80', fillColor: '#4ade80', fillOpacity: 0.3, weight: 2 }} />
                </MapContainer>
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] text-white font-mono flex items-center gap-1">
                  <MapPin size={10} /> GPS: {field.coordinates[0].toFixed(3)}, {field.coordinates[1].toFixed(3)}
                </div>
              </div>

              {/* Gráficos - Grid for Tablet */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-3xl">
                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Humidade do Solo (24h)</p>
                    <div className="h-24 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={field.history}>
                          <defs>
                            <linearGradient id="gradHum" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} />
                          <Area type="monotone" dataKey="humidity" stroke="#3b82f6" fill="url(#gradHum)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                 </div>

                 <div className="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-3xl">
                    <div className="flex justify-between mb-2">
                       <p className="text-xs font-bold text-gray-500 uppercase">Índice NDVI</p>
                       <span className="text-xs font-mono text-green-600 dark:text-green-400">0.72 (Vigoroso)</span>
                    </div>
                    <div className="h-24 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={field.history}>
                          <defs>
                            <linearGradient id="gradNdvi" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="ndvi" stroke="#4ade80" fill="url(#gradNdvi)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* TAB: DIÁRIO */}
          {activeTab === 'journal' && (
            <div className="space-y-4 animate-slide-up">
              {/* Input Rápido */}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newLogText}
                  onChange={(e) => setNewLogText(e.target.value)}
                  placeholder="Nova observação..."
                  className="flex-1 bg-gray-100 dark:bg-neutral-800 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-agro-green dark:text-white"
                />
                <button 
                  onClick={handleAddLogSubmit}
                  className="bg-agro-green text-white p-3 rounded-2xl active:scale-90 transition-transform"
                >
                  <Plus size={20} />
                </button>
              </div>

              {/* Lista de Logs */}
              <div className="space-y-3 pl-4 border-l-2 border-gray-100 dark:border-neutral-800">
                {field.logs && field.logs.length > 0 ? (
                  field.logs.slice().reverse().map(log => (
                    <div key={log.id} className="relative">
                      <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-900 ${
                        log.type === 'treatment' ? 'bg-orange-400' : 'bg-green-400'
                      }`}></div>
                      <p className="text-xs text-gray-400 font-mono mb-0.5">{log.date}</p>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{log.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm italic py-4">Sem registos recentes.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB: AI */}
          {activeTab === 'ai' && (
             <div className="space-y-6 animate-slide-up">
               {/* Yield Prediction Card - Responsive Layout */}
               <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[2.2rem] p-6 text-white shadow-xl shadow-purple-900/20 relative overflow-hidden">
                  <Brain className="absolute -top-4 -right-4 w-32 h-32 opacity-10 text-white" />
                  
                  <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <p className="text-purple-200 text-xs font-bold uppercase tracking-wider mb-2">Previsão de Colheita</p>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-4xl font-black">{(field.areaHa * field.yieldPerHa).toFixed(1)}</h2>
                            <span className="text-lg opacity-80">Ton</span>
                        </div>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 w-full md:w-auto">
                      <div className="flex justify-between md:gap-6 items-center text-sm">
                        <span className="opacity-80">Janela Ideal:</span>
                        <span className="font-bold">{field.harvestWindow}</span>
                      </div>
                    </div>
                  </div>
               </div>

               {/* Pest Detection Component */}
               <PestDetection />
             </div>
          )}

        </div>
      )}
    </div>
  );
};

export default FieldCard;