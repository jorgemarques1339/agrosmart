import React, { useState } from 'react';
import { Milk, Plus, Activity, Calendar, Weight, X, Check, Beef } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, YAxis } from 'recharts';

const AnimalCard = (props) => {
  // Lógica defensiva: Aceita tanto 'data' como 'animal' para evitar erros de ecrã branco
  const animal = props.data || props.animal;
  const { onAddProduction } = props;

  // Estados para o formulário de registo
  const [isAdding, setIsAdding] = useState(false);
  const [description, setDescription] = useState('');
  const [prodType, setProdType] = useState('Litros'); // 'Litros' ou 'Carne'
  const [amount, setAmount] = useState('');

  // Se não houver dados, não renderiza nada (evita crash)
  if (!animal) return <div className="p-4 text-center text-red-500">Erro: Dados do animal não encontrados.</div>;

  const handleSave = () => {
    if (amount && onAddProduction) {
      // Envia os dados formatados (ou objeto) para a função pai
      const finalValue = prodType === 'Litros' ? parseFloat(amount) : `${amount}kg (${description})`;
      onAddProduction(animal.id, finalValue);
      
      // Limpar formulário
      setIsAdding(false);
      setDescription('');
      setAmount('');
      setProdType('Litros');
    }
  };

  return (
    <div className="bg-white p-5 rounded-[2rem] border border-[#E0E4D6] shadow-xl animate-slide-up relative overflow-hidden transition-all">
      {/* Ícone de Fundo Decorativo */}
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Milk size={80} className="text-[#3E6837]" />
      </div>

      {/* Cabeçalho do Cartão */}
      <div className="flex justify-between items-start mb-5 relative z-10">
        <div>
          <h3 className="text-2xl font-black italic uppercase tracking-tighter text-[#1A1C18] leading-none">
            {animal.name}
          </h3>
          <p className="text-xs font-bold text-[#74796D] mt-1.5 tracking-widest uppercase flex items-center gap-1">
            {animal.id} • {animal.type}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
          animal.status === 'Saudável' 
            ? 'bg-[#EFF2E6] text-[#3E6837] border border-[#CBE6A2]' 
            : 'bg-red-50 text-red-600 border border-red-100'
        }`}>
          {animal.status}
        </span>
      </div>

      {/* Informações Rápidas */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-[#FDFDF5] p-3 rounded-2xl border border-[#EFF2E6] flex items-center gap-3">
           <div className="bg-white p-2 rounded-xl text-[#3E6837] shadow-sm"><Calendar size={16} /></div>
           <div><p className="text-[9px] font-black uppercase text-[#74796D]">Idade</p><p className="text-sm font-bold text-[#1A1C18]">{animal.age}</p></div>
        </div>
        <div className="bg-[#FDFDF5] p-3 rounded-2xl border border-[#EFF2E6] flex items-center gap-3">
           <div className="bg-white p-2 rounded-xl text-[#3E6837] shadow-sm"><Weight size={16} /></div>
           <div><p className="text-[9px] font-black uppercase text-[#74796D]">Peso</p><p className="text-sm font-bold text-[#1A1C18]">{animal.weight}</p></div>
        </div>
      </div>
      
      {/* Gráfico de Produção */}
      <div className="mb-2">
        <p className="text-[10px] font-black uppercase text-[#74796D] mb-2 tracking-widest flex items-center gap-1">
          <Activity size={12} /> Produção Recente
        </p>
        <div className="h-32 w-full bg-[#FDFDF5] rounded-3xl border border-[#EFF2E6] p-2 relative">
          {animal.productionHistory && animal.productionHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={animal.productionHistory}>
                <defs>
                  <linearGradient id="colorMilk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3E6837" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3E6837" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3E6837" 
                  strokeWidth={3} 
                  fill="url(#colorMilk)" 
                  animationDuration={1000}
                />
                <XAxis dataKey="day" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#3E6837'
                  }} 
                  cursor={{ stroke: '#CBE6A2', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-gray-400 italic">
              Sem dados de produção.
            </div>
          )}
        </div>
      </div>
      
      {/* Área de Ação: Botão ou Formulário */}
      {!isAdding ? (
        <button 
          onClick={() => setIsAdding(true)} 
          className="mt-5 w-full py-4 bg-[#1A1C18] text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
        >
          <Plus size={18} className="text-[#CBE6A2]" /> Registar Produção
        </button>
      ) : (
        <div className="mt-5 bg-[#FDFDF5] p-4 rounded-3xl border border-[#E0E4D6] animate-slide-up">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-black text-[#3E6837] uppercase tracking-widest">Novo Registo</h4>
            <button onClick={() => setIsAdding(false)} className="bg-white p-1.5 rounded-full text-[#74796D] shadow-sm active:scale-90"><X size={16} /></button>
          </div>

          <div className="space-y-3">
            {/* Descrição - Fonte maior para mobile */}
            <input 
              type="text" 
              placeholder="Descrição (ex: Manhã)" 
              className="w-full bg-white border border-[#E0E4D6] rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#3E6837] text-[#1A1C18]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* Tipo: Litros ou Carne */}
            <div className="flex gap-2">
              <button 
                onClick={() => setProdType('Litros')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${prodType === 'Litros' ? 'bg-[#3E6837] text-white shadow-md' : 'bg-white text-[#74796D] border border-[#E0E4D6]'}`}
              >
                <Milk size={16} /> Litros
              </button>
              <button 
                onClick={() => setProdType('Carne')}
                className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${prodType === 'Carne' ? 'bg-[#8B4513] text-white shadow-md' : 'bg-white text-[#74796D] border border-[#E0E4D6]'}`}
              >
                <Beef size={16} /> Carne
              </button>
            </div>

            {/* Quantidade */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="number" 
                  placeholder="Qtd" 
                  className="w-full bg-white border border-[#E0E4D6] rounded-xl pl-4 pr-8 py-3 text-lg font-bold outline-none focus:border-[#3E6837] text-[#1A1C18]"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#74796D]">
                  {prodType === 'Litros' ? 'L' : 'Kg'}
                </span>
              </div>
              <button 
                onClick={handleSave}
                className="bg-[#3E6837] text-white w-14 rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center"
              >
                <Check size={24} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimalCard;