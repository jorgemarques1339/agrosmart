
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sun, CloudRain, Calendar, Check, Plus, Trash2, 
  ArrowRight, X, User, CloudLightning, Wind, Droplets, MapPin,
  Settings, Bell, Sprout, Cloud, CloudSun,
  Tractor, Fuel, Clock, Gauge, Save, AlertTriangle, Truck, Eye
} from 'lucide-react';
import { Task, WeatherForecast, Field, Machine, MaintenanceLog } from '../types';

interface DashboardHomeProps {
  userName: string;
  weather: WeatherForecast[];
  tasks: Task[];
  fields: Field[];
  machines?: Machine[];
  onToggleTask: (id: string) => void;
  onAddTask: (title: string, type: 'task' | 'harvest', date?: string) => void;
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
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);

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
    onAddTask(newTaskTitle, 'task', newTaskDate);
    setNewTaskTitle('');
    setNewTaskDate(new Date().toISOString().split('T')[0]); // Reset para hoje
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

  // Ordenar tarefas: Pendentes primeiro, depois concluídas
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      // Primeiro ordenar por conclusão (pendentes primeiro)
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      // Depois ordenar por data (mais recentes primeiro)
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [tasks]);

  // Filtrar Frota Ativa
  const activeFleet = useMemo(() => {
    return machines.filter(m => m.status === 'active');
  }, [machines]);

  return (
    <div className="space-y-6 pb-24 animate-fade-in pt-4">
      
      {/* --- Secção 1: Cabeçalho Premium --- */}
      <div className="px-2">
        <div className="flex justify-between items-center mb-5">
          
          {/* Esquerda: Identidade & Data */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-agro-green to-green-600 flex items-center justify-center text-white shadow-lg shadow-green-900/20">
               <Sprout size={20} fill="currentColor" className="opacity-90" />
            </div>
            <div>
               <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none mb-1">
                 {userName}
               </h1>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                 {formattedDate}
               </p>
            </div>
          </div>
          
          {/* Direita: Ações (Alertas e Definições) */}
          <div className="flex gap-2">
            <button 
              onClick={onOpenNotifications}
              className="w-10 h-10 bg-white dark:bg-neutral-800 rounded-full flex items-center justify-center border border-gray-100 dark:border-neutral-700 shadow-sm active:scale-95 transition-transform relative"
            >
              <Bell size={18} className="text-gray-600 dark:text-gray-300" />
              {alertCount > 0 && (
                <span className="absolute top-2.5 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-neutral-800 animate-pulse"></span>
              )}
            </button>
            <button 
              onClick={onOpenSettings}
              className="w-10 h-10 bg-white dark:bg-neutral-800 rounded-full flex items-center justify-center border border-gray-100 dark:border-neutral-700 shadow-sm active:scale-95 transition-transform"
            >
              <Settings size={18} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Widget Meteorológico Compacto */}
        <div 
          onClick={() => setIsWeatherModalOpen(true)}
          className={`relative w-full rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-500 hover:scale-[1.01] active:scale-[0.98] shadow-lg ${
            isRaining 
              ? 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-white shadow-slate-900/20' 
              : 'bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600 text-white shadow-orange-900/20'
          }`}
        >
          {/* Background Pattern - Smaller */}
          <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none">
            {isRaining ? <CloudRain size={140} /> : <Sun size={140} />}
          </div>

          <div className="relative z-10 p-4 flex flex-col gap-4">
            
            {/* Top Row: Main Info */}
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-1 opacity-90 mb-0.5">
                  <MapPin size={12} />
                  <span className="text-[10px] font-bold tracking-widest uppercase">Localização Atual</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-black tracking-tighter leading-none">{currentWeather.temp}°</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold leading-none capitalize">{currentWeather.description || getWeatherLabel(currentWeather.condition)}</span>
                    <span className="text-[10px] opacity-80 mt-0.5 flex items-center gap-1"><Eye size={10} /> Monitorização Ativa</span>
                  </div>
                </div>
              </div>

               {/* Date Badge - Compact */}
               <div className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 flex flex-col items-center justify-center min-w-[3.5rem]">
                  <span className="text-[9px] font-bold uppercase opacity-80">{new Date().toLocaleDateString('pt-PT', { weekday: 'short' }).replace('.', '')}</span>
                  <span className="text-lg font-black leading-none">{new Date().getDate()}</span>
               </div>
            </div>

            {/* Bottom Row: Compact Details Grid - REAL DATA */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-black/10 backdrop-blur-sm rounded-xl p-2 flex items-center justify-center gap-2 border border-white/5">
                <Wind size={14} className="opacity-80" />
                <div className="flex flex-col leading-none">
                    <span className="text-xs font-bold">{currentWeather.windSpeed || '--'}</span>
                    <span className="text-[8px] opacity-60 uppercase">km/h</span>
                </div>
              </div>
              <div className="bg-black/10 backdrop-blur-sm rounded-xl p-2 flex items-center justify-center gap-2 border border-white/5">
                <Droplets size={14} className="opacity-80" />
                <div className="flex flex-col leading-none">
                    <span className="text-xs font-bold">{currentWeather.humidity || '--'}%</span>
                    <span className="text-[8px] opacity-60 uppercase">Hum.</span>
                </div>
              </div>
              <div className="bg-black/10 backdrop-blur-sm rounded-xl p-2 flex items-center justify-center gap-2 border border-white/5">
                <CloudLightning size={14} className="opacity-80" />
                <div className="flex flex-col leading-none">
                    <span className="text-xs font-bold">Auto</span>
                    <span className="text-[8px] opacity-60 uppercase">Vigilante</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* --- Secção: Frota Rápida (Otimizada Mobile/Tablet) --- */}
      {activeFleet.length > 0 && (
        <div className="px-2">
          <div className="flex items-center justify-between px-2 mb-3">
             <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Tractor size={16} className="text-agro-green" />
                Frota Ativa
             </h3>
             <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{activeFleet.length} Veículos</span>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x px-2">
             {activeFleet.map(machine => {
                const hoursSinceService = machine.engineHours - machine.lastServiceHours;
                const isMaintenanceDue = hoursSinceService > machine.serviceInterval;

                return (
                  <div 
                    key={machine.id}
                    className={`min-w-[18rem] md:min-w-[22rem] bg-white dark:bg-neutral-900 rounded-[2.2rem] p-5 shadow-sm border snap-center transition-all ${
                      isMaintenanceDue 
                        ? 'border-red-200 dark:border-red-900/50 shadow-red-500/10' 
                        : 'border-gray-100 dark:border-neutral-800'
                    }`}
                  >
                    {/* Header: Icon, Name, Hours */}
                    <div className="flex items-start justify-between mb-4">
                       <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-2xl ${isMaintenanceDue ? 'bg-red-50 text-red-500' : 'bg-gray-100 dark:bg-neutral-800 text-gray-500'}`}>
                             {machine.type === 'vehicle' ? <Truck size={22} /> : <Tractor size={22} />}
                          </div>
                          <div>
                             <h4 className="text-base font-black text-gray-900 dark:text-white leading-none">{machine.name}</h4>
                             <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-wider">{machine.engineHours}h Registadas</p>
                          </div>
                       </div>
                       {isMaintenanceDue && (
                         <div className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full animate-pulse">
                           <AlertTriangle size={16} />
                         </div>
                       )}
                    </div>

                    {/* Fuel Indicator (Visual Context for Refuel) */}
                    <div className="mb-5 bg-gray-50 dark:bg-neutral-800/50 p-3 rounded-2xl border border-gray-100 dark:border-neutral-800/50">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                               <Fuel size={10} /> Combustível
                            </span>
                            <span className={`text-[10px] font-bold ${machine.fuelLevel < 20 ? 'text-red-500' : 'text-gray-500'}`}>
                                {machine.fuelLevel}%
                            </span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                machine.fuelLevel < 20 ? 'bg-red-500' : 'bg-orange-400'
                              }`} 
                              style={{ width: `${machine.fuelLevel}%` }}
                            ></div>
                        </div>
                    </div>
                    
                    {/* Big Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                       <button 
                         onClick={() => handleOpenQuickAction(machine, 'hours')}
                         className="flex flex-col items-center justify-center gap-1 bg-gray-50 dark:bg-neutral-800 py-4 rounded-2xl active:scale-95 transition-all border border-gray-100 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-700"
                       >
                          <Clock size={20} className="text-gray-400" />
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Horas</span>
                       </button>
                       <button 
                         onClick={() => handleOpenQuickAction(machine, 'fuel')}
                         className="flex flex-col items-center justify-center gap-1 bg-green-50 dark:bg-green-900/10 py-4 rounded-2xl active:scale-95 transition-all border border-green-100 dark:border-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/20"
                       >
                          <Fuel size={20} className="text-green-600 dark:text-green-500" />
                          <span className="text-xs font-bold text-green-700 dark:text-green-400">Abastecer</span>
                       </button>
                    </div>
                  </div>
                );
             })}
          </div>
        </div>
      )}

      {/* --- Secção 2: AgroCalendário --- */}
      <div>
        <div className="flex items-center justify-between px-4 mb-3">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar size={16} className="text-agro-green" />
            Planeamento
          </h3>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">7 Dias</span>
        </div>
        
        {/* Scroll Horizontal Container */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide snap-x">
          {calendarDays.map((day, idx) => (
            <div 
              key={idx}
              className={`flex flex-col items-center justify-center min-w-[3rem] h-16 rounded-[1.2rem] snap-start transition-all ${
                day.isToday 
                  ? 'bg-agro-green text-white shadow-lg shadow-agro-green/30 scale-105' 
                  : 'bg-white dark:bg-neutral-900 text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-neutral-800'
              }`}
            >
              <span className="text-[9px] font-bold uppercase tracking-wider mb-0.5 opacity-80">
                {day.dayName.slice(0,3)}
              </span>
              <span className="text-lg font-black leading-none">
                {day.dayNumber}
              </span>
              
              {/* Pontos Indicadores */}
              <div className="flex gap-1 mt-1">
                {day.hasTask && (
                  <div className={`w-1 h-1 rounded-full ${day.isToday ? 'bg-orange-400' : 'bg-agro-green'}`}></div>
                )}
                {day.hasHarvest && (
                  <div className={`w-1 h-1 rounded-full ${day.isToday ? 'bg-white' : 'bg-green-500'}`}></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Secção 3: AgroAgenda (Tarefas) --- */}
      <div className="px-2">
        <div className="flex items-center justify-between mb-3 px-2">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">AgroAgenda</h3>
          {!isAddingTask && (
            <button 
              onClick={() => setIsAddingTask(true)}
              className="text-[10px] font-bold text-agro-green dark:text-agro-darkGreen bg-agro-green/10 px-2.5 py-1 rounded-lg active:scale-95 transition-transform flex items-center gap-1"
            >
              <Plus size={12} /> Nova Tarefa
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-[2rem] p-2 shadow-sm border border-gray-100 dark:border-neutral-800 min-h-[150px]">
          
          {/* Inline Add Form */}
          {isAddingTask && (
            <div className="p-3 mb-2 bg-gray-50 dark:bg-neutral-800 rounded-[1.5rem] animate-slide-down border border-agro-green/20">
              <input 
                autoFocus
                type="text" 
                placeholder="O que precisa de ser feito?"
                className="w-full bg-transparent p-2 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNewTask()}
              />
              
              <div className="flex items-center gap-2 px-2 mt-1">
                <div className="flex items-center gap-2 bg-white dark:bg-neutral-700 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-neutral-600 flex-1">
                  <Calendar size={14} className="text-gray-400" />
                  <input 
                    type="date"
                    className="bg-transparent text-xs font-medium text-gray-600 dark:text-gray-300 outline-none w-full"
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-3 px-1 pb-1">
                <button 
                  onClick={() => setIsAddingTask(false)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={16} />
                </button>
                <button 
                  onClick={handleAddNewTask}
                  className="bg-agro-green text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md active:scale-95 transition-transform"
                >
                  Agendar
                </button>
              </div>
            </div>
          )}

          {/* Task List */}
          <div className="space-y-1">
            {sortedTasks.length === 0 && !isAddingTask ? (
              <div className="flex flex-col items-center justify-center py-8 text-center opacity-50">
                <Check size={32} className="mb-2 text-gray-300" />
                <p className="text-xs font-medium text-gray-400">Tudo em dia!</p>
              </div>
            ) : (
              sortedTasks.map(task => (
                <div 
                  key={task.id} 
                  className={`group flex items-center justify-between p-3 rounded-[1.5rem] transition-all duration-300 ${
                    task.completed 
                      ? 'bg-transparent opacity-60' 
                      : 'bg-white dark:bg-neutral-800/50 hover:bg-gray-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button 
                      onClick={() => onToggleTask(task.id)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        task.completed 
                          ? 'bg-agro-green border-agro-green text-white' 
                          : 'border-gray-300 dark:border-neutral-600 hover:border-agro-green'
                      }`}
                    >
                      {task.completed && <Check size={12} strokeWidth={3} />}
                    </button>
                    
                    <div className="flex-1 truncate">
                      <p className={`text-sm font-bold truncate transition-all ${
                        task.completed 
                          ? 'text-gray-400 line-through decoration-2' 
                          : 'text-gray-800 dark:text-gray-100'
                      }`}>
                        {task.title}
                      </p>
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
                        {task.type === 'harvest' ? 'Colheita' : 'Geral'} • 
                        <span className={task.date === new Date().toISOString().split('T')[0] ? 'text-agro-green font-bold' : ''}>
                           {new Date(task.date).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* --- WEATHER FORECAST MODAL --- */}
      {isWeatherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsWeatherModalOpen(false)}>
          <div 
            className="bg-white dark:bg-neutral-900 w-full max-w-md p-6 rounded-t-[2.5rem] shadow-2xl animate-slide-up border-t border-white/20 relative overflow-hidden" 
            onClick={e => e.stopPropagation()}
          >
             {/* Decorative Background Icon */}
             {isRaining ? (
               <CloudRain className="absolute -top-10 -right-10 text-blue-50 dark:text-blue-900/10 w-64 h-64 pointer-events-none" />
             ) : (
               <Sun className="absolute -top-10 -right-10 text-orange-50 dark:text-orange-900/10 w-64 h-64 pointer-events-none" />
             )}

            <div className="flex justify-between items-center mb-6 relative z-10">
              <div>
                <h3 className="text-xl font-bold dark:text-white">Previsão</h3>
                <p className="text-sm text-gray-400 font-medium">Próximos 3 Dias</p>
              </div>
              <button onClick={() => setIsWeatherModalOpen(false)} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full hover:bg-gray-200 transition-colors">
                <X size={20} className="dark:text-white" />
              </button>
            </div>

            <div className="space-y-3 relative z-10">
              {weather.slice(1, 4).map((forecast, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-[1.5rem] border border-gray-100 dark:border-neutral-800"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      forecast.condition === 'sunny' ? 'bg-orange-100 text-orange-500' :
                      forecast.condition === 'rain' ? 'bg-blue-100 text-blue-500' :
                      forecast.condition === 'storm' ? 'bg-purple-100 text-purple-500' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {getWeatherIcon(forecast.condition, 24)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-lg">{forecast.day}</p>
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{forecast.description || getWeatherLabel(forecast.condition)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-gray-900 dark:text-white">{forecast.temp}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- QUICK ACTION MODAL --- */}
      {selectedMachine && quickAction && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedMachine(null)}>
          <div 
            className="bg-white dark:bg-neutral-900 w-full max-w-md p-6 rounded-t-[2.5rem] shadow-2xl animate-slide-up border-t border-white/20" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold dark:text-white">
                  {quickAction === 'hours' ? 'Atualizar Horómetro' : 'Abastecimento Rápido'}
                </h3>
                <p className="text-xs text-gray-500 font-bold uppercase">{selectedMachine.name}</p>
              </div>
              <button onClick={() => setSelectedMachine(null)} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                <X size={20} className="dark:text-white" />
              </button>
            </div>

            {quickAction === 'hours' ? (
              <div className="space-y-6">
                 <div className="flex items-center gap-4 bg-gray-50 dark:bg-neutral-800 p-4 rounded-[2rem]">
                   <button 
                      onClick={() => setHoursInput((parseFloat(hoursInput || '0') - 1).toString())}
                      className="w-16 h-16 bg-white dark:bg-neutral-700 rounded-2xl shadow-sm flex items-center justify-center text-gray-600 active:scale-90 transition-transform"
                   >
                     <span className="text-2xl font-bold">-</span>
                   </button>
                   <div className="flex-1 text-center">
                     <input 
                        type="number"
                        className="bg-transparent text-center text-4xl font-black text-gray-900 dark:text-white outline-none w-full"
                        value={hoursInput}
                        onChange={(e) => setHoursInput(e.target.value)}
                     />
                     <span className="text-xs font-bold text-gray-400 uppercase">Horas Totais</span>
                   </div>
                   <button 
                      onClick={() => setHoursInput((parseFloat(hoursInput || '0') + 1).toString())}
                      className="w-16 h-16 bg-agro-green rounded-2xl shadow-lg shadow-agro-green/30 flex items-center justify-center text-white active:scale-90 transition-transform"
                   >
                     <span className="text-2xl font-bold">+</span>
                   </button>
                 </div>
              </div>
            ) : (
              <div className="space-y-4">
                 <div className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-3xl border border-gray-100 dark:border-neutral-700">
                    <label className="text-xs font-bold uppercase text-gray-400 ml-2">Litros</label>
                    <div className="relative mt-2">
                      <input 
                        type="number" 
                        value={fuelLiters}
                        onChange={(e) => setFuelLiters(e.target.value)}
                        className="w-full p-4 bg-white dark:bg-neutral-700 rounded-2xl text-3xl font-black dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                        placeholder="0"
                        autoFocus
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">L</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-gray-400 ml-2">Custo Total (€) <span className="text-[10px] font-normal opacity-60">(Opcional)</span></label>
                    <input 
                      type="number" 
                      value={fuelCost}
                      onChange={(e) => setFuelCost(e.target.value)}
                      className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl mt-1 text-lg font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/10 rounded-2xl text-xs text-orange-700 dark:text-orange-300">
                    <AlertTriangle size={16} />
                    <span>O valor será descontado do stock de gasóleo.</span>
                  </div>
              </div>
            )}

            <button 
              onClick={handleConfirmQuickAction}
              className="w-full py-5 bg-agro-green text-white rounded-[1.5rem] font-bold text-xl shadow-lg active:scale-95 transition-transform mt-6"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardHome;
