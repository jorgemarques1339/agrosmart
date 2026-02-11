import React, { useState } from 'react';
import { 
  Milk, Plus, Activity, Calendar, Weight, X, 
  Check, Beef, Heart, ChevronRight, Clipboard, 
  ShieldCheck, AlertCircle, TrendingUp, History
} from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, YAxis } from 'recharts';

const AnimalCard = (props) => {
  // Lógica defensiva para aceitar diferentes nomes de props
  const animal = props.data || props.animal;
  const { onAddProduction } = props;

  const [isAdding, setIsAdding] = useState(false);
  const [description, setDescription] = useState('');
  const [prodType, setProdType] = useState('Litros'); 
  const [amount, setAmount] = useState('');

  if (!animal) return null;

  const handleSave = () => {
    if (amount && onAddProduction) {
      const finalValue = prodType === 'Litros' ? parseFloat(amount) : `${amount}kg (${description})`;
      onAddProduction(animal.id, finalValue);
      setIsAdding(false);
      setDescription('');
      setAmount('');
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-6 border border-gray-100 dark:border-neutral-800 shadow-sm active:shadow-md transition-all animate-fade-in relative overflow-hidden">
      
      {/* Decoração de Fundo Profissional */}
      <div className="absolute -top-6 -right-6 p-4 opacity-[0.03] dark:opacity-[0.05] pointer-events-none rotate-12">
        <Heart size={140} className="text-[#3E6837]" />
      </div>

      {/* Cabeçalho: Identidade e Status */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-[#1A1C18] dark:text-white leading-none">
              {animal.name}
            </h3>
            <div className="bg-[#EFF2E6] dark:bg-neutral-800 p-1 rounded-lg">
              <ShieldCheck size={14} className="text-[#3E6837] dark:text-[#4ade80]" />
            </div>
          </div>
          <p className="text-[10px] font-black text-[#74796D] dark:text-neutral-500 tracking-[0.2em] uppercase flex items-center gap-1.5">
            <span className="bg-[#3E6837] text-white px-1.5 py-0.5 rounded-md text-[8px]">{animal.id}</span>
            {animal.type}
          </p>
        </div>
        
        <div className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm border ${
          animal.status === 'Saudável' 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30' 
            : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30'
        }`}>
          {animal.status}
        </div>
      </div>

      {/* Grelha de Atributos Bio-Métricos */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#FDFDF5] dark:bg-neutral-950 p-4 rounded-3xl border border-[#EFF2E6] dark:border-neutral-800 flex items-center gap-3">
           <div className="bg-white dark:bg-neutral-800 p-2.5 rounded-2xl text-[#3E6837] dark:text-[#4ade80] shadow-sm"><Calendar size={20} /></div>
           <div>
             <p className="text-[9px] font-black uppercase text-[#74796D] dark:text-neutral-500 tracking-tighter">Idade Animal</p>
             <p className="text-base font-black text-[#1A1C18] dark:text-white leading-none mt-0.5">{animal.age}</p>
           </div>
        </div>
        <div className="bg-[#FDFDF5] dark:bg-neutral-950 p-4 rounded-3xl border border-[#EFF2E6] dark:border-neutral-800 flex items-center gap-3">
           <div className="bg-white dark:bg-neutral-800 p-2.5 rounded-2xl text-[#3E6837] dark:text-[#4ade80] shadow-sm"><Weight size={20} /></div>
           <div>
             <p className="text-[9px] font-black uppercase text-[#74796D] dark:text-neutral-500 tracking-tighter">Peso Atual</p>
             <p className="text-base font-black text-[#1A1C18] dark:text-white leading-none mt-0.5">{animal.weight}</p>
           </div>
        </div>
      </div>
      
      {/* Secção de Performance (Gráfico) */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-3 px-1">
          <p className="text-[10px] font-black uppercase text-[#74796D] dark:text-neutral-500 tracking-widest flex items-center gap-1.5">
            <TrendingUp size={14} className="text-[#3E6837] dark:text-[#4ade80]" /> Histórico de Rendimento
          </p>
          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">+4.2%</span>
        </div>
        
        <div className="h-40 w-full bg-gray-50/50 dark:bg-neutral-950/50 rounded-[2rem] p-3 border border-gray-100 dark:border-neutral-800 shadow-inner overflow-hidden">
          {animal.productionHistory && animal.productionHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={animal.productionHistory}>
                <defs>
                  <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3E6837" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3E6837" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3E6837" 
                  strokeWidth={4} 
                  fill="url(#colorProd)" 
                  animationDuration={1500}
                />
                <XAxis dataKey="day" hide />
                <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip 
                  contentStyle={{
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: '900',
                    backgroundColor: '#1A1C18',
                    color: '#fff'
                  }} 
                  itemStyle={{ color: '#CBE6A2' }}
                  cursor={{ stroke: '#3E6837', strokeWidth: 2, strokeDasharray: '4 4' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-xs text-gray-400 italic gap-2">
              <History size={20} className="opacity-20" />
              Sem dados registados
            </div>
          )}
        </div>
      </div>

      {/* Notas e Alertas Rápidos */}
      {animal.notes && (
        <div className="bg-[#FDFDF5] dark:bg-neutral-800/40 p-4 rounded-3xl border border-[#EFF2E6] dark:border-neutral-800 mb-6 flex gap-3 items-start">
           <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
           <p className="text-xs font-medium text-[#43483E] dark:text-neutral-400 leading-relaxed italic">
             "{animal.notes}"
           </p>
        </div>
      )}
      
      {/* Ações: Registo Mobile-First */}
      {!isAdding ? (
        <button 
          onClick={() => setIsAdding(true)} 
          className="w-full py-5 bg-[#1A1C18] dark:bg-[#3E6837] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-gray-200 dark:shadow-none"
        >
          <div className="bg-white/20 p-1 rounded-lg"><Plus size={18} /></div>
          Registar Produção
        </button>
      ) : (
        <div className="bg-[#FDFDF5] dark:bg-neutral-950 p-5 rounded-[2.5rem] border-2 border-[#E0E4D6] dark:border-neutral-800 animate-slide-up">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-[10px] font-black text-[#3E6837] dark:text-[#4ade80] uppercase tracking-[0.2em]">Novo Registo Diário</h4>
            <button onClick={() => setIsAdding(false)} className="p-2 bg-white dark:bg-neutral-800 rounded-full text-[#74796D] shadow-sm active:scale-90 transition-all"><X size={18} /></button>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <button 
                onClick={() => setProdType('Litros')}
                className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all border-2 ${prodType === 'Litros' ? 'bg-[#3E6837] text-white border-transparent shadow-lg' : 'bg-white dark:bg-neutral-800 text-[#74796D] border-[#EFF2E6] dark:border-neutral-700'}`}
              >
                <Milk size={16} /> Leite
              </button>
              <button 
                onClick={() => setProdType('Carne')}
                className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all border-2 ${prodType === 'Carne' ? 'bg-[#8B4513] text-white border-transparent shadow-lg' : 'bg-white dark:bg-neutral-800 text-[#74796D] border-[#EFF2E6] dark:border-neutral-700'}`}
              >
                <Beef size={16} /> Peso
              </button>
            </div>

            <div className="relative">
              <input 
                type="number" 
                inputMode="decimal"
                placeholder="Quantidade" 
                className="w-full bg-white dark:bg-neutral-800 border-2 border-[#E0E4D6] dark:border-neutral-700 rounded-2xl pl-5 pr-14 py-5 text-2xl font-black text-[#1A1C18] dark:text-white outline-none focus:border-[#3E6837]"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-[#74796D] uppercase">
                {prodType === 'Litros' ? 'L' : 'Kg'}
              </span>
            </div>

            <button 
              onClick={handleSave}
              disabled={!amount}
              className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${!amount ? 'bg-gray-200 text-gray-400' : 'bg-[#3E6837] text-white'}`}
            >
              <Check size={20} /> Confirmar Registo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimalCard;