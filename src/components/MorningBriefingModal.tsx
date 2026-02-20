
import React from 'react';
import { X, Tractor, Droplets, ShieldAlert, CheckCircle, ChevronRight, Sun, Activity, Zap } from 'lucide-react';
import { Machine, Field, UserProfile } from '../types';

interface MorningBriefingModalProps {
    isOpen: boolean;
    onClose: () => void;
    userName: string;
    machines: Machine[];
    fields: Field[];
    users: UserProfile[];
    onNavigate: (tab: string) => void;
}

const MorningBriefingModal: React.FC<MorningBriefingModalProps> = ({
    isOpen,
    onClose,
    userName,
    machines,
    fields,
    users,
    onNavigate
}) => {
    if (!isOpen) return null;

    const urgentMachines = machines.filter(m => {
        const hoursUntilService = (m.lastServiceHours + m.serviceInterval) - m.engineHours;
        return hoursUntilService <= 10 && hoursUntilService > 0;
    });

    const stressedFields = fields.filter(f => f.humidity < 15);
    const emergencyUsers = users.filter(u => u.safetyStatus?.status === 'emergency');

    const greeting = (() => {
        const hour = new Date().getHours();
        if (hour >= 13 && hour < 20) return 'Boa tarde';
        if (hour >= 20 || hour < 6) return 'Boa noite';
        return 'Bom dia';
    })();

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 animate-fade-in">
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-sm bg-[#FDFDF5] dark:bg-[#0A0A0A] rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-up border border-white/20 dark:border-neutral-800 flex flex-col max-h-[85vh]">

                {/* Header with Greeting */}
                <div className="p-6 pb-2">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-400 to-orange-500 p-[2px] shadow-lg shadow-orange-500/20">
                                <div className="w-full h-full rounded-2xl bg-[#FDFDF5] dark:bg-[#0A0A0A] flex items-center justify-center">
                                    <Sun size={24} className="text-orange-500 animate-pulse-slow" />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                                    {greeting},<br /> {userName.split(' ')[0]}
                                </h3>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full text-gray-500 dark:text-gray-400"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-neutral-900 px-3 py-1.5 rounded-full inline-block">
                        Briefing Matinal • Resumo Operacional
                    </p>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">

                    {/* 1. Manutenção Preditiva */}
                    <section className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                            <Tractor size={12} /> Manutenção Preditiva
                        </h4>

                        {urgentMachines.length > 0 ? (
                            <div className="space-y-2">
                                {urgentMachines.map(m => {
                                    const hoursUntilService = (m.lastServiceHours + m.serviceInterval) - m.engineHours;
                                    return (
                                        <div key={m.id} className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 p-4 rounded-3xl flex items-center justify-between group cursor-pointer hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all"
                                            onClick={() => { onNavigate('machines'); onClose(); }}>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/20">
                                                    <Zap size={18} fill="currentColor" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{m.name}</p>
                                                    <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-tight">Limite em {Math.round(hoursUntilService)}h</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-rose-400 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 p-4 rounded-3xl flex items-center gap-3">
                                <CheckCircle size={20} className="text-emerald-500" />
                                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Frota operacional e em conformidade.</span>
                            </div>
                        )}
                    </section>

                    {/* 2. Monitorização do Solo */}
                    <section className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                            <Droplets size={12} /> Saúde Hídrica
                        </h4>

                        {stressedFields.length > 0 ? (
                            <div className="space-y-2">
                                {stressedFields.map(f => (
                                    <div key={f.id} className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 p-4 rounded-3xl flex items-center justify-between group cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all"
                                        onClick={() => { onNavigate('dashboard'); onClose(); }}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-blue-500 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                                                <Droplets size={18} fill="currentColor" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-sm">{f.name}</p>
                                                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-tight">Humidade: {f.humidity}% (Crítico)</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[8px] font-black bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase">Ligar Rega</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 p-4 rounded-3xl flex items-center gap-3">
                                <CheckCircle size={20} className="text-emerald-500" />
                                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Níveis de humidade adequados em todas as parcelas.</span>
                            </div>
                        )}
                    </section>

                    {/* 3. Equipa e Segurança */}
                    <section className="space-y-3">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                            <ShieldAlert size={12} /> Segurança da Equipa
                        </h4>

                        {emergencyUsers.length > 0 ? (
                            <div className="bg-red-500 p-4 rounded-3xl text-white flex items-center justify-between animate-pulse cursor-pointer"
                                onClick={() => { onNavigate('team'); onClose(); }}>
                                <div className="flex items-center gap-3">
                                    <Activity size={24} />
                                    <div>
                                        <p className="font-black text-sm uppercase">EMRGÊNCIA SOS</p>
                                        <p className="text-[10px] font-bold opacity-80">{emergencyUsers[0].name} • Detetada Queda</p>
                                    </div>
                                </div>
                                <ChevronRight size={20} />
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 p-4 rounded-3xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                        <Activity size={16} className="text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 dark:text-white">Status da Equipa</p>
                                        <p className="text-[10px] text-gray-500">Todos os {users.length} operadores seguros</p>
                                    </div>
                                </div>
                                <CheckCircle size={14} className="text-emerald-500" />
                            </div>
                        )}
                    </section>

                </div>

                {/* Footer Advice */}
                <div className="p-6 bg-gray-50 dark:bg-neutral-900/50 border-t border-gray-100 dark:border-neutral-800 text-center">
                    <p className="text-[10px] text-gray-400 font-medium italic mb-4">
                        "O Farm Copilot analisou 14 sensores e 3 fontes de dados para gerar este briefing."
                    </p>
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-gray-900/10"
                    >
                        Entendido, Continuar
                    </button>
                </div>

            </div>
        </div>
    );
};

export default MorningBriefingModal;
