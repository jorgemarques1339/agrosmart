
import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus, X, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight,
  Wallet, CreditCard, DollarSign
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Transaction, StockItem } from '../types';

interface FinanceManagerProps {
  transactions: Transaction[];
  stocks: StockItem[];
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onModalChange?: (isOpen: boolean) => void;
}

const FinanceManager: React.FC<FinanceManagerProps> = ({
  transactions,
  stocks,
  onAddTransaction,
  onModalChange
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [newTx, setNewTx] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (onModalChange) {
      onModalChange(isModalOpen);
    }
  }, [isModalOpen, onModalChange]);

  const metrics = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    const balance = income - expense;
    return { income, expense, balance };
  }, [transactions]);

  // Chart Data (Simple accumulative balance for visual flair)
  const chartData = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let runningBalance = 0;
    return sorted.map(t => {
      runningBalance += t.type === 'income' ? t.amount : -t.amount;
      return { date: t.date, balance: runningBalance };
    });
  }, [transactions]);

  const handleSave = () => {
    if (!newTx.amount || !newTx.category) return;
    
    onAddTransaction({
      type: newTx.type,
      amount: parseFloat(newTx.amount),
      category: newTx.category,
      description: newTx.description || (newTx.type === 'income' ? 'Receita' : 'Despesa'),
      date: newTx.date
    });

    setNewTx({
      type: 'expense',
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(false);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
  };

  return (
    <div className="animate-fade-in pb-24">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 px-2">
        <div>
          <h2 className="text-3xl font-black italic text-gray-900 dark:text-white">Gestão<br/>Financeira</h2>
          <p className="text-sm text-gray-500 font-medium tracking-wide mt-1">Fluxo de Caixa</p>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="w-12 h-12 bg-agro-green text-white rounded-full flex items-center justify-center shadow-lg shadow-agro-green/30 active:scale-95 transition-transform"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
          <span className="text-[10px] font-bold text-agro-green dark:text-green-400 whitespace-nowrap">Nova Transação</span>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="space-y-3 mb-6">
        {/* Balance Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-neutral-800 dark:to-neutral-900 rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden">
           <div className="relative z-10">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Balanço Total</p>
              <h3 className="text-4xl font-black tracking-tight">{formatCurrency(metrics.balance)}</h3>
              
              <div className="flex items-center gap-4 mt-4">
                 <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md">
                    <ArrowDownRight className="text-green-400" size={16} />
                    <span className="text-sm font-bold">{formatCurrency(metrics.income)}</span>
                 </div>
                 <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md">
                    <ArrowUpRight className="text-red-400" size={16} />
                    <span className="text-sm font-bold">{formatCurrency(metrics.expense)}</span>
                 </div>
              </div>
           </div>
           
           <Wallet className="absolute -right-6 -bottom-6 text-white/5 w-48 h-48 rotate-12" />

           {/* Mini Chart Background */}
           <div className="absolute bottom-0 left-0 right-0 h-24 opacity-20 pointer-events-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fff" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="balance" stroke="#fff" fill="url(#colorBal)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white px-2">Histórico Recente</h3>
        
        {transactions.length === 0 ? (
           <div className="text-center py-12 opacity-50">
              <CreditCard size={48} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-bold text-gray-400">Sem movimentos registados.</p>
           </div>
        ) : (
          [...transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx) => (
            <div key={tx.id} className="bg-white dark:bg-neutral-900 p-4 rounded-[2rem] border border-gray-100 dark:border-neutral-800 shadow-sm flex items-center gap-4">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                 tx.type === 'income' 
                   ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' 
                   : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
               }`}>
                  {tx.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
               </div>
               
               <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{tx.description}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                     <span className="text-[10px] font-bold uppercase text-gray-400 bg-gray-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                        {tx.category}
                     </span>
                     <span className="text-[10px] text-gray-400">{tx.date}</span>
                  </div>
               </div>

               <div className={`text-right font-black ${tx.type === 'income' ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                  {tx.type === 'income' ? '+' : '-'}{tx.amount.toFixed(2)}€
               </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)}>
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

            <div className="space-y-5">
               {/* Type Toggle */}
               <div className="flex bg-gray-100 dark:bg-neutral-800 p-1 rounded-2xl">
                 <button 
                   onClick={() => setNewTx({...newTx, type: 'expense'})}
                   className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                     newTx.type === 'expense' ? 'bg-white dark:bg-neutral-700 shadow text-red-500' : 'text-gray-400'
                   }`}
                 >
                   Despesa
                 </button>
                 <button 
                   onClick={() => setNewTx({...newTx, type: 'income'})}
                   className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                     newTx.type === 'income' ? 'bg-white dark:bg-neutral-700 shadow text-green-500' : 'text-gray-400'
                   }`}
                 >
                   Receita
                 </button>
               </div>

               {/* Amount */}
               <div>
                  <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Valor (€)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      autoFocus
                      value={newTx.amount}
                      onChange={(e) => setNewTx({...newTx, amount: e.target.value})}
                      className="w-full p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl text-3xl font-black dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                      placeholder="0.00"
                    />
                    <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
               </div>

               {/* Category & Date */}
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Categoria</label>
                     <select 
                       value={newTx.category}
                       onChange={(e) => setNewTx({...newTx, category: e.target.value})}
                       className="w-full p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none appearance-none"
                     >
                       <option value="">Selecione...</option>
                       {newTx.type === 'expense' ? (
                         <>
                           <option value="Stock">Stock / Insumos</option>
                           <option value="Manutenção">Manutenção</option>
                           <option value="Combustível">Combustível</option>
                           <option value="Campo">Campo</option>
                           <option value="Salários">Salários</option>
                           <option value="Outro">Outro</option>
                         </>
                       ) : (
                         <>
                           <option value="Vendas">Vendas</option>
                           <option value="Subsídios">Subsídios</option>
                           <option value="Serviços">Serviços</option>
                           <option value="Outro">Outro</option>
                         </>
                       )}
                     </select>
                  </div>
                  <div>
                     <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Data</label>
                     <input 
                       type="date"
                       value={newTx.date}
                       onChange={(e) => setNewTx({...newTx, date: e.target.value})}
                       className="w-full p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none"
                     />
                  </div>
               </div>

               {/* Description */}
               <div>
                  <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Descrição</label>
                  <input 
                    type="text"
                    value={newTx.description}
                    onChange={(e) => setNewTx({...newTx, description: e.target.value})}
                    className="w-full p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                    placeholder="Ex: Venda de Milho"
                  />
               </div>

               <button 
                 onClick={handleSave}
                 disabled={!newTx.amount || !newTx.category}
                 className={`w-full py-5 rounded-[1.5rem] font-bold text-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 ${
                    !newTx.amount || !newTx.category
                      ? 'bg-gray-300 dark:bg-neutral-700 cursor-not-allowed'
                      : 'bg-agro-green text-white'
                 }`}
               >
                 Confirmar
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceManager;
