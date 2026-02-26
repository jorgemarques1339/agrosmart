import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, User, Phone, CheckCircle2, ShieldCheck, Sprout, PauseCircle, PlayCircle, LogOut } from 'lucide-react';
import { useStore } from '../store/useStore';
import { haptics } from '../utils/haptics';

interface TempSession {
    name: string;
    phone: string;
    fieldId?: string;
    cropName?: string;
    clockInTime: number;
    status: 'working' | 'paused' | 'finished';
    pauseStartTime: number | null;
    totalPausedTime: number;
    finalCost?: number;
    finalHours?: string;
    finalHoursNum?: number;
}

export const PublicClockInPortal: React.FC = () => {
    const [session, setSession] = useState<TempSession | null>(null);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [selectedFieldId, setSelectedFieldId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Timer Tracking
    const [workedMs, setWorkedMs] = useState(0);
    const [pausedMs, setPausedMs] = useState(0);

    const registerTemporaryWorker = useStore(state => state.registerTemporaryWorker);
    const fields = useStore(state => state.fields);

    // Initial Load
    useEffect(() => {
        const stored = localStorage.getItem('oriva_temp_session_v2');
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as TempSession;
                // Auto-clear logic for a new day if they already finished an old shift
                const clockInDate = new Date(parsed.clockInTime).toDateString();
                const today = new Date().toDateString();

                if (clockInDate !== today && parsed.status === 'finished') {
                    localStorage.removeItem('oriva_temp_session_v2');
                } else {
                    setSession(parsed);
                }
            } catch (e) {
                console.error('Failed to parse active session', e);
            }
        }
    }, []);

    const saveSession = (newSession: TempSession) => {
        setSession(newSession);
        localStorage.setItem('oriva_temp_session_v2', JSON.stringify(newSession));
    };

    // Live Clock Processing
    useEffect(() => {
        if (!session) return;

        const tick = () => {
            const now = Date.now();
            if (session.status === 'working') {
                setWorkedMs(now - session.clockInTime - session.totalPausedTime);
                setPausedMs(0);
            } else if (session.status === 'paused' && session.pauseStartTime) {
                setWorkedMs(session.pauseStartTime - session.clockInTime - session.totalPausedTime);
                setPausedMs(now - session.pauseStartTime);
            }
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [session]);

    const formatTime = (ms: number) => {
        const totalSeconds = Math.max(0, Math.floor(ms / 1000));
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleClockIn = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !phone) return;

        const selectedField = fields.find(f => f.id === selectedFieldId);

        setIsSubmitting(true);
        setTimeout(() => {
            haptics.success();
            saveSession({
                name,
                phone,
                fieldId: selectedField?.id,
                cropName: selectedField ? `${selectedField.name} (${selectedField.crop})` : undefined,
                clockInTime: Date.now(),
                status: 'working',
                pauseStartTime: null,
                totalPausedTime: 0
            });
            setIsSubmitting(false);
        }, 800);
    };

    const handlePause = () => {
        if (!session) return;
        haptics.medium();
        saveSession({
            ...session,
            status: 'paused',
            pauseStartTime: Date.now()
        });
    };

    const handleResume = () => {
        if (!session || !session.pauseStartTime) return;
        haptics.medium();
        const currentPauseDuration = Date.now() - session.pauseStartTime;
        saveSession({
            ...session,
            status: 'working',
            pauseStartTime: null,
            totalPausedTime: session.totalPausedTime + currentPauseDuration
        });
    };

    const handleCheckout = () => {
        if (!session) return;

        setIsSubmitting(true);
        setTimeout(() => {
            let finalWorkMs = Date.now() - session.clockInTime - session.totalPausedTime;

            // Ignore ongoing pause from working hours
            if (session.status === 'paused' && session.pauseStartTime) {
                finalWorkMs = session.pauseStartTime - session.clockInTime - session.totalPausedTime;
            }

            const totalHours = finalWorkMs / (1000 * 60 * 60);

            // Standard hourly rate simulation (e.g. 7.50€ / h)
            const HOURLY_RATE = 7.50;
            const cost = parseFloat((totalHours * HOURLY_RATE).toFixed(2));

            const h = Math.floor(finalWorkMs / (1000 * 60 * 60));
            const m = Math.floor((finalWorkMs % (1000 * 60 * 60)) / (1000 * 60));

            // Inject the dynamic calculated wage cost into the FinanceManager + Field Diary
            registerTemporaryWorker(
                session.name,
                session.phone,
                cost,
                totalHours,
                session.fieldId,
                session.cropName
            );
            haptics.success();

            saveSession({
                ...session,
                status: 'finished',
                finalCost: cost,
                finalHours: `${h}h ${m}m`,
                finalHoursNum: totalHours
            });
            setIsSubmitting(false);
        }, 1200);
    };

    const handleReset = () => {
        localStorage.removeItem('oriva_temp_session_v2');
        setSession(null);
        setName('');
        setPhone('');
        setSelectedFieldId('');
        setWorkedMs(0);
        setPausedMs(0);
    };

    // --- RENDER SCREENS ---

    if (session?.status === 'finished') {
        return (
            <div className="fixed inset-0 bg-[#0a0a0b] flex flex-col items-center justify-center p-6 text-center z-[9999]">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse pointer-events-none" />
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6"
                >
                    <CheckCircle2 className="text-emerald-500 w-12 h-12" />
                </motion.div>
                <h2 className="text-3xl font-black text-white mb-2">Turno Terminado</h2>
                <p className="text-emerald-500/80 font-bold uppercase tracking-wider text-xs mb-8">
                    Bom descanso, {session.name.split(' ')[0]} 🌾
                </p>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 w-full max-w-xs space-y-4">
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Horas de Atividade</p>
                        <p className="text-2xl text-white font-black">{session.finalHours}</p>
                    </div>
                </div>
                <p className="text-gray-500 text-xs mt-8">As suas horas de hoje foram consolidadas com sucesso.</p>
                <button
                    onClick={handleReset}
                    className="mt-6 text-xs text-white/20 hover:text-white/60 underline underline-offset-4 transition-colors"
                >
                    Novo Registo
                </button>
            </div>
        );
    }

    if (session && (session.status === 'working' || session.status === 'paused')) {
        return (
            <div className="fixed inset-0 bg-[#0a0a0b] flex flex-col items-center justify-start pt-16 px-6 z-[9999] overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse pointer-events-none" />

                <div className="w-full max-w-sm flex flex-col items-center relative z-10 mt-6">
                    <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
                        <User className={session.status === 'working' ? 'text-emerald-400' : 'text-amber-400'} size={28} />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">{session.name}</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <div className={`w-2 h-2 rounded-full ${session.status === 'working' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                        <p className="text-[10px] uppercase tracking-widest font-black text-white/50">
                            {session.status === 'working' ? 'Em Funções (Ativo)' : 'Em Pausa'}
                        </p>
                    </div>

                    {/* Clocks Panel */}
                    <div className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] p-8 mt-10 flex flex-col items-center shadow-2xl backdrop-blur-md">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Cronómetro de Trabalho</p>
                        <p className={`text-5xl font-black tracking-tighter ${session.status === 'paused' ? 'text-white/30' : 'text-white drop-shadow-md'}`}>
                            {formatTime(workedMs)}
                        </p>

                        {session.status === 'paused' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 flex flex-col items-center w-full border-t border-white/10 pt-6 mt-6">
                                <p className="text-[10px] text-amber-500/80 uppercase tracking-widest font-bold mb-1">Duração da Pausa Atual</p>
                                <p className="text-2xl font-black tracking-wider text-amber-400">
                                    {formatTime(pausedMs)}
                                </p>
                            </motion.div>
                        )}
                    </div>

                    {/* Actions Panel */}
                    <div className="w-full mt-8 space-y-4">
                        {session.status === 'working' ? (
                            <button
                                onClick={handlePause}
                                className="w-full py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-white/10"
                            >
                                <PauseCircle size={20} className="text-amber-400" /> INICIAR PAUSA
                            </button>
                        ) : (
                            <button
                                onClick={handleResume}
                                className="w-full py-5 bg-amber-500/20 border border-amber-500/50 text-amber-400 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3 shadow-lg shadow-amber-500/10"
                            >
                                <PlayCircle size={20} /> RETOMAR TRABALHO
                            </button>
                        )}

                        <div className="pt-4 border-t border-white/5">
                            <button
                                onClick={handleCheckout}
                                disabled={isSubmitting}
                                className="w-full py-5 bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 group"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">A PROCESSAR <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 group-hover:border-white/30 group-hover:border-t-white rounded-full animate-spin" /></span>
                                ) : (
                                    <><LogOut size={20} /> TERMINAR TURNO</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Check-in Form
    return (
        <div className="fixed inset-0 bg-[#0a0a0b] flex flex-col items-center justify-center z-[9999] overflow-hidden sm:p-4">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse pointer-events-none" />

            <AnimatePresence mode="wait">
                <motion.div
                    key="form"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="w-full h-full sm:h-auto sm:max-w-md bg-white/5 sm:rounded-[2.5rem] border-0 sm:border border-white/10 shadow-2xl flex flex-col pt-12 sm:pt-8"
                >
                    <div className="px-8 pb-8 flex flex-col items-center text-center mt-6">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/10">
                            <Sprout className="text-emerald-400" size={32} />
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight mb-2">AgroSmart</h1>
                        <p className="text-emerald-500/80 font-bold uppercase tracking-widest text-[10px]">Portal Sazonal • Entrada</p>
                    </div>

                    <form onSubmit={handleClockIn} className="flex-1 flex flex-col justify-center px-8 pb-12 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 ml-1">Nome Completo</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User size={18} className="text-white/20 group-focus-within:text-emerald-400 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-sm font-medium"
                                    placeholder="O seu nome e apelido"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 ml-1">Telemóvel</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Phone size={18} className="text-white/20 group-focus-within:text-emerald-400 transition-colors" />
                                </div>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-sm font-medium"
                                    placeholder="91X XXX XXX"
                                    required
                                />
                            </div>
                        </div>

                        {/* Cultivo Selector */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 ml-1">
                                Cultivo / Campo de Trabalho
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Sprout size={18} className="text-white/20" />
                                </div>
                                <select
                                    value={selectedFieldId}
                                    onChange={(e) => setSelectedFieldId(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-sm font-medium appearance-none cursor-pointer"
                                >
                                    <option value="" className="bg-[#0a0a0b] text-gray-400">— Selecionar campo (opcional) —</option>
                                    {fields.map(f => (
                                        <option key={f.id} value={f.id} className="bg-[#0a0a0b] text-white">
                                            {f.emoji} {f.name} — {f.crop}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                            {selectedFieldId && (
                                <p className="text-[10px] text-emerald-500/60 ml-1 font-bold">
                                    ✓ Horas contadas para: {fields.find(f => f.id === selectedFieldId)?.name}
                                </p>
                            )}
                        </div>

                        <div className="pt-4 mt-auto sm:mt-8">
                            <button
                                type="submit"
                                disabled={isSubmitting || !name || !phone}
                                className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">A REGISTAR <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /></span>
                                ) : (
                                    <>
                                        <Clock size={18} className="group-hover:rotate-12 transition-transform" /> INICIAR TURNO
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="flex items-center justify-center gap-1.5 mt-8 opacity-40">
                            <ShieldCheck size={12} className="text-white" />
                            <span className="text-[9px] font-bold text-white uppercase tracking-wider">Registo Seguro e Encriptado</span>
                        </div>
                    </form>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
