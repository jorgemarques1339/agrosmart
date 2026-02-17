import React, { useState, useMemo, useEffect } from 'react';
import { 
  Droplets, Thermometer, Brain, Sprout, ChevronDown, 
  MapPin, Loader2, Activity, Wifi,
  Coins, TrendingUp, TrendingDown, Wallet, Cpu, Signal,
  ShieldAlert, FileText, List, Workflow,
  Radio, Package, Wheat, Leaf, BarChart3, ScanEye, X, ArrowLeft,
  Syringe, Trash2
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
  onModalChange?: (isOpen: boolean) => void;
  onDelete?: (id: string) => void;
}

const FieldCard: React.FC<FieldCardProps> = ({ field, onToggleIrrigation, onHarvest, onModalChange, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false); // Changed from isExpanded to isOpen (Modal mode)
  const [activeTab, setActiveTab] = useState<'sensors' | 'journal' | 'finance' | 'ai'>('sensors');
  const [isLoadingIoT, setIsLoadingIoT] = useState(false);
  const [showAutomationHub, setShowAutomationHub] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);

  // Notificar o pai sobre o estado do modal (Detalhes OU Colheita) para esconder a barra de navegação
  useEffect(() => {
    if (onModalChange) {
      onModalChange(isOpen || showHarvestModal);
    }
  }, [isOpen, showHarvestModal, onModalChange]);

  // Fix for MapContainer type error
  const MapContainerAny = MapContainer as any;

  // Safety Interval Logic (IS)
  const safetyLock = useMemo(() => {
    const activeTreatment = field.logs
      .filter(l => l.type === 'treatment' && l.safetyDays && l.safetyDays > 0)
      .map(l => {
        const endDate = new Date(l.date);
        endDate.setDate(endDate.getDate() + (l.safetyDays || 0));
        const diffTime = endDate.getTime() - new Date().getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { daysLeft, endDate };
      })
      .filter(item => item.daysLeft > 0)
      .sort((a,b) => b.daysLeft - a.daysLeft)[0];

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

  const handleDelete = () => {
    if (onDelete && window.confirm(`Tem a certeza que deseja eliminar o campo "${field.name}"? Esta ação não pode ser desfeita.`)) {
      onDelete(field.id);
    }
  };

  // --- Financial Logic ---
  const financialData = useMemo(() => {
    const totalExpenses = field.logs?.reduce((acc, log) => acc + (log.cost || 0), 0) || 0;

    const getMarketPrice = (crop: string) => {
      if (crop.includes('Uva')) return 1200; 
      if (crop.includes('Milho')) return 280; 
      if (crop.includes('Trigo')) return 350; 
      if (crop.includes('Olival')) return 800; 
      return 400; 
    };

    const marketPrice = getMarketPrice(field.crop);
    const estimatedProduction = field.areaHa * field.yieldPerHa; 
    const estimatedRevenue = estimatedProduction * marketPrice;

    const netMargin = estimatedRevenue - totalExpenses;
    const roi = totalExpenses > 0 ? ((netMargin / totalExpenses) * 100).toFixed(1) : '∞';

    const chartData = [
      { name: 'Custos', value: totalExpenses, color: '#ef4444' }, 
      { name: 'Receita', value: estimatedRevenue, color: '#3E6837' } 
    ];

    return { totalExpenses, estimatedRevenue, netMargin, roi, chartData, marketPrice };
  }, [field]);

  return (
    <>
      {/* --- CARTÃO RESUMO (CARD VIEW) --- */}
      <div 
        className={`bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden relative group hover:shadow-lg dark:hover:shadow-neutral-900/50 transition-all duration-300`}
      >
        {/* Safety Alert Strip */}
        {safetyLock && (
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-red-500 z-20 animate-pulse"></div>
        )}

        <div 
          className="p-5 pb-5 cursor-pointer relative" 
          onClick={() => setIsOpen(true)}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* ZONA 1: IDENTIDADE */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="relative w-16 h-16 md:w-18 md:h-18 rounded-3xl bg-gray-50 dark:bg-neutral-800 shadow-inner flex items-center justify-center text-3xl shrink-0 border border-white dark:border-neutral-700">
                {field.emoji}
                <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-[3px] border-white dark:border-neutral-900 flex items-center justify-center ${field.healthScore > 80 ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}>
                   {field.healthScore <= 80 && <Activity size={10} className="text-white" />}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                   <h3 className="font-black text-xl md:text-2xl text-gray-900 dark:text-white uppercase tracking-tight truncate leading-none">
                     {field.name}
                   </h3>
                   {safetyLock && (
                      <span className="hidden md:inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-600 animate-pulse items-center gap-1">
                         <ShieldAlert size={10} /> IS: {safetyLock.daysLeft}d
                      </span>
                   )}
                </div>
                
                <div className="flex items-center gap-3 text-xs md:text-sm font-bold text-gray-400 dark:text-gray-500">
                   <span className="flex items-center gap-1 truncate text-gray-500 dark:text-gray-400">
                      <Sprout size={14} className="text-agro-green" /> {field.crop}
                   </span>
                   <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0"></span>
                   <span className="whitespace-nowrap">{field.areaHa} ha</span>
                </div>

                {/* Mobile Telemetry */}
                <div className="flex md:hidden items-center gap-3 mt-2.5">
                   <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
                      <Droplets size={12} className="text-blue-500" />
                      <span className={`text-xs font-black ${field.humidity < 40 ? 'text-red-500' : 'text-blue-700 dark:text-blue-300'}`}>
                         {field.humidity}%
                      </span>
                   </div>
                   <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30">
                      <Thermometer size={12} className="text-orange-500" />
                      <span className="text-xs font-black text-orange-700 dark:text-orange-300">
                         {field.temp}°
                      </span>
                   </div>
                </div>
                
                {safetyLock && (
                  <div className="flex md:hidden mt-2">
                      <span className="px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 bg-red-500 text-white animate-pulse">
                         <ShieldAlert size={12} /> Bloqueio Sanitário: {safetyLock.daysLeft} dias
                      </span>
                  </div>
                )}
              </div>
            </div>

            {/* ZONA 2: TELEMETRIA (Desktop) */}
            <div className="hidden md:flex items-center gap-6 px-6 border-l border-r border-gray-100 dark:border-neutral-800 mx-4">
               {safetyLock ? (
                  <div className="flex flex-col justify-center w-full min-w-[140px]">
                     <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Colheita Interdita</p>
                     <p className="text-sm font-black text-red-600 dark:text-red-400 leading-tight">Intervalo de Segurança Ativo</p>
                  </div>
               ) : (
                 <>
                   <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                         <Droplets size={12} /> Solo
                      </span>
                      <span className={`text-xl font-black ${field.humidity < 40 ? 'text-red-500' : 'text-blue-600'}`}>
                         {field.humidity}%
                      </span>
                   </div>
                   
                   <div className="w-px h-8 bg-gray-200 dark:bg-neutral-800"></div>

                   <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                         <Thermometer size={12} /> Ar
                      </span>
                      <span className="text-xl font-black text-orange-500">
                         {field.temp}°
                      </span>
                   </div>
                 </>
               )}
            </div>

            {/* ZONA 3: AÇÕES RÁPIDAS */}
            <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-neutral-800">
               <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHarvestModal(true);
                  }}
                  className="flex-1 md:flex-none h-12 md:h-14 px-0 md:px-6 rounded-2xl bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 group border border-yellow-200 dark:border-yellow-800/30"
                  title="Registar Colheita"
               >
                  <Wheat size={22} className="md:w-5 md:h-5 transition-transform group-hover:rotate-12" />
                  <span className="hidden md:inline text-xs font-bold uppercase tracking-wide">Colheita</span>
               </button>

               <button
                  onClick={handleIoTToggle}
                  className={`flex-1 md:flex-none h-12 md:h-14 px-0 md:px-6 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 shadow-sm group border ${
                     field.irrigationStatus 
                       ? 'bg-blue-600 text-white shadow-blue-600/30 border-blue-600' 
                       : 'bg-white dark:bg-neutral-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700'
                  }`}
               >
                  {isLoadingIoT ? (
                    <Loader2 size={22} className="animate-spin md:w-5 md:h-5" />
                  ) : field.irrigationStatus ? (
                    <Wifi size={22} className="md:w-5 md:h-5" />
                  ) : (
                    <Droplets size={22} className="md:w-5 md:h-5 opacity-60 group-hover:opacity-100" />
                  )}
                  <span className={`hidden md:inline text-xs font-bold uppercase tracking-wide ${field.irrigationStatus ? 'text-white' : 'text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
                     {field.irrigationStatus ? 'Rega ON' : 'Regar'}
                  </span>
               </button>
            </div>
          </div>
          
          <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 group-hover:bottom-2 transition-all duration-300 bg-black/80 dark:bg-white/90 backdrop-blur px-3 py-1 rounded-full pointer-events-none">
             <span className="text-[9px] font-bold uppercase tracking-widest text-white dark:text-black">Abrir Detalhes</span>
             <ChevronDown size={10} className="text-white dark:text-black" />
          </div>
        </div>
      </div>

      {/* --- MODAL PÁGINA COMPLETA ("NOVA ABA") --- */}
      {isOpen && (
        <div className="fixed inset-0 z-[150] bg-[#FDFDF5] dark:bg-[#0A0A0A] overflow-hidden flex flex-col animate-scale-up">
          
          {/* HEADER DO MODAL */}
          <div className="px-4 py-3 md:px-6 md:py-4 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between sticky top-0 z-50">
             <div className="flex items-center gap-3 md:gap-4">
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-500 hover:text-black dark:hover:text-white transition-colors active:scale-90"
                >
                   <ArrowLeft size={20} />
                </button>
                <div>
                   <h2 className="text-lg md:text-xl font-black text-gray-900 dark:text-white leading-none truncate max-w-[200px] md:max-w-none">{field.name}</h2>
                   <p className="text-xs font-bold text-gray-400 mt-0.5 md:mt-1 flex items-center gap-1">
                      <MapPin size={10} /> {field.coordinates[0].toFixed(4)}, {field.coordinates[1].toFixed(4)}
                   </p>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                   <p className="text-[10px] font-bold uppercase text-gray-400">Cultura</p>
                   <p className="text-sm font-bold text-gray-900 dark:text-white">{field.crop}</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-2xl shadow-sm border border-gray-200 dark:border-neutral-700">
                   {field.emoji}
                </div>
                {onDelete && (
                  <button 
                    onClick={handleDelete}
                    className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors active:scale-90 border border-red-100 dark:border-red-900/30 ml-2"
                    title="Eliminar Campo"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
             </div>
          </div>

          {/* CONTEÚDO SCROLLABLE */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
             <div className="max-w-6xl mx-auto pb-10">
                
                {/* TABS Navigation - Mobile Grid / Desktop Flex */}
                <div className="grid grid-cols-4 md:flex md:gap-2 py-2 mb-4 md:mb-6 gap-2 sticky top-0 z-40 bg-[#FDFDF5]/90 dark:bg-[#0A0A0A]/90 backdrop-blur-sm -mx-4 px-2 md:mx-0 md:px-0">
                   {[
                     { id: 'sensors', label: 'Dados', desk: 'Telemetria', icon: Activity },
                     { id: 'journal', label: 'Diário', desk: 'Caderno', icon: FileText },
                     { id: 'finance', label: 'Lucro', desk: 'Rentabilidade', icon: Coins }, 
                     { id: 'ai', label: 'IA', desk: 'Agro-Vision', icon: ScanEye },
                   ].map(tab => (
                     <button 
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`
                        flex flex-col md:flex-row items-center justify-center 
                        py-2 md:py-3 md:px-6 rounded-xl md:rounded-2xl 
                        transition-all border-2 active:scale-95
                        ${activeTab === tab.id 
                          ? 'bg-white dark:bg-neutral-800 border-agro-green/30 text-agro-green dark:text-white shadow-sm' 
                          : 'bg-transparent border-transparent text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800'}
                      `}
                    >
                      <tab.icon size={18} className="mb-1 md:mb-0 md:mr-2" />
                      <span className="text-[9px] md:text-sm font-bold uppercase tracking-wide block md:hidden">{tab.label}</span>
                      <span className="text-sm font-bold uppercase tracking-wide hidden md:block">{tab.desk}</span>
                    </button>
                   ))}
                </div>

                {/* TAB: SENSORES */}
                {activeTab === 'sensors' && (
                  <div className="space-y-6 animate-slide-up">
                    {/* Mapa Panorâmico */}
                    <div className="h-64 md:h-[400px] w-full rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-xl border border-gray-100 dark:border-neutral-800 relative z-0">
                      <MapContainerAny 
                        center={field.coordinates} 
                        zoom={15} 
                        scrollWheelZoom={false} 
                        dragging={true}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                        <Polygon positions={field.polygon} pathOptions={{ color: '#4ade80', fillColor: '#4ade80', fillOpacity: 0.3, weight: 3 }} />
                      </MapContainerAny>
                      
                      {/* Overlay Stats */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
                         <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-2xl text-white pointer-events-auto">
                            <p className="text-[8px] md:text-[10px] font-bold uppercase opacity-70">Área Total</p>
                            <p className="text-sm md:text-xl font-black">{field.areaHa} ha</p>
                         </div>
                         <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-2xl text-white flex items-center gap-2 pointer-events-auto">
                            <Wifi size={14} className={field.irrigationStatus ? 'text-green-400' : 'text-gray-400'}/>
                            <span className="font-bold text-xs md:text-sm">{field.irrigationStatus ? 'Rega Ativa' : 'Rega Inativa'}</span>
                         </div>
                      </div>
                    </div>

                    {/* Gráficos Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                       {/* Chart 1: Soil Moisture */}
                       <div className="bg-white dark:bg-neutral-900 p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-neutral-800">
                          <div className="flex items-center justify-between mb-4 md:mb-6">
                             <p className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider">Humidade do Solo (24h)</p>
                             <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-500">
                               <Droplets size={18} />
                             </div>
                          </div>
                          <div className="h-56 md:h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={field.history}>
                                <defs>
                                  <linearGradient id="gradHum" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px' }} />
                                <Area type="monotone" dataKey="humidity" stroke="#3b82f6" fill="url(#gradHum)" strokeWidth={4} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                       </div>

                       {/* Chart 2: NDVI */}
                       <div className="bg-white dark:bg-neutral-900 p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-neutral-800">
                          <div className="flex justify-between items-center mb-4 md:mb-6">
                             <p className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider">Índice NDVI (Satélite)</p>
                             <span className="text-[10px] md:text-xs font-mono text-green-700 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900/20 px-2 py-1 md:px-3 md:py-1.5 rounded-xl">0.72 (Vigoroso)</span>
                          </div>
                          <div className="h-56 md:h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={field.history}>
                                <defs>
                                  <linearGradient id="gradNdvi" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="ndvi" stroke="#4ade80" fill="url(#gradNdvi)" strokeWidth={4} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                       </div>
                    </div>

                    {/* --- IOT DEVICES --- */}
                    <div className="pt-6 md:pt-8 border-t border-gray-200 dark:border-neutral-800 border-dashed">
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-6">
                          <h4 className="text-base md:text-lg font-bold text-gray-900 dark:text-white uppercase flex items-center gap-2">
                             <Cpu size={20} /> Dispositivos Conectados
                          </h4>
                          <button
                            onClick={() => setShowAutomationHub(true)}
                            className="flex items-center justify-center gap-2 px-5 py-3 md:px-6 md:py-3 bg-blue-600 text-white rounded-2xl text-xs md:text-sm font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-transform"
                          >
                            <Workflow size={16} /> Configurar Automações
                          </button>
                       </div>

                       {field.sensors && field.sensors.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                             {field.sensors.map(sensor => (
                                <div key={sensor.id} className="bg-white dark:bg-neutral-900 rounded-3xl p-4 md:p-5 flex items-center gap-3 md:gap-4 shadow-sm border border-gray-100 dark:border-neutral-800">
                                   <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-50 dark:bg-neutral-800 rounded-2xl flex items-center justify-center text-gray-500 shadow-inner shrink-0">
                                      {sensor.type === 'moisture' ? <Droplets size={20} /> : <Activity size={20} />}
                                   </div>
                                   <div className="flex-1 min-w-0">
                                      <p className="font-bold text-sm md:text-base dark:text-white truncate">{sensor.name}</p>
                                      <p className="text-[10px] md:text-xs text-gray-400 font-mono truncate">{sensor.id}</p>
                                   </div>
                                   <div className="flex flex-col items-end gap-1">
                                      <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-green-600">
                                         <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse"></div> Online
                                      </div>
                                      <div className="flex items-center gap-1 text-gray-400">
                                         <Signal size={12} /> <span className="text-[10px] md:text-xs font-mono">{sensor.signalStrength}%</span>
                                      </div>
                                   </div>
                                </div>
                             ))}
                          </div>
                       ) : (
                          <div className="text-center py-8 md:py-12 bg-white dark:bg-neutral-900 rounded-[2rem] md:rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-neutral-800">
                             <Radio size={28} className="mx-auto text-gray-300 mb-2 md:mb-3" />
                             <p className="text-xs md:text-sm text-gray-400 font-medium">Nenhum sensor vinculado a esta parcela.</p>
                          </div>
                       )}
                    </div>
                  </div>
                )}

                {/* TAB: DIÁRIO (REGISTOS) */}
                {activeTab === 'journal' && (
                  <div className="space-y-6 md:space-y-8 animate-slide-up">
                    {/* Timeline Vertical Moderna */}
                    <div className="relative pl-6 md:pl-10 space-y-6 md:space-y-8 before:absolute before:left-[11px] md:before:left-[23px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-200 dark:before:bg-neutral-800">
                      {field.logs && field.logs.length > 0 ? (
                        field.logs.slice().reverse().map((log, idx) => (
                          <div key={log.id} className="relative">
                            
                            {/* Dot Indicator */}
                            <div className={`absolute -left-[30px] md:-left-[43px] top-0 w-8 h-8 md:w-10 md:h-10 rounded-full border-4 border-white dark:border-[#0A0A0A] flex items-center justify-center z-10 ${
                              log.type === 'treatment' ? 'bg-orange-100 text-orange-600' : 
                              log.type === 'fertilization' ? 'bg-green-100 text-green-600' :
                              log.type === 'harvest' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                               {log.type === 'treatment' ? <Syringe size={14} className="md:w-4 md:h-4" /> : 
                                log.type === 'fertilization' ? <Sprout size={14} className="md:w-4 md:h-4" /> :
                                log.type === 'harvest' ? <Wheat size={14} className="md:w-4 md:h-4" /> : <FileText size={14} className="md:w-4 md:h-4" />}
                            </div>
                            
                            <div className="bg-white dark:bg-neutral-900 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-gray-100 dark:border-neutral-800 hover:shadow-md transition-shadow">
                               <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                                  <span className="text-xs md:text-sm font-mono font-bold text-gray-400">{log.date}</span>
                                  <span className={`self-start md:self-auto text-[9px] md:text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wide ${
                                     log.type === 'treatment' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20' : 
                                     log.type === 'fertilization' ? 'bg-green-50 text-green-600 dark:bg-green-900/20' :
                                     'bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                                  }`}>
                                     {log.type}
                                  </span>
                               </div>
                               
                               <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-2">{log.productName || log.description}</h3>
                               
                               <div className="flex flex-wrap gap-2">
                                 {log.cost !== undefined && log.cost > 0 && (
                                    <span className="inline-flex items-center gap-1 text-[10px] md:text-xs font-bold bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 px-2 py-1 md:px-3 md:py-1.5 rounded-xl">
                                       <Coins size={10} /> {log.cost.toFixed(2)}€
                                    </span>
                                 )}
                                 {log.quantity !== undefined && log.unit && (
                                    <span className="inline-flex items-center gap-1 text-[10px] md:text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 md:px-3 md:py-1.5 rounded-xl">
                                       <Package size={10} /> {log.quantity} {log.unit}
                                    </span>
                                 )}
                                 {log.type === 'treatment' && log.safetyDays && (
                                    <span className="inline-flex items-center gap-1 text-[10px] md:text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-600 px-2 py-1 md:px-3 md:py-1.5 rounded-xl">
                                       <ShieldAlert size={10} /> IS: {log.safetyDays}d
                                    </span>
                                 )}
                               </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 opacity-50">
                           <List size={40} className="text-gray-300 mb-3" />
                           <p className="text-sm font-bold text-gray-400">Sem registos no caderno.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB: FINANCEIRO */}
                {activeTab === 'finance' && (
                   <div className="space-y-6 md:grid md:grid-cols-2 md:gap-6 md:space-y-0 animate-slide-up">
                     {/* Card de Rentabilidade */}
                     <div className={`rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[260px] md:min-h-[300px] ${
                       financialData.netMargin >= 0 
                         ? 'bg-gradient-to-br from-[#3E6837] to-[#2A4825] shadow-green-900/20' 
                         : 'bg-gradient-to-br from-red-600 to-red-800 shadow-red-900/20'
                     }`}>
                        <div className="relative z-10">
                              <div className="flex items-center gap-2 text-white/80 mb-3 md:mb-4">
                                 <Coins size={20} className="md:w-6 md:h-6" />
                                 <p className="text-xs md:text-sm font-bold uppercase tracking-wider">Lucro Estimado</p>
                              </div>
                              <div className="flex items-baseline gap-2">
                                  <h2 className="text-5xl md:text-7xl font-black tracking-tighter">
                                      {financialData.netMargin.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}
                                  </h2>
                              </div>
                              <div className="mt-6 md:mt-8 inline-flex items-center gap-2 text-xs md:text-sm font-bold bg-white/20 px-4 py-2 md:px-5 md:py-2.5 rounded-2xl backdrop-blur-md border border-white/10">
                                 {financialData.netMargin >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                 ROI: {financialData.roi}%
                              </div>
                        </div>
                        
                        <div className="relative z-10 mt-auto">
                          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-white/10 w-full">
                            <div className="flex justify-between items-center">
                              <span className="opacity-80 font-medium text-xs md:text-sm">Preço Mercado / Ton</span>
                              <span className="font-black text-xl md:text-2xl">{financialData.marketPrice}€</span>
                            </div>
                          </div>
                        </div>
                        <Wallet className="absolute -right-8 -bottom-8 w-48 h-48 md:w-64 md:h-64 opacity-10 rotate-12" />
                     </div>

                     {/* Gráfico de Barras */}
                     <div className="bg-white dark:bg-neutral-900 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 flex flex-col justify-center shadow-sm">
                        <h4 className="text-base md:text-lg font-bold text-gray-900 dark:text-white mb-6 md:mb-8 uppercase tracking-wide flex items-center gap-2">
                           <BarChart3 size={18} className="text-gray-400" /> Análise Financeira
                        </h4>
                        <div className="h-56 md:h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={financialData.chartData} barSize={32}>
                              <XAxis type="number" hide />
                              <YAxis dataKey="name" type="category" width={70} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af', fontWeight: 700}} />
                              <Tooltip 
                                cursor={{fill: 'transparent'}}
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)', fontSize: '14px', padding: '12px' }}
                              />
                              <Bar dataKey="value" radius={[0, 12, 12, 0]}>
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

                {/* TAB: AI (Agro-Vision Optimized) */}
                {activeTab === 'ai' && (
                   <div className="space-y-6 md:grid md:grid-cols-2 md:gap-6 md:space-y-0 animate-slide-up">
                     
                     {/* 1. Agro-Vision Pest Detection (Priority) */}
                     <div className="h-full min-h-[400px] md:min-h-[450px]">
                       <PestDetection />
                     </div>

                     {/* 2. Yield Prediction Card */}
                     <div className="bg-gradient-to-br from-purple-600 to-indigo-800 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white shadow-xl shadow-purple-900/20 relative overflow-hidden flex flex-col justify-between min-h-[350px] md:min-h-[400px]">
                        <Brain className="absolute -top-4 -right-4 w-48 h-48 md:w-64 md:h-64 opacity-10 text-white" />
                        
                        <div className="relative z-10">
                              <p className="text-purple-200 text-xs md:text-sm font-bold uppercase tracking-wider mb-3 md:mb-4 flex items-center gap-2">
                                 <Activity size={18} /> Previsão de Rendimento
                              </p>
                              <div className="flex items-baseline gap-2">
                                  <h2 className="text-6xl md:text-8xl font-black tracking-tighter">{(field.areaHa * field.yieldPerHa).toFixed(1)}</h2>
                                  <span className="text-2xl md:text-3xl opacity-70 font-bold">Ton</span>
                              </div>
                              <p className="text-purple-200/80 text-sm md:text-base mt-4 md:mt-6 max-w-sm leading-relaxed font-medium">
                                 Estimativa baseada em dados históricos, análise de satélite e sensores de solo em tempo real.
                              </p>
                        </div>
                          
                        <div className="relative z-10 mt-auto">
                          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-white/10 w-full">
                            <div className="flex justify-between items-center text-sm md:text-base">
                              <span className="opacity-80 font-medium">Janela Ideal de Colheita</span>
                              <span className="font-bold border-b-2 border-white/30 pb-0.5 md:text-lg">{field.harvestWindow}</span>
                            </div>
                          </div>
                        </div>
                     </div>

                   </div>
                )}
             </div>
          </div>
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
    </>
  );
};

export default FieldCard;