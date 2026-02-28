import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, Zap, Leaf } from 'lucide-react';

export interface KpiGridProps {
    waterConsumption: number;
    solarEnergy: number;
    carbonMetrics: any;
    setIsWaterModalOpen: (open: boolean) => void;
    setIsEnergyModalOpen: (open: boolean) => void;
    onNavigate: (path: string) => void;
    itemVariants: any;
}

export const KpiGrid: React.FC<KpiGridProps> = ({
    waterConsumption,
    solarEnergy,
    carbonMetrics,
    setIsWaterModalOpen,
    setIsEnergyModalOpen,
    onNavigate,
    itemVariants
}) => {
    return (
        <motion.div variants={itemVariants} className="px-3 mt-6">
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-white/30 mb-2.5 ml-1">Estado da Quinta</h3>
            <div className="grid grid-cols-3 gap-2">

                {/* Water */}
                <div
                    onClick={() => setIsWaterModalOpen(true)}
                    className="bg-white dark:bg-white/5 border border-cyan-200 dark:border-cyan-500/20 hover:border-cyan-400 dark:hover:border-cyan-500/40 rounded-[1.5rem] p-2.5 sm:p-4 flex flex-col gap-2 sm:gap-3 cursor-pointer group active:scale-95 transition-all shadow-sm hover:shadow-cyan-500/10 relative overflow-hidden"
                >
                    <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-full bg-cyan-500/10" />
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-cyan-100 dark:bg-cyan-500/15 flex items-center justify-center group-hover:bg-cyan-200 dark:group-hover:bg-cyan-500/25 transition-colors">
                        <Droplets size={16} className="text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                        <span className="block text-base sm:text-xl font-black text-gray-900 dark:text-white leading-none tracking-tight">{waterConsumption}<span className="text-[10px] font-bold text-gray-400 dark:text-white/40 ml-0.5">m³</span></span>
                        <span className="text-[7px] sm:text-[8px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-widest mt-0.5 block">Água</span>
                    </div>
                </div>

                {/* Energy */}
                <div
                    onClick={() => setIsEnergyModalOpen(true)}
                    className="bg-white dark:bg-white/5 border border-amber-200 dark:border-amber-500/20 hover:border-amber-400 dark:hover:border-amber-500/40 rounded-[1.5rem] p-2.5 sm:p-4 flex flex-col gap-2 sm:gap-3 cursor-pointer group active:scale-95 transition-all shadow-sm hover:shadow-amber-500/10 relative overflow-hidden"
                >
                    <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-full bg-amber-500/10" />
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center group-hover:bg-amber-200 dark:group-hover:bg-amber-500/25 transition-colors">
                        <Zap size={16} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <span className="block text-base sm:text-xl font-black text-gray-900 dark:text-white leading-none tracking-tight">{solarEnergy}<span className="text-[10px] font-bold text-gray-400 dark:text-white/40 ml-0.5">kW</span></span>
                        <span className="text-[7px] sm:text-[8px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-widest mt-0.5 block">Solar</span>
                    </div>
                </div>

                {/* Carbon */}
                <div
                    onClick={() => onNavigate('carbon')}
                    className="bg-white dark:bg-white/5 border border-emerald-200 dark:border-emerald-500/20 hover:border-emerald-400 dark:hover:border-emerald-500/40 rounded-[1.5rem] p-2.5 sm:p-4 flex flex-col gap-2 sm:gap-3 cursor-pointer group active:scale-95 transition-all shadow-sm hover:shadow-emerald-500/10 relative overflow-hidden"
                >
                    <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-full bg-emerald-500/10" />
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-500/25 transition-colors">
                        <Leaf size={16} className="text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <span className="block text-base sm:text-xl font-black text-gray-900 dark:text-white leading-none tracking-tight">{Math.abs(carbonMetrics.netBalance)}<span className="text-[10px] font-bold text-gray-400 dark:text-white/40 ml-0.5">t</span></span>
                        <span className="text-[7px] sm:text-[8px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-widest mt-0.5 block">CO₂</span>
                    </div>
                </div>

            </div>
        </motion.div >
    );
};
