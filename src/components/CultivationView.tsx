import React, { useState, useEffect } from 'react';
import { Wifi, Plus, FileCheck, X, QrCode, Package, Calendar, ArrowRight, Save } from 'lucide-react';
import { Field, StockItem, Employee, ProductBatch, FieldLog, Sensor } from '../types';
import { CROP_TYPES } from '../constants';
import FieldCard from './FieldCard';
import FieldNotebook from './FieldNotebook';
import IoTPairingWizard from './IoTPairingWizard';

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
    onModalChange?: (isOpen: boolean) => void;
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
    onModalChange,
    operatorName,
    onRegisterSale,
    onHarvest,
    onViewTraceability,
    onDeleteField
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNotebookOpen, setIsNotebookOpen] = useState(false);
    const [showIoTWizard, setShowIoTWizard] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [anyFieldOpen, setAnyFieldOpen] = useState(false);

    const [newName, setNewName] = useState('');
    const [newArea, setNewArea] = useState('');
    const [selectedCrop, setSelectedCrop] = useState(CROP_TYPES[0]);

    useEffect(() => {
        if (onModalChange) {
            onModalChange(isModalOpen || isNotebookOpen || showIoTWizard || anyFieldOpen || showHistoryModal);
        }
    }, [isModalOpen, isNotebookOpen, showIoTWizard, anyFieldOpen, showHistoryModal, onModalChange]);

    const handleSubmit = () => {
        if (newName && newArea) {
            onAddField({
                name: newName,
                areaHa: parseFloat(newArea),
                crop: selectedCrop.label,
                emoji: selectedCrop.emoji
            });
            setIsModalOpen(false);
            setNewName('');
            setNewArea('');
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
                        onModalChange={setAnyFieldOpen}
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
                <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)}>
                    <div
                        className="bg-white dark:bg-neutral-900 w-full max-w-md p-6 rounded-t-[2.5rem] shadow-2xl animate-slide-up border-t border-white/20"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold dark:text-white">Novo Cultivo</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                                <X size={20} className="dark:text-white" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-400 ml-2">Nome do Campo</label>
                                <input
                                    autoFocus
                                    className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl mt-1 dark:text-white border-2 border-transparent focus:border-agro-green outline-none text-lg font-bold"
                                    placeholder="Ex: Vinha Norte"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase text-gray-400 ml-2">Área (Hectares)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl mt-1 dark:text-white outline-none text-lg font-bold"
                                        placeholder="0.0"
                                        value={newArea}
                                        onChange={e => setNewArea(e.target.value)}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold bg-gray-200 dark:bg-neutral-700 px-2 py-1 rounded-lg text-xs">
                                        ha
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase text-gray-400 ml-2">Tipo de Cultura</label>
                                <div className="grid grid-cols-4 gap-2 mt-2">
                                    {CROP_TYPES.map((crop) => (
                                        <button
                                            key={crop.label}
                                            onClick={() => setSelectedCrop(crop)}
                                            className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all border-2 ${selectedCrop.label === crop.label
                                                ? 'bg-agro-green/10 border-agro-green'
                                                : 'bg-gray-5 dark:bg-neutral-800 border-transparent hover:bg-gray-100 dark:hover:bg-neutral-700'
                                                }`}
                                        >
                                            <span className="text-2xl mb-1">{crop.emoji}</span>
                                            <span className={`text-[10px] font-bold ${selectedCrop.label === crop.label ? 'text-agro-green' : 'text-gray-500'}`}>
                                                {crop.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={!newName || !newArea}
                                className={`w-full py-4 rounded-[1.5rem] font-bold text-lg shadow-lg flex items-center justify-center gap-2 mt-4 transition-all ${!newName || !newArea
                                    ? 'bg-gray-300 dark:bg-neutral-800 text-gray-500 cursor-not-allowed'
                                    : 'bg-agro-green text-white active:scale-95 shadow-agro-green/30'
                                    }`}
                            >
                                <Save size={20} />
                                Criar Cultivo
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

            {showIoTWizard && (
                <IoTPairingWizard
                    onClose={() => setShowIoTWizard(false)}
                    fields={fields}
                    onPair={(fieldId: string, sensor: Sensor) => {
                        onRegisterSensor(fieldId, sensor);
                    }}
                />
            )}
        </div>
    );
};

export default CultivationView;
