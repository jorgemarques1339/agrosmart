
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sun, CloudRain, Calendar, Check, Plus, Trash2, 
  ArrowRight, X, User, CloudLightning, Wind, Droplets, MapPin,
  Settings, Bell, Sprout, Cloud, CloudSun,
  Tractor, Fuel, Clock, Gauge, Save, AlertTriangle, Truck, Eye, Package,
  ChevronDown, ShoppingBag, Link as LinkIcon
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
  
  // Task Creation State
  const [newTaskTitle, setNewTaskTitle] = useState('');
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
      onModalChange(isWeatherModalOpen || !!selectedMachine);
    }
  }, [isWeatherModalOpen, selectedMachine, onModalChange]);

  // --- 1. Lógica de Tempo e Saudação ---
  const today = new Date();
  
  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('pt-PT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(today);
  }, []);

  // Dados do tempo atual (assumindo o primeiro do array como 'hoje')
  const currentWeather = weather[0] || { temp: 0, condition: 'cloudy', day: 'Carregando...', windSpeed: 0, humidity: 0 };
  const isRaining = currentWeather.condition === 'rain' || currentWeather.condition === 'storm';

  // Helper para ícones do tempo
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
      
      // Verificar se há tarefas ou colheitas para este dia
      const hasTask = tasks.some(t => t.date === isoDate && !t.completed);
      const hasHarvest = fields.some(f => f.harvestWindow.includes(date.toLocaleString('pt-PT', { month: 'long' }))); // Lógica simplificada para demo
      
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
  const handleAddNewTask = () => {
    if (!newTaskTitle.trim()) return;
    
    // Convert qty to number if present
    const qty = plannedQty ? parseFloat(plannedQty) : undefined;
    
    onAddTask(
      newTaskTitle, 
      'task', 
      newTaskDate, 
      selectedFieldId || undefined, 
      selectedStockId || undefined, 
      qty
    );
    
    // Reset Form
    setNewTaskTitle('');
    setNewTaskDate(new Date().toISOString().split('T')[0]); // Reset para hoje
    setShowResources(false);
    setSelectedFieldId('');
    setSelectedStockId('');
    setPlannedQty('');
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
    
    // Close modal
    setSelectedMachine(null);
    setQuickAction(null);
  };

  // Helper para encontrar unidade do stock selecionado
  const selectedStockUnit = useMemo(() => {
    const s = stocks.find(i => i.id === selectedStockId);
    return s ? s.unit : '';
  }, [selectedStockId, stocks]);

  return (
    <div className="space-y-6 animate-fade-in pt-4 pb-20">
      
      {/* 1. Header & Greeting */}
      <div className="flex justify-between items-start px-2">
        <div>
          <h2 className="text-3xl font-black italic text-gray-900 dark:text-white leading-none">
            Bom dia,<br/>{userName}
          </h2>
          <p className="text-sm text-gray-500 font-medium tracking-wide mt-2 first-letter:uppercase">
            {formattedDate}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onOpenSettings} className="p-3 rounded-2xl bg-white dark:bg-neutral-800 text-gray-400 hover:text-agro-green shadow-sm border border-gray-100 dark:border-neutral-800 transition-colors">
            <Settings size={22} />
          </button>
          <button onClick={onOpenNotifications} className="p-3 rounded-2xl bg-white dark:bg-neutral-800 text-gray-400 hover:text-agro-green shadow-sm border border-gray-100 dark:border-neutral-800 transition-colors relative">
            <Bell size={22} />
            {alertCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-neutral-800 animate-pulse"></span>
            )}
          </button>
        </div>
      </div>

      {/* 2. Weather Card (Hero) */}
      <div 
        onClick={() => setIsWeatherModalOpen(true)}
        className={`relative overflow-hidden rounded-[2.5rem] p-6 shadow-xl transition-transform active:scale-[0.99] cursor-pointer ${
          isRaining 
            ? 'bg-gradient-to-br from-slate-700 to-slate-900 shadow-slate-900/30' 
            : 'bg-gradient-to-br from-[#3E6837] to-[#2D4F00] shadow-agro-green/30'
        }`}
      >
         <div className="relative z-10 flex justify-between items-center text-white">
            <div>
               <div className="flex items-center gap-2 opacity-90 mb-1">
                 <MapPin size={14} />
                 <span className="text-xs font-bold uppercase tracking-widest">Laundos, PT</span>
               </div>
               <div className="flex items-center gap-3">
                  <span className="text-6xl font-black tracking-tighter">{currentWeather.temp}°</span>
                  <div className="flex flex-col">
                    {getWeatherIcon(currentWeather.condition, 32)}
                    <span className="text-xs font-medium mt-1">{getWeatherLabel(currentWeather.condition)}</span>
                  </div>
               </div>
            </div>
            
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-2 min-w-[100px]">
               <div className="flex items-center gap-2">
                 <Wind size={16} className="opacity-70" />
                 <span className="text-sm font-bold">{currentWeather.windSpeed} km/h</span>
               </div>
               <div className="flex items-center gap-2">
                 <Droplets size={16} className="opacity-70" />
                 <span className="text-sm font-bold">{currentWeather.humidity}%</span>
               </div>
            </div>
         </div>

         {/* Weather Decorator */}
         {isRaining ? (
           <CloudRain className="absolute -right-10 -bottom-10 text-white/10 w-64 h-64 rotate-12" />
         ) : (
           <Sun className="absolute -right-10 -bottom-10 text-yellow-400/20 w-64 h-64 rotate-12 animate-spin-slow" />
         )}
      </div>

      {/* 3. AgroCalendário (Horizontal Scroll) */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 px-2 flex items-center gap-2">
          <Calendar size={18} className="text-gray-400" /> Agenda
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-4 px-1 scrollbar-hide snap-x">
           {calendarDays.map((day, idx) => (
             <div 
               key={idx} 
               className={`snap-start min-w-[72px] flex flex-col items-center p-3 rounded-2xl border transition-all ${
                 day.isToday 
                   ? 'bg-agro-green text-white border-agro-green shadow-lg shadow-agro-green/20 scale-105' 
                   : 'bg-white dark:bg-neutral-900 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-neutral-800'
               }`}
             >
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{day.dayName}</span>
                <span className="text-2xl font-black my-1">{day.dayNumber}</span>
                
                {/* Dots Indicators */}
                <div className="flex gap-1 h-1.5 mt-1">
                  {day.hasTask && <div className={`w-1.5 h-1.5 rounded-full ${day.isToday ? 'bg-white' : 'bg-blue-400'}`}></div>}
                  {day.hasHarvest && <div className={`w-1.5 h-1.5 rounded-full ${day.isToday ? 'bg-yellow-300' : 'bg-yellow-400'}`}></div>}
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* 4. Tarefas e Atividades */}
      <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-6 shadow-sm border border-gray-100 dark:border-neutral-800">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tarefas</h3>
           <button 
             onClick={() => setIsAddingTask(!isAddingTask)}
             className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
               isAddingTask ? 'bg-red-100 text-red-500' : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300'
             }`}
           >
             {isAddingTask ? <X size={20} /> : <Plus size={20} />}
           </button>
        </div>

        {/* Add Task Form (Inline) */}
        {isAddingTask && (
          <div className="mb-6 animate-slide-down bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-3xl border border-gray-100 dark:border-neutral-700">
             <input 
               autoFocus
               type="text" 
               placeholder="O que precisa de ser feito?"
               className="w-full bg-transparent border-b-2 border-gray-200 dark:border-neutral-700 p-2 text-lg font-bold dark:text-white outline-none focus:border-agro-green placeholder:text-gray-400"
               value={newTaskTitle}
               onChange={(e) => setNewTaskTitle(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleAddNewTask()}
             />
             
             {/* Extended Resources Toggle */}
             <div className="mt-4">
                <button 
                  onClick={() => setShowResources(!showResources)}
                  className={`text-xs font-bold uppercase flex items-center gap-1 mb-3 transition-colors ${showResources ? 'text-agro-green' : 'text-gray-400'}`}
                >
                  <LinkIcon size={12} /> {showResources ? 'Ocultar Recursos' : 'Associar Recursos (Stock/Campo)'}
                </button>

                {showResources && (
                  <div className="grid grid-cols-1 gap-3 animate-fade-in bg-white dark:bg-neutral-900 p-3 rounded-2xl border border-gray-100 dark:border-neutral-800">
                     {/* Select Field */}
                     <div className="flex items-center gap-2 bg-gray-100 dark:bg-neutral-800 p-2 rounded-xl">
                        <MapPin size={16} className="text-gray-400" />
                        <select 
                          className="bg-transparent w-full text-sm font-bold text-gray-700 dark:text-gray-200 outline-none"
                          value={selectedFieldId}
                          onChange={(e) => setSelectedFieldId(e.target.value)}
                        >
                          <option value="">Selecione Campo (Opcional)</option>
                          {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                     </div>

                     {/* Select Stock */}
                     <div className="flex items-center gap-2 bg-gray-100 dark:bg-neutral-800 p-2 rounded-xl">
                        <Package size={16} className="text-gray-400" />
                        <select 
                          className="bg-transparent w-full text-sm font-bold text-gray-700 dark:text-gray-200 outline-none"
                          value={selectedStockId}
                          onChange={(e) => setSelectedStockId(e.target.value)}
                        >
                          <option value="">Selecione Produto (Opcional)</option>
                          {stocks.map(s => <option key={s.id} value={s.id} disabled={s.quantity <= 0}>{s.name} ({s.quantity} {s.unit})</option>)}
                        </select>
                     </div>

                     {/* Quantity */}
                     {selectedStockId && (
                       <div className="flex items-center gap-2 bg-gray-100 dark:bg-neutral-800 p-2 rounded-xl border border-agro-green/30">
                          <ShoppingBag size={16} className="text-agro-green" />
                          <input 
                            type="number"
                            placeholder="Qtd a usar"
                            className="bg-transparent w-full text-sm font-bold text-gray-900 dark:text-white outline-none"
                            value={plannedQty}
                            onChange={(e) => setPlannedQty(e.target.value)}
                          />
                          <span className="text-xs font-bold text-gray-400 px-2">{selectedStockUnit}</span>
                       </div>
                     )}
                  </div>
                )}
             </div>

             <div className="flex justify-between items-center mt-4">
                <input 
                  type="date" 
                  className="bg-white dark:bg-neutral-800 rounded-xl px-3 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 outline-none border border-gray-100 dark:border-neutral-700"
                  value={newTaskDate}
                  onChange={(e) => setNewTaskDate(e.target.value)}
                />
                <button 
                  onClick={handleAddNewTask}
                  className="px-6 py-2 bg-agro-green text-white rounded-xl font-bold shadow-lg shadow-agro-green/20 active:scale-95 transition-transform"
                >
                  Adicionar
                </button>
             </div>
          </div>
        )}

        {/* Task List */}
        <div className="space-y-3">
           {tasks.filter(t => !t.completed).length === 0 && !isAddingTask && (
             <div className="text-center py-8 opacity-50">
               <Check className="mx-auto mb-2 text-gray-300" size={32} />
               <p className="text-sm font-bold text-gray-400">Tudo feito por hoje!</p>
             </div>
           )}

           {tasks.filter(t => !t.completed).map(task => {
             // Find resource names for display
             const linkedField = fields.find(f => f.id === task.relatedFieldId);
             const linkedStock = stocks.find(s => s.id === task.relatedStockId);

             return (
               <div key={task.id} className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-neutral-800 relative">
                  <button 
                    onClick={() => onToggleTask(task.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      task.completed ? 'bg-agro-green border-agro-green' : 'border-gray-300 dark:border-neutral-600'
                    }`}
                  >
                    {task.completed && <Check size={14} className="text-white" />}
                  </button>
                  
                  <div className="flex-1">
                     <p className={`font-bold text-sm text-gray-800 dark:text-white ${task.completed ? 'line-through opacity-50' : ''}`}>
                       {task.title}
                     </p>
                     
                     {/* Resource Badges */}
                     {(linkedField || linkedStock) && (
                       <div className="flex flex-wrap gap-2 mt-1.5">
                          {linkedField && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">
                               <MapPin size={8} /> {linkedField.name}
                            </span>
                          )}
                          {linkedStock && task.plannedQuantity && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">
                               <Package size={8} /> {linkedStock.name}: {task.plannedQuantity}{linkedStock.unit}
                            </span>
                          )}
                       </div>
                     )}
                  </div>
                  
                  <button 
                    onClick={() => onDeleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 p-2 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
               </div>
             );
           })}
        </div>
      </div>

      {/* 5. Máquinas Rápidas (Slide Horizontal) */}
      {machines.length > 0 && (
        <div className="mt-2">
           <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 px-2 flex items-center gap-2">
             <Tractor size={18} className="text-gray-400" /> Acesso Rápido
           </h3>
           <div className="flex gap-3 overflow-x-auto pb-4 px-1 scrollbar-hide">
              {machines.slice(0, 3).map(machine => (
                <div key={machine.id} className="min-w-[160px] bg-white dark:bg-neutral-900 p-4 rounded-[2rem] border border-gray-100 dark:border-neutral-800 shadow-sm flex flex-col items-center text-center">
                   <div className="w-12 h-12 bg-gray-50 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-2 text-gray-600 dark:text-gray-300">
                      {machine.type === 'vehicle' ? <Truck size={24} /> : <Tractor size={24} />}
                   </div>
                   <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">{machine.name}</p>
                   <p className="text-[10px] text-gray-400 mb-3">{machine.plate}</p>
                   
                   <div className="flex gap-2 w-full">
                      <button 
                        onClick={() => handleOpenQuickAction(machine, 'hours')}
                        className="flex-1 py-2 bg-gray-100 dark:bg-neutral-800 rounded-xl text-gray-600 dark:text-gray-300 flex justify-center active:scale-90 transition-transform"
                      >
                         <Clock size={16} />
                      </button>
                      <button 
                        onClick={() => handleOpenQuickAction(machine, 'fuel')}
                        className="flex-1 py-2 bg-agro-green/10 text-agro-green rounded-xl flex justify-center active:scale-90 transition-transform"
                      >
                         <Fuel size={16} />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* 6. Quick Action Modal */}
      {selectedMachine && quickAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4" onClick={() => setSelectedMachine(null)}>
           <div className="bg-white dark:bg-neutral-900 w-full max-w-sm p-6 rounded-[2.5rem] shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {quickAction === 'hours' ? 'Registar Horas' : 'Abastecimento'}
              </h3>
              <p className="text-xs text-gray-400 uppercase font-bold mb-6">{selectedMachine.name}</p>

              {quickAction === 'hours' ? (
                <div className="mb-6">
                   <input 
                     type="number"
                     autoFocus
                     value={hoursInput}
                     onChange={(e) => setHoursInput(e.target.value)}
                     className="w-full text-center text-5xl font-black bg-transparent border-b-2 border-gray-200 dark:border-neutral-700 outline-none focus:border-agro-green text-gray-900 dark:text-white"
                   />
                </div>
              ) : (
                <div className="space-y-4 mb-6">
                   <div>
                     <label className="text-xs font-bold text-gray-400 uppercase ml-1">Litros</label>
                     <input 
                       type="number"
                       autoFocus
                       value={fuelLiters}
                       onChange={(e) => setFuelLiters(e.target.value)}
                       className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl text-2xl font-black outline-none focus:ring-2 focus:ring-agro-green dark:text-white"
                       placeholder="0"
                     />
                   </div>
                   <div>
                     <label className="text-xs font-bold text-gray-400 uppercase ml-1">Custo Total (€)</label>
                     <input 
                       type="number"
                       value={fuelCost}
                       onChange={(e) => setFuelCost(e.target.value)}
                       className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl text-xl font-bold outline-none focus:ring-2 focus:ring-agro-green dark:text-white"
                       placeholder="0.00"
                     />
                   </div>
                </div>
              )}

              <button 
                onClick={handleConfirmQuickAction}
                className="w-full py-4 bg-agro-green text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-transform"
              >
                Confirmar
              </button>
           </div>
        </div>
      )}

      {/* 7. Weather Detail Modal */}
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
                 <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl">
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
