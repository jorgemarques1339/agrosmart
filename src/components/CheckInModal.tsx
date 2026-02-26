
import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, CheckCircle2, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Field } from '../types';
import { haptics } from '../utils/haptics';
import clsx from 'clsx';

interface CheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    fields: Field[];
    activeSession: any;
    onStartSession: (fieldId: string, manual: boolean) => void;
    onEndSession: () => void;
}

const CheckInModal: React.FC<CheckInModalProps> = ({
    isOpen,
    onClose,
    fields,
    activeSession,
    onStartSession,
    onEndSession
}) => {
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [elapsedTime, setElapsedTime] = useState('00:00:00');

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (activeSession) {
            timer = setInterval(() => {
                const start = new Date(activeSession.startTime).getTime();
                const now = new Date().getTime();
                const diff = now - start;

                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const s = Math.floor((diff % 60000) / 1000);

                setElapsedTime(
                    `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
                );
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [activeSession]);

    const handleCheckIn = () => {
        if (!selectedFieldId) return;
        haptics.success();
        onStartSession(selectedFieldId, true);
    };

    const handleCheckOut = () => {
        haptics.warning();
        onEndSession();
    };

    // Removed early return to comply with Rules of Hooks
    // if (!isOpen) return null;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-[#FDFDF5] dark:bg-[#0A0A0A] w-full max-w-sm rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 pt-6 pb-4 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black dark:text-white">Check-in Pessoal</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gestão de RH & Custos</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                        <X size={20} className="dark:text-white" />
                    </button>
                </div>

                <div className="p-6">
                    {!activeSession ? (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Selecionar Parcela</label>
                                <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto no-scrollbar pr-1">
                                    {fields.map(field => (
                                        <button
                                            key={field.id}
                                            onClick={() => setSelectedFieldId(field.id)}
                                            className={clsx(
                                                "flex items-center gap-3 p-4 rounded-3xl border transition-all text-left group",
                                                selectedFieldId === field.id
                                                    ? "bg-agro-green border-agro-green shadow-lg shadow-agro-green/30"
                                                    : "bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800 hover:border-agro-green/50"
                                            )}
                                        >
                                            <div className={clsx(
                                                "w-10 h-10 rounded-2xl flex items-center justify-center text-xl",
                                                selectedFieldId === field.id ? "bg-white/20" : "bg-gray-100 dark:bg-neutral-800"
                                            )}>
                                                {field.emoji || '🌱'}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className={clsx("font-black text-sm", selectedFieldId === field.id ? "text-white" : "dark:text-white")}>
                                                    {field.name}
                                                </h4>
                                                <p className={clsx("text-[10px] font-bold", selectedFieldId === field.id ? "text-white/80" : "text-gray-400")}>
                                                    {field.crop} • {field.areaHa} ha
                                                </p>
                                            </div>
                                            {selectedFieldId === field.id && (
                                                <CheckCircle2 size={20} className="text-white animate-scale-in" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleCheckIn}
                                disabled={!selectedFieldId}
                                className={clsx(
                                    "w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:grayscale",
                                    "bg-gradient-to-r from-agro-green to-emerald-600 text-white shadow-agro-green/20"
                                )}
                            >
                                Iniciar Trabalho
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-center py-8 space-y-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-agro-green/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
                                <div className="relative w-32 h-32 rounded-full border-4 border-agro-green flex flex-col items-center justify-center bg-white dark:bg-neutral-900 shadow-2xl">
                                    <Clock size={32} className="text-agro-green mb-1 animate-pulse" />
                                    <span className="text-lg font-black dark:text-white font-mono">{elapsedTime}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-lg font-black dark:text-white">Em Trabalho</h4>
                                <div className="flex items-center justify-center gap-2 px-4 py-2 bg-agro-green/10 rounded-full border border-agro-green/20">
                                    <MapPin size={14} className="text-agro-green" />
                                    <span className="text-xs font-bold text-agro-green">
                                        {fields.find(f => f.id === activeSession.fieldId)?.name || 'Parcela'}
                                    </span>
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">
                                    Iniciado às {new Date(activeSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>

                            <button
                                onClick={handleCheckOut}
                                className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-red-500 to-rose-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all"
                            >
                                Terminar & Registar
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50 dark:bg-neutral-900/50 border-t border-gray-100 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                            <Navigation size={14} />
                        </div>
                        <p className="text-[9px] font-medium text-gray-500 dark:text-neutral-400 leading-tight">
                            Geofencing Ativo: O sistema irá sugerir automaticamente o check-in quando entrar numa zona de trabalho.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CheckInModal;
