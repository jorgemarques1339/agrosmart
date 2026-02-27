
import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus, X, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight,
  Wallet, Printer, PieChart as PieChartIcon,
  BarChart as BarChartIcon, List, Calendar, Coins,
  Package, Sprout, Beef, Loader2, FileText
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid,
  PieChart, Pie, Legend
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, StockItem, Animal, Field } from '../../types';
import { useStore } from '../../store/useStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Dialog, DialogHeader, DialogTitle, DialogClose, DialogContent } from '../../components/ui/Dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';

interface FinanceManagerProps {
  transactions: Transaction[];
  stocks: StockItem[];
  animals?: Animal[];
  fields?: Field[];
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
}

const FinanceManager: React.FC<FinanceManagerProps> = ({
  transactions,
  stocks,
  animals = [],
  fields = [],
  onAddTransaction
}) => {
  const setChildModalOpen = useStore(state => state.setChildModalOpen);
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
    setChildModalOpen(isModalOpen);
    return () => setChildModalOpen(false);
  }, [isModalOpen, setChildModalOpen]);

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

  // --- Lógica de Negócio: Rentabilidade por Cultura ---
  const cropProfitability = useMemo(() => {
    const cropsData: Record<string, { name: string, income: number, expense: number }> = {};

    // 1. Receitas por Cultura (das Vendas)
    transactions.filter(t => t.type === 'income' && t.category === 'Vendas' && t.relatedCrop).forEach(t => {
      const crop = t.relatedCrop!;
      if (!cropsData[crop]) cropsData[crop] = { name: crop, income: 0, expense: 0 };
      cropsData[crop].income += t.amount;
    });

    // 2. Custos Diretos (Campo/Fertilizantes/Mão de Obra das logs dos campos)
    fields.forEach(f => {
      const crop = f.crop;
      if (!cropsData[crop]) cropsData[crop] = { name: crop, income: 0, expense: 0 };
      const fieldCosts = f.logs?.reduce((acc, log) => acc + (log.cost || 0), 0) || 0;
      cropsData[crop].expense += fieldCosts;
    });

    // 3. Custos Indiretos (Manutenção de Máquinas e Combustível)
    // Alocação Proporcional por Área Total
    const machineMaintenance = transactions
      .filter(t => t.type === 'expense' && (t.category === 'Manutenção' || t.category === 'Combustível'))
      .reduce((acc, t) => acc + t.amount, 0);

    const totalArea = fields.reduce((acc, f) => acc + f.areaHa, 0) || 1;

    fields.forEach(f => {
      const crop = f.crop;
      const proportion = (f.areaHa / totalArea);
      const allocatedMachineCost = machineMaintenance * proportion;
      cropsData[crop].expense += allocatedMachineCost;
    });

    // 4. Custos de Pecuária (Ração e Medicamentos)
    const animalCosts = transactions
      .filter(t => t.type === 'expense' && (t.category === 'Stock' && (t.description.includes('Ração') || t.description.includes('Medicamento'))))
      .reduce((acc, t) => acc + t.amount, 0);

    if (animalCosts > 0) {
      if (!cropsData['Pecuária']) cropsData['Pecuária'] = { name: 'Pecuária', income: 0, expense: 0 };
      // Somar receitas de animais se existirem (ex: venda de leite/carne)
      const animalIncome = transactions
        .filter(t => t.type === 'income' && t.description.includes('Animal'))
        .reduce((acc, t) => acc + t.amount, 0);
      cropsData['Pecuária'].income += animalIncome;
      cropsData['Pecuária'].expense += animalCosts;
    }

    return Object.values(cropsData).map(c => ({
      ...c,
      profit: c.income - c.expense
    })).sort((a, b) => b.profit - a.profit);
  }, [transactions, fields]);

  // --- Dados para Gráfico de Distribuição de Custos ---
  const costDistributionData = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    const colors: Record<string, string> = {
      'Stock': '#3B82F6',
      'Manutenção': '#F59E0B',
      'Combustível': '#EF4444',
      'Campo': '#10B981',
      'Salários': '#6366F1',
      'Outro': '#9CA3AF'
    };

    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
      color: colors[name] || '#CBD5E1'
    }));
  }, [transactions]);

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
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount} - Gerado por Oriva Enterprise`, 105, 287, { align: 'center' });
      }

      doc.save(`Relatorio_Contas_${new Date().toISOString().slice(0, 10)}.pdf`);
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
    <div className="animate-fade-in pb-24 pt-2 px-2">

      {/* 1. Header do Dashboard */}
      <div className="flex justify-between items-center mb-4 px-1">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/20 rounded-full text-yellow-600 dark:text-yellow-400">
              <Coins size={16} />
            </div>
            <h2 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white">Gestão Financeira</h2>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide ml-1">Balanço & Lucros</p>
        </div>

        <div className="flex gap-2">
          {/* Botão Exportar PDF */}
          <Button
            onClick={generateReport}
            disabled={isGeneratingPdf || transactions.length === 0}
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-white dark:bg-neutral-800 shadow-sm text-gray-600 dark:text-white"
            title="Exportar Relatório"
          >
            {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
          </Button>

          {/* Botão Nova Transação */}
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="agro"
            size="icon"
            className="w-10 h-10 rounded-full shadow-lg shadow-agro-green/30"
          >
            <Plus size={20} />
          </Button>
        </div>
      </div>

      {/* 2. Tabs Navegação */}
      <Tabs className="mb-4">
        <TabsList>
          <TabsTrigger
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </TabsTrigger>
          <TabsTrigger
            active={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
          >
            Movimentos
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* --- TAB: DASHBOARD (MÉTRICAS & GRÁFICOS) --- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4 animate-slide-up">

          {/* Card Lucro Líquido (Destaque) */}
          <div className={`relative overflow-hidden rounded-[2rem] px-5 py-4 text-white shadow-xl transition-all ${metrics.netProfit >= 0
            ? 'bg-gradient-to-br from-[#3E6837] to-[#2A4825] shadow-green-900/20'
            : 'bg-gradient-to-br from-red-600 to-red-800 shadow-red-900/20'
            }`}>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-0.5">Resultado Líquido</p>
                <h3 className="text-3xl font-black tracking-tight">
                  {formatCurrency(metrics.netProfit)}
                </h3>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-xl text-[10px] font-bold">
                  {metrics.netProfit >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {metrics.margin.toFixed(1)}%
                </div>
                <span className="text-[9px] opacity-60 uppercase font-bold tracking-wider">margem</span>
              </div>
            </div>
            <Wallet className="absolute -right-4 -bottom-4 text-white/10 w-24 h-24 rotate-12" />
          </div>

          {/* Grelha Balanço (In/Out/Assets) - 3 columns on mobile too */}
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <div className="bg-white dark:bg-neutral-900 p-3 md:p-5 rounded-[1.5rem] md:rounded-[2.2rem] shadow-sm border border-gray-100 dark:border-neutral-800 flex flex-col justify-between">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-600 mb-2">
                <ArrowDownRight size={16} />
              </div>
              <div>
                <p className="text-[9px] md:text-[10px] font-bold uppercase text-gray-400">Receitas</p>
                <p className="text-sm md:text-xl font-black text-gray-900 dark:text-white leading-tight">{formatCurrency(metrics.income)}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-3 md:p-5 rounded-[1.5rem] md:rounded-[2.2rem] shadow-sm border border-gray-100 dark:border-neutral-800 flex flex-col justify-between">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-600 mb-2">
                <ArrowUpRight size={16} />
              </div>
              <div>
                <p className="text-[9px] md:text-[10px] font-bold uppercase text-gray-400">Despesas</p>
                <p className="text-sm md:text-xl font-black text-gray-900 dark:text-white leading-tight">{formatCurrency(metrics.expense)}</p>
              </div>
            </div>

            {/* Card Valor em Stock */}
            <div className="bg-gray-100 dark:bg-neutral-800 p-3 md:p-5 rounded-[1.5rem] md:rounded-[2.2rem] border border-gray-200 dark:border-neutral-700 flex flex-col justify-between">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 mb-2">
                <Package size={16} />
              </div>
              <div>
                <p className="text-[9px] md:text-[10px] font-bold uppercase text-gray-500 mb-0.5">Stock</p>
                <p className="text-sm md:text-xl font-black text-gray-800 dark:text-white leading-tight">{formatCurrency(metrics.stockAssetsValue)}</p>
              </div>
            </div>
          </div>



          {/* Gráfico de Rentabilidade por Cultura */}
          <div className="bg-white dark:bg-neutral-900 p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sprout size={14} className="text-emerald-500" />
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Rentabilidade por Cultura</h4>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Receita</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-[9px] font-bold text-gray-400 uppercase">Custo</span>
                </div>
              </div>
            </div>
            {cropProfitability.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 opacity-40">
                <Sprout size={32} className="text-gray-300 mb-2" />
                <p className="text-xs font-bold text-gray-400">Registe vendas por cultura para ver a rentabilidade</p>
              </div>
            ) : (
              <div className="h-48 md:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={cropProfitability}
                    layout="vertical"
                    margin={{ left: 4, right: 20, top: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} opacity={0.06} />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      width={72}
                      tick={{ fontSize: 9, fontWeight: 700, fill: '#9ca3af' }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: '11px', padding: '8px 12px' }}
                      formatter={(value: any) => [formatCurrency(value)]}
                    />
                    <Bar dataKey="income" name="Receita" fill="#10B981" radius={[0, 6, 6, 0]} barSize={10} />
                    <Bar dataKey="expense" name="Custo" fill="#EF4444" radius={[0, 6, 6, 0]} barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Gráfico Comparativo Geral */}
            <div className="bg-white dark:bg-neutral-900 p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-neutral-800">
              <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
                <BarChartIcon size={13} className="text-gray-400" /> Análise Global
              </h4>
              <div className="h-36 md:h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={32} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.08} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }} />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                      contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: '11px', padding: '6px 10px' }}
                      formatter={(value: any) => [formatCurrency(value)]}
                    />
                    <Bar dataKey="value" radius={[8, 8, 8, 8]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico de Distribuição de Custos */}
            <div className="bg-white dark:bg-neutral-900 p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-neutral-800">
              <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-1.5">
                <PieChartIcon size={13} className="text-gray-400" /> Distribuição de Custos
              </h4>
              {costDistributionData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-36 opacity-40">
                  <PieChartIcon size={28} className="text-gray-300 mb-2" />
                  <p className="text-xs font-bold text-gray-400 text-center">Sem despesas registadas</p>
                </div>
              ) : (
                <div className="h-44 md:h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Pie
                        data={costDistributionData}
                        cx="50%"
                        cy="42%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {costDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [formatCurrency(value)]}
                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: '11px', padding: '6px 10px' }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        align="center"
                        iconType="circle"
                        iconSize={7}
                        wrapperStyle={{ fontSize: '9px', paddingTop: '4px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: HISTÓRICO --- */}
      {activeTab === 'history' && (
        <div className="space-y-3 animate-slide-up">
          {/* Summary mini-bar */}
          <div className="flex gap-2 mb-1">
            <div className="flex-1 bg-green-50 dark:bg-green-900/10 rounded-2xl px-3 py-2 flex items-center gap-2">
              <ArrowDownRight size={14} className="text-green-500 shrink-0" />
              <div>
                <p className="text-[9px] font-bold uppercase text-green-600/70">Total Receitas</p>
                <p className="text-xs font-black text-green-700 dark:text-green-400">{formatCurrency(metrics.income)}</p>
              </div>
            </div>
            <div className="flex-1 bg-red-50 dark:bg-red-900/10 rounded-2xl px-3 py-2 flex items-center gap-2">
              <ArrowUpRight size={14} className="text-red-500 shrink-0" />
              <div>
                <p className="text-[9px] font-bold uppercase text-red-600/70">Total Despesas</p>
                <p className="text-xs font-black text-red-700 dark:text-red-400">{formatCurrency(metrics.expense)}</p>
              </div>
            </div>
          </div>

          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 opacity-50 text-center">
              <List size={40} className="text-gray-300 mb-3" />
              <p className="text-sm font-bold text-gray-400">Sem movimentos registados.</p>
            </div>
          ) : (
            <>
              {/* Mobile/Tablet List View */}
              <div className="md:hidden space-y-2">
                {[...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx) => (
                  <div key={tx.id} className="bg-white dark:bg-neutral-900 px-3 py-3 rounded-[1.5rem] border border-gray-100 dark:border-neutral-800 shadow-sm flex items-center gap-3 active:scale-[0.98] transition-transform">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.type === 'income'
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                      {tx.type === 'income' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-white text-xs truncate">{tx.description}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-bold uppercase text-gray-500 bg-gray-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-md">
                          {tx.category}
                        </span>
                        <span className="text-[9px] text-gray-400 font-mono">{tx.date}</span>
                        {tx.relatedCrop && (
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-md">🌱 {tx.relatedCrop}</span>
                        )}
                      </div>
                    </div>

                    <div className={`text-right font-black text-xs shrink-0 ${tx.type === 'income' ? 'text-green-600' : 'text-gray-800 dark:text-white'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (Show on md screens and up) */}
              <div className="hidden md:block bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income'
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                            {tx.type === 'income' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono font-bold text-gray-500">{tx.date}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">{tx.description}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-[10px] font-bold uppercase text-gray-500 bg-gray-100 dark:bg-neutral-800 px-3 py-1 rounded-full">
                            {tx.category}
                          </span>
                        </TableCell>
                        <TableCell className={`text-right font-black text-sm ${tx.type === 'income' ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      )}

      {/* --- MODAL DE ADIÇÃO --- */}
      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
          <DialogClose onClose={() => setIsModalOpen(false)} />
        </DialogHeader>

        <DialogContent className="space-y-5">
          {/* Type Toggle */}
          <Tabs>
            <TabsList>
              <TabsTrigger
                active={newTx.type === 'expense'}
                onClick={() => setNewTx({ ...newTx, type: 'expense' })}
                className="text-red-500 hover:text-red-600"
              >
                Despesa
              </TabsTrigger>
              <TabsTrigger
                active={newTx.type === 'income'}
                onClick={() => setNewTx({ ...newTx, type: 'income' })}
                className="text-green-500 hover:text-green-600"
              >
                Receita
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Amount */}
          <div>
            <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Valor (€)</label>
            <Input
              type="number"
              autoFocus
              value={newTx.amount}
              onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
              className="h-16 text-3xl font-black bg-gray-50 dark:bg-neutral-800"
              placeholder="0.00"
            />
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Categoria</label>
              <Select
                value={newTx.category}
                onChange={(e) => setNewTx({ ...newTx, category: e.target.value })}
                className="bg-gray-50 dark:bg-neutral-800 h-14"
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
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Data</label>
              <Input
                type="date"
                value={newTx.date}
                onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                className="h-14 bg-gray-50 dark:bg-neutral-800"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Descrição</label>
            <Input
              type="text"
              value={newTx.description}
              onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
              className="h-14 bg-gray-50 dark:bg-neutral-800"
              placeholder="Ex: Venda de Milho"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={!newTx.amount || !newTx.category}
            variant="agro"
            size="lg"
            className="w-full h-16 text-xl mt-2 rounded-[1.5rem]"
          >
            Confirmar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinanceManager;