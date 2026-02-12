import React, { useState, useMemo } from 'react';
import { 
  FileText, Download, Calendar, Filter, 
  CheckCircle2, Printer, X, Droplets, Sprout, 
  AlertTriangle, Loader2, ChevronRight, Search
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Field, FieldLog } from '../types';

interface FieldNotebookProps {
  isOpen: boolean;
  onClose: () => void;
  fields: Field[];
  operatorName: string;
}

// Extensão da interface de log para suportar detalhes do relatório
// Em produção, estes campos viriam do backend. Aqui simulamos com base na descrição.
interface EnrichedLog extends FieldLog {
  fieldName: string;
  fieldArea: number;
  product?: string;
  dose?: string;
  operator: string;
}

const FieldNotebook: React.FC<FieldNotebookProps> = ({ 
  isOpen, 
  onClose, 
  fields,
  operatorName 
}) => {
  const [selectedFieldId, setSelectedFieldId] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // --- Processamento de Dados ---
  // Transforma os logs simples em registos detalhados para o relatório
  const reportData = useMemo(() => {
    const allLogs: EnrichedLog[] = [];

    fields.forEach(field => {
      if (selectedFieldId !== 'all' && field.id !== selectedFieldId) return;

      field.logs.forEach(log => {
        // Filtrar por mês
        if (!log.date.startsWith(selectedMonth)) return;

        // Simulação de parser de descrição para extrair produto/dose
        // Ex: "Aplicação de fungicida sistémico" -> Produto: Fungicida Sist., Dose: 2.5 L/ha
        let product = '-';
        let dose = '-';

        if (log.type === 'treatment') {
          product = 'Fungicida Cuprocol';
          dose = '2.5 L/ha';
        } else if (log.type === 'harvest') {
          product = 'Colheita Manual';
          dose = `${field.yieldPerHa} Ton (Est.)`;
        } else if (field.irrigationStatus) { // Assume rega se houver log
           product = 'Água de Furo';
           dose = '45 m3/ha';
        }

        allLogs.push({
          ...log,
          fieldName: field.name,
          fieldArea: field.areaHa,
          product: log.description.length > 20 ? log.description.substring(0, 20) + '...' : log.description, // Simplificação
          dose: dose,
          operator: operatorName
        });
      });
    });

    // Ordenar cronologicamente
    return allLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [fields, selectedFieldId, selectedMonth, operatorName]);

  // --- Geração de PDF (Compliance DGAV) ---
  const generatePDF = () => {
    if (reportData.length === 0) return;
    
    setIsGenerating(true);

    // Pequeno delay para permitir a renderização da UI de loading
    setTimeout(() => {
      const doc = new jsPDF();
      
      // 1. Cabeçalho Institucional
      doc.setFontSize(18);
      doc.setTextColor(62, 104, 55); // Agro Green
      doc.text("Caderno de Campo - Registo de Intervenções", 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Operador Responsável: ${operatorName}`, 14, 28);
      doc.text(`Período: ${selectedMonth}`, 14, 33);
      doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-PT')}`, 14, 38);

      // Linha separadora
      doc.setDrawColor(62, 104, 55);
      doc.setLineWidth(0.5);
      doc.line(14, 42, 196, 42);

      // 2. Configuração da Tabela
      const tableColumn = ["Data", "Parcela (ha)", "Operação", "Produto / Descrição", "Dose", "Operador"];
      const tableRows: any[] = [];

      reportData.forEach(log => {
        const rowData = [
          log.date,
          `${log.fieldName} (${log.fieldArea}ha)`,
          log.type === 'treatment' ? 'Fitossanitário' : log.type === 'harvest' ? 'Colheita' : 'Outros',
          log.description, // Usar descrição completa no PDF
          log.dose || '-',
          log.operator
        ];
        tableRows.push(rowData);
      });

      // 3. Gerar Tabela
      autoTable(doc, {
        startY: 48,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { 
          fillColor: [62, 104, 55], 
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9
        },
        styles: {
          fontSize: 8,
          cellPadding: 3,
          textColor: 50
        },
        alternateRowStyles: {
          fillColor: [245, 247, 245]
        }
      });

      // 4. Rodapé e Assinatura
      const finalY = (doc as any).lastAutoTable.finalY || 150;
      
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("Documento processado digitalmente pela plataforma AgroSmart Enterprise.", 14, 285);
      doc.text("Válido para conformidade DGAV quando acompanhado de faturas comprovativas.", 14, 289);

      // Espaço de Assinatura
      if (finalY < 250) {
        doc.setDrawColor(200);
        doc.line(130, finalY + 40, 190, finalY + 40);
        doc.text("Assinatura do Técnico", 130, finalY + 45);
      }

      // 5. Download
      doc.save(`Caderno_Campo_${selectedMonth}.pdf`);
      
      setIsGenerating(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
      
      {/* Container Principal */}
      <div className="bg-white dark:bg-neutral-900 w-full md:max-w-4xl h-[95vh] md:h-[85vh] md:rounded-[2rem] rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up relative">
        
        {/* --- Header Fixo --- */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-agro-green/10 rounded-2xl text-agro-green">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-none">Caderno de Campo</h2>
              <p className="text-xs text-gray-500 font-medium mt-1">Registo Oficial & Exportação DGAV</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <X size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* --- Filtros --- */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-neutral-900/50 flex flex-col md:flex-row gap-4 border-b border-gray-100 dark:border-neutral-800">
          
          {/* Seletor de Mês */}
          <div className="flex-1">
             <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Período</label>
             <div className="relative">
               <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
               <input 
                 type="month"
                 value={selectedMonth}
                 onChange={(e) => setSelectedMonth(e.target.value)}
                 className="w-full pl-11 pr-4 py-3 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 text-sm font-bold text-gray-700 dark:text-white focus:ring-2 focus:ring-agro-green outline-none"
               />
             </div>
          </div>

          {/* Seletor de Campo */}
          <div className="flex-1">
             <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Filtrar Parcela</label>
             <div className="relative">
               <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
               <select
                 value={selectedFieldId}
                 onChange={(e) => setSelectedFieldId(e.target.value)}
                 className="w-full pl-11 pr-8 py-3 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 text-sm font-bold text-gray-700 dark:text-white focus:ring-2 focus:ring-agro-green outline-none appearance-none"
               >
                 <option value="all">Todas as Parcelas</option>
                 {fields.map(f => (
                   <option key={f.id} value={f.id}>{f.name}</option>
                 ))}
               </select>
               <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                 <ChevronRight size={16} className="rotate-90 text-gray-400" />
               </div>
             </div>
          </div>
        </div>

        {/* --- Conteúdo Principal (Lista / Tabela) --- */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-neutral-900 custom-scrollbar p-4 md:p-6">
          
          {reportData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
               <Search size={48} className="text-gray-300 mb-4" />
               <h3 className="text-lg font-bold text-gray-900 dark:text-white">Sem Registos</h3>
               <p className="text-sm text-gray-500">Nenhuma intervenção encontrada para este período.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header da Tabela (Apenas Desktop) */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold uppercase text-gray-400 tracking-wider">
                <div className="col-span-2">Data</div>
                <div className="col-span-3">Parcela</div>
                <div className="col-span-2">Tipo</div>
                <div className="col-span-3">Descrição / Produto</div>
                <div className="col-span-2 text-right">Dose</div>
              </div>

              {/* Rows */}
              {reportData.map((log, idx) => (
                <div 
                  key={`${log.id}-${idx}`}
                  className="bg-white dark:bg-neutral-800 p-4 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 md:items-center"
                >
                   {/* Mobile Header Row */}
                   <div className="flex justify-between items-center md:col-span-2">
                     <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 dark:bg-neutral-700 px-2 py-1 rounded-md">
                       {log.date}
                     </span>
                     {/* Ícone de Tipo (Visível em Mobile e Desktop) */}
                     <div className={`p-1.5 rounded-full ${
                       log.type === 'treatment' ? 'bg-orange-100 text-orange-600' :
                       log.type === 'harvest' ? 'bg-green-100 text-green-600' :
                       'bg-blue-100 text-blue-600'
                     } md:hidden`}>
                       {log.type === 'treatment' ? <AlertTriangle size={14} /> : 
                        log.type === 'harvest' ? <Sprout size={14} /> : 
                        <Droplets size={14} />}
                     </div>
                   </div>

                   {/* Parcela */}
                   <div className="md:col-span-3">
                     <h4 className="font-bold text-gray-900 dark:text-white text-sm">{log.fieldName}</h4>
                     <p className="text-[10px] text-gray-400">{log.fieldArea} hectares</p>
                   </div>

                   {/* Tipo (Desktop) */}
                   <div className="hidden md:flex md:col-span-2 items-center gap-2">
                      <div className={`p-1.5 rounded-full ${
                         log.type === 'treatment' ? 'bg-orange-100 text-orange-600' :
                         log.type === 'harvest' ? 'bg-green-100 text-green-600' :
                         'bg-blue-100 text-blue-600'
                       }`}>
                         {log.type === 'treatment' ? <AlertTriangle size={14} /> : 
                          log.type === 'harvest' ? <Sprout size={14} /> : 
                          <Droplets size={14} />}
                       </div>
                       <span className="text-xs font-bold text-gray-600 dark:text-gray-300 capitalize">
                         {log.type === 'treatment' ? 'Fitossanitário' : log.type}
                       </span>
                   </div>

                   {/* Descrição */}
                   <div className="md:col-span-3">
                     <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 md:line-clamp-1">
                       {log.description}
                     </p>
                     {log.type === 'treatment' && (
                       <span className="text-[10px] text-orange-500 font-bold bg-orange-50 dark:bg-orange-900/20 px-1.5 rounded mt-1 inline-block">
                         Período de Segurança Ativo
                       </span>
                     )}
                   </div>

                   {/* Dose */}
                   <div className="md:col-span-2 md:text-right flex justify-between md:block border-t md:border-t-0 border-gray-100 dark:border-neutral-700 pt-2 md:pt-0 mt-1 md:mt-0">
                      <span className="text-xs text-gray-400 font-bold md:hidden uppercase">Dose Aplicada</span>
                      <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                        {log.dose}
                      </span>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- Footer & Ações --- */}
        <div className="p-4 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 pb-8 md:pb-4">
          <div className="flex gap-3">
            <div className="flex-1 bg-gray-50 dark:bg-neutral-800 rounded-2xl p-3 flex items-center gap-3 border border-gray-200 dark:border-neutral-700">
               <Printer className="text-gray-400" size={20} />
               <div>
                 <p className="text-[10px] font-bold text-gray-400 uppercase">Estado</p>
                 <p className="text-xs font-bold text-gray-700 dark:text-gray-200">Pronto para Exportar</p>
               </div>
            </div>

            <button 
              onClick={generatePDF}
              disabled={reportData.length === 0 || isGenerating}
              className={`flex-[2] rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95 relative overflow-hidden ${
                reportData.length === 0 
                  ? 'bg-gray-300 dark:bg-neutral-700 cursor-not-allowed shadow-none' 
                  : showSuccess 
                    ? 'bg-green-500' 
                    : 'bg-gradient-to-r from-[#3E6837] to-[#2D4F00] shadow-agro-green/30'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>A Gerar...</span>
                </>
              ) : showSuccess ? (
                <>
                  <CheckCircle2 size={20} className="animate-scale-up" />
                  <span>Sucesso!</span>
                </>
              ) : (
                <>
                  <Download size={20} />
                  <span>Exportar PDF DGAV</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FieldNotebook;