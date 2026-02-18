
import React, { useState, useMemo, useEffect } from 'react';
import {
  Droplets, Thermometer, Brain, Sprout, ChevronDown,
  MapPin, Loader2, Activity, Wifi,
  Coins, TrendingUp, TrendingDown, Wallet, Cpu, Signal,
  ShieldAlert, FileText, List, Workflow,
  Radio, Package, Wheat, Leaf, BarChart3, ScanEye, X, ArrowLeft,
  Syringe, Trash2, Power
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, Tooltip } from 'recharts';
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
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

// --- ATOMIC COMPONENTS ---

const TelemetryCapsule = ({
  icon: Icon,
  label,
  value,
  unit,
  colorClass,
  isAlert = false
}: {
  icon: any;
  label: string;
  value: string | number;
  unit: string;
  colorClass: string;
  isAlert?: boolean
}) => (
  <div className={clsx(
    "flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-sm transition-all shadow-sm",
    isAlert
      ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
      : "bg-white/60 dark:bg-white/5 border-white/40 dark:border-white/10"
  )}>
    <div className={clsx("p-2 rounded-xl", isAlert ? "bg-red-500 text-white" : "bg-white dark:bg-neutral-800 text-gray-500 dark:text-gray-400 shadow-inner")}>
      <Icon size={16} className={clsx(isAlert ? "animate-pulse" : colorClass)} />
    </div>
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 leading-none mb-1">{label}</p>
      <p className="flex items-baseline gap-0.5 font-black text-lg md:text-xl leading-none text-gray-900 dark:text-white">
        {value}<span className="text-xs font-bold opacity-50">{unit}</span>
      </p>
    </div>
  </div>
);

const TactileButton = ({
  onClick,
  active,
  loading,
  icon: Icon,
  label,
  activeColor = "blue"
}: {
  onClick: (e: React.MouseEvent) => void;
  active: boolean;
  loading?: boolean;
  icon: any;
  label: string;
  activeColor?: "blue" | "green" | "yellow"
}) => {
  const colorMap = {
    blue: "bg-blue-600 shadow-blue-500/50",
    green: "bg-emerald-600 shadow-emerald-500/50",
    yellow: "bg-amber-500 shadow-amber-500/50"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={clsx(
        "relative h-14 md:h-16 px-6 rounded-[1.2rem] flex items-center justify-center gap-3 transition-all duration-300 shadow-lg group border",
        active
          ? clsx("text-white border-transparent", colorMap[activeColor])
          : "bg-[#EAEAEA] dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 border-white/50 dark:border-white/5 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.05)] hover:bg-gray-200 dark:hover:bg-[#252525]"
      )}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            <Loader2 size={20} className="animate-spin" />
          </motion.div>
        ) : (
          <motion.div
            key="icon"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2"
          >
            <Icon size={20} className={active ? "text-white" : ""} strokeWidth={2.5} />
            <span className="font-bold uppercase text-xs tracking-wide">{label}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ACTIVE GLOW BEAM */}
      {active && (
        <motion.div
          layoutId={`glow-${label}`}
          className="absolute inset-0 rounded-[1.2rem] bg-white/20 blur-md"
        />
      )}
    </motion.button>
  );
};

// --- MAIN COMPONENT ---

const FieldCard: React.FC<FieldCardProps> = ({ field, onToggleIrrigation, onHarvest, onModalChange, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'sensors' | 'journal' | 'finance' | 'ai'>('sensors');
  const [isLoadingIoT, setIsLoadingIoT] = useState(false);
  const [showAutomationHub, setShowAutomationHub] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);

  useEffect(() => {
    if (onModalChange) {
      onModalChange(isOpen || showHarvestModal);
    }
  }, [isOpen, showHarvestModal, onModalChange]);

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
      .sort((a, b) => b.daysLeft - a.daysLeft)[0];

    return activeTreatment;
  }, [field.logs]);

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
      {/* --- COMMAND MODULE CARD --- */}
      <motion.div
        layout
        className="relative bg-[#FDFDF5] dark:bg-[#0A0A0A] rounded-[2.5rem] border border-white/50 dark:border-white/10 shadow-xl overflow-hidden group hover:border-agro-green/30 hover:shadow-2xl transition-all duration-500"
      >
        {/* Safety Lock Overlay Ribbon */}
        {safetyLock && (
          <div className="absolute top-0 right-0 left-0 h-1 bg-red-500 z-20 shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse"></div>
        )}

        <div
          className="p-3 md:p-6 cursor-pointer relative z-10"
          onClick={() => setIsOpen(true)}
        >
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 md:gap-6">

            {/* ZONE 1: HUD IDENTITY */}
            <div className="flex items-start gap-3 md:gap-5 min-w-0">
              {/* 3D HEALTH AVATAR */}
              <div className="relative w-12 h-12 md:w-20 md:h-20 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                  <path
                    className="text-gray-200 dark:text-neutral-800"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <motion.path
                    initial={{ strokeDasharray: "0, 100" }}
                    animate={{ strokeDasharray: `${field.healthScore}, 100` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={field.healthScore > 80 ? "text-agro-green drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" : "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-lg md:text-3xl pb-0.5 md:pb-1">
                  {field.emoji}
                </div>
                {/* Status Dot */}
                <div className={clsx(
                  "absolute bottom-0 right-0 w-3 h-3 md:w-6 md:h-6 rounded-full border-2 md:border-4 border-[#FDFDF5] dark:border-[#0A0A0A] flex items-center justify-center shadow-md",
                  field.healthScore > 80 ? "bg-green-500" : "bg-red-500 animate-pulse"
                )}>
                  {field.healthScore <= 80 && <Activity size={8} className="text-white md:hidden" />}
                  {field.healthScore <= 80 && <Activity size={10} className="text-white hidden md:block" />}
                </div>
              </div>

              <div className="flex-1 min-w-0 pt-0 md:pt-1">
                <div className="flex items-center gap-2 mb-0.5 md:mb-1">
                  <h3 className="font-black italic text-base md:text-3xl text-gray-900 dark:text-white uppercase tracking-tighter leading-none truncate font-display">
                    {field.name}
                  </h3>
                </div>

                <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm font-bold text-gray-400 dark:text-gray-500 mb-2 md:mb-3">
                  <span className="flex items-center gap-1 truncate text-gray-500 dark:text-gray-400 uppercase tracking-wide text-[10px] md:text-xs">
                    <Sprout size={10} className="md:w-3 md:h-3 text-agro-green" /> {field.crop}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span className="text-[10px] md:text-xs uppercase tracking-wide">{field.areaHa} HA</span>
                </div>

                {/* Desktop Telemetry Capsules */}
                <div className="flex flex-wrap gap-2">
                  <TelemetryCapsule
                    icon={Droplets}
                    label="Solo"
                    value={field.humidity}
                    unit="%"
                    colorClass="text-blue-500"
                    isAlert={field.humidity < 30}
                  />
                  <TelemetryCapsule
                    icon={Thermometer}
                    label="Temp"
                    value={field.temp}
                    unit="°C"
                    colorClass="text-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* ZONE 2: TACTILE CONTROLS */}
            <div className="flex items-center gap-2 md:gap-3 w-full xl:w-auto mt-3 md:mt-4 xl:mt-0 pt-3 md:pt-4 xl:pt-0 border-t xl:border-t-0 border-gray-100 dark:border-white/5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHarvestModal(true);
                }}
                title="Registar Colheita"
                className={clsx(
                  "flex-1 xl:flex-none h-12 md:h-16 px-4 md:px-6 rounded-xl md:rounded-[1.2rem] bg-[#FFF8E1] dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-700/30 flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all group hover:bg-[#FFF3C4]"
                )}
              >
                <Wheat size={18} className="md:w-[22px] transition-transform group-hover:rotate-12 stroke-[2.5]" />
                <div className="text-left leading-none">
                  <span className="block text-[8px] md:text-[9px] font-bold uppercase opacity-60">Registar</span>
                  <span className="block text-[10px] md:text-xs font-black uppercase tracking-wide">Colheita</span>
                </div>
              </button>

              <div className="flex-1 xl:flex-none max-w-[200px]">
                <TactileButton
                  onClick={handleIoTToggle}
                  active={field.irrigationStatus}
                  loading={isLoadingIoT}
                  icon={field.irrigationStatus ? Wifi : Power}
                  label={field.irrigationStatus ? "Rega Ativa" : "Ativar Rega"}
                  activeColor="blue"
                />
              </div>
            </div>
          </div>

          {/* Subtle expand hint */}
          <div className="absolute right-6 top-6 opacity-0 group-hover:opacity-30 transition-opacity">
            <ChevronDown size={24} className="-rotate-90" />
          </div>
        </div>
      </motion.div>

      {/* --- HUD MODAL (FULL SCREEN / EXPANDED) --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[150] bg-[#FDFDF5] dark:bg-[#0A0A0A] overflow-hidden flex flex-col"
          >
            {/* HUD HEADER */}
            <div className="px-4 py-4 md:px-8 bg-white/50 dark:bg-black/50 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 flex items-center justify-between sticky top-0 z-50">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-12 h-12 rounded-2xl bg-white dark:bg-neutral-900 flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/10 active:scale-90 transition-transform"
                >
                  <ArrowLeft size={24} strokeWidth={2.5} />
                </button>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black italic uppercase text-gray-900 dark:text-white leading-none tracking-tighter">{field.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-gray-200 dark:bg-white/10 rounded-md text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300 flex items-center gap-1">
                      <MapPin size={10} /> {field.coordinates[0].toFixed(4)}, {field.coordinates[1].toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                  <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Cultura Atual</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white leading-none">{field.crop}</p>
                </div>
                <div className="w-12 h-12 bg-white dark:bg-neutral-900 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-gray-100 dark:border-white/10">
                  {field.emoji}
                </div>
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/10 text-red-500 flex items-center justify-center border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors active:scale-95 ml-2"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
              <div className="max-w-7xl mx-auto pb-10 space-y-8">

                {/* SEGMENTED TABS */}
                <div className="flex p-1.5 bg-gray-200/50 dark:bg-white/5 rounded-[1.5rem] backdrop-blur-sm sticky top-0 md:relative z-40 mx-auto max-w-lg shadow-inner">
                  {[
                    { id: 'sensors', label: 'Telemetria', icon: Activity },
                    { id: 'journal', label: 'Diário', icon: FileText },
                    { id: 'finance', label: 'Finanças', icon: Coins },
                    { id: 'ai', label: 'Agro-Vision', icon: ScanEye },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className="flex-1 relative py-3 rounded-[1.2rem] flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wide transition-all z-10"
                    >
                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-[1.2rem] shadow-sm z-[-1]"
                        />
                      )}
                      <span className={clsx("flex items-center gap-2 relative z-10", activeTab === tab.id ? "text-agro-green dark:text-white" : "text-gray-500 opacity-70")}>
                        <tab.icon size={16} /> <span className="hidden md:inline">{tab.label}</span>
                      </span>
                    </button>
                  ))}
                </div>

                {/* TAB CONTENT (RETAINED LOGIC, UPDATED STYLES) */}
                <AnimatePresence mode="wait">
                  {activeTab === 'sensors' && (
                    <motion.div
                      key="sensors"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      {/* Panoramic Map */}
                      <div className="h-64 md:h-[450px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/50 dark:border-white/5 relative group">
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

                        {/* Map HUD Overlay */}
                        <div className="absolute top-6 left-6 right-6 flex justify-between pointer-events-none">
                          <div className="bg-black/40 backdrop-blur-xl px-5 py-3 rounded-2xl text-white border border-white/10">
                            <p className="text-[10px] font-bold uppercase opacity-70 tracking-widest">Área Monitorizada</p>
                            <p className="text-2xl font-black">{field.areaHa} <span className="text-sm font-bold opacity-70">HA</span></p>
                          </div>
                          <div className="bg-black/40 backdrop-blur-xl px-5 py-3 rounded-2xl text-white border border-white/10 flex items-center gap-3">
                            <Wifi size={18} className={field.irrigationStatus ? 'text-green-400' : 'text-gray-400'} />
                            <div>
                              <p className="text-[10px] font-bold uppercase opacity-70 tracking-widest">Status Rega</p>
                              <p className="text-sm font-black uppercase">{field.irrigationStatus ? 'ATIVA' : 'STANDBY'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sensor Charts */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-neutral-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5">
                          <div className="flex items-center justify-between mb-6">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                              <Droplets size={16} /> Humidade do Solo
                            </p>
                            <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 text-xs font-black uppercase">
                              Últimas 24h
                            </div>
                          </div>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={field.history}>
                                <defs>
                                  <linearGradient id="gradHum" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '12px', backgroundColor: '#fff' }} />
                                <Area type="monotone" dataKey="humidity" stroke="#3b82f6" fill="url(#gradHum)" strokeWidth={3} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-neutral-900 p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-white/5">
                          <div className="flex items-center justify-between mb-6">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                              <Activity size={16} /> Índice NDVI
                            </p>
                            <div className="px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400 text-xs font-black uppercase">
                              Satélite
                            </div>
                          </div>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={field.history}>
                                <defs>
                                  <linearGradient id="gradNdvi" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="ndvi" stroke="#4ade80" fill="url(#gradNdvi)" strokeWidth={3} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      {/* IOT HUB LINK */}
                      <button
                        onClick={() => setShowAutomationHub(true)}
                        className="w-full py-6 rounded-[2rem] border-2 border-dashed border-gray-300 dark:border-white/10 flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
                      >
                        <Cpu size={32} className="mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-black uppercase tracking-widest">Configurar Automação IoT</span>
                      </button>

                    </motion.div>
                  )}

                  {/* Journal Tab */}
                  {activeTab === 'journal' && (
                    <motion.div
                      key="journal"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-8"
                    >
                      <div className="relative pl-8 space-y-8 before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-200 dark:before:bg-neutral-800">
                        {field.logs && field.logs.length > 0 ? (
                          field.logs.slice().reverse().map((log) => (
                            <div key={log.id} className="relative">
                              <div className={`absolute -left-[35px] top-0 w-8 h-8 rounded-full border-4 border-[#FDFDF5] dark:border-[#0A0A0A] flex items-center justify-center z-10 ${log.type === 'treatment' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                <FileText size={14} />
                              </div>
                              <div className="bg-white dark:bg-neutral-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/5">
                                <div className="flex justify-between mb-2">
                                  <span className="text-xs font-bold font-mono text-gray-400">{log.date}</span>
                                  <span className="text-[10px] font-black uppercase bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md">{log.type}</span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{log.productName || log.description}</h3>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-20 text-gray-400">
                            <p className="font-bold">Sem registos recentes.</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Finance & AI Tabs (Simplified for brevity but using same aesthetics) */}
                  {activeTab === 'finance' && (
                    <motion.div key="finance" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <div className={`rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[350px] ${financialData.netMargin >= 0
                        ? 'bg-gradient-to-br from-[#3E6837] to-[#1A2E1A]'
                        : 'bg-gradient-to-br from-red-600 to-red-900'
                        }`}>
                        <div className="relative z-10">
                          <p className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">Lucro Líquido Estimado</p>
                          <h2 className="text-7xl font-black tracking-tighter">
                            {financialData.netMargin.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}
                          </h2>
                        </div>
                        <Wallet className="absolute -right-10 -bottom-10 w-64 h-64 opacity-10 rotate-12" />
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'ai' && (
                    <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <PestDetection />
                    </motion.div>
                  )}

                </AnimatePresence>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SUB MODALS --- */}
      {showAutomationHub && (
        <AutomationHub
          fields={[field]}
          onToggleIrrigation={onToggleIrrigation}
          onClose={() => setShowAutomationHub(false)}
        />
      )}

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