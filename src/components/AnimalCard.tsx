
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Heart, ShieldCheck, Activity, TrendingUp, History, 
  Plus, X, Milk, Beef, Scan, Loader2, Minus, Coins, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Animal } from '../types';

interface AnimalCardProps {
  animal: Animal;
  onReset: () => void;
  onAddProduction: (id: string, value: number, type: 'milk' | 'weight') => void;
}

const AnimalCard: React.FC<AnimalCardProps> = ({ animal, onReset, onAddProduction }) => {
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [productionType, setProductionType] = useState<'milk' | 'weight'>('milk');
  const [productionValue, setProductionValue] = useState<number>(0);
  
  // View Mode: 'production' chart or 'finance' analysis
  const [chartMode, setChartMode] = useState<'production' | 'finance'>('production');

  // Filtrar dados do gráfico baseado no tipo mais comum ou último registo
  const chartData = useMemo(() => {
    const milkCount = animal.productionHistory.filter(r => r.type === 'milk').length;
    const weightCount = animal.productionHistory.filter(r => r.type === 'weight').length;
    const activeType = weightCount > milkCount ? 'weight' : 'milk';
    
    return animal.productionHistory
      .filter(r => r.type === activeType)
      .slice(-7);
  }, [animal.productionHistory]);

  // --- Financial Logic for Animals ---
  const animalFinance = useMemo(() => {
    // Preços de Mercado (Mock)
    const PRICE_MILK = 0.45; // €/L
    const PRICE_MEAT = 2.80; // €/kg (peso vivo)
    
    // Custos Estimados (Mock)
    const COST_FEED_DAY = 3.50; // €/dia alimentação
    const COST_VET_BASE = 50; // Custo base veterinário anual

    // Receita Total
    const revenue = animal.productionHistory.reduce((acc, rec) => {
      const value = rec.type === 'milk' ? rec.value * PRICE_MILK : 0; 
      // Nota: Peso é valor de stock, não cashflow imediato, mas conta para valorização
      // Para simplificar "Lucro" visual, assumimos valorização do peso ganho
      return acc + value;
    }, 0);

    // Adicionar valorização de peso (se houver registos de peso)
    const weightGainValue = animal.productionHistory
       .filter(r => r.type === 'weight')
       .reduce((acc, r, idx, arr) => {
          // Diferença para o anterior (valorização)
          if (idx === 0) return 0;
          const gain = r.value - arr[idx-1].value;
          return acc + (gain > 0 ? gain * PRICE_MEAT : 0);
       }, 0);

    const totalRevenue = revenue + weightGainValue;

    // Despesa Estimada (Dias de vida * custo + extra se doente)
    // Simplificação: Custo baseado no número de registos x 5 dias (simulando intervalo)
    const estimatedDays = animal.productionHistory.length * 7; 
    let expenses = estimatedDays * COST_FEED_DAY;
    
    if (animal.status === 'sick') expenses += 150; // Custo tratamento extra

    const profit = totalRevenue - expenses;

    // Data for Graph
    const financeGraph = [
      { name: 'Start', profit: 0 },
      { name: 'Current', profit: profit }
    ];

    return { totalRevenue, expenses, profit, financeGraph };
  }, [animal]);

  // Reset value when modal opens or type changes
  useEffect(() => {
    if (showProductionModal) {
      // Valores por defeito inteligentes para facilitar o ajuste
      setProductionValue(productionType === 'milk' ? 25 : animal.weight || 500);
    }
  }, [showProductionModal, productionType, animal.weight]);

  const handleSave = () => {
    if (productionValue <= 0) return;
    onAddProduction(animal.id, productionValue, productionType);
    setShowProductionModal(false);
  };

  const adjustValue = (delta: number) => {
    setProductionValue(prev => {
      const newVal = prev + delta;
      return Math.max(0, parseFloat(newVal.toFixed(1))); // Evitar negativos e erros de float
    });
  };

  // Configurações baseadas no tipo
  const config = productionType === 'milk' 
    ? { step: 0.5, max: 60, unit: 'L', label: 'Litros' } 
    : { step: 1, max: 1200, unit: 'kg', label: 'Kg' };

  return (
    <div className="animate-slide-up relative pb-20">
      
      {/* Header do Card */}
      <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-6 shadow-xl border border-gray-100 dark:border-neutral-800 relative overflow-hidden">
        {/* Background Decorativo */}
        <Heart className="absolute -top-6 -right-6 text-red-50 dark:text-red-900/10 w-48 h-48 opacity-50" fill="currentColor" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-2">
            <div>
               <p className="text-sm font-mono text-gray-400 font-bold tracking-wider mb-1">{animal.tagId}</p>
               <h2 className="text-4xl font-black italic text-gray-900 dark:text-white">{animal.name}</h2>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
              animal.status === 'healthy' 
                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' 
                : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
            }`}>
              {animal.status === 'healthy' ? 'Saudável' : 'Atenção Veterinária'}
            </div>
          </div>

          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 flex items-center gap-2">
            <ShieldCheck size={14} className="text-agro-green" /> 
            {animal.breed} • {animal.age}
          </p>

          {/* Biometria */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-3xl">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <Beef size={16} /> <span className="text-xs font-bold uppercase">Peso Atual</span>
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{animal.weight} <span className="text-sm font-normal text-gray-400">kg</span></p>
            </div>
            <div className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-3xl">
               <div className="flex items-center gap-2 text-gray-400 mb-1">
                <History size={16} /> <span className="text-xs font-bold uppercase">Checkup</span>
              </div>
              <p className="text-lg font-bold text-gray-800 dark:text-white">{animal.lastCheckup}</p>
            </div>
          </div>

          {/* Secção de Gráficos (Alternável) */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex bg-gray-100 dark:bg-neutral-800 p-1 rounded-xl">
                 <button 
                   onClick={() => setChartMode('production')}
                   className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartMode === 'production' ? 'bg-white dark:bg-neutral-700 shadow text-agro-green' : 'text-gray-400'}`}
                 >
                   Produção
                 </button>
                 <button 
                   onClick={() => setChartMode('finance')}
                   className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartMode === 'finance' ? 'bg-white dark:bg-neutral-700 shadow text-agro-green' : 'text-gray-400'}`}
                 >
                   Lucro (€)
                 </button>
              </div>
              <span className="text-xs text-gray-400 font-bold">{chartMode === 'production' ? '7 Dias' : 'Acumulado'}</span>
            </div>

            <div className="h-48 w-full bg-gradient-to-b from-gray-50 to-white dark:from-neutral-800/50 dark:to-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-2 relative overflow-hidden">
               {chartMode === 'production' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3E6837" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3E6837" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Tooltip 
                        contentStyle={{ borderRadius: '1rem', border: 'none', background: 'rgba(255,255,255,0.9)' }}
                        itemStyle={{ color: '#3E6837', fontWeight: 'bold' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3E6837" 
                        fillOpacity={1} 
                        fill="url(#colorProd)" 
                        strokeWidth={3} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
               ) : (
                  <div className="h-full flex flex-col justify-center px-4 animate-fade-in">
                      <div className="flex items-center justify-between mb-4">
                         <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Resultado Líquido</p>
                            <h3 className={`text-3xl font-black ${animalFinance.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {animalFinance.profit >= 0 ? '+' : ''}{animalFinance.profit.toFixed(0)}€
                            </h3>
                         </div>
                         <div className={`p-3 rounded-full ${animalFinance.profit >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                            <Coins size={24} />
                         </div>
                      </div>
                      
                      {/* Mini Bar Breakdown */}
                      <div className="space-y-2">
                         <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-gray-500 flex items-center gap-1"><ArrowUpRight size={12}/> Receita Gerada</span>
                            <span className="font-bold text-gray-900 dark:text-white">{animalFinance.totalRevenue.toFixed(0)}€</span>
                         </div>
                         <div className="w-full bg-gray-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full rounded-full" style={{width: '100%'}}></div>
                         </div>

                         <div className="flex justify-between items-center text-xs mt-2">
                            <span className="font-bold text-gray-500 flex items-center gap-1"><ArrowDownRight size={12}/> Custo Estimado</span>
                            <span className="font-bold text-gray-900 dark:text-white">{animalFinance.expenses.toFixed(0)}€</span>
                         </div>
                         <div className="w-full bg-gray-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-red-500 h-full rounded-full" style={{width: `${Math.min((animalFinance.expenses / animalFinance.totalRevenue) * 100, 100)}%`}}></div>
                         </div>
                      </div>
                  </div>
               )}
            </div>
          </div>

          {/* Notas */}
          {animal.notes && (
            <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-2xl border border-yellow-100 dark:border-yellow-900/30 mb-6">
              <h4 className="text-xs font-bold uppercase text-yellow-700 dark:text-yellow-500 mb-1">Nota Veterinária</h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-200/80 italic">"{animal.notes}"</p>
            </div>
          )}

          {/* Botões de Ação - Layout Horizontal */}
          <div className="flex gap-3 mt-4">
            <button 
              onClick={() => setShowProductionModal(true)}
              className="flex-1 py-4 bg-agro-green hover:bg-green-700 text-white rounded-[2rem] font-bold shadow-lg shadow-agro-green/40 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Registar Produção
            </button>

            <button 
              onClick={onReset}
              className="w-20 bg-gray-100 dark:bg-neutral-800 border-2 border-transparent hover:border-gray-200 dark:hover:border-neutral-700 text-gray-600 dark:text-gray-400 rounded-[2rem] font-bold active:scale-95 transition-all flex items-center justify-center shadow-sm"
              title="Nova Leitura"
            >
              <Scan size={24} />
            </button>
          </div>

        </div>
      </div>

      {/* Modal Bottom Sheet: Registar Produção */}
      {showProductionModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowProductionModal(false)}>
          <div 
            className="bg-white dark:bg-neutral-900 w-full max-w-md p-6 rounded-t-[2.5rem] shadow-2xl animate-slide-up border-t border-white/20" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold dark:text-white">Novo Registo</h3>
              <button onClick={() => setShowProductionModal(false)} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                <X size={20} className="dark:text-white" />
              </button>
            </div>

            {/* Selector de Tipo */}
            <div className="flex bg-gray-100 dark:bg-neutral-800 p-1.5 rounded-2xl mb-6">
              <button 
                onClick={() => setProductionType('milk')}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                  productionType === 'milk' 
                    ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                    : 'text-gray-400'
                }`}
              >
                <Milk size={18} /> Leite
              </button>
              <button 
                onClick={() => setProductionType('weight')}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                  productionType === 'weight' 
                    ? 'bg-white dark:bg-neutral-700 text-orange-600 dark:text-orange-400 shadow-sm' 
                    : 'text-gray-400'
                }`}
              >
                <Beef size={18} /> Peso
              </button>
            </div>

            {/* CONTROLOS TÁTEIS GRANDES */}
            <div className="mb-8">
              <div className="flex items-center justify-between gap-4 mb-4">
                {/* Botão Menos */}
                <button 
                  onClick={() => adjustValue(-config.step)}
                  className="w-20 h-20 bg-gray-100 dark:bg-neutral-800 rounded-3xl flex items-center justify-center text-gray-500 active:scale-90 transition-all shadow-sm border border-gray-200 dark:border-neutral-700"
                >
                  <Minus size={32} strokeWidth={3} />
                </button>

                {/* Valor Central */}
                <div className="flex-1 text-center">
                  <div className="text-6xl font-black text-gray-900 dark:text-white tracking-tighter">
                    {productionValue}
                  </div>
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{config.label}</span>
                </div>

                {/* Botão Mais */}
                <button 
                  onClick={() => adjustValue(config.step)}
                  className="w-20 h-20 bg-agro-green rounded-3xl flex items-center justify-center text-white active:scale-90 transition-all shadow-lg shadow-agro-green/30"
                >
                  <Plus size={32} strokeWidth={3} />
                </button>
              </div>

              {/* Slider Tátil */}
              <div className="px-2">
                <input 
                  type="range" 
                  min="0" 
                  max={config.max} 
                  step={config.step}
                  value={productionValue}
                  onChange={(e) => setProductionValue(parseFloat(e.target.value))}
                  className="w-full h-4 bg-gray-200 dark:bg-neutral-800 rounded-full appearance-none cursor-pointer accent-agro-green touch-pan-y"
                />
                <div className="flex justify-between text-xs font-bold text-gray-400 mt-2 px-1">
                  <span>0 {config.unit}</span>
                  <span>{config.max / 2} {config.unit}</span>
                  <span>{config.max} {config.unit}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleSave}
              className="w-full py-5 bg-agro-green text-white rounded-[1.5rem] font-bold text-xl shadow-xl active:scale-95 transition-transform"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AnimalCard;
