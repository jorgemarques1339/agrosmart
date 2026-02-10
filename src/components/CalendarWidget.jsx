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
    
    const isToday = index === 0;
    const isTomorrow = index === 1;

    // 1. Verificar Tarefas
    if (Array.isArray(tasks)) {
      const hasTask = tasks.some(t => {
        if (t.done) return false;
        const dateStr = date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
        if (t.date.includes(dateStr)) return true;
        if (isToday && t.date.toLowerCase() === 'hoje') return true;
        if (isTomorrow && t.date.toLowerCase() === 'amanhã') return true;
        return false;
      });
      if (hasTask) events.push('task');
    }

    // 2. Verificar Colheitas
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

      {/* CORREÇÃO MOBILE: 
         - overflow-x-auto: Permite scroll horizontal
         - pb-2: Espaço para a barra de scroll não colar
         - gap-2: Espaçamento consistente
         - hide-scrollbar: Classe utilitária (ou estilo inline) para esconder barra de scroll se desejares
      */}
      <div className="flex gap-2 overflow-x-auto pb-2 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {nextDays.map((date, index) => {
          const events = getEventsForDay(date, index);
          const isToday = index === 0;
          
          return (
            <div 
              key={index} 
              // min-w-[52px] garante tamanho fixo e impede que os dias fiquem esmagados
              // flex-shrink-0 impede que o flexbox encolha os itens
              className={`flex-shrink-0 flex flex-col items-center justify-center p-2 rounded-2xl min-w-[52px] transition-all ${isToday ? 'bg-[#3E6837] text-white shadow-md' : 'bg-[#FDFDF5] border border-transparent text-[#43483E]'}`}
            >
              <span className={`text-[9px] font-bold uppercase mb-1 ${isToday ? 'opacity-80' : 'opacity-50'}`}>
                {weekDays[date.getDay()]}
              </span>
              <span className="text-lg font-black">
                {date.getDate()}
              </span>
              
              {/* Pontos de Eventos */}
              <div className="flex gap-1 mt-1.5 h-1.5 justify-center">
                {events.includes('task') && (
                  <div className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-orange-400' : 'bg-orange-500'}`} title="Tarefa"></div>
                )}
                {events.includes('harvest') && (
                  <div className={`w-1.5 h-1.5 rounded-full ${isToday ? 'bg-white' : 'bg-green-600'}`} title="Colheita Prevista"></div>
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
          <span className="text-[9px] font-medium text-[#74796D]">Colheita Estimada</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarWidget;