
import React, { useState, useMemo, useEffect } from 'react';
import {
  Droplets, Thermometer, Brain, Sprout, ChevronDown,
  MapPin, Loader2, Activity, Wifi,
  Coins, TrendingUp, TrendingDown, Wallet, Cpu, Signal,
  ShieldAlert, FileText, List, Workflow,
  Radio, Package, Wheat, Leaf, BarChart3, ScanEye, X, ArrowLeft,
  Syringe, Trash2, Power, Plus, ShieldCheck, Clock, Battery, CloudSun, Camera, Zap, FileCheck, Image as ImageIcon, Navigation, BrainCircuit, Drone
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, Tooltip } from 'recharts';
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import OfflineTileLayer from './OfflineTileLayer';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import IrrigationTwin from './IrrigationTwin';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Field, FieldLog, StockItem, Sensor } from '../types';
import PestDetection from './PestDetection';
import SoilScanner from './SoilScanner';
import AutomationHub from './AutomationHub';
import HarvestModal from './HarvestModal';
import FieldRegistryModal, { RegistryType } from './FieldRegistryModal';
import { useStore } from '../store/useStore';
import { db } from '../services/db';
import { calculateMildioRisk } from '../utils/diseaseModel';
import MissionControl from './MissionControl';

interface FieldCardProps {
  field: Field;
  stocks?: StockItem[];
  onToggleIrrigation: (id: string, status: boolean) => void;
  onAddLog: (fieldId: string, log: Omit<FieldLog, 'id'>) => void;
  onUseStock?: (fieldId: string, stockId: string, quantity: number, date: string) => void;
  onRegisterSensor?: (fieldId: string, sensor: Sensor) => void;
  onRegisterSale?: (saleData: { stockId: string, quantity: number, pricePerUnit: number, clientName: string, date: string, fieldId?: string }) => void;
  onHarvest?: (fieldId: string, data: { quantity: number; unit: string; batchId: string; date: string }) => void;
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
    "flex items-center gap-2 md:gap-3 px-2.5 py-2 md:px-4 md:py-3 rounded-xl md:rounded-2xl border backdrop-blur-sm transition-all shadow-sm",
    isAlert
      ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
      : "bg-white/60 dark:bg-white/5 border-white/40 dark:border-white/10"
  )}>
    <div className={clsx("p-1.5 md:p-2 rounded-lg md:rounded-xl", isAlert ? "bg-red-500 text-white" : "bg-white dark:bg-neutral-800 text-gray-500 dark:text-gray-400 shadow-inner")}>
      <Icon size={14} className={clsx("md:w-4 md:h-4", isAlert ? "animate-pulse" : colorClass)} />
    </div>
    <div>
      <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest opacity-60 leading-none mb-0.5 md:mb-1">{label}</p>
      <p className="flex items-baseline gap-0.5 font-black text-sm md:text-xl leading-none text-gray-900 dark:text-white">
        {value}<span className="text-[10px] md:text-xs font-bold opacity-50">{unit}</span>
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
        "relative h-10 md:h-16 px-3 md:px-6 rounded-xl md:rounded-[1.2rem] flex items-center justify-center gap-2 md:gap-3 transition-all duration-300 shadow-lg group border",
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

// --- ACTION MENU COMPONENT ---
const ActionMenu = ({
  isOpen,
  onClose,
  options
}: {
  isOpen: boolean;
  onClose: () => void;
  options: Array<{ id: string; label: string; icon: any; color: string; onClick: () => void }>
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
          />

          {/* Menu Container */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-x-0 bottom-0 z-[201] md:inset-0 md:flex md:items-center md:justify-center pointer-events-none"
          >
            <div className="bg-[#FDFDF5] dark:bg-[#1a1a1a] w-full md:max-w-xl rounded-t-[2.5rem] md:rounded-[2.5rem] p-6 pb-10 md:pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] border-t border-white/20 pointer-events-auto">

              {/* Handle Bar (Mobile) */}
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-neutral-700 rounded-full mx-auto mb-6 md:hidden" />

              <div className="flex justify-between items-center mb-6 px-2">
                <h3 className="text-xl font-black italic uppercase text-gray-900 dark:text-white tracking-tight">Novo Registo</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      option.onClick();
                      onClose();
                    }}
                    className={clsx(
                      "flex flex-col items-center justify-center gap-3 p-4 md:p-6 rounded-[1.5rem] border transition-all active:scale-95 group",
                      "bg-white dark:bg-neutral-800 border-gray-100 dark:border-white/5 shadow-sm hover:border-gray-200 dark:hover:border-white/10 hover:shadow-md"
                    )}
                  >
                    <div className={clsx("w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-inner mb-1 transition-transform group-hover:scale-110", option.color)}>
                      <option.icon size={24} className="md:w-7 md:h-7" strokeWidth={2} />
                    </div>
                    <span className="font-bold text-xs md:text-sm text-gray-700 dark:text-gray-200 uppercase tracking-wide leading-none text-center">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- MAIN COMPONENT ---

const FieldCard: React.FC<FieldCardProps> = ({ field, onToggleIrrigation, onHarvest, onDelete, onAddLog, stocks = [] }) => {
  const { setChildModalOpen } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'sensors' | 'journal' | 'gallery' | 'ai' | 'missions' | 'twin'>('sensors');
  const [aiMode, setAiMode] = useState<'pests' | 'soil'>('pests');
  const [isLoadingIoT, setIsLoadingIoT] = useState(false);
  const [showAutomationHub, setShowAutomationHub] = useState(false);
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);

  const [showRegistryModal, setShowRegistryModal] = useState(false);
  const [registryType, setRegistryType] = useState<RegistryType>('observation');
  const [tileCount, setTileCount] = useState(0);

  // NDVI Visualization State
  const [showNDVILayer, setShowNDVILayer] = useState(false);
  const [ndviDate, setNdviDate] = useState('23 Fev (Há 3 dias)');

  const detailedForecast = useStore(state => state.detailedForecast);
  const diseaseRisk = useMemo(() => calculateMildioRisk(field, detailedForecast), [field, detailedForecast]);

  // --- DGAV PDF EXPORT ---
  const handleExportDGAV = () => {
    const doc = new jsPDF();

    // 1. Header & Title
    doc.setFillColor(62, 104, 55); // Agro Green
    doc.rect(0, 0, 210, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("CADERNO DE CAMPO - RELATÓRIO DGAV", 105, 13, { align: 'center' });

    // 2. Plot Identification
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("IDENTIFICAÇÃO DA PARCELA", 14, 30);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Nome: ${field.name}`, 14, 36);
    doc.text(`Cultura: ${field.crop}`, 14, 41);
    doc.text(`Área: ${field.areaHa} ha`, 100, 36);
    doc.text(`Coordenadas: ${field.coordinates.join(', ')}`, 100, 41);
    doc.text(`Responsável: Eng. Técnico Agrícola`, 14, 46); // Placeholder

    doc.setDrawColor(200);
    doc.line(14, 50, 196, 50);

    // 3. Operations Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("REGISTO DE OPERAÇÕES CULTURAIS", 14, 60);

    const tableRows = field.logs?.map(log => [
      log.date,
      log.type.toUpperCase(),
      log.productName || log.description,
      log.quantity ? `${log.quantity} ${log.unit || ''}` : '-',
      "Realizado"
    ]) || [];

    autoTable(doc, {
      startY: 65,
      head: [['Data', 'Tipo', 'Descrição / Produto', 'Qtd.', 'Estado']],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [62, 104, 55] },
      styles: { fontSize: 8 },
    });

    // 4. Footer
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Relatório gerado automaticamente via OrivaSmart App.", 14, finalY);
    doc.text(`Data de Emissão: ${new Date().toLocaleDateString()}`, 14, finalY + 5);

    doc.save(`Caderno_Campo_${field.name.replace(/\s/g, '_')}.pdf`);
  };

  useEffect(() => {
    setChildModalOpen(isOpen || showHarvestModal || showActionMenu || showRegistryModal);
  }, [isOpen, showHarvestModal, showActionMenu, showRegistryModal, setChildModalOpen]);

  // Deep Link / Focus Logic
  const focusedTarget = useStore(state => state.focusedTarget);
  useEffect(() => {
    if (focusedTarget && focusedTarget.type === 'sensor') {
      const hasSensor = field.sensors?.some(s => s.id === focusedTarget.id);
      if (hasSensor) {
        setIsOpen(true);
        setActiveTab('sensors');
      }
    }
  }, [focusedTarget, field.sensors]);

  useEffect(() => {
    const updateTileCount = async () => {
      const count = await db.tiles.count();
      setTileCount(count);
    };
    updateTileCount();
    // Interval update for simplicity if user is panning
    const interval = setInterval(updateTileCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const MapContainerAny = MapContainer as any;

  const handleOpenRegistry = (type: RegistryType) => {
    setRegistryType(type);
    setShowRegistryModal(true);
    setShowActionMenu(false);
  };

  // Action Menu Options
  const actionOptions = [
    {
      id: 'treatment',
      label: 'Fitossanitário',
      icon: ShieldCheck,
      color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
      onClick: () => handleOpenRegistry('treatment')
    },
    {
      id: 'fertilization',
      label: 'Fertilização',
      icon: Sprout,
      color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      onClick: () => handleOpenRegistry('fertilization')
    },
    {
      id: 'observation',
      label: 'Observações',
      icon: FileText,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      onClick: () => handleOpenRegistry('observation')
    },
    {
      id: 'labor',
      label: 'Mão de Obra',
      icon: Clock,
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
      onClick: () => handleOpenRegistry('labor')
    },
    {
      id: 'rega',
      label: 'Rega Manual',
      icon: Droplets,
      color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400',
      onClick: () => handleOpenRegistry('irrigation')
    },
    {
      id: 'analises',
      label: 'Análises',
      icon: ScanEye, // Using ScanEye as proxy for Microscope/Analysis if Microscope not imported, otherwise use what's available
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
      onClick: () => handleOpenRegistry('analysis')
    },
    {
      id: 'colheita',
      label: 'Colheita',
      icon: Wheat,
      color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
      onClick: () => setShowHarvestModal(true)
    }
  ];

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

  // --- NDVI Gradient Generator (Mock) ---
  // To simulate a realistic NDVI map without a real GeoTIFF/ImageOverlay API, we render multiple internal polygons
  // with varying opacities of green/yellow/red to represent crop vigor.
  const generateNDVIGradients = (basePolygon: [number, number][]) => {
    if (!basePolygon || basePolygon.length < 3) return [];

    // Simplistic mock: shrink the polygon slightly to create inner "zones" of different vigor
    const shrinkPolygon = (poly: [number, number][], factor: number): [number, number][] => {
      const centerLat = poly.reduce((sum, p) => sum + p[0], 0) / poly.length;
      const centerLng = poly.reduce((sum, p) => sum + p[1], 0) / poly.length;
      return poly.map(p => [
        centerLat + (p[0] - centerLat) * factor,
        centerLng + (p[1] - centerLng) * factor
      ]);
    };

    return [
      { positions: basePolygon, color: '#facc15', label: 'Médio', opacity: 0.6 }, // Yellow base
      { positions: shrinkPolygon(basePolygon, 0.8), color: '#4ade80', label: 'Alto', opacity: 0.7 }, // Green mid
      { positions: shrinkPolygon(basePolygon, 0.5), color: '#166534', label: 'Muito Alto', opacity: 0.8 }, // Dark Green center
      { positions: shrinkPolygon(basePolygon, 0.2), color: '#ef4444', label: 'Baixo (Stress)', opacity: 0.6 } // Red spot
    ];
  };

  const ndviLayers = useMemo(() => generateNDVIGradients(field.polygon), [field.polygon]);

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
                  setShowActionMenu(true);
                }}
                title="Novo Registo"
                className={clsx(
                  "flex-1 xl:flex-none h-10 md:h-16 px-3 md:px-6 rounded-xl md:rounded-[1.2rem] bg-[#FFF8E1] dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-700/30 flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all group hover:bg-[#FFF3C4]"
                )}
              >
                <div className="relative">
                  <Plus size={14} strokeWidth={4} className="absolute -top-1 -right-1 text-yellow-600 animate-pulse" />
                  <FileText size={18} className="md:w-[22px]" />
                </div>
                <div className="text-left leading-none">
                  <span className="block text-[8px] md:text-[9px] font-bold uppercase opacity-60">Novo</span>
                  <span className="block text-[10px] md:text-xs font-black uppercase tracking-wide">Registo</span>
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

      {/* --- ACTION MENU (NEW) --- */}
      <ActionMenu
        isOpen={showActionMenu}
        onClose={() => setShowActionMenu(false)}
        options={actionOptions}
      />

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
                <div className="flex p-1.5 bg-gray-200/50 dark:bg-white/5 rounded-[1.5rem] backdrop-blur-sm sticky top-0 md:relative z-40 mx-auto w-full max-w-lg md:max-w-3xl lg:max-w-4xl shadow-inner">
                  {[
                    { id: 'sensors', label: 'Dados', icon: Activity },
                    { id: 'twin', label: 'Digital-Twin', icon: Droplets },
                    { id: 'missions', label: 'Autónomos', icon: Drone },
                    { id: 'journal', label: 'Diário', icon: FileText },
                    { id: 'gallery', label: 'Galeria', icon: ImageIcon },
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
                        <tab.icon size={18} className="md:w-4 md:h-4" />
                        <span className="hidden sm:inline-block text-[10px] md:text-xs tracking-tighter md:tracking-normal">{tab.label}</span>
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
                      <div className="h-48 md:h-[300px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/50 dark:border-white/5 relative group">
                        <MapContainerAny
                          center={field.coordinates}
                          zoom={15}
                          scrollWheelZoom={false}
                          dragging={true}
                          style={{ height: '100%', width: '100%' }}
                        >
                          <OfflineTileLayer
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            crossOrigin="anonymous"
                          />

                          {/* Standard Polygon or NDVI Layers */}
                          {showNDVILayer ? (
                            <>
                              <Polygon positions={field.polygon} pathOptions={{ color: '#fff', fill: false, weight: 2, dashArray: '5, 5' }} />
                              {ndviLayers.map((layer, idx) => (
                                <Polygon
                                  key={`ndvi-${idx}`}
                                  positions={layer.positions}
                                  pathOptions={{ color: 'transparent', fillColor: layer.color, fillOpacity: layer.opacity }}
                                />
                              ))}
                            </>
                          ) : (
                            <Polygon positions={field.polygon} pathOptions={{ color: '#4ade80', fillColor: '#4ade80', fillOpacity: 0.3, weight: 3 }} />
                          )}
                        </MapContainerAny>

                        {/* Map HUD Overlay */}
                        <div className="absolute top-6 left-6 right-6 flex justify-end gap-2 pointer-events-none z-[400] overflow-hidden">
                          <AnimatePresence>
                            {!showNDVILayer && (
                              <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex gap-2"
                              >
                                <div className="bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl text-white border border-white/10 flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5 opacity-70">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Mapas Offline ({tileCount})</span>
                                  </div>
                                  <p className="text-xl font-black">{field.areaHa} <span className="text-sm font-bold opacity-70">HA</span></p>
                                </div>

                                <div className={clsx(
                                  "bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl text-white border border-white/10 flex flex-col gap-0.5",
                                  (financialData?.netMargin || 0) < 0 ? "border-red-500/50" : "border-agro-green/50"
                                )}>
                                  <div className="flex items-center gap-1.5 opacity-70">
                                    <Coins size={10} className="text-yellow-400" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Lucro Est.</span>
                                  </div>
                                  <p className={clsx(
                                    "text-lg font-black",
                                    (financialData?.netMargin || 0) < 0 ? "text-red-400" : "text-agro-green"
                                  )}>
                                    {(financialData?.netMargin || 0).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* NDVI Map Legend (Only visible when NDVI layer is on) */}
                        <AnimatePresence>
                          {showNDVILayer && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                              className="absolute bottom-2 left-2 sm:bottom-6 sm:left-6 bg-black/60 backdrop-blur-md p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-white/10 z-[400] pointer-events-none"
                            >
                              <p className="text-[8px] sm:text-[10px] font-bold text-white uppercase tracking-widest mb-1 sm:mb-2 opacity-80">Legenda NDVI</p>
                              <div className="space-y-1 sm:space-y-1.5">
                                <div className="flex items-center gap-1.5 sm:gap-2"><span className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-red-400 opacity-80"></span><span className="text-[10px] sm:text-xs text-white">0.0 - 0.3 (Stress/Solo)</span></div>
                                <div className="flex items-center gap-1.5 sm:gap-2"><span className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-yellow-400 opacity-80"></span><span className="text-[10px] sm:text-xs text-white">0.3 - 0.5 (Moderado)</span></div>
                                <div className="flex items-center gap-1.5 sm:gap-2"><span className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-green-400 opacity-80"></span><span className="text-[10px] sm:text-xs text-white">0.5 - 0.8 (Bom Vigor)</span></div>
                                <div className="flex items-center gap-1.5 sm:gap-2"><span className="w-2 h-2 sm:w-3 sm:h-3 rounded bg-[#166534] opacity-80"></span><span className="text-[10px] sm:text-xs text-white">0.8 - 1.0 (Muito Denso)</span></div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Minimalist Sensor Cards - Ultra Compact */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">

                        {/* NDVI Card */}
                        <div className="relative overflow-hidden bg-white dark:bg-neutral-900 p-4 md:p-5 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-white/5 group">
                          <div className="absolute -right-4 -top-4 text-gray-100 dark:text-[#151515] opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                            <Leaf size={100} />
                          </div>

                          <div className="relative z-10 flex flex-col justify-between h-full min-h-[110px]">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                                  <Activity size={14} strokeWidth={2.5} />
                                </div>
                                <span className="font-bold text-gray-400 uppercase tracking-widest text-[9px]">Vigor (NDVI)</span>
                              </div>
                              <span className="px-2 py-0.5 bg-gray-100 dark:bg-white/5 rounded-md text-[8px] font-black uppercase tracking-wide text-gray-500">
                                Satélite
                              </span>
                            </div>

                            <div>
                              <div className="flex justify-between items-end">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
                                    {field.history && field.history.length > 0 ? field.history[field.history.length - 1].ndvi.toFixed(2) : '0.86'}
                                  </span>
                                </div>
                                <button
                                  onClick={() => setShowNDVILayer(!showNDVILayer)}
                                  className={clsx(
                                    "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all",
                                    showNDVILayer
                                      ? "bg-green-600 text-white shadow-lg shadow-green-500/30"
                                      : "bg-gray-100 dark:bg-neutral-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-neutral-700"
                                  )}
                                >
                                  {showNDVILayer ? "Ocultar Satélite" : "Ver no Mapa"}
                                </button>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-md">
                                  <ShieldCheck size={10} /> Saudável
                                </span>
                                <span className="text-[8px] font-bold text-gray-400 uppercase">
                                  {showNDVILayer ? `Captura Sentinel-2: ${ndviDate}` : 'Estado Geral'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* IoT Devices Section */}
                      <div className="mt-6 space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dispositivos Conectados</h4>
                          <button
                            onClick={() => setShowAutomationHub(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          >
                            <Cpu size={14} strokeWidth={2.5} />
                            <span className="text-[10px] font-black uppercase tracking-wide">Configurar</span>
                          </button>
                        </div>

                        {field.sensors && field.sensors.length > 0 ? (
                          <div className="space-y-2">
                            {field.sensors.map((sensor) => (
                              <div key={sensor.id} className={clsx(
                                "bg-white dark:bg-neutral-900 border p-3 rounded-xl flex items-center justify-between shadow-sm transition-all duration-500",
                                focusedTarget?.id === sensor.id ? "border-red-500 ring-2 ring-red-500/20 bg-red-50/50 dark:bg-red-900/10 scale-[1.02]" : "border-gray-100 dark:border-white/5"
                              )}>
                                <div className="flex items-center gap-3">
                                  <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center",
                                    sensor.status === 'online' ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" : "bg-gray-100 text-gray-400 dark:bg-white/5"
                                  )}>
                                    {sensor.type === 'moisture' && <Droplets size={16} />}
                                    {sensor.type === 'weather' && <CloudSun size={16} />}
                                    {sensor.type === 'valve' && <Zap size={16} />}
                                    {sensor.type === 'camera' && <Camera size={16} />}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{sensor.name}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                                      <span className={clsx("w-1.5 h-1.5 rounded-full", sensor.status === 'online' ? "bg-green-500" : "bg-red-500")} />
                                      {sensor.status === 'online' ? 'Online' : 'Offline'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 text-gray-400">
                                  <span className="text-xs font-bold">{sensor.batteryLevel}%</span>
                                  <Battery size={14} className={sensor.batteryLevel < 20 ? "text-red-500" : ""} />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6 border border-dashed border-gray-200 dark:border-white/10 rounded-xl">
                            <p className="text-xs font-medium text-gray-400 italic">Nenhum dispositivo conectado.</p>
                          </div>
                        )}
                      </div>

                    </motion.div>
                  )}




                  {/* Gallery Tab */}
                  {activeTab === 'gallery' && (
                    <motion.div
                      key="gallery"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      {field.logs?.filter(l => l.attachments && l.attachments.length > 0).length === 0 ? (
                        <div className="text-center py-20 flex flex-col items-center justify-center opacity-50">
                          <ImageIcon size={48} className="mb-4 text-gray-300" />
                          <p className="font-bold text-gray-500">Sem evidências fotográficas.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {field.logs?.filter(l => l.attachments && l.attachments.length > 0).map(log => (
                            log.attachments?.map((img, idx) => (
                              <div key={`${log.id}-${idx}`} className="relative group aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700">
                                <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="evidence" />
                                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                  <p className="text-[10px] font-bold text-white/80 uppercase">{log.date}</p>
                                  <p className="text-xs font-bold text-white truncate">{log.productName || log.description}</p>
                                </div>
                              </div>
                            ))
                          ))}
                        </div>
                      )}
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

                        {/* EXPORT BUTTON */}
                        <div className="relative">
                          <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full border-4 border-[#FDFDF5] dark:border-[#0A0A0A] bg-gray-900 dark:bg-white text-white dark:text-black flex items-center justify-center z-10">
                            <FileCheck size={14} />
                          </div>
                          <button
                            onClick={handleExportDGAV}
                            className="w-full bg-gray-900 dark:bg-white text-white dark:text-black p-4 rounded-[1.5rem] shadow-lg active:scale-[0.99] transition-transform flex items-center justify-between group"
                          >
                            <div>
                              <h3 className="text-left font-black uppercase text-sm">Exportar Relatório DGAV</h3>
                              <p className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Caderno de Campo Digital</p>
                            </div>
                            <div className="w-10 h-10 bg-white/20 dark:bg-black/10 rounded-full flex items-center justify-center group-hover:rotate-[-10deg] transition-transform">
                              <FileText size={20} />
                            </div>
                          </button>
                        </div>
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

                                {log.attachments && log.attachments.length > 0 && (
                                  <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
                                    {log.attachments.map((img, i) => (
                                      <div key={i} className="w-20 h-20 shrink-0 rounded-xl overflow-hidden border border-gray-100 dark:border-neutral-700">
                                        <img src={img} className="w-full h-full object-cover" alt="evidence" />
                                      </div>
                                    ))}
                                  </div>
                                )}
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


                  {/* DIGITAL TWIN TAB */}
                  {activeTab === 'twin' && (
                    <motion.div
                      key="twin"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <IrrigationTwin
                        field={field}
                        forecast={detailedForecast}
                        onApplyIrrigation={() => onToggleIrrigation(field.id, true)}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'ai' && (
                    <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                      {/* Oriva AI Predictor Summary */}
                      <div className="bg-white dark:bg-neutral-900 mx-4 md:mx-auto max-w-2xl rounded-2xl p-4 mb-6 shadow-sm border border-gray-100 dark:border-white/5 flex items-center gap-4 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                          <Brain size={80} />
                        </div>

                        <div className={clsx(
                          "w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-white font-black text-lg md:text-2xl",
                          (diseaseRisk.level === 'Crítico' || diseaseRisk.level === 'Alto') ? "bg-red-500 shadow-red-500/30" :
                            diseaseRisk.level === 'Moderado' ? "bg-amber-500 shadow-amber-500/30" : "bg-emerald-500 shadow-emerald-500/30"
                        )}>
                          {diseaseRisk.percentage}%
                        </div>

                        <div className="flex-1 z-10">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-black uppercase text-xs md:text-sm text-gray-900 dark:text-white tracking-wide">Oriva AI Predictor</h3>
                            <span className={clsx("px-1.5 py-0.5 rounded text-[8px] font-bold uppercase text-white",
                              (diseaseRisk.level === 'Crítico' || diseaseRisk.level === 'Alto') ? "bg-red-500" :
                                diseaseRisk.level === 'Moderado' ? "bg-amber-500" : "bg-emerald-500"
                            )}>
                              {diseaseRisk.level}
                            </span>
                          </div>
                          <p className="text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-400 line-clamp-2 md:line-clamp-none">
                            {(diseaseRisk.level === 'Crítico' || diseaseRisk.level === 'Alto')
                              ? "Condições favoráveis ao desenvolvimento de fungos. Recomenda-se inspeção imediata."
                              : "Previsão indica estabilidade. Monitorização de rotina aconselhada."}
                          </p>
                        </div>
                      </div>

                      {/* Sub-Navigation */}
                      <div className="flex justify-center mb-6">
                        <div className="bg-gray-100 dark:bg-neutral-900 p-1 rounded-2xl inline-flex gap-1 border border-gray-200 dark:border-white/5">
                          <button
                            onClick={() => setAiMode('pests')}
                            className={clsx(
                              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all",
                              aiMode === 'pests' ? "bg-white dark:bg-neutral-800 text-agro-green shadow-sm" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            )}
                          >
                            Detetive de Pragas
                          </button>
                          <button
                            onClick={() => setAiMode('soil')}
                            className={clsx(
                              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all",
                              aiMode === 'soil' ? "bg-white dark:bg-neutral-800 text-blue-500 shadow-sm" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            )}
                          >
                            Scanner de Solo (OCR)
                          </button>
                        </div>
                      </div>

                      <AnimatePresence mode="wait">
                        {aiMode === 'pests' ? (
                          <motion.div key="pests" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                            <PestDetection
                              diseaseRisk={diseaseRisk}
                              onSaveDiagnostic={(diagnostic) => {
                                onAddLog(field.id, {
                                  date: new Date().toISOString().split('T')[0],
                                  type: 'observation',
                                  description: `Oriva Vision: ${diagnostic.disease?.name} detetado (${diagnostic.confidence}% conf.). Tratamento: ${diagnostic.disease?.treatment.immediate}`,
                                  operator: 'AI Engine',
                                  target: diagnostic.disease?.name,
                                  attachments: [] // Em sistema real, aqui iria a foto do scan
                                });
                                alert('Diagnóstico guardado no Caderno de Campo com sucesso!');
                              }}
                            />
                          </motion.div>
                        ) : (
                          <motion.div key="soil" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <SoilScanner
                              onSaveAnalysis={(result) => {
                                onAddLog(field.id, {
                                  date: new Date().toISOString().split('T')[0],
                                  type: 'observation',
                                  description: `Análise de Solo (OCR): N=${result.npk.n}, P=${result.npk.p}, K=${result.npk.k}, pH=${result.npk.ph}. Plano gerado.`,
                                  operator: 'Soil Scanner AI',
                                  target: 'Nutrientes do Solo',
                                  attachments: []
                                });
                                alert('Análise de Solo guardada com sucesso!');
                              }}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {activeTab === 'missions' && (
                    <motion.div
                      key="missions"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="h-[600px] overflow-hidden"
                    >
                      <MissionControl field={field} />
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

      <FieldRegistryModal
        isOpen={showRegistryModal}
        onClose={() => setShowRegistryModal(false)}
        type={registryType}
        field={field}
        stocks={stocks || []}
        employees={[
          { id: 'emp1', name: 'João Silva', role: 'Operador', hourlyRate: 8.50 },
          { id: 'emp2', name: 'Maria Santos', role: 'Eng. Agrónoma', hourlyRate: 25.00 },
          { id: 'emp3', name: 'Carlos Ferreira', role: 'Mecânico', hourlyRate: 15.00 }
        ]}
        onConfirm={(data: any) => onAddLog(field.id, data)}
      />
    </>
  );
};

export default FieldCard;