import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Network, Bug, Tractor, MapPin, ShieldCheck, ChevronRight, AlertTriangle, MessageSquare, Plus, Search, Star } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface CollaborativeNetworkModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CollaborativeNetworkModal: React.FC<CollaborativeNetworkModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'report' | 'marketplace'>('report');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[250] flex flex-col justify-end sm:justify-center bg-black/60 backdrop-blur-sm sm:p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-neutral-900 w-full sm:max-w-xl rounded-t-[2rem] sm:rounded-[2.5rem] p-6 shadow-2xl border border-white/10 flex flex-col max-h-[90vh]"
            >
                <div className="flex justify-between items-start mb-6 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl">
                            <Network size={24} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-none">Rede Colaborativa</h3>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 block">Cooperativas Regionais</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full flex-shrink-0 active:scale-95 transition-transform">
                        <X size={20} className="text-gray-900 dark:text-white" />
                    </button>
                </div>

                {/* Tab Selector */}
                <div className="flex bg-gray-100 dark:bg-neutral-800 p-1 rounded-2xl mb-6 shrink-0">
                    <button
                        onClick={() => setActiveTab('report')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeTab === 'report' ? 'bg-white dark:bg-neutral-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <Bug size={16} /> Radar de Pragas
                    </button>
                    <button
                        onClick={() => setActiveTab('marketplace')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeTab === 'marketplace' ? 'bg-white dark:bg-neutral-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <Tractor size={16} /> Marketplace de Máquinas
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 pb-4">
                    <AnimatePresence mode="wait">
                        {activeTab === 'report' ? (
                            <motion.div
                                key="report"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-4"
                            >
                                <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-4 flex items-start gap-3">
                                    <ShieldCheck size={20} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Dados Anonimizados</h4>
                                        <p className="text-xs text-indigo-700/80 dark:text-indigo-200/70 mt-1 leading-relaxed">
                                            A partilha de avistamentos de pragas protege os seus vizinhos e a si. A sua localização exata e identidade são ocultadas no radar cooperativo.
                                        </p>
                                    </div>
                                </div>

                                {/* Radar Feed */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Alertas num raio de 50km</span>
                                        <span className="text-[10px] font-bold text-red-500 bg-red-100 dark:bg-red-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                            <AlertTriangle size={10} /> 3 Ativos
                                        </span>
                                    </div>

                                    <div className="bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-red-200 dark:hover:border-red-500/30 transition-colors">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <Bug size={16} className="text-red-500" />
                                                <span className="text-sm font-bold text-gray-900 dark:text-white leading-none">Mosca da Azeitona</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-neutral-900 px-2 py-1 rounded-md">Hoje, 09:12</span>
                                        </div>
                                        <div className="pl-6">
                                            <p className="text-xs text-gray-600 dark:text-gray-300">Infestação inicial detetada em olival maduro.</p>
                                            <div className="flex items-center gap-1.5 mt-3 text-[10px] font-bold text-gray-500">
                                                <MapPin size={12} className="text-indigo-400" />
                                                Aprox. 8km de distância (Setor Norte)
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-orange-200 dark:hover:border-orange-500/30 transition-colors">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-400" />
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <Bug size={16} className="text-orange-500" />
                                                <span className="text-sm font-bold text-gray-900 dark:text-white leading-none">Míldio (Vinha)</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-neutral-900 px-2 py-1 rounded-md">Ontem, 16:45</span>
                                        </div>
                                        <div className="pl-6">
                                            <p className="text-xs text-gray-600 dark:text-gray-300">Manchas de óleo foliar observadas num bardo. Tratamento sistémico aplicado.</p>
                                            <div className="flex items-center gap-1.5 mt-3 text-[10px] font-bold text-gray-500">
                                                <MapPin size={12} className="text-indigo-400" />
                                                Aprox. 12km de distância (Setor Este)
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button variant="agro" className="w-full rounded-xl py-4 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 border-none">
                                    <Plus size={18} />
                                    Reportar Observação Anónima
                                </Button>

                            </motion.div>
                        ) : (
                            <motion.div
                                key="marketplace"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3">
                                    <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">Mercado Seguro</h4>
                                        <p className="text-xs text-emerald-700/80 dark:text-emerald-200/70 mt-1 leading-relaxed">
                                            Alugue maquinaria ociosa a vizinhos da rede com seguro de danos AgroSmart incluso. Maximize o seu retorno.
                                        </p>
                                    </div>
                                </div>

                                <div className="relative">
                                    <Input
                                        placeholder="Procurar tratores, alfaias, drones..."
                                        className="pl-10"
                                    />
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                </div>

                                {/* Marketplace Items */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Disponível perto de si</span>
                                    </div>

                                    <div className="bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-2xl p-3 shadow-sm flex gap-4 hover:border-emerald-200 transition-colors">
                                        <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-neutral-900 shrink-0 overflow-hidden relative">
                                            <img src="https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=200&auto=format&fit=crop" alt="Trator" className="w-full h-full object-cover" />
                                            <div className="absolute top-1 left-1 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Disponível</div>
                                        </div>
                                        <div className="flex-1 flex flex-col pt-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">Trator John Deere 6155M</h4>
                                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 whitespace-nowrap">85€ <span className="text-[10px] font-normal text-gray-400">/h</span></span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-gray-500">
                                                <MapPin size={10} className="text-gray-400" /> 15km <span className="mx-0.5 text-gray-300">•</span> <Star size={10} className="text-amber-400 fill-amber-400" /> 4.9
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-2 line-clamp-1">Trator de 155cv disponivel com operador e sem operador. GPU autoTract.</p>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-2xl p-3 shadow-sm flex gap-4 hover:border-emerald-200 transition-colors">
                                        <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-neutral-900 shrink-0 overflow-hidden relative">
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <Tractor size={30} />
                                            </div>
                                            <div className="absolute top-1 left-1 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">Disponível</div>
                                        </div>
                                        <div className="flex-1 flex flex-col pt-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">Atomizador Jacto Arbus</h4>
                                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 whitespace-nowrap">45€ <span className="text-[10px] font-normal text-gray-400">/dia</span></span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-gray-500">
                                                <MapPin size={10} className="text-gray-400" /> 6km <span className="mx-0.5 text-gray-300">•</span> <Star size={10} className="text-amber-400 fill-amber-400" /> 4.7
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-2 line-clamp-1">Ideal para vinha em espaldeira. Capacidade 1000L.</p>
                                        </div>
                                    </div>
                                </div>

                                <Button variant="outline" className="w-full rounded-xl py-4 flex items-center justify-center gap-2 mt-4 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900 dark:hover:bg-emerald-900/20">
                                    <Tractor size={18} />
                                    Anunciar a Minha Maquinaria Ociosa
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default CollaborativeNetworkModal;
