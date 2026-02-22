import React, { useState, useEffect, useRef } from 'react';
import {
    X, Save, Calendar, Sprout, Database,
    ShieldCheck, FileText,
    Users, Clock, DollarSign, Beaker, Droplets, Camera, Image as ImageIcon, Loader2
} from 'lucide-react';
import { uploadFieldLogPhotos } from '../services/photoUploadService';
import { motion, AnimatePresence } from 'framer-motion';
import { Field, StockItem, Employee } from '../types';

export type RegistryType = 'treatment' | 'fertilization' | 'observation' | 'labor' | 'irrigation' | 'analysis';

interface FieldRegistryModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: RegistryType;
    field: Field;
    stocks: StockItem[];
    employees?: Employee[];
    onConfirm: (data: any) => void;
}

const FieldRegistryModal: React.FC<FieldRegistryModalProps> = ({
    isOpen, onClose, type, field, stocks, employees = [], onConfirm
}) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedStockId, setSelectedStockId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState('');

    // Phytosanitary specific
    const [productName, setProductName] = useState('');
    const [apv, setApv] = useState('');
    const [activeSubstance, setActiveSubstance] = useState('');
    const [safetyDays, setSafetyDays] = useState('');
    const [target, setTarget] = useState('');
    const [operatorName, setOperatorName] = useState('');

    // Observation specific
    const [notes, setNotes] = useState('');

    // Labor specific
    const [employeeId, setEmployeeId] = useState('');
    const [hours, setHours] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');

    // Irrigation specific
    const [duration, setDuration] = useState('');
    const [volume, setVolume] = useState('');
    const [method, setMethod] = useState('Gota-a-Gota');

    // Analysis specific
    const [labName, setLabName] = useState('');
    const [analysisType, setAnalysisType] = useState('Solo');
    const [resultSummary, setResultSummary] = useState('');

    // Attachments (files for preview; uploaded to Supabase on submit)
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);
    const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const previewUrlsRef = useRef<string[]>([]);

    // Reset form on open/type change
    useEffect(() => {
        if (isOpen) {
            setDate(new Date().toISOString().split('T')[0]);
            setNotes('');
            setQuantity('');
            setProductName('');
            setEmployeeId('');
            setHours('');
            setDuration('');
            setVolume('');
            setMethod('Gota-a-Gota');
            setLabName('');
            setAnalysisType('Solo');
            setResultSummary('');
            // Revoke old preview URLs
            previewUrlsRef.current.forEach(URL.revokeObjectURL);
            setPhotoFiles([]);
            setPhotoPreviewUrls([]);
            previewUrlsRef.current = [];
            // Default Unit
            if (type === 'fertilization') setUnit('kg');
            if (type === 'treatment') setUnit('L');
        }
    }, [isOpen, type]);

    // Auto-fill details when stock is selected
    useEffect(() => {
        if (selectedStockId) {
            const stock = stocks.find(s => s.id === selectedStockId);
            if (stock) {
                setProductName(stock.name);
                setUnit(stock.unit);
            }
        }
    }, [selectedStockId, stocks]);

    // Auto-fill hourly rate when employee is selected
    useEffect(() => {
        if (employeeId) {
            const emp = employees.find(e => e.id === employeeId);
            if (emp) {
                setHourlyRate(emp.hourlyRate.toString());
            }
        }
    }, [employeeId, employees]);

    // if (!isOpen) return null; // Handled by AnimatePresence

    const handleSubmit = async () => {
        setIsUploading(true);
        // Generate a temporary log ID for the storage path
        const tempLogId = `log-${Date.now()}`;
        let uploadedUrls: string[] = [];
        if (photoFiles.length > 0) {
            try {
                uploadedUrls = await uploadFieldLogPhotos(photoFiles, field.id, tempLogId);
            } catch (err) {
                console.error('[FieldRegistryModal] Photo upload failed:', err);
                // Continue without photos rather than blocking the log
            }
        }
        setIsUploading(false);

        const baseData = {
            date,
            type,
            fieldId: field.id,
            attachments: uploadedUrls
        };

        let specificData = {};

        switch (type) {
            case 'treatment': // Fitossanitário
                specificData = {
                    productName,
                    stockId: selectedStockId,
                    apv,
                    activeSubstance,
                    safetyDays: Number(safetyDays),
                    target,
                    operator: operatorName,
                    quantity: Number(quantity),
                    unit,
                    description: `Aplicação Fito: ${productName}`
                };
                break;
            case 'fertilization': // Fertilização
                specificData = {
                    stockId: selectedStockId,
                    productName: stocks.find(s => s.id === selectedStockId)?.name || 'Fertilizante',
                    quantity: Number(quantity),
                    unit,
                    description: `Fertilização: ${stocks.find(s => s.id === selectedStockId)?.name}`
                };
                break;
            case 'observation': // Observações
                specificData = {
                    description: notes
                };
                break;
            case 'labor': // Mão de Obra
                specificData = {
                    employeeId,
                    hoursWorked: Number(hours),
                    hourlyRate: Number(hourlyRate),
                    cost: Number(hours) * Number(hourlyRate),
                    description: `Mão de Obra: ${employees.find(e => e.id === employeeId)?.name || 'Funcionário'} (${hours}h)`
                };
                break;
            case 'irrigation': // Rega Manual
                specificData = {
                    duration: Number(duration),
                    volume: Number(volume),
                    method,
                    description: `Rega Manual: ${duration}min (${volume} m³)`
                };
                break;
            case 'analysis': // Análises
                specificData = {
                    labName,
                    analysisType,
                    resultSummary,
                    description: `Análise de ${analysisType} - ${labName}`
                };
                break;
        }

        onConfirm({ ...baseData, ...specificData });
        onClose();
    };

    const getTitle = () => {
        switch (type) {
            case 'treatment': return 'Registo Fitossanitário';
            case 'fertilization': return 'Registo Fertilização';
            case 'observation': return 'Registo de Observação';
            case 'labor': return 'Apontamento de Horas';
            case 'irrigation': return 'Registo de Rega';
            case 'analysis': return 'Registo de Análise';
            default: return 'Novo Registo';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'treatment': return <ShieldCheck size={24} className="text-emerald-500" />;
            case 'fertilization': return <Sprout size={24} className="text-emerald-500" />;
            case 'observation': return <FileText size={24} className="text-blue-500" />;
            case 'labor': return <Clock size={24} className="text-orange-500" />;
            case 'irrigation': return <Droplets size={24} className="text-cyan-500" />;
            case 'analysis': return <Beaker size={24} className="text-purple-500" />;
            default: return <Database size={24} />;
        }
    };

    // Filter stocks based on type
    const relevantStocks = stocks.filter(s => {
        if (type === 'treatment') return s.category === 'Fito' || s.category === 'Medicamento';
        if (type === 'fertilization') return s.category === 'Fertilizante' || s.category === 'Outro';
        return true;
    });

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[250] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm md:p-4"
                        onClick={onClose}
                    >
                        {/* Modal Content */}
                        <motion.div
                            initial={{ y: "100%", opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-white dark:bg-neutral-900 w-full md:max-w-2xl rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] md:shadow-2xl border-t md:border border-white/20 flex flex-col h-[92vh] md:h-auto md:max-h-[90vh]"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Handle Bar (Mobile) */}
                            <div className="w-12 h-1.5 bg-gray-300 dark:bg-neutral-700 rounded-full mx-auto mt-4 mb-2 md:hidden" />

                            {/* Header */}
                            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/5 pt-2 md:pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-neutral-800 flex items-center justify-center shadow-inner">
                                        {getIcon()}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 dark:text-white leading-none">{getTitle()}</h3>
                                        <p className="text-xs font-bold text-gray-400 uppercase mt-1">{field.name}</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors">
                                    <X size={20} className="dark:text-white" />
                                </button>
                            </div>

                            {/* Scrollable Form Content */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 pb-20 md:pb-6">

                                {/* Common Field: Date & Parcel */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Data</label>
                                        <div className="relative">
                                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="date"
                                                value={date}
                                                onChange={e => setDate(e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-neutral-800 rounded-xl pl-9 pr-3 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-agro-green"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Parcela</label>
                                        <select className="w-full bg-gray-100 dark:bg-neutral-800/50 rounded-xl px-4 py-3 font-bold text-sm text-gray-700 outline-none" disabled>
                                            <option value={field.id}>{field.name}</option>
                                        </select>
                                    </div>
                                </div>

                                {/* VISUAL EVIDENCE */}
                                <div className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1.5">
                                            <Camera size={12} className="text-agro-green" />
                                            Evidências Fotográficas
                                            {photoFiles.length > 0 && (
                                                <span className="ml-1 bg-agro-green text-white text-[9px] font-bold px-2 py-0.5 rounded-full">{photoFiles.length}</span>
                                            )}
                                        </label>
                                        {/* Pick from gallery (multiple) */}
                                        <label className="flex items-center gap-1 px-3 py-1.5 bg-agro-green/10 text-agro-green rounded-xl text-[10px] font-bold cursor-pointer hover:bg-agro-green/20 transition-colors">
                                            <ImageIcon size={12} />
                                            Galeria
                                            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                                                if (!e.target.files) return;
                                                const newFiles = Array.from(e.target.files);
                                                const newUrls = newFiles.map(f => URL.createObjectURL(f));
                                                previewUrlsRef.current = [...previewUrlsRef.current, ...newUrls];
                                                setPhotoFiles(prev => [...prev, ...newFiles]);
                                                setPhotoPreviewUrls(prev => [...prev, ...newUrls]);
                                                e.target.value = '';
                                            }} />
                                        </label>
                                    </div>

                                    {/* Camera capture button */}
                                    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                                        <label className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 dark:border-neutral-600 flex flex-col items-center justify-center cursor-pointer hover:bg-white dark:hover:bg-neutral-700 transition-colors shrink-0 group">
                                            <Camera size={22} className="text-gray-400 mb-1 group-hover:text-agro-green transition-colors" />
                                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wide">Câmara</span>
                                            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                                                if (!e.target.files || !e.target.files[0]) return;
                                                const f = e.target.files[0];
                                                const url = URL.createObjectURL(f);
                                                previewUrlsRef.current = [...previewUrlsRef.current, url];
                                                setPhotoFiles(prev => [...prev, f]);
                                                setPhotoPreviewUrls(prev => [...prev, url]);
                                                e.target.value = '';
                                            }} />
                                        </label>

                                        {/* Thumbnails */}
                                        {photoPreviewUrls.map((url, idx) => (
                                            <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 border-gray-200 dark:border-neutral-700 group shadow-sm">
                                                <img src={url} className="w-full h-full object-cover" alt={`foto ${idx + 1}`} />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        URL.revokeObjectURL(url);
                                                        previewUrlsRef.current = previewUrlsRef.current.filter(u => u !== url);
                                                        setPhotoFiles(prev => prev.filter((_, i) => i !== idx));
                                                        setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== idx));
                                                    }}
                                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                                >
                                                    <X size={18} className="text-white" strokeWidth={3} />
                                                </button>
                                                <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] font-bold px-1 rounded">{idx + 1}</div>
                                            </div>
                                        ))}

                                        {photoFiles.length === 0 && (
                                            <div className="flex items-center text-[10px] text-gray-400 italic pl-1">
                                                Nenhuma foto adicionada
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* --- TYPE SPECIFIC FORMS --- */}

                                {/* 1. PHYTOSANITARY & FERTILIZATION (Stock Select) */}
                                {(type === 'treatment' || type === 'fertilization') && (
                                    <div className="space-y-4 animate-slide-up">
                                        <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-2xl border border-yellow-100 dark:border-yellow-900/30">
                                            <label className="text-[10px] font-bold uppercase text-yellow-700 dark:text-yellow-500 mb-2 block flex items-center gap-1">
                                                <Database size={12} /> Selecionar do Stock
                                            </label>
                                            <select
                                                value={selectedStockId}
                                                onChange={e => setSelectedStockId(e.target.value)}
                                                className="w-full bg-white dark:bg-neutral-800 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-yellow-500"
                                            >
                                                <option value="">Selecione um produto...</option>
                                                {relevantStocks.length > 0 ? relevantStocks.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} ({s.quantity} {s.unit})</option>
                                                )) : (
                                                    <option disabled>Sem stock disponível</option>
                                                )}
                                            </select>
                                        </div>

                                        {type === 'treatment' && (
                                            <div className="space-y-4">
                                                {/* Dados Legais Obrigatórios */}
                                                <div className="p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                                                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-3 block border-b pb-2">Dados Legais Obrigatórios</label>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Nome Comercial</label>
                                                            <input
                                                                value={productName}
                                                                onChange={e => setProductName(e.target.value)}
                                                                className="w-full bg-white dark:bg-neutral-900 rounded-xl px-3 py-2 font-bold text-sm border border-gray-200 dark:border-white/10"
                                                                placeholder="Nome do produto"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Nº APV</label>
                                                                <input
                                                                    value={apv}
                                                                    onChange={e => setApv(e.target.value)}
                                                                    placeholder="0000"
                                                                    className="w-full bg-white dark:bg-neutral-900 rounded-xl px-3 py-2 font-bold text-sm border border-gray-200 dark:border-white/10"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Substância Ativa</label>
                                                                <input
                                                                    value={activeSubstance}
                                                                    onChange={e => setActiveSubstance(e.target.value)}
                                                                    placeholder="ex: Glifosato"
                                                                    className="w-full bg-white dark:bg-neutral-900 rounded-xl px-3 py-2 font-bold text-sm border border-gray-200 dark:border-white/10"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">IS (Dias)</label>
                                                                <input
                                                                    type="number"
                                                                    value={safetyDays}
                                                                    onChange={e => setSafetyDays(e.target.value)}
                                                                    placeholder="0"
                                                                    className="w-full bg-white dark:bg-neutral-900 rounded-xl px-3 py-2 font-bold text-sm border border-gray-200 dark:border-white/10"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Aplicador (Nome)</label>
                                                                <input
                                                                    value={operatorName}
                                                                    onChange={e => setOperatorName(e.target.value)}
                                                                    placeholder="Nome do Aplicador"
                                                                    className="w-full bg-white dark:bg-neutral-900 rounded-xl px-3 py-2 font-bold text-sm border border-gray-200 dark:border-white/10"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Praga / Doença Alvo</label>
                                                            <input
                                                                value={target}
                                                                onChange={e => setTarget(e.target.value)}
                                                                placeholder="ex: Míldio, Afídios"
                                                                className="w-full bg-white dark:bg-neutral-900 rounded-xl px-3 py-2 font-bold text-sm border border-gray-200 dark:border-white/10"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Quantidade</label>
                                                <input
                                                    type="number"
                                                    value={quantity}
                                                    onChange={e => setQuantity(e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-full bg-gray-50 dark:bg-neutral-800 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-agro-green"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Unidade</label>
                                                <select
                                                    value={unit}
                                                    onChange={e => setUnit(e.target.value)}
                                                    className="w-full bg-gray-50 dark:bg-neutral-800 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-agro-green"
                                                >
                                                    <option value="L">L (Litros)</option>
                                                    <option value="kg">kg (Quilos)</option>
                                                    <option value="g">g (Gramas)</option>
                                                    <option value="ml">ml (Mililitros)</option>
                                                    <option value="un">un (Unidades)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 2. OBSERVATION */}
                                {type === 'observation' && (
                                    <div className="space-y-1 animate-slide-up">
                                        <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Nota de Campo</label>
                                        <textarea
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            rows={6}
                                            placeholder="Escreva as suas observações sobre o estado da cultura, pragas avistadas, ou outras notas relevantes..."
                                            className="w-full bg-gray-50 dark:bg-neutral-800 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-agro-green resize-none"
                                        />
                                    </div>
                                )}

                                {/* 3. LABOR (MÃO DE OBRA) */}
                                {type === 'labor' && (
                                    <div className="space-y-4 animate-slide-up">
                                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                            <label className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-500 mb-2 block flex items-center gap-1">
                                                <Users size={12} /> Funcionário
                                            </label>
                                            <select
                                                value={employeeId}
                                                onChange={e => setEmployeeId(e.target.value)}
                                                className="w-full bg-white dark:bg-neutral-800 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Selecione o funcionário...</option>
                                                {employees.length > 0 ? employees.map(e => (
                                                    <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                                                )) : (
                                                    <>
                                                        <option value="temp1">João Silva (Operador)</option>
                                                        <option value="temp2">Maria Santos (Técnica)</option>
                                                        <option value="temp3">Carlos Ferreira (Mecânico)</option>
                                                    </>
                                                )}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1 flex items-center gap-1"><Clock size={10} /> Horas</label>
                                                <input
                                                    type="number"
                                                    value={hours}
                                                    onChange={e => setHours(e.target.value)}
                                                    placeholder="ex: 8"
                                                    className="w-full bg-gray-50 dark:bg-neutral-800 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-agro-green"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1 flex items-center gap-1"><DollarSign size={10} /> Custo / Hora (€)</label>
                                                <input
                                                    type="number"
                                                    value={hourlyRate}
                                                    onChange={e => setHourlyRate(e.target.value)}
                                                    placeholder="ex: 7.50"
                                                    className="w-full bg-gray-50 dark:bg-neutral-800 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-agro-green"
                                                />
                                            </div>
                                        </div>

                                        {hours && hourlyRate && (
                                            <div className="p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl flex justify-between items-center animate-fade-in">
                                                <span className="text-xs font-bold text-gray-400 uppercase">Custo Total Estimado</span>
                                                <span className="text-xl font-black text-gray-900 dark:text-white">
                                                    {(Number(hours) * Number(hourlyRate)).toFixed(2)} €
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 4. IRRIGATION (REGA) */}
                                {type === 'irrigation' && (
                                    <div className="space-y-4 animate-slide-up">
                                        <div className="bg-cyan-50 dark:bg-cyan-900/10 p-4 rounded-2xl border border-cyan-100 dark:border-cyan-900/30">
                                            <label className="text-[10px] font-bold uppercase text-cyan-700 dark:text-cyan-500 mb-2 block flex items-center gap-1">
                                                <Droplets size={12} /> Detalhes da Rega
                                            </label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Duração (min)</label>
                                                    <input
                                                        type="number"
                                                        value={duration}
                                                        onChange={e => setDuration(e.target.value)}
                                                        placeholder="ex: 45"
                                                        className="w-full bg-white dark:bg-neutral-800 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Volume (m³)</label>
                                                    <input
                                                        type="number"
                                                        value={volume}
                                                        onChange={e => setVolume(e.target.value)}
                                                        placeholder="ex: 150"
                                                        className="w-full bg-white dark:bg-neutral-800 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Método</label>
                                            <select
                                                value={method}
                                                onChange={e => setMethod(e.target.value)}
                                                className="w-full bg-gray-50 dark:bg-neutral-800 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-cyan-500"
                                            >
                                                <option value="Gota-a-Gota">Gota-a-Gota</option>
                                                <option value="Aspersão">Aspersão</option>
                                                <option value="Pivô">Pivô Central</option>
                                                <option value="Manual">Manual / Regadeira</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* 5. ANALYSIS (ANÁLISES) */}
                                {type === 'analysis' && (
                                    <div className="space-y-4 animate-slide-up">
                                        <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Tipo de Análise</label>
                                                    <select
                                                        value={analysisType}
                                                        onChange={e => setAnalysisType(e.target.value)}
                                                        className="w-full bg-white dark:bg-neutral-800 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-purple-500"
                                                    >
                                                        <option value="Solo">Solo</option>
                                                        <option value="Foliar">Foliar</option>
                                                        <option value="Água">Água</option>
                                                        <option value="Fruto">Fruto</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Laboratório</label>
                                                    <input
                                                        value={labName}
                                                        onChange={e => setLabName(e.target.value)}
                                                        placeholder="Nome do Lab"
                                                        className="w-full bg-white dark:bg-neutral-800 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-purple-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Resumo dos Resultados</label>
                                            <textarea
                                                value={resultSummary}
                                                onChange={e => setResultSummary(e.target.value)}
                                                rows={4}
                                                placeholder="Principais conclusões da análise..."
                                                className="w-full bg-gray-50 dark:bg-neutral-800 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                            />
                                        </div>
                                    </div>
                                )}

                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-neutral-900/50 pb-8 md:pb-6">
                                <button
                                    onClick={handleSubmit}
                                    disabled={isUploading}
                                    className="w-full py-4 bg-agro-green text-white rounded-xl font-bold shadow-lg shadow-agro-green/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isUploading ? (
                                        <><Loader2 size={18} className="animate-spin" /> A carregar fotos...</>
                                    ) : (
                                        <><Save size={18} /> Confirmar Registo</>
                                    )}
                                </button>
                            </div>

                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default FieldRegistryModal;
