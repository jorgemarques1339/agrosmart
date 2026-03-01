
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
   Bell, Settings, Wind, Droplets,
   Scan, Wallet, Tractor, Heart,
   Calendar, MapPin, Sun, Cloud,
   CloudRain, CloudLightning, ArrowRight, Activity,
   MoreHorizontal, CloudSun, X, Thermometer, SprayCan, ChevronRight,
   PawPrint, Leaf, Search, MessageSquare, Zap, Battery, Target, TrendingUp, Clock, CheckCircle, Loader2, Network
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
   WeatherForecast, DetailedForecast, Task, Field, Machine,
   StockItem, UserProfile, MaintenanceLog, Animal, MarketPrice, FeedItem
} from '../../types';
import { motion, AnimatePresence, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { useParallax3D } from '../../hooks/useParallax3D';
import { haptics } from '../../utils/haptics';

import { Dialog, DialogHeader, DialogTitle, DialogClose, DialogContent } from '../../components/ui/Dialog';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/Tabs';

import MarketPrices from '../finance/MarketPrices';
// Lazy Loaded Modals and Subcomponents
const FarmCopilot = React.lazy(() => import('./FarmCopilot'));
const MorningBriefingModal = React.lazy(() => import('./MorningBriefingModal'));
const CalendarModal = React.lazy(() => import('../../components/CalendarModal'));
const CheckInModal = React.lazy(() => import('../team/CheckInModal'));
const CollaborativeNetworkModal = React.lazy(() => import('./CollaborativeNetworkModal'));
const DashboardModals = React.lazy(() => import('./components/DashboardModals').then(module => ({ default: module.DashboardModals })));
import { WeatherHero } from './components/WeatherHero';
import { QuickActions } from './components/QuickActions';
import { KpiGrid } from './components/KpiGrid';
import { calculateCarbonFootprint } from '../../utils/carbonCalculator';
import { useStore } from '../../store/useStore';

interface DashboardHomeProps { }

const DashboardHome: React.FC<DashboardHomeProps> = () => {
   const setChildModalOpen = useStore(state => state.setChildModalOpen);
   const openModal = useStore(state => state.openModal);
   const weather = useStore(state => state.weatherData) || [];
   const hourlyForecast = useStore(state => state.detailedForecast) || [];
   const tasks = useStore(state => state.tasks) || [];
   const fields = useStore(state => state.fields) || [];
   const machines = useStore(state => state.machines) || [];
   const stocks = useStore(state => state.stocks) || [];
   const animals = useStore(state => state.animals) || [];
   const users = useStore(state => state.users) || [];
   const currentUserId = useStore(state => state.currentUserId);
   const feedItems = useStore(state => state.feedItems) || [];
   const hasUnreadFeed = useStore(state => state.hasUnreadFeed) || false;
   const syncStatus = useStore(state => state.syncStatus) || 'idle';
   const lastSyncTime = useStore(state => state.lastSyncTime) || null;
   const activeSession = useStore(state => state.activeSession) || null;
   const startSession = useStore(state => state.startSession);
   const endSession = useStore(state => state.endSession);

   const addTask = useStore(state => state.addTask);
   const updateTask = useStore(state => state.updateTask);
   const deleteTask = useStore(state => state.deleteTask);
   const updateMachine = useStore(state => state.updateMachine);
   const addTransaction = useStore(state => state.addTransaction);

   const navigate = useNavigate();

   const currentUser = useMemo(() => {
      if (!users) return { id: 'guest', name: 'Convidado', role: 'operator', avatar: 'C' } as UserProfile;
      return users.find(u => u && u.id === currentUserId) || { id: 'guest', name: 'Convidado', role: 'operator', avatar: 'C' } as UserProfile;
   }, [users, currentUserId]);
   const userName = currentUser.name;

   const alertCount = useMemo(() => {
      let count = 0;
      if (weather.length > 0 && (weather[0].condition === 'rain' || weather[0].condition === 'storm')) count++;
      count += animals.filter(a => a.status === 'sick').length;
      count += fields.filter(f => f.humidity < 30 || f.healthScore < 70).length;
      count += stocks.filter(s => s.quantity <= s.minStock).length;
      return count;
   }, [weather, animals, fields, stocks]);

   const onNavigate = useCallback((tab: string) => {
      if (tab === 'team') openModal('teamManager');
      else if (tab === 'feed') openModal('fieldFeed');
      else navigate(`/${tab}`);
   }, [navigate, openModal]);

   const onOpenSettings = () => openModal('settings');
   const onOpenNotifications = () => openModal('notificationCenter');
   const onWeatherClick = () => openModal('notifications');

   const onAddTask = useCallback((title: string, priority: string, date?: string, assignee?: string) => {
      addTask({ id: Date.now().toString(), title, priority, type: 'task', date, assignedTo: assignee, status: 'pending', completed: false } as any);
   }, [addTask]);

   const onUpdateMachineHours = useCallback((id: string, hours: number) => {
      updateMachine(id, { engineHours: hours });
   }, [updateMachine]);

   const onAddMachineLog = useCallback((id: string, log: any) => {
      const machine = machines.find(m => m.id === id);
      if (!machine) return;
      const stressIncrease = log.workIntensity === 'heavy' ? 15 : log.workIntensity === 'standard' ? 5 : 0;
      const newStress = Math.min((machine.stressLevel || 0) + stressIncrease, 100);
      const logId = Date.now().toString();

      updateMachine(id, {
         logs: [...(machine.logs || []), { ...log, id: logId }],
         stressLevel: newStress
      });

      if (log.cost > 0) {
         addTransaction({
            id: `tx-maint-${logId}`,
            date: log.date,
            type: 'expense',
            amount: log.cost,
            category: 'Manutenção',
            description: `Manutenção: ${machine.name} - ${log.description}`
         });
      }
   }, [machines, updateMachine, addTransaction]);
   const [scrolled, setScrolled] = useState(false); // New state for scroll

   // Pull to Refresh State (Framer Motion Native Gestures)
   const [isRefreshing, setIsRefreshing] = useState(false);
   const y = useMotionValue(0);
   const pullY = useSpring(y, { stiffness: 400, damping: 30 });
   const pullOpacity = useTransform(pullY, [0, 80], [0, 1]);
   const startY = useRef(0);
   const isDragging = useRef(false);

   const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
      if (window.scrollY === 0) {
         startY.current = 'touches' in e ? e.touches[0].clientY : e.clientY;
         isDragging.current = true;
      }
   }, []);

   const handleTouchMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
      if (isDragging.current && startY.current > 0 && window.scrollY === 0 && !isRefreshing) {
         const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY;
         const delta = currentY - startY.current;
         if (delta > 0) {
            y.set(Math.min(delta * 0.4, 120)); // Apple-like Resistance
         }
      }
   }, [isRefreshing, y]);

   const handleTouchEnd = useCallback(() => {
      if (y.get() > 80 && !isRefreshing) {
         setIsRefreshing(true);
         y.set(80);
         haptics.success();
         // Simulate sync
         setTimeout(() => {
            setIsRefreshing(false);
            y.set(0);
         }, 1500);
      } else if (!isRefreshing) {
         y.set(0);
      }
      startY.current = 0;
      isDragging.current = false;
   }, [isRefreshing, y]);

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
   const [isCheckInOpen, setIsCheckInOpen] = useState(false);
   const [isCollaborativeModalOpen, setIsCollaborativeModalOpen] = useState(false);

   // Atualizar estado global de modal aberto (para esconder nav)
   React.useEffect(() => {
      setChildModalOpen(isWeatherModalOpen || isMarketModalOpen || isWaterModalOpen || isBriefingModalOpen || isEnergyModalOpen || isCalendarOpen || isCheckInOpen || isCollaborativeModalOpen);
      return () => setChildModalOpen(false);
   }, [isWeatherModalOpen, isMarketModalOpen, isWaterModalOpen, isBriefingModalOpen, isEnergyModalOpen, isCalendarOpen, isCheckInOpen, isCollaborativeModalOpen, setChildModalOpen]);

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

   // Dynamic Theming Logic (Material You)
   const activeTheme = useMemo(() => {
      const now = new Date();
      const hour = now.getHours();
      const isNight = hour < 6 || hour >= 20;

      if (isNight) return 'night';
      if (!currentWeather) return 'default';

      switch (currentWeather.condition) {
         case 'sunny': return 'sunny';
         case 'rain':
         case 'storm': return 'rain';
         default: return 'default';
      }
   }, [currentWeather]);

   const theme = {
      sunny: {
         bg: "bg-amber-50/50 dark:bg-amber-900/20",
         border: "border-amber-100 dark:border-amber-500/10",
         text: "text-amber-950 dark:text-white",
         textMuted: "text-amber-900/60 dark:text-amber-300/60",
         icon: "text-amber-600 dark:text-amber-400",
         chipBg: "bg-amber-100/50 dark:bg-amber-500/10",
         accent: "text-amber-500",
         hover: "group-hover:bg-amber-100/50",
         indicator: "bg-amber-500",
         buttonIcon: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
      },
      rain: {
         bg: "bg-blue-50/50 dark:bg-blue-900/20",
         border: "border-blue-100 dark:border-blue-500/10",
         text: "text-blue-950 dark:text-white",
         textMuted: "text-blue-900/60 dark:text-blue-300/60",
         icon: "text-blue-600 dark:text-blue-400",
         chipBg: "bg-blue-100/50 dark:bg-blue-500/10",
         accent: "text-blue-500",
         hover: "group-hover:bg-blue-100/50",
         indicator: "bg-blue-500",
         buttonIcon: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
      },
      night: {
         bg: "bg-violet-50/50 dark:bg-violet-900/20",
         border: "border-violet-100 dark:border-violet-500/10",
         text: "text-violet-950 dark:text-white",
         textMuted: "text-violet-900/60 dark:text-violet-300/60",
         icon: "text-violet-600 dark:text-violet-400",
         chipBg: "bg-violet-100/50 dark:bg-violet-500/10",
         accent: "text-violet-500",
         hover: "group-hover:bg-violet-100/50",
         indicator: "bg-violet-500",
         buttonIcon: "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400"
      },
      default: {
         bg: "bg-indigo-50/50 dark:bg-indigo-900/20",
         border: "border-indigo-100 dark:border-indigo-500/10",
         text: "text-indigo-950 dark:text-white",
         textMuted: "text-indigo-900/60 dark:text-indigo-300/60",
         icon: "text-indigo-600 dark:text-indigo-400",
         chipBg: "bg-indigo-100/50 dark:bg-indigo-500/10",
         accent: "text-indigo-500",
         hover: "group-hover:bg-indigo-100/50",
         indicator: "bg-indigo-500",
         buttonIcon: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
      }
   }[activeTheme];

   // Parallax Hook for Spatial Design
   const { rotateX, rotateY, onMouseMove, onMouseLeave } = useParallax3D({ intensity: 15 });
   const glareX = useTransform(rotateY, [-15, 15], ['-10%', '10%']);
   const glareY = useTransform(rotateX, [-15, 15], ['-10%', '10%']);

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
         consumption: Number((Number(data.consumption) || 0).toFixed(1)),
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
      <div
         onTouchStart={handleTouchStart}
         onTouchMove={handleTouchMove}
         onTouchEnd={handleTouchEnd}
         onMouseDown={handleTouchStart}
         onMouseMove={handleTouchMove}
         onMouseUp={handleTouchEnd}
         onMouseLeave={handleTouchEnd}
         className="relative min-h-[100dvh]"
      >
         {/* Native Pull-to-Refresh Indicator */}
         <motion.div
            style={{ y: pullY, opacity: pullOpacity }}
            className="fixed top-0 left-0 right-0 flex justify-center z-[100] pointer-events-none"
         >
            <div className="bg-white dark:bg-neutral-800 rounded-full shadow-lg p-2 mt-[env(safe-area-inset-top,1.5rem)] flex items-center justify-center">
               <div className={clsx("transition-transform", isRefreshing && "animate-spin")}>
                  <Loader2 size={24} className="text-agro-green" />
               </div>
            </div>
         </motion.div>

         <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            style={{ y: pullY }}
            className="flex flex-col gap-2 pt-[68px] pb-20 sm:pt-28 sm:pb-28 sm:gap-3"
         >

            {/* 1. HEADER: 2026 FLOATING PILL NAVBAR */}
            <motion.div variants={itemVariants} className="fixed top-0 left-0 right-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
               <div className={`w-full max-w-7xl mx-auto flex justify-between items-center px-3 py-2.5 sm:px-4 sm:py-3 rounded-[2rem] transition-all duration-500 ${scrolled
                  ? 'bg-white/90 dark:bg-black/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-2xl shadow-black/10 dark:shadow-black/30'
                  : 'bg-white/60 dark:bg-white/5 backdrop-blur-lg border border-gray-200/80 dark:border-white/20 shadow-xl shadow-black/5'
                  }`}>
                  {/* Left: Avatar + Name */}
                  <div className="flex items-center gap-3 cursor-pointer group" onClick={onOpenSettings}>
                     <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 rounded-full p-[2px] shadow-lg group-hover:scale-105 transition-transform" style={{ background: 'linear-gradient(135deg, #22c55e, #15803d, #ca8a04)' }}>
                           <div className="w-full h-full rounded-full overflow-hidden border border-black/10">
                              <img src={`https://i.pravatar.cc/150?u=${currentUser.id}`} alt={userName} className="w-full h-full object-cover" />
                           </div>
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-black shadow-sm" />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-sm font-black tracking-tight text-gray-900 dark:text-white leading-none">{userName}</span>
                        <span className="text-[9px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-widest">{currentUser.role === 'admin' ? 'Admin' : 'Operador'}</span>
                     </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex items-center gap-1.5">
                     <button onClick={() => openModal('omniSearch')} className="p-2 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-all" title="Pesquisar">
                        <Search size={16} strokeWidth={2.5} />
                     </button>
                     <button onClick={onOpenSettings} className="relative p-2 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-white/70 transition-all" title={`Sync: ${syncStatus}`}>
                        <Cloud size={16} className={clsx(syncStatus === 'syncing' && 'text-indigo-500 animate-pulse')} />
                        {syncStatus === 'offline' && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-gray-400" />}
                     </button>
                     <button onClick={onOpenNotifications} className="relative p-2 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-all" title="Alertas">
                        <Bell size={16} strokeWidth={2.5} />
                        {alertCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-white dark:border-black animate-pulse" />}
                     </button>
                     <button onClick={onOpenSettings} className="p-2 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-all" title="Definições">
                        <Settings size={16} strokeWidth={2.5} />
                     </button>
                  </div>
               </div>
            </motion.div>

            {/* 2. WEATHER HERO: 2026 IMMERSIVE GRADIENT CARD */}
            <WeatherHero
               currentWeather={currentWeather}
               activeTheme={activeTheme}
               rotateX={rotateX}
               rotateY={rotateY}
               glareX={glareX}
               glareY={glareY}
               onMouseMove={onMouseMove}
               onMouseLeave={onMouseLeave}
               setIsWeatherModalOpen={setIsWeatherModalOpen}
               getWeatherIcon={getWeatherIcon}
            />

            {/* 2b. Alert pill */}
            {alertCount > 0 && (
               <div className="px-3">
                  <button
                     onClick={onOpenNotifications}
                     className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-black uppercase tracking-wider bg-red-500/15 border border-red-500/30 text-red-500 dark:text-red-400 transition-all active:scale-95"
                  >
                     <Bell size={13} />
                     {alertCount} Alerta{alertCount > 1 ? 's' : ''}
                  </button>
               </div>
            )}

            {/* --- FARM COPILOT (AI INSIGHTS) --- */}
            <div className="mt-3">
               <React.Suspense fallback={<div className="h-48 w-full bg-white/5 animate-pulse rounded-2xl mx-3"></div>}>
                  <FarmCopilot
                     userName={userName}
                     weather={weather}
                     hourlyForecast={hourlyForecast}
                     tasks={tasks}
                     users={users}
                     fields={fields}
                     stocks={stocks}
                     machines={machines}
                     alertCount={alertCount}
                     onNavigate={onNavigate}
                     onOpenWeather={() => setIsWeatherModalOpen(true)}
                     onOpenBriefing={() => setIsBriefingModalOpen(true)}
                     activeTheme={activeTheme}
                  />
               </React.Suspense>
            </div>

            <QuickActions
               activeSession={activeSession}
               setIsCheckInOpen={setIsCheckInOpen}
               setIsMarketModalOpen={setIsMarketModalOpen}
               hasUnreadFeed={hasUnreadFeed}
               onNavigate={onNavigate}
               setIsCalendarOpen={setIsCalendarOpen}
               myPendingTaskCount={myPendingTaskCount}
               tasksToReviewCount={tasksToReviewCount}
               setIsCollaborativeModalOpen={setIsCollaborativeModalOpen}
               itemVariants={itemVariants}
            />

            <KpiGrid
               waterConsumption={waterConsumption}
               solarEnergy={solarEnergy}
               carbonMetrics={carbonMetrics}
               setIsWaterModalOpen={setIsWaterModalOpen}
               setIsEnergyModalOpen={setIsEnergyModalOpen}
               onNavigate={onNavigate}
               itemVariants={itemVariants}
            />



            {/* --- MODALS CONTROLLER --- */}
            <React.Suspense fallback={null}>
               <DashboardModals
                  isWeatherModalOpen={isWeatherModalOpen}
                  setIsWeatherModalOpen={setIsWeatherModalOpen}
                  weatherTab={weatherTab}
                  setWeatherTab={setWeatherTab}
                  weather={weather}
                  sprayingConditions={sprayingConditions}
                  getWeatherIcon={getWeatherIcon}
                  isMarketModalOpen={isMarketModalOpen}
                  setIsMarketModalOpen={setIsMarketModalOpen}
                  MarketPricesComponent={() => <MarketPrices onClose={() => setIsMarketModalOpen(false)} stocks={stocks} />}
                  isWaterModalOpen={isWaterModalOpen}
                  setIsWaterModalOpen={setIsWaterModalOpen}
                  waterConsumptionByCrop={waterConsumptionByCrop}
                  waterConsumption={waterConsumption}
                  isBriefingModalOpen={isBriefingModalOpen}
                  setIsBriefingModalOpen={setIsBriefingModalOpen}
                  MorningBriefingComponent={() => <MorningBriefingModal isOpen={isBriefingModalOpen} onClose={() => setIsBriefingModalOpen(false)} userName={userName} machines={machines} fields={fields} users={users} onNavigate={onNavigate} />}
                  isEnergyModalOpen={isEnergyModalOpen}
                  setIsEnergyModalOpen={setIsEnergyModalOpen}
                  energyInsights={energyInsights}
                  solarForecast={solarForecast}
                  solarEnergy={solarEnergy}
                  isCalendarOpen={isCalendarOpen}
                  setIsCalendarOpen={setIsCalendarOpen}
                  CalendarComponent={() => <CalendarModal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} tasks={tasks} fields={fields} animals={animals} users={users} currentUser={currentUser} onNavigate={onNavigate} onAddTask={onAddTask} onUpdateTask={updateTask} onDeleteTask={deleteTask} />}
                  isCheckInOpen={isCheckInOpen}
                  setIsCheckInOpen={setIsCheckInOpen}
                  CheckInComponent={() => <CheckInModal isOpen={isCheckInOpen} onClose={() => setIsCheckInOpen(false)} fields={fields} activeSession={activeSession} onStartSession={(fId, manual) => { startSession(fId, manual); setIsCheckInOpen(false); }} onEndSession={() => { endSession(); setIsCheckInOpen(false); }} />}
                  isCollaborativeModalOpen={isCollaborativeModalOpen}
                  setIsCollaborativeModalOpen={setIsCollaborativeModalOpen}
                  CollaborativeComponent={() => <CollaborativeNetworkModal isOpen={isCollaborativeModalOpen} onClose={() => setIsCollaborativeModalOpen(false)} />}
               />
            </React.Suspense>

            {/* --- FLOATING SESSION INDICATOR --- */}
            <AnimatePresence>
               {activeSession && !isCheckInOpen && (
                  <motion.div
                     initial={{ y: 100, opacity: 0 }}
                     animate={{ y: 0, opacity: 1 }}
                     exit={{ y: 100, opacity: 0 }}
                     onClick={() => setIsCheckInOpen(true)}
                     className="fixed bottom-24 left-4 right-4 z-[45] mx-auto max-w-sm"
                  >
                     <div className="bg-agro-green text-white p-4 rounded-[1.5rem] shadow-2xl flex items-center justify-between border border-white/20 backdrop-blur-md bg-opacity-90">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                              <Clock size={20} className="animate-pulse" />
                           </div>
                           <div>
                              <h4 className="text-xs font-black uppercase tracking-widest">Sessão Ativa</h4>
                              <p className="text-[10px] font-bold text-white/80">
                                 {fields.find(f => f.id === activeSession.fieldId)?.name || 'Parcela'}
                              </p>
                           </div>
                        </div>
                        <ChevronRight size={20} />
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>

         </motion.div>
      </div >
   );
};

export default DashboardHome;