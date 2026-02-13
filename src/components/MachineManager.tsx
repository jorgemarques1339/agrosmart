
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Tractor, Wrench, Fuel, Calendar, Clock, AlertTriangle, 
  CheckCircle2, Plus, X, Gauge, Truck, Activity, Droplets, Save
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

  // New Machine Form State
  const [newMachineData, setNewMachineData] = useState<Partial<Machine>>({
    type: 'tractor',
    engineHours: 0,
    serviceInterval: 500,
    fuelLevel: 100,
    status: 'active',
    nextInspectionDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // +1 ano default
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
    setLogType(type === 'hours' ? 'other' : 'fuel'); // Defalut to fuel for maintenance
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
      
      // Basic validation for fuel
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

  const getMachineIcon = (type: string) => {
    switch (type) {
      case 'tractor': return <Tractor size={28} />;
      case 'vehicle': return <Truck size={28} />;
      default: return <Gauge size={28} />;
    }
  };

  const calculateHealth = (m: Machine) => {
    const hoursSinceService = m.engineHours - m.lastServiceHours;
    const progress = Math.min((hoursSinceService / m.serviceInterval) * 100, 100);
    const isOverdue = hoursSinceService > m.serviceInterval;
    
    // Predictive: Warning if less than 50 hours remaining
    const hoursRemaining = m.serviceInterval - hoursSinceService;
    const isApproaching = hoursRemaining > 0 && hoursRemaining <= 50;
    
    // Inspeção a menos de 15 dias (conforme requisito)
    const daysUntilInspection = Math.ceil((new Date(m.nextInspectionDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const isInspectionDue = daysUntilInspection <= 15;

    return { hoursSinceService, progress, isOverdue, isApproaching, isInspectionDue, daysUntilInspection };
  };

  // Dashboard Metrics
  const metrics = useMemo(() => {
    const total = machines.length;
    const active = machines.filter(m => m.status === 'active').length;
    const maintenanceDue = machines.filter(m => {
       const h = calculateHealth(m);
       return h.isOverdue || h.isInspectionDue || h.isApproaching;
    }).length;
    
    return { total, active, maintenanceDue };
  }, [machines]);

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

  function renderAddMachineModal() {
    return (
      <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-0 md:p-4" onClick={closeModal}>
        <div 
          className="bg-white dark:bg-neutral-900 w-full md:max-w-2xl h-[92vh] md:h-auto md:max-h-[85vh] p-6 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl animate-slide-up border-t border-white/20 overflow-y-auto custom-scrollbar" 
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6 sticky top-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm z-10 py-2">
            <div>
               <h3 className="text-2xl font-black dark:text-white leading-none">Nova Máquina</h3>
               <p className="text-xs font-bold text-gray-400 uppercase mt-1">Registo de Equipamento</p>
            </div>
            <button onClick={closeModal} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full active:scale-90 transition-transform">
              <X size={24} className="dark:text-white" />
            </button>
          </div>

          <div className="space-y-6 pb-8">
            {/* Tipo - Visual Selector Grid */}
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

            {/* Dados Base - Responsive Grid */}
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

            {/* Dados Técnicos - Group Box */}
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
  }

  return (
    <div className="space-y-6 animate-fade-in pt-4 pb-24">
      
      {/* 1. Header & Title */}
      <div className="flex justify-between items-end px-2">
        <div>
          <h2 className="text-2xl font-black italic text-gray-900 dark:text-white leading-none">Gestão de<br/>Frota</h2>
          <p className="text-sm text-gray-500 font-medium tracking-wide mt-2 flex items-center gap-1">
             <Tractor size={14} /> Máquinas & Equipamentos
          </p>
        </div>
        
        {/* Add Button */}
        <div className="flex flex-col items-center gap-1">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-12 h-12 bg-agro-green text-white rounded-full flex items-center justify-center shadow-lg shadow-agro-green/30 active:scale-95 transition-transform"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
          <span className="text-[10px] font-bold text-agro-green dark:text-green-400 whitespace-nowrap">Nova Máquina</span>
        </div>
      </div>

      {/* 2. Dashboard Summary Cards */}
      <div className="grid grid-cols-2 gap-3 px-1">
         {/* Card 1: Status Geral */}
         <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-neutral-800 dark:to-neutral-900 rounded-[2rem] p-4 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
               <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Operacional</p>
               <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black">{metrics.active}</span>
                  <span className="text-sm opacity-60">/ {metrics.total}</span>
               </div>
               <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full w-fit">
                  <Activity size={10} /> Em Atividade
               </div>
            </div>
            <Activity className="absolute -right-4 -bottom-4 text-white/5 w-24 h-24 rotate-12" />
         </div>

         {/* Card 2: Alertas de Manutenção */}
         <div className={`rounded-[2rem] p-4 text-white shadow-lg relative overflow-hidden transition-colors ${
            metrics.maintenanceDue > 0 
              ? 'bg-gradient-to-br from-red-600 to-red-700 animate-pulse' 
              : 'bg-gradient-to-br from-agro-green to-green-600'
         }`}>
            <div className="relative z-10">
               <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1">
                 {metrics.maintenanceDue > 0 ? 'Atenção Necessária' : 'Tudo OK'}
               </p>
               <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black">{metrics.maintenanceDue}</span>
                  <span className="text-sm opacity-80">alertas</span>
               </div>
               <div className="mt-2 flex items-center gap-1 text-[10px] font-bold bg-white/20 px-2 py-1 rounded-full w-fit">
                  {metrics.maintenanceDue > 0 ? <AlertTriangle size={10} /> : <CheckCircle2 size={10} />}
                  {metrics.maintenanceDue > 0 ? 'Agendar Serviço' : 'Frota Saudável'}
               </div>
            </div>
            <Wrench className="absolute -right-4 -bottom-4 text-white/10 w-24 h-24 rotate-12" />
         </div>
      </div>

      {/* 3. Lista de Máquinas (Cards Premium) */}
      <div className="space-y-4">
        {machines.map(machine => {
          const health = calculateHealth(machine);
          const needsOilChange = health.hoursSinceService > machine.serviceInterval;
          
          return (
            <div 
              key={machine.id}
              className={`bg-white dark:bg-neutral-900 rounded-[2.5rem] p-1 shadow-sm border transition-all duration-300 ${
                health.isOverdue || health.isInspectionDue 
                  ? 'border-red-500 shadow-red-500/20 ring-1 ring-red-500' 
                  : 'border-gray-100 dark:border-neutral-800'
              }`}
            >
              <div className="p-5 pb-2">
                {/* Header do Card */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-neutral-800 rounded-2xl flex items-center justify-center text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-neutral-700">
                      {getMachineIcon(machine.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight">{machine.name}</h3>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-1">{machine.brand} • {machine.model}</p>
                      <span className="inline-block mt-2 bg-gray-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-gray-500 border border-gray-200 dark:border-neutral-700">
                        {machine.plate}
                      </span>
                    </div>
                  </div>
                  
                  {/* Status Badges */}
                  <div className="flex flex-col gap-1 items-end">
                    {health.isInspectionDue && (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded-full animate-pulse">
                        <Calendar size={10} /> Inspeção {health.daysUntilInspection}d
                      </span>
                    )}
                    {needsOilChange && (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-full animate-pulse">
                        <Droplets size={10} /> Mudar Óleo
                      </span>
                    )}
                    {health.isApproaching && !needsOilChange && (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-full">
                         <Clock size={10} /> Brevemente
                      </span>
                    )}
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Fuel / Hours */}
                  <div className="bg-gray-50 dark:bg-neutral-800/50 p-3 rounded-2xl border border-gray-100 dark:border-neutral-800">
                     <p className="text-[10px] font-bold uppercase text-gray-400 mb-1 flex items-center gap-1">
                       <Clock size={10} /> Motor
                     </p>
                     <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                       {machine.engineHours.toLocaleString()} <span className="text-sm font-medium text-gray-400">h</span>
                     </p>
                  </div>

                  {/* Service Progress */}
                  <div className="bg-gray-50 dark:bg-neutral-800/50 p-3 rounded-2xl border border-gray-100 dark:border-neutral-800 relative overflow-hidden">
                     <div className="flex justify-between items-center mb-2">
                        <p className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                          <Wrench size={10} /> Revisão
                        </p>
                        <span className={`text-[10px] font-bold ${needsOilChange ? 'text-red-500' : 'text-gray-500'}`}>
                          {Math.max(0, machine.serviceInterval - health.hoursSinceService)}h restam
                        </span>
                     </div>
                     <div className="w-full bg-gray-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
                       <div 
                          className={`h-full transition-all duration-500 ${health.progress > 90 ? 'bg-red-500' : 'bg-agro-green'}`} 
                          style={{ width: `${health.progress}%` }}
                       ></div>
                     </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons (Full Width Bottom) */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-gray-50 dark:bg-neutral-800/30 rounded-b-[2.5rem]">
                <button 
                  onClick={() => openModal(machine, 'hours')}
                  className="py-4 rounded-bl-[2rem] rounded-tr-xl bg-white dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-200 font-bold text-sm flex items-center justify-center gap-2 transition-colors active:bg-gray-200"
                >
                  <Clock size={18} className="text-gray-400" />
                  Registar Horas
                </button>
                <button 
                  onClick={() => openModal(machine, 'maintenance')}
                  className="py-4 rounded-br-[2rem] rounded-tl-xl bg-agro-green text-white font-bold text-sm flex items-center justify-center gap-2 active:bg-green-800 transition-colors shadow-inner"
                >
                  <Fuel size={18} />
                  Abastecer
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Actions */}
      {selectedMachine && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={closeModal}>
          <div 
            className="bg-white dark:bg-neutral-900 w-full max-w-md p-6 rounded-t-[2.5rem] shadow-2xl animate-slide-up border-t border-white/20" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold dark:text-white">
                  {modalType === 'hours' ? 'Atualizar Horas' : 'Registo Técnico'}
                </h3>
                <p className="text-xs text-gray-500 font-bold uppercase">{selectedMachine.name}</p>
              </div>
              <button onClick={closeModal} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                <X size={20} className="dark:text-white" />
              </button>
            </div>

            {modalType === 'hours' ? (
              <div className="space-y-6">
                 <div className="flex items-center gap-4 bg-gray-50 dark:bg-neutral-800 p-4 rounded-[2rem]">
                   <button 
                      onClick={() => setNewHours((parseFloat(newHours || '0') - 1).toString())}
                      className="w-16 h-16 bg-white dark:bg-neutral-700 rounded-2xl shadow-sm flex items-center justify-center text-gray-600 active:scale-90 transition-transform"
                   >
                     <span className="text-2xl font-bold">-</span>
                   </button>
                   <div className="flex-1 text-center">
                     <input 
                        type="number"
                        className="bg-transparent text-center text-4xl font-black text-gray-900 dark:text-white outline-none w-full"
                        value={newHours}
                        onChange={(e) => setNewHours(e.target.value)}
                     />
                     <span className="text-xs font-bold text-gray-400 uppercase">Horas Totais</span>
                   </div>
                   <button 
                      onClick={() => setNewHours((parseFloat(newHours || '0') + 1).toString())}
                      className="w-16 h-16 bg-agro-green rounded-2xl shadow-lg shadow-agro-green/30 flex items-center justify-center text-white active:scale-90 transition-transform"
                   >
                     <span className="text-2xl font-bold">+</span>
                   </button>
                 </div>
                 <button 
                  onClick={handleUpdateHours}
                  className="w-full py-5 bg-agro-green text-white rounded-[1.5rem] font-bold text-xl shadow-lg active:scale-95 transition-transform"
                 >
                   Guardar Leitura
                 </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Selector Tipo */}
                <div className="grid grid-cols-3 gap-2">
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
                          ? 'bg-agro-green/10 border-agro-green text-agro-green' 
                          : 'bg-gray-50 dark:bg-neutral-800 border-transparent text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <t.icon size={24} className="mb-1" />
                      <span className="text-[10px] font-bold uppercase">{t.label}</span>
                    </button>
                  ))}
                </div>

                {logType === 'fuel' && (
                  <div className={`bg-gray-50 dark:bg-neutral-800 p-4 rounded-3xl border transition-all ${isFuelInsufficient ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : 'border-gray-100 dark:border-neutral-700'}`}>
                    <label className="text-xs font-bold uppercase text-gray-400 ml-2">Litros de Combustível</label>
                    <div className="relative mt-2">
                      <input 
                        type="number" 
                        value={logLiters}
                        onChange={(e) => setLogLiters(e.target.value)}
                        className="w-full p-4 bg-white dark:bg-neutral-700 rounded-2xl text-3xl font-black dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                        placeholder="0"
                        autoFocus
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">L</span>
                    </div>
                    
                    {/* Fuel Integration Feedback */}
                    <div className="mt-3 flex items-center justify-between px-2">
                       <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <AlertTriangle size={10} /> Será descontado do Stock
                       </span>
                       <span className={`text-[10px] font-bold ${isFuelInsufficient ? 'text-red-500' : 'text-green-600'}`}>
                          Disponível: {fuelStockAvailable} L
                       </span>
                    </div>
                    {isFuelInsufficient && (
                       <p className="text-xs text-red-500 font-bold mt-2 text-center animate-pulse">
                          Atenção: Stock insuficiente!
                       </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-xs font-bold uppercase text-gray-400 ml-2">Custo (€)</label>
                      <input 
                        type="number" 
                        value={logCost}
                        onChange={(e) => setLogCost(e.target.value)}
                        className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl mt-1 text-lg font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                        placeholder="0.00"
                      />
                  </div>
                  <div>
                      <label className="text-xs font-bold uppercase text-gray-400 ml-2">Horas</label>
                      <div className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl mt-1 text-lg font-bold text-gray-500 dark:text-gray-400 cursor-not-allowed">
                        {selectedMachine.engineHours} h
                      </div>
                  </div>
                </div>

                <div>
                    <label className="text-xs font-bold uppercase text-gray-400 ml-2">Notas</label>
                    <input 
                      type="text" 
                      value={logDesc}
                      onChange={(e) => setLogDesc(e.target.value)}
                      className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl mt-1 text-sm dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                      placeholder={logType === 'fuel' ? 'Opcional' : 'Descrição do serviço realizado...'}
                    />
                </div>

                <button 
                  onClick={handleAddLog}
                  className="w-full py-5 bg-agro-green text-white rounded-[1.5rem] font-bold text-xl shadow-lg active:scale-95 transition-transform mt-4 flex items-center justify-center gap-2"
                 >
                   <CheckCircle2 size={24} />
                   Registar {logType === 'fuel' ? 'Abastecimento' : 'Manutenção'}
                 </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Add Machine Modal Logic when list is present */}
      {isAddModalOpen && machines.length > 0 && renderAddMachineModal()}

    </div>
  );
};

export default MachineManager;