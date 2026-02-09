import React, { useState } from 'react';
import { Utensils, Syringe, AlertCircle, TrendingUp, Plus, Milk } from 'lucide-react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const AnimalCard = ({ data, onAddProduction }) => {
  const [prodValue, setProdValue] = useState('');

  const handleRegister = () => {
    if (!prodValue || isNaN(prodValue)) return;
    onAddProduction(data.id, parseFloat(prodValue));
    setProdValue('');
  };

  // Calcular média se houver dados
  const history = data.productionHistory || [];
  const avgProd = history.length > 0 
    ? (history.reduce((acc, curr) => acc + curr.value, 0) / history.length).toFixed(1) 
    : 0;

  // Determinar unidade com base no tipo
  const unit = data.type.includes('Vaca') ? 'L' : 'Kg';

  return (
    <div className="bg-[#EFF2E6] rounded-[24px] overflow-hidden animate-slide-up transition-all mt-4 mb-4 pb-4">
      {/* Header */}
      <div className="bg-[#D8E6C6] p-5 flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-normal text-[#1A1C18]">{data.name}</h3>
          <p className="text-[#43483E] text-sm font-medium tracking-wider mt-1">{data.id}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${data.status === 'Saudável' ? 'bg-[#CBE6A2] text-[#2D4F00]' : 'bg-[#FFDAD6] text-[#410002]'}`}>
          {data.status}
        </div>
      </div>
      
      <div className="p-5 space-y-5">
        
        {/* --- NOVO: Registo de Produção --- */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E0E4D6]">
          <div className="flex justify-between items-center mb-3">
             <div className="flex items-center gap-2">
                <Milk size={18} className="text-[#3E6837]" />
                <h4 className="font-semibold text-[#1A1C18] text-sm">Produção Diária</h4>
             </div>
             <span className="text-xs text-[#74796D]">Média: <b>{avgProd}{unit}</b></span>
          </div>

          <div className="flex gap-2">
            <input 
              type="number" 
              placeholder={`Qtd (${unit})`}
              className="flex-1 bg-[#FDFDF5] border border-[#E0E4D6] rounded-xl px-4 py-2 text-sm outline-none focus:border-[#3E6837]"
              value={prodValue}
              onChange={(e) => setProdValue(e.target.value)}
            />
            <button 
              onClick={handleRegister}
              className="bg-[#3E6837] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 active:scale-95 transition-transform"
            >
              <Plus size={16} /> Registar
            </button>
          </div>

          {/* Gráfico Dinâmico */}
          {history.length > 0 ? (
            <div className="h-32 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E4D6" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#74796D'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }} 
                    labelStyle={{ color: '#74796D', fontSize: '10px' }}
                    itemStyle={{ color: '#3E6837', fontWeight: 'bold' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3E6837" 
                    strokeWidth={3} 
                    dot={{ fill: '#3E6837', r: 3 }} 
                    activeDot={{ r: 5 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-xs text-[#74796D] mt-4 italic">Sem dados registados.</p>
          )}
        </div>

        {/* Chips de Info */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <span className="px-4 py-2 bg-[#FDFDF5] border border-[#74796D] rounded-xl text-sm font-medium text-[#43483E] whitespace-nowrap">{data.type}</span>
          <span className="px-4 py-2 bg-[#FDFDF5] border border-[#74796D] rounded-xl text-sm font-medium text-[#43483E] whitespace-nowrap">{data.weight}</span>
          <span className="px-4 py-2 bg-[#FDFDF5] border border-[#74796D] rounded-xl text-sm font-medium text-[#43483E] whitespace-nowrap">{data.age}</span>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#E1E4D5] flex items-center justify-center flex-shrink-0 text-[#1A1C18]"><Utensils size={20} /></div>
            <div>
              <p className="font-medium text-[#1A1C18] text-base">Alimentação</p>
              <p className="text-[#43483E] text-sm leading-relaxed">{data.feed}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#E1E4D5] flex items-center justify-center flex-shrink-0 text-[#1A1C18]"><Syringe size={20} /></div>
            <div>
              <p className="font-medium text-[#1A1C18] text-base">Veterinário</p>
              <p className="text-[#43483E] text-sm leading-relaxed">Última visita: {data.lastVetVisit}</p>
            </div>
          </div>
          <div className="bg-[#FFDAD6] bg-opacity-30 p-4 rounded-xl flex gap-3">
            <AlertCircle className="text-[#BA1A1A] shrink-0" size={24} />
            <div>
              <p className="font-bold text-[#410002] text-sm mb-1">Necessidades</p>
              <ul className="text-[#410002] text-sm list-disc list-inside opacity-90">
                {data.needs.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimalCard;