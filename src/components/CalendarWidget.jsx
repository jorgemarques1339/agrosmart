import React from 'react';
import { ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const CalendarWidget = ({ tasks, fields }) => {
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
    
    // 1. Verificar Tarefas (Lógica simplificada para "Hoje" e "Amanhã")
    const isToday = index === 0;
    const isTomorrow = index === 1;

    const hasTask = tasks.some(t => {
      if (t.done) return false;
      if (isToday && t.date.toLowerCase() === 'hoje') return true;
      if (isTomorrow && t.date.toLowerCase() === 'amanhã') return true;
      // Poderíamos adicionar lógica para datas reais aqui (DD/MM/AAAA)
      return false;
    });

    if (hasTask) events.push('task');

    // 2. Verificar Colheitas (Baseado no CROP_CALENDAR dos campos)
    // Exemplo: Se o campo diz "15 Setembro", verificamos se o dia corresponde
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const dateString = `${date.getDate()} ${monthNames[date.getMonth()]}`;
    
    const hasHarvest = fields.some(f => f.cropCycle && f.cropCycle.harvest.includes(dateString));
    
    if (hasHarvest) events.push('harvest');

    return events;
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="bg-white p-4 rounded-[24px] border border-[#E0E4D6] shadow-sm animate-fade-in">
      <div className="flex justify-between items-center mb-4 px-1">
        <h3 className="text-sm font-bold text-[#1A1C18] flex items-center gap-2">
          <CalendarIcon size={16} className="text-[#3E6837]" />
          Próximos 7 Dias
        </h3>
        <button className="text-[10px] font-bold text-[#3E6837] flex items-center hover:bg-[#FDFDF5] px-2 py-1 rounded-lg transition-colors">
          Ver mês <ChevronRight size={12} />
        </button>
      </div>

      <div className="flex justify-between gap-1">
        {nextDays.map((date, index) => {
          const events = getEventsForDay(date, index);
          const isToday = index === 0;
          
          return (
            <div 
              key={index} 
              className={`flex flex-col items-center justify-center p-2 rounded-2xl min-w-[44px] transition-all ${isToday ? 'bg-[#3E6837] text-white shadow-md scale-105' : 'bg-transparent text-[#43483E]'}`}
            >
              <span className={`text-[9px] font-bold uppercase mb-1 ${isToday ? 'opacity-80' : 'opacity-50'}`}>
                {weekDays[date.getDay()]}
              </span>
              <span className="text-base font-black">
                {date.getDate()}
              </span>
              
              {/* Pontos de Eventos */}
              <div className="flex gap-0.5 mt-1.5 h-1.5">
                {events.includes('task') && (
                  <div className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-orange-400' : 'bg-orange-500'}`}></div>
                )}
                {events.includes('harvest') && (
                  <div className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white' : 'bg-green-600'}`}></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legenda simples */}
      <div className="flex justify-center gap-4 mt-3 pt-2 border-t border-[#EFF2E6]">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
          <span className="text-[9px] font-medium text-[#74796D]">Tarefas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div>
          <span className="text-[9px] font-medium text-[#74796D]">Colheita</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarWidget;