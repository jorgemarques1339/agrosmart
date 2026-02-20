
import React, { useState, useMemo, useEffect } from 'react';
import {
  Heart, ShieldCheck, Activity, TrendingUp, History,
  Plus, X, Milk, Beef, Scan, Loader2, Minus, Coins, ArrowUpRight, ArrowDownRight,
  Signal, Smartphone, Tag, RefreshCw, Save, ClipboardList, Syringe, Calendar, Dna,
  Wifi, Radio, ChevronRight
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { Animal, AnimalBatch } from '../types';
import AnimalDetailsModal from './AnimalDetailsModal';
import clsx from 'clsx';
import { haptics } from '../utils/haptics';
import { useStore } from '../store/useStore';

// --- Sub-Component: Animal Profile (O Card Visual do Animal) ---
const AnimalProfile = ({
  animal,
  onReset,
  onAddProduction,
  onUpdateAnimal,
  onScheduleTask,
  onAddOffspring
}: {
  animal: Animal,
  onReset: () => void,
  onAddProduction: (id: string, value: number, type: 'milk' | 'weight') => void,
  onUpdateAnimal: (id: string, updates: Partial<Animal>) => void,
  onScheduleTask?: (title: string, type: 'task', date: string) => void,
  onAddOffspring: (animal: Omit<Animal, 'id'>) => void;
}) => {
  const { setChildModalOpen } = useStore();
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [showVetModal, setShowVetModal] = useState(false);
  const [showReproductionModal, setShowReproductionModal] = useState(false); // New Modal State

  // Vet Modal State
  const [vetNote, setVetNote] = useState('');
  const [vaccineDate, setVaccineDate] = useState('');

  const [productionType, setProductionType] = useState<'milk' | 'weight'>('milk');
  const [productionValue, setProductionValue] = useState<number>(0);
  const [chartMode, setChartMode] = useState<'production' | 'finance'>('production');
  const [isScanningNFC, setIsScanningNFC] = useState(false);

  // Atualizar estado global de modal aberto (para esconder nav)
  useEffect(() => {
    setChildModalOpen(showProductionModal || showVetModal || showReproductionModal);
    return () => setChildModalOpen(false);
  }, [showProductionModal, showVetModal, showReproductionModal, setChildModalOpen]);

  const chartData = useMemo(() => {
    const milkCount = animal.productionHistory.filter(r => r.type === 'milk').length;
    const weightCount = animal.productionHistory.filter(r => r.type === 'weight').length;
    const activeType = weightCount > milkCount ? 'weight' : 'milk';

    return animal.productionHistory
      .filter(r => r.type === activeType)
      .slice(-7);
  }, [animal.productionHistory]);

  const animalFinance = useMemo(() => {
    const PRICE_MILK = 0.45;
    const PRICE_MEAT = 2.80;
    const COST_FEED_DAY = 3.50;

    const revenue = animal.productionHistory.reduce((acc, rec) => {
      const value = rec.type === 'milk' ? rec.value * PRICE_MILK : 0;
      return acc + value;
    }, 0);

    const weightGainValue = animal.productionHistory
      .filter(r => r.type === 'weight')
      .reduce((acc, r, idx, arr) => {
        if (idx === 0) return 0;
        const gain = r.value - arr[idx - 1].value;
        return acc + (gain > 0 ? gain * PRICE_MEAT : 0);
      }, 0);

    const totalRevenue = revenue + weightGainValue;
    const estimatedDays = animal.productionHistory.length * 7;
    let expenses = estimatedDays * COST_FEED_DAY;
    if (animal.status === 'sick') expenses += 150;

    const profit = totalRevenue - expenses;

    return { totalRevenue, expenses, profit };
  }, [animal]);

  useEffect(() => {
    if (showProductionModal) {
      setProductionValue(productionType === 'milk' ? 25 : animal.weight || 500);
    }
  }, [showProductionModal, productionType, animal.weight]);

  const handleSaveProduction = () => {
    if (productionValue <= 0) return;
    onAddProduction(animal.id, productionValue, productionType);
    setShowProductionModal(false);
  };

  const handleSaveVetNote = () => {
    if (!vetNote.trim()) return;

    // 1. Atualizar Nota do Animal
    if (onUpdateAnimal) {
      onUpdateAnimal(animal.id, {
        notes: vetNote,
      });
    }

    // 2. Agendar Vacinação na Oriva-Agenda (Task)
    if (vaccineDate && onScheduleTask) {
      onScheduleTask(`Vacinação: ${animal.name}`, 'task', vaccineDate);
    }

    setShowVetModal(false);
    setVetNote('');
    setVaccineDate('');
  };

  const handleNFCScan = async () => {
    if (!('NDEFReader' in window)) {
      alert("NFC não é suportado neste browser ou requer HTTPS.");
      return;
    }

    try {
      setIsScanningNFC(true);
      const ndef = new (window as any).NDEFReader();
      await ndef.scan();

      ndef.onreading = (event: any) => {
        const serialNumber = event.serialNumber;
        if (onUpdateAnimal) {
          onUpdateAnimal(animal.id, { tagId: serialNumber });
          haptics.success();
        }
        setIsScanningNFC(false);
      };
    } catch (error) {
      console.error("NFC Error:", error);
      setIsScanningNFC(false);
      alert("Falha ao iniciar scan NFC.");
    }
  };

  const adjustValue = (delta: number) => {
    setProductionValue(prev => {
      const newVal = prev + delta;
      return Math.max(0, parseFloat(newVal.toFixed(1)));
    });
  };

  const config = productionType === 'milk'
    ? { step: 0.5, max: 60, unit: 'L', label: 'Litros' }
    : { step: 1, max: 1200, unit: 'kg', label: 'Kg' };

  return (
    <div className="animate-slide-up relative pb-20 max-w-md mx-auto md:max-w-4xl">
      <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-5 shadow-xl border border-gray-100 dark:border-neutral-800 relative overflow-hidden">
        <Heart className="absolute -top-6 -right-6 text-red-50 dark:text-red-900/10 w-48 h-48 opacity-50" fill="currentColor" />

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-xs font-mono text-gray-400 font-bold tracking-wider">{animal.tagId}</p>
                <button
                  onClick={handleNFCScan}
                  disabled={isScanningNFC}
                  className={clsx(
                    "p-1.5 rounded-lg border transition-all active:scale-95",
                    isScanningNFC ? "bg-blue-500 text-white animate-pulse border-transparent" : "bg-gray-50 dark:bg-neutral-800 border-gray-100 dark:border-neutral-700 text-gray-400 hover:text-blue-500"
                  )}
                  title="Scan Earring (NFC)"
                >
                  {isScanningNFC ? <Loader2 size={12} className="animate-spin" /> : <Wifi size={12} />}
                </button>
              </div>
              <h2 className="text-3xl font-black italic text-gray-900 dark:text-white">{animal.name}</h2>
            </div>
            <div className={`px-2 py-1 rounded-full text-[10px] font-bold border ${animal.status === 'healthy'
              ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
              : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
              }`}>
              {animal.status === 'healthy' ? 'Saudável' : 'Atenção Veterinária'}
            </div>
          </div>

          <p className="text-gray-500 dark:text-gray-400 text-xs mb-4 flex items-center gap-2">
            <ShieldCheck size={12} className="text-agro-green" />
            {animal.breed} • {animal.age}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-50 dark:bg-neutral-800 p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <Beef size={14} /> <span className="text-[10px] font-bold uppercase">Peso Atual</span>
              </div>
              <p className="text-xl font-bold text-gray-800 dark:text-white">{animal.weight} <span className="text-xs font-normal text-gray-400">kg</span></p>
            </div>
            <div className="bg-gray-50 dark:bg-neutral-800 p-3 rounded-2xl">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <History size={14} /> <span className="text-[10px] font-bold uppercase">Checkup</span>
              </div>
              <p className="text-base font-bold text-gray-800 dark:text-white truncate">{animal.lastCheckup}</p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex bg-gray-100 dark:bg-neutral-800 p-1 rounded-xl">
                <button
                  onClick={() => setChartMode('production')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${chartMode === 'production' ? 'bg-white dark:bg-neutral-700 shadow text-agro-green' : 'text-gray-400'}`}
                >
                  Produção
                </button>
                <button
                  onClick={() => setChartMode('finance')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${chartMode === 'finance' ? 'bg-white dark:bg-neutral-700 shadow text-agro-green' : 'text-gray-400'}`}
                >
                  Lucro (€)
                </button>
              </div>
              <span className="text-[10px] text-gray-400 font-bold">{chartMode === 'production' ? '7 Dias' : 'Acumulado'}</span>
            </div>

            {/* Reduzido para h-32 (128px) */}
            <div className="h-32 w-full bg-gradient-to-b from-gray-50 to-white dark:from-neutral-800/50 dark:to-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800 p-2 relative overflow-hidden">
              {chartMode === 'production' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3E6837" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3E6837" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      contentStyle={{ borderRadius: '1rem', border: 'none', background: 'rgba(255,255,255,0.9)', fontSize: '12px' }}
                      itemStyle={{ color: '#3E6837', fontWeight: 'bold' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#3E6837"
                      fillOpacity={1}
                      fill="url(#colorProd)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col justify-center px-4 animate-fade-in">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Resultado Líquido</p>
                      <h3 className={`text-2xl font-black ${animalFinance.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {animalFinance.profit >= 0 ? '+' : ''}{animalFinance.profit.toFixed(0)}€
                      </h3>
                    </div>
                    <div className={`p-2 rounded-full ${animalFinance.profit >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                      <Coins size={20} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-gray-500 flex items-center gap-1"><ArrowUpRight size={10} /> Receita</span>
                      <span className="font-bold text-gray-900 dark:text-white">{animalFinance.totalRevenue.toFixed(0)}€</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {animal.notes && (
            <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-2xl border border-yellow-100 dark:border-yellow-900/30 mb-4">
              <h4 className="text-[10px] font-bold uppercase text-yellow-700 dark:text-yellow-500 mb-1 flex items-center gap-2">
                <ClipboardList size={12} /> Nota Veterinária
              </h4>
              <p className="text-xs text-yellow-800 dark:text-yellow-200/80 italic line-clamp-2">"{animal.notes}"</p>
            </div>
          )}

          {/* Action Buttons Row - Vet & Reproduction */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-4">
            <button
              onClick={() => {
                setVetNote(animal.notes || '');
                setShowVetModal(true);
              }}
              className="py-3 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-[1.5rem] font-bold shadow-sm border border-orange-200 dark:border-orange-800/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <ClipboardList size={18} /> Nota Vet.
            </button>
            <button
              onClick={() => setShowReproductionModal(true)}
              className="py-3 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-[1.5rem] font-bold shadow-sm border border-blue-200 dark:border-blue-800/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Dna size={18} /> Ciclo & Genética
            </button>
          </div>

          <div className="flex gap-3">
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

        {/* --- MODALS --- */}
        <AnimalDetailsModal
          isOpen={showReproductionModal}
          onClose={() => setShowReproductionModal(false)}
          animal={animal}
          onUpdateAnimal={onUpdateAnimal}
          onAddOffspring={onAddOffspring}
        />

        {/* Production Modal */}
        {showProductionModal && (
          <div className="fixed inset-0 z-[210] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 md:p-6" onClick={() => setShowProductionModal(false)}>
            <div
              className="bg-white dark:bg-neutral-900 w-full md:max-w-md p-6 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl animate-slide-up border-t md:border border-white/20 pb-12 md:pb-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold dark:text-white">Novo Registo</h3>
                <button onClick={() => setShowProductionModal(false)} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                  <X size={20} className="dark:text-white" />
                </button>
              </div>

              <div className="flex bg-gray-100 dark:bg-neutral-800 p-1.5 rounded-2xl mb-6">
                <button
                  onClick={() => setProductionType('milk')}
                  className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${productionType === 'milk' ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400'
                    }`}
                >
                  <Milk size={18} /> Leite
                </button>
                <button
                  onClick={() => setProductionType('weight')}
                  className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${productionType === 'weight' ? 'bg-white dark:bg-neutral-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-gray-400'
                    }`}
                >
                  <Beef size={18} /> Peso
                </button>
              </div>

              <div className="mb-8">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <button onClick={() => adjustValue(-config.step)} className="w-20 h-20 bg-gray-100 dark:bg-neutral-800 rounded-3xl flex items-center justify-center text-gray-500 active:scale-90 transition-all shadow-sm border border-gray-200 dark:border-neutral-700"><Minus size={32} strokeWidth={3} /></button>
                  <div className="flex-1 text-center">
                    <div className="text-6xl font-black text-gray-900 dark:text-white tracking-tighter">{productionValue}</div>
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{config.label}</span>
                  </div>
                  <button onClick={() => adjustValue(config.step)} className="w-20 h-20 bg-agro-green rounded-3xl flex items-center justify-center text-white active:scale-90 transition-all shadow-lg shadow-agro-green/30"><Plus size={32} strokeWidth={3} /></button>
                </div>
                <div className="px-2">
                  <input type="range" min="0" max={config.max} step={config.step} value={productionValue} onChange={(e) => setProductionValue(parseFloat(e.target.value))} className="w-full h-4 bg-gray-200 dark:bg-neutral-800 rounded-full appearance-none cursor-pointer accent-agro-green touch-pan-y" />
                </div>
              </div>

              <button onClick={handleSaveProduction} className="w-full py-5 bg-agro-green text-white rounded-[1.5rem] font-bold text-xl shadow-xl active:scale-95 transition-transform">Confirmar</button>
            </div>
          </div>
        )}

        {/* Vet Note Modal */}
        {showVetModal && (
          <div className="fixed inset-0 z-[210] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 md:p-6" onClick={() => setShowVetModal(false)}>
            <div
              className="bg-white dark:bg-neutral-900 w-full md:max-w-md p-6 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl animate-slide-up border-t md:border border-white/20 pb-12 md:pb-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                  <ClipboardList size={24} className="text-orange-500" /> Nota Veterinária
                </h3>
                <button onClick={() => setShowVetModal(false)} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                  <X size={20} className="dark:text-white" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Observações / Diagnóstico</label>
                  <textarea
                    autoFocus
                    value={vetNote}
                    onChange={(e) => setVetNote(e.target.value)}
                    className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-medium dark:text-white outline-none focus:ring-2 focus:ring-orange-500 min-h-[100px] resize-none"
                    placeholder="Ex: Animal apresenta ligeira claudicação..."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block flex items-center gap-1">
                    <Syringe size={14} /> Agendar Vacinação (Opcional)
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={vaccineDate}
                      onChange={(e) => setVaccineDate(e.target.value)}
                      className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-orange-500 min-h-[3.5rem]"
                    />
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                  </div>
                  {vaccineDate && (
                    <p className="text-[10px] text-orange-500 font-bold mt-2 ml-2 flex items-center gap-1">
                      <Calendar size={10} /> Será adicionado à Agenda
                    </p>
                  )}
                </div>

                <button
                  onClick={handleSaveVetNote}
                  disabled={!vetNote}
                  className={`w-full py-5 rounded-[1.5rem] font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 ${!vetNote ? 'bg-gray-300 dark:bg-neutral-800 text-gray-500 cursor-not-allowed' : 'bg-orange-500 text-white'
                    }`}
                >
                  <Save size={20} />
                  Guardar Registo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Sub-Component: Batch Card (Card para Lotes/Grupos) ---
const BatchCard = ({
  batch,
  onApplyAction
}: {
  batch: AnimalBatch,
  onApplyAction: (batchId: string, type: string, description: string) => void
}) => {
  const { setChildModalOpen } = useStore();
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('Vacinação');
  const [actionDesc, setActionDesc] = useState('');

  useEffect(() => {
    setChildModalOpen(showActionModal);
  }, [showActionModal, setChildModalOpen]);

  const handleConfirm = () => {
    onApplyAction(batch.id, actionType, actionDesc);
    setShowActionModal(false);
    setActionDesc('');
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 shadow-lg border border-gray-100 dark:border-neutral-800 animate-slide-up">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white">{batch.name}</h3>
          <p className="text-[10px] font-bold text-agro-green uppercase tracking-widest">{batch.species}</p>
        </div>
        <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black border border-indigo-100 dark:border-indigo-800">
          {batch.animalCount} CABEÇAS
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 dark:bg-neutral-800 p-3 rounded-2xl">
          <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Peso Médio</p>
          <p className="text-lg font-bold text-gray-800 dark:text-white">{batch.averageWeight} kg</p>
        </div>
        <div className="bg-gray-50 dark:bg-neutral-800 p-3 rounded-2xl">
          <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Último Checkup</p>
          <p className="text-base font-bold text-gray-800 dark:text-white truncate">{batch.lastCheckup}</p>
        </div>
      </div>

      <button
        onClick={() => setShowActionModal(true)}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-indigo-200 dark:shadow-none"
      >
        <Syringe size={14} />
        Ação em Massa
      </button>

      {/* Mass Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowActionModal(false)}>
          <div className="bg-white dark:bg-neutral-900 w-full max-w-sm p-6 rounded-[2.5rem] shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold dark:text-white">Ação em Massa</h3>
              <button onClick={() => setShowActionModal(false)} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full"><X size={20} className="dark:text-white" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">Tipo de Ação</label>
                <select
                  value={actionType}
                  onChange={e => setActionType(e.target.value)}
                  className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option>Vacinação</option>
                  <option>Desparasitação</option>
                  <option>Pesagem Média</option>
                  <option>Movimentação</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">Detalhes</label>
                <textarea
                  value={actionDesc}
                  onChange={e => setActionDesc(e.target.value)}
                  className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-medium dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                  placeholder="Ex: Vacina Febre Aftosa - Todo o lote"
                />
              </div>
              <button
                onClick={handleConfirm}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-transform"
              >
                Confirmar p/ {batch.animalCount} Animais
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Export: AnimalCard Manager (Handles Scan, Add, and Profile) ---
interface AnimalCardManagerProps {
  animals?: Animal[];
  animalBatches?: AnimalBatch[];
  animal?: Animal; // Optional direct animal prop for direct view
  onAddAnimal?: (animal: Omit<Animal, 'id'>) => void;
  onAddProduction?: (id: string, value: number, type: 'milk' | 'weight') => void;
  onUpdateAnimal?: (id: string, updates: Partial<Animal>) => void;
  onScheduleTask?: (title: string, type: 'task', date: string) => void;
  onReset?: () => void;
  onApplyBatchAction?: (batchId: string, type: string, description: string) => void;
  onAddAnimalBatch?: (batch: AnimalBatch) => void;
}

const AnimalCard: React.FC<AnimalCardManagerProps> = ({
  animals = [],
  animalBatches = [],
  animal: propAnimal,
  onAddAnimal,
  onAddProduction,
  onUpdateAnimal: propOnUpdateAnimal,
  onScheduleTask,
  onReset: propOnReset,
  onApplyBatchAction,
  onAddAnimalBatch
}) => {
  const { setChildModalOpen } = useStore();
  const [viewState, setViewState] = useState<'scanning' | 'loading' | 'profile' | 'add_tag' | 'batches'>('scanning');
  const [foundAnimal, setFoundAnimal] = useState<Animal | null>(null);
  const [activeTab, setActiveTab] = useState<'individual' | 'batch'>('individual');

  // Batch Form State
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [batchForm, setBatchForm] = useState({
    name: '',
    species: '',
    count: '0',
    weight: '0'
  });

  // Form State
  const [tagForm, setTagForm] = useState({
    name: '',
    tagId: '',
    breed: '',
    age: '',
    weight: '',
    notes: ''
  });
  const [isScanningTag, setIsScanningTag] = useState(false);

  // If a specific animal is passed via props, use it and show profile immediately
  useEffect(() => {
    if (propAnimal) {
      setFoundAnimal(propAnimal);
      setViewState('profile');
    }
  }, [propAnimal]);

  // Report modal state changes
  useEffect(() => {
    if (viewState === 'add_tag' || showAddBatchModal) {
      setChildModalOpen(true);
    } else if (viewState !== 'profile') {
      // When not adding tag/batch and not in profile (which has its own modals), report false
      setChildModalOpen(false);
    }
  }, [viewState, showAddBatchModal, setChildModalOpen]);

  const activeAnimal = foundAnimal || propAnimal;

  // --- Handlers ---
  const startScan = () => {
    setViewState('loading');
    setTimeout(() => {
      // Simulate finding an animal
      const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
      setFoundAnimal(randomAnimal);
      setViewState('profile');
    }, 2500);
  };

  const handleReset = () => {
    setFoundAnimal(null);
    setViewState('scanning');
    if (propOnReset) propOnReset();
  };

  const startNfcScanForForm = () => {
    setIsScanningTag(true);
    setTimeout(() => {
      setTagForm(prev => ({ ...prev, tagId: `PT-${Math.floor(Math.random() * 89999) + 10000}` }));
      setIsScanningTag(false);
    }, 2000);
  };

  const handleSaveTag = () => {
    if (tagForm.name && tagForm.tagId && tagForm.breed && onAddAnimal) {
      onAddAnimal({
        tagId: tagForm.tagId,
        name: tagForm.name,
        breed: tagForm.breed,
        birthDate: new Date().toISOString().split('T')[0],
        age: tagForm.age ? `${tagForm.age} Anos` : 'N/A',
        weight: parseFloat(tagForm.weight) || 0,
        status: 'healthy',
        lastCheckup: new Date().toISOString().split('T')[0],
        notes: tagForm.notes,
        productionHistory: [],
        reproductionStatus: 'empty', // Default
        lineage: {}
      });
      // Reset
      setTagForm({ name: '', tagId: '', breed: '', age: '', weight: '', notes: '' });
      setViewState('scanning');
    }
  };

  // Wrapper for onUpdateAnimal to support adding offspring which is a special case
  const handleUpdateAnimal = (id: string, updates: Partial<Animal>) => {
    if (propOnUpdateAnimal) {
      propOnUpdateAnimal(id, updates);
    }
  };

  // Wrapper for adding offspring (calf)
  const handleAddOffspring = (calf: Omit<Animal, 'id'>) => {
    if (onAddAnimal) {
      onAddAnimal(calf);
    }
  };

  const handleCreateBatch = () => {
    if (batchForm.name && batchForm.species && onAddAnimalBatch) {
      onAddAnimalBatch({
        id: `batch-${Date.now()}`,
        name: batchForm.name,
        species: batchForm.species,
        animalCount: parseInt(batchForm.count) || 0,
        averageWeight: parseFloat(batchForm.weight) || 0,
        status: 'healthy',
        productionHistory: [],
        history: [],
        lastCheckup: new Date().toISOString().split('T')[0]
      });
      setBatchForm({ name: '', species: '', count: '0', weight: '0' });
      setShowAddBatchModal(false);
    }
  };

  // --- Renders ---

  // 1. FORMULÁRIO "ADICIONAR NOVA TAG"
  if (viewState === 'add_tag') {
    return (
      <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-6" onClick={() => setViewState('scanning')}>
        <div
          className="bg-white dark:bg-neutral-900 w-full md:max-w-2xl h-[92vh] md:h-auto md:max-h-[85vh] flex flex-col animate-slide-up p-6 overflow-y-auto rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl border-t md:border border-white/20 pb-12 md:pb-8"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white">Nova Tag</h2>
              <p className="text-sm text-gray-500">Registo de Animal</p>
            </div>
            <button
              onClick={() => setViewState('scanning')}
              className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full"
            >
              <X size={24} className="dark:text-white" />
            </button>
          </div>

          <div className="space-y-6 pb-20">
            {/* Nome / Descrição */}
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Descrição / Nome</label>
              <input
                value={tagForm.name}
                onChange={e => setTagForm({ ...tagForm, name: e.target.value })}
                className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                placeholder="Ex: Malhada 01"
              />
            </div>

            {/* NFC Scan Button Area */}
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Identificação Eletrónica</label>
              <div className={`p-1 rounded-2xl border-2 transition-all ${tagForm.tagId ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-dashed border-gray-300 dark:border-neutral-700'}`}>
                {tagForm.tagId ? (
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600">
                        <Tag size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Tag Lida</p>
                        <p className="text-lg font-black text-green-700 dark:text-green-400">{tagForm.tagId}</p>
                      </div>
                    </div>
                    <button onClick={startNfcScanForForm} className="p-2 text-gray-400 hover:text-gray-600">
                      <RefreshCw size={18} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={startNfcScanForForm}
                    disabled={isScanningTag}
                    className="w-full py-6 flex flex-col items-center justify-center gap-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                  >
                    {isScanningTag ? (
                      <>
                        <Loader2 size={24} className="animate-spin text-agro-green" />
                        <span className="text-sm font-bold text-agro-green">Aproximar Tag...</span>
                      </>
                    ) : (
                      <>
                        <Signal size={24} />
                        <span className="text-sm font-bold">Toque para Ler NFC</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Tipo e Idade Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Tipo de Animal</label>
                <input
                  value={tagForm.breed}
                  onChange={e => setTagForm({ ...tagForm, breed: e.target.value })}
                  className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                  placeholder="Ex: Vaca"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Idade (Anos)</label>
                <input
                  type="number"
                  value={tagForm.age}
                  onChange={e => setTagForm({ ...tagForm, age: e.target.value })}
                  className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Peso e Nota */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Peso (Kg)</label>
                <input
                  type="number"
                  value={tagForm.weight}
                  onChange={e => setTagForm({ ...tagForm, weight: e.target.value })}
                  className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Nota (Opcional)</label>
                <input
                  value={tagForm.notes}
                  onChange={e => setTagForm({ ...tagForm, notes: e.target.value })}
                  className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                  placeholder="..."
                />
              </div>
            </div>

            <button
              onClick={handleSaveTag}
              disabled={!tagForm.name || !tagForm.tagId || !tagForm.breed}
              className={`w-full py-5 rounded-[1.5rem] font-bold text-xl shadow-lg flex items-center justify-center gap-2 mt-4 transition-all ${!tagForm.name || !tagForm.tagId || !tagForm.breed
                ? 'bg-gray-300 dark:bg-neutral-800 text-gray-500 cursor-not-allowed'
                : 'bg-agro-green text-white active:scale-95 shadow-agro-green/30'
                }`}
            >
              <Save size={24} />
              Guardar Animal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. MODO PERFIL (Se animal encontrado)
  if (activeAnimal && viewState === 'profile') {
    return (
      <AnimalProfile
        animal={activeAnimal}
        onReset={handleReset}
        onAddProduction={onAddProduction || (() => { })}
        onUpdateAnimal={handleUpdateAnimal}
        onScheduleTask={onScheduleTask}
        onAddOffspring={handleAddOffspring}
      />
    );
  }

  // 2.5 MODO LOTES (Listagem de Grupos)
  if (viewState === 'batches') {
    return (
      <div className="h-full flex flex-col bg-gray-50 dark:bg-black p-6 animate-fade-in relative pb-24 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white">Lotes de Animais</h2>
            <p className="text-sm font-bold text-gray-400 uppercase">Gestão Coletiva</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddBatchModal(true)}
              className="p-3 bg-white dark:bg-neutral-800 rounded-full shadow-sm text-indigo-600 active:scale-95 transition-transform"
            >
              <Plus size={24} />
            </button>
            <button
              onClick={() => setViewState('scanning')}
              className="p-3 bg-white dark:bg-neutral-800 rounded-full shadow-sm"
            >
              <Scan size={24} className="text-agro-green" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {animalBatches.map(batch => (
            <BatchCard
              key={batch.id}
              batch={batch}
              onApplyAction={onApplyBatchAction || (() => { })}
            />
          ))}

          {animalBatches.length === 0 && (
            <div className="text-center py-20 opacity-50">
              <ClipboardList size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="font-bold text-gray-400">Nenhum lote registado.</p>
            </div>
          )}
        </div>

        {/* Create Batch Modal */}
        {showAddBatchModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowAddBatchModal(false)}>
            <div className="bg-white dark:bg-neutral-900 w-full max-w-sm p-6 rounded-[2.5rem] shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold dark:text-white">Novo Lote</h3>
                <button onClick={() => setShowAddBatchModal(false)} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full"><X size={20} className="dark:text-white" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">Nome do Lote</label>
                  <input
                    value={batchForm.name}
                    onChange={e => setBatchForm({ ...batchForm, name: e.target.value })}
                    className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ex: Lote Ovelhas Sul"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">Espécie</label>
                  <input
                    value={batchForm.species}
                    onChange={e => setBatchForm({ ...batchForm, species: e.target.value })}
                    className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ex: Ovinos"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">Qt. Animais</label>
                    <input
                      type="number"
                      value={batchForm.count}
                      onChange={e => setBatchForm({ ...batchForm, count: e.target.value })}
                      className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">Peso Médio (kg)</label>
                    <input
                      type="number"
                      value={batchForm.weight}
                      onChange={e => setBatchForm({ ...batchForm, weight: e.target.value })}
                      className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCreateBatch}
                  disabled={!batchForm.name || !batchForm.species}
                  className={`w-full py-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-transform mt-2 ${!batchForm.name || !batchForm.species
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white'
                    }`}
                >
                  Criar Lote
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. MODO SCANNING (Modern Redesign)
  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-[#FDFDF5] dark:bg-black animate-fade-in">

      {/* Background Ambient Effect - Optimized for mobile performance */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[50%] bg-green-400/10 rounded-full blur-[100px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[50%] bg-blue-400/10 rounded-full blur-[100px] animate-pulse-slow delay-1000"></div>
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-between h-full pt-12 pb-8 px-6 max-w-md mx-auto w-full md:max-w-2xl md:justify-center md:gap-12">

        {/* Header Text */}
        <div className="text-center space-y-2 animate-slide-down">
          {/* View Toggle */}
          <div className="flex bg-white/50 dark:bg-white/5 backdrop-blur-md p-1 rounded-2xl mb-8 shadow-sm border border-white/40 dark:border-white/10 w-fit mx-auto">
            <button
              onClick={() => setActiveTab('individual')}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'individual' ? 'bg-agro-green text-white shadow-md' : 'text-gray-500'}`}
            >
              INDIVIDUAL
            </button>
            <button
              onClick={() => {
                setActiveTab('batch');
                setViewState('batches');
              }}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'batch' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500'}`}
            >
              LOTES
            </button>
          </div>

          <div className="inline-flex items-center justify-center p-3 bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-2xl mb-4 shadow-sm border border-white/40 dark:border-white/10">
            <Smartphone size={24} className="text-gray-900 dark:text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">
            {activeTab === 'individual' ? 'Identificação' : 'Gestão de Lotes'}
          </h2>
          <p className="text-sm md:text-base font-medium text-gray-500 dark:text-gray-400 max-w-[260px] mx-auto leading-relaxed">
            {activeTab === 'individual'
              ? 'Aproxime o telemóvel da etiqueta eletrónica ou auricular.'
              : 'Faça a gestão massiva de grandes rebanhos ou manadas.'}
          </p>
        </div>

        {/* Main Interactive Scanner Area */}
        <div className="relative flex-1 flex items-center justify-center w-full" onClick={viewState === 'scanning' ? startScan : undefined}>

          {/* Expanding Rings (Sonar) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Ring 1 */}
            <div className={`absolute border-2 border-agro-green/20 rounded-full transition-all duration-[2000ms] ease-out ${viewState === 'loading' ? 'w-[100%] h-[100%] opacity-0' : 'w-48 h-48 md:w-64 md:h-64 opacity-20 scale-90'}`}></div>
            {/* Ring 2 */}
            <div className={`absolute border border-agro-green/30 rounded-full transition-all duration-[2000ms] delay-150 ease-out ${viewState === 'loading' ? 'w-[80%] h-[80%] opacity-0' : 'w-36 h-36 md:w-52 md:h-52 opacity-30 scale-90'}`}></div>
            {/* Ring 3 */}
            <div className={`absolute border border-agro-green/10 rounded-full transition-all duration-[2000ms] delay-300 ease-out ${viewState === 'loading' ? 'w-[60%] h-[60%] opacity-0' : 'w-60 h-60 md:w-80 md:h-80 opacity-10 scale-90'}`}></div>
          </div>

          {/* Central Button */}
          <div className={`relative w-48 h-48 md:w-56 md:h-56 rounded-full flex flex-col items-center justify-center transition-all duration-500 cursor-pointer group active:scale-95 z-20 ${viewState === 'loading'
            ? 'bg-agro-green shadow-[0_0_80px_rgba(74,222,128,0.5)] scale-105'
            : 'bg-gradient-to-b from-white to-gray-50 dark:from-neutral-800 dark:to-neutral-900 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/60 dark:border-white/5'
            }`}>

            {/* Inner Glow/Gradient Border */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/80 to-transparent opacity-50 pointer-events-none"></div>

            <div className={`transition-all duration-500 flex flex-col items-center gap-4 ${viewState === 'loading' ? 'text-white scale-110' : 'text-gray-400 dark:text-gray-500 group-hover:text-agro-green'}`}>
              {viewState === 'loading' ? (
                <>
                  <Loader2 size={56} className="animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest animate-pulse">Lendo Tag...</span>
                </>
              ) : (
                <>
                  <div className="relative">
                    <Wifi size={64} strokeWidth={1.5} className="opacity-80" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-agro-green rounded-full animate-ping"></div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-agro-green rounded-full border-2 border-white dark:border-neutral-900"></div>
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">Tocar para Ler</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="w-full space-y-4 animate-slide-up delay-200">

          {/* Divider with Text */}
          <div className="flex items-center gap-4 opacity-30">
            <div className="h-px flex-1 bg-gray-400"></div>
            <span className="text-[10px] font-bold uppercase text-gray-500">Ou</span>
            <div className="h-px flex-1 bg-gray-400"></div>
          </div>

          {/* Manual Entry Button */}
          <button
            onClick={() => setViewState('add_tag')}
            className="w-full py-4 bg-white dark:bg-neutral-800 rounded-3xl border border-gray-100 dark:border-neutral-700 shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all group hover:border-agro-green/30"
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center text-gray-500 group-hover:bg-agro-green group-hover:text-white transition-colors">
              <Plus size={16} strokeWidth={3} />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-900 dark:text-white">Adicionar Nova Tag</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Sem NFC? Digite o código</p>
            </div>
            <div className="ml-auto pr-4 text-gray-300 group-hover:text-agro-green transition-colors">
              <ArrowDownRight size={20} />
            </div>
          </button>
        </div>

      </div>
    </div>
  );
};

export default AnimalCard;
