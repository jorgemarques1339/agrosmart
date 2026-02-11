import React, { useState } from 'react';
import { 
  Sun, CloudRain, Calendar, Check, Plus, Trash2, ArrowRight, X
} from 'lucide-react';

import CalendarWidget from './CalendarWidget'; 

const DashboardHome = ({ weather, fields, tasks, onToggleTask, onAddTask, onDeleteTask, onWeatherClick }) => {
  const rainAlert = weather.precip >= 20;
  const today = new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
  
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');

  const handleAddTaskClick = () => {
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle, newTaskDate);
      setNewTaskTitle('');
      setNewTaskDate('');
      setIsAddingTask(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in text-neutral-900 dark:text-white">
      
      {/* 1. Cabeçalho e Meteorologia */}
      {/* FORÇAR 'bg-white' e 'border-gray-100' no modo claro para garantir contraste */}
      <div className="bg-white dark:bg-neutral-900 p-5 rounded-[24px] shadow-sm border border-gray-200 dark:border-neutral-800 transition-colors duration-300">
        <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1 capitalize">{today}</p>
        <h1 className="text-2xl font-normal text-neutral-900 dark:text-white">Olá, <span className="font-semibold text-[#3E6837] dark:text-[#4ade80]">Agricultor!</span></h1>
        
        <div 
          onClick={onWeatherClick}
          className="mt-4 flex items-center gap-3 bg-gray-50 dark:bg-neutral-800 p-3 rounded-xl border border-gray-100 dark:border-neutral-700 cursor-pointer active:scale-95 transition-all hover:border-[#3E6837] dark:hover:border-[#4ade80]"
          title="Ver Previsão Detalhada"
        >
          <div className={`p-2 rounded-full ${rainAlert ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'}`}>
            {rainAlert ? <CloudRain size={20} /> : <Sun size={20} />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-900 dark:text-white">{rainAlert ? 'Chuva Prevista' : 'Céu Limpo'}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{weather.temp}°C • {weather.precip}mm</p>
          </div>
          <ArrowRight size={16} className="text-neutral-400 dark:text-neutral-500 opacity-50" />
        </div>
      </div>

      {/* 2. Calendário */}
      <CalendarWidget tasks={tasks} fields={fields} />

      {/* 3. Lista de Tarefas (AgroAgenda) */}
      <div className="bg-white dark:bg-neutral-900 rounded-[24px] p-4 border border-gray-200 dark:border-neutral-800 shadow-sm transition-colors duration-300">
        <div className="flex justify-between items-center mb-3 px-1">
          <h2 className="text-lg font-medium text-neutral-900 dark:text-white flex items-center gap-2">
            <Calendar size={18} className="text-[#3E6837] dark:text-[#4ade80]" />Lista de Tarefas
          </h2>
          
          {!isAddingTask && (
             <button 
               onClick={() => setIsAddingTask(true)}
               className="text-xs bg-[#3E6837] dark:bg-[#4ade80] text-white dark:text-neutral-900 px-3 py-1.5 rounded-full font-bold flex items-center gap-1 active:scale-90 transition-transform shadow-sm"
             >
               <Plus size={14} /> Nova
             </button>
          )}
        </div>
        
        {/* FORMULÁRIO */}
        {isAddingTask && (
          <div className="mb-4 pb-4 border-b border-gray-100 dark:border-neutral-800 animate-slide-down bg-gray-50 dark:bg-neutral-800/50 p-3 rounded-xl">
             <div className="flex justify-between items-center mb-2">
               <span className="text-[10px] font-bold text-[#3E6837] dark:text-[#4ade80] uppercase tracking-wider">Nova Tarefa</span>
               <button onClick={() => setIsAddingTask(false)} className="text-neutral-500 dark:text-neutral-400 p-1 bg-white dark:bg-neutral-700 rounded-full shadow-sm active:scale-90">
                  <X size={14} />
               </button>
             </div>
             <div className="space-y-2">
               <input 
                 type="text" 
                 placeholder="O que precisa de ser feito?" 
                 className="w-full bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl px-4 py-3 text-sm font-bold focus:border-[#3E6837] dark:focus:border-[#4ade80] outline-none transition-colors text-neutral-900 dark:text-white placeholder:text-gray-400"
                 value={newTaskTitle}
                 onChange={(e) => setNewTaskTitle(e.target.value)}
                 autoFocus
               />
               <div className="flex gap-2">
                 <input 
                   type="date" 
                   className="flex-1 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 rounded-xl px-4 py-3 text-xs font-bold focus:border-[#3E6837] dark:focus:border-[#4ade80] outline-none text-neutral-600 dark:text-gray-300"
                   value={newTaskDate}
                   onChange={(e) => setNewTaskDate(e.target.value)}
                 />
                 <button 
                   onClick={handleAddTaskClick}
                   className="bg-[#3E6837] dark:bg-[#4ade80] text-white dark:text-neutral-900 px-4 rounded-xl font-bold shadow-md active:scale-95 transition-transform flex items-center justify-center"
                 >
                   <Plus size={20} />
                 </button>
               </div>
             </div>
          </div>
        )}

        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-xl transition-colors group">
              <div 
                onClick={() => onToggleTask(task.id)}
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors shrink-0 cursor-pointer ${task.done ? 'bg-[#3E6837] border-[#3E6837] dark:bg-[#4ade80] dark:border-[#4ade80]' : 'border-gray-400 dark:border-neutral-600'}`}
              >
                {task.done && <Check size={14} className="text-white dark:text-neutral-900" />}
              </div>
              
              <div className="flex-1 cursor-pointer" onClick={() => onToggleTask(task.id)}>
                <p className={`text-sm font-medium transition-all ${task.done ? 'line-through text-gray-400 dark:text-neutral-600 opacity-60' : 'text-neutral-900 dark:text-white'}`}>{task.title}</p>
                <p className="text-[10px] text-gray-500 dark:text-neutral-500">{task.date}</p>
              </div>

              <button 
                onClick={() => onDeleteTask(task.id)}
                className="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 p-2 rounded-lg transition-colors active:scale-90"
                title="Apagar Tarefa"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          
          {tasks.length === 0 && !isAddingTask && (
            <div className="text-center py-6 border-2 border-dashed border-gray-100 dark:border-neutral-800 rounded-2xl bg-gray-50/50 dark:bg-neutral-800/30">
              <p className="text-xs text-gray-500 dark:text-neutral-500 italic">Sem tarefas pendentes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;