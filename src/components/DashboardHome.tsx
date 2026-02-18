
import React, { useState, useMemo } from 'react';
import { 
  Bell, Settings, Wind, Droplets, 
  Plus, Scan, Wallet, Tractor, Heart, 
  Check, Calendar, MapPin, Sun, Cloud, 
  CloudRain, CloudLightning, ArrowRight, Activity,
  MoreHorizontal, CloudSun, X, Thermometer, SprayCan, ChevronRight, User,
  ChevronDown, PawPrint
} from 'lucide-react';
import { 
  WeatherForecast, DetailedForecast, Task, Field, Machine, 
  StockItem, UserProfile, MaintenanceLog, Animal
} from '../types';

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
  onToggleTask: (id: string) => void;
  onAddTask: (title: string, type: 'task' | 'harvest', date?: string, relatedFieldId?: string, relatedStockId?: string, plannedQuantity?: number, assignedTo?: string) => void;
  onDeleteTask: (id: string) => void;
  onWeatherClick: () => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onModalChange: (isOpen: boolean) => void;
  onUpdateMachineHours: (id: string, hours: number) => void;
  onAddMachineLog: (machineId: string, log: Omit<MaintenanceLog, 'id'>) => void;
  onTaskClick: (task: Task) => void;
  onNavigate: (tab: string) => void;
  alertCount: number;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({
  userName,
  weather,
  hourlyForecast,
  tasks,
  machines,
  animals,
  users,
  currentUser,
  onToggleTask,
  onAddTask,
  onOpenSettings,
  onOpenNotifications,
  onNavigate,
  onModalChange,
  alertCount,
  onTaskClick
}) => {
  const [isInlineInputOpen, setIsInlineInputOpen] = useState(false);
  
  // New Task Form States
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  
  // Estado para o Modal de Tempo
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [weatherTab, setWeatherTab] = useState<'forecast' | 'spraying'>('forecast');

  // Atualizar pai sobre modal aberto
  React.useEffect(() => {
    if (onModalChange) {
      onModalChange(isWeatherModalOpen);
    }
  }, [isWeatherModalOpen, onModalChange]);
  
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

  const handleQuickAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(
        newTaskTitle, 
        'task', 
        newTaskDate, 
        undefined, 
        undefined, 
        undefined, 
        newTaskAssignee || currentUser.id
      );
      // Reset Form
      setNewTaskTitle('');
      setNewTaskDate(new Date().toISOString().split('T')[0]);
      setNewTaskAssignee('');
      setIsInlineInputOpen(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-28 pt-2">
      
      {/* 1. HEADER: GREETINGS & NOTIFICATIONS */}
      <div className="flex justify-between items-end px-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Visão Geral</p>
          <h1 className="text-4xl font-black italic text-gray-900 dark:text-white leading-none">
            Olá, {userName.split(' ')[0]}
          </h1>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={onOpenNotifications} 
             className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 border-2 ${
                alertCount > 0 
                  ? 'bg-red-50 border-red-100 text-red-600 animate-pulse shadow-red-200' 
                  : 'bg-white border-gray-100 text-gray-400 shadow-sm dark:bg-neutral-800 dark:border-neutral-700'
             }`}
           >
              <Bell size={24} className={alertCount > 0 ? 'fill-current' : ''} />
              {alertCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-600 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-black text-white">
                  {alertCount}
                </span>
              )}
           </button>
           <button 
             onClick={onOpenSettings} 
             className="w-14 h-14 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black shadow-xl active:scale-90 transition-transform"
           >
              <Settings size={24} />
           </button>
        </div>
      </div>

      {/* 2. WEATHER HERO (Compact Version) */}
      {currentWeather && (
        <div 
          onClick={() => setIsWeatherModalOpen(true)}
          className="relative h-48 mx-2 rounded-[2.5rem] overflow-hidden shadow-2xl group transition-all hover:scale-[1.01] cursor-pointer"
        >
          {/* Background Image */}
          <img 
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1932&auto=format&fit=crop" 
            alt="Field"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
          
          {/* Glass Overlay - Inset 2 padding 4 */}
          <div className="absolute inset-2 bg-white/10 dark:bg-black/20 backdrop-blur-md rounded-[2rem] border border-white/20 p-4 flex flex-col justify-between shadow-inner">
             
             {/* Top Row */}
             <div className="flex justify-between items-start">
                <div className="bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                   <MapPin size={10} className="text-white" />
                   <span className="text-[9px] font-black text-white uppercase tracking-widest">Laundos, PT</span>
                </div>
                <div className="filter drop-shadow-2xl animate-pulse-slow">
                   {getWeatherIcon(currentWeather.condition, 52)}
                </div>
             </div>

             {/* Bottom Row */}
             <div className="flex items-end justify-between">
                <div>
                   <span className="text-5xl font-black text-white tracking-tighter leading-none block drop-shadow-md">
                      {currentWeather.temp}°
                   </span>
                   <span className="text-xs font-bold text-white/80 pl-1 uppercase tracking-wide flex items-center gap-1">
                      {currentWeather.condition === 'sunny' ? 'Céu Limpo' : currentWeather.condition === 'rain' ? 'Chuva' : 'Nublado'}
                      <ChevronRight size={12} />
                   </span>
                </div>

                <div className="flex gap-3">
                   <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-1">
                         <Wind size={14} className="text-white" />
                      </div>
                      <span className="text-[9px] font-bold text-white">{currentWeather.windSpeed}km/h</span>
                   </div>
                   <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-1">
                         <Droplets size={14} className="text-white" />
                      </div>
                      <span className="text-[9px] font-bold text-white">{currentWeather.humidity}%</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* 3. QUICK ACTIONS (Glow Pill Style) */}
      <div className="px-2">
         <div className="flex flex-row gap-3 px-1 pb-4">
            
            {/* Button 1: Add Task (Red-Orange Glow) */}
            <button 
              onClick={() => setIsInlineInputOpen(true)}
              className="flex-1 py-4 rounded-full bg-gradient-to-r from-red-400 to-orange-400 text-white font-bold text-sm shadow-[0_10px_20px_rgba(248,113,113,0.4)] active:scale-95 transition-all duration-200"
            >
               Add Task
            </button>

            {/* Button 2: Scan NFC (Blue-Indigo Glow) */}
            <button 
              onClick={() => onNavigate('animal')}
              className="flex-1 py-4 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 text-white font-bold text-sm shadow-[0_10px_20px_rgba(129,140,248,0.4)] active:scale-95 transition-all duration-200"
            >
               Scan NFC
            </button>

            {/* Button 3: Contas (Emerald-Green Glow) */}
            <button 
              onClick={() => onNavigate('finance')}
              className="flex-1 py-4 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 text-white font-bold text-sm shadow-[0_10px_20px_rgba(52,211,153,0.4)] active:scale-95 transition-all duration-200"
            >
               Contas
            </button>

         </div>
      </div>

      {/* 4. ESTADO DA QUINTA (Single Card, Minimalist, 3 Columns) */}
      <div className="px-2">
         <h3 className="text-xl font-black italic text-gray-900 dark:text-white mb-4 ml-2">Estado da Quinta</h3>
         
         <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-6 shadow-sm border border-gray-100 dark:border-neutral-800 grid grid-cols-3 divide-x divide-gray-100 dark:divide-neutral-800">
            
            {/* Col 1: Soil Moisture */}
            <div 
              onClick={() => setIsWeatherModalOpen(true)}
              className="flex flex-col items-center justify-center gap-3 group cursor-pointer active:opacity-60 transition-opacity"
            >
               <div className="text-blue-500 transition-transform group-hover:scale-110 duration-300">
                  <Droplets size={28} strokeWidth={2.5} />
               </div>
               <div className="text-center">
                  <span className="block text-xl font-black text-gray-900 dark:text-white leading-none mb-1">
                    {currentWeather ? currentWeather.humidity : 0}%
                  </span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide leading-tight block">Soil Moisture</span>
               </div>
            </div>

            {/* Col 2: Tractor Status */}
            <div 
              onClick={() => onNavigate('machines')}
              className="flex flex-col items-center justify-center gap-3 group cursor-pointer active:opacity-60 transition-opacity"
            >
               <div className="text-amber-500 transition-transform group-hover:scale-110 duration-300">
                  <Tractor size={28} strokeWidth={2.5} />
               </div>
               <div className="text-center">
                  <span className="block text-xl font-black text-gray-900 dark:text-white leading-none mb-1">
                    {machines.filter(m => m.status === 'active').length}
                  </span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide leading-tight block">Tractor Status</span>
               </div>
            </div>

            {/* Col 3: Animal Health */}
            <div 
              onClick={() => onNavigate('animal')}
              className="flex flex-col items-center justify-center gap-3 group cursor-pointer active:opacity-60 transition-opacity"
            >
               <div className="text-rose-500 transition-transform group-hover:scale-110 duration-300">
                  <Heart size={28} strokeWidth={2.5} fill="currentColor" />
               </div>
               <div className="text-center">
                  <span className="block text-xl font-black text-gray-900 dark:text-white leading-none mb-1">
                    {animals.length}
                  </span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide leading-tight block">Saúde Animal</span>
               </div>
            </div>

         </div>
      </div>

      {/* 5. LISTA DE TAREFAS (MD3 Tasks - Atualizado) */}
      <div className="px-2">
         <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-6 shadow-sm border border-gray-100 dark:border-neutral-800">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-black italic text-gray-900 dark:text-white">Lista de Tarefas</h3>
               <button 
                  onClick={() => setIsInlineInputOpen(!isInlineInputOpen)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${isInlineInputOpen ? 'bg-gray-100 text-gray-500 rotate-45' : 'bg-gray-900 dark:bg-white text-white dark:text-black active:scale-90'}`}
               >
                  <Plus size={20} strokeWidth={3} />
               </button>
            </div>

            {/* Expanded Form */}
            {isInlineInputOpen && (
               <div className="mb-6 p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-3xl border border-gray-100 dark:border-neutral-800 animate-slide-down space-y-3">
                  <div>
                     <input 
                        autoFocus
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQuickAddTask()}
                        placeholder="Descrição da tarefa..."
                        className="w-full bg-white dark:bg-neutral-800 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-agro-green dark:text-white border border-gray-100 dark:border-neutral-700"
                     />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                     <div className="relative">
                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input 
                           type="date"
                           value={newTaskDate}
                           onChange={(e) => setNewTaskDate(e.target.value)}
                           className="w-full bg-white dark:bg-neutral-800 rounded-xl pl-10 pr-3 py-3 font-bold text-xs outline-none focus:ring-2 focus:ring-agro-green dark:text-white border border-gray-100 dark:border-neutral-700"
                        />
                     </div>
                     <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <select
                           value={newTaskAssignee}
                           onChange={(e) => setNewTaskAssignee(e.target.value)}
                           className="w-full bg-white dark:bg-neutral-800 rounded-xl pl-10 pr-3 py-3 font-bold text-xs outline-none focus:ring-2 focus:ring-agro-green dark:text-white border border-gray-100 dark:border-neutral-700 appearance-none"
                        >
                           <option value="">Atribuir a...</option>
                           {users.map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                           ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                     </div>
                  </div>

                  <button 
                     onClick={handleQuickAddTask}
                     disabled={!newTaskTitle}
                     className={`w-full py-3 rounded-xl flex items-center justify-center font-bold text-sm shadow-lg transition-all ${
                        !newTaskTitle ? 'bg-gray-200 text-gray-400' : 'bg-agro-green text-white active:scale-95 shadow-agro-green/30'
                     }`}
                  >
                     Adicionar Tarefa
                  </button>
               </div>
            )}

            {/* List */}
            <div className="space-y-3">
               {tasks.length === 0 ? (
                  <div className="text-center py-8 opacity-40">
                     <Check size={32} className="mx-auto mb-2" />
                     <p className="text-xs font-bold uppercase tracking-widest">Tudo Feito</p>
                  </div>
               ) : (
                  tasks.slice().reverse().slice(0, 5).map(task => {
                     const assignee = users.find(u => u.id === task.assignedTo);
                     // Avatar realista (Pravatar ou fallback)
                     const avatarUrl = `https://i.pravatar.cc/150?u=${assignee?.id || 'default'}`;
                     
                     return (
                        <div 
                           key={task.id}
                           onClick={() => onTaskClick(task)}
                           className="group flex items-center justify-between p-1 cursor-pointer"
                        >
                           <div className="flex items-center gap-4 flex-1">
                              {/* Circular Checkbox */}
                              <button
                                 onClick={(e) => { e.stopPropagation(); onToggleTask(task.id); }}
                                 className={`w-6 h-6 rounded-full border-[2.5px] flex items-center justify-center transition-all ${
                                    task.completed 
                                      ? 'bg-green-500 border-green-500 text-white' 
                                      : 'border-gray-300 dark:border-neutral-600 hover:border-green-500'
                                 }`}
                              >
                                 {task.completed && <Check size={12} strokeWidth={4} />}
                              </button>

                              {/* Text */}
                              <div className="flex-1">
                                 <span className={`text-sm font-bold transition-all ${
                                    task.completed 
                                      ? 'text-gray-400 line-through decoration-2 decoration-gray-200' 
                                      : 'text-gray-900 dark:text-white'
                                 }`}>
                                    {task.title}
                                 </span>
                                 <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                       <Calendar size={10} /> {task.date}
                                    </span>
                                    {task.type === 'harvest' && (
                                       <span className="text-[8px] font-black bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded uppercase">Colheita</span>
                                    )}
                                 </div>
                              </div>
                           </div>

                           {/* Avatar Realista */}
                           <div className="pl-3">
                              <img 
                                 src={avatarUrl} 
                                 className={`w-9 h-9 rounded-full border-2 border-white dark:border-neutral-800 shadow-sm object-cover ${task.completed ? 'opacity-50 grayscale' : ''}`}
                                 alt={assignee?.name || 'User'}
                              />
                           </div>
                        </div>
                     );
                  })
               )}
            </div>

            {/* Footer */}
            {tasks.length > 5 && (
               <button onClick={() => onNavigate('tasks')} className="w-full mt-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-agro-green transition-colors">
                  Ver Todas
               </button>
            )}
         </div>
      </div>

      {/* --- WEATHER MODAL --- */}
      {isWeatherModalOpen && (
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
                     className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wide transition-all ${
                       weatherTab === 'forecast' ? 'bg-white dark:bg-neutral-700 shadow text-agro-green dark:text-white' : 'text-gray-400'
                     }`}
                   >
                     Previsão
                   </button>
                   <button 
                     onClick={() => setWeatherTab('spraying')}
                     className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-1 ${
                       weatherTab === 'spraying' ? 'bg-white dark:bg-neutral-700 shadow text-blue-500 dark:text-blue-400' : 'text-gray-400'
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
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                                   slot.status === 'good' ? 'bg-green-500' : 
                                   slot.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}></div>

                                <div className="flex flex-col items-center min-w-[50px]">
                                   <span className="text-lg font-black text-gray-900 dark:text-white">{slot.time}</span>
                                </div>

                                <div className="flex-1 min-w-0">
                                   <div className="flex items-center gap-2 mb-1">
                                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                         slot.status === 'good' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 
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
      )}

    </div>
  );
};

export default DashboardHome;
