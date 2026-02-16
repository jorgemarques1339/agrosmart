
import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus, X, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight,
  Wallet, Printer, PieChart as PieChartIcon,
  BarChart as BarChartIcon, List, Calendar, Coins,
  Package, Sprout, Beef, Loader2, FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, StockItem, Animal, Field } from '../types';

interface FinanceManagerProps {
  transactions: Transaction[];
  stocks: StockItem[];
  animals?: Animal[];
  fields?: Field[];
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onModalChange?: (isOpen: boolean) => void;
}

const FinanceManager: React.FC<FinanceManagerProps> = ({
  transactions,
  stocks,
  animals = [],
  fields = [],
  onAddTransaction,
  onModalChange
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
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

  // --- Lógica de Negócio: Cálculo de Métricas Financeiras ---
  const metrics = useMemo(() => {
    // 1. Fluxo de Caixa (Transações)
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    
    const netProfit = income - expense;
    const margin = income > 0 ? (netProfit / income) * 100 : 0;

    // 2. Valorização de Ativos (Stock Imobilizado)
    const stockAssetsValue = stocks.reduce((acc, s) => acc + (s.quantity * s.pricePerUnit), 0);

    return { income, expense, netProfit, margin, stockAssetsValue };
  }, [transactions, stocks]);

  // --- Dados para Gráficos ---
  const chartData = useMemo(() => {
    return [
      { name: 'Receitas', value: metrics.income, color: '#3E6837' }, // Agro Green
      { name: 'Despesas', value: metrics.expense, color: '#DC2626' } // Red
    ];
  }, [metrics]);

  // --- Formatador de Moeda ---
  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
  };

  // --- Geração de PDF (Relatório Contabilista) ---
  const generateReport = () => {
    setIsGeneratingPdf(true);
    setTimeout(() => {
      const doc = new jsPDF();
      
      // Cabeçalho
      doc.setFontSize(18);
      doc.setTextColor(62, 104, 55); // Agro Green
      doc.text("Relatório Financeiro Oriva", 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Data de Emissão: ${new Date().toLocaleDateString()}`, 14, 28);
      doc.text("Extrato de Movimentos e Balanço", 14, 33);

      // Resumo Financeiro
      doc.setDrawColor(200);
      doc.line(14, 38, 196, 38);
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Total Receitas: ${formatCurrency(metrics.income)}`, 14, 48);
      doc.text(`Total Despesas: ${formatCurrency(metrics.expense)}`, 14, 55);
      
      doc.setFontSize(14);
      if (metrics.netProfit >= 0) doc.setTextColor(0, 150, 0);
      else doc.setTextColor(200, 0, 0);
      doc.text(`Saldo Líquido: ${formatCurrency(metrics.netProfit)}`, 14, 65);

      // Tabela de Transações
      const tableRows = transactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(t => [
          t.date,
          t.description,
          t.category,
          t.type === 'income' ? 'Receita' : 'Despesa',
          formatCurrency(t.amount)
        ]);

      autoTable(doc, {
        startY: 75,
        head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [62, 104, 55] },
        styles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount} - Gerado por Oriva Enterprise`, 105, 287, { align: 'center' });
      }

      doc.save(`Relatorio_Contas_${new Date().toISOString().slice(0,10)}.pdf`);
      setIsGeneratingPdf(false);
    }, 1000); // Simula processamento
  };

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

  return (
    <div className="animate-fade-in pb-24 pt-4 px-2">
      
      {/* 1. Header do Dashboard */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-full text-yellow-600 dark:text-yellow-400">
                <Coins size={20} />
             </div>
             <h2 className="text-2xl font-black text-gray-900 dark:text-white">Gestão Financeira</h2>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide ml-1">Balanço & Lucros</p>
        </div>
        
        <div className="flex gap-2">
           {/* Botão Exportar PDF */}
           <button 
             onClick={generateReport}
             disabled={isGeneratingPdf || transactions.length === 0}
             className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all active:scale-95 ${
               transactions.length === 0 ? 'bg-gray-100 text-gray-300' : 'bg-white dark:bg-neutral-800 text-gray-600 dark:text-white hover:text-blue-600'
             }`}
             title="Exportar Relatório"
           >
             {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
           </button>

           {/* Botão Nova Transação */}
           <button 
             onClick={() => setIsModalOpen(true)}
             className="w-10 h-10 bg-agro-green text-white rounded-full flex items-center justify-center shadow-lg shadow-agro-green/30 active:scale-95 transition-transform"
           >
             <Plus size={24} />
           </button>
        </div>
      </div>

      {/* 2. Tabs Navegação */}
      <div className="flex bg-gray-100 dark:bg-neutral-900 p-1 rounded-[1.5rem] mb-6">
         <button 
           onClick={() => setActiveTab('dashboard')}
           className={`flex-1 py-3 rounded-2xl text-xs font-bold uppercase tracking-wide transition-all ${
             activeTab === 'dashboard' 
               ? 'bg-white dark:bg-neutral-800 shadow-md text-agro-green dark:text-white scale-[1.02]' 
               : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
           }`}
         >
           Dashboard
         </button>
         <button 
           onClick={() => setActiveTab('history')}
           className={`flex-1 py-3 rounded-2xl text-xs font-bold uppercase tracking-wide transition-all ${
             activeTab === 'history' 
               ? 'bg-white dark:bg-neutral-800 shadow-md text-agro-green dark:text-white scale-[1.02]' 
               : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
           }`}
         >
           Movimentos
         </button>
      </div>

      {/* --- TAB: DASHBOARD (MÉTRICAS & GRÁFICOS) --- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4 animate-slide-up">
           
           {/* Card Lucro Líquido (Destaque) */}
           <div className={`relative overflow-hidden rounded-[2.5rem] p-6 text-white shadow-xl transition-all ${
              metrics.netProfit >= 0 
                ? 'bg-gradient-to-br from-[#3E6837] to-[#2A4825] shadow-green-900/20' 
                : 'bg-gradient-to-br from-red-600 to-red-800 shadow-red-900/20'
           }`}>
              <div className="relative z-10">
                 <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Resultado Líquido</p>
                 <h3 className="text-4xl font-black tracking-tight mb-2">
                    {formatCurrency(metrics.netProfit)}
                 </h3>
                 <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-xl text-[10px] font-bold">
                    {metrics.netProfit >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    Margem: {metrics.margin.toFixed(1)}%
                 </div>
              </div>
              <Wallet className="absolute -right-6 -bottom-6 text-white/10 w-32 h-32 rotate-12" />
           </div>

           {/* Grelha Balanço (In/Out) */}
           <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-neutral-900 p-5 rounded-[2.2rem] shadow-sm border border-gray-100 dark:border-neutral-800 flex flex-col justify-between">
                 <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-600 mb-3">
                    <ArrowDownRight size={20} />
                 </div>
                 <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400">Receitas</p>
                    <p className="text-xl font-black text-gray-900 dark:text-white">{formatCurrency(metrics.income)}</p>
                 </div>
              </div>
              <div className="bg-white dark:bg-neutral-900 p-5 rounded-[2.2rem] shadow-sm border border-gray-100 dark:border-neutral-800 flex flex-col justify-between">
                 <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-600 mb-3">
                    <ArrowUpRight size={20} />
                 </div>
                 <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400">Despesas</p>
                    <p className="text-xl font-black text-gray-900 dark:text-white">{formatCurrency(metrics.expense)}</p>
                 </div>
              </div>
           </div>

           {/* Card Valor em Stock (Ativos) */}
           <div className="bg-gray-100 dark:bg-neutral-800 p-5 rounded-[2.2rem] border border-gray-200 dark:border-neutral-700 flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-bold uppercase text-gray-500 mb-1 flex items-center gap-1">
                    <Package size={12} /> Valor em Stock
                 </p>
                 <p className="text-xl font-black text-gray-800 dark:text-white">{formatCurrency(metrics.stockAssetsValue)}</p>
              </div>
              <div className="h-8 w-24 bg-white dark:bg-neutral-700 rounded-xl flex items-center justify-center text-xs font-bold text-gray-400">
                 {stocks.length} Itens
              </div>
           </div>

           {/* Gráfico Comparativo */}
           <div className="bg-white dark:bg-neutral-900 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-neutral-800">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                 <BarChartIcon size={16} className="text-gray-400" /> Análise Financeira
              </h4>
              <div className="h-48 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barSize={40}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 'bold', fill: '#9ca3af'}} />
                       <YAxis hide />
                       <Tooltip 
                          cursor={{fill: 'transparent'}}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                       />
                       <Bar dataKey="value" radius={[10, 10, 10, 10]}>
                          {chartData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>
      )}

      {/* --- TAB: HISTÓRICO --- */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-slide-up">
           {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 opacity-50">
                 <List size={48} className="text-gray-300 mb-4" />
                 <p className="text-sm font-bold text-gray-400">Sem movimentos registados.</p>
              </div>
           ) : (
             // Lista de Transações Recentes
             [...transactions].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx) => (
               <div key={tx.id} className="bg-white dark:bg-neutral-900 p-4 rounded-[2rem] border border-gray-100 dark:border-neutral-800 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-transform">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    tx.type === 'income' 
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' 
                      : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                     {tx.type === 'income' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                     <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{tx.description}</h4>
                     <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold uppercase text-gray-500 bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">
                           {tx.category}
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono">
                           {tx.date}
                        </span>
                     </div>
                  </div>

                  <div className={`text-right font-black text-sm ${tx.type === 'income' ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                     {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
               </div>
             ))
           )}
        </div>
      )}

      {/* --- MODAL DE ADIÇÃO (BottomSheet) --- */}
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
                  <input 
                    type="number"
                    autoFocus
                    value={newTx.amount}
                    onChange={(e) => setNewTx({...newTx, amount: e.target.value})}
                    className="w-full p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl text-3xl font-black dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                    placeholder="0.00"
                  />
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
                           <option value="Stock">Stock</option>
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