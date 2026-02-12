import React, { useMemo, useState, useEffect } from 'react';
import { 
  Coins, TrendingUp, TrendingDown, Wallet, PieChart, 
  ArrowUpRight, ArrowDownRight, Package, DollarSign,
  CreditCard, Activity, Calendar, Plus, X, Check
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { Transaction, StockItem } from '../types';

interface FinanceManagerProps {
  transactions: Transaction[];
  stocks: StockItem[];
  onAddTransaction?: (t: Omit<Transaction, 'id'>) => void;
  onModalChange?: (isOpen: boolean) => void;
}

const FinanceManager: React.FC<FinanceManagerProps> = ({ 
  transactions, 
  stocks, 
  onAddTransaction,
  onModalChange
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Notificar o pai quando o estado do modal muda
  useEffect(() => {
    if (onModalChange) {
      onModalChange(isModalOpen);
    }
  }, [isModalOpen, onModalChange]);

  // Form State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [category, setCategory] = useState('');

  // Categories based on type
  const categories = useMemo(() => {
    return type === 'income' 
      ? ['Vendas', 'Subsídios', 'Serviços', 'Outro']
      : ['Fito', 'Adubo', 'Ração', 'Manutenção', 'Combustível', 'Outro'];
  }, [type]);

  // Set default category when type changes
  useMemo(() => {
    setCategory(categories[0]);
  }, [categories]);

  // --- Lógica de Negócio e Cálculos (Memoized) ---
  
  const financialData = useMemo(() => {
    // 1. Totais de Fluxo de Caixa
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    // 2. Lucro Líquido
    const netProfit = income - expense;

    // 3. Valorização de Ativos em Stock (Capital Imobilizado)
    const stockAssetsValue = stocks.reduce((acc, item) => {
      return acc + (item.quantity * item.pricePerUnit);
    }, 0);

    // 4. Transações Recentes (Top 5)
    const recentHistory = [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // 5. Dados para o Gráfico
    const chartData = [
      { name: 'Entradas', value: income, color: '#3E6837' }, // Agro Primary
      { name: 'Saídas', value: expense, color: '#BA1A1A' },  // Warning Red
    ];

    return { income, expense, netProfit, stockAssetsValue, recentHistory, chartData };
  }, [transactions, stocks]);

  // --- Helpers de Formatação ---
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSubmit = () => {
    if (!amount || !description || !onAddTransaction) return;
    
    onAddTransaction({
      date: new Date().toISOString().split('T')[0],
      type,
      amount: parseFloat(amount),
      description,
      category
    });

    // Reset and close
    setAmount('');
    setDescription('');
    setIsModalOpen(false);
  };

  // --- Estado Vazio ---
  
  if (transactions.length === 0 && stocks.length === 0 && !isModalOpen) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 animate-fade-in relative">
        {/* Absolute add button for empty state */}
        {onAddTransaction && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="absolute top-0 right-2 w-12 h-12 bg-agro-green text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <Plus size={24} />
          </button>
        )}

        <div className="w-24 h-24 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
          <Wallet size={40} className="text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sem Dados Financeiros</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs mb-6">
          Registe transações ou adicione stocks para visualizar o seu dashboard financeiro.
        </p>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-agro-green text-white rounded-[1.5rem] font-bold shadow-lg shadow-agro-green/30"
        >
          Registar Primeira Transação
        </button>

        {/* Modal Logic Reuse */}
        {isModalOpen && renderModal()}
      </div>
    );
  }

  function renderModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)}>
          <div 
            className="bg-white dark:bg-neutral-900 w-full max-w-md p-6 rounded-t-[2.5rem] shadow-2xl animate-slide-up border-t border-white/20" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold dark:text-white">Nova Transação</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                <X size={20} className="dark:text-white" />
              </button>
            </div>

            {/* Type Toggle */}
            <div className="flex bg-gray-100 dark:bg-neutral-800 p-1 rounded-2xl mb-6">
              <button 
                onClick={() => setType('income')}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                  type === 'income' 
                    ? 'bg-white dark:bg-neutral-700 text-green-600 dark:text-green-400 shadow-sm' 
                    : 'text-gray-400'
                }`}
              >
                <ArrowUpRight size={18} /> Receita
              </button>
              <button 
                onClick={() => setType('expense')}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                  type === 'expense' 
                    ? 'bg-white dark:bg-neutral-700 text-red-600 dark:text-red-400 shadow-sm' 
                    : 'text-gray-400'
                }`}
              >
                <ArrowDownRight size={18} /> Despesa
              </button>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-xs font-bold uppercase text-gray-400 mb-2 ml-2">
                Valor
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-5xl font-black bg-transparent border-b-2 border-gray-200 dark:border-neutral-700 focus:border-agro-green outline-none py-2 text-gray-900 dark:text-white pl-8"
                  placeholder="0.00"
                  autoFocus
                />
                <span className="absolute left-0 bottom-4 text-3xl font-bold text-gray-400">€</span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4 mb-8">
               <div>
                 <label className="block text-xs font-bold uppercase text-gray-400 mb-2 ml-2">Descrição</label>
                 <input 
                   type="text"
                   value={description}
                   onChange={(e) => setDescription(e.target.value)}
                   className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                   placeholder={type === 'income' ? 'Ex: Venda de Leitão' : 'Ex: Reparação Trator'}
                 />
               </div>
               
               <div>
                 <label className="block text-xs font-bold uppercase text-gray-400 mb-2 ml-2">Categoria</label>
                 <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors border ${
                          category === cat 
                            ? 'bg-agro-green text-white border-agro-green' 
                            : 'bg-transparent border-gray-200 dark:border-neutral-700 text-gray-500'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                 </div>
               </div>
            </div>

            <button 
              onClick={handleSubmit}
              className={`w-full py-4 text-white rounded-[1.5rem] font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 ${
                type === 'income' ? 'bg-[#3E6837]' : 'bg-red-600'
              }`}
            >
              <Check size={20} />
              Confirmar {type === 'income' ? 'Receita' : 'Despesa'}
            </button>
          </div>
        </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 animate-fade-in pt-6">
      
      {/* --- Header da Secção --- */}
      <div className="flex justify-between items-start px-2">
        <div>
          <h1 className="text-3xl font-black italic text-gray-900 dark:text-white">Gestão<br/>Financeira</h1>
          <p className="text-sm text-gray-500 font-medium tracking-wide mt-1">Balanço e Lucros</p>
        </div>
        
        {/* Action Button */}
        {onAddTransaction && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-14 h-14 bg-agro-green text-white rounded-full flex items-center justify-center shadow-lg shadow-agro-green/30 active:scale-95 transition-transform"
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* --- Card Principal: Lucro Líquido --- */}
      <div className={`relative overflow-hidden rounded-[2.5rem] p-8 shadow-xl transition-all duration-500 ${
        financialData.netProfit >= 0 
          ? 'bg-gradient-to-br from-[#3E6837] to-[#2A4825] text-white shadow-green-900/20' 
          : 'bg-gradient-to-br from-red-600 to-red-800 text-white shadow-red-900/20'
      }`}>
        <div className="relative z-10">
          <div className="flex items-center gap-2 opacity-90 mb-2">
            <PieChart size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Lucro Líquido (Mês)</span>
          </div>
          <div className="flex items-baseline gap-1">
            <h2 className="text-5xl font-black tracking-tight">
              {formatCurrency(financialData.netProfit)}
            </h2>
          </div>
          <p className="mt-4 text-sm opacity-80 font-medium bg-white/20 backdrop-blur-md inline-block px-3 py-1 rounded-lg">
            {financialData.netProfit >= 0 ? 'Resultado Positivo' : 'Atenção Necessária'}
          </p>
        </div>
        
        {/* Elementos Decorativos de Fundo */}
        <TrendingUp className="absolute -right-6 -bottom-6 w-48 h-48 opacity-10 rotate-12" />
      </div>

      {/* --- Grid: Entradas, Saídas e Ativos --- */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Receitas */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-[2rem] border border-gray-100 dark:border-neutral-800 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full">
              <ArrowUpRight size={20} />
            </div>
            <span className="text-[10px] uppercase font-bold text-gray-400">Receitas</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white block">
              {formatCurrency(financialData.income)}
            </span>
          </div>
        </div>

        {/* Despesas */}
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-[2rem] border border-gray-100 dark:border-neutral-800 shadow-sm flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full">
              <ArrowDownRight size={20} />
            </div>
            <span className="text-[10px] uppercase font-bold text-gray-400">Despesas</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white block">
              {formatCurrency(financialData.expense)}
            </span>
          </div>
        </div>

        {/* Ativos em Stock (Full Width na Grid) */}
        <div className="col-span-2 bg-blue-50 dark:bg-blue-900/10 p-5 rounded-[2rem] border border-blue-100 dark:border-blue-900/30 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-blue-100 dark:bg-blue-800/30 text-blue-600 dark:text-blue-400 rounded-2xl">
               <Package size={24} />
             </div>
             <div>
               <p className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase">Valor em Stock</p>
               <p className="text-xs text-blue-600 dark:text-blue-400/70">Capital Imobilizado</p>
             </div>
           </div>
           <span className="text-2xl font-black text-blue-900 dark:text-blue-100">
             {formatCurrency(financialData.stockAssetsValue)}
           </span>
        </div>
      </div>

      {/* --- Gráfico Comparativo --- */}
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-sm h-72">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity size={18} className="text-gray-400" />
            Análise de Fluxo
          </h3>
        </div>
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={financialData.chartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
             <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={localStorage.getItem('agro_theme') === 'dark' ? '#262626' : '#e5e7eb'} />
             <XAxis type="number" hide />
             <YAxis dataKey="name" type="category" width={70} tick={{fill: '#9ca3af', fontSize: 12, fontWeight: 600}} axisLine={false} tickLine={false} />
             <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
             />
             <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={32}>
               {financialData.chartData.map((entry, index) => (
                 <Cell key={`cell-${index}`} fill={entry.color} />
               ))}
             </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* --- Histórico de Transações --- */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 px-2">Movimentos Recentes</h3>
        <div className="space-y-3">
          {financialData.recentHistory.map((t) => (
            <div key={t.id} className="group flex items-center justify-between p-4 bg-white dark:bg-neutral-900 rounded-[1.5rem] border border-gray-100 dark:border-neutral-800 shadow-sm active:scale-[0.98] transition-all">
               <div className="flex items-center gap-4">
                 <div className={`p-3 rounded-2xl ${
                   t.type === 'income' 
                     ? 'bg-green-50 dark:bg-green-900/20 text-green-600' 
                     : 'bg-red-50 dark:bg-red-900/20 text-red-600'
                 }`}>
                    {t.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                 </div>
                 <div>
                   <p className="font-bold text-sm text-gray-900 dark:text-white">{t.description}</p>
                   <div className="flex items-center gap-2 mt-0.5">
                     <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-neutral-800 text-gray-500 px-1.5 py-0.5 rounded">
                       {t.category}
                     </span>
                     <span className="text-xs text-gray-400 flex items-center gap-1">
                       <Calendar size={10} /> {t.date}
                     </span>
                   </div>
                 </div>
               </div>
               <span className={`font-bold text-base ${
                 t.type === 'income' ? 'text-green-600' : 'text-red-600'
               }`}>
                 {t.type === 'income' ? '+' : '-'}{t.amount}€
               </span>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && renderModal()}

    </div>
  );
};

export default FinanceManager;