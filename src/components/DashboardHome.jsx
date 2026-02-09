import React, { useState } from 'react';
import { 
  Sun, CloudRain, AlertTriangle, CheckCircle, ArrowRight, 
  Droplets, Calendar, Bell, Check, Plus, Trash2
} from 'lucide-react';

const DashboardHome = ({ weather, animals, fields, onNavigate, tasks, onToggleTask, onAddTask, onDeleteTask }) => {
  // 1. Filtrar Alertas
  const sickAnimals = Object.values(animals).filter(a => a.status !== 'Saudável');
  const fieldsAttention = fields.filter(f => f.health.includes('Atenção'));
  const rainAlert = weather.precip >= 20;

  // Estado local para o input da nova tarefa
  const [newTaskInput, setNewTaskInput] = useState('');

  const handleAddTask = () => {
    if (newTaskInput.trim()) {
      onAddTask(newTaskInput);
      setNewTaskInput('');
    }
  };

  // Data de hoje formatada
  const today = new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Cabeçalho de Boas Vindas */}
      <div className="bg-white p-5 rounded-[24px] shadow-sm border border-[#E0E4D6]">
        <p className="text-xs font-bold text-[#74796D] uppercase tracking-wider mb-1 capitalize">{today}</p>
        <h1 className="text-2xl font-normal text-[#1A1C18]">Bom dia, <span className="font-semibold text-[#3E6837]">Agricultor!</span></h1>
        
        {/* Resumo Meteorológico Rápido */}
        <div className="mt-4 flex items-center gap-3 bg-[#FDFDF5] p-3 rounded-xl border border-[#EFF2E6]">
          <div className={`p-2 rounded-full ${rainAlert ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
            {rainAlert ? <CloudRain size={20} /> : <Sun size={20} />}
          </div>
          <div>
            <p className="text-sm font-medium text-[#1A1C18]">
              {rainAlert ? 'Chuva Prevista' : 'Céu Limpo'}
            </p>
            <p className="text-xs text-[#43483E]">
              {weather.temp}°C • {weather.precip}mm
            </p>
          </div>
        </div>
      </div>

      {/* Secção de Alertas Urgentes */}
      <div>
        <h2 className="text-lg font-medium text-[#1A1C18] px-2 mb-3 flex items-center gap-2">
          <Bell size={18} className="text-[#BA1A1A]" />
          Atenção Necessária
        </h2>
        
        <div className="space-y-3">
          {/* Alerta de Chuva */}
          {rainAlert && (
            <div className="bg-[#FFDAD6] p-4 rounded-[20px] flex items-start gap-3 animate-pulse">
              <CloudRain className="text-[#410002] shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-bold text-[#410002] text-sm">Rega Automática Cancelada</h3>
                <p className="text-[#410002] text-xs opacity-80 mt-1">Previsão de chuva forte ({weather.precip}mm). A poupar água.</p>
              </div>
            </div>
          )}

          {/* Alerta de Animais */}
          {sickAnimals.length > 0 ? (
            sickAnimals.map(animal => (
              <div key={animal.id} onClick={() => onNavigate('animal')} className="bg-white p-4 rounded-[20px] border border-[#FFDAD6] shadow-sm flex items-center justify-between cursor-pointer active:scale-95 transition-transform">
                <div className="flex items-center gap-3">
                  <div className="bg-[#FFDAD6] p-2 rounded-full text-[#BA1A1A]">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1A1C18] text-sm">{animal.name} ({animal.type})</h3>
                    <p className="text-[#43483E] text-xs">{animal.notes}</p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-[#74796D]" />
              </div>
            ))
          ) : (
            <div className="bg-[#CBE6A2] bg-opacity-30 p-4 rounded-[20px] flex items-center gap-3">
              <CheckCircle className="text-[#2D4F00]" size={20} />
              <p className="text-[#2D4F00] text-sm font-medium">Todos os animais saudáveis.</p>
            </div>
          )}

          {/* Alerta de Campos */}
          {fieldsAttention.length > 0 && fieldsAttention.map(field => (
            <div key={field.id} onClick={() => onNavigate('cultivo')} className="bg-white p-4 rounded-[20px] border border-orange-200 shadow-sm flex items-center justify-between cursor-pointer active:scale-95 transition-transform">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-full text-orange-600">
                  <Droplets size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-[#1A1C18] text-sm">{field.name}</h3>
                  <p className="text-[#43483E] text-xs">{field.health}</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-[#74796D]" />
            </div>
          ))}
        </div>
      </div>

      {/* AgroAgenda (Tarefas) DINÂMICA */}
      <div>
        <div className="flex justify-between items-center px-2 mb-3">
          <h2 className="text-lg font-medium text-[#1A1C18] flex items-center gap-2">
            <Calendar size={18} className="text-[#3E6837]" />AgroAgenda
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

                {/* Botão de Apagar (Sempre visível para telemóvel) */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // Impede que o clique ative o toggleTask
                    onDeleteTask(task.id);
                  }}
                  className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                  title="Apagar Tarefa"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Input para Nova Tarefa */}
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