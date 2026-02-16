
import React, { useState, useMemo } from 'react';
import { 
  X, Baby, CalendarHeart, Dna, Timer, AlertCircle, AlertTriangle,
  HeartHandshake, ChevronRight, Activity, Calendar, Save,
  ArrowRight
} from 'lucide-react';
import { Animal } from '../types';

interface AnimalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  animal: Animal;
  onUpdateAnimal: (id: string, updates: Partial<Animal>) => void;
  onAddOffspring: (animal: Omit<Animal, 'id'>) => void;
}

const GESTATION_DAYS = 283; // Standard for cows

const AnimalDetailsModal: React.FC<AnimalDetailsModalProps> = ({
  isOpen,
  onClose,
  animal,
  onUpdateAnimal,
  onAddOffspring
}) => {
  const [subModal, setSubModal] = useState<'insemination' | 'birth' | null>(null);
  
  // Form States
  const [insemData, setInsemData] = useState({ date: new Date().toISOString().split('T')[0], bull: '' });
  const [birthData, setBirthData] = useState({ date: new Date().toISOString().split('T')[0], name: '', gender: 'female', weight: '' });

  // --- Lógica de Gestação ---
  const pregnancyData = useMemo(() => {
    if (animal.reproductionStatus !== 'pregnant' || !animal.conceptionDate) return null;

    const conception = new Date(animal.conceptionDate);
    const now = new Date();
    const dueDate = new Date(conception);
    dueDate.setDate(conception.getDate() + GESTATION_DAYS);

    const diffTime = now.getTime() - conception.getTime();
    const daysPassed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const daysLeft = GESTATION_DAYS - daysPassed;
    const progress = Math.min(100, Math.max(0, (daysPassed / GESTATION_DAYS) * 100));

    return {
      dueDate,
      daysPassed,
      daysLeft,
      progress,
      isClose: daysLeft < 15
    };
  }, [animal]);

  // --- Handlers ---
  const handleRegisterHeat = () => {
    onUpdateAnimal(animal.id, { reproductionStatus: 'heat' });
    alert("Cio registado. Alerta criado para inseminação.");
  };

  const handleRegisterInsemination = () => {
    if (!insemData.bull) return;
    
    onUpdateAnimal(animal.id, {
      reproductionStatus: 'pregnant',
      conceptionDate: insemData.date,
      lineage: {
        ...animal.lineage,
        // Mantém a mãe/pai do animal atual, adiciona nota sobre o pai do futuro vitelo nos eventos (ou estrutura complexa futura)
        notes: `Gestante de: ${insemData.bull}`
      }
    });
    setSubModal(null);
  };

  const handleRegisterBirth = () => {
    if (!birthData.name) return;

    // 1. Atualizar a Mãe
    onUpdateAnimal(animal.id, {
      reproductionStatus: 'post-partum',
      conceptionDate: undefined, // Limpar data
    });

    // 2. Criar o Vitelo
    onAddOffspring({
      tagId: `PT-${Math.floor(Math.random() * 89999) + 10000}`, // Mock Tag
      name: birthData.name,
      breed: animal.breed, // Assume mesma raça por defeito
      birthDate: birthData.date,
      age: '0 Dias',
      weight: parseFloat(birthData.weight) || 35,
      status: 'healthy',
      lastCheckup: birthData.date,
      reproductionStatus: 'empty',
      productionHistory: [],
      lineage: {
        motherId: animal.id,
        motherName: animal.name,
        fatherName: animal.lineage?.notes?.replace('Gestante de: ', '') || 'Desconhecido'
      }
    });

    setSubModal(null);
    setBirthData({ date: new Date().toISOString().split('T')[0], name: '', gender: 'female', weight: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in p-0 md:p-4">
      <div 
        className="bg-[#FDFDF5] dark:bg-[#0A0A0A] w-full md:max-w-2xl h-[92vh] md:h-auto md:max-h-[90vh] rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative border-t border-white/20 md:border md:border-white/10 transition-all"
        onClick={e => e.stopPropagation()}
      >
        
        {/* --- HEADER --- */}
        <div className="relative px-6 pt-8 pb-4 shrink-0">
           <button 
             onClick={onClose} 
             className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-neutral-800 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors active:scale-90"
           >
             <X size={20} className="dark:text-white" />
           </button>

           <div className="flex items-start gap-4 pr-10">
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner shrink-0 ${
                 animal.reproductionStatus === 'heat' ? 'bg-pink-100 text-pink-500' :
                 animal.reproductionStatus === 'pregnant' ? 'bg-green-100 text-green-600' :
                 'bg-gray-100 text-gray-400'
              }`}>
                 {animal.reproductionStatus === 'heat' ? '🔥' : animal.reproductionStatus === 'pregnant' ? '🤰' : '🐄'}
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">{animal.tagId}</p>
                 <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white leading-none truncate">{animal.name}</h2>
                 
                 {/* Status Badge */}
                 <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold bg-white dark:bg-neutral-800 shadow-sm border border-gray-100 dark:border-neutral-700">
                    <div className={`w-2 h-2 rounded-full ${
                       animal.reproductionStatus === 'heat' ? 'bg-pink-500 animate-pulse' :
                       animal.reproductionStatus === 'pregnant' ? 'bg-green-500' :
                       'bg-gray-400'
                    }`}></div>
                    <span className="uppercase text-gray-600 dark:text-gray-300 tracking-wide">
                       {animal.reproductionStatus === 'heat' ? 'Em Cio' :
                        animal.reproductionStatus === 'pregnant' ? 'Gestante' :
                        animal.reproductionStatus === 'post-partum' ? 'Pós-Parto' : 'Vazia'}
                    </span>
                 </div>
              </div>
           </div>
        </div>

        {/* --- SCROLLABLE CONTENT --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 md:px-6 pb-24 space-y-5 md:space-y-6">
           
           {/* 1. GESTATION TRACKER (If Pregnant) */}
           {pregnancyData && (
             <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 p-5 md:p-6 rounded-[2.5rem] border border-green-100 dark:border-green-900/30 relative overflow-hidden shadow-sm">
                <div className="flex justify-between items-end mb-4 relative z-10">
                   <div>
                      <p className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                         <Baby size={12} /> Previsão de Parto
                      </p>
                      <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">
                         {pregnancyData.daysLeft} <span className="text-sm font-bold text-gray-400">dias</span>
                      </h3>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Data Prevista</p>
                      <p className="text-base md:text-lg font-bold text-gray-900 dark:text-white">{pregnancyData.dueDate.toLocaleDateString('pt-PT')}</p>
                   </div>
                </div>

                {/* Progress Bar Visual */}
                <div className="relative h-5 md:h-6 bg-white dark:bg-black/20 rounded-full overflow-hidden shadow-inner border border-green-100 dark:border-green-900/30">
                   <div 
                     className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-emerald-600 rounded-full transition-all duration-1000 ease-out"
                     style={{ width: `${pregnancyData.progress}%` }}
                   >
                      <div className="absolute right-1 top-1 bottom-1 w-1 bg-white/50 rounded-full"></div>
                   </div>
                </div>
                <div className="flex justify-between mt-2 text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                   <span>Conceção</span>
                   <span>{Math.round(pregnancyData.progress)}%</span>
                   <span>Parto</span>
                </div>

                {pregnancyData.isClose && (
                   <div className="mt-4 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse border border-orange-200 dark:border-orange-800/30">
                      <AlertTriangle size={14} /> Preparar Maternidade
                   </div>
                )}
             </div>
           )}

           {/* 2. GENEALOGIA - Optimized Tree */}
           <div className="bg-white dark:bg-neutral-900 p-5 md:p-6 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-sm">
              <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
                 <Dna size={16} className="text-blue-500" /> Linhagem Genética
              </h4>
              
              <div className="relative flex justify-between items-center px-2">
                 {/* Conector Line - Perfectly Centered */}
                 <div className="absolute top-[24px] md:top-[28px] left-[15%] right-[15%] h-[2px] bg-gray-100 dark:bg-neutral-800 -z-0"></div>

                 {/* Mãe */}
                 <div className="flex flex-col items-center gap-2 z-10 w-1/3">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-50 dark:bg-neutral-800 rounded-2xl flex items-center justify-center border-2 border-white dark:border-neutral-700 shadow-sm text-lg md:text-xl">
                       🐄
                    </div>
                    <div className="text-center w-full">
                       <p className="text-[9px] font-bold uppercase text-gray-400 mb-0.5">Mãe</p>
                       <p className="text-xs font-bold dark:text-white truncate px-1">{animal.lineage?.motherName || 'N/A'}</p>
                    </div>
                 </div>

                 {/* Animal Atual */}
                 <div className="flex flex-col items-center gap-2 z-10 w-1/3 -mt-2">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-neutral-900 rounded-full flex items-center justify-center border-4 border-agro-green shadow-lg text-2xl md:text-3xl">
                       ⭐
                    </div>
                    <div className="text-center w-full">
                       <p className="text-[9px] font-bold uppercase text-agro-green mb-0.5">Atual</p>
                       <p className="text-sm font-black dark:text-white truncate px-1">{animal.name}</p>
                    </div>
                 </div>

                 {/* Pai */}
                 <div className="flex flex-col items-center gap-2 z-10 w-1/3">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-50 dark:bg-neutral-800 rounded-2xl flex items-center justify-center border-2 border-white dark:border-neutral-700 shadow-sm text-lg md:text-xl">
                       🐂
                    </div>
                    <div className="text-center w-full">
                       <p className="text-[9px] font-bold uppercase text-gray-400 mb-0.5">Pai</p>
                       <p className="text-xs font-bold dark:text-white truncate px-1">{animal.lineage?.fatherName || 'N/A'}</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* 3. AÇÕES RÁPIDAS (Grid) */}
           <div>
              <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider ml-2">Ações Reprodutivas</h4>
              <div className="grid grid-cols-2 gap-3">
                 
                 {/* Registar Cio */}
                 <button 
                   onClick={handleRegisterHeat}
                   disabled={animal.reproductionStatus === 'pregnant'}
                   className={`p-4 rounded-[2rem] border-2 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 min-h-[100px] ${
                      animal.reproductionStatus === 'pregnant' 
                        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-pink-100 bg-pink-50 dark:bg-pink-900/10 dark:border-pink-900/30 text-pink-600'
                   }`}
                 >
                    <Activity size={24} />
                    <span className="text-xs font-bold">Marcar Cio</span>
                 </button>

                 {/* Registar Inseminação */}
                 <button 
                   onClick={() => setSubModal('insemination')}
                   disabled={animal.reproductionStatus === 'pregnant'}
                   className={`p-4 rounded-[2rem] border-2 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 min-h-[100px] ${
                      animal.reproductionStatus === 'pregnant'
                        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-blue-100 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-900/30 text-blue-600'
                   }`}
                 >
                    <HeartHandshake size={24} />
                    <span className="text-xs font-bold">Inseminar</span>
                 </button>

                 {/* Registar Parto (Destaque se gestante) */}
                 <button 
                   onClick={() => setSubModal('birth')}
                   disabled={animal.reproductionStatus !== 'pregnant'}
                   className={`col-span-2 p-5 rounded-[2rem] border-2 flex items-center justify-center gap-3 transition-all active:scale-95 shadow-sm min-h-[80px] ${
                      animal.reproductionStatus === 'pregnant'
                        ? 'bg-agro-green border-agro-green text-white shadow-agro-green/30'
                        : 'bg-gray-100 dark:bg-neutral-800 border-transparent text-gray-400 cursor-not-allowed'
                   }`}
                 >
                    <Baby size={24} />
                    <span className="text-base font-bold">Registar Nascimento</span>
                 </button>
              </div>
           </div>

        </div>

        {/* --- SUB-MODALS (INSEMINATION & BIRTH) --- */}
        
        {/* Insemination Form */}
        {subModal === 'insemination' && (
           <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 rounded-t-[2.5rem] p-6 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] animate-slide-up border-t border-gray-100 dark:border-neutral-800 z-50">
              <div className="w-12 h-1 bg-gray-200 dark:bg-neutral-700 rounded-full mx-auto mb-6"></div>
              <h3 className="text-xl font-bold dark:text-white mb-4">Nova Inseminação</h3>
              <div className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase ml-2 mb-1 block">Touro / Código Sémen</label>
                    <input 
                      autoFocus
                      className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all border-2 border-transparent"
                      placeholder="Ex: PT-5502"
                      value={insemData.bull}
                      onChange={e => setInsemData({...insemData, bull: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase ml-2 mb-1 block">Data</label>
                    <input 
                      type="date"
                      className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none min-h-[3.5rem]"
                      value={insemData.date}
                      onChange={e => setInsemData({...insemData, date: e.target.value})}
                    />
                 </div>
                 <div className="flex gap-3 pt-4">
                    <button onClick={() => setSubModal(null)} className="flex-1 py-4 font-bold text-gray-500 bg-gray-100 dark:bg-neutral-800 rounded-2xl active:scale-95 transition-transform">Cancelar</button>
                    <button onClick={handleRegisterInsemination} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/30 active:scale-95 transition-transform">Confirmar</button>
                 </div>
              </div>
           </div>
        )}

        {/* Birth Form */}
        {subModal === 'birth' && (
           <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 rounded-t-[2.5rem] p-6 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] animate-slide-up border-t border-gray-100 dark:border-neutral-800 z-50">
              <div className="w-12 h-1 bg-gray-200 dark:bg-neutral-700 rounded-full mx-auto mb-6"></div>
              <h3 className="text-xl font-bold dark:text-white mb-4 flex items-center gap-2">
                 <Baby size={24} className="text-agro-green" /> Nasceu uma cria!
              </h3>
              <div className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-gray-400 uppercase ml-2 mb-1 block">Nome / Tag Provisória</label>
                    <input 
                      autoFocus
                      className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green transition-all border-2 border-transparent"
                      placeholder="Ex: Vitelo 01"
                      value={birthData.name}
                      onChange={e => setBirthData({...birthData, name: e.target.value})}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-xs font-bold text-gray-400 uppercase ml-2 mb-1 block">Peso (Kg)</label>
                       <input 
                         type="number"
                         inputMode="decimal"
                         className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none"
                         placeholder="35"
                         value={birthData.weight}
                         onChange={e => setBirthData({...birthData, weight: e.target.value})}
                       />
                    </div>
                    <div>
                       <label className="text-xs font-bold text-gray-400 uppercase ml-2 mb-1 block">Sexo</label>
                       <div className="flex bg-gray-100 dark:bg-neutral-800 rounded-2xl p-1 h-[58px]">
                          <button 
                            onClick={() => setBirthData({...birthData, gender: 'female'})}
                            className={`flex-1 rounded-xl font-bold text-sm transition-all ${birthData.gender === 'female' ? 'bg-white dark:bg-neutral-700 shadow text-pink-500' : 'text-gray-400'}`}
                          >
                             Fêmea
                          </button>
                          <button 
                            onClick={() => setBirthData({...birthData, gender: 'male'})}
                            className={`flex-1 rounded-xl font-bold text-sm transition-all ${birthData.gender === 'male' ? 'bg-white dark:bg-neutral-700 shadow text-blue-500' : 'text-gray-400'}`}
                          >
                             Macho
                          </button>
                       </div>
                    </div>
                 </div>
                 <div className="flex gap-3 pt-4">
                    <button onClick={() => setSubModal(null)} className="flex-1 py-4 font-bold text-gray-500 bg-gray-100 dark:bg-neutral-800 rounded-2xl active:scale-95 transition-transform">Cancelar</button>
                    <button onClick={handleRegisterBirth} className="flex-1 py-4 bg-agro-green text-white rounded-2xl font-bold shadow-lg shadow-agro-green/30 active:scale-95 transition-transform">Registar Cria</button>
                 </div>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default AnimalDetailsModal;