import React from 'react';
import { ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const CalendarWidget = ({ tasks = [], fields = [] }) => {
  // Gerar os próximos 7 dias
  const generateDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const nextDays = generateDays();

  // Função auxiliar para verificar eventos num dia
  const getEventsForDay = (date, index) => {
    const events = [];
    
    // 1. Verificar Tarefas
    const isToday = index === 0;
    const isTomorrow = index === 1;

    if (Array.isArray(tasks)) {
      const hasTask = tasks.some(t => {
        if (t.done) return false;
        // Normalizar a data para comparação (DD/MM)
        const dateStr = date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
        
        // Verifica se a data da tarefa coincide
        if (t.date.includes(dateStr)) return true;
        if (isToday && t.date.toLowerCase() === 'hoje') return true;
        if (isTomorrow && t.date.toLowerCase() === 'amanhã') return true;
        return false;
      });
      if (hasTask) events.push('task');
    }

    // 2. Verificar Colheitas (Baseado no CROP_CALENDAR dos campos)
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const monthName = monthNames[date.getMonth()];
    
    if (Array.isArray(fields)) {
      const hasHarvest = fields.some(f => f.cropCycle && f.cropCycle.harvest && f.cropCycle.harvest.includes(monthName));
      if (hasHarvest) events.push('harvest');
    }

    return events;
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="bg-white dark:bg-neutral-900 p-4 rounded-[24px] border border-gray-200 dark:border-neutral-800 shadow-sm animate-fade-in transition-colors duration-300">
      <div className="flex justify-between items-center mb-4 px-1">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <CalendarIcon size={16} className="text-[#3E6837] dark:text-[#4ade80]" />
          Próximos 7 Dias
        </h3>
        <button className="text-[10px] font-bold text-[#3E6837] dark:text-[#4ade80] flex items-center hover:bg-gray-50 dark:hover:bg-neutral-800 px-2 py-1 rounded-lg transition-colors">
          Ver mês <ChevronRight size={12} />
        </button>
      </div>

      <div className="flex justify-between gap-1 overflow-x-auto pb-2 no-scrollbar">
        {nextDays.map((date, index) => {
          const events = getEventsForDay(date, index);
          const isToday = index === 0;
          
          return (
            <div 
              key={index} 
              className={`flex flex-col items-center justify-center p-2 rounded-2xl min-w-[44px] flex-1 transition-all 
                ${isToday 
                  ? 'bg-[#3E6837] dark:bg-[#4ade80] text-white dark:text-neutral-900 shadow-md scale-105' 
                  : 'bg-gray-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                }`}
            >
              <span className={`text-[9px] font-bold uppercase mb-1 ${isToday ? 'opacity-80' : 'opacity-50'}`}>
                {weekDays[date.getDay()]}
              </span>
              <span className="text-base font-black">
                {date.getDate()}
              </span>
              
              {/* Pontos de Eventos */}
              <div className="flex gap-1 mt-1.5 h-1.5 justify-center">
                {events.includes('task') && (
                  <div className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-orange-300' : 'bg-orange-500'}`} title="Tarefa"></div>
                )}
                {events.includes('harvest') && (
                  <div className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white dark:bg-neutral-900' : 'bg-green-600 dark:bg-green-500'}`} title="Colheita Prevista"></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legenda simples */}
      <div className="flex justify-center gap-4 mt-3 pt-2 border-t border-gray-100 dark:border-neutral-800">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
          <span className="text-[9px] font-medium text-neutral-500 dark:text-neutral-400">Tarefas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-600 dark:bg-green-500"></div>
          <span className="text-[9px] font-medium text-neutral-500 dark:text-neutral-400">Colheita Estimada</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarWidget;