import React, { useState, useEffect } from 'react';
import { Wifi, Plus, FileCheck, X, QrCode, Package, Calendar, ArrowRight, Save, MapPin, Navigation, Sparkles, FileText } from 'lucide-react';
import { Field, StockItem, Employee, ProductBatch, FieldLog, Sensor } from '../../types';
import { CROP_TYPES } from '../../constants';
import FieldCard from './FieldCard';
import FieldNotebook from './FieldNotebook';
import IoTPairingWizard from '../../components/IoTPairingWizard';
import RouteOptimizationModal from './RouteOptimizationModal';
import { useStore } from '../../store/useStore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion } from 'framer-motion';
import { Virtuoso } from 'react-virtuoso';

interface CultivationViewProps { }

const CultivationView: React.FC<CultivationViewProps> = () => {
    const fields = useStore(state => state.fields) || [];
    const stocks = useStore(state => state.stocks) || [];
    const employees = useStore(state => state.users) as Employee[] || [];
    const harvests = useStore(state => state.harvests) || [];

    const toggleIrrigation = useStore(state => state.toggleIrrigation);
    const addLogToField = useStore(state => state.addLogToField);
    const updateStock = useStore(state => state.updateStock);
    const addTransaction = useStore(state => state.addTransaction);
    const addFieldStore = useStore(state => state.addField);
    const deleteField = useStore(state => state.deleteField);
    const openModal = useStore(state => state.openModal);

    const currentUserId = useStore(state => state.currentUserId);
    const users = useStore(state => state.users) || [];
    const currentUser = employees.find(u => u && u.id === currentUserId) || { id: 'guest', name: 'Convidado' } as any;
    const operatorName = currentUser.name;

    const onAddLog = (fieldId: string, log: Omit<FieldLog, 'id'>) => {
        addLogToField(fieldId, { ...log, id: Date.now().toString() } as FieldLog);
    };

    const onUseStock = (fieldId: string, stockId: string, quantity: number, date: string) => {
        const stock = stocks.find(s => s.id === stockId);
        if (!stock) return;
        updateStock(stockId, { quantity: stock.quantity - quantity });
        addTransaction({ id: Date.now().toString(), date, type: 'expense', amount: quantity * stock.pricePerUnit, category: 'Insumos', description: 'Uso em campo' });
        addLogToField(fieldId, { id: Date.now().toString(), date, type: 'treatment', description: `Uso de ${quantity} ${stock.unit} de ${stock.name}` } as FieldLog);
    };

    const onAddField = (f: Pick<Field, 'name' | 'areaHa' | 'crop' | 'emoji'>) => {
        const newField = {
            yieldPerHa: 0, polygon: [], irrigationStatus: false, humidity: 50, temp: 20, healthScore: 100,
            harvestWindow: 'Próxima Época', history: [], logs: [], sensors: [], ...f, id: Date.now().toString()
        };
        addFieldStore(newField as unknown as Field);
    };

    const onViewTraceability = (batch: ProductBatch) => openModal('traceability', batch);
    const onDeleteField = deleteField;
    const onRegisterSensor = (fieldId: string, sensor: Sensor) => { };
    const onRegisterSale = (saleData: any) => { };
    const onHarvest = (fieldId: string, data: any) => { };
    const setChildModalOpen = useStore(state => state.setChildModalOpen);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNotebookOpen, setIsNotebookOpen] = useState(false);
    const [showIoTWizard, setShowIoTWizard] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showRouteOptimizer, setShowRouteOptimizer] = useState(false);
    const [anyFieldOpen, setAnyFieldOpen] = useState(false);

    const detailedForecast = useStore(state => state.detailedForecast);

    const [newName, setNewName] = useState('');
    const [newArea, setNewArea] = useState('');
    const [newLat, setNewLat] = useState('41.442');
    const [newLng, setNewLng] = useState('-8.723');
    const [selectedCrop, setSelectedCrop] = useState(CROP_TYPES[0]);

    useEffect(() => {
        setChildModalOpen(isModalOpen || isNotebookOpen || showIoTWizard || anyFieldOpen || showHistoryModal || showRouteOptimizer);
        return () => setChildModalOpen(false);
    }, [isModalOpen, isNotebookOpen, showIoTWizard, anyFieldOpen, showHistoryModal, showRouteOptimizer, setChildModalOpen]);

    const generateHarvestJournalPDF = (batch: ProductBatch) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(62, 104, 55);
        doc.text("DIÁRIO DE CULTIVO", 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Lote: ${batch.batchId}`, 105, 26, { align: 'center' });
        doc.line(14, 30, 196, 30);

        // Batch Info
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.text("Informação do Lote:", 14, 40);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Cultura: ${batch.crop}`, 14, 48);
        doc.text(`Quantidade: ${batch.quantity} ${batch.unit}`, 14, 54);
        doc.text(`Data de Colheita: ${new Date(batch.harvestDate).toLocaleDateString()}`, 14, 60);
        doc.text(`Origem: ${batch.origin}`, 14, 66);

        if (batch.fieldMetadata) {
            doc.text(`Parcela Original: ${batch.fieldMetadata.name}`, 110, 48);
            doc.text(`Área: ${batch.fieldMetadata.areaHa} ha`, 110, 54);
        }

        doc.setFont("helvetica", "bold");
        doc.text("REGISTOS DE CAMPO (CADERNO DE CAMPO)", 14, 80);

        // Table of Logs
        const logs = batch.fieldLogs || [];
        const tableRows = logs.map(log => [
            new Date(log.date).toLocaleDateString(),
            log.type.toUpperCase(),
            log.description,
            log.operator || 'N/A',
            log.productName || '-'
        ]);

        autoTable(doc, {
            startY: 85,
            head: [['Data', 'Tipo', 'Descrição', 'Operador', 'Produto']],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [62, 104, 55] },
            styles: { fontSize: 8 }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Documento gerado automaticamente pelo Sistema OrivaSmart Traceability.", 14, finalY);
        doc.text("Assinatura do Responsável Técnico: ___________________________", 14, finalY + 10);

        doc.save(`Diario_Cultivo_${batch.batchId}.pdf`);
    };

    const handleSubmit = () => {
        if (newName && newArea) {
            onAddField({
                name: newName,
                areaHa: parseFloat(newArea),
                crop: selectedCrop.label,
                emoji: selectedCrop.emoji,
                coordinates: [parseFloat(newLat) || 41.442, parseFloat(newLng) || -8.723],
                polygon: [
                    [parseFloat(newLat) || 41.442, parseFloat(newLng) || -8.723],
                    [(parseFloat(newLat) || 41.442) + 0.001, (parseFloat(newLng) || -8.723) + 0.002],
                    [(parseFloat(newLat) || 41.442) - 0.001, (parseFloat(newLng) || -8.723) + 0.003],
                    [(parseFloat(newLat) || 41.442) - 0.002, (parseFloat(newLng) || -8.723) - 0.001]
                ]
            } as any);
            setNewName('');
            setNewArea('');
            setNewLat('41.442');
            setNewLng('-8.723');
            setIsModalOpen(false);
            setSelectedCrop(CROP_TYPES[0]);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    } as const;

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 300, damping: 24 } as const
        }
    } as const;

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6 pt-4 pb-24"
        >
            <motion.div variants={itemVariants} className="flex justify-between items-start px-2 mb-4 md:mb-6">
                <div className="flex gap-3">
                    <div>
                        <h1 className="text-xl md:text-3xl font-black italic text-gray-900 dark:text-white tracking-tight uppercase">Cultivos</h1>
                        <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Gestão de Parcelas</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="flex flex-col items-center gap-1">
                        <button
                            onClick={() => setShowIoTWizard(true)}
                            className="w-12 h-12 rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center active:scale-95 transition-transform"
                            title="Adicionar Sensor IoT"
                        >
                            <Wifi size={22} />
                        </button>
                        <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400">IoT</span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <button
                            onClick={() => setShowRouteOptimizer(true)}
                            className="w-12 h-12 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center active:scale-95 transition-transform"
                            title="Otimizar Rota de Tratamento"
                        >
                            <Sparkles size={22} />
                        </button>
                        <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400">Otimizar</span>
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="w-12 h-12 rounded-full bg-agro-green text-white shadow-lg shadow-agro-green/30 flex items-center justify-center active:scale-95 transition-transform"
                        >
                            <Plus size={24} />
                        </button>
                        <span className="text-[10px] font-bold text-agro-green dark:text-green-400 whitespace-nowrap">Novo</span>
                    </div>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col gap-4 md:gap-6">
                {fields.map(field => (
                    <FieldCard
                        key={field.id}
                        field={field}
                        stocks={stocks}
                        onToggleIrrigation={toggleIrrigation}
                        onAddLog={onAddLog}
                        onUseStock={onUseStock}
                        onRegisterSensor={onRegisterSensor}
                        onRegisterSale={onRegisterSale}
                        onHarvest={onHarvest}
                        onDelete={onDeleteField}
                    />
                ))}
            </motion.div>

            {harvests && harvests.length > 0 && (
                <button
                    onClick={() => setShowHistoryModal(true)}
                    className="w-full py-4 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-[2rem] shadow-sm flex items-center justify-center gap-2 text-gray-500 hover:text-agro-green transition-all mt-4"
                >
                    <FileCheck size={20} />
                    <span className="font-bold text-sm">Colheitas Finalizadas ({harvests.length})</span>
                </button>
            )}

            {showHistoryModal && (
                <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowHistoryModal(false)}>
                    <div
                        className="bg-white dark:bg-neutral-900 w-full max-w-md p-6 rounded-t-[2.5rem] shadow-2xl animate-slide-up border-t border-white/20 max-h-[80vh] overflow-y-auto custom-scrollbar"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black dark:text-white flex items-center gap-2">
                                    <FileCheck className="text-agro-green" size={24} /> Histórico de Colheita
                                </h3>
                                <p className="text-xs font-bold text-gray-400 uppercase mt-1">Passaportes Digitais</p>
                            </div>
                            <button onClick={() => setShowHistoryModal(false)} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                                <X size={20} className="dark:text-white" />
                            </button>
                        </div>

                        <div className="space-y-4 h-[60vh]">
                            <Virtuoso
                                style={{ height: '100%' }}
                                data={harvests.slice().reverse()}
                                itemContent={(index, batch) => (
                                    <div className="pb-4">
                                        <div className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-[1.5rem] border border-gray-100 dark:border-neutral-700 shadow-sm flex items-start gap-4">
                                            <div className="p-3 bg-white dark:bg-neutral-700 rounded-2xl text-yellow-500 shadow-sm shrink-0">
                                                <QrCode size={24} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2 mb-2">
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{batch.crop}</h4>
                                                        <p className="text-[10px] text-gray-400 font-mono italic truncate">{batch.batchId}</p>
                                                    </div>
                                                    <div className="flex gap-2 shrink-0">
                                                        <button
                                                            onClick={() => {
                                                                setShowHistoryModal(false);
                                                                onViewTraceability(batch);
                                                            }}
                                                            className="p-2.5 bg-white dark:bg-neutral-700 rounded-xl text-gray-400 hover:text-agro-green shadow-sm border border-gray-100 dark:border-neutral-600 transition-all active:scale-95"
                                                            title="Passaporte"
                                                        >
                                                            <QrCode size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => generateHarvestJournalPDF(batch)}
                                                            className="p-2.5 bg-white dark:bg-neutral-700 rounded-xl text-gray-400 hover:text-blue-500 shadow-sm border border-gray-100 dark:border-neutral-600 transition-all active:scale-95"
                                                            title="Histórico PDF"
                                                        >
                                                            <FileText size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="text-[10px] font-bold bg-green-100/50 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-lg border border-green-200/50 dark:border-green-800/20 flex items-center gap-1.5 leading-none h-6">
                                                        <Package size={12} /> {batch.quantity} {batch.unit}
                                                    </span>
                                                    <span className="text-[10px] font-bold bg-gray-200/50 dark:bg-neutral-600 text-gray-500 dark:text-gray-300 px-2 py-0.5 rounded-lg border border-gray-300/30 dark:border-white/10 flex items-center gap-1.5 leading-none h-6">
                                                        <Calendar size={12} /> {new Date(batch.harvestDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            />
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4" onClick={() => setIsModalOpen(false)}>
                    <div
                        className="bg-white dark:bg-neutral-900 w-full max-w-2xl p-6 md:p-10 rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl animate-slide-up border border-white/20 overflow-y-auto max-h-[95vh] md:max-h-[90vh] custom-scrollbar"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl md:text-3xl font-black dark:text-white uppercase italic tracking-tighter flex items-center gap-2">
                                    <Plus className="text-agro-green" size={28} /> Novo Cultivo
                                </h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Registo Geográfico e Agronómico</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 bg-gray-100 dark:bg-neutral-800 rounded-full hover:bg-gray-200 transition-colors">
                                <X size={24} className="dark:text-white" />
                            </button>
                        </div>

                        <div className="space-y-8">
                            {/* Section 1: Identificação */}
                            <div className="bg-gray-50/50 dark:bg-black/20 p-5 rounded-[2rem] border border-gray-100 dark:border-white/5">
                                <h4 className="text-[10px] font-black uppercase text-agro-green tracking-widest mb-4 flex items-center gap-2">
                                    <FileCheck size={14} /> Identificação da Parcela
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-gray-400 ml-2">Nome do Campo</label>
                                        <input
                                            autoFocus
                                            className="w-full p-4 bg-white dark:bg-neutral-800 rounded-2xl mt-1 dark:text-white border-2 border-transparent focus:border-agro-green outline-none text-lg font-bold shadow-sm"
                                            placeholder="Ex: Vinha Norte"
                                            value={newName}
                                            onChange={e => setNewName(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-gray-400 ml-2">Área (Hectares)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                className="w-full p-4 bg-white dark:bg-neutral-800 rounded-2xl mt-1 dark:text-white outline-none text-lg font-bold border-2 border-transparent focus:border-agro-green shadow-sm"
                                                placeholder="0.0"
                                                value={newArea}
                                                onChange={e => setNewArea(e.target.value)}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold bg-gray-100 dark:bg-neutral-700 px-3 py-1.5 rounded-xl text-xs">
                                                ha
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Localização */}
                            <div className="bg-gray-50/50 dark:bg-black/20 p-5 rounded-[2rem] border border-gray-100 dark:border-white/5">
                                <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-4 flex items-center gap-2">
                                    <MapPin size={14} /> Coordenadas de Referência
                                </h4>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-gray-400 ml-2">Latitude</label>
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            className="w-full p-4 bg-white dark:bg-neutral-800 rounded-2xl mt-1 dark:text-white outline-none text-base font-bold border-2 border-transparent focus:border-indigo-500 shadow-sm"
                                            placeholder="41.442"
                                            value={newLat}
                                            onChange={e => setNewLat(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-gray-400 ml-2">Longitude</label>
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            className="w-full p-4 bg-white dark:bg-neutral-800 rounded-2xl mt-1 dark:text-white outline-none text-base font-bold border-2 border-transparent focus:border-indigo-500 shadow-sm"
                                            placeholder="-8.723"
                                            value={newLng}
                                            onChange={e => setNewLng(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Cultura */}
                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2 mb-3 block">Tipo de Cultura Sugerida</label>
                                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                    {CROP_TYPES.map((crop) => (
                                        <button
                                            key={crop.label}
                                            onClick={() => setSelectedCrop(crop)}
                                            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all border-2 active:scale-95 ${selectedCrop.label === crop.label
                                                ? 'bg-agro-green/10 border-agro-green shadow-md'
                                                : 'bg-white dark:bg-neutral-800 border-white/20 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10'
                                                }`}
                                        >
                                            <span className="text-2xl md:text-3xl mb-1">{crop.emoji}</span>
                                            <span className={`text-[9px] md:text-[10px] font-black uppercase truncate w-full text-center ${selectedCrop.label === crop.label ? 'text-agro-green' : 'text-gray-400'}`}>
                                                {crop.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={!newName || !newArea}
                                className={`w-full py-5 rounded-[2rem] font-black text-xl shadow-xl flex items-center justify-center gap-3 mt-6 transition-all active:scale-95 ${!newName || !newArea
                                    ? 'bg-gray-200 dark:bg-neutral-800 text-gray-400 cursor-not-allowed shadow-none'
                                    : 'bg-agro-green text-white hover:bg-green-600 shadow-agro-green/30'
                                    }`}
                            >
                                <Save size={24} /> Confirmar Registo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FIELD NOTEBOOK COMPONENT */}
            <FieldNotebook
                isOpen={isNotebookOpen}
                onClose={() => setIsNotebookOpen(false)}
                fields={fields}
                stocks={stocks}
                employees={employees}
                operatorName={operatorName}
                onSave={onAddLog}
            />

            {showRouteOptimizer && (
                <RouteOptimizationModal
                    isOpen={showRouteOptimizer}
                    onClose={() => setShowRouteOptimizer(false)}
                    fields={fields}
                    forecast={detailedForecast}
                />
            )}

            {showIoTWizard && (
                <IoTPairingWizard
                    onClose={() => setShowIoTWizard(false)}
                    fields={fields}
                    onPair={onRegisterSensor}
                />
            )}
        </motion.div>
    );
};

export default CultivationView;
