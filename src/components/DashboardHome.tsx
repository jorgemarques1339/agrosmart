
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sun, CloudRain, Calendar, Check, Plus, Trash2, 
  ArrowRight, X, User, CloudLightning, Wind, Droplets, MapPin,
  Settings, Bell, Sprout, Cloud, CloudSun,
  Tractor, Fuel, Clock, Gauge, Save, AlertTriangle, Truck, Eye, Package,
  ChevronDown, ShoppingBag, Link as LinkIcon, CheckCircle2, Circle, ListTodo
} from 'lucide-react';
import { Task, WeatherForecast, Field, Machine, MaintenanceLog, StockItem } from '../types';

interface DashboardHomeProps {
  userName: string;
  weather: WeatherForecast[];
  tasks: Task[];
  fields: Field[];
  machines?: Machine[];
  stocks?: StockItem[];
  onToggleTask: (id: string) => void;
  onAddTask: (title: string, type: 'task' | 'harvest', date?: string, relatedFieldId?: string, relatedStockId?: string, plannedQuantity?: number) => void;
  onDeleteTask: (id: string) => void;
  onWeatherClick: () => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onModalChange?: (isOpen: boolean) => void;
  onUpdateMachineHours?: (id: string, hours: number) => void;
  onAddMachineLog?: (machineId: string, log: Omit<MaintenanceLog, 'id'>) => void;
  alertCount: number;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({
  userName,
  weather,
  tasks,
  fields,
  machines = [],
  stocks = [],
  onToggleTask,
  onAddTask,
  onDeleteTask,
  onWeatherClick,
  onOpenSettings,
  onOpenNotifications,
  onModalChange,
  onUpdateMachineHours,
  onAddMachineLog,
  alertCount
}) => {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [agendaModalDate, setAgendaModalDate] = useState<string | null>(null);
  
  // Task Creation State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  // newTaskDate is now derived from the selected agenda date usually, but we keep state for form manipulation
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [showResources, setShowResources] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [selectedStockId, setSelectedStockId] = useState('');
  const [plannedQty, setPlannedQty] = useState('');

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

  // --- 2. Lógica do AgroCalendário (Próximos 7 dias) ---
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
    setNewTaskDate(isoDate); // Pre-set form date to selected day
    setIsAddingTask(false); // Ensure form is closed initially
  };

  const handleAddNewTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const qty = plannedQty ? parseFloat(plannedQty) : undefined;
    
    // Use either the manually changed date or the current modal context date
    const finalDate = newTaskDate || agendaModalDate || new Date().toISOString().split('T')[0];

    onAddTask(
      newTaskTitle, 
      'task', 
      finalDate, 
      selectedFieldId || undefined, 
      selectedStockId || undefined, 
      qty
    );
    
    setNewTaskTitle('');
    setShowResources(false);
    setSelectedFieldId('');
    setSelectedStockId('');
    setPlannedQty('');
    setIsAddingTask(false); // Close form
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

  // Filter tasks for the modal
  const selectedDayTasks = useMemo(() => {
    if (!agendaModalDate) return [];
    return tasks.filter(t => t.date === agendaModalDate);
  }, [tasks, agendaModalDate]);

  return (
    <div className="space-y-8 animate-fade-in pt-6 pb-24">
      
      {/* 1. Header Fixo & Glass (Com Animação de Entrada) */}
      <div className="flex justify-between items-center px-2 animate-slide-down">
        <div>
          <h2 className="text-3xl font-black italic text-gray-900 dark:text-white leading-none">
            Olá, {userName.split(' ')[0]}
          </h2>
          <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">
            {formattedDate}
          </p>
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
                {/* Heartbeat Animation Layer */}
                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                {/* Icon Layer */}
                <div className="relative w-10 h-10 bg-red-500 text-white rounded-full shadow-lg shadow-red-500/50 flex items-center justify-center">
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

      {/* 2. Weather Hero Card (Modern Mesh Gradient) */}
      <div 
        onClick={() => setIsWeatherModalOpen(true)}
        className={`relative overflow-hidden rounded-[2.5rem] p-6 shadow-2xl active:scale-[0.98] transition-transform cursor-pointer animate-slide-up delay-100 ${
          isRaining 
            ? 'bg-slate-900 shadow-slate-900/40' 
            : 'bg-[#0f2612] shadow-agro-green/40'
        }`}
      >
         {/* --- Aurora / Mesh Background Effect --- */}
         <div className="absolute inset-0 z-0">
            {isRaining ? (
              <>
                <div className="absolute top-[-50%] right-[-20%] w-[80%] h-[120%] bg-indigo-900/40 rounded-full blur-[80px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-30%] left-[-20%] w-[80%] h-[80%] bg-slate-700/30 rounded-full blur-[60px]"></div>
              </>
            ) : (
              <>
                <div className="absolute top-[-50%] right-[-20%] w-[90%] h-[120%] bg-green-800/60 rounded-full blur-[80px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-20%] left-[-20%] w-[70%] h-[80%] bg-emerald-600/30 rounded-full blur-[60px]"></div>
                <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] bg-lime-500/10 rounded-full blur-[40px]"></div>
              </>
            )}
         </div>

         {/* Icon Decoration */}
         <div className="absolute inset-0 z-0 opacity-10 mix-blend-overlay pointer-events-none">
            {isRaining ? (
               <CloudRain className="absolute -right-8 -bottom-8 w-56 h-56 rotate-12 text-white" />
            ) : (
               <Sun className="absolute -right-12 -top-12 w-64 h-64 text-yellow-300 animate-spin-slow" />
            )}
         </div>

         {/* Content */}
         <div className="relative z-10 text-white">
            <div className="flex justify-between items-start">
               <div>
                  <div className="flex items-center gap-1.5 opacity-80 mb-2">
                    <MapPin size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Laundos, PT</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="text-7xl font-black tracking-tighter drop-shadow-sm">{currentWeather.temp}°</span>
                     <div className="flex flex-col">
                       {getWeatherIcon(currentWeather.condition, 32, "drop-shadow-md")}
                       <span className="text-sm font-bold mt-1 opacity-90 tracking-wide">{getWeatherLabel(currentWeather.condition)}</span>
                     </div>
                  </div>
               </div>
               
               <div className="flex flex-col gap-2 mt-2">
                  <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl flex items-center gap-2 border border-white/10 shadow-sm">
                    <Wind size={14} className="opacity-90" />
                    <span className="text-xs font-bold">{currentWeather.windSpeed} km/h</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl flex items-center gap-2 border border-white/10 shadow-sm">
                    <Droplets size={14} className="opacity-90" />
                    <span className="text-xs font-bold">{currentWeather.humidity}%</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* 4. Agenda Horizontal (Updated Design & Animation Logic) */}
      <div className="animate-slide-up delay-200">
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
                  
                  {/* Dots Indicators */}
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

      {/* 6. Máquinas Rápidas (Horizontal Scroll) */}
      {machines.length > 0 && (
        <div className="animate-slide-up delay-300">
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

      {/* --- AGENDA DAY POP-UP (New Feature) --- */}
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
               
               {/* Create Task Form (Inside Modal) */}
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

                     return (
                       <div 
                         key={task.id} 
                         className={`group p-4 rounded-[1.5rem] shadow-sm border flex items-center gap-4 active:scale-[0.99] transition-all ${
                           task.completed 
                             ? 'bg-gray-50 dark:bg-neutral-800 border-transparent opacity-60' 
                             : 'bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800'
                         }`}
                       >
                          <button 
                            onClick={() => onToggleTask(task.id)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              task.completed 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'border-gray-300 dark:border-neutral-600 hover:border-agro-green'
                            }`}
                          >
                            {task.completed ? <Check size={14} /> : <Circle size={0} className="opacity-0" />}
                          </button>
                          
                          <div className="flex-1 min-w-0">
                             <p className={`font-bold text-sm ${task.completed ? 'text-gray-500 line-through' : 'text-gray-800 dark:text-white'} truncate`}>
                               {task.title}
                             </p>
                             
                             {(linkedField || linkedStock) && (
                               <div className="flex flex-wrap gap-2 mt-2">
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
                               </div>
                             )}
                          </div>
                          
                          <button 
                            onClick={() => onDeleteTask(task.id)}
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

      {/* 7. Quick Action Modal */}
      {selectedMachine && quickAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-6" onClick={() => setSelectedMachine(null)}>
           <div className="bg-white dark:bg-neutral-900 w-full max-w-sm p-6 rounded-[2.5rem] shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {quickAction === 'hours' ? 'Registar Horas' : 'Abastecimento'}
              </h3>
              <p className="text-xs text-gray-400 uppercase font-bold mb-6">{selectedMachine.name}</p>

              {quickAction === 'hours' ? (
                <div className="mb-6 bg-gray-50 dark:bg-neutral-800 p-4 rounded-[2rem]">
                   <input 
                     type="number"
                     autoFocus
                     value={hoursInput}
                     onChange={(e) => setHoursInput(e.target.value)}
                     className="w-full text-center text-5xl font-black bg-transparent outline-none text-gray-900 dark:text-white"
                   />
                   <p className="text-center text-xs font-bold text-gray-400 mt-2 uppercase">Total Horas</p>
                </div>
              ) : (
                <div className="space-y-4 mb-6">
                   <div className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-[1.5rem]">
                     <label className="text-xs font-bold text-gray-400 uppercase ml-1">Litros</label>
                     <input 
                       type="number"
                       autoFocus
                       value={fuelLiters}
                       onChange={(e) => setFuelLiters(e.target.value)}
                       className="w-full text-2xl font-black bg-transparent outline-none mt-1 text-gray-900 dark:text-white"
                       placeholder="0"
                     />
                   </div>
                   <div className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-[1.5rem]">
                     <label className="text-xs font-bold text-gray-400 uppercase ml-1">Custo Total (€)</label>
                     <input 
                       type="number"
                       value={fuelCost}
                       onChange={(e) => setFuelCost(e.target.value)}
                       className="w-full text-xl font-bold bg-transparent outline-none mt-1 text-gray-900 dark:text-white"
                       placeholder="0.00"
                     />
                   </div>
                </div>
              )}

              <button 
                onClick={handleConfirmQuickAction}
                className="w-full py-4 bg-agro-green text-white rounded-[1.5rem] font-bold shadow-lg active:scale-95 transition-transform"
              >
                Confirmar
              </button>
           </div>
        </div>
      )}

      {/* 8. Weather Detail Modal */}
      {isWeatherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4" onClick={() => setIsWeatherModalOpen(false)}>
          <div className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl animate-scale-up border border-white/20" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold dark:text-white">Previsão 5 Dias</h3>
               <button onClick={() => setIsWeatherModalOpen(false)} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                 <X size={20} className="dark:text-white" />
               </button>
             </div>
             
             <div className="space-y-3">
               {weather.map((day, idx) => (
                 <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <div className="flex items-center gap-3">
                       <span className="w-10 font-bold text-gray-400">{day.day}</span>
                       {getWeatherIcon(day.condition, 20)}
                    </div>
                    <div className="flex items-center gap-4">
                       <span className="text-xs font-medium text-gray-500 capitalize">{getWeatherLabel(day.condition)}</span>
                       <span className="font-black text-lg dark:text-white">{day.temp}°</span>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;