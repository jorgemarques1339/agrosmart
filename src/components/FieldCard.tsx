import React, { useState, useMemo } from 'react';
import { 
  Droplets, Thermometer, Brain, Sprout, ChevronDown, 
  MapPin, Loader2, Activity, Wifi,
  Coins, TrendingUp, TrendingDown, Wallet, Cpu, Signal,
  ShieldAlert, FileText, List, Workflow,
  Radio, Package, Wheat
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

  // Fix for MapContainer type error
  const MapContainerAny = MapContainer as any;

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
      className={`bg-white dark:bg-neutral-900 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden transition-all duration-500 ease-in-out relative ${isExpanded ? 'ring-2 ring-agro-green/20' : ''}`}
    >
      {/* Safety Alert Strip (If active) */}
      {safetyLock && !isExpanded && (
        <div className="absolute top-0 right-0 left-0 h-1 bg-red-500 z-20 animate-pulse"></div>
      )}

      {/* Header do Card (Sempre Visível) */}
      <div 
        className="p-4 pb-10 md:p-5 md:pb-14 cursor-pointer relative" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 md:gap-4">
          {/* Ícone da Cultura (Optimized Size for Mobile) */}
          <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-gray-50 dark:bg-neutral-800 shadow-inner flex items-center justify-center text-2xl md:text-3xl shrink-0">
            {field.emoji}
            {/* Status Indicator */}
            <div className={`absolute top-1 right-1 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border-2 border-white dark:border-neutral-800 ${field.healthScore > 80 ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
          </div>

          {/* Informação Principal */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base md:text-lg text-gray-900 dark:text-white uppercase tracking-tight truncate leading-tight">
              {field.name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 md:mt-1 text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-400">
               <span className="flex items-center gap-1 truncate"><Sprout size={10} className="md:w-3 md:h-3"/> {field.crop}</span>
               <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0"></span>
               <span className="whitespace-nowrap">{field.areaHa} ha</span>
            </div>
            
            {/* Sensor Pills Mini + Safety Warning (Scrollable if overflow) */}
            <div className="flex gap-2 mt-1.5 md:mt-2 relative z-10 overflow-x-auto scrollbar-hide mask-right-fade">
              {safetyLock ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 bg-red-500 text-white animate-pulse shadow-sm whitespace-nowrap">
                   <ShieldAlert size={10} /> Interdito ({safetyLock.diffDays}d)
                </span>
              ) : (
                <>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 whitespace-nowrap ${field.humidity < 40 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                    <Droplets size={10} /> {field.humidity}%
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 whitespace-nowrap bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                    <Thermometer size={10} /> {field.temp}°C
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex gap-2 shrink-0">
             
             {/* Harvest Button (Compact) */}
             <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHarvestModal(true);
                }}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-95 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 shadow-sm hover:bg-yellow-200"
                title="Registar Colheita"
             >
                <Wheat size={20} />
             </button>

             {/* IoT Switch (Compact) */}
             <button
                onClick={handleIoTToggle}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-95 ${field.irrigationStatus ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-gray-500'}`}
             >
                {isLoadingIoT ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : field.irrigationStatus ? (
                  <Wifi size={20} />
                ) : (
                  <Droplets size={20} className="opacity-50" />
                )}
             </button>
          </div>
        </div>

        {/* Expand Indicator / Hint Visual */}
        <div className="absolute bottom-2 md:bottom-3 w-full left-0 right-0 flex justify-center pointer-events-none">
          {isExpanded ? (
            <div className="bg-gray-100 dark:bg-neutral-800 rounded-full p-1 animate-fade-in">
              <ChevronDown size={14} className="text-gray-400 rotate-180 transition-transform duration-300" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 animate-bounce bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm px-3 py-1 md:px-4 md:py-1.5 rounded-full shadow-sm border border-gray-100 dark:border-neutral-700">
               <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-agro-green dark:text-green-400">
                 Detalhes
               </span>
               <ChevronDown size={10} className="text-agro-green dark:text-green-400" />
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo Expandido */}
      {isExpanded && (
        <div className="px-4 pb-6 md:px-5 md:pb-8 animate-fade-in border-t border-gray-100 dark:border-neutral-800">
          
          {/* Tabs Navegação */}
          <div className="flex p-1 bg-gray-100 dark:bg-neutral-800 rounded-2xl my-4 md:my-6 overflow-x-auto scrollbar-hide">
             {(['sensors', 'journal', 'finance', 'ai'] as const).map(tab => (
               <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[70px] md:min-w-[80px] py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${
                  activeTab === tab 
                    ? 'bg-white dark:bg-neutral-700 shadow-sm text-agro-green dark:text-white' 
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {tab === 'ai' ? 'AI ✨' : tab === 'finance' ? 'Lucro' : tab === 'sensors' ? 'Sensores' : 'Diário'}
              </button>
             ))}
          </div>

          {/* TAB: SENSORES */}
          {activeTab === 'sensors' && (
            <div className="space-y-4 md:space-y-6 animate-slide-up">
              {/* Mini Mapa */}
              <div className="h-40 md:h-64 w-full rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-inner border border-gray-100 dark:border-neutral-800 relative z-0">
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
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] text-white font-mono flex items-center gap-1">
                  <MapPin size={10} /> GPS: {field.coordinates[0].toFixed(3)}, {field.coordinates[1].toFixed(3)}
                </div>
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                 <div className="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-3xl">
                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Humidade do Solo (24h)</p>
                    <div className="h-20 md:h-24 w-full">
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
                    <div className="h-20 md:h-24 w-full">
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

              {/* --- IOT DEVICES LIST --- */}
              <div className="pt-2 border-t border-gray-100 dark:border-neutral-800">
                 <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white uppercase flex items-center gap-2">
                       <Cpu size={14} /> Dispositivos
                    </h4>
                    <button
                      onClick={() => setShowAutomationHub(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-bold uppercase transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/40"
                    >
                      <Workflow size={12} /> Automações
                    </button>
                 </div>

                 {field.sensors && field.sensors.length > 0 ? (
                    <div className="space-y-3">
                       {field.sensors.map(sensor => (
                          <div key={sensor.id} className="bg-black/5 dark:bg-white/5 rounded-2xl p-3 flex items-center gap-3">
                             <div className="w-10 h-10 bg-white dark:bg-neutral-800 rounded-xl flex items-center justify-center text-gray-500 shadow-sm">
                                {sensor.type === 'moisture' ? <Droplets size={18} /> : <Activity size={18} />}
                             </div>
                             <div className="flex-1">
                                <p className="font-bold text-sm dark:text-white">{sensor.name}</p>
                                <p className="text-[10px] text-gray-500 font-mono">ID: {sensor.id}</p>
                             </div>
                             <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Online
                                </div>
                                <div className="flex items-center gap-1 text-gray-400">
                                   <Signal size={12} /> <span className="text-[10px]">{sensor.signalStrength}%</span>
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div className="text-center py-6 bg-gray-50 dark:bg-neutral-800/30 rounded-3xl border border-dashed border-gray-200 dark:border-neutral-800">
                       <Radio size={24} className="mx-auto text-gray-300 mb-2" />
                       <p className="text-xs text-gray-400">Nenhum sensor vinculado.</p>
                    </div>
                 )}
              </div>
            </div>
          )}

          {/* TAB: DIÁRIO (REGISTOS - VISUALIZAÇÃO APENAS) */}
          {activeTab === 'journal' && (
            <div className="space-y-4 animate-slide-up">
              
              <div className="flex items-center justify-between mb-2">
                 <div className="flex items-center gap-2">
                    <FileText size={16} className="text-agro-green" />
                    <h4 className="text-xs font-bold uppercase text-gray-500">Histórico</h4>
                 </div>
                 {/* Visual hint instructing user where to add */}
                 <div className="text-[10px] text-gray-400 bg-gray-100 dark:bg-neutral-800 px-2 py-1 rounded-md">
                    + em "Registo"
                 </div>
              </div>

              {/* Lista de Logs */}
              <div className="space-y-3 pl-4 border-l-2 border-gray-100 dark:border-neutral-800 mt-4 min-h-[150px]">
                {field.logs && field.logs.length > 0 ? (
                  field.logs.slice().reverse().map(log => (
                    <div key={log.id} className="relative group">
                      <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-900 ${
                        log.type === 'treatment' ? 'bg-orange-400' : 
                        log.type === 'fertilization' ? 'bg-green-500' :
                        log.type === 'harvest' ? 'bg-yellow-500' :
                        'bg-blue-400'
                      }`}></div>
                      <div className="flex justify-between items-start">
                         <div className="flex-1">
                            <p className="text-xs text-gray-400 font-mono mb-0.5">{log.date}</p>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{log.productName || log.description}</p>
                            
                            {/* Badges de Custo, Dose e Operador */}
                            <div className="flex flex-wrap gap-2 mt-1.5">
                              {log.cost !== undefined && log.cost > 0 && (
                                 <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-gray-100 dark:bg-neutral-800 text-gray-500 px-1.5 py-0.5 rounded">
                                    {log.cost.toFixed(2)}€
                                 </span>
                              )}
                              {log.quantity !== undefined && log.unit && (
                                 <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                                    <Package size={8} /> {log.quantity} {log.unit}
                                 </span>
                              )}
                              {log.type === 'treatment' && log.safetyDays && (
                                 <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-red-50 dark:bg-red-900/20 text-red-600 px-1.5 py-0.5 rounded">
                                    <ShieldAlert size={8} /> IS: {log.safetyDays}d
                                 </span>
                              )}
                            </div>
                         </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 opacity-50">
                     <List size={24} className="text-gray-300 mb-2" />
                     <p className="text-gray-400 text-sm italic">Sem registos recentes.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: FINANCEIRO (Lucro Individual) */}
          {activeTab === 'finance' && (
             <div className="space-y-6 animate-slide-up">
               
               {/* Card de Rentabilidade */}
               <div className={`rounded-[2rem] p-5 md:p-6 text-white shadow-xl relative overflow-hidden ${
                 financialData.netMargin >= 0 
                   ? 'bg-gradient-to-br from-[#3E6837] to-[#2A4825] shadow-green-900/20' 
                   : 'bg-gradient-to-br from-red-600 to-red-800 shadow-red-900/20'
               }`}>
                  <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-white/80 mb-2">
                           <Coins size={16} />
                           <p className="text-xs font-bold uppercase tracking-wider">Lucro Estimado</p>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-3xl md:text-4xl font-black">{financialData.netMargin.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}</h2>
                        </div>
                        <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold bg-white/20 px-2 py-1 rounded-lg backdrop-blur-md">
                           {financialData.netMargin >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                           ROI: {financialData.roi}%
                        </div>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 w-full md:w-auto">
                      <div className="flex justify-between md:gap-6 items-center text-sm">
                        <span className="opacity-80">Preço/Ton:</span>
                        <span className="font-bold">{financialData.marketPrice}€</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Decorator */}
                  <Wallet className="absolute -right-6 -bottom-6 w-36 h-36 opacity-10 rotate-12" />
               </div>

               {/* Gráfico de Barras: Custos vs Receita */}
               <div className="bg-gray-50 dark:bg-neutral-800/50 p-5 md:p-6 rounded-[2rem]">
                  <h4 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white mb-4">Análise Financeira</h4>
                  <div className="h-32 md:h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={financialData.chartData} barSize={24}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={55} axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af', fontWeight: 700}} />
                        <Tooltip 
                          cursor={{fill: 'transparent'}}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
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
             <div className="space-y-6 animate-slide-up">
               {/* Yield Prediction Card - Responsive Layout */}
               <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[2rem] p-5 md:p-6 text-white shadow-xl shadow-purple-900/20 relative overflow-hidden">
                  <Brain className="absolute -top-4 -right-4 w-32 h-32 opacity-10 text-white" />
                  
                  <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <p className="text-purple-200 text-xs font-bold uppercase tracking-wider mb-2">Previsão</p>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-3xl md:text-4xl font-black">{(field.areaHa * field.yieldPerHa).toFixed(1)}</h2>
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