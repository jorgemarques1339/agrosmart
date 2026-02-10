import React, { useState } from 'react';
import { 
  Sun, CloudRain, AlertTriangle, CheckCircle, ArrowRight, 
  Calendar, Bell, Check, Plus, Trash2, Package, X
} from 'lucide-react';

import CalendarWidget from './CalendarWidget'; 

const DashboardHome = ({ weather, animals, fields, onNavigate, tasks, onToggleTask, onAddTask, onDeleteTask, stocks, onWeatherClick }) => {
  // Filtros de alertas
  const sickAnimals = Array.isArray(animals) ? animals.filter(a => a.status !== 'Saudável') : [];
  const lowStocks = Array.isArray(stocks) ? stocks.filter(s => s.quantity <= (s.minLevel || 0)) : [];
  const rainAlert = weather.precip >= 20;
  const today = new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
  
  // --- Estados para Nova Tarefa ---
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');

  const handleAddTaskClick = () => {
    if (newTaskTitle.trim()) {
      // Envia título e data para o App.jsx
      onAddTask(newTaskTitle, newTaskDate);
      // Limpar campos
      setNewTaskTitle('');
      setNewTaskDate('');
      setIsAddingTask(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* 1. Cabeçalho e Meteorologia */}
      <div className="bg-white p-5 rounded-[24px] shadow-sm border border-[#E0E4D6]">
        <p className="text-xs font-bold text-[#74796D] uppercase tracking-wider mb-1 capitalize">{today}</p>
        <h1 className="text-2xl font-normal text-[#1A1C18]">Olá, <span className="font-semibold text-[#3E6837]">Agricultor!</span></h1>
        
        <div onClick={onWeatherClick} className="mt-4 flex items-center gap-3 bg-[#FDFDF5] p-3 rounded-xl border border-[#EFF2E6] cursor-pointer active:scale-95 transition-all hover:border-[#3E6837]" title="Ver Previsão Detalhada">
          <div className={`p-2 rounded-full ${rainAlert ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
            {rainAlert ? <CloudRain size={20} /> : <Sun size={20} />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#1A1C18]">{rainAlert ? 'Chuva Prevista' : 'Céu Limpo'}</p>
            <p className="text-xs text-[#43483E]">{weather.temp}°C • {weather.precip}mm</p>
          </div>
          <ArrowRight size={16} className="text-[#74796D] opacity-50" />
        </div>
      </div>

      {/* 2. Calendário */}
      <CalendarWidget tasks={tasks} fields={fields} />

      {/* 3. Lista de Tarefas (AgroAgenda) */}
      <div>
        <div className="flex justify-between items-center px-2 mb-3">
          <h2 className="text-lg font-medium text-[#1A1C18] flex items-center gap-2">
            <Calendar size={18} className="text-[#3E6837]" />Lista de Tarefas
          </h2>
          
          {/* Botão para EXPANDIR formulário de nova tarefa */}
          {!isAddingTask && (
             <button 
               onClick={() => setIsAddingTask(true)}
               className="text-xs bg-[#3E6837] text-white px-3 py-1.5 rounded-full font-bold flex items-center gap-1 active:scale-90 transition-transform shadow-sm"
             >
               <Plus size={14} /> Nova Tarefa
             </button>
          )}
        </div>
        
        <div className="bg-white rounded-[24px] p-4 border border-[#E0E4D6] shadow-sm">
          
          {/* FORMULÁRIO EXPANDÍVEL */}
          {isAddingTask && (
            <div className="mb-4 pb-4 border-b border-[#EFF2E6] animate-slide-down">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold text-[#3E6837] uppercase tracking-wider">Nova Tarefa</span>
                 <button onClick={() => setIsAddingTask(false)} className="text-[#74796D] p-1 bg-gray-100 rounded-full active:scale-90">
                    <X size={14} />
                 </button>
               </div>
               <div className="space-y-3">
                 <input 
                   type="text" 
                   placeholder="O que precisa de ser feito?" 
                   className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-xl px-4 py-3 text-sm font-bold focus:border-[#3E6837] outline-none transition-colors"
                   value={newTaskTitle}
                   onChange={(e) => setNewTaskTitle(e.target.value)}
                 />
                 <div className="flex gap-2">
                   <input 
                     type="date" 
                     className="flex-1 bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-xl px-4 py-3 text-sm font-bold focus:border-[#3E6837] outline-none text-[#43483E]"
                     value={newTaskDate}
                     onChange={(e) => setNewTaskDate(e.target.value)}
                   />
                   <button 
                     onClick={handleAddTaskClick}
                     className="bg-[#3E6837] text-white px-5 py-3 rounded-xl font-bold shadow-md active:scale-95 transition-transform flex items-center justify-center"
                   >
                     <Plus size={20} />
                   </button>
                 </div>
               </div>
            </div>
          )}

          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-[#FDFDF5] rounded-xl transition-colors group">
                <div 
                  onClick={() => onToggleTask(task.id)}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors shrink-0 cursor-pointer ${task.done ? 'bg-[#3E6837] border-[#3E6837]' : 'border-[#74796D]'}`}
                >
                  {task.done && <Check size={14} className="text-white" />}
                </div>
                
                <div className="flex-1 cursor-pointer" onClick={() => onToggleTask(task.id)}>
                  <p className={`text-sm font-medium transition-all ${task.done ? 'line-through text-[#74796D] opacity-60' : 'text-[#1A1C18]'}`}>{task.title}</p>
                  <p className="text-[10px] text-[#43483E]">{task.date}</p>
                </div>

                <button 
                  onClick={() => onDeleteTask(task.id)}
                  className="text-red-400 hover:text-red-600 p-2 rounded-lg transition-colors active:scale-90"
                  title="Apagar Tarefa"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {tasks.length === 0 && !isAddingTask && (
              <p className="text-center text-xs text-[#74796D] py-4 italic">Sem tarefas pendentes.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;