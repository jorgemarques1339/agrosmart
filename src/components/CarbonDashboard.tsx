import React, { useMemo, useState } from 'react';
import { Leaf, RefreshCw, Info, Tractor, Wallet, ShieldCheck, Factory, Sprout, FileDown, FileCheck, Camera, Radio, Download, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useStore } from '../store/useStore';
import { calculateCarbonFootprint, AuditLogItem } from '../utils/carbonCalculator';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import clsx from 'clsx';

const CarbonDashboard = () => {
    const { machines, fields, fields: allFields, reclaimCredits } = useStore();
    const [isExporting, setIsExporting] = useState(false);
    const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogItem | null>(null);

    // Filter logs for the current year
    const mockLogs = useMemo(() => {
        return allFields.flatMap(f => f.logs || []);
    }, [allFields]);

    const metrics = useMemo(() => {
        return calculateCarbonFootprint(machines, fields, mockLogs);
    }, [machines, fields, mockLogs]);

    const pieData = [
        { name: 'Combustível', value: metrics.emissions.fuel, color: '#EF4444' },
        { name: 'Fertilizantes', value: metrics.emissions.fertilizer, color: '#F59E0B' },
        { name: 'Sequestro (Culturas)', value: metrics.sequestration.crops, color: '#10B981' },
    ];

    const isPositive = metrics.netBalance > 0;

    const handleExportPDF = () => {
        setIsExporting(true);
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(16, 185, 129); // Emerald-500
        doc.text("RELATÓRIO DE SUSTENTABILIDADE ESG", 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Gerado em: ${new Date().toLocaleString()} • OrivaSmart Audit-Ready v2.0`, 105, 26, { align: 'center' });

        // Summary Table
        autoTable(doc, {
            startY: 35,
            head: [['Indicador', 'Valor (tCO2e)', 'Status']],
            body: [
                ['Emissões Totais', metrics.emissions.total.toString(), 'Emissão'],
                ['Sequestro Total', metrics.sequestration.total.toString(), 'Captura'],
                ['Balanço Líquido', metrics.netBalance.toString(), metrics.netBalance <= 0 ? 'Carbon Positive' : 'Negative Balance'],
                ['Créditos Disponíveis', metrics.potentialCredits.amount.toString(), 'Pronto p/ Auditoria'],
            ],
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129] }
        });

        // Audit Logs Table
        doc.text("LOGS DE AUDITORIA (ISO-BUS & EVIDÊNCIAS)", 14, (doc as any).lastAutoTable.finalY + 15);
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 20,
            head: [['Data', 'Tipo', 'Descrição', 'Impacto (t)']],
            body: metrics.auditLogs.map(log => [
                log.date,
                log.type.toUpperCase(),
                log.description,
                log.value.toString()
            ]),
            theme: 'striped',
            headStyles: { fillColor: [55, 65, 81] }
        });

        doc.save(`ESG_Audit_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        setIsExporting(false);
    };

    const handleExportCSV = () => {
        const headers = ["Data", "Tipo", "Descricao", "Impacto_tCO2e", "ISO-BUS"];
        const rows = metrics.auditLogs.map(log => [
            log.date,
            log.type,
            `"${log.description}"`,
            log.value,
            log.isobus ? "YES" : "NO"
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Carbon_Data_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 pb-32 overflow-x-hidden">

            {/* Header & Export Tools */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 mb-1">
                        <ShieldCheck size={12} />
                        <span className="text-[10px] font-black uppercase tracking-wider">Audit-Ready Protocol v2.0</span>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Gestão de Carbono</h2>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-sm"
                    >
                        <FileDown size={16} className="text-red-500" />
                        PDF Audit
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-sm"
                    >
                        <Download size={16} className="text-green-500" />
                        Excel/CSV
                    </button>
                </div>
            </div>

            {/* Main Balance Card */}
            <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl border border-white/5">
                <div className="absolute top-0 right-0 p-40 bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none" />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 mb-6 backdrop-blur-md">
                            <Leaf size={14} className="text-emerald-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Balanço Líquido (Auditado)</span>
                        </div>
                        <h3 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 flex items-baseline justify-center lg:justify-start gap-3">
                            {Math.abs(metrics.netBalance)}
                            <span className="text-xl md:text-3xl font-bold opacity-30">tCO₂e</span>
                        </h3>
                        <div className={clsx(
                            "inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border",
                            isPositive ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        )}>
                            {isPositive ? 'Emissor Líquido' : 'Sumidouro (Carbon Positive)'}
                        </div>
                    </div>

                    <div className="bg-white/10 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-xl group hover:border-emerald-500/30 transition-all">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Créditos de Carbono</p>
                                <p className="text-sm font-medium text-gray-300">Potencial de Receita ESG</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <Zap size={20} className="animate-pulse" />
                            </div>
                        </div>

                        <div className="flex items-baseline gap-2 mb-6">
                            <p className="text-5xl font-black text-white">€{metrics.potentialCredits.value.toLocaleString()}</p>
                            <p className="text-lg font-bold text-emerald-400/60">{metrics.potentialCredits.amount} t</p>
                        </div>

                        {metrics.potentialCredits.amount > 0 && (
                            <button
                                onClick={() => reclaimCredits(metrics.potentialCredits.amount, metrics.potentialCredits.value)}
                                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                            >
                                <FileCheck size={18} />
                                Reclamar Créditos
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Breakdown Column */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white dark:bg-neutral-900 p-6 rounded-[2rem] border border-gray-100 dark:border-neutral-800 shadow-sm">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Emissões por Fonte</h4>
                        <div className="space-y-6">
                            {[
                                { label: 'Máquinas (Diesel)', value: metrics.emissions.fuel, total: metrics.emissions.total, color: 'bg-red-500', icon: Tractor },
                                { label: 'Fertilizantes', value: metrics.emissions.fertilizer, total: metrics.emissions.total, color: 'bg-amber-500', icon: Sprout }
                            ].map(item => (
                                <div key={item.label} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                                            <item.icon size={14} className="opacity-50" /> {item.label}
                                        </span>
                                        <span className="text-sm font-black text-gray-900 dark:text-white">{item.value} t</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(item.value / (item.total || 1)) * 100}%` }}
                                            className={clsx("h-full", item.color)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-emerald-500/5 dark:bg-emerald-900/10 p-6 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/30">
                        <div className="flex items-center gap-3 mb-4 text-emerald-600 dark:text-emerald-400">
                            <Leaf size={20} />
                            <span className="text-xs font-black uppercase tracking-widest">Sequestro Ativo</span>
                        </div>
                        <div className="h-[120px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={55}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Audit Logs Column */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-neutral-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-sm h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">Logs de Auditoria ESG</h4>
                            <span className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded-lg text-[10px] font-bold text-gray-500 uppercase tracking-widest">Rastreabilidade Total</span>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto pr-2 max-h-[450px] scrollbar-hide">
                            <AnimatePresence>
                                {metrics.auditLogs.map((log) => (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        whileHover={{ scale: 1.01 }}
                                        onClick={() => setSelectedAuditLog(log)}
                                        className="group p-4 bg-gray-50 dark:bg-neutral-800/50 hover:bg-white dark:hover:bg-neutral-800 border border-transparent hover:border-gray-100 dark:hover:border-neutral-700 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-4"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={clsx(
                                                "w-10 h-10 rounded-xl flex items-center justify-center border",
                                                log.type === 'fuel' ? "bg-red-50 text-red-500 border-red-100 dark:bg-red-900/20 dark:border-red-800/30" :
                                                    log.type === 'fertilizer' ? "bg-amber-50 text-amber-500 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/30" :
                                                        "bg-emerald-50 text-emerald-500 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/30"
                                            )}>
                                                {log.type === 'fuel' ? <Tractor size={18} /> : log.type === 'fertilizer' ? <Sprout size={18} /> : <Leaf size={18} />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-black text-gray-900 dark:text-white uppercase truncate max-w-[200px]">{log.description}</p>
                                                    {log.isobus && <Radio size={12} className="text-blue-500 animate-pulse" />}
                                                    {log.evidence && log.evidence.length > 0 && <Camera size={12} className="text-gray-400" />}
                                                </div>
                                                <p className="text-[10px] font-bold text-gray-400">{log.date} • {log.type.toUpperCase()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={clsx("text-sm font-black", log.type === 'sequestration' ? "text-emerald-500" : "text-red-500")}>
                                                {log.type === 'sequestration' ? '-' : '+'}{log.value} t
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* Audit Inspector Modal */}
            <AnimatePresence>
                {selectedAuditLog && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedAuditLog(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white dark:bg-neutral-900 w-full max-w-lg p-8 rounded-[3rem] shadow-2xl border border-white/5"
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Inspeção de Auditoria</p>
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{selectedAuditLog.description}</h3>
                                </div>
                                <button onClick={() => setSelectedAuditLog(null)} className="p-3 bg-gray-100 dark:bg-neutral-800 rounded-full text-gray-500 dark:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl">
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Impacto Carbono</p>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">{selectedAuditLog.value} tCO2e</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl">
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Status Verificação</p>
                                    <div className="flex items-center gap-2 text-emerald-500 font-bold">
                                        <FileCheck size={16} /> Verified
                                    </div>
                                </div>
                            </div>

                            {selectedAuditLog.evidence && selectedAuditLog.evidence.length > 0 ? (
                                <div className="mb-8">
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-3 ml-1">Evidência Fotográfica</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {selectedAuditLog.evidence.map((img, i) => (
                                            <div key={i} className="aspect-video rounded-2xl overflow-hidden bg-gray-100">
                                                <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 border-2 border-dashed border-gray-100 dark:border-neutral-800 rounded-2xl text-center mb-8">
                                    <p className="text-xs font-bold text-gray-400">Sem evidências fotográficas anexadas.</p>
                                </div>
                            )}

                            {selectedAuditLog.isobus && (
                                <div className="p-4 bg-blue-500/5 dark:bg-blue-900/10 rounded-2xl flex items-center gap-4 mb-8 border border-blue-100 dark:border-blue-900/30">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <Radio size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-blue-900 dark:text-blue-100 uppercase tracking-widest">ISO-BUS Certified</p>
                                        <p className="text-[10px] font-medium text-blue-700 dark:text-blue-300">Dados de telemetria verificados via bridge de hardware.</p>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => setSelectedAuditLog(null)}
                                className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-sm uppercase tracking-widest"
                            >
                                Fechar Detalhes
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CarbonDashboard;
