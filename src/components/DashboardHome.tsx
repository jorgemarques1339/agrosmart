
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sun, CloudRain, Calendar, Check, Plus, Trash2, 
  ArrowRight, X, User, CloudLightning, Wind, Droplets, MapPin,
  Settings, Bell, Sprout, Cloud, CloudSun,
  Tractor, Fuel, Clock, Gauge, Save, AlertTriangle, Truck, Eye, Package,
  ChevronDown, ShoppingBag, Link as LinkIcon, CheckCircle2, Circle, ListTodo,
  Thermometer, ShieldAlert, Users, Camera, Clock as ClockIcon
} from 'lucide-react';
import { Task, WeatherForecast, Field, Machine, MaintenanceLog, StockItem, DetailedForecast, UserProfile } from '../types';

interface DashboardHomeProps {
  userName: string;
  weather: WeatherForecast[];
  hourlyForecast?: DetailedForecast[]; // Optional prop for backward compatibility
  tasks: Task[];
  fields: Field[];
  machines?: Machine[];
  stocks?: StockItem[];
  users?: UserProfile[]; // Team Connect
  currentUser?: UserProfile; // Team Connect
  onToggleTask: (id: string) => void;
  onAddTask: (title: string, type: 'task' | 'harvest', date?: string, relatedFieldId?: string, relatedStockId?: string, plannedQuantity?: number, assignedTo?: string) => void;
  onDeleteTask: (id: string) => void;
  onWeatherClick: () => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onModalChange?: (isOpen: boolean) => void;
  onUpdateMachineHours?: (id: string, hours: number) => void;
  onAddMachineLog?: (machineId: string, log: Omit<MaintenanceLog, 'id'>) => void;
  onTaskClick?: (task: Task) => void; // New prop for handling task clicks (proof/review)
  alertCount: number;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({
  userName,
  weather,
  hourlyForecast = [],
  tasks,
  fields,
  machines = [],
  stocks = [],
  users = [],
  currentUser,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onWeatherClick,
  onOpenSettings,
  onOpenNotifications,
  onModalChange,
  onUpdateMachineHours,
  onAddMachineLog,
  onTaskClick,
  alertCount
}) => {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [weatherTab, setWeatherTab] = useState<'general' | 'spray'>('general');
  const [agendaModalDate, setAgendaModalDate] = useState<string | null>(null);
  
  // Task Creation State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [showResources, setShowResources] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [selectedStockId, setSelectedStockId] = useState('');
  const [plannedQty, setPlannedQty] = useState('');
  const [assignedTo, setAssignedTo] = useState(''); // New: Assigned User

  // Quick Action States
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [quickAction, setQuickAction] = useState<'hours' | 'fuel' | null>(null);
  const [hoursInput, setHoursInput] = useState('');
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');

  // Notificar o pai quando o estado do modal muda
  useEffect(() => {
    if (onModalChange) {
      onModalChange(isWeatherModalOpen || !!selectedMachine || !!agendaModalDate);
    }
  }, [isWeatherModalOpen, selectedMachine, agendaModalDate, onModalChange]);

  // --- 1. Lógica de Tempo e Saudação ---
  const today = new Date();
  
  // Format Date for Greeting
  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('pt-PT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(today);
  }, []);

  // Dados do tempo atual
  const currentWeather = weather[0] || { temp: 0, condition: 'cloudy', day: 'Carregando...', windSpeed: 0, humidity: 0 };
  const isRaining = currentWeather.condition === 'rain' || currentWeather.condition === 'storm';

  const getWeatherIcon = (condition: string, size: number = 24, className: string = "") => {
    switch (condition) {
      case 'rain': return <CloudRain size={size} className={className} />;
      case 'storm': return <CloudLightning size={size} className={className} />;
      case 'cloudy': return <Cloud size={size} className={className} />;
      case 'sunny': return <Sun size={size} className={className} />;
      default: return <CloudSun size={size} className={className} />;
    }
  };

  const getWeatherLabel = (condition: string) => {
    switch (condition) {
      case 'rain': return 'Chuva';
      case 'storm': return 'Tempestade';
      case 'cloudy': return 'Nublado';
      case 'sunny': return 'Céu Limpo';
      default: return 'Parcial';
    }
  };

  // --- LOGICA DE PULVERIZAÇÃO ---
  const sprayForecast = useMemo(() => {
    const sourceData = (hourlyForecast && hourlyForecast.length > 0) ? hourlyForecast : [
        // Mock Fallback
        { dt: Date.now() / 1000, temp: 12, windSpeed: 5, humidity: 85, rainProb: 0 },
        { dt: (Date.now() / 1000) + 10800, temp: 16, windSpeed: 8, humidity: 75, rainProb: 0 },
        { dt: (Date.now() / 1000) + 21600, temp: 24, windSpeed: 12, humidity: 60, rainProb: 10 },
        { dt: (Date.now() / 1000) + 32400, temp: 28, windSpeed: 18, humidity: 45, rainProb: 0 }, 
        { dt: (Date.now() / 1000) + 43200, temp: 22, windSpeed: 10, humidity: 65, rainProb: 0 },
        { dt: (Date.now() / 1000) + 54000, temp: 18, windSpeed: 4, humidity: 80, rainProb: 60 },
    ];

    return sourceData.map(slot => {
      const time = new Date(slot.dt * 1000).toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'});
      const temp = Math.round(slot.temp);
      const wind = Math.round(slot.windSpeed);
      const humidity = slot.humidity;
      const rainProb = slot.rainProb;

      let status: 'ideal' | 'warning' | 'danger' = 'ideal';
      let reasons: string[] = [];

      if (wind > 15) { status = 'danger'; reasons.push('Risco de Deriva (Vento Forte)'); } 
      else if (wind > 10) { status = 'warning'; reasons.push('Vento Moderado'); }

      if (temp > 27 || humidity < 40) { status = 'danger'; reasons.push('Risco de Evaporação (Calor/Seco)'); }

      if (rainProb > 50) { status = 'danger'; reasons.push('Risco de Lavagem (Chuva)'); }

      if ((status as string) === 'ideal' && (temp < 10 || temp > 25)) { status = 'warning'; reasons.push('Temperatura Marginal'); }

      return { time, temp, wind, humidity, rainProb, status, reason: reasons.join(' • ') || 'Condições Excelentes' };
    });
  }, [hourlyForecast]);


  // --- 2. Lógica do AgroCalendário ---
  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      const isoDate = date.toISOString().split('T')[0];
      
      const hasTask = tasks.some(t => t.date === isoDate && !t.completed);
      const hasHarvest = fields.some(f => f.harvestWindow.includes(date.toLocaleString('pt-PT', { month: 'long' }))); 
      
      days.push({
        dateObj: date,
        dayName: i === 0 ? 'Hoje' : date.toLocaleDateString('pt-PT', { weekday: 'short' }).replace('.', ''),
        dayNumber: date.getDate(),
        isoDate,
        hasTask,
        hasHarvest,
        isToday: i === 0
      });
    }
    return days;
  }, [tasks, fields]);

  // --- 3. Handlers ---
  const handleOpenDayAgenda = (isoDate: string) => {
    setAgendaModalDate(isoDate);
    setNewTaskDate(isoDate);
    setIsAddingTask(false);
  };

  const handleAddNewTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const qty = plannedQty ? parseFloat(plannedQty) : undefined;
    const finalDate = newTaskDate || agendaModalDate || new Date().toISOString().split('T')[0];

    onAddTask(
      newTaskTitle, 
      'task', 
      finalDate, 
      selectedFieldId || undefined, 
      selectedStockId || undefined, 
      qty,
      assignedTo || undefined // Pass assignment
    );
    
    setNewTaskTitle('');
    setShowResources(false);
    setSelectedFieldId('');
    setSelectedStockId('');
    setPlannedQty('');
    setAssignedTo('');
    setIsAddingTask(false);
  };

  const handleOpenQuickAction = (machine: Machine, type: 'hours' | 'fuel') => {
    setSelectedMachine(machine);
    setQuickAction(type);
    if (type === 'hours') {
      setHoursInput(machine.engineHours.toString());
    } else {
      setFuelLiters('');
      setFuelCost('');
    }
  };

  const handleConfirmQuickAction = () => {
    if (!selectedMachine) return;
    
    if (quickAction === 'hours' && onUpdateMachineHours) {
      onUpdateMachineHours(selectedMachine.id, parseFloat(hoursInput));
    } else if (quickAction === 'fuel' && onAddMachineLog) {
      const liters = parseFloat(fuelLiters);
      const cost = parseFloat(fuelCost) || 0;
      
      onAddMachineLog(selectedMachine.id, {
        date: new Date().toISOString().split('T')[0],
        type: 'fuel',
        description: `Abastecimento Rápido: ${liters}L`,
        cost: cost,
        engineHoursAtLog: selectedMachine.engineHours,
        quantity: liters
      });
    }
    
    setSelectedMachine(null);
    setQuickAction(null);
  };

  const selectedStockUnit = useMemo(() => {
    const s = stocks.find(i => i.id === selectedStockId);
    return s ? s.unit : '';
  }, [selectedStockId, stocks]);

  const selectedDayTasks = useMemo(() => {
    if (!agendaModalDate) return [];
    return tasks.filter(t => t.date === agendaModalDate);
  }, [tasks, agendaModalDate]);

  return (
    <div className="space-y-8 md:space-y-0 md:grid md:grid-cols-12 md:gap-6 animate-fade-in pt-6 pb-24">
      
      {/* 1. Header Fixo */}
      <div className="md:col-span-12 flex justify-between items-center px-2 animate-slide-down">
        <div className="flex items-center gap-3">
          {/* Avatar do Current User */}
          {currentUser && (
             <div className="w-12 h-12 bg-agro-green rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-white dark:border-black">
                {currentUser.avatar}
             </div>
          )}
          <div>
            <h2 className="text-3xl font-black italic text-gray-900 dark:text-white leading-none">
              Olá, {userName.split(' ')[0]}
            </h2>
            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">
              {currentUser?.role === 'admin' ? 'Administrador' : 'Operador'} • {formattedDate}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onOpenSettings} className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 text-gray-400 hover:text-agro-green shadow-sm flex items-center justify-center transition-colors active:scale-90">
            <Settings size={20} />
          </button>
          
          <button 
            onClick={onOpenNotifications} 
            className="relative group active:scale-90 transition-transform"
          >
            {alertCount > 0 ? (
              <>
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                <div className="relative w-10 h-10 bg-red-500 text-white rounded-full shadow-lg shadow-red-500/50 flex items-center justify-center animate-pulse">
                  <Bell size={20} fill="currentColor" />
                </div>
              </>
            ) : (
              <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 text-gray-400 hover:text-agro-green shadow-sm flex items-center justify-center transition-colors">
                 <Bell size={20} />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* 2. Weather Hero Card */}
      <div 
        onClick={() => setIsWeatherModalOpen(true)}
        className={`md:col-span-12 relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-6 shadow-2xl active:scale-[0.98] transition-transform cursor-pointer animate-slide-up delay-100 ${
          isRaining 
            ? 'bg-slate-100 dark:bg-slate-900 shadow-slate-200 dark:shadow-slate-900/40' 
            : 'bg-gradient-to-br from-[#ecfccb] to-[#dcfce7] dark:bg-[#0f2612] dark:from-transparent dark:to-transparent shadow-agro-green/10 dark:shadow-agro-green/40'
        }`}
      >
         {/* ... Weather Background & Content (Mesmo código anterior) ... */}
         <div className="absolute inset-0 z-0">
            {isRaining ? (
              <>
                <div className="absolute top-[-50%] right-[-20%] w-[80%] h-[120%] bg-indigo-900/10 dark:bg-indigo-900/40 rounded-full blur-[80px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-30%] left-[-20%] w-[80%] h-[80%] bg-slate-400/20 dark:bg-slate-700/30 rounded-full blur-[60px]"></div>
              </>
            ) : (
              <>
                <div className="absolute top-[-50%] right-[-20%] w-[90%] h-[120%] bg-green-200/40 dark:bg-green-800/60 rounded-full blur-[80px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-20%] left-[-20%] w-[70%] h-[80%] bg-emerald-200/30 dark:bg-emerald-600/30 rounded-full blur-[60px]"></div>
              </>
            )}
         </div>

         <div className="absolute inset-0 z-0 opacity-10 mix-blend-overlay pointer-events-none">
            {isRaining ? (
               <CloudRain className="absolute -right-8 -bottom-8 w-56 h-56 rotate-12 text-slate-400 dark:text-white" />
            ) : (
               <Sun className="absolute -right-12 -top-12 w-64 h-64 text-yellow-400 dark:text-yellow-300 animate-spin-slow opacity-20 dark:opacity-100" />
            )}
         </div>

         <div className="relative z-10 text-gray-900 dark:text-white h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
               <div>
                  <div className="flex items-center gap-1.5 opacity-80 mb-1 md:mb-2">
                    <MapPin size={10} className="md:w-3 md:h-3" />
                    <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Laundos, PT</span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3">
                     <span className="text-5xl md:text-7xl font-black tracking-tighter drop-shadow-sm">{currentWeather.temp}°</span>
                     <div className="flex flex-col text-gray-800 dark:text-white">
                        <div className="w-6 h-6 md:w-8 md:h-8">
                           {getWeatherIcon(currentWeather.condition, 24, "drop-shadow-md w-full h-full")} 
                        </div>
                       <span className="text-xs md:text-sm font-bold mt-0.5 md:mt-1 opacity-90 tracking-wide leading-tight">{getWeatherLabel(currentWeather.condition)}</span>
                     </div>
                  </div>
               </div>
               
               <div className="flex flex-col gap-1.5 md:gap-2 mt-1 md:mt-2">
                  <div className="bg-white/60 dark:bg-white/10 backdrop-blur-md px-2.5 py-1.5 md:px-3 md:py-2 rounded-xl md:rounded-2xl flex items-center gap-1.5 md:gap-2 border border-white/40 dark:border-white/10 shadow-sm text-gray-700 dark:text-white">
                    <Wind size={12} className="opacity-90 md:w-3.5 md:h-3.5" />
                    <span className="text-[10px] md:text-xs font-bold">{currentWeather.windSpeed} km/h</span>
                  </div>
                  <div className="bg-white/60 dark:bg-white/10 backdrop-blur-md px-2.5 py-1.5 md:px-3 md:py-2 rounded-xl md:rounded-2xl flex items-center gap-1.5 md:gap-2 border border-white/40 dark:border-white/10 shadow-sm text-gray-700 dark:text-white">
                    <Droplets size={12} className="opacity-90 md:w-3.5 md:h-3.5" />
                    <span className="text-[10px] md:text-xs font-bold">{currentWeather.humidity}%</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* 4. Agenda Horizontal */}
      <div className="md:col-span-12 animate-slide-up delay-200">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 px-2">Oriva-Agenda</h3>
        <div className="flex gap-3 overflow-x-auto px-1 pb-4 scrollbar-hide snap-x">
           {calendarDays.map((day, idx) => {
             const isTodayWithTask = day.isToday && day.hasTask;
             const isTodayNoTask = day.isToday && !day.hasTask;
             
             return (
               <button 
                 key={idx} 
                 onClick={() => handleOpenDayAgenda(day.isoDate)}
                 className={`snap-start min-w-[75px] h-28 flex flex-col items-center justify-between py-5 rounded-[2.5rem] transition-all duration-300 active:scale-95 border relative overflow-hidden ${
                   isTodayWithTask
                     ? 'bg-agro-green text-white shadow-xl shadow-agro-green/40 border-agro-green scale-105 animate-pulse'
                     : isTodayNoTask
                       ? 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-lg border-transparent scale-105'
                       : 'bg-white dark:bg-neutral-900 text-gray-400 dark:text-gray-500 border-gray-100 dark:border-neutral-800 hover:border-agro-green'
                 }`}
               >
                  <span className="text-[10px] font-bold uppercase tracking-wider">{day.dayName}</span>
                  <span className="text-2xl font-black">{day.dayNumber}</span>
                  
                  <div className="flex gap-1 h-1.5">
                    {day.hasTask && (
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        day.isToday ? 'bg-white' : 'bg-blue-500'
                      }`}></div>
                    )}
                    {day.hasHarvest && (
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        day.isToday ? 'bg-yellow-300' : 'bg-yellow-500'
                      }`}></div>
                    )}
                  </div>
               </button>
             );
           })}
        </div>
      </div>

      {/* 6. Máquinas Rápidas */}
      {machines.length > 0 && (
        <div className="md:col-span-12 animate-slide-up delay-300">
           <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 px-2">Acesso Rápido</h3>
           <div className="flex gap-3 overflow-x-auto pb-4 px-1 scrollbar-hide">
              {machines.slice(0, 4).map(machine => (
                <div 
                  key={machine.id} 
                  className="min-w-[140px] bg-white dark:bg-neutral-900 p-4 rounded-[2rem] border border-gray-100 dark:border-neutral-800 shadow-sm flex flex-col items-center text-center active:scale-95 transition-transform"
                >
                   <div className="w-12 h-12 bg-gray-50 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mb-2 text-gray-600 dark:text-gray-300">
                      {machine.type === 'vehicle' ? <Truck size={24} /> : <Tractor size={24} />}
                   </div>
                   <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{machine.name}</p>
                   
                   <div className="flex gap-1 w-full mt-3">
                      <button 
                        onClick={() => handleOpenQuickAction(machine, 'hours')}
                        className="flex-1 py-2 bg-gray-100 dark:bg-neutral-800 rounded-xl text-gray-500 hover:text-agro-green transition-colors"
                      >
                         <Clock size={16} className="mx-auto" />
                      </button>
                      <button 
                        onClick={() => handleOpenQuickAction(machine, 'fuel')}
                        className="flex-1 py-2 bg-gray-100 dark:bg-neutral-800 rounded-xl text-gray-500 hover:text-agro-green transition-colors"
                      >
                         <Fuel size={16} className="mx-auto" />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* --- AGENDA DAY POP-UP (Including Team Connect Features) --- */}
      {agendaModalDate && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setAgendaModalDate(null)}>
          <div 
            className="bg-white dark:bg-neutral-900 w-full max-w-md h-[80vh] rounded-t-[2.5rem] p-6 shadow-2xl animate-slide-up border-t border-white/20 relative flex flex-col" 
            onClick={e => e.stopPropagation()}
          >
             {/* Modal Header */}
             <div className="flex justify-between items-center mb-6">
               <div>
                 <h3 className="text-2xl font-black dark:text-white">
                   {new Date(agendaModalDate).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })}
                 </h3>
                 <p className="text-xs font-bold text-gray-400 uppercase mt-1">Agenda Diária</p>
               </div>
               <button onClick={() => setAgendaModalDate(null)} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                 <X size={24} className="dark:text-white" />
               </button>
             </div>

             {/* Content Area */}
             <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
               
               {/* Create Task Form */}
               {isAddingTask ? (
                  <div className="mb-6 animate-slide-down bg-gray-50 dark:bg-neutral-800/50 p-5 rounded-[2rem] border border-gray-100 dark:border-neutral-800">
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Nova atividade..."
                      className="w-full bg-transparent border-b-2 border-gray-200 dark:border-neutral-700 p-2 text-lg font-bold dark:text-white outline-none focus:border-agro-green placeholder:text-gray-400"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddNewTask()}
                    />
                    
                    {/* Team Connect: Assign User */}
                    <div className="mt-4">
                       <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1">Atribuir a</label>
                       <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                          <button 
                             onClick={() => setAssignedTo('')}
                             className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${
                                assignedTo === '' 
                                  ? 'bg-black text-white border-black dark:bg-white dark:text-black' 
                                  : 'bg-white dark:bg-neutral-800 border-transparent text-gray-500'
                             }`}
                          >
                             <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center text-[10px]">Eu</div>
                             <span className="text-xs font-bold">Ninguém</span>
                          </button>
                          
                          {users.map(u => (
                             <button
                                key={u.id}
                                onClick={() => setAssignedTo(u.id)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${
                                   assignedTo === u.id 
                                     ? 'bg-agro-green text-white border-agro-green' 
                                     : 'bg-white dark:bg-neutral-800 border-transparent text-gray-500'
                                }`}
                             >
                                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">{u.avatar}</div>
                                <span className="text-xs font-bold truncate max-w-[80px]">{u.name}</span>
                             </button>
                          ))}
                       </div>
                    </div>

                    {/* Resources Toggle */}
                    <div className="mt-4">
                        <button 
                          onClick={() => setShowResources(!showResources)}
                          className={`text-xs font-bold uppercase flex items-center gap-1 mb-3 transition-colors ${showResources ? 'text-agro-green' : 'text-gray-400'}`}
                        >
                          <LinkIcon size={12} /> {showResources ? 'Ocultar Recursos' : 'Associar Recursos'}
                        </button>

                        {showResources && (
                          <div className="grid grid-cols-1 gap-3 animate-fade-in bg-white dark:bg-neutral-800 p-3 rounded-2xl">
                            <select 
                              className="bg-gray-100 dark:bg-neutral-900 w-full p-3 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 outline-none"
                              value={selectedFieldId}
                              onChange={(e) => setSelectedFieldId(e.target.value)}
                            >
                              <option value="">Selecione Campo...</option>
                              {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>

                            <select 
                              className="bg-gray-100 dark:bg-neutral-900 w-full p-3 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 outline-none"
                              value={selectedStockId}
                              onChange={(e) => setSelectedStockId(e.target.value)}
                            >
                              <option value="">Selecione Produto...</option>
                              {stocks.map(s => <option key={s.id} value={s.id} disabled={s.quantity <= 0}>{s.name} ({s.quantity} {s.unit})</option>)}
                            </select>

                            {selectedStockId && (
                              <div className="flex items-center gap-2 bg-gray-100 dark:bg-neutral-900 p-3 rounded-xl">
                                  <input 
                                    type="number"
                                    placeholder="Qtd"
                                    className="bg-transparent w-full text-sm font-bold text-gray-900 dark:text-white outline-none"
                                    value={plannedQty}
                                    onChange={(e) => setPlannedQty(e.target.value)}
                                  />
                                  <span className="text-xs font-bold text-gray-400">{selectedStockUnit}</span>
                              </div>
                            )}
                          </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button 
                          onClick={() => setIsAddingTask(false)}
                          className="px-6 py-3 bg-gray-200 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={handleAddNewTask}
                          className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold shadow-lg active:scale-95 transition-transform"
                        >
                          Adicionar
                        </button>
                    </div>
                  </div>
               ) : (
                 <button 
                   onClick={() => setIsAddingTask(true)}
                   className="w-full py-4 mb-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-neutral-700 text-gray-400 font-bold flex items-center justify-center gap-2 active:bg-gray-50 dark:active:bg-neutral-800 transition-colors"
                 >
                   <Plus size={20} /> Adicionar Atividade
                 </button>
               )}

               {/* Task List for Selected Day */}
               <div className="space-y-3">
                 {selectedDayTasks.length === 0 && !isAddingTask ? (
                   <div className="flex flex-col items-center justify-center py-10 opacity-50">
                      <ListTodo size={48} className="text-gray-300 mb-3" />
                      <p className="text-sm font-bold text-gray-400">Sem atividades planeadas.</p>
                   </div>
                 ) : (
                   selectedDayTasks.map((task) => {
                     const linkedField = fields.find(f => f.id === task.relatedFieldId);
                     const linkedStock = stocks.find(s => s.id === task.relatedStockId);
                     const assignedUser = users.find(u => u.id === task.assignedTo);
                     
                     // Determine style based on workflow status
                     let borderClass = 'border-gray-100 dark:border-neutral-800';
                     if (task.status === 'review') borderClass = 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10';
                     if (task.completed) borderClass = 'border-transparent opacity-60 bg-gray-50 dark:bg-neutral-800';

                     return (
                       <div 
                         key={task.id} 
                         onClick={() => onTaskClick && onTaskClick(task)}
                         className={`group p-4 rounded-[1.5rem] shadow-sm border flex items-center gap-4 active:scale-[0.99] transition-all cursor-pointer ${borderClass} ${!task.completed && task.status !== 'review' ? 'bg-white dark:bg-neutral-900' : ''}`}
                       >
                          {/* Left Icon (Status or Toggle) */}
                          <div className="relative">
                             <button 
                               onClick={(e) => {
                                  e.stopPropagation();
                                  if (task.assignedTo && task.assignedTo !== currentUser?.id && currentUser?.role !== 'admin') return;
                                  if (task.status === 'pending' && task.assignedTo) {
                                     // Se for atribuída e pendente, abre o modal de prova (via onTaskClick)
                                     if(onTaskClick) onTaskClick(task);
                                  } else {
                                     // Tarefa simples
                                     onToggleTask(task.id);
                                  }
                               }}
                               className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                 task.completed 
                                   ? 'bg-green-500 border-green-500 text-white' 
                                   : task.status === 'review'
                                     ? 'bg-yellow-400 border-yellow-400 text-white animate-pulse'
                                     : 'border-gray-300 dark:border-neutral-600 hover:border-agro-green'
                               }`}
                             >
                               {task.completed ? <Check size={16} /> : task.status === 'review' ? <Eye size={16} /> : <Circle size={0} className="opacity-0" />}
                             </button>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2 mb-1">
                                <p className={`font-bold text-sm ${task.completed ? 'text-gray-500 line-through' : 'text-gray-800 dark:text-white'} truncate`}>
                                  {task.title}
                                </p>
                                {task.status === 'review' && (
                                   <span className="bg-yellow-100 text-yellow-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Em Aprovação</span>
                                )}
                             </div>
                             
                             <div className="flex flex-wrap gap-2 items-center">
                                {/* Assigned User Avatar */}
                                {assignedUser && (
                                   <div className="flex items-center gap-1 bg-gray-100 dark:bg-neutral-800 pr-2 rounded-full overflow-hidden">
                                      <div className="w-5 h-5 bg-blue-100 text-blue-600 flex items-center justify-center text-[9px] font-bold">
                                         {assignedUser.avatar}
                                      </div>
                                      <span className="text-[9px] font-bold text-gray-500">{assignedUser.name.split(' ')[0]}</span>
                                   </div>
                                )}

                                {(linkedField || linkedStock) && (
                                   <>
                                      {linkedField && (
                                        <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-gray-100 dark:bg-neutral-800 text-gray-500 px-2 py-1 rounded-md">
                                           <MapPin size={8} /> {linkedField.name}
                                        </span>
                                      )}
                                      {linkedStock && task.plannedQuantity && (
                                        <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-2 py-1 rounded-md">
                                           <Package size={8} /> {task.plannedQuantity}{linkedStock.unit}
                                        </span>
                                      )}
                                   </>
                                )}
                             </div>
                          </div>
                          
                          {/* Delete Action (Only for Admin or Uncompleted) */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                            className="text-gray-300 hover:text-red-400 transition-colors p-2"
                          >
                            <Trash2 size={18} />
                          </button>
                       </div>
                     );
                   })
                 )}
               </div>
             </div>
          </div>
        </div>
      )}

      {/* 8. Advanced Agro-Weather Modal */}
      {isWeatherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4" onClick={() => setIsWeatherModalOpen(false)}>
           <div className="bg-white dark:bg-neutral-900 w-full max-w-sm h-[75vh] flex flex-col rounded-[2.5rem] shadow-2xl animate-scale-up border border-white/20" onClick={e => e.stopPropagation()}>
             
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

             {/* Tabs */}
             <div className="px-6 mb-4">
                <div className="flex bg-gray-100 dark:bg-neutral-800 p-1 rounded-2xl">
                   <button 
                     onClick={() => setWeatherTab('general')}
                     className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wide transition-all ${
                       weatherTab === 'general' ? 'bg-white dark:bg-neutral-700 shadow text-agro-green dark:text-white' : 'text-gray-400'
                     }`}
                   >
                     Geral
                   </button>
                   <button 
                     onClick={() => setWeatherTab('spray')}
                     className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wide transition-all ${
                       weatherTab === 'spray' ? 'bg-white dark:bg-neutral-700 shadow text-blue-500 dark:text-blue-400' : 'text-gray-400'
                     }`}
                   >
                     Pulverização
                   </button>
                </div>
             </div>

             {/* Content */}
             <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                
                {weatherTab === 'general' ? (
                  <div className="space-y-3">
                      {weather.map((day, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl">
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900 dark:text-white text-sm">{day.day}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase">{getWeatherLabel(day.condition)}</span>
                              </div>
                              {getWeatherIcon(day.condition, 24)}
                            </div>
                            <div className="flex items-center gap-4">
                               <div className="text-right">
                                  <div className="flex items-center gap-1 justify-end text-[10px] text-gray-400 font-bold">
                                     <Wind size={10} /> {day.windSpeed}
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
                ) : (
                  <div className="space-y-4">
                     <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                           <span className="font-bold">Nota:</span> Condições ideais para aplicação de fitofármacos: Vento &lt; 10km/h, Temp &lt; 25°C, Sem chuva.
                        </p>
                     </div>

                     <div className="space-y-3">
                        {sprayForecast.map((slot, idx) => (
                           <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl relative overflow-hidden">
                              {/* Status Indicator Bar */}
                              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                                 slot.status === 'ideal' ? 'bg-green-500' : 
                                 slot.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}></div>

                              <div className="flex flex-col items-center min-w-[50px]">
                                 <span className="text-lg font-black text-gray-900 dark:text-white">{slot.time}</span>
                              </div>

                              <div className="flex-1 min-w-0">
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                       slot.status === 'ideal' ? 'bg-green-100 text-green-700' : 
                                       slot.status === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                       {slot.status === 'ideal' ? 'Recomendado' : slot.status === 'warning' ? 'Atenção' : 'Não Recomendado'}
                                    </span>
                                 </div>
                                 <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{slot.reason}</p>
                              </div>

                              <div className="text-right">
                                 <div className="flex items-center gap-1 justify-end text-[10px] font-bold text-gray-400">
                                    <Wind size={10} /> {slot.wind}km/h
                                 </div>
                                 <div className="flex items-center gap-1 justify-end text-[10px] font-bold text-gray-400">
                                    <Thermometer size={10} /> {slot.temp}°
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                )}

             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;