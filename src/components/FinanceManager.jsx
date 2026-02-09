import React from 'react';
import { Coins, TrendingDown, TrendingUp, Wallet, PieChart, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const FinanceManager = ({ stocks = [], transactions = [] }) => {
  
  // 1. Tratamento de Dados Seguro (Evitar crashes)
  const safeStocks = Array.isArray(stocks) ? stocks : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  // 2. Calcular Valor Total em Stock (Ativos)
  // Proteção: Garante que quantity e price são números. Se price não existir, usa 0.
  const totalStockValue = safeStocks.reduce((acc, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    return acc + (qty * price);
  }, 0);

  // 3. Calcular Totais de Receitas e Despesas
  const totalExpenses = safeTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const totalIncome = safeTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const netProfit = totalIncome - totalExpenses;

  // 4. Preparar dados para o gráfico (Proteção contra NaN)
  const chartData = [
    { name: 'Receitas', value: totalIncome > 0 ? totalIncome : 0, color: '#3E6837' }, 
    { name: 'Despesas', value: totalExpenses > 0 ? totalExpenses : 0, color: '#BA1A1A' }, 
  ];

  // Helper para formatar moeda com segurança
  const formatCurrency = (val) => {
    return (Number(val) || 0).toFixed(2) + '€';
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Cabeçalho */}
      <div className="bg-white p-5 rounded-[24px] shadow-sm border border-[#E0E4D6] flex justify-between items-center">
        <div>
          <h2 className="text-xl font-normal text-[#1A1C18]">Gestão Financeira</h2>
          <p className="text-xs text-[#43483E]">Balanço e Lucros</p>
        </div>
        <div className="w-10 h-10 bg-[#E1E4D5] rounded-full flex items-center justify-center">
          <Coins size={20} className="text-[#3E6837]" />
        </div>
      </div>

      {/* Cartões de Resumo */}
      <div className="grid grid-cols-2 gap-3">
        {/* Lucro Líquido (Cartão Grande) */}
        <div className="col-span-2 bg-white p-4 rounded-[20px] border border-[#EFF2E6] shadow-sm flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-[#43483E] uppercase tracking-wider">Lucro Líquido</span>
            <p className={`text-3xl font-bold mt-1 ${netProfit >= 0 ? 'text-[#3E6837]' : 'text-red-600'}`}>
              {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit)}
            </p>
          </div>
          <div className={`p-3 rounded-full ${netProfit >= 0 ? 'bg-green-100 text-[#3E6837]' : 'bg-red-100 text-red-600'}`}>
            {netProfit >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          </div>
        </div>

        {/* Receitas */}
        <div className="bg-white p-4 rounded-[20px] border border-[#EFF2E6] shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-green-100 rounded-lg text-green-700"><ArrowUpRight size={16} /></div>
            <span className="text-xs font-bold text-[#43483E] uppercase">Receitas</span>
          </div>
          <p className="text-xl font-bold text-[#1A1C18]">{formatCurrency(totalIncome)}</p>
        </div>

        {/* Despesas */}
        <div className="bg-white p-4 rounded-[20px] border border-[#EFF2E6] shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-red-100 rounded-lg text-red-700"><ArrowDownRight size={16} /></div>
            <span className="text-xs font-bold text-[#43483E] uppercase">Despesas</span>
          </div>
          <p className="text-xl font-bold text-[#1A1C18]">{formatCurrency(totalExpenses)}</p>
        </div>
        
        {/* Valor em Stock (Ativos) */}
        <div className="col-span-2 bg-[#FDFDF5] p-3 rounded-[16px] border border-[#E0E4D6] flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Wallet size={16} className="text-[#3E6837]" />
                <span className="text-xs font-medium text-[#43483E]">Valor em Stock (Ativos)</span>
            </div>
            <span className="text-sm font-bold text-[#1A1C18]">{formatCurrency(totalStockValue)}</span>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-white p-4 rounded-[24px] border border-[#E0E4D6] shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <PieChart size={18} className="text-[#43483E]" />
          <h3 className="font-bold text-[#1A1C18] text-sm">Receitas vs Despesas</h3>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E0E4D6" />
              <XAxis type="number" unit="€" tick={{fontSize: 10}} hide />
              <YAxis dataKey="name" type="category" width={70} tick={{fontSize: 11, fill: '#43483E'}} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={30}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Histórico */}
      <div>
        <h3 className="text-md font-medium text-[#1A1C18] px-2 mb-2">Histórico Recente</h3>
        <div className="bg-white rounded-[20px] p-2 border border-[#E0E4D6]">
          {safeTransactions.length > 0 ? (
            safeTransactions.slice().reverse().slice(0, 5).map((t) => (
              <div key={t.id} className="flex justify-between items-center p-3 border-b border-[#EFF2E6] last:border-0">
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                     {t.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                   </div>
                   <div>
                    <p className="text-sm font-medium text-[#1A1C18]">{t.description}</p>
                    <p className="text-[10px] text-[#74796D]">{t.date}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${t.type === 'income' ? 'text-green-700' : 'text-red-600'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-sm text-[#74796D]">
              Sem movimentos registados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceManager;