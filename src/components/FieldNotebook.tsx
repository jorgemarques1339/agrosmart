
import React, { useState, useMemo } from 'react';
import { 
  FileText, Download, Calendar, Filter, 
  CheckCircle2, Printer, X, Droplets, Sprout, 
  AlertTriangle, Loader2, ChevronRight, Search, ShieldCheck
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

// Interface extendida para o relatório
interface EnrichedLog extends FieldLog {
  fieldName: string;
  fieldArea: number;
  fieldCrop: string;
  product: string;
  totalQty: string;
  dose: string;
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

  // --- Processamento de Dados Reais (Compliance DGAV) ---
  const reportData = useMemo(() => {
    const allLogs: EnrichedLog[] = [];

    fields.forEach(field => {
      // Filtro de Campo
      if (selectedFieldId !== 'all' && field.id !== selectedFieldId) return;

      field.logs.forEach(log => {
        // Filtro de Data (Mês)
        if (!log.date.startsWith(selectedMonth)) return;

        // Lógica de Extração de Dados para Compliance
        let product = log.description;
        let dose = '-';
        let totalQty = '-';

        // Detetar se é uma aplicação de produto (via Stock ou Manual)
        // Se tiver quantidade, assumimos que é uma aplicação calculável
        if (log.quantity !== undefined && log.unit) {
          // Limpar prefixos comuns para obter o nome limpo do produto/fitofármaco
          product = log.description.replace('Aplicação: ', '').replace('Aplicação ', '');
          
          totalQty = `${log.quantity} ${log.unit}`;
          
          // Cálculo da Dose / Hectare (Crítico para DGAV)
          if (field.areaHa > 0) {
            // Arredondar a 3 casas decimais para precisão
            const doseValue = (log.quantity / field.areaHa).toFixed(3);
            dose = `${doseValue} ${log.unit}/ha`;
          }
        } 
        // Tratamento para Colheitas
        else if (log.type === 'harvest') {
          product = 'Colheita';
          dose = log.description; // Na colheita, a descrição costuma ter notas de rendimento
        }

        allLogs.push({
          ...log,
          fieldName: field.name,
          fieldArea: field.areaHa,
          fieldCrop: field.crop,
          product: product,
          totalQty: totalQty,
          dose: dose,
          operator: operatorName
        });
      });
    });

    // Ordenar cronologicamente (Mais antigo primeiro, formato de registo)
    return allLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [fields, selectedFieldId, selectedMonth, operatorName]);

  // --- Geração de PDF (Layout Oficial) ---
  const generatePDF = () => {
    if (reportData.length === 0) return;
    
    setIsGenerating(true);

    setTimeout(() => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // 1. Cabeçalho Institucional
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'bold');
      doc.text("REGISTO DE OPERAÇÕES CULTURAIS", pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text("Conformidade: DGAV / Produção Integrada", pageWidth / 2, 26, { align: 'center' });

      // 2. Dados do Operador e Período (Box)
      doc.setDrawColor(200);
      doc.setFillColor(250, 250, 250);
      doc.rect(14, 35, pageWidth - 28, 25, 'FD');

      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.text("IDENTIFICAÇÃO DO AGRICULTOR / OPERADOR", 18, 42);
      
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'bold');
      doc.text(operatorName.toUpperCase(), 18, 48);

      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.setFont('helvetica', 'normal');
      doc.text("PERÍODO DE REGISTO", 120, 42);
      doc.text("DATA DE EMISSÃO", 170, 42);

      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'bold');
      doc.text(selectedMonth, 120, 48);
      doc.text(new Date().toLocaleDateString('pt-PT'), 170, 48);

      // 3. Configuração da Tabela Oficial
      const tableColumn = [
        "Data", 
        "Parcela / Cultura", 
        "Operação", 
        "Produto / Justificação", 
        "Área (ha)",
        "Total Usado", 
        "Dose (ha)"
      ];
      
      const tableRows = reportData.map(log => [
        log.date,
        `${log.fieldName}\n${log.fieldCrop}`,
        log.type === 'treatment' ? 'Tratamento' : log.type === 'harvest' ? 'Colheita' : 'Outros',
        log.product,
        log.fieldArea.toFixed(2),
        log.totalQty,
        log.dose
      ]);

      // 4. Gerar Tabela
      autoTable(doc, {
        startY: 70,
        head: [tableColumn],
        body: tableRows,
        theme: 'plain', // Tema limpo para impressão oficial
        headStyles: { 
          fillColor: [240, 240, 240], 
          textColor: 0,
          fontStyle: 'bold',
          fontSize: 8,
          lineWidth: 0.1,
          lineColor: 200,
          halign: 'center',
          valign: 'middle'
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 3,
          textColor: 0,
          valign: 'middle',
          lineWidth: 0.1,
          lineColor: 230
        },
        columnStyles: {
          0: { cellWidth: 22 }, // Data
          1: { cellWidth: 35 }, // Parcela
          2: { cellWidth: 20 }, // Operação
          3: { cellWidth: 'auto' }, // Produto (Expandível)
          4: { cellWidth: 15, halign: 'center' }, // Área
          5: { cellWidth: 20, halign: 'right' }, // Total
          6: { cellWidth: 20, halign: 'right', fontStyle: 'bold' } // Dose
        },
        alternateRowStyles: {
          fillColor: [252, 252, 252]
        }
      });

      // 5. Rodapé com Assinatura
      const finalY = (doc as any).lastAutoTable.finalY || 150;
      
      // Verificar se cabe na página, senão adicionar nova
      let signY = finalY + 40;
      if (signY > 270) {
        doc.addPage();
        signY = 40;
      }

      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text("Declaro que as informações registadas correspondem à verdade e respeitam os intervalos de segurança.", 14, signY - 15);

      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(120, signY, 190, signY); // Linha assinatura
      
      doc.setFontSize(9);
      doc.setTextColor(0);
      doc.text("Assinatura do Técnico Responsável", 120, signY + 5);

      // Metadados Rodapé Página
      const pageCount = (doc as any).internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(`AgroSmart Enterprise v1.3 - Exportação Oficial DGAV - Pág ${i}/${pageCount}`, pageWidth / 2, 290, { align: 'center' });
      }

      doc.save(`Caderno_Campo_${selectedMonth}.pdf`);
      
      setIsGenerating(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
      
      {/* Container Principal */}
      <div className="bg-white dark:bg-neutral-900 w-full md:max-w-5xl h-[95vh] md:h-[85vh] md:rounded-[2rem] rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up relative">
        
        {/* --- Header Fixo --- */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-agro-green/10 rounded-2xl text-agro-green">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-none">Caderno de Campo</h2>
              <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1">
                 Conformidade DGAV <CheckCircle2 size={10} className="text-agro-green" />
              </p>
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
             <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Período de Inspeção</label>
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
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold uppercase text-gray-400 tracking-wider border-b border-gray-200 dark:border-neutral-800 pb-2 mb-2">
                <div className="col-span-2">Data</div>
                <div className="col-span-3">Parcela</div>
                <div className="col-span-2">Operação</div>
                <div className="col-span-3">Produto</div>
                <div className="col-span-2 text-right">Dose Aplicada</div>
              </div>

              {/* Rows */}
              {reportData.map((log, idx) => (
                <div 
                  key={`${log.id}-${idx}`}
                  className="bg-white dark:bg-neutral-800 p-4 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-sm hover:shadow-md transition-shadow flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 md:items-center"
                >
                   {/* Data e Ícone Mobile */}
                   <div className="flex justify-between items-center md:col-span-2">
                     <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 dark:bg-neutral-700 px-2 py-1 rounded-md">
                       {log.date}
                     </span>
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
                     <p className="text-[10px] text-gray-400">{log.fieldCrop} • {log.fieldArea} ha</p>
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
                         {log.type === 'treatment' ? 'Tratamento' : log.type === 'harvest' ? 'Colheita' : 'Outros'}
                       </span>
                   </div>

                   {/* Produto */}
                   <div className="md:col-span-3">
                     <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                       {log.product}
                     </p>
                     {log.type === 'treatment' && log.dose !== '-' && (
                       <span className="text-[10px] text-green-600 font-bold flex items-center gap-1 mt-0.5">
                          <CheckCircle2 size={10} /> Registado
                       </span>
                     )}
                   </div>

                   {/* Dose (Highlight) */}
                   <div className="md:col-span-2 md:text-right flex justify-between md:block border-t md:border-t-0 border-gray-100 dark:border-neutral-700 pt-2 md:pt-0 mt-1 md:mt-0">
                      <span className="text-xs text-gray-400 font-bold md:hidden uppercase">Dose</span>
                      <div>
                        {log.dose !== '-' && (
                          <span className="font-mono text-sm font-black text-gray-900 dark:text-white block">
                            {log.dose}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          Qtd Total: {log.totalQty}
                        </span>
                      </div>
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
                 <p className="text-xs font-bold text-gray-700 dark:text-gray-200">Pronto para Assinar</p>
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
                  <span>PDF Criado!</span>
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
