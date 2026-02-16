
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Heart, ShieldCheck, Activity, TrendingUp, History, 
  Plus, X, Milk, Beef, Scan, Loader2, Minus, Coins, ArrowUpRight, ArrowDownRight,
  Signal, Smartphone, Tag, RefreshCw, Save, ClipboardList, Syringe, Calendar, Dna
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { Animal } from '../types';
import AnimalDetailsModal from './AnimalDetailsModal';

// --- Sub-Component: Animal Profile (O Card Visual do Animal) ---
const AnimalProfile = ({ 
  animal, 
  onReset, 
  onAddProduction,
  onUpdateAnimal,
  onScheduleTask,
  onAddOffspring,
  onModalChange
}: { 
  animal: Animal, 
  onReset: () => void, 
  onAddProduction: (id: string, value: number, type: 'milk' | 'weight') => void,
  onUpdateAnimal: (id: string, updates: Partial<Animal>) => void,
  onScheduleTask?: (title: string, type: 'task', date: string) => void,
  onAddOffspring: (animal: Omit<Animal, 'id'>) => void,
  onModalChange?: (isOpen: boolean) => void;
}) => {
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [showVetModal, setShowVetModal] = useState(false);
  const [showReproductionModal, setShowReproductionModal] = useState(false); // New Modal State
  
  // Vet Modal State
  const [vetNote, setVetNote] = useState('');
  const [vaccineDate, setVaccineDate] = useState('');

  const [productionType, setProductionType] = useState<'milk' | 'weight'>('milk');
  const [productionValue, setProductionValue] = useState<number>(0);
  const [chartMode, setChartMode] = useState<'production' | 'finance'>('production');

  // Report modal state changes
  useEffect(() => {
    if (onModalChange) {
      onModalChange(showProductionModal || showVetModal || showReproductionModal);
    }
  }, [showProductionModal, showVetModal, showReproductionModal, onModalChange]);

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
          const gain = r.value - arr[idx-1].value;
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
    <div className="animate-slide-up relative pb-20">
      <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-5 shadow-xl border border-gray-100 dark:border-neutral-800 relative overflow-hidden">
        <Heart className="absolute -top-6 -right-6 text-red-50 dark:text-red-900/10 w-48 h-48 opacity-50" fill="currentColor" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-2">
            <div>
               <p className="text-xs font-mono text-gray-400 font-bold tracking-wider mb-0.5">{animal.tagId}</p>
               <h2 className="text-3xl font-black italic text-gray-900 dark:text-white">{animal.name}</h2>
            </div>
            <div className={`px-2 py-1 rounded-full text-[10px] font-bold border ${
              animal.status === 'healthy' 
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

          <div className="grid grid-cols-2 gap-3 mb-4">
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
                          <stop offset="5%" stopColor="#3E6837" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3E6837" stopOpacity={0}/>
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
                            <span className="font-bold text-gray-500 flex items-center gap-1"><ArrowUpRight size={10}/> Receita</span>
                            <span className="font-bold text-gray-900 dark:text-white">{animalFinance.totalRevenue.toFixed(0)}€</span>
                         </div>
                         <div className="w-full bg-gray-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full rounded-full" style={{width: '100%'}}></div>
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
          <div className="grid grid-cols-2 gap-3 mb-3">
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

              <div className="flex bg-gray-100 dark:bg-neutral-800 p-1.5 rounded-2xl mb-6">
                <button 
                  onClick={() => setProductionType('milk')}
                  className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                    productionType === 'milk' ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400'
                  }`}
                >
                  <Milk size={18} /> Leite
                </button>
                <button 
                  onClick={() => setProductionType('weight')}
                  className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                    productionType === 'weight' ? 'bg-white dark:bg-neutral-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-gray-400'
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
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowVetModal(false)}>
             <div 
              className="bg-white dark:bg-neutral-900 w-full max-w-md p-6 rounded-t-[2.5rem] shadow-2xl animate-slide-up border-t border-white/20" 
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
                   className={`w-full py-5 rounded-[1.5rem] font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 ${
                      !vetNote ? 'bg-gray-300 dark:bg-neutral-800 text-gray-500 cursor-not-allowed' : 'bg-orange-500 text-white'
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

// --- Main Export: AnimalCard Manager (Handles Scan, Add, and Profile) ---
interface AnimalCardManagerProps {
  animals?: Animal[];
  animal?: Animal; // Optional direct animal prop for direct view
  onAddAnimal?: (animal: Omit<Animal, 'id'>) => void;
  onAddProduction?: (id: string, value: number, type: 'milk' | 'weight') => void;
  onUpdateAnimal?: (id: string, updates: Partial<Animal>) => void;
  onScheduleTask?: (title: string, type: 'task', date: string) => void;
  onReset?: () => void;
  onModalChange?: (isOpen: boolean) => void;
}

const AnimalCard: React.FC<AnimalCardManagerProps> = ({ 
  animals = [], 
  animal: propAnimal, 
  onAddAnimal, 
  onAddProduction,
  onUpdateAnimal: propOnUpdateAnimal,
  onScheduleTask,
  onReset: propOnReset,
  onModalChange
}) => {
  const [viewState, setViewState] = useState<'scanning' | 'loading' | 'profile' | 'add_tag'>('scanning');
  const [foundAnimal, setFoundAnimal] = useState<Animal | null>(null);
  
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

  // Report add_tag state change
  useEffect(() => {
    if (onModalChange) {
      if (viewState === 'add_tag') {
        onModalChange(true);
      } else if (viewState !== 'profile') {
        // When not adding tag and not in profile (which has its own modals), report false
        onModalChange(false);
      }
    }
  }, [viewState, onModalChange]);

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

  // --- Renders ---

  // 1. FORMULÁRIO "ADICIONAR NOVA TAG"
  if (viewState === 'add_tag') {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-neutral-900 animate-slide-up p-6 overflow-y-auto rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl">
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
               onChange={e => setTagForm({...tagForm, name: e.target.value})}
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
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Tipo de Animal</label>
               <input 
                 value={tagForm.breed}
                 onChange={e => setTagForm({...tagForm, breed: e.target.value})}
                 className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                 placeholder="Ex: Vaca"
               />
             </div>
             <div>
               <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Idade (Anos)</label>
               <input 
                 type="number"
                 value={tagForm.age}
                 onChange={e => setTagForm({...tagForm, age: e.target.value})}
                 className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                 placeholder="0"
               />
             </div>
           </div>

           {/* Peso e Nota */}
           <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Peso (Kg)</label>
                 <input 
                   type="number"
                   value={tagForm.weight}
                   onChange={e => setTagForm({...tagForm, weight: e.target.value})}
                   className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                   placeholder="0"
                 />
              </div>
              <div>
                 <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Nota (Opcional)</label>
                 <input 
                   value={tagForm.notes}
                   onChange={e => setTagForm({...tagForm, notes: e.target.value})}
                   className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                   placeholder="..."
                 />
              </div>
           </div>

           <button 
             onClick={handleSaveTag}
             disabled={!tagForm.name || !tagForm.tagId || !tagForm.breed}
             className={`w-full py-5 rounded-[1.5rem] font-bold text-xl shadow-lg flex items-center justify-center gap-2 mt-4 transition-all ${
               !tagForm.name || !tagForm.tagId || !tagForm.breed
                 ? 'bg-gray-300 dark:bg-neutral-800 text-gray-500 cursor-not-allowed'
                 : 'bg-agro-green text-white active:scale-95 shadow-agro-green/30'
             }`}
           >
             <Save size={24} />
             Guardar Animal
           </button>
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
        onAddProduction={onAddProduction || (() => {})} 
        onUpdateAnimal={handleUpdateAnimal}
        onScheduleTask={onScheduleTask}
        onAddOffspring={handleAddOffspring}
        onModalChange={onModalChange}
      />
    );
  }

  // 3. MODO SCANNING (Default)
  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0A0A0A] dark:to-[#111] animate-fade-in">
        
        {/* Background Elements */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-agro-green/5 rounded-b-[4rem] z-0"></div>
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-agro-green/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col items-center justify-center h-[75vh] px-6">
          
          {/* Main NFC Scanner Visual */}
          <div className="relative mb-12" onClick={viewState === 'scanning' ? startScan : undefined}>
             
             {/* Pulsing Rings (Only in Scanning) */}
             {viewState === 'scanning' && (
               <>
                 <div className="absolute inset-0 bg-agro-green/20 rounded-full animate-ping opacity-75"></div>
                 <div className="absolute -inset-4 bg-agro-green/10 rounded-full animate-pulse opacity-50 delay-100"></div>
                 <div className="absolute -inset-8 bg-agro-green/5 rounded-full animate-pulse-slow opacity-30 delay-200"></div>
               </>
             )}

             {/* The "Ear Tag" Metaphor Card */}
             <div className={`relative w-48 h-48 bg-gradient-to-br from-[#ffffff] to-[#f0fdf4] dark:from-[#262626] dark:to-[#1a1a1a] rounded-[2.5rem] shadow-2xl border border-white/50 dark:border-neutral-700 flex flex-col items-center justify-center transition-all duration-500 cursor-pointer ${
               viewState === 'loading' ? 'scale-95 shadow-inner border-agro-green' : 'hover:scale-105 hover:shadow-agro-green/20'
             }`}>
                
                {/* Hole of the Tag */}
                <div className="absolute top-4 w-4 h-4 bg-gray-200 dark:bg-neutral-800 rounded-full shadow-inner border border-black/5"></div>

                {viewState === 'loading' ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={48} className="text-agro-green animate-spin" />
                    <span className="text-xs font-bold text-agro-green animate-pulse">Lendo Tag...</span>
                  </div>
                ) : (
                  <>
                    <Signal size={48} className="text-agro-green mb-2 opacity-80" />
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">Oriva NFC</span>
                  </>
                )}
             </div>

             {/* Smartphone Icon Overlay (Hint) */}
             {viewState === 'scanning' && (
                <div className="absolute -bottom-4 -right-4 bg-white dark:bg-neutral-800 p-3 rounded-2xl shadow-lg border border-gray-100 dark:border-neutral-700 animate-bounce">
                   <Smartphone size={24} className="text-gray-600 dark:text-gray-300" />
                </div>
             )}
          </div>

          {/* Text Instructions */}
          <div className="text-center space-y-3 max-w-xs mx-auto">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">
              {viewState === 'loading' ? 'A Sincronizar...' : 'Identificação'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed">
              {viewState === 'loading' 
                ? 'A obter dados biométricos e histórico produtivo da cloud.' 
                : 'Aproxime o seu telemóvel do brinco eletrónico do animal para ler.'}
            </p>
          </div>

          {/* Add Tag Button (Primary Action) */}
          {viewState === 'scanning' && (
            <button 
              onClick={() => setViewState('add_tag')}
              className="mt-10 py-3 px-6 rounded-xl bg-agro-green text-white border border-transparent font-bold uppercase tracking-wider shadow-lg shadow-agro-green/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus size={18} />
              Adicionar Nova Tag
            </button>
          )}

        </div>
    </div>
  );
};

export default AnimalCard;