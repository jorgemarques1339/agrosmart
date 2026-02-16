
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Tractor, Wrench, Fuel, Calendar, Clock, AlertTriangle, 
  CheckCircle2, Plus, X, Gauge, Truck, Activity, Droplets, Save,
  MoreHorizontal, ChevronRight, GaugeCircle, Filter, FileText, History,
  ArrowRight
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
  // State for Input Modals (Action Sheets)
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [modalType, setModalType] = useState<'hours' | 'maintenance' | null>(null);
  
  // State for Detail View (The "Weather Widget" style modal)
  const [detailMachine, setDetailMachine] = useState<Machine | null>(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
      onModalChange(!!selectedMachine || isAddModalOpen || !!detailMachine);
    }
  }, [selectedMachine, isAddModalOpen, detailMachine, onModalChange]);

  const openActionModal = (machine: Machine, type: 'hours' | 'maintenance') => {
    setSelectedMachine(machine);
    setModalType(type);
    setNewHours(machine.engineHours.toString());
    setLogType(type === 'hours' ? 'other' : 'fuel');
    setLogDesc('');
    setLogCost('');
    setLogLiters('');
  };

  const closeActionModal = () => {
    setSelectedMachine(null);
    setModalType(null);
  };

  const handleUpdateHours = () => {
    if (selectedMachine && newHours) {
      onUpdateHours(selectedMachine.id, parseFloat(newHours));
      closeActionModal();
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
      closeActionModal();
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
      setIsAddModalOpen(false);
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
    <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 md:p-4" onClick={() => setIsAddModalOpen(false)}>
      <div 
        className="bg-white dark:bg-neutral-900 w-full md:max-w-2xl h-[92vh] md:h-auto md:max-h-[85vh] p-6 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl animate-slide-up border-t border-white/20 overflow-y-auto custom-scrollbar" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
             <h3 className="text-2xl font-black dark:text-white leading-none">Nova Máquina</h3>
             <p className="text-xs font-bold text-gray-400 uppercase mt-1">Registo de Equipamento</p>
          </div>
          <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full active:scale-90 transition-transform">
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

        {/* Compact Fleet Status */}
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

      {/* 2. Compact Machine Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-1">
        {filteredMachines.map(machine => {
          const health = calculateHealth(machine);
          const needsService = health.isOverdue || health.isApproaching;
          
          return (
            <div 
              key={machine.id}
              onClick={() => setDetailMachine(machine)}
              className="bg-white dark:bg-neutral-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-neutral-800 p-4 active:scale-[0.99] transition-transform duration-300 cursor-pointer relative"
            >
              {/* Status Dot (Top Right) */}
              <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${needsService ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>

              <div className="flex items-center gap-3 mb-3">
                 <div className="w-12 h-12 bg-gray-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center text-gray-500 dark:text-gray-400">
                    {getMachineIcon(machine.type)}
                 </div>
                 <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white leading-tight truncate">{machine.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                       <span className="text-[10px] font-bold text-gray-500 bg-gray-50 dark:bg-neutral-800 px-1.5 py-0.5 rounded uppercase tracking-wide">
                         {machine.plate}
                       </span>
                    </div>
                 </div>
              </div>

              {/* Stats Row */}
              <div className="flex justify-between items-center mb-4">
                 <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-gray-400 uppercase">Próxima Revisão</span>
                    <span className={`text-xs font-bold ${needsService ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                       {health.hoursRemaining > 0 ? `${health.hoursRemaining}h Restantes` : `${Math.abs(health.hoursRemaining)}h Atraso`}
                    </span>
                 </div>
              </div>

              {/* Compact Buttons */}
              <div className="flex gap-2">
                 <button 
                   onClick={(e) => { e.stopPropagation(); openActionModal(machine, 'hours'); }}
                   className="flex-1 py-2 bg-gray-100 dark:bg-neutral-800 rounded-xl text-[10px] font-bold text-gray-600 dark:text-gray-300 flex items-center justify-center gap-1 active:bg-gray-200 dark:active:bg-neutral-700"
                 >
                    <Clock size={12} /> Horas
                 </button>
                 <button 
                   onClick={(e) => { e.stopPropagation(); openActionModal(machine, 'maintenance'); }}
                   className="flex-1 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 active:scale-95 shadow-sm"
                 >
                    <Fuel size={12} /> Abastecer
                 </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- DETAIL MACHINE MODAL (The "Weather Style" Full View) --- */}
      {detailMachine && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4" onClick={() => setDetailMachine(null)}>
           <div 
             className="bg-white dark:bg-neutral-900 w-full max-w-sm h-[85vh] rounded-[2.5rem] shadow-2xl animate-scale-up border border-white/20 flex flex-col overflow-hidden relative" 
             onClick={e => e.stopPropagation()}
           >
              {/* Header com Gradiente */}
              <div className={`px-6 pt-8 pb-6 bg-gradient-to-br ${
                 calculateHealth(detailMachine).isOverdue 
                   ? 'from-red-500 to-red-700' 
                   : 'from-gray-800 to-black'
              } text-white relative shrink-0`}>
                 
                 <button 
                   onClick={() => setDetailMachine(null)}
                   className="absolute top-6 right-6 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
                 >
                   <X size={20} />
                 </button>

                 <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner text-white">
                       {getMachineIcon(detailMachine.type)}
                    </div>
                    <div>
                       <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{detailMachine.brand} {detailMachine.model}</span>
                       <h2 className="text-2xl font-black leading-none mt-1">{detailMachine.name}</h2>
                       <div className="inline-block mt-2 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                          {detailMachine.plate}
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                       <p className="text-[10px] font-bold uppercase opacity-70">Total Horas</p>
                       <p className="text-xl font-black">{detailMachine.engineHours} h</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                       <p className="text-[10px] font-bold uppercase opacity-70">Próx. Inspeção</p>
                       <p className="text-sm font-bold flex items-center gap-1 mt-1">
                          <Calendar size={12} /> {new Date(detailMachine.nextInspectionDate).toLocaleDateString()}
                       </p>
                    </div>
                 </div>
              </div>

              {/* Corpo com Scroll */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-gray-50 dark:bg-neutral-900">
                 
                 {/* Barra de Saúde */}
                 <div className="bg-white dark:bg-neutral-800 p-5 rounded-3xl shadow-sm">
                    <div className="flex justify-between items-end mb-2">
                       <h4 className="text-xs font-bold text-gray-500 uppercase">Ciclo de Manutenção</h4>
                       <span className={`text-xs font-bold ${calculateHealth(detailMachine).isOverdue ? 'text-red-500' : 'text-green-500'}`}>
                          {calculateHealth(detailMachine).hoursRemaining > 0 ? 'Regular' : 'Atrasado'}
                       </span>
                    </div>
                    <div className="h-3 w-full bg-gray-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                       <div 
                          className={`h-full rounded-full ${calculateHealth(detailMachine).isOverdue ? 'bg-red-500' : 'bg-agro-green'}`}
                          style={{ width: `${calculateHealth(detailMachine).progress}%` }}
                       ></div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 text-right">
                       Faltam {calculateHealth(detailMachine).hoursRemaining}h para revisão das {detailMachine.lastServiceHours + detailMachine.serviceInterval}h
                    </p>
                 </div>

                 {/* Histórico */}
                 <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                       <History size={16} /> Histórico Recente
                    </h4>
                    <div className="space-y-3">
                       {detailMachine.logs && detailMachine.logs.length > 0 ? (
                          detailMachine.logs.slice().reverse().map(log => (
                             <div key={log.id} className="bg-white dark:bg-neutral-800 p-3 rounded-2xl flex items-center gap-3 shadow-sm">
                                <div className={`p-2 rounded-xl shrink-0 ${
                                   log.type === 'fuel' ? 'bg-blue-100 text-blue-600' : 
                                   log.type === 'repair' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                                }`}>
                                   {log.type === 'fuel' ? <Fuel size={16} /> : <Wrench size={16} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                   <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{log.description}</p>
                                   <p className="text-[10px] text-gray-400">{log.date} • {log.engineHoursAtLog}h</p>
                                </div>
                                {log.cost > 0 && (
                                   <span className="text-xs font-black text-gray-900 dark:text-white">{log.cost}€</span>
                                )}
                             </div>
                          ))
                       ) : (
                          <p className="text-center text-xs text-gray-400 py-4 italic">Sem registos.</p>
                       )}
                    </div>
                 </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 flex gap-3 shrink-0">
                 <button 
                   onClick={() => openActionModal(detailMachine, 'hours')}
                   className="flex-1 py-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl text-gray-600 dark:text-white font-bold text-sm flex items-center justify-center gap-2"
                 >
                    <Clock size={18} /> + Horas
                 </button>
                 <button 
                   onClick={() => openActionModal(detailMachine, 'maintenance')}
                   className="flex-1 py-4 bg-agro-green text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-agro-green/30"
                 >
                    <Plus size={18} /> Registo
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* --- ACTION INPUT MODAL (BottomSheet) --- */}
      {selectedMachine && (
        <div className="fixed inset-0 z-[160] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={closeActionModal}>
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
              <button onClick={closeActionModal} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
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
