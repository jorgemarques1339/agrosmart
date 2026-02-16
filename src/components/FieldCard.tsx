
import React, { useState, useMemo } from 'react';
import { 
  Droplets, Thermometer, Brain, Sprout, ChevronDown, 
  MapPin, Loader2, Activity, Wifi,
  Coins, TrendingUp, TrendingDown, Wallet, Cpu, Signal,
  ShieldAlert, FileText, List, Workflow,
  Radio, Package, Wheat, Leaf
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import { Field, FieldLog, StockItem, Sensor } from '../types';
import PestDetection from './PestDetection';
import AutomationHub from './AutomationHub';
import HarvestModal from './HarvestModal';

interface FieldCardProps {
  field: Field;
  stocks?: StockItem[]; 
  onToggleIrrigation: (id: string, status: boolean) => void;
  onAddLog: (fieldId: string, log: Omit<FieldLog, 'id'>) => void;
  onUseStock?: (fieldId: string, stockId: string, quantity: number, date: string) => void;
  onRegisterSensor?: (fieldId: string, sensor: Sensor) => void;
  onRegisterSale?: (saleData: { stockId: string, quantity: number, pricePerUnit: number, clientName: string, date: string, fieldId?: string }) => void;
  onHarvest?: (fieldId: string, data: { quantity: number; unit: string; batchId: string; date: string }) => void;
}

const FieldCard: React.FC<FieldCardProps> = ({ field, onToggleIrrigation, onHarvest }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'sensors' | 'journal' | 'finance' | 'ai'>('sensors');
  const [isLoadingIoT, setIsLoadingIoT] = useState(false);
  const [showAutomationHub, setShowAutomationHub] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);

  // Safety Interval Logic (IS)
  const safetyLock = useMemo(() => {
    // Find active treatments with safety interval
    const activeTreatment = field.logs
      .filter(l => l.type === 'treatment' && l.safetyDays && l.safetyDays > 0)
      .map(l => {
        const endDate = new Date(l.date);
        endDate.setDate(endDate.getDate() + (l.safetyDays || 0));
        const diffTime = endDate.getTime() - new Date().getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { diffDays, endDate };
      })
      .filter(item => item.diffDays > 0)
      .sort((a,b) => b.diffDays - a.diffDays)[0]; // Get the longest restriction

    return activeTreatment;
  }, [field.logs]);

  // Simular latência de hardware
  const handleIoTToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoadingIoT(true);
    setTimeout(() => {
      onToggleIrrigation(field.id, !field.irrigationStatus);
      setIsLoadingIoT(false);
    }, 1200);
  };

  // --- Financial Logic ---
  const financialData = useMemo(() => {
    // 1. Calcular Custos Reais (Baseado nos logs)
    const totalExpenses = field.logs?.reduce((acc, log) => acc + (log.cost || 0), 0) || 0;

    // 2. Calcular Receita Estimada (Mock Price per crop type)
    const getMarketPrice = (crop: string) => {
      if (crop.includes('Uva')) return 1200; // €/ton
      if (crop.includes('Milho')) return 280; // €/ton
      if (crop.includes('Trigo')) return 350; // €/ton
      if (crop.includes('Olival')) return 800; // €/ton
      return 400; // default
    };

    const marketPrice = getMarketPrice(field.crop);
    const estimatedProduction = field.areaHa * field.yieldPerHa; // Toneladas
    const estimatedRevenue = estimatedProduction * marketPrice;

    const netMargin = estimatedRevenue - totalExpenses;
    const roi = totalExpenses > 0 ? ((netMargin / totalExpenses) * 100).toFixed(1) : '∞';

    const chartData = [
      { name: 'Custos', value: totalExpenses, color: '#ef4444' }, // Red
      { name: 'Receita', value: estimatedRevenue, color: '#3E6837' } // Green
    ];

    return { totalExpenses, estimatedRevenue, netMargin, roi, chartData, marketPrice };
  }, [field]);

  return (
    <div 
      className={`bg-white dark:bg-neutral-900 rounded-[2rem] md:rounded-[2.5rem] lg:rounded-[3rem] shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden transition-all duration-500 ease-in-out relative hover:shadow-lg dark:hover:shadow-neutral-900/50 ${isExpanded ? 'ring-2 ring-agro-green/20' : ''}`}
    >
      {/* Safety Alert Strip (If active) */}
      {safetyLock && !isExpanded && (
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-red-500 z-20 animate-pulse"></div>
      )}

      {/* Header do Card (Sempre Visível) */}
      <div 
        className="p-3 pb-9 md:p-5 md:pb-12 lg:p-7 lg:pb-16 cursor-pointer relative group" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 md:gap-5 lg:gap-6">
          {/* Ícone da Cultura (Responsive Sizing: Mobile -> Tablet -> Desktop) */}
          <div className="relative w-10 h-10 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-2xl md:rounded-[2rem] bg-gray-50 dark:bg-neutral-800 shadow-inner flex items-center justify-center text-xl md:text-4xl lg:text-5xl shrink-0 transition-transform duration-300 group-hover:scale-105 border border-white dark:border-neutral-700">
            {field.emoji}
            {/* Status Indicator */}
            <div className={`absolute top-1 right-1 w-2 md:w-4 h-2 md:h-4 lg:w-5 lg:h-5 rounded-full border-2 md:border-4 border-white dark:border-neutral-800 ${field.healthScore > 80 ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
          </div>

          {/* Informação Principal */}
          <div className="flex-1 min-w-0">
            {/* Title Scales: Mobile(sm) -> Tablet(lg) -> Desktop(2xl) */}
            <h3 className="font-black text-sm md:text-lg lg:text-2xl text-gray-900 dark:text-white uppercase tracking-tight truncate leading-tight">
              {field.name}
            </h3>
            
            <div className="flex items-center gap-2 mt-0.5 md:mt-2 lg:mt-3 text-[10px] md:text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400">
               <span className="flex items-center gap-1 truncate"><Sprout size={12} className="md:w-4 md:h-4 lg:w-5 lg:h-5"/> {field.crop}</span>
               <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0"></span>
               <span className="whitespace-nowrap">{field.areaHa} ha</span>
            </div>
            
            {/* Sensor Pills Mini */}
            <div className="flex gap-2 mt-1.5 md:mt-3 lg:mt-4 relative z-10 overflow-x-auto scrollbar-hide mask-right-fade">
              {safetyLock ? (
                <span className="px-2 py-0.5 md:px-3 md:py-1.5 lg:px-4 lg:py-2 rounded-md md:rounded-lg lg:rounded-xl text-[10px] md:text-xs lg:text-sm font-bold flex items-center gap-1 bg-red-500 text-white animate-pulse shadow-sm whitespace-nowrap">
                   <ShieldAlert size={12} className="md:w-3 md:h-3 lg:w-4 lg:h-4" /> Interdito ({safetyLock.diffDays}d)
                </span>
              ) : (
                <>
                  <span className={`px-2 py-0.5 md:px-3 md:py-1.5 lg:px-4 lg:py-2 rounded-md md:rounded-lg lg:rounded-xl text-[10px] md:text-xs lg:text-sm font-bold flex items-center gap-1 whitespace-nowrap ${field.humidity < 40 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                    <Droplets size={12} className="md:w-3 md:h-3 lg:w-4 lg:h-4" /> {field.humidity}%
                  </span>
                  <span className="px-2 py-0.5 md:px-3 md:py-1.5 lg:px-4 lg:py-2 rounded-md md:rounded-lg lg:rounded-xl text-[10px] md:text-xs lg:text-sm font-bold flex items-center gap-1 whitespace-nowrap bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                    <Thermometer size={12} className="md:w-3 md:h-3 lg:w-4 lg:h-4" /> {field.temp}°C
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex gap-2 md:gap-3 lg:gap-4 shrink-0">
             
             {/* Harvest Button */}
             <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHarvestModal(true);
                }}
                className="w-9 h-9 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-xl md:rounded-2xl lg:rounded-3xl flex items-center justify-center transition-all duration-300 active:scale-95 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 shadow-sm hover:bg-yellow-200"
                title="Registar Colheita"
             >
                <Wheat size={18} className="md:w-7 md:h-7 lg:w-8 lg:h-8" />
             </button>

             {/* IoT Switch */}
             <button
                onClick={handleIoTToggle}
                className={`w-9 h-9 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-xl md:rounded-2xl lg:rounded-3xl flex items-center justify-center transition-all duration-300 active:scale-95 ${field.irrigationStatus ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-neutral-700'}`}
             >
                {isLoadingIoT ? (
                  <Loader2 size={18} className="animate-spin md:w-7 md:h-7 lg:w-8 lg:h-8" />
                ) : field.irrigationStatus ? (
                  <Wifi size={18} className="md:w-7 md:h-7 lg:w-8 lg:h-8" />
                ) : (
                  <Droplets size={18} className="opacity-50 md:w-7 md:h-7 lg:w-8 lg:h-8" />
                )}
             </button>
          </div>
        </div>

        {/* Expand Indicator */}
        <div className="absolute bottom-2 md:bottom-4 lg:bottom-5 w-full left-0 right-0 flex justify-center pointer-events-none">
          {isExpanded ? (
            <div className="bg-gray-100 dark:bg-neutral-800 rounded-full p-1 md:p-1.5 lg:p-2 animate-fade-in">
              <ChevronDown size={14} className="text-gray-400 rotate-180 transition-transform duration-300 md:w-5 md:h-5 lg:w-6 lg:h-6" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 animate-bounce bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm px-3 py-1 md:px-5 md:py-2 lg:px-6 lg:py-2.5 rounded-full shadow-sm border border-gray-100 dark:border-neutral-700">
               <span className="text-[9px] md:text-xs lg:text-sm font-bold uppercase tracking-widest text-agro-green dark:text-green-400">
                 Detalhes
               </span>
               <ChevronDown size={10} className="text-agro-green dark:text-green-400 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo Expandido */}
      {isExpanded && (
        <div className="px-4 pb-6 md:px-8 md:pb-8 lg:px-10 lg:pb-10 animate-fade-in border-t border-gray-100 dark:border-neutral-800 bg-gray-50/30 dark:bg-black/20">
          
          {/* Tabs Navegação (Large click targets) */}
          <div className="flex md:grid md:grid-cols-4 p-1 md:p-1.5 bg-gray-100 dark:bg-neutral-800 rounded-2xl my-4 md:my-6 lg:my-8 md:gap-2 overflow-x-auto scrollbar-hide lg:max-w-3xl lg:mx-auto">
             {(['sensors', 'journal', 'finance', 'ai'] as const).map(tab => (
               <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[70px] md:min-w-0 py-2 md:py-3 lg:py-4 rounded-xl text-[10px] md:text-xs lg:text-sm font-bold uppercase tracking-wide transition-all whitespace-nowrap ${
                  activeTab === tab 
                    ? 'bg-white dark:bg-neutral-700 shadow-sm text-agro-green dark:text-white' 
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700/50'
                }`}
              >
                {tab === 'ai' ? 'AI ✨' : tab === 'finance' ? 'Lucro' : tab === 'sensors' ? 'Sensores' : 'Diário'}
              </button>
             ))}
          </div>

          {/* TAB: SENSORES */}
          {activeTab === 'sensors' && (
            <div className="space-y-4 md:space-y-6 lg:space-y-8 animate-slide-up">
              {/* Mini Mapa - Larger on Desktop */}
              <div className="h-40 md:h-80 lg:h-96 w-full rounded-[1.5rem] md:rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden shadow-inner border border-gray-100 dark:border-neutral-800 relative z-0">
                {/* @ts-ignore */}
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
                <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-black/60 backdrop-blur-md px-2 py-1 md:px-4 md:py-2 rounded-lg md:rounded-xl lg:rounded-2xl text-[10px] md:text-xs lg:text-sm text-white font-mono flex items-center gap-1">
                  <MapPin size={10} className="md:w-3 md:h-3 lg:w-4 lg:h-4" /> GPS: {field.coordinates[0].toFixed(3)}, {field.coordinates[1].toFixed(3)}
                </div>
              </div>

              {/* Gráficos Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 lg:gap-8">
                 <div className="bg-white dark:bg-neutral-900 p-4 md:p-6 lg:p-8 rounded-3xl md:rounded-[2rem] shadow-sm border border-gray-100 dark:border-neutral-800">
                    <p className="text-xs md:text-sm lg:text-base font-bold text-gray-500 mb-2 md:mb-4 lg:mb-6 uppercase tracking-wider">Humidade do Solo (24h)</p>
                    <div className="h-20 md:h-40 lg:h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={field.history}>
                          <defs>
                            <linearGradient id="gradHum" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '14px' }} />
                          <Area type="monotone" dataKey="humidity" stroke="#3b82f6" fill="url(#gradHum)" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                 </div>

                 <div className="bg-white dark:bg-neutral-900 p-4 md:p-6 lg:p-8 rounded-3xl md:rounded-[2rem] shadow-sm border border-gray-100 dark:border-neutral-800">
                    <div className="flex justify-between mb-2 md:mb-4 lg:mb-6">
                       <p className="text-xs md:text-sm lg:text-base font-bold text-gray-500 uppercase tracking-wider">Índice NDVI</p>
                       <span className="text-xs md:text-sm lg:text-base font-mono text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">0.72 (Vigoroso)</span>
                    </div>
                    <div className="h-20 md:h-40 lg:h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={field.history}>
                          <defs>
                            <linearGradient id="gradNdvi" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="ndvi" stroke="#4ade80" fill="url(#gradNdvi)" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                 </div>
              </div>

              {/* --- IOT DEVICES LIST --- */}
              <div className="pt-4 md:pt-6 border-t border-gray-200 dark:border-neutral-800 border-dashed">
                 <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xs md:text-sm lg:text-base font-bold text-gray-900 dark:text-white uppercase flex items-center gap-2">
                       <Cpu size={16} className="md:w-5 md:h-5" /> Dispositivos Conectados
                    </h4>
                    <button
                      onClick={() => setShowAutomationHub(true)}
                      className="flex items-center gap-2 px-3 py-2 md:px-5 md:py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] md:text-xs lg:text-sm font-bold uppercase transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:shadow-md"
                    >
                      <Workflow size={14} className="md:w-4 md:h-4" /> Configurar Automações
                    </button>
                 </div>

                 {field.sensors && field.sensors.length > 0 ? (
                    <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 lg:gap-6">
                       {field.sensors.map(sensor => (
                          <div key={sensor.id} className="bg-white dark:bg-neutral-900 rounded-2xl lg:rounded-3xl p-3 md:p-4 lg:p-5 flex items-center gap-4 shadow-sm border border-gray-100 dark:border-neutral-800">
                             <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-gray-50 dark:bg-neutral-800 rounded-xl flex items-center justify-center text-gray-500 shadow-inner shrink-0">
                                {sensor.type === 'moisture' ? <Droplets size={20} className="md:w-6 md:h-6" /> : <Activity size={20} className="md:w-6 md:h-6" />}
                             </div>
                             <div className="flex-1">
                                <p className="font-bold text-sm md:text-base lg:text-lg dark:text-white">{sensor.name}</p>
                                <p className="text-[10px] md:text-xs text-gray-500 font-mono">ID: {sensor.id}</p>
                             </div>
                             <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1 text-[10px] md:text-xs lg:text-sm font-bold text-green-600">
                                   <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 bg-green-500 rounded-full animate-pulse"></div> Online
                                </div>
                                <div className="flex items-center gap-1 text-gray-400">
                                   <Signal size={12} className="md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" /> <span className="text-[10px] md:text-xs lg:text-sm">{sensor.signalStrength}%</span>
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div className="text-center py-8 lg:py-12 bg-gray-50 dark:bg-neutral-900 rounded-3xl border border-dashed border-gray-200 dark:border-neutral-800">
                       <Radio size={24} className="mx-auto text-gray-300 mb-2 md:w-8 md:h-8 lg:w-10 lg:h-10" />
                       <p className="text-xs md:text-sm lg:text-base text-gray-400">Nenhum sensor vinculado a este campo.</p>
                    </div>
                 )}
              </div>
            </div>
          )}

          {/* TAB: DIÁRIO (REGISTOS) */}
          {activeTab === 'journal' && (
            <div className="space-y-4 md:space-y-6 lg:space-y-8 animate-slide-up">
              
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                    <FileText size={18} className="text-agro-green md:w-6 md:h-6" />
                    <h4 className="text-xs md:text-sm lg:text-base font-bold uppercase text-gray-500">Histórico de Operações</h4>
                 </div>
                 <div className="text-[10px] md:text-xs lg:text-sm text-gray-400 bg-white dark:bg-neutral-900 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold shadow-sm border border-gray-100 dark:border-neutral-800">
                    Use o menu principal para adicionar
                 </div>
              </div>

              {/* Lista de Logs - 2 Cols Tablet, 3 Cols Desktop */}
              <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 lg:gap-6 pl-4 border-l-2 border-gray-200 dark:border-neutral-800 md:border-l-0 md:pl-0 mt-4 min-h-[150px]">
                {field.logs && field.logs.length > 0 ? (
                  field.logs.slice().reverse().map(log => (
                    <div key={log.id} className="relative group md:bg-white md:dark:bg-neutral-900 md:p-5 lg:p-6 md:rounded-2xl lg:rounded-3xl md:shadow-sm md:border md:border-gray-100 md:dark:border-neutral-800 hover:shadow-md transition-shadow">
                      {/* Timeline Dot (Mobile only) */}
                      <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-900 md:hidden ${
                        log.type === 'treatment' ? 'bg-orange-400' : 
                        log.type === 'fertilization' ? 'bg-green-500' :
                        log.type === 'harvest' ? 'bg-yellow-500' :
                        'bg-blue-400'
                      }`}></div>
                      
                      <div className="flex justify-between items-start">
                         <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                               <p className="text-xs md:text-sm lg:text-base text-gray-400 font-mono">{log.date}</p>
                               {/* Desktop Type Badge */}
                               <span className={`hidden md:inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                  log.type === 'treatment' ? 'bg-orange-100 text-orange-600' : 
                                  log.type === 'fertilization' ? 'bg-green-100 text-green-600' :
                                  'bg-blue-100 text-blue-600'
                               }`}>
                                  {log.type}
                               </span>
                            </div>
                            
                            <p className="text-sm md:text-base lg:text-lg font-bold text-gray-800 dark:text-gray-200 leading-snug">{log.productName || log.description}</p>
                            
                            <div className="flex flex-wrap gap-2 mt-2 md:mt-3">
                              {log.cost !== undefined && log.cost > 0 && (
                                 <span className="inline-flex items-center gap-1 text-[9px] md:text-xs font-bold bg-gray-100 dark:bg-neutral-800 text-gray-500 px-2 py-1 rounded">
                                    {log.cost.toFixed(2)}€
                                 </span>
                              )}
                              {log.quantity !== undefined && log.unit && (
                                 <span className="inline-flex items-center gap-1 text-[9px] md:text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded">
                                    <Package size={10} className="md:w-3 md:h-3" /> {log.quantity} {log.unit}
                                 </span>
                              )}
                              {log.type === 'treatment' && log.safetyDays && (
                                 <span className="inline-flex items-center gap-1 text-[9px] md:text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-600 px-2 py-1 rounded flex items-center gap-1">
                                    <ShieldAlert size={10} className="md:w-3 md:h-3" /> IS: {log.safetyDays}d
                                 </span>
                              )}
                            </div>
                         </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 opacity-50 md:col-span-2 lg:col-span-3">
                     <List size={32} className="text-gray-300 mb-2 md:w-10 md:h-10" />
                     <p className="text-gray-400 text-sm md:text-base italic">Sem registos recentes no caderno de campo.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: FINANCEIRO */}
          {activeTab === 'finance' && (
             <div className="space-y-6 md:grid md:grid-cols-2 lg:grid-cols-2 md:gap-6 lg:gap-8 md:space-y-0 animate-slide-up">
               
               {/* Card de Rentabilidade */}
               <div className={`rounded-[2rem] lg:rounded-[3rem] p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[240px] lg:min-h-[300px] ${
                 financialData.netMargin >= 0 
                   ? 'bg-gradient-to-br from-[#3E6837] to-[#2A4825] shadow-green-900/20' 
                   : 'bg-gradient-to-br from-red-600 to-red-800 shadow-red-900/20'
               }`}>
                  <div className="relative z-10">
                        <div className="flex items-center gap-2 text-white/80 mb-3">
                           <Coins size={20} className="md:w-6 md:h-6" />
                           <p className="text-xs md:text-sm font-bold uppercase tracking-wider">Lucro Estimado</p>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter">
                                {financialData.netMargin.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}
                            </h2>
                        </div>
                        <div className="mt-6 inline-flex items-center gap-2 text-xs md:text-sm font-bold bg-white/20 px-3 py-1.5 md:px-4 md:py-2 rounded-xl backdrop-blur-md border border-white/10">
                           {financialData.netMargin >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                           ROI: {financialData.roi}%
                        </div>
                  </div>
                  
                  <div className="relative z-10 mt-6 md:mt-0">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl p-4 border border-white/10 w-full">
                      <div className="flex justify-between items-center text-sm md:text-base lg:text-lg">
                        <span className="opacity-80 font-medium">Preço de Mercado / Ton</span>
                        <span className="font-black text-xl">{financialData.marketPrice}€</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Decorator */}
                  <Wallet className="absolute -right-8 -bottom-8 w-40 h-40 opacity-10 rotate-12 md:w-56 md:h-56 lg:w-72 lg:h-72" />
               </div>

               {/* Gráfico de Barras: Custos vs Receita */}
               <div className="bg-white dark:bg-neutral-900 p-6 md:p-8 rounded-[2rem] lg:rounded-[3rem] border border-gray-100 dark:border-neutral-800 flex flex-col justify-center shadow-sm">
                  <h4 className="text-xs md:text-sm lg:text-base font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wide">Análise Financeira</h4>
                  <div className="h-40 md:h-56 lg:h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={financialData.chartData} barSize={32}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={60} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af', fontWeight: 700}} />
                        <Tooltip 
                          cursor={{fill: 'transparent'}}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', fontSize: '14px' }}
                        />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                          {financialData.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </div>
             </div>
          )}

          {/* TAB: AI */}
          {activeTab === 'ai' && (
             <div className="space-y-6 md:grid md:grid-cols-2 md:gap-6 lg:gap-8 md:space-y-0 animate-slide-up">
               {/* Yield Prediction Card */}
               <div className="bg-gradient-to-br from-purple-600 to-indigo-800 rounded-[2rem] lg:rounded-[3rem] p-6 md:p-8 text-white shadow-xl shadow-purple-900/20 relative overflow-hidden flex flex-col justify-between h-full min-h-[250px] lg:min-h-[350px]">
                  <Brain className="absolute -top-4 -right-4 w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 opacity-10 text-white" />
                  
                  <div className="relative z-10">
                        <p className="text-purple-200 text-xs md:text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                           <Activity size={16} /> Previsão de Rendimento
                        </p>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-5xl md:text-6xl lg:text-8xl font-black tracking-tighter">{(field.areaHa * field.yieldPerHa).toFixed(1)}</h2>
                            <span className="text-lg md:text-2xl lg:text-3xl opacity-70 font-bold">Ton</span>
                        </div>
                        <p className="text-purple-200/80 text-xs md:text-sm mt-2 max-w-xs leading-relaxed">
                           Estimativa baseada em dados históricos, satélite e sensores de solo.
                        </p>
                  </div>
                    
                  <div className="relative z-10 mt-6 md:mt-0">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl p-4 border border-white/10 w-full">
                      <div className="flex justify-between items-center text-sm md:text-base lg:text-lg">
                        <span className="opacity-80 font-medium">Janela Ideal de Colheita</span>
                        <span className="font-bold border-b-2 border-white/30 pb-0.5">{field.harvestWindow}</span>
                      </div>
                    </div>
                  </div>
               </div>

               {/* Pest Detection Component - now inside grid cell */}
               <div className="h-full">
                 <PestDetection />
               </div>
             </div>
          )}

        </div>
      )}

      {/* --- AUTOMATION HUB MODAL --- */}
      {showAutomationHub && (
        <AutomationHub 
          fields={[field]} 
          onToggleIrrigation={onToggleIrrigation}
          onClose={() => setShowAutomationHub(false)}
        />
      )}

      {/* --- HARVEST MODAL --- */}
      {showHarvestModal && onHarvest && (
        <HarvestModal 
          isOpen={showHarvestModal}
          onClose={() => setShowHarvestModal(false)}
          field={field}
          onConfirm={(data) => onHarvest(field.id, data)}
        />
      )}
    </div>
  );
};

export default FieldCard;