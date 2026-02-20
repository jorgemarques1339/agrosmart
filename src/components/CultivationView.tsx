import React, { useState, useEffect } from 'react';
import { Wifi, Plus, FileCheck, X, QrCode, Package, Calendar, ArrowRight, Save, MapPin, Navigation, Sparkles } from 'lucide-react';
import { Field, StockItem, Employee, ProductBatch, FieldLog, Sensor } from '../types';
import { CROP_TYPES } from '../constants';
import FieldCard from './FieldCard';
import FieldNotebook from './FieldNotebook';
import IoTPairingWizard from './IoTPairingWizard';
import RouteOptimizationModal from './RouteOptimizationModal';
import { useStore } from '../store/useStore';

interface CultivationViewProps {
    fields: Field[];
    stocks: StockItem[];
    employees: Employee[];
    harvests: ProductBatch[];
    toggleIrrigation: (id: string, s: boolean) => void;
    onAddLog: (fieldId: string, log: Omit<FieldLog, 'id'>, stockId?: string) => void;
    onUseStock: (fieldId: string, stockId: string, quantity: number, date: string) => void;
    onAddField: (field: Pick<Field, 'name' | 'areaHa' | 'crop' | 'emoji'>) => void;
    onRegisterSensor: (fieldId: string, sensor: Sensor) => void;
    operatorName: string;
    onRegisterSale: (saleData: { stockId: string, quantity: number, pricePerUnit: number, clientName: string, date: string, fieldId?: string }) => void;
    onHarvest: (fieldId: string, data: { quantity: number; unit: string; batchId: string; date: string }) => void;
    onViewTraceability: (batch: ProductBatch) => void;
    onDeleteField: (id: string) => void;
}

const CultivationView: React.FC<CultivationViewProps> = ({
    fields,
    stocks,
    employees,
    harvests,
    toggleIrrigation,
    onAddLog,
    onUseStock,
    onAddField,
    onRegisterSensor,
    operatorName,
    onRegisterSale,
    onHarvest,
    onViewTraceability,
    onDeleteField
}) => {
    const { setChildModalOpen } = useStore();
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

    return (
        <div className="space-y-6 animate-fade-in pt-4 pb-24">
            <div className="flex justify-between items-start px-2 mb-4 md:mb-6">
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
            </div>

            <div className="flex flex-col gap-4 md:gap-6">
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
            </div>

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

                        <div className="space-y-4">
                            {harvests.slice().reverse().map((batch) => (
                                <div key={batch.batchId} className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-[1.5rem] border border-gray-100 dark:border-neutral-700 shadow-sm flex items-center gap-4">
                                    <div className="p-3 bg-white dark:bg-neutral-700 rounded-2xl text-yellow-500 shadow-sm">
                                        <QrCode size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{batch.crop}</h4>
                                        <p className="text-[10px] text-gray-400 font-mono mb-1">{batch.batchId}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                                                <Package size={10} /> {batch.quantity} {batch.unit}
                                            </span>
                                            <span className="text-[10px] font-bold bg-gray-200 dark:bg-neutral-600 text-gray-500 dark:text-gray-300 px-2 py-0.5 rounded flex items-center gap-1">
                                                <Calendar size={10} /> {new Date(batch.harvestDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowHistoryModal(false);
                                            onViewTraceability(batch);
                                        }}
                                        className="p-3 bg-white dark:bg-neutral-700 rounded-xl text-gray-400 hover:text-agro-green shadow-sm border border-gray-100 dark:border-neutral-600"
                                    >
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            ))}
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

            {
                showRouteOptimizer && (
                    <RouteOptimizationModal
                        isOpen={showRouteOptimizer}
                        onClose={() => setShowRouteOptimizer(false)}
                        fields={fields}
                        forecast={detailedForecast}
                    />
                )
            }
        </div >
    );
};

export default CultivationView;
