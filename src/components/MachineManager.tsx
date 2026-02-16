
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Tractor, Wrench, Fuel, Calendar, Clock, AlertTriangle, 
  CheckCircle2, Plus, X, Gauge, Truck, Activity, Droplets, Save,
  MoreHorizontal, ChevronRight, GaugeCircle, Filter
} from 'lucide-react';
import { Machine, MaintenanceLog, StockItem } from '../types';

interface MachineManagerProps {
  machines: Machine[];
  stocks?: StockItem[];
  onUpdateHours: (id: string, hours: number) => void;
  onAddLog: (machineId: string, log: Omit<MaintenanceLog, 'id'>) => void;
  onAddMachine: (machine: Omit<Machine, 'id' | 'logs'>) => void;
  onModalChange?: (isOpen: boolean) => void;
}

const MachineManager: React.FC<MachineManagerProps> = ({ 
  machines, 
  stocks = [],
  onUpdateHours, 
  onAddLog,
  onAddMachine,
  onModalChange 
}) => {
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [modalType, setModalType] = useState<'hours' | 'maintenance' | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // Filter state kept for logic, but UI removed as requested
  const [filterType, setFilterType] = useState<'all' | 'tractor' | 'vehicle'>('all');

  // New Machine Form State
  const [newMachineData, setNewMachineData] = useState<Partial<Machine>>({
    type: 'tractor',
    engineHours: 0,
    serviceInterval: 500,
    fuelLevel: 100,
    status: 'active',
    nextInspectionDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  
  // Existing Form States
  const [newHours, setNewHours] = useState<string>('');
  const [logType, setLogType] = useState<MaintenanceLog['type']>('fuel');
  const [logDesc, setLogDesc] = useState('');
  const [logCost, setLogCost] = useState('');
  const [logLiters, setLogLiters] = useState('');

  // Fuel Integration Logic
  const fuelStockAvailable = useMemo(() => {
    return stocks
      .filter(s => s.category === 'Combustível' || s.name.toLowerCase().includes('gasóleo') || s.name.toLowerCase().includes('diesel'))
      .reduce((acc, s) => acc + s.quantity, 0);
  }, [stocks]);

  const isFuelInsufficient = useMemo(() => {
    return logType === 'fuel' && parseFloat(logLiters || '0') > fuelStockAvailable;
  }, [logType, logLiters, fuelStockAvailable]);

  useEffect(() => {
    if (onModalChange) {
      onModalChange(!!selectedMachine || isAddModalOpen);
    }
  }, [selectedMachine, isAddModalOpen, onModalChange]);

  const openModal = (machine: Machine, type: 'hours' | 'maintenance') => {
    setSelectedMachine(machine);
    setModalType(type);
    setNewHours(machine.engineHours.toString());
    setLogType(type === 'hours' ? 'other' : 'fuel');
    setLogDesc('');
    setLogCost('');
    setLogLiters('');
  };

  const closeModal = () => {
    setSelectedMachine(null);
    setModalType(null);
    setIsAddModalOpen(false);
  };

  const handleUpdateHours = () => {
    if (selectedMachine && newHours) {
      onUpdateHours(selectedMachine.id, parseFloat(newHours));
      closeModal();
    }
  };

  const handleAddLog = () => {
    if (selectedMachine) {
      const liters = parseFloat(logLiters);
      
      if (logType === 'fuel' && (isNaN(liters) || liters <= 0)) return;

      const description = logType === 'fuel' 
        ? `Abastecimento: ${logLiters}L. ${logDesc}` 
        : logDesc;

      onAddLog(selectedMachine.id, {
        date: new Date().toISOString().split('T')[0],
        type: logType,
        description: description || (logType === 'fuel' ? 'Abastecimento' : 'Manutenção'),
        cost: parseFloat(logCost) || 0,
        engineHoursAtLog: selectedMachine.engineHours,
        quantity: logType === 'fuel' ? liters : undefined
      });
      closeModal();
    }
  };

  const handleAddMachine = () => {
    if (newMachineData.name && newMachineData.brand) {
      onAddMachine(newMachineData as Omit<Machine, 'id' | 'logs'>);
      setNewMachineData({
         type: 'tractor',
         engineHours: 0,
         serviceInterval: 500,
         fuelLevel: 100,
         status: 'active',
         name: '',
         brand: '',
         model: '',
         plate: '',
         nextInspectionDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      closeModal();
    }
  };

  const calculateHealth = (m: Machine) => {
    const hoursSinceService = m.engineHours - m.lastServiceHours;
    const hoursRemaining = m.serviceInterval - hoursSinceService;
    const progress = Math.min((hoursSinceService / m.serviceInterval) * 100, 100);
    const isOverdue = hoursSinceService > m.serviceInterval;
    const isApproaching = hoursRemaining > 0 && hoursRemaining <= 50;
    
    const daysUntilInspection = Math.ceil((new Date(m.nextInspectionDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const isInspectionDue = daysUntilInspection <= 30;

    return { hoursSinceService, hoursRemaining, progress, isOverdue, isApproaching, isInspectionDue, daysUntilInspection };
  };

  const metrics = useMemo(() => {
    const total = machines.length;
    const active = machines.filter(m => m.status === 'active').length;
    const maintenanceDue = machines.filter(m => {
       const h = calculateHealth(m);
       return h.isOverdue || h.isInspectionDue || h.isApproaching;
    }).length;
    
    return { total, active, maintenanceDue };
  }, [machines]);

  const filteredMachines = useMemo(() => {
    if (filterType === 'all') return machines;
    return machines.filter(m => m.type === filterType);
  }, [machines, filterType]);

  const getMachineIcon = (type: string) => {
    switch (type) {
      case 'tractor': return <Tractor size={24} />;
      case 'vehicle': return <Truck size={24} />;
      default: return <Gauge size={24} />;
    }
  };

  // --- RENDER MODAL ADD MACHINE ---
  const renderAddMachineModal = () => (
    <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 md:p-4" onClick={closeModal}>
      <div 
        className="bg-white dark:bg-neutral-900 w-full md:max-w-2xl h-[92vh] md:h-auto md:max-h-[85vh] p-6 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl animate-slide-up border-t border-white/20 overflow-y-auto custom-scrollbar" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
             <h3 className="text-2xl font-black dark:text-white leading-none">Nova Máquina</h3>
             <p className="text-xs font-bold text-gray-400 uppercase mt-1">Registo de Equipamento</p>
          </div>
          <button onClick={closeModal} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full active:scale-90 transition-transform">
            <X size={24} className="dark:text-white" />
          </button>
        </div>

        <div className="space-y-6 pb-8">
          <div>
            <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-2 block">Tipo de Equipamento</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'tractor', icon: Tractor, label: 'Trator' },
                { id: 'vehicle', icon: Truck, label: 'Veículo' },
                { id: 'implement', icon: Gauge, label: 'Alfaia' }
              ].map(item => (
                <button 
                  key={item.id}
                  onClick={() => setNewMachineData({...newMachineData, type: item.id as any})}
                  className={`flex flex-col items-center justify-center py-4 rounded-2xl border-2 transition-all active:scale-95 ${
                    newMachineData.type === item.id
                      ? 'bg-agro-green/10 border-agro-green text-agro-green shadow-sm' 
                      : 'bg-gray-50 dark:bg-neutral-800 border-transparent text-gray-400 grayscale hover:grayscale-0'
                  }`}
                >
                  <item.icon size={28} className="mb-1" />
                  <span className="text-[10px] font-bold uppercase">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 ml-2">Nome (Apelido)</label>
              <input 
                type="text"
                value={newMachineData.name || ''}
                onChange={e => setNewMachineData({...newMachineData, name: e.target.value})}
                className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl mt-1 text-lg font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green border-2 border-transparent transition-all"
                placeholder="Ex: John Deere Principal"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-bold uppercase text-gray-400 ml-2">Marca</label>
                  <input 
                    type="text"
                    value={newMachineData.brand || ''}
                    onChange={e => setNewMachineData({...newMachineData, brand: e.target.value})}
                    className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl mt-1 font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green border-2 border-transparent"
                    placeholder="Ex: Ford"
                  />
               </div>
               <div>
                  <label className="text-xs font-bold uppercase text-gray-400 ml-2">Modelo</label>
                  <input 
                    type="text"
                    value={newMachineData.model || ''}
                    onChange={e => setNewMachineData({...newMachineData, model: e.target.value})}
                    className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl mt-1 font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green border-2 border-transparent"
                    placeholder="Ex: 4000"
                  />
               </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 ml-2">Matrícula</label>
              <input 
                type="text"
                value={newMachineData.plate || ''}
                onChange={e => setNewMachineData({...newMachineData, plate: e.target.value})}
                className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl mt-1 font-mono font-bold dark:text-white outline-none uppercase focus:ring-2 focus:ring-agro-green border-2 border-transparent"
                placeholder="00-AA-00"
              />
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-neutral-800/50 p-5 rounded-3xl border border-gray-100 dark:border-neutral-800 space-y-4">
             <div className="flex items-center gap-2 mb-2">
               <div className="p-2 bg-white dark:bg-neutral-700 rounded-xl shadow-sm">
                 <Wrench size={18} className="text-agro-green" />
               </div>
               <h4 className="font-bold text-gray-900 dark:text-white">Dados de Manutenção</h4>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-bold uppercase text-gray-400 ml-2">Horas Atuais</label>
                  <div className="relative mt-1">
                    <input 
                      type="number"
                      inputMode="decimal"
                      value={newMachineData.engineHours}
                      onChange={e => setNewMachineData({...newMachineData, engineHours: parseFloat(e.target.value)})}
                      className="w-full p-4 bg-white dark:bg-neutral-700 rounded-2xl font-black dark:text-white outline-none focus:ring-2 focus:ring-agro-green border-2 border-transparent"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">h</span>
                  </div>
               </div>
               <div>
                  <label className="text-xs font-bold uppercase text-gray-400 ml-2">Intervalo Revisão</label>
                  <div className="relative mt-1">
                    <input 
                      type="number"
                      inputMode="numeric"
                      value={newMachineData.serviceInterval}
                      onChange={e => setNewMachineData({...newMachineData, serviceInterval: parseFloat(e.target.value)})}
                      className="w-full p-4 bg-white dark:bg-neutral-700 rounded-2xl font-black dark:text-white outline-none focus:ring-2 focus:ring-agro-green border-2 border-transparent"
                      placeholder="500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">h</span>
                  </div>
               </div>
             </div>

             <div>
               <label className="text-xs font-bold uppercase text-gray-400 ml-2">Próxima Inspeção</label>
               <input 
                 type="date"
                 value={newMachineData.nextInspectionDate}
                 onChange={e => setNewMachineData({...newMachineData, nextInspectionDate: e.target.value})}
                 className="w-full p-4 bg-white dark:bg-neutral-700 rounded-2xl mt-1 font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green min-h-[3.5rem] border-2 border-transparent"
               />
             </div>
          </div>

          <button 
            onClick={handleAddMachine}
            className={`w-full py-5 rounded-[1.5rem] font-bold text-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 ${
              newMachineData.name && newMachineData.brand 
                ? 'bg-agro-green text-white shadow-agro-green/30' 
                : 'bg-gray-300 dark:bg-neutral-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Save size={24} />
            Guardar Máquina
          </button>
        </div>
      </div>
    </div>
  );

  // --- EMPTY STATE ---
  if (!machines || machines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] p-6 animate-fade-in text-center">
        <div className="w-24 h-24 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
          <Tractor size={40} className="text-gray-400" />
        </div>
        <h3 className="text-2xl font-black italic text-gray-900 dark:text-white mb-2">Garagem Vazia</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-xs mb-8">
          Adicione os seus tratores e alfaias para controlar manutenções e consumos.
        </p>
        <button 
           className="px-6 py-4 bg-agro-green text-white rounded-[1.5rem] font-bold shadow-lg shadow-agro-green/30 active:scale-95 transition-transform flex items-center gap-2"
           onClick={() => setIsAddModalOpen(true)}
        >
          <Plus size={20} />
          Adicionar Primeira Máquina
        </button>

        {isAddModalOpen && renderAddMachineModal()}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pt-4 pb-24">
      
      {/* 1. Header & Quick Stats */}
      <div className="px-2">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-3xl font-black italic text-gray-900 dark:text-white leading-none">Frota</h2>
            <div className="flex items-center gap-2 mt-2">
               <span className="bg-gray-100 dark:bg-neutral-800 px-2 py-1 rounded-lg text-[10px] font-bold uppercase text-gray-500 tracking-wide">
                 {metrics.total} Unidades
               </span>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="w-12 h-12 bg-agro-green text-white rounded-full flex items-center justify-center shadow-lg shadow-agro-green/30 active:scale-95 transition-transform"
            >
              <Plus size={24} strokeWidth={2.5} />
            </button>
            <span className="text-[10px] font-bold text-agro-green dark:text-green-400 whitespace-nowrap">Nova Máq.</span>
          </div>
        </div>

        {/* Compact Fleet Status - Optimized for Mobile */}
        <div className={`rounded-2xl p-4 text-white shadow-lg relative overflow-hidden flex items-center justify-between mb-4 ${
           metrics.maintenanceDue > 0 
             ? 'bg-gradient-to-r from-orange-500 to-red-600 shadow-orange-500/20' 
             : 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/20'
        }`}>
           <div className="flex items-center gap-3 relative z-10">
              <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                 {metrics.maintenanceDue > 0 ? <Wrench size={18} /> : <CheckCircle2 size={18} />}
              </div>
              <div>
                 <p className="text-[10px] font-bold text-white/90 uppercase tracking-wider">Estado da Frota</p>
                 <p className="text-sm font-bold leading-none mt-0.5">
                    {metrics.maintenanceDue === 0 ? 'Tudo Operacional' : `${metrics.maintenanceDue} Alertas`}
                 </p>
              </div>
           </div>
           <GaugeCircle className="text-white/10 w-16 h-16 absolute -right-2 -bottom-4 rotate-12" />
        </div>
      </div>

      {/* 2. Machine Cards List - Optimized Layout */}
      <div className="space-y-4 px-1">
        {filteredMachines.map(machine => {
          const health = calculateHealth(machine);
          const needsService = health.isOverdue || health.isApproaching;
          
          return (
            <div 
              key={machine.id}
              className="bg-white dark:bg-neutral-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden relative group active:scale-[0.99] transition-transform duration-300"
            >
              {/* Status Banner Strip (if urgent) */}
              {(health.isOverdue || health.isInspectionDue) && (
                <div className="bg-red-500 text-white text-[9px] font-bold text-center py-1 uppercase tracking-widest animate-pulse">
                   Ação Necessária
                </div>
              )}

              <div className="p-4">
                {/* Header Row - Compact */}
                <div className="flex items-start gap-3 mb-4">
                   {/* Icon Box - Smaller */}
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md shrink-0 ${
                      needsService ? 'bg-orange-500 shadow-orange-500/30' : 'bg-gray-800 dark:bg-neutral-700 shadow-gray-500/20'
                   }`}>
                      {getMachineIcon(machine.type)}
                   </div>

                   {/* Info - Tighter Layout */}
                   <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                         <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight truncate">{machine.name}</h3>
                         {/* Status Pill - Compact */}
                         <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                            machine.status === 'active' 
                              ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' 
                              : 'bg-gray-100 border-gray-200 text-gray-500'
                         }`}>
                            {machine.status === 'active' ? 'Ativo' : 'Parado'}
                         </span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{machine.brand} {machine.model}</p>
                      
                      <div className="flex items-center gap-2 mt-1.5">
                         <span className="bg-gray-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-neutral-700">
                           {machine.plate}
                         </span>
                         {health.isInspectionDue && (
                           <span className="flex items-center gap-1 text-[9px] font-bold text-orange-600 dark:text-orange-400">
                              <AlertTriangle size={10} /> Insp. {health.daysUntilInspection}d
                           </span>
                         )}
                      </div>
                   </div>
                </div>

                {/* Service Health Bar - Slimmer */}
                <div className="mb-4">
                   <div className="flex justify-between items-end mb-1">
                      <div className="flex flex-col">
                         <span className="text-[9px] font-bold uppercase text-gray-400">Próxima Revisão</span>
                         <span className={`text-xs font-bold ${needsService ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                            {health.hoursRemaining > 0 ? `${health.hoursRemaining}h Restantes` : `${Math.abs(health.hoursRemaining)}h Atraso`}
                         </span>
                      </div>
                      <div className="text-right">
                         <span className="text-[9px] text-gray-400">Total</span>
                         <p className="text-xs font-black text-gray-900 dark:text-white">{machine.engineHours.toLocaleString()}h</p>
                      </div>
                   </div>
                   
                   {/* Custom Progress Bar */}
                   <div className="h-2 w-full bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden border border-gray-200 dark:border-neutral-700 relative">
                      {/* Ticks */}
                      <div className="absolute top-0 bottom-0 left-1/4 w-px bg-white/50 z-10"></div>
                      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/50 z-10"></div>
                      <div className="absolute top-0 bottom-0 left-3/4 w-px bg-white/50 z-10"></div>
                      
                      <div 
                         className={`h-full rounded-full transition-all duration-700 ease-out ${
                            health.isOverdue ? 'bg-red-500' : 
                            health.isApproaching ? 'bg-orange-500' : 
                            'bg-gradient-to-r from-agro-green to-emerald-400'
                         }`}
                         style={{ width: `${health.progress}%` }}
                      ></div>
                   </div>
                </div>

                {/* Actions Grid - Smaller Buttons */}
                <div className="grid grid-cols-2 gap-2">
                   <button 
                     onClick={() => openModal(machine, 'hours')}
                     className="py-2.5 bg-gray-50 dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 flex items-center justify-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 active:bg-gray-200 dark:active:bg-neutral-700 transition-colors"
                   >
                      <Clock size={14} /> Horas
                   </button>
                   <button 
                     onClick={() => openModal(machine, 'maintenance')}
                     className="py-2.5 bg-gray-900 dark:bg-white rounded-xl text-white dark:text-black flex items-center justify-center gap-1.5 text-xs font-bold active:scale-95 transition-transform shadow-md"
                   >
                      <Fuel size={14} /> Abastecer
                   </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Logic (Action Sheets) */}
      {selectedMachine && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={closeModal}>
          <div 
            className="bg-white dark:bg-neutral-900 w-full max-w-md p-6 rounded-t-[2.5rem] shadow-2xl animate-slide-up border-t border-white/20" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black dark:text-white leading-none">
                  {modalType === 'hours' ? 'Atualizar Horas' : 'Registo Técnico'}
                </h3>
                <p className="text-xs text-gray-500 font-bold uppercase mt-1 tracking-wide">{selectedMachine.name}</p>
              </div>
              <button onClick={closeModal} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                <X size={24} className="dark:text-white" />
              </button>
            </div>

            {modalType === 'hours' ? (
              <div className="space-y-8 pb-4">
                 {/* Giant Input Design */}
                 <div className="flex items-center gap-4">
                   <button 
                      onClick={() => setNewHours((parseFloat(newHours || '0') - 1).toString())}
                      className="w-16 h-16 bg-gray-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center text-gray-500 active:scale-90 transition-transform"
                   >
                     <span className="text-3xl font-black">-</span>
                   </button>
                   
                   <div className="flex-1 bg-gray-50 dark:bg-neutral-800 h-24 rounded-3xl flex flex-col items-center justify-center border-2 border-transparent focus-within:border-agro-green transition-colors">
                     <input 
                        type="number"
                        className="bg-transparent text-center text-5xl font-black text-gray-900 dark:text-white outline-none w-full"
                        value={newHours}
                        onChange={(e) => setNewHours(e.target.value)}
                        autoFocus
                     />
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Horas Totais</span>
                   </div>

                   <button 
                      onClick={() => setNewHours((parseFloat(newHours || '0') + 1).toString())}
                      className="w-16 h-16 bg-agro-green rounded-2xl shadow-lg shadow-agro-green/30 flex items-center justify-center text-white active:scale-90 transition-transform"
                   >
                     <span className="text-3xl font-black">+</span>
                   </button>
                 </div>

                 <button 
                  onClick={handleUpdateHours}
                  className="w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-[1.5rem] font-bold text-xl shadow-xl active:scale-95 transition-transform"
                 >
                   Confirmar Leitura
                 </button>
              </div>
            ) : (
              <div className="space-y-6 pb-4">
                {/* Visual Selector */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'fuel', icon: Fuel, label: 'Abastecer' },
                    { id: 'oil_change', icon: Droplets, label: 'Muda Óleo' },
                    { id: 'repair', icon: Wrench, label: 'Reparação' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setLogType(t.id as any)}
                      className={`flex flex-col items-center justify-center py-4 rounded-2xl border-2 transition-all active:scale-95 ${
                        logType === t.id 
                          ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-black shadow-lg' 
                          : 'bg-gray-50 dark:bg-neutral-800 border-transparent text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <t.icon size={28} className="mb-1" />
                      <span className="text-[10px] font-bold uppercase">{t.label}</span>
                    </button>
                  ))}
                </div>

                {logType === 'fuel' && (
                  <div className={`bg-gray-50 dark:bg-neutral-800 p-5 rounded-[2rem] border-2 transition-all ${isFuelInsufficient ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : 'border-transparent focus-within:border-agro-green'}`}>
                    <div className="flex justify-between items-center mb-2">
                       <label className="text-xs font-bold uppercase text-gray-400">Quantidade</label>
                       <span className={`text-[10px] font-bold bg-white dark:bg-neutral-700 px-2 py-1 rounded-md ${isFuelInsufficient ? 'text-red-500' : 'text-green-600'}`}>
                          Stock: {fuelStockAvailable}L
                       </span>
                    </div>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={logLiters}
                        onChange={(e) => setLogLiters(e.target.value)}
                        className="w-full bg-transparent text-5xl font-black dark:text-white outline-none placeholder-gray-300"
                        placeholder="0"
                        autoFocus
                      />
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 font-black text-2xl">L</span>
                    </div>
                    {isFuelInsufficient && (
                       <p className="text-xs text-red-500 font-bold mt-2 flex items-center gap-1 animate-pulse">
                          <AlertTriangle size={12} /> Stock Insuficiente no Armazém!
                       </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Custo (€)</label>
                      <input 
                        type="number" 
                        value={logCost}
                        onChange={(e) => setLogCost(e.target.value)}
                        className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl text-lg font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                        placeholder="0.00"
                      />
                  </div>
                  <div>
                      <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Contador</label>
                      <div className="w-full p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl text-lg font-bold text-gray-500 dark:text-gray-400 cursor-not-allowed border border-gray-100 dark:border-neutral-800">
                        {selectedMachine.engineHours} h
                      </div>
                  </div>
                </div>

                <div>
                    <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Nota Rápida</label>
                    <input 
                      type="text" 
                      value={logDesc}
                      onChange={(e) => setLogDesc(e.target.value)}
                      className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl text-sm dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                      placeholder={logType === 'fuel' ? 'Opcional (ex: Bomba A)' : 'Descrição do serviço realizado...'}
                    />
                </div>

                <button 
                  onClick={handleAddLog}
                  disabled={logType === 'fuel' && (!logLiters || parseFloat(logLiters) <= 0)}
                  className={`w-full py-5 rounded-[1.5rem] font-bold text-xl shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2 mt-2 ${
                     logType === 'fuel' && (!logLiters || parseFloat(logLiters) <= 0)
                       ? 'bg-gray-300 dark:bg-neutral-800 text-gray-500 cursor-not-allowed'
                       : 'bg-agro-green text-white'
                  }`}
                 >
                   <CheckCircle2 size={24} />
                   Confirmar
                 </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Add Machine Modal Logic */}
      {isAddModalOpen && machines.length > 0 && renderAddMachineModal()}

    </div>
  );
};

export default MachineManager;