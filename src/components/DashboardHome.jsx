import React, { useState } from 'react';
import { 
  Sun, CloudRain, Calendar, Check, Plus, Trash2, ArrowRight
} from 'lucide-react';

// Importar o widget de calendário
import CalendarWidget from './CalendarWidget'; 

const DashboardHome = ({ weather, animals, fields, onNavigate, tasks, onToggleTask, onAddTask, onDeleteTask, stocks, onWeatherClick }) => {
  
  const rainAlert = weather.precip >= 20;
  const today = new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
  const [newTaskInput, setNewTaskInput] = useState('');

  const handleAddTask = () => {
    if (newTaskInput.trim()) {
      onAddTask(newTaskInput);
      setNewTaskInput('');
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* 1. Cabeçalho e Meteorologia */}
      <div className="bg-white p-5 rounded-[24px] shadow-sm border border-[#E0E4D6]">
        <p className="text-xs font-bold text-[#74796D] uppercase tracking-wider mb-1 capitalize">{today}</p>
        <h1 className="text-2xl font-normal text-[#1A1C18]">Olá, <span className="font-semibold text-[#3E6837]">Agricultor!</span></h1>
        
        <div 
          onClick={onWeatherClick}
          className="mt-4 flex items-center gap-3 bg-[#FDFDF5] p-3 rounded-xl border border-[#EFF2E6] cursor-pointer active:scale-95 transition-all hover:border-[#3E6837]"
          title="Ver Previsão Detalhada"
        >
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

      {/* 2. Widget de Calendário */}
      <CalendarWidget tasks={tasks} fields={fields} />

      {/* 3. Lista de Tarefas (AgroAgenda) */}
      <div>
        <div className="flex justify-between items-center px-2 mb-3">
          <h2 className="text-lg font-medium text-[#1A1C18] flex items-center gap-2">
            <Calendar size={18} className="text-[#3E6837]" />Lista de Tarefas
          </h2>
          <span className="text-xs bg-[#E1E4D5] px-2 py-1 rounded-full text-[#43483E] font-medium">
            {tasks.filter(t => !t.done).length} pendentes
          </span>
        </div>
        
        <div className="bg-white rounded-[24px] p-4 border border-[#E0E4D6] shadow-sm">
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
                  className="text-red-400 hover:text-red-600 p-2 rounded-lg transition-colors"
                  title="Apagar Tarefa"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-[#EFF2E6] flex gap-2">
            <input 
              type="text" 
              placeholder="Nova tarefa..." 
              className="flex-1 bg-[#FDFDF5] border border-[#E0E4D6] rounded-xl px-4 py-2 text-sm outline-none focus:border-[#3E6837] focus:ring-1 focus:ring-[#3E6837] transition-all"
              value={newTaskInput}
              onChange={(e) => setNewTaskInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
            />
            <button 
              onClick={handleAddTask}
              className="bg-[#3E6837] text-white p-2.5 rounded-xl hover:bg-[#2D4F00] active:scale-95 transition-all shadow-sm"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;