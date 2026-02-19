
import React, { useState, useMemo, useEffect } from 'react';
import {
  X, Baby, CalendarHeart, Dna, Timer, AlertCircle, AlertTriangle,
  HeartHandshake, ChevronRight, Activity, Calendar, Save,
  ArrowRight, Edit2, CheckCircle2, Clock
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

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    status: animal.reproductionStatus || 'empty',
    conceptionDate: animal.conceptionDate || '',
    motherName: animal.lineage?.motherName || '',
    fatherName: animal.lineage?.fatherName || ''
  });

  // Form States for Actions
  const [insemData, setInsemData] = useState({ date: new Date().toISOString().split('T')[0], bull: '' });
  const [birthData, setBirthData] = useState({ date: new Date().toISOString().split('T')[0], name: '', gender: 'female', weight: '' });

  // Reset form when modal opens or animal changes
  useEffect(() => {
    if (isOpen) {
      setEditForm({
        status: animal.reproductionStatus || 'empty',
        conceptionDate: animal.conceptionDate || new Date().toISOString().split('T')[0],
        motherName: animal.lineage?.motherName || '',
        fatherName: animal.lineage?.fatherName || ''
      });
      setIsEditing(false);
    }
  }, [isOpen, animal]);

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
        // Mantém a mãe/pai do animal atual, adiciona nota sobre o pai do futuro vitelo nos eventos
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

  const handleSaveEdit = () => {
    onUpdateAnimal(animal.id, {
      reproductionStatus: editForm.status as any,
      // Se não for gestante, limpar data de conceção para não confundir calculos
      conceptionDate: editForm.status === 'pregnant' ? editForm.conceptionDate : undefined,
      lineage: {
        ...animal.lineage,
        motherName: editForm.motherName,
        fatherName: editForm.fatherName
      }
    });
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in p-0 md:p-6" onClick={onClose}>
      <div
        className="bg-[#FDFDF5] dark:bg-[#0A0A0A] w-full md:max-w-5xl h-[95vh] md:h-auto md:max-h-[90vh] rounded-t-[2.5rem] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden relative border-t border-white/20 md:border md:border-white/10 transition-all"
        onClick={e => e.stopPropagation()}
      >

        {/* --- HEADER STICKY --- */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-neutral-800 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl sticky top-0 z-20 shrink-0">
          {/* Mobile Drag Indicator */}
          <div className="md:hidden w-12 h-1.5 bg-gray-200 dark:bg-neutral-800 rounded-full mx-auto mb-4 opacity-60"></div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className={`w-16 h-16 rounded-[1.2rem] flex items-center justify-center text-4xl shadow-sm shrink-0 border border-black/5 dark:border-white/5 ${animal.reproductionStatus === 'heat' ? 'bg-pink-100 text-pink-500' :
                animal.reproductionStatus === 'pregnant' ? 'bg-green-100 text-green-600' :
                  'bg-gray-100 text-gray-400'
                }`}>
                {animal.reproductionStatus === 'heat' ? '🔥' : animal.reproductionStatus === 'pregnant' ? '🤰' : '🐄'}
              </div>

              {/* Text Info */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">{animal.tagId}</span>
                  {!isEditing && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${animal.reproductionStatus === 'heat' ? 'bg-pink-100 text-pink-600' :
                      animal.reproductionStatus === 'pregnant' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                      {animal.reproductionStatus === 'heat' ? 'Em Cio' :
                        animal.reproductionStatus === 'pregnant' ? 'Gestante' :
                          animal.reproductionStatus === 'post-partum' ? 'Pós-Parto' : 'Vazia'}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white leading-none tracking-tight truncate">{animal.name}</h2>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2 shrink-0">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 transition-colors active:scale-90"
                >
                  <Edit2 size={18} />
                </button>
              )}
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-white flex items-center justify-center hover:bg-gray-200 transition-colors active:scale-90"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* --- SCROLLABLE CONTENT --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-[#FDFDF5] dark:bg-[#0A0A0A]">

          {/* MODO DE EDIÇÃO */}
          {isEditing ? (
            <div className="animate-slide-up space-y-6">
              <div className="bg-white dark:bg-neutral-900 p-6 rounded-[2.5rem] border border-blue-100 dark:border-blue-900/30 shadow-sm">
                <h3 className="text-lg font-bold dark:text-white mb-6 flex items-center gap-2">
                  <Edit2 size={20} className="text-blue-500" /> Ciclo Reprodutivo
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Status Selector */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase ml-3 mb-1.5 block">Estado Atual</label>
                    <div className="relative">
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                        className="w-full p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500 appearance-none border-2 border-transparent transition-all"
                      >
                        <option value="empty">Vazia / Normal</option>
                        <option value="pregnant">Gestante</option>
                        <option value="heat">Em Cio</option>
                        <option value="post-partum">Pós-Parto</option>
                      </select>
                      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" size={16} />
                    </div>
                  </div>

                  {/* Date Picker (Only if Pregnant) */}
                  {editForm.status === 'pregnant' && (
                    <div className="animate-slide-up">
                      <label className="text-xs font-bold text-gray-400 uppercase ml-3 mb-1.5 block">Data Conceção</label>
                      <input
                        type="date"
                        value={editForm.conceptionDate}
                        onChange={(e) => setEditForm({ ...editForm, conceptionDate: e.target.value })}
                        className="w-full p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500 border-2 border-transparent transition-all"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-sm space-y-6">
                <h3 className="text-lg font-bold dark:text-white mb-2 flex items-center gap-2">
                  <Dna size={20} className="text-purple-500" /> Genética & Linhagem
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase ml-3 mb-1.5 block">Nome da Mãe</label>
                    <input
                      value={editForm.motherName}
                      onChange={(e) => setEditForm({ ...editForm, motherName: e.target.value })}
                      className="w-full p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-purple-500 border-2 border-transparent transition-all"
                      placeholder="Desconhecida"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase ml-3 mb-1.5 block">Nome do Pai</label>
                    <input
                      value={editForm.fatherName}
                      onChange={(e) => setEditForm({ ...editForm, fatherName: e.target.value })}
                      className="w-full p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-purple-500 border-2 border-transparent transition-all"
                      placeholder="Desconhecido"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 pb-12">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-8 py-4 bg-gray-200 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 font-bold rounded-2xl transition-colors hover:bg-gray-300 dark:hover:bg-neutral-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Save size={20} /> Guardar Alterações
                </button>
              </div>
            </div>
          ) : (
            /* MODO VISUALIZAÇÃO (DEFAULT) */
            <div className="space-y-6 pb-20">
              {/* 1. GESTATION TRACKER (If Pregnant) */}
              {pregnancyData && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 p-6 md:p-8 rounded-[2.5rem] border border-green-100 dark:border-green-900/30 relative overflow-hidden shadow-sm">
                  <div className="flex justify-between items-end mb-6 relative z-10">
                    <div>
                      <p className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Baby size={12} /> Previsão de Parto
                      </p>
                      <h3 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">
                        {pregnancyData.daysLeft} <span className="text-sm font-bold text-gray-400">dias</span>
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Data Prevista</p>
                      <p className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{pregnancyData.dueDate.toLocaleDateString('pt-PT')}</p>
                    </div>
                  </div>

                  {/* Progress Bar Visual */}
                  <div className="relative h-6 md:h-8 bg-white dark:bg-black/20 rounded-full overflow-hidden shadow-inner border border-green-100 dark:border-green-900/30">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-emerald-600 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${pregnancyData.progress}%` }}
                    >
                      <div className="absolute right-1 top-1 bottom-1 w-1 bg-white/50 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-3 text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wide px-1">
                    <span>Conceção</span>
                    <span>{Math.round(pregnancyData.progress)}%</span>
                    <span>Parto</span>
                  </div>

                  {pregnancyData.isClose && (
                    <div className="mt-5 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-pulse border border-orange-200 dark:border-orange-800/30">
                      <AlertTriangle size={16} /> <span className="uppercase">Preparar Maternidade</span>
                    </div>
                  )}
                </div>
              )}

              {/* 2. GENEALOGIA - Optimized Tree */}
              <div className="bg-white dark:bg-neutral-900 p-6 md:p-8 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-sm">
                <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-2 uppercase tracking-wide">
                  <Dna size={16} className="text-blue-500" /> Linhagem Genética
                </h4>

                <div className="relative flex justify-between items-center px-4 sm:px-12 md:px-20">
                  {/* Conector Line - Perfectly Centered */}
                  <div className="absolute top-[28px] md:top-[36px] left-[15%] right-[15%] h-[2px] bg-gray-100 dark:bg-neutral-800 -z-0"></div>

                  {/* Mãe */}
                  <div className="flex flex-col items-center gap-3 z-10 w-1/3">
                    <div className="w-14 h-14 md:w-18 md:h-18 bg-gray-50 dark:bg-neutral-800 rounded-2xl flex items-center justify-center border-4 border-white dark:border-neutral-900 shadow-sm text-xl md:text-2xl">
                      🐄
                    </div>
                    <div className="text-center w-full">
                      <p className="text-[9px] font-bold uppercase text-gray-400 mb-0.5">Mãe</p>
                      <p className="text-xs md:text-sm font-bold dark:text-white truncate px-1 w-full block">{animal.lineage?.motherName || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Animal Atual */}
                  <div className="flex flex-col items-center gap-3 z-10 w-1/3 -mt-6">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-white dark:bg-neutral-900 rounded-[1.5rem] flex items-center justify-center border-4 border-agro-green shadow-xl text-3xl md:text-4xl">
                      ⭐
                    </div>
                    <div className="text-center w-full">
                      <p className="text-[9px] font-bold uppercase text-agro-green mb-0.5">Atual</p>
                      <p className="text-sm md:text-base font-black dark:text-white truncate px-1">{animal.name}</p>
                    </div>
                  </div>

                  {/* Pai */}
                  <div className="flex flex-col items-center gap-3 z-10 w-1/3">
                    <div className="w-14 h-14 md:w-18 md:h-18 bg-gray-50 dark:bg-neutral-800 rounded-2xl flex items-center justify-center border-4 border-white dark:border-neutral-900 shadow-sm text-xl md:text-2xl">
                      🐂
                    </div>
                    <div className="text-center w-full">
                      <p className="text-[9px] font-bold uppercase text-gray-400 mb-0.5">Pai</p>
                      <p className="text-xs md:text-sm font-bold dark:text-white truncate px-1 w-full block">{animal.lineage?.fatherName || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. AÇÕES RÁPIDAS (Grid) */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider ml-2">Ações Reprodutivas</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">

                  {/* Registar Cio */}
                  <button
                    onClick={handleRegisterHeat}
                    disabled={animal.reproductionStatus === 'pregnant'}
                    className={`p-5 rounded-[2rem] border-2 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 min-h-[110px] md:min-h-[120px] ${animal.reproductionStatus === 'pregnant'
                      ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                      : 'border-pink-100 bg-pink-50 dark:bg-pink-900/10 dark:border-pink-900/30 text-pink-600 hover:bg-pink-100 dark:hover:bg-pink-900/20'
                      }`}
                  >
                    <Activity size={28} />
                    <span className="text-xs font-bold uppercase tracking-wide">Marcar Cio</span>
                  </button>

                  {/* Registar Inseminação */}
                  <button
                    onClick={() => setSubModal('insemination')}
                    disabled={animal.reproductionStatus === 'pregnant'}
                    className={`p-5 rounded-[2rem] border-2 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 min-h-[110px] md:min-h-[120px] ${animal.reproductionStatus === 'pregnant'
                      ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                      : 'border-blue-100 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-900/30 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20'
                      }`}
                  >
                    <HeartHandshake size={28} />
                    <span className="text-xs font-bold uppercase tracking-wide">Inseminar</span>
                  </button>

                  {/* Registar Parto (Full Width on Mobile, Distinct on Tablet) */}
                  <button
                    onClick={() => setSubModal('birth')}
                    disabled={animal.reproductionStatus !== 'pregnant'}
                    className={`col-span-2 md:col-span-1 p-5 rounded-[2rem] border-2 flex md:flex-col flex-row items-center justify-center gap-3 md:gap-2 transition-all active:scale-95 shadow-sm min-h-[80px] md:min-h-[120px] ${animal.reproductionStatus === 'pregnant'
                      ? 'bg-agro-green border-agro-green text-white shadow-agro-green/30 hover:bg-green-700'
                      : 'bg-gray-100 dark:bg-neutral-800 border-transparent text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    <Baby size={28} />
                    <span className="text-base md:text-xs font-bold md:uppercase md:tracking-wide">Registar Nascimento</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* --- SUB-MODALS (INSEMINATION & BIRTH) --- */}

        {/* Insemination Form */}
        {subModal === 'insemination' && (
          <div className="absolute bottom-0 left-0 right-0 md:top-1/2 md:left-1/2 md:bottom-auto md:right-auto md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md md:rounded-[2.5rem] bg-white dark:bg-neutral-900 rounded-t-[2.5rem] p-6 pb-8 md:p-8 md:pb-10 shadow-[0_-20px_60px_rgba(0,0,0,0.3)] md:shadow-2xl animate-slide-up md:animate-fade-in border-t md:border border-gray-100 dark:border-neutral-800 z-50">
            <div className="w-16 h-1.5 bg-gray-200 dark:bg-neutral-700 rounded-full mx-auto mb-8"></div>
            <h3 className="text-2xl font-black dark:text-white mb-6">Nova Inseminação</h3>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase ml-3 mb-1.5 block">Touro / Código Sémen</label>
                <input
                  autoFocus
                  className="w-full p-5 bg-gray-100 dark:bg-neutral-800 rounded-[1.5rem] font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all border-2 border-transparent"
                  placeholder="Ex: PT-5502"
                  value={insemData.bull}
                  onChange={e => setInsemData({ ...insemData, bull: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase ml-3 mb-1.5 block">Data</label>
                <input
                  type="date"
                  className="w-full p-5 bg-gray-100 dark:bg-neutral-800 rounded-[1.5rem] font-bold dark:text-white outline-none min-h-[4rem]"
                  value={insemData.date}
                  onChange={e => setInsemData({ ...insemData, date: e.target.value })}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setSubModal(null)} className="flex-1 py-4 font-bold text-gray-500 bg-gray-100 dark:bg-neutral-800 rounded-[1.5rem] active:scale-95 transition-transform">Cancelar</button>
                <button onClick={handleRegisterInsemination} className="flex-1 py-4 bg-blue-600 text-white rounded-[1.5rem] font-bold shadow-xl shadow-blue-600/30 active:scale-95 transition-transform">Confirmar</button>
              </div>
            </div>
          </div>
        )}

        {/* Birth Form */}
        {subModal === 'birth' && (
          <div className="absolute bottom-0 left-0 right-0 md:top-1/2 md:left-1/2 md:bottom-auto md:right-auto md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md md:rounded-[2.5rem] bg-white dark:bg-neutral-900 rounded-t-[2.5rem] p-6 pb-8 md:p-8 md:pb-10 shadow-[0_-20px_60px_rgba(0,0,0,0.3)] md:shadow-2xl animate-slide-up md:animate-fade-in border-t md:border border-gray-100 dark:border-neutral-800 z-50">
            <div className="w-16 h-1.5 bg-gray-200 dark:bg-neutral-700 rounded-full mx-auto mb-8"></div>
            <h3 className="text-2xl font-black dark:text-white mb-6 flex items-center gap-3">
              <Baby size={28} className="text-agro-green" /> Nasceu uma cria!
            </h3>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase ml-3 mb-1.5 block">Nome / Tag Provisória</label>
                <input
                  autoFocus
                  className="w-full p-5 bg-gray-100 dark:bg-neutral-800 rounded-[1.5rem] font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green transition-all border-2 border-transparent"
                  placeholder="Ex: Vitelo 01"
                  value={birthData.name}
                  onChange={e => setBirthData({ ...birthData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase ml-3 mb-1.5 block">Peso (Kg)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="w-full p-5 bg-gray-100 dark:bg-neutral-800 rounded-[1.5rem] font-bold dark:text-white outline-none"
                    placeholder="35"
                    value={birthData.weight}
                    onChange={e => setBirthData({ ...birthData, weight: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase ml-3 mb-1.5 block">Sexo</label>
                  <div className="flex bg-gray-100 dark:bg-neutral-800 rounded-[1.5rem] p-1.5 h-[66px]">
                    <button
                      onClick={() => setBirthData({ ...birthData, gender: 'female' })}
                      className={`flex-1 rounded-[1.2rem] font-bold text-sm transition-all ${birthData.gender === 'female' ? 'bg-white dark:bg-neutral-700 shadow text-pink-500' : 'text-gray-400'}`}
                    >
                      Fêmea
                    </button>
                    <button
                      onClick={() => setBirthData({ ...birthData, gender: 'male' })}
                      className={`flex-1 rounded-[1.2rem] font-bold text-sm transition-all ${birthData.gender === 'male' ? 'bg-white dark:bg-neutral-700 shadow text-blue-500' : 'text-gray-400'}`}
                    >
                      Macho
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setSubModal(null)} className="flex-1 py-4 font-bold text-gray-500 bg-gray-100 dark:bg-neutral-800 rounded-[1.5rem] active:scale-95 transition-transform">Cancelar</button>
                <button onClick={handleRegisterBirth} className="flex-1 py-4 bg-agro-green text-white rounded-[1.5rem] font-bold shadow-xl shadow-agro-green/30 active:scale-95 transition-transform">Registar Cria</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AnimalDetailsModal;