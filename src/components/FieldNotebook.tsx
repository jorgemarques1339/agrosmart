
import React, { useState, useMemo } from 'react';
import { 
  FileText, Download, Calendar, Filter, 
  CheckCircle2, Printer, X, Droplets, Sprout, 
  AlertTriangle, Loader2, ChevronRight, Search, ShieldCheck,
  Syringe, Bug, User, Scale, ArrowRight, ShieldAlert, BookOpen,
  Package, Users, Clock, Coins
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Field, FieldLog, StockItem, Employee } from '../types';

interface FieldNotebookProps {
  isOpen: boolean;
  onClose: () => void;
  fields: Field[];
  stocks: StockItem[];
  employees: Employee[]; // New prop
  operatorName: string;
  onSave: (fieldId: string, log: Omit<FieldLog, 'id'>, stockId?: string) => void;
}

// --- CONSTANTES ---
const OPERATION_TYPES = [
  { id: 'treatment', label: 'Fitossanitário', icon: Syringe, color: 'text-red-600', bg: 'bg-red-100' },
  { id: 'fertilization', label: 'Fertilização', icon: Sprout, color: 'text-green-600', bg: 'bg-green-100' },
  { id: 'labor', label: 'Mão de Obra', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' }, 
  // Harvest removed as requested
  { id: 'observation', label: 'Observação', icon: Search, color: 'text-gray-600', bg: 'bg-gray-100' },
];

const FieldNotebook: React.FC<FieldNotebookProps> = ({ 
  isOpen, 
  onClose, 
  fields,
  stocks,
  employees,
  operatorName,
  onSave
}) => {
  // Alterado default para 'entry' (Novo Registo Tecnico)
  const [activeTab, setActiveTab] = useState<'records' | 'entry'>('entry');
  const [selectedFieldId, setSelectedFieldId] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [isGenerating, setIsGenerating] = useState(false);

  // --- WIZARD STATE ---
  const [step, setStep] = useState(1);
  const [entryType, setEntryType] = useState<string>('');
  const [selectedStockId, setSelectedStockId] = useState<string>(''); // Novo estado para stock
  const [entryData, setEntryData] = useState<Partial<FieldLog>>({
    date: new Date().toISOString().split('T')[0],
    operator: operatorName
  });
  // Dedicated state for the field selected inside the wizard (distinct from the filter 'selectedFieldId')
  const [wizardFieldId, setWizardFieldId] = useState<string>('');

  // --- SAFETY CHECK ENGINE ---
  // Verifica se há algum intervalo de segurança ativo para o campo selecionado
  const safetyStatus = useMemo(() => {
    if (selectedFieldId === 'all') return null;
    
    const field = fields.find(f => f.id === selectedFieldId);
    if (!field) return null;

    // Encontrar tratamentos com IS ativo
    const activeLock = field.logs
      .filter(l => l.type === 'treatment' && l.safetyDays && l.safetyDays > 0)
      .map(l => {
        const appDate = new Date(l.date);
        const unlockDate = new Date(appDate);
        unlockDate.setDate(appDate.getDate() + (l.safetyDays || 0));
        
        const daysLeft = Math.ceil((unlockDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        
        return {
          product: l.productName || l.description,
          unlockDate,
          daysLeft
        };
      })
      .filter(lock => lock.daysLeft > 0)
      .sort((a, b) => b.daysLeft - a.daysLeft)[0]; // Pegar o mais restritivo

    return activeLock;
  }, [fields, selectedFieldId]);

  // --- FILTRAGEM DE LOGS ---
  const filteredLogs = useMemo(() => {
    let logs: (FieldLog & { fieldName: string })[] = [];
    
    fields.forEach(f => {
      if (selectedFieldId !== 'all' && f.id !== selectedFieldId) return;
      
      f.logs.forEach(l => {
        if (l.date.startsWith(selectedMonth)) {
          logs.push({ ...l, fieldName: f.name });
        }
      });
    });

    return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [fields, selectedFieldId, selectedMonth]);

  // --- HANDLERS ---
  const handleWizardSubmit = () => {
    if (wizardFieldId && entryData.type) {
      // 1. Chamar a função de save do componente pai (agora com stockId opcional)
      onSave(wizardFieldId, {
        date: entryData.date || new Date().toISOString().split('T')[0],
        type: entryData.type as any,
        description: entryData.description || `Operação: ${OPERATION_TYPES.find(t=>t.id===entryType)?.label}`,
        operator: entryData.operator || operatorName,
        // Optional Fields
        productName: entryData.productName,
        apv: entryData.apv,
        quantity: entryData.quantity,
        unit: entryData.unit,
        safetyDays: entryData.safetyDays,
        target: entryData.target,
        cost: entryData.cost, // Passar custo calculado se existir
        // Labor Fields
        employeeId: entryData.employeeId,
        hoursWorked: entryData.hoursWorked,
        hourlyRate: entryData.hourlyRate
      }, selectedStockId || undefined);

      // 2. Reset UI
      setStep(1);
      setEntryType('');
      setEntryData({ date: new Date().toISOString().split('T')[0], operator: operatorName });
      setWizardFieldId('');
      setSelectedStockId('');
      setActiveTab('records'); // Volta para a lista para ver o novo registo
    }
  };

  const generatePDF = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("REGISTO DE OPERAÇÕES CULTURAIS", 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Operador: ${operatorName}`, 14, 35);
      doc.text(`Data: ${new Date().toLocaleDateString()}`, 14, 40);

      // Table
      const rows = filteredLogs.map(log => [
        log.date,
        log.fieldName,
        log.type.toUpperCase(),
        log.productName || log.description,
        log.apv || (log.hoursWorked ? `${log.hoursWorked}h` : '-'),
        log.quantity ? `${log.quantity} ${log.unit}` : (log.cost ? `${log.cost}€` : '-'),
        log.operator || '-'
      ]);

      autoTable(doc, {
        startY: 50,
        head: [['Data', 'Parcela', 'Tipo', 'Produto / Info', 'APV / Horas', 'Qtd / Custo', 'Operador']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [40, 100, 40] },
        styles: { fontSize: 8 }
      });

      // Footer
      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.text("Assinatura: __________________________", 14, finalY);

      doc.save(`Caderno_Campo_${selectedMonth}.pdf`);
      setIsGenerating(false);
    }, 1000);
  };

  // Helper para filtrar stocks baseados no tipo de operação
  const getRelevantStocks = () => {
    if (entryType === 'treatment') return stocks.filter(s => s.category === 'Fito');
    if (entryType === 'fertilization') return stocks.filter(s => s.category === 'Fertilizante');
    return [];
  };

  const handleStockSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = e.target.value;
    setSelectedStockId(sId);
    
    if (sId) {
      const stockItem = stocks.find(s => s.id === sId);
      if (stockItem) {
        setEntryData(prev => ({
          ...prev,
          productName: stockItem.name,
          unit: stockItem.unit,
          // Se tiver quantidade preenchida, recalcula o custo logo
          cost: prev.quantity ? prev.quantity * stockItem.pricePerUnit : 0
        }));
      }
    } else {
      // Reset se limpar seleção
      setEntryData(prev => ({ ...prev, productName: '', unit: '' }));
    }
  };

  // Handler para seleção de funcionário
  const handleEmployeeSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const empId = e.target.value;
    const employee = employees.find(emp => emp.id === empId);
    
    if (employee) {
      setEntryData(prev => ({
        ...prev,
        employeeId: employee.id,
        operator: employee.name, // Auto-fill operator name
        hourlyRate: employee.hourlyRate,
        description: `Mão de Obra: ${employee.name}`,
        // Recalculate cost if hours exist
        cost: prev.hoursWorked ? prev.hoursWorked * employee.hourlyRate : 0
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 w-full md:max-w-4xl h-[95vh] md:h-[90vh] md:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* --- HEADER --- */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md sticky top-0 z-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white leading-none">Caderno de Campo</h2>
              <p className="text-xs text-gray-500 font-bold mt-1">Registo Oficial & Conformidade</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
            <X size={20} className="dark:text-white" />
          </button>
        </div>

        {/* --- SAFETY ALERT BANNER --- */}
        {safetyStatus && (
          <div className="bg-red-500 text-white px-6 py-3 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <ShieldAlert size={24} fill="white" className="text-red-500" />
              <div>
                <p className="font-black text-sm uppercase">Intervalo de Segurança Ativo</p>
                <p className="text-xs opacity-90">
                  Colheita interdita por <strong>{safetyStatus.daysLeft} dias</strong> ({safetyStatus.product}).
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase opacity-80">Desbloqueio</p>
              <p className="font-mono font-bold">{safetyStatus.unlockDate.toLocaleDateString()}</p>
            </div>
          </div>
        )}

        {/* --- TABS --- */}
        <div className="px-6 pt-4 pb-2 bg-gray-50 dark:bg-neutral-900/50 flex gap-2">
          <button 
            onClick={() => setActiveTab('entry')}
            className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wide transition-all ${activeTab === 'entry' ? 'bg-white dark:bg-neutral-800 shadow text-agro-green' : 'text-gray-400 hover:bg-white/50'}`}
          >
            Novo Registo Técnico
          </button>
          <button 
            onClick={() => setActiveTab('records')}
            className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-wide transition-all ${activeTab === 'records' ? 'bg-white dark:bg-neutral-800 shadow text-agro-green' : 'text-gray-400 hover:bg-white/50'}`}
          >
            Histórico & Relatórios
          </button>
        </div>

        {/* --- CONTENT --- */}
        <div className="flex-1 overflow-y-auto bg-gray-50/30 dark:bg-neutral-900 p-6 custom-scrollbar">
          
          {/* VIEW: RECORDS */}
          {activeTab === 'records' && (
            <div className="space-y-6">
              
              {/* Filtros */}
              <div className="flex gap-4 mb-4">
                <div className="flex-1 relative">
                   <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                   <input 
                     type="month" 
                     value={selectedMonth} 
                     onChange={(e) => setSelectedMonth(e.target.value)}
                     className="w-full pl-12 p-3 bg-white dark:bg-neutral-800 rounded-2xl text-sm font-bold shadow-sm outline-none dark:text-white"
                   />
                </div>
                <div className="flex-1 relative">
                   <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                   <select 
                     value={selectedFieldId} 
                     onChange={(e) => setSelectedFieldId(e.target.value)}
                     className="w-full pl-12 p-3 bg-white dark:bg-neutral-800 rounded-2xl text-sm font-bold shadow-sm outline-none appearance-none dark:text-white"
                   >
                     <option value="all">Todos os Campos</option>
                     {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                   </select>
                </div>
              </div>

              {/* Lista */}
              <div className="space-y-3">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-10 opacity-50">
                    <FileText size={48} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-bold text-gray-400">Sem registos neste período.</p>
                  </div>
                ) : (
                  filteredLogs.map((log, idx) => {
                    const opType = OPERATION_TYPES.find(t => t.id === log.type) || { label: 'Outro', bg: 'bg-gray-100', color: 'text-gray-600', icon: Search };
                    const Icon = opType.icon;
                    
                    return (
                      <div key={idx} className="bg-white dark:bg-neutral-800 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-700 flex gap-4 items-start">
                         <div className={`p-3 rounded-2xl shrink-0 ${opType.bg} ${opType.color}`}>
                           <Icon size={20} />
                         </div>
                         <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-start">
                             <h4 className="font-bold text-gray-900 dark:text-white text-sm">{log.productName || log.description}</h4>
                             <span className="text-[10px] font-mono font-bold bg-gray-100 dark:bg-neutral-700 px-2 py-1 rounded text-gray-500">{log.date}</span>
                           </div>
                           <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{log.fieldName} • {opType.label}</p>
                           
                           {/* Chips Técnicos */}
                           <div className="flex flex-wrap gap-2 mt-2">
                             {log.cost !== undefined && log.cost > 0 && (
                               <span className="text-[9px] font-bold uppercase bg-gray-100 dark:bg-neutral-700 text-gray-500 px-2 py-0.5 rounded">
                                 {log.cost.toFixed(2)}€
                               </span>
                             )}
                             
                             {log.type === 'labor' && log.hoursWorked && (
                               <span className="text-[9px] font-bold uppercase bg-purple-50 dark:bg-purple-900/20 text-purple-600 px-2 py-0.5 rounded flex items-center gap-1">
                                 <Clock size={10} /> {log.hoursWorked}h
                               </span>
                             )}

                             {log.apv && (
                               <span className="text-[9px] font-bold uppercase border border-gray-200 dark:border-neutral-600 px-2 py-0.5 rounded text-gray-500">
                                 APV: {log.apv}
                               </span>
                             )}
                             {log.quantity && (
                               <span className="text-[9px] font-bold uppercase bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-2 py-0.5 rounded">
                                 {log.quantity} {log.unit}
                               </span>
                             )}
                             {log.safetyDays && log.safetyDays > 0 && (
                               <span className="text-[9px] font-bold uppercase bg-red-50 dark:bg-red-900/20 text-red-600 px-2 py-0.5 rounded flex items-center gap-1">
                                 <ShieldAlert size={10} /> IS: {log.safetyDays} Dias
                               </span>
                             )}
                           </div>
                         </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* VIEW: WIZARD ENTRY */}
          {activeTab === 'entry' && (
            <div className="max-w-xl mx-auto h-full flex flex-col">
              
              {/* Steps Progress */}
              <div className="flex items-center justify-between mb-8 px-4">
                 {[1, 2, 3].map(s => (
                   <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                     step >= s ? 'bg-agro-green text-white' : 'bg-gray-200 text-gray-400'
                   }`}>
                     {s}
                   </div>
                 ))}
                 <div className="absolute left-0 right-0 top-10 h-0.5 bg-gray-200 -z-10 mx-10"></div>
              </div>

              {/* STEP 1: TYPE */}
              {step === 1 && (
                <div className="flex-1 animate-slide-up">
                  <h3 className="text-lg font-bold text-center mb-6 dark:text-white">Selecione a Operação</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {OPERATION_TYPES.map(type => (
                      <button 
                        key={type.id}
                        onClick={() => { setEntryType(type.id); setEntryData({...entryData, type: type.id as any}); setStep(2); }}
                        className="flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-transparent bg-white dark:bg-neutral-800 shadow-sm hover:border-agro-green transition-all gap-3 active:scale-95"
                      >
                        <div className={`p-4 rounded-full ${type.bg} ${type.color}`}>
                          <type.icon size={28} />
                        </div>
                        <span className="font-bold text-sm text-gray-700 dark:text-gray-200">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: DETAILS */}
              {step === 2 && (
                <div className="flex-1 space-y-5 animate-slide-up">
                  <h3 className="text-lg font-bold mb-2 dark:text-white flex items-center gap-2">
                    <FileText size={20} /> Detalhes Técnicos
                  </h3>

                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Data</label>
                      <input 
                        type="date" 
                        value={entryData.date}
                        onChange={e => setEntryData({...entryData, date: e.target.value})}
                        className="w-full p-3 bg-white dark:bg-neutral-800 rounded-xl font-bold dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Parcela</label>
                      <select 
                        value={wizardFieldId}
                        className="w-full p-3 bg-white dark:bg-neutral-800 rounded-xl font-bold dark:text-white outline-none"
                        onChange={e => {
                           setWizardFieldId(e.target.value);
                           const fieldName = e.target.options[e.target.selectedIndex].text;
                           // Only set default description if not already set by labor logic and NOT observation
                           if (entryType !== 'labor' && entryType !== 'observation') {
                             setEntryData(prev => ({...prev, description: `Aplicação em ${fieldName}`}));
                           }
                        }}
                      >
                        <option value="">Selecione...</option>
                        {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* LABOR SPECIFIC INPUTS */}
                  {entryType === 'labor' && (
                    <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/30 space-y-4">
                       <h4 className="text-xs font-bold text-purple-600 uppercase flex items-center gap-1"><Users size={12} /> Registo de Horas</h4>
                       
                       {/* Employee Selector */}
                       <div>
                          <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Funcionário</label>
                          <select 
                            className="w-full p-3 rounded-xl text-sm font-bold outline-none bg-white dark:bg-neutral-800 dark:text-white"
                            onChange={handleEmployeeSelection}
                            value={entryData.employeeId || ''}
                          >
                            <option value="">Selecione...</option>
                            {employees.map(emp => (
                              <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                            ))}
                          </select>
                       </div>

                       <div className="grid grid-cols-2 gap-3">
                          <div>
                             <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Horas</label>
                             <input 
                               type="number"
                               placeholder="0.0"
                               className="w-full p-3 rounded-xl text-sm font-bold outline-none bg-white dark:bg-neutral-800 dark:text-white"
                               value={entryData.hoursWorked || ''}
                               onChange={e => {
                                 const hrs = parseFloat(e.target.value);
                                 setEntryData(prev => ({
                                   ...prev,
                                   hoursWorked: hrs,
                                   cost: hrs * (prev.hourlyRate || 0)
                                 }));
                               }}
                             />
                          </div>
                          <div>
                             <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Custo/Hora (€)</label>
                             <input 
                               type="number"
                               placeholder="0.00"
                               className="w-full p-3 rounded-xl text-sm font-bold outline-none bg-white dark:bg-neutral-800 dark:text-white"
                               value={entryData.hourlyRate || ''}
                               onChange={e => {
                                 const rate = parseFloat(e.target.value);
                                 setEntryData(prev => ({
                                   ...prev,
                                   hourlyRate: rate,
                                   cost: (prev.hoursWorked || 0) * rate
                                 }));
                               }}
                             />
                          </div>
                       </div>
                       
                       {entryData.cost !== undefined && entryData.cost > 0 && (
                         <div className="flex justify-between items-center bg-white/50 dark:bg-black/20 p-2 rounded-lg">
                            <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Custo Total Estimado:</span>
                            <span className="font-black text-purple-900 dark:text-white">{entryData.cost.toFixed(2)}€</span>
                         </div>
                       )}
                    </div>
                  )}

                  {/* Stock Selector (New Feature) */}
                  {(entryType === 'treatment' || entryType === 'fertilization') && (
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                       <label className="text-xs font-bold uppercase text-blue-600 mb-2 block flex items-center gap-1">
                          <Package size={12} /> Selecionar do Stock
                       </label>
                       <select 
                         value={selectedStockId}
                         onChange={handleStockSelection}
                         className="w-full p-3 rounded-xl text-sm font-bold outline-none bg-white dark:bg-neutral-800 dark:text-white"
                       >
                         <option value="">Entrada Manual (Sem stock)</option>
                         {getRelevantStocks().map(s => (
                           <option key={s.id} value={s.id} disabled={s.quantity <= 0}>
                             {s.name} (Restam: {s.quantity} {s.unit})
                           </option>
                         ))}
                       </select>
                    </div>
                  )}

                  {/* Product Info (Fitossanitário) */}
                  {entryType === 'treatment' && (
                    <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 space-y-3">
                       <h4 className="text-xs font-bold text-red-600 uppercase flex items-center gap-1"><ShieldAlert size={12} /> Dados Legais Obrigatórios</h4>
                       <div>
                          <input 
                            placeholder="Nome Comercial do Produto"
                            value={entryData.productName || ''}
                            className={`w-full p-3 rounded-xl text-sm font-bold outline-none ${selectedStockId ? 'bg-gray-100 dark:bg-neutral-700' : ''}`}
                            onChange={e => setEntryData({...entryData, productName: e.target.value})}
                            readOnly={!!selectedStockId}
                          />
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                          <input 
                            placeholder="Nº APV"
                            className="w-full p-3 rounded-xl text-sm font-bold outline-none"
                            onChange={e => setEntryData({...entryData, apv: e.target.value})}
                          />
                          <input 
                            type="number"
                            placeholder="IS (Dias)"
                            className="w-full p-3 rounded-xl text-sm font-bold outline-none"
                            onChange={e => setEntryData({...entryData, safetyDays: parseInt(e.target.value)})}
                          />
                       </div>
                       <div>
                          <input 
                            placeholder="Praga / Doença Alvo"
                            className="w-full p-3 rounded-xl text-sm font-bold outline-none"
                            onChange={e => setEntryData({...entryData, target: e.target.value})}
                          />
                       </div>
                    </div>
                  )}

                  {/* Generic Inputs (Hidden for Labor AND Observation) */}
                  {entryType !== 'labor' && entryType !== 'observation' && (
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Quantidade</label>
                          <input 
                            type="number"
                            placeholder="0.0"
                            className="w-full p-3 bg-white dark:bg-neutral-800 rounded-xl font-bold dark:text-white outline-none"
                            onChange={e => {
                              const qty = parseFloat(e.target.value);
                              setEntryData(prev => ({
                                ...prev, 
                                quantity: qty,
                                // Se houver stock selecionado, atualizar custo estimado
                                cost: selectedStockId && stocks.find(s => s.id === selectedStockId) 
                                  ? qty * (stocks.find(s => s.id === selectedStockId)?.pricePerUnit || 0)
                                  : prev.cost
                              }));
                            }}
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Unidade</label>
                          <select 
                            className={`w-full p-3 bg-white dark:bg-neutral-800 rounded-xl font-bold dark:text-white outline-none ${selectedStockId ? 'opacity-70 pointer-events-none' : ''}`}
                            onChange={e => setEntryData({...entryData, unit: e.target.value})}
                            value={entryData.unit || 'L'}
                          >
                            <option value="L">L</option>
                            <option value="Kg">Kg</option>
                            <option value="Un">Un</option>
                          </select>
                       </div>
                    </div>
                  )}

                  {/* OBSERVATION SPECIFIC: NOTE FIELD */}
                  {entryType === 'observation' && (
                    <div className="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-inner">
                       <label className="text-[10px] font-bold uppercase text-gray-400 ml-1 mb-1 block">Nota de Campo</label>
                       <textarea 
                          autoFocus
                          className="w-full p-4 rounded-xl text-sm font-medium bg-white dark:bg-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-agro-green min-h-[120px] resize-none border border-transparent"
                          placeholder="Descreva o que observou (ex: Aparecimento de infestantes...)"
                          value={entryData.description || ''}
                          onChange={e => setEntryData({...entryData, description: e.target.value})}
                       />
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button onClick={() => setStep(1)} className="px-6 py-3 rounded-xl font-bold text-gray-500 bg-gray-200 dark:bg-neutral-700">Voltar</button>
                    <button 
                      onClick={() => setStep(3)} 
                      disabled={!wizardFieldId}
                      className={`flex-1 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 ${!wizardFieldId ? 'bg-gray-300 cursor-not-allowed' : 'bg-agro-green'}`}
                    >
                      Rever <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: REVIEW */}
              {step === 3 && (
                <div className="flex-1 animate-slide-up flex flex-col">
                   <h3 className="text-lg font-bold mb-4 dark:text-white text-center">Confirmar Registo</h3>
                   
                   <div className="bg-white dark:bg-neutral-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-neutral-700 space-y-4 mb-6">
                      <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-neutral-700">
                         <div className="p-3 bg-agro-green/10 text-agro-green rounded-full">
                            <CheckCircle2 size={24} />
                         </div>
                         <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Operação</p>
                            <p className="font-black text-lg dark:text-white">
                              {OPERATION_TYPES.find(t => t.id === entryType)?.label.toUpperCase()}
                            </p>
                         </div>
                      </div>
                      
                      {entryData.productName && (
                        <div>
                           <p className="text-xs text-gray-400 font-bold uppercase">Produto</p>
                           <p className="font-bold dark:text-white">{entryData.productName} {entryData.apv ? `(APV: ${entryData.apv})` : ''}</p>
                           {selectedStockId && <p className="text-[10px] text-blue-500 font-bold flex items-center gap-1"><Package size={10}/> Descontar do Stock</p>}
                        </div>
                      )}

                      {/* Display Note for Observations */}
                      {entryType === 'observation' && (
                        <div>
                           <p className="text-xs text-gray-400 font-bold uppercase">Nota</p>
                           <p className="font-medium text-sm dark:text-white italic bg-gray-50 dark:bg-black/20 p-3 rounded-xl mt-1">"{entryData.description}"</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                         {entryType !== 'labor' && entryType !== 'observation' && (
                           <div>
                              <p className="text-xs text-gray-400 font-bold uppercase">Dose</p>
                              <p className="font-bold dark:text-white">{entryData.quantity} {entryData.unit}</p>
                           </div>
                         )}
                         {entryType === 'labor' && (
                           <div>
                              <p className="text-xs text-gray-400 font-bold uppercase">Esforço</p>
                              <p className="font-bold dark:text-white">{entryData.hoursWorked} Horas</p>
                           </div>
                         )}
                         <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Operador</p>
                            <p className="font-bold dark:text-white">{entryData.operator}</p>
                         </div>
                      </div>
                      
                      {/* Cost Summary Preview */}
                      {entryData.cost !== undefined && entryData.cost > 0 && (
                         <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-xl flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500">Custo Imputado</span>
                            <span className="font-black text-gray-800 dark:text-white">{entryData.cost.toFixed(2)}€</span>
                         </div>
                      )}

                      {entryData.safetyDays && (
                         <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                            <ShieldAlert size={14} /> Intervalo Segurança: {entryData.safetyDays} Dias
                         </div>
                      )}
                   </div>

                   <button 
                     onClick={handleWizardSubmit} 
                     className="w-full py-4 bg-agro-green text-white rounded-[1.5rem] font-bold text-lg shadow-xl shadow-agro-green/30 active:scale-95 transition-transform"
                   >
                     Confirmar e Guardar
                   </button>
                   <button onClick={() => setStep(2)} className="mt-4 text-gray-400 font-bold text-sm text-center">Voltar e Editar</button>
                </div>
              )}

            </div>
          )}

        </div>

        {/* --- FOOTER (ACTIONS) --- */}
        {activeTab === 'records' && (
          <div className="p-6 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800">
             <button 
               onClick={generatePDF}
               disabled={isGenerating || filteredLogs.length === 0}
               className={`w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                 filteredLogs.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 shadow-blue-600/30'
               }`}
             >
                {isGenerating ? <Loader2 className="animate-spin" /> : <Printer size={20} />}
                Exportar Relatório DGAV
             </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default FieldNotebook;
