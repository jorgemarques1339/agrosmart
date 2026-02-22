
import React, { useState, useMemo } from 'react';
import {
   Bell, Settings, Wind, Droplets,
   Scan, Wallet, Tractor, Heart,
   Calendar, MapPin, Sun, Cloud,
   CloudRain, CloudLightning, ArrowRight, Activity,
   MoreHorizontal, CloudSun, X, Thermometer, SprayCan, ChevronRight,
   PawPrint, Leaf, Search, MessageSquare, Zap, Battery, Target, TrendingUp, Clock
} from 'lucide-react';
import clsx from 'clsx';
import {
   WeatherForecast, DetailedForecast, Task, Field, Machine,
   StockItem, UserProfile, MaintenanceLog, Animal, MarketPrice, FeedItem
} from '../types';
import { motion } from 'framer-motion';
import MarketPrices from './MarketPrices';
import FarmCopilot from './FarmCopilot';
import MorningBriefingModal from './MorningBriefingModal';
import CalendarModal from './CalendarModal';
import { calculateCarbonFootprint } from '../utils/carbonCalculator';
import { useStore } from '../store/useStore';

interface DashboardHomeProps {
   userName: string;
   weather: WeatherForecast[];
   hourlyForecast: DetailedForecast[];
   tasks: Task[];
   fields: Field[];
   machines: Machine[];
   stocks: StockItem[];
   users: UserProfile[];
   currentUser: UserProfile;
   animals: Animal[];
   onAddTask: (title: string, type: 'task' | 'harvest', date?: string, relatedFieldId?: string, relatedStockId?: string, plannedQuantity?: number, assignedTo?: string) => void;
   onUpdateTask: (id: string, updates: Partial<Task>) => void;
   onDeleteTask: (id: string) => void;
   onWeatherClick: () => void;
   onOpenSettings: () => void;
   onOpenNotifications: () => void;
   onUpdateMachineHours: (id: string, hours: number) => void;
   onAddMachineLog: (machineId: string, log: Omit<MaintenanceLog, 'id'>) => void;
   onNavigate: (tab: string) => void;
   feedItems: FeedItem[];
   hasUnreadFeed: boolean;
   alertCount: number;
   syncStatus: 'idle' | 'syncing' | 'error' | 'offline';
   lastSyncTime: string | null;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({
   userName,
   weather = [],
   hourlyForecast = [],
   tasks = [],
   fields = [],
   machines = [],
   stocks = [],
   animals = [],
   users = [],
   currentUser,
   onAddTask,
   onUpdateTask,
   onDeleteTask,
   onOpenSettings,
   onOpenNotifications,
   onNavigate,
   alertCount,
   feedItems = [],
   hasUnreadFeed = false,
   syncStatus = 'idle',
   lastSyncTime = null
}) => {
   const { setChildModalOpen, openModal } = useStore();
   const [scrolled, setScrolled] = useState(false); // New state for scroll

   // Estado para o Modal de Tempo
   const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
   const [weatherTab, setWeatherTab] = useState<'forecast' | 'spraying'>('forecast');

   // Estado para o Modal de Cotações
   const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);

   // Estado para o Modal de Consumo de Água
   const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);

   // Estado para o Modal de Morning Briefing
   const [isBriefingModalOpen, setIsBriefingModalOpen] = useState(false);

   // Estado para o Modal de Energia
   const [isEnergyModalOpen, setIsEnergyModalOpen] = useState(false);

   // Estado para o Modal de Calendário
   const [isCalendarOpen, setIsCalendarOpen] = useState(false);

   // Atualizar estado global de modal aberto (para esconder nav)
   React.useEffect(() => {
      setChildModalOpen(isWeatherModalOpen || isMarketModalOpen || isWaterModalOpen || isBriefingModalOpen || isEnergyModalOpen || isCalendarOpen);
      return () => setChildModalOpen(false);
   }, [isWeatherModalOpen, isMarketModalOpen, isWaterModalOpen, isBriefingModalOpen, isEnergyModalOpen, isCalendarOpen, setChildModalOpen]);

   // Handle scroll for top bar
   React.useEffect(() => {
      const handleScroll = () => {
         setScrolled(window.scrollY > 50);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
   }, []);

   // Weather Helper
   const currentWeather = weather.length > 0 ? weather[0] : null;

   const getWeatherIcon = (condition: string, size: number = 24) => {
      switch (condition) {
         case 'rain': return <CloudRain size={size} className="text-blue-300 drop-shadow-lg" />;
         case 'storm': return <CloudLightning size={size} className="text-purple-300 drop-shadow-lg" />;
         case 'cloudy': return <Cloud size={size} className="text-gray-200 drop-shadow-lg" />;
         case 'sunny': return <Sun size={size} className="text-yellow-300 drop-shadow-lg" />;
         default: return <CloudSun size={size} className="text-yellow-100 drop-shadow-lg" />;
      }
   };

   // Lógica de Pulverização (Baseada nas próximas horas)
   const sprayingConditions = useMemo(() => {
      return hourlyForecast.slice(0, 5).map(hour => {
         const date = new Date(hour.dt * 1000);
         const time = date.getHours() + ":00";

         let status: 'good' | 'warning' | 'bad' = 'good';
         let reason = 'Ideal';

         if (hour.rainProb > 50) {
            status = 'bad';
            reason = 'Chuva';
         } else if (hour.windSpeed > 15) {
            status = 'bad';
            reason = 'Vento Forte';
         } else if (hour.temp > 28) {
            status = 'warning';
            reason = 'Calor';
         } else if (hour.windSpeed > 10) {
            status = 'warning';
            reason = 'Vento Mod.';
         }

         return { time, status, reason, ...hour };
      });
   }, [hourlyForecast]);

   // Carbon Metrics Calculation
   const carbonMetrics = useMemo(() => {
      const fallback = {
         emissions: { fuel: 0, fertilizer: 0, total: 0 },
         sequestration: { crops: 0, soil: 0, total: 0 },
         netBalance: 0,
         potentialCredits: { amount: 0, value: 0 }
      };

      if (!fields || !machines) return fallback;

      try {
         const allLogs = fields.flatMap(f => f.logs || []);
         return calculateCarbonFootprint(machines, fields, allLogs);
      } catch (err) {
         console.error("Carbon calculation error:", err);
         return fallback;
      }
   }, [machines, fields]);

   const waterConsumption = useMemo(() => {
      // Mock calculation: average consumption per hectare
      const totalArea = fields.reduce((acc, f) => acc + f.areaHa, 0);
      return Math.round(totalArea * 4.5); // m3 per day estimate
   }, [fields]);

   const solarEnergy = useMemo(() => {
      if (!currentWeather) return 0;
      const condition = currentWeather.condition;
      const production = condition === 'sunny' ? 12.4 : condition === 'cloudy' ? 5.8 : 1.2;
      return production;
   }, [currentWeather]);

   const solarForecast = useMemo(() => {
      const now = new Date();
      const currentHour = now.getHours();

      return Array.from({ length: 12 }).map((_, i) => {
         const hour = (currentHour + i) % 24;
         // Solar peak around 13:00 - 15:00
         let factor = 0;
         if (hour >= 7 && hour <= 19) {
            factor = Math.sin((hour - 7) * Math.PI / 12);
         }

         const baseProduction = currentWeather?.condition === 'sunny' ? 15 : currentWeather?.condition === 'cloudy' ? 8 : 2;
         const production = Number((baseProduction * factor).toFixed(1));

         return { hour: `${hour}:00`, production };
      });
   }, [currentWeather]);

   // ── Tasks assigned to the current user that are still pending ─────────────
   const myPendingTaskCount = useMemo(() =>
      tasks.filter(t => t.assignedTo === currentUser?.id && !t.completed).length
      , [tasks, currentUser]);

   const tasksToReviewCount = useMemo(() =>
      currentUser.role === 'admin' ? tasks.filter(t => t.status === 'review').length : 0
      , [tasks, currentUser]);

   const energyInsights = useMemo(() => {
      const insights = [];
      const currentProd = solarEnergy;

      if (currentProd > 10) {
         insights.push({
            id: 'i1',
            type: 'irrigation',
            title: 'Excesso de Produção',
            description: 'Produção solar alta. Ideal para avançar rega da Parcela A.',
            priority: 'high',
            icon: <Droplets size={16} className="text-cyan-500" />
         });
      }

      if (currentProd > 5) {
         insights.push({
            id: 'i2',
            type: 'charge',
            title: 'Carga Recomendada',
            description: 'Otimize auto-consumo: Carregue o Trator T1 agora.',
            priority: 'medium',
            icon: <Battery size={16} className="text-emerald-500" />
         });
      } else {
         insights.push({
            id: 'i3',
            type: 'wait',
            title: 'Baixa Produção',
            description: 'Aguarde até às 11:00 para tarefas de alto consumo.',
            priority: 'low',
            icon: <Sun size={16} className="text-amber-500" />
         });
      }

      return insights;
   }, [solarEnergy]);

   const waterConsumptionByCrop = useMemo(() => {
      const breakdown: Record<string, { area: number, consumption: number }> = {};

      fields.forEach(f => {
         if (!breakdown[f.crop]) {
            breakdown[f.crop] = { area: 0, consumption: 0 };
         }
         breakdown[f.crop].area += f.areaHa;
         breakdown[f.crop].consumption += f.areaHa * 4.5;
      });

      // If no fields, provide example data
      if (fields.length === 0) {
         return [
            { crop: 'Vinha', area: 12.5, consumption: 56.2, isExample: true },
            { crop: 'Olival', area: 8.2, consumption: 36.9, isExample: true },
            { crop: 'Milho', area: 5.0, consumption: 22.5, isExample: true }
         ];
      }

      return Object.entries(breakdown).map(([crop, data]) => ({
         crop,
         area: data.area,
         consumption: Number(data.consumption.toFixed(1)),
         isExample: false
      })).sort((a, b) => b.consumption - a.consumption);
   }, [fields]);


   const containerVariants = {
      hidden: { opacity: 0 },
      show: {
         opacity: 1,
         transition: { staggerChildren: 0.1 }
      }
   } as const;

   const itemVariants = {
      hidden: { opacity: 0, y: 20 },
      show: {
         opacity: 1,
         y: 0,
         transition: { type: 'spring', stiffness: 300, damping: 24 } as const
      }
   } as const;

   return (
      <motion.div
         variants={containerVariants}
         initial="hidden"
         animate="show"
         className="space-y-6 sm:space-y-8 pb-28 pt-16 sm:pt-24"
      >

         {/* 1. HEADER: ORIVA SMART REDESIGN */}
         {/* TOP BAR */}
         <motion.div variants={itemVariants} className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur-md shadow-sm py-2' : 'bg-transparent py-4'}`}>
            <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 flex justify-between items-center">
               <div
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={onOpenSettings}
               >
                  <div className="relative">
                     <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-agro-green to-agro-yellow p-[2px] shadow-lg group-hover:scale-105 transition-transform">
                        <div className="w-full h-full rounded-full border-2 border-white dark:border-neutral-900 overflow-hidden">
                           <img src={`https://i.pravatar.cc/150?u=${currentUser.id}`} alt={userName} className="w-full h-full object-cover" />
                        </div>
                     </div>
                     <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-neutral-900 flex items-center justify-center">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                     </div>
                  </div>
                  <div className="flex flex-col">
                     <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white leading-none">
                        {userName}
                     </h2>
                     <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{currentUser.role === 'admin' ? 'Administrador' : 'Operador'}</span>
                  </div>
               </div>

               <div className="flex items-center gap-2">
                  <button
                     onClick={() => openModal('omniSearch')}
                     className={`p-1.5 sm:p-3 rounded-full transition-all flex items-center gap-2
                                ${scrolled ? 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300' : 'bg-white/40 dark:bg-white/20 backdrop-blur-md text-gray-900 dark:text-white shadow-lg'} hover:scale-105`}
                  >
                     <Search size={18} strokeWidth={2.5} className="sm:w-5 sm:h-5" />
                     <span className={`text-[10px] font-black tracking-wider uppercase hidden sm:block ${scrolled ? 'text-gray-500' : 'text-gray-900 dark:text-white/80'}`}>Procurar</span>
                  </button>

                  <button
                     onClick={onOpenSettings}
                     className={`relative p-1.5 sm:p-3 rounded-full transition-all flex items-center gap-2
                                ${scrolled ? 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300' : 'bg-white/40 dark:bg-white/20 backdrop-blur-md text-gray-900 dark:text-white shadow-lg'} hover:scale-105`}
                     title={`Sincronização: ${syncStatus}`}
                  >
                     <div className="relative">
                        <Cloud size={18} strokeWidth={2.5} className={clsx("sm:w-[22px] sm:h-[22px]", syncStatus === 'syncing' && "animate-pulse text-indigo-500")} />
                        {syncStatus === 'syncing' && (
                           <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-full h-full rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                           </div>
                        )}
                        {syncStatus === 'offline' && (
                           <div className="absolute -top-1 -right-1 bg-gray-500 text-white rounded-full p-0.5 border border-white dark:border-neutral-900">
                              <X size={6} />
                           </div>
                        )}
                     </div>
                     {syncStatus === 'syncing' && (
                        <span className="text-[8px] font-black uppercase tracking-tighter hidden lg:block animate-pulse">A Sincronizar...</span>
                     )}
                  </button>

                  <button
                     onClick={onOpenNotifications}
                     className={`relative p-1.5 sm:p-3 rounded-full transition-all
                                ${scrolled ? 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300' : 'bg-white/40 dark:bg-white/20 backdrop-blur-md text-gray-900 dark:text-white shadow-lg'} hover:scale-105`}
                     title="Alertas"
                  >
                     <Bell size={18} strokeWidth={2.5} className="sm:w-6 sm:h-6" />
                     {alertCount > 0 && (
                        <span className={`absolute top-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-white dark:border-neutral-900 ${alertCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-red-500'}`} />
                     )}
                  </button>



                  <button
                     onClick={onOpenSettings}
                     className={`relative p-1.5 sm:p-3 rounded-full transition-all
                                ${scrolled ? 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300' : 'bg-white/40 dark:bg-white/20 backdrop-blur-md text-gray-900 dark:text-white shadow-lg'} hover:scale-105`}
                     title="Definições"
                  >
                     <Settings size={18} strokeWidth={2.5} className="sm:w-[22px] sm:h-[22px]" />
                  </button>
               </div>
            </div>
         </motion.div>

         {/* 2. WEATHER HERO (Compact Version) */}
         {currentWeather && (
            <motion.div
               variants={itemVariants}
               onClick={() => setIsWeatherModalOpen(true)}
               className="relative h-32 sm:h-48 mx-2 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl group transition-all hover:scale-[1.01] cursor-pointer"
            >
               {/* Background Image */}
               <img
                  src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1932&auto=format&fit=crop"
                  alt="Field"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
               />

               {/* Glass Overlay - Inset 1.5 padding 3 on mobile */}
               <div className="absolute inset-1.5 sm:inset-2 bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-[1.5rem] sm:rounded-[2rem] border border-white/20 p-3 sm:p-4 flex flex-col justify-between shadow-inner">

                  {/* Top Row */}
                  <div className="flex justify-between items-start">
                     <div className="bg-black/20 backdrop-blur-md px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full border border-white/10 flex items-center gap-1.5 sm:gap-2">
                        <MapPin size={10} className="text-white" />
                        <span className="text-[8px] sm:text-[9px] font-black text-white uppercase tracking-widest">Laundos, PT</span>
                     </div>
                     <div className="filter drop-shadow-2xl animate-pulse-slow origin-top-right scale-75 sm:scale-100 -mt-2 -mr-2 sm:mt-0 sm:mr-0">
                        {getWeatherIcon(currentWeather.condition, 52)}
                     </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex items-end justify-between">
                     <div>
                        <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter leading-none block drop-shadow-md">
                           {currentWeather.temp}°
                        </span>
                        <span className="text-[10px] sm:text-xs font-bold text-white/80 pl-1 uppercase tracking-wide flex items-center gap-1 mt-1 sm:mt-0">
                           {currentWeather.condition === 'sunny' ? 'Céu Limpo' : currentWeather.condition === 'rain' ? 'Chuva' : 'Nublado'}
                           <ChevronRight size={10} className="sm:w-3 sm:h-3" />
                        </span>
                     </div>

                     <div className="flex gap-2 sm:gap-3">
                        <div className="flex flex-col items-center">
                           <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center mb-0.5 sm:mb-1">
                              <Wind size={12} className="sm:w-[14px] sm:h-[14px] text-white" />
                           </div>
                           <span className="text-[8px] sm:text-[9px] font-bold text-white">{currentWeather.windSpeed}km/h</span>
                        </div>
                        <div className="flex flex-col items-center">
                           <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/20 flex items-center justify-center mb-0.5 sm:mb-1">
                              <Droplets size={12} className="sm:w-[14px] sm:h-[14px] text-white" />
                           </div>
                           <span className="text-[8px] sm:text-[9px] font-bold text-white">{currentWeather.humidity}%</span>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
         )}

         {/* 3. QUICK ACTIONS (Glow Pill Style) */}
         <motion.div variants={itemVariants} className="px-2">
            <div className="flex flex-row gap-3 px-1 pb-4">

               {/* Button 1: Cotações (Red-Orange Glow) */}
               <button
                  onClick={() => setIsMarketModalOpen(true)}
                  className="flex-1 py-4 rounded-full bg-gradient-to-r from-red-400 to-orange-400 text-white font-bold text-sm shadow-[0_10px_20px_rgba(248,113,113,0.4)] active:scale-95 transition-all duration-200 flex items-center justify-center"
               >
                  Cotações
               </button>

               {/* Button 2: Feed (Dynamic State) */}
               <button
                  onClick={() => onNavigate('feed')}
                  className={`flex-1 py-4 rounded-full font-bold text-sm active:scale-95 transition-all duration-200 relative overflow-hidden flex items-center justify-center gap-2
                    ${hasUnreadFeed
                        ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-[0_10px_20px_rgba(239,68,68,0.4)]'
                        : 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-[0_10px_20px_rgba(129,140,248,0.4)]'
                     }`}
               >
                  {hasUnreadFeed && (
                     <span className="absolute inset-0 bg-white/20 animate-pulse" />
                  )}
                  <MessageSquare size={16} strokeWidth={2.5} className={hasUnreadFeed ? 'animate-bounce' : ''} />
                  Feed
                  {hasUnreadFeed && (
                     <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-neutral-900 animate-ping" />
                  )}
               </button>

               {/* Button 3: Tarefas — pulses amber when worker has assigned tasks or admin has reviews */}
               <button
                  onClick={() => setIsCalendarOpen(true)}
                  className={clsx(
                     'relative flex-1 py-4 rounded-full text-white font-bold text-sm active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden',
                     (myPendingTaskCount > 0 || tasksToReviewCount > 0)
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_10px_24px_rgba(251,191,36,0.5)] animate-bounce'
                        : 'bg-gradient-to-r from-emerald-400 to-green-500 shadow-[0_10px_20px_rgba(52,211,153,0.4)]'
                  )}
               >
                  {/* Radial pulse overlay when alert */}
                  {(myPendingTaskCount > 0 || tasksToReviewCount > 0) && (
                     <span className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                  )}
                  <Calendar size={15} strokeWidth={2.5} className={(myPendingTaskCount > 0 || tasksToReviewCount > 0) ? 'animate-bounce' : ''} />
                  Tarefas
                  {/* Badge counter */}
                  {(myPendingTaskCount > 0 || tasksToReviewCount > 0) && (
                     <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-600 border-2 border-white dark:border-neutral-900 rounded-full text-[10px] font-black flex items-center justify-center shadow-md">
                        {myPendingTaskCount + tasksToReviewCount}
                     </span>
                  )}
               </button>

            </div>
         </motion.div>

         {/* --- FARM COPILOT (AI INSIGHTS) --- */}
         <FarmCopilot
            userName={userName}
            weather={weather}
            hourlyForecast={hourlyForecast}
            tasks={tasks}
            users={users}
            machines={machines}
            fields={fields}
            alertCount={alertCount}
            onNavigate={onNavigate}
            onOpenWeather={() => setIsWeatherModalOpen(true)}
            onOpenBriefing={() => setIsBriefingModalOpen(true)}
         />

         <motion.div variants={itemVariants} className="px-2">
            <h3 className="text-lg font-black italic text-gray-900 dark:text-white mb-2 ml-2">Estado da Quinta</h3>

            <div className="bg-white dark:bg-neutral-900 rounded-[2rem] p-4 shadow-sm border border-gray-100 dark:border-neutral-800 grid grid-cols-3 divide-x divide-gray-100 dark:divide-neutral-800">

               {/* Col 1: Water Consumption */}
               <div
                  onClick={() => setIsWaterModalOpen(true)}
                  className="flex flex-col items-center justify-center gap-2 group cursor-pointer active:opacity-60 transition-opacity"
               >
                  <div className="text-cyan-500 transition-transform group-hover:scale-110 duration-300">
                     <Droplets size={24} strokeWidth={2.5} />
                  </div>
                  <div className="text-center px-1">
                     <span className="block text-base sm:text-lg font-black text-gray-900 dark:text-white leading-none mb-1">
                        {waterConsumption}m³
                     </span>
                     <span className="text-[7px] sm:text-[8px] font-bold text-gray-400 uppercase tracking-wide leading-tight block">Água</span>
                  </div>
               </div>

               {/* Col 2: Solar Energy Production */}
               <div
                  onClick={() => setIsEnergyModalOpen(true)}
                  className="flex flex-col items-center justify-center gap-2 group cursor-pointer active:opacity-60 transition-opacity"
               >
                  <div className="text-amber-500 transition-transform group-hover:scale-110 duration-300">
                     <Zap size={24} strokeWidth={2.5} />
                  </div>
                  <div className="text-center px-1">
                     <span className="block text-base sm:text-lg font-black text-gray-900 dark:text-white leading-none mb-1">
                        {solarEnergy}kW
                     </span>
                     <span className="text-[7px] sm:text-[8px] font-bold text-gray-400 uppercase tracking-wide leading-tight block">Energia</span>
                  </div>
               </div>

               {/* Col 3: Carbon ESG */}
               <div
                  onClick={() => onNavigate('carbon')}
                  className="flex flex-col items-center justify-center gap-2 group cursor-pointer active:opacity-60 transition-opacity"
               >
                  <div className="text-emerald-500 transition-transform group-hover:scale-110 duration-300">
                     <Leaf size={24} strokeWidth={2.5} />
                  </div>
                  <div className="text-center px-1">
                     <span className="block text-base sm:text-lg font-black text-gray-900 dark:text-white leading-none mb-1">
                        {Math.abs(carbonMetrics.netBalance)}t
                     </span>
                     <span className="text-[7px] sm:text-[8px] font-bold text-gray-400 uppercase tracking-wide leading-tight block">
                        CO₂
                     </span>
                  </div>
               </div>

            </div>
         </motion.div>


         {/* --- WEATHER MODAL --- */}
         {
            isWeatherModalOpen && (
               <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4" onClick={() => setIsWeatherModalOpen(false)}>
                  <div
                     className="bg-[#FDFDF5] dark:bg-[#0A0A0A] w-full max-w-sm h-[80vh] flex flex-col rounded-[2.5rem] shadow-2xl animate-scale-up border border-white/20"
                     onClick={e => e.stopPropagation()}
                  >
                     {/* Header */}
                     <div className="flex justify-between items-center px-6 pt-6 pb-4">
                        <div>
                           <h3 className="text-xl font-black dark:text-white">Meteorologia</h3>
                           <p className="text-xs font-bold text-gray-400 uppercase">Suporte à Decisão</p>
                        </div>
                        <button onClick={() => setIsWeatherModalOpen(false)} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                           <X size={20} className="dark:text-white" />
                        </button>
                     </div>

                     {/* Tab Selector */}
                     <div className="px-6 mb-4">
                        <div className="flex bg-gray-100 dark:bg-neutral-800 p-1 rounded-2xl">
                           <button
                              onClick={() => setWeatherTab('forecast')}
                              className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wide transition-all ${weatherTab === 'forecast' ? 'bg-white dark:bg-neutral-700 shadow text-agro-green dark:text-white' : 'text-gray-400'
                                 }`}
                           >
                              Previsão
                           </button>
                           <button
                              onClick={() => setWeatherTab('spraying')}
                              className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-1 ${weatherTab === 'spraying' ? 'bg-white dark:bg-neutral-700 shadow text-blue-500 dark:text-blue-400' : 'text-gray-400'
                                 }`}
                           >
                              <SprayCan size={14} /> Pulverização
                           </button>
                        </div>
                     </div>

                     {/* Content */}
                     <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">

                        {/* TAB: FORECAST */}
                        {weatherTab === 'forecast' && (
                           <div className="space-y-3">
                              {weather.map((day, idx) => (
                                 <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-neutral-800/50 rounded-2xl border border-gray-100 dark:border-neutral-800">
                                    <div className="flex items-center gap-4">
                                       <div className="flex flex-col">
                                          <span className="font-bold text-gray-900 dark:text-white text-sm">{day.day}</span>
                                          <span className="text-[10px] text-gray-400 font-bold uppercase">{day.description || 'Parcial'}</span>
                                       </div>
                                       {getWeatherIcon(day.condition, 24)}
                                    </div>
                                    <div className="flex items-center gap-4">
                                       <div className="text-right">
                                          <div className="flex items-center gap-1 justify-end text-[10px] text-gray-400 font-bold">
                                             <Wind size={10} /> {day.windSpeed} km/h
                                          </div>
                                          <div className="flex items-center gap-1 justify-end text-[10px] text-gray-400 font-bold">
                                             <Droplets size={10} /> {day.humidity}%
                                          </div>
                                       </div>
                                       <span className="font-black text-xl dark:text-white w-8 text-right">{day.temp}°</span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}

                        {/* TAB: SPRAYING */}
                        {weatherTab === 'spraying' && (
                           <div className="space-y-4">
                              <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                 <p className="text-xs text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                                    <span className="font-bold">Nota:</span> Janela ideal: Vento &lt; 10km/h, Temp &lt; 25°C, Sem chuva.
                                 </p>
                              </div>

                              <div className="space-y-3">
                                 {sprayingConditions.length === 0 ? (
                                    <div className="text-center py-8 opacity-50">
                                       <p className="text-sm font-bold text-gray-400">Sem dados horários disponíveis.</p>
                                    </div>
                                 ) : (
                                    sprayingConditions.map((slot, idx) => (
                                       <div key={idx} className="flex items-center gap-3 p-4 bg-white dark:bg-neutral-800/50 rounded-2xl relative overflow-hidden border border-gray-100 dark:border-neutral-800">
                                          {/* Status Indicator Strip */}
                                          <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${slot.status === 'good' ? 'bg-green-500' :
                                             slot.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                                             }`}></div>

                                          <div className="flex flex-col items-center min-w-[50px]">
                                             <span className="text-lg font-black text-gray-900 dark:text-white">{slot.time}</span>
                                          </div>

                                          <div className="flex-1 min-w-0">
                                             <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${slot.status === 'good' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                                   slot.status === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                   }`}>
                                                   {slot.status === 'good' ? 'Recomendado' : slot.status === 'warning' ? 'Atenção' : 'Não Recomendado'}
                                                </span>
                                             </div>
                                             <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium">{slot.reason}</p>
                                          </div>

                                          <div className="text-right">
                                             <div className="flex items-center gap-1 justify-end text-[10px] font-bold text-gray-400">
                                                <Wind size={10} /> {slot.windSpeed}km/h
                                             </div>
                                             <div className="flex items-center gap-1 justify-end text-[10px] font-bold text-gray-400">
                                                <Thermometer size={10} /> {slot.temp}°
                                             </div>
                                          </div>
                                       </div>
                                    ))
                                 )}
                              </div>
                           </div>
                        )}

                     </div>
                  </div>
               </div>
            )
         }
         {/* --- MARKET PRICES MODAL --- */}
         {
            isMarketModalOpen && (
               <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4" onClick={() => setIsMarketModalOpen(false)}>
                  <div
                     className="bg-[#FDFDF5] dark:bg-[#0A0A0A] w-full max-w-sm h-[85vh] flex flex-col rounded-[2.5rem] shadow-2xl animate-scale-up border border-white/20 overflow-hidden"
                     onClick={e => e.stopPropagation()}
                  >
                     <MarketPrices onClose={() => setIsMarketModalOpen(false)} stocks={stocks} />
                  </div>
               </div>
            )
         }

         {/* --- WATER CONSUMPTION MODAL --- */}
         {isWaterModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4" onClick={() => setIsWaterModalOpen(false)}>
               <div
                  className="bg-[#FDFDF5] dark:bg-[#0A0A0A] w-full max-w-sm flex flex-col rounded-[2.5rem] shadow-2xl animate-scale-up border border-white/20 overflow-hidden"
                  onClick={e => e.stopPropagation()}
               >
                  {/* Header */}
                  <div className="p-6 pb-2">
                     <div className="flex justify-between items-start mb-4">
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-black dark:text-white">Consumo Hídrico</h3>
                              {waterConsumptionByCrop[0]?.isExample && (
                                 <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">Exemplo</span>
                              )}
                           </div>
                           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Análise por Cultivo</p>
                        </div>
                        <button onClick={() => setIsWaterModalOpen(false)} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full active:scale-90 transition-transform">
                           <X size={20} className="dark:text-white" />
                        </button>
                     </div>

                     <div className="bg-cyan-50 dark:bg-cyan-900/10 p-4 rounded-3xl border border-cyan-100 dark:border-cyan-900/30 mb-6">
                        <div className="flex justify-between items-end">
                           <div>
                              <span className="text-3xl font-black text-cyan-600 dark:text-cyan-400 tracking-tighter leading-none">
                                 {waterConsumption}m³
                              </span>
                              <span className="text-[10px] font-bold text-cyan-500/60 uppercase tracking-widest block mt-1">Total Diário Estimado</span>
                           </div>
                           <Droplets size={32} className="text-cyan-500/20" />
                        </div>
                     </div>
                  </div>

                  {/* List Content */}
                  <div className="flex-1 overflow-y-auto px-6 pb-8 custom-scrollbar space-y-3">
                     {waterConsumptionByCrop.map((item, idx) => {
                        const maxConsumption = Math.max(...waterConsumptionByCrop.map(i => i.consumption));
                        const percentage = (item.consumption / maxConsumption) * 100;

                        return (
                           <div key={idx} className="bg-white dark:bg-neutral-800/40 p-4 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                              <div className="flex justify-between items-start mb-3">
                                 <div>
                                    <h4 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-tight">{item.crop}</h4>
                                    <span className="text-[10px] font-bold text-gray-400">{item.area} Hectares</span>
                                 </div>
                                 <div className="text-right">
                                    <span className="block font-black text-gray-900 dark:text-white leading-none">{item.consumption}m³</span>
                                    <span className="text-[9px] font-bold text-gray-400 tracking-tighter uppercase mt-1 block">p/ dia</span>
                                 </div>
                              </div>

                              {/* Small Progress Bar */}
                              <div className="h-1.5 w-full bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                 <div
                                    className="h-full bg-cyan-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${percentage}%` }}
                                 />
                              </div>
                           </div>
                        );
                     })}
                  </div>

                  {/* Footer Advice */}
                  <div className="p-6 bg-gray-50 dark:bg-neutral-900/50 border-t border-gray-100 dark:border-neutral-800">
                     <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium text-center italic">
                        "Estes valores são estimativas baseadas nos coeficientes de evapotranspiração médios para a sua região."
                     </p>
                  </div>
               </div>
            </div>
         )}


         {/* --- ENERGY MONITORING MODAL --- */}
         {isEnergyModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4 sm:p-6 md:p-10" onClick={() => setIsEnergyModalOpen(false)}>
               <div
                  className="bg-[#FDFDF5] dark:bg-[#0A0A0A] w-full max-w-sm md:max-w-2xl h-[85vh] md:h-auto md:max-h-[90vh] flex flex-col rounded-[2.5rem] shadow-2xl animate-scale-up border border-white/20 overflow-hidden"
                  onClick={e => e.stopPropagation()}
               >
                  {/* Header */}
                  <div className="p-6 md:p-8 pb-2 md:pb-4">
                     <div className="flex justify-between items-start mb-4 md:mb-6">
                        <div>
                           <h3 className="text-xl md:text-2xl font-black dark:text-white">Autoconsumo Solar</h3>
                           <p className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest">Otimização Energética</p>
                        </div>
                        <button onClick={() => setIsEnergyModalOpen(false)} className="p-2 md:p-3 bg-gray-100 dark:bg-neutral-800 rounded-full active:scale-90 transition-transform">
                           <X size={20} className="dark:text-white md:w-6 md:h-6" />
                        </button>
                     </div>

                     <div className="bg-amber-50 dark:bg-amber-900/10 p-5 md:p-8 rounded-3xl border border-amber-100 dark:border-amber-900/30 mb-6 relative overflow-hidden group">
                        <div className="relative z-10 flex justify-between items-end">
                           <div>
                              <span className="text-4xl md:text-6xl font-black text-amber-600 dark:text-amber-400 tracking-tighter leading-none block">
                                 {solarEnergy}kW
                              </span>
                              <span className="text-[10px] md:text-xs font-bold text-amber-500/80 uppercase tracking-widest block mt-1 md:mt-2 flex items-center gap-1">
                                 <Sun size={12} className="animate-spin-slow" /> Produção Atual
                              </span>
                           </div>
                           <div className="flex flex-col items-end">
                              <span className="text-xs md:text-sm font-black text-amber-600/60 uppercase">Eficiência</span>
                              <span className="text-lg md:text-2xl font-black text-amber-600">94%</span>
                           </div>
                        </div>
                        <Zap size={100} className="absolute -right-4 -bottom-4 text-amber-500/10 -rotate-12 transition-transform group-hover:scale-110 duration-700 md:w-40 md:h-40" />
                     </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-8 custom-scrollbar space-y-8 md:space-y-12">

                     {/* 1. Production Forecast Chart (Simple CSS) */}
                     <section>
                        <div className="flex items-center justify-between mb-4 md:mb-6">
                           <h4 className="text-[10px] md:text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                              <Clock size={14} /> Previsão 12h
                           </h4>
                        </div>
                        <div className="flex items-end justify-between h-24 md:h-40 gap-1 md:gap-2 px-1">
                           {solarForecast.map((item, idx) => {
                              const maxProd = Math.max(...solarForecast.map(f => f.production));
                              const height = (item.production / maxProd) * 100;
                              const isCurrent = idx === 0;

                              return (
                                 <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div className="w-full relative flex items-end justify-center h-full">
                                       <div
                                          className={`w-full rounded-t-lg transition-all duration-1000 ${isCurrent ? 'bg-amber-500' : 'bg-amber-200 dark:bg-amber-900/30 group-hover:bg-amber-300'}`}
                                          style={{ height: `${height}%` }}
                                       />
                                    </div>
                                    <span className={`text-[7px] md:text-[9px] font-bold ${isCurrent ? 'text-amber-600' : 'text-gray-400'}`}>
                                       {item.hour.split(':')[0]}
                                    </span>
                                 </div>
                              );
                           })}
                        </div>
                     </section>

                     {/* 2. Proactive Insights (Smart Recommendations) */}
                     <section className="space-y-4 md:space-y-6">
                        <div className="flex items-center justify-between">
                           <h4 className="text-[10px] md:text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                              <Target size={14} /> Sugestões de Otimização
                           </h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                           {energyInsights.map((insight) => (
                              <div
                                 key={insight.id}
                                 className={`p-4 md:p-6 rounded-3xl border animate-slide-up flex gap-4 items-start ${insight.priority === 'high'
                                    ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30 shadow-sm shadow-emerald-500/10'
                                    : 'bg-white dark:bg-neutral-800/40 border-gray-100 dark:border-neutral-800'
                                    }`}
                              >
                                 <div className={`p-2 md:p-3 rounded-2xl ${insight.priority === 'high' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-neutral-800'
                                    }`}>
                                    {insight.icon}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <h5 className="font-black text-gray-900 dark:text-white text-xs md:text-sm uppercase tracking-tight mb-0.5">
                                       {insight.title}
                                    </h5>
                                    <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                                       {insight.description}
                                    </p>
                                 </div>
                                 <button className="p-1.5 md:p-2 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-400 hover:text-agro-green transition-colors">
                                    <ArrowRight size={16} />
                                 </button>
                              </div>
                           ))}
                        </div>
                     </section>

                     {/* 3. Potential Savings Card */}
                     <div className="bg-indigo-600 rounded-3xl p-5 md:p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                        <div className="relative z-10">
                           <div className="flex items-center gap-2 mb-3">
                              <Activity size={18} className="text-indigo-200" />
                              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-indigo-100">Impacto Mensal</span>
                           </div>
                           <h4 className="text-2xl md:text-4xl font-black mb-1 md:mb-2">Poupança de 240€</h4>
                           <p className="text-[10px] md:text-sm font-medium text-indigo-100 leading-relaxed max-w-[80%]">
                              Ao otimizar a rega para janelas solares, reduziu a dependência da rede em 35% este mês.
                           </p>
                        </div>
                        <TrendingUp size={120} className="absolute -right-6 -bottom-6 text-white/10 -rotate-6 group-hover:rotate-0 transition-transform duration-700 md:w-48 md:h-48" />
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* --- CALENDAR MODAL --- */}
         <CalendarModal
            isOpen={isCalendarOpen}
            onClose={() => setIsCalendarOpen(false)}
            tasks={tasks}
            fields={fields}
            animals={animals}
            users={users}
            currentUser={currentUser}
            onNavigate={onNavigate}
            onAddTask={onAddTask}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
         />

         {/* --- MORNING BRIEFING MODAL --- */}
         <MorningBriefingModal
            isOpen={isBriefingModalOpen}
            onClose={() => setIsBriefingModalOpen(false)}
            userName={userName}
            machines={machines}
            fields={fields}
            users={users}
            onNavigate={onNavigate}
         />
      </motion.div>
   );
};

export default DashboardHome;