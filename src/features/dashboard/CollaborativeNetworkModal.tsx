import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Network, Bug, Tractor, MapPin, ShieldCheck, AlertTriangle, Search, Star, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../services/supabaseClient';
import { machineryService } from '../../services/machineryService';

interface CollaborativeNetworkModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CollaborativeNetworkModal: React.FC<CollaborativeNetworkModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'report' | 'marketplace'>('report');

    // States for Pest Reporting
    const [isReporting, setIsReporting] = useState(false);
    const [isSubmittingPest, setIsSubmittingPest] = useState(false);
    const [formData, setFormData] = useState({ pest_name: '', culture_type: '', severity: 'medium', location_description: '' });

    // States for Machinery Advertising
    const [isAdvertising, setIsAdvertising] = useState(false);
    const [isSubmittingAd, setIsSubmittingAd] = useState(false);
    const [adFormData, setAdFormData] = useState({
        machinery_name: '',
        machinery_type: 'tractor',
        price_per_time: '',
        time_unit: 'hour',
        description: ''
    });

    const handleReportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingPest(true);

        // We use toast.promise to automatically handle loading, success and error toasts globally
        toast.promise(
            supabase.from('pest_reports').insert({
                pest_name: formData.pest_name,
                culture_type: formData.culture_type,
                severity: formData.severity,
                location_description: formData.location_description,
                distance_km: Math.floor(Math.random() * 15 * 10) / 10 + 0.5 // Random anonymous distance
            }).then(({ error }: { error: any }) => { if (error) throw error; }),
            {
                loading: 'A enviar alerta...',
                success: 'Observação submetida com sucesso! A rede agradece a sua colaboração.',
                error: 'Erro ao submeter. Verifique a sua ligação.'
            },
            {
                style: {
                    borderRadius: '16px',
                    background: '#333',
                    color: '#fff',
                },
                success: {
                    iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff',
                    },
                },
            }
        ).then(() => {
            // Only update local UI and close modal if the promise actually resolves
            setIsReporting(false);
            setFormData({ pest_name: '', culture_type: '', severity: 'medium', location_description: '' });
            onClose(); // Optional: Close modal completely after a successful report as user requested
        }).catch(err => {
            console.error('Error submitting pest report:', err);
            // Leave it open on error so they can retry
        }).finally(() => {
            setIsSubmittingPest(false);
        });
    };

    const handleAdSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingAd(true);

        toast.promise(
            machineryService.createMachineryAd({
                machinery_name: adFormData.machinery_name,
                machinery_type: adFormData.machinery_type,
                price_per_time: parseFloat(adFormData.price_per_time),
                time_unit: adFormData.time_unit,
                description: adFormData.description
            }),
            {
                loading: 'A publicar anúncio...',
                success: 'Anúncio criado com sucesso! A máquina já está vísivel no marketplace local.',
                error: 'Erro ao submeter anúncio. Verifique a sua ligação.'
            },
            {
                style: {
                    borderRadius: '16px',
                    background: '#333',
                    color: '#fff',
                },
                success: {
                    iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff',
                    },
                },
            }
        ).then(() => {
            setIsAdvertising(false);
            setAdFormData({ machinery_name: '', machinery_type: 'tractor', price_per_time: '', time_unit: 'hour', description: '' });
            onClose(); // Optional: Close modal completely
        }).catch(err => {
            console.error('Error submitting machinery ad:', err);
        }).finally(() => {
            setIsSubmittingAd(false);
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[250] flex flex-col justify-end sm:justify-center bg-black/60 backdrop-blur-sm pt-10 sm:p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-neutral-900 w-full sm:max-w-xl rounded-t-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-6 shadow-2xl border border-white/10 flex flex-col max-h-[92dvh] sm:max-h-[90vh]"
            >
                <div className="flex justify-between items-start mb-4 sm:mb-6 shrink-0">
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
                        <Tractor size={16} /> Marketplace
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 pb-14 sm:pb-4">
                    <AnimatePresence mode="wait">
                        {activeTab === 'report' ? (
                            <motion.div
                                key="report"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-4"
                            >
                                <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-3 sm:p-4 flex items-start gap-3">
                                    <ShieldCheck size={20} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Dados Anonimizados</h4>
                                        <p className="text-[11px] text-indigo-700/80 dark:text-indigo-200/70 mt-0.5 leading-snug">
                                            Partilhe avistamentos para proteger a rede. A sua localização exata e identidade são ocultadas.
                                        </p>
                                    </div>
                                </div>

                                {/* Radar Feed or Reporting Form */}
                                {isReporting ? (
                                    <div className="bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in-up">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                <Bug size={16} className="text-indigo-500" />
                                                Novo Reporte Anonimizado
                                            </h4>
                                        </div>

                                        <form onSubmit={handleReportSubmit} className="space-y-3">
                                            <Input required placeholder="Nome da Praga (ex: Mosca da Azeitona)" value={formData.pest_name} onChange={(e) => setFormData({ ...formData, pest_name: e.target.value })} />
                                            <Input required placeholder="Cultura (ex: Olival)" value={formData.culture_type} onChange={(e) => setFormData({ ...formData, culture_type: e.target.value })} />

                                            <div>
                                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block ml-1">Severidade do Ataque</label>
                                                <select className="w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 dark:text-gray-300 font-medium" value={formData.severity} onChange={(e) => setFormData({ ...formData, severity: e.target.value })}>
                                                    <option value="low">Baixa</option>
                                                    <option value="medium">Média</option>
                                                    <option value="high">Alta</option>
                                                    <option value="critical">Crítica</option>
                                                </select>
                                            </div>

                                            <textarea required placeholder="Descreva a localização visual ou detalhes adicionais..." className="w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px] text-gray-700 dark:text-gray-300 font-medium custom-scrollbar" value={formData.location_description} onChange={(e) => setFormData({ ...formData, location_description: e.target.value })} />

                                            <div className="flex gap-3 pt-2">
                                                <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setIsReporting(false)}>Cancelar</Button>
                                                <Button type="submit" variant="agro" className="flex-1 bg-indigo-600 hover:bg-indigo-700 border-none rounded-xl" disabled={isSubmittingPest}>
                                                    {isSubmittingPest ? 'A enviar...' : 'Submeter Alerta'}
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    <>
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

                                        <Button variant="agro" onClick={() => setIsReporting(true)} className="w-full rounded-xl py-4 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 border-none transition-all hover:scale-[1.02] active:scale-95">
                                            <Plus size={18} />
                                            Reportar Observação Anónima
                                        </Button>
                                    </>
                                )}

                            </motion.div>
                        ) : (
                            <motion.div
                                key="marketplace"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-3 sm:p-4 flex items-start gap-3">
                                    <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">Mercado Seguro</h4>
                                        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-200/70 mt-0.5 leading-snug">
                                            Alugue maquinaria com seguro AgroSmart incluso para maximizar cobertura na rede.
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

                                {isAdvertising ? (
                                    <div className="bg-white dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in-up">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                <Tractor size={16} className="text-emerald-500" />
                                                Novo Anúncio de Maquinaria
                                            </h4>
                                        </div>

                                        <form onSubmit={handleAdSubmit} className="space-y-3">
                                            <Input required placeholder="Título (ex: Trator Fendt 314 Vario)" value={adFormData.machinery_name} onChange={(e) => setAdFormData({ ...adFormData, machinery_name: e.target.value })} />

                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block ml-1">Tipo de Máquina</label>
                                                    <select className="w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-gray-700 dark:text-gray-300 font-medium" value={adFormData.machinery_type} onChange={(e) => setAdFormData({ ...adFormData, machinery_type: e.target.value })}>
                                                        <option value="tractor">Trator</option>
                                                        <option value="harvester">Colheitadeira</option>
                                                        <option value="implement">Implemento / Alfaia</option>
                                                        <option value="drone">Drone Agrícola</option>
                                                        <option value="other">Outro</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <div className="w-1/2">
                                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block ml-1">Preço (€)</label>
                                                    <Input required type="number" step="0.01" min="0" placeholder="Ex: 85.00" value={adFormData.price_per_time} onChange={(e) => setAdFormData({ ...adFormData, price_per_time: e.target.value })} />
                                                </div>
                                                <div className="w-1/2">
                                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 block ml-1">Unidade de Cobrança</label>
                                                    <select className="w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-gray-700 dark:text-gray-300 font-medium" value={adFormData.time_unit} onChange={(e) => setAdFormData({ ...adFormData, time_unit: e.target.value })}>
                                                        <option value="hour">por Hora (/h)</option>
                                                        <option value="day">por Dia (/dia)</option>
                                                        <option value="hectare">por Hectare (/ha)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <textarea required placeholder="Detalhes (com condutor? inclui gasóleo? modelo específico?)..." className="w-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none min-h-[80px] text-gray-700 dark:text-gray-300 font-medium custom-scrollbar" value={adFormData.description} onChange={(e) => setAdFormData({ ...adFormData, description: e.target.value })} />

                                            <div className="flex gap-3 pt-2">
                                                <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setIsAdvertising(false)}>Cancelar</Button>
                                                <Button type="submit" variant="agro" className="flex-1 bg-emerald-600 hover:bg-emerald-700 border-none rounded-xl" disabled={isSubmittingAd}>
                                                    {isSubmittingAd ? 'A publicar...' : 'Publicar Anúncio'}
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    <>
                                        {/* Marketplace Items */}
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center px-1">
                                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Disponível perto de a si</span>
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

                                        <Button variant="outline" onClick={() => setIsAdvertising(true)} className="w-full rounded-xl py-4 flex items-center justify-center gap-2 mt-4 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900 dark:hover:bg-emerald-900/20 transition-all hover:scale-[1.02] active:scale-95">
                                            <Tractor size={18} />
                                            Publicar Anúncio
                                        </Button>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default CollaborativeNetworkModal;
