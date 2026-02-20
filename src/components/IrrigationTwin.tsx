import React, { useMemo } from 'react';
import {
    Droplets, Thermometer, CloudRain, Zap,
    AlertCircle, TrendingDown, Clock, Info, CheckCircle2
} from 'lucide-react';
import { Field, DetailedForecast } from '../types';
import { calculateIrrigationNeed } from '../utils/irrigationModel';
import { motion } from 'framer-motion';

interface IrrigationTwinProps {
    field: Field;
    forecast: DetailedForecast[];
    onApplyIrrigation: (minutes: number) => void;
}

const IrrigationTwin: React.FC<IrrigationTwinProps> = ({ field, forecast, onApplyIrrigation }) => {
    const recommendation = useMemo(() => calculateIrrigationNeed(field, forecast), [field, forecast]);

    const getStressColor = (stress: number) => {
        if (stress < 30) return 'bg-emerald-500';
        if (stress < 70) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const getStressLabel = (stress: number) => {
        if (stress < 30) return 'Hydration Optimal';
        if (stress < 70) return 'Moderate Stress';
        return 'Critical Stress';
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {/* 1. MAIN RECOMMENDATION CARD */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-[2rem] md:rounded-[2.5rem] p-4 md:p-6 text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>

                <div className="flex justify-between items-start relative z-10">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                        <Zap size={24} className="text-yellow-300" />
                    </div>
                    <div className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5 border border-white/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Otimização Hídrica</span>
                    </div>
                </div>

                <div className="mt-4 md:mt-6 relative z-10">
                    <h3 className="text-[10px] md:text-sm font-bold opacity-80 uppercase tracking-widest">Rega Recomendada</h3>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl md:text-5xl font-black">{recommendation.minutes}</span>
                        <span className="text-sm md:text-xl font-bold opacity-70">Minutos</span>
                    </div>
                    <p className="text-[10px] md:text-xs mt-3 md:mt-4 opacity-90 leading-relaxed max-w-[90%] md:max-w-[80%] font-medium">
                        Otimização baseada em ET0 ({recommendation.et0}mm) e Kc de {recommendation.kc} para {field.crop}.
                        {recommendation.next24hRain > 0 ? ` Desconto de ${recommendation.next24hRain}mm por chuva prevista.` : ' Sem chuva prevista.'}
                    </p>
                </div>

                <button
                    onClick={() => onApplyIrrigation(recommendation.minutes)}
                    disabled={recommendation.minutes <= 0}
                    className={`w-full mt-4 md:mt-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${recommendation.minutes > 0
                        ? 'bg-white text-blue-600 hover:bg-blue-50'
                        : 'bg-white/10 text-white/50 cursor-not-allowed border border-white/10'
                        }`}
                >
                    {recommendation.minutes > 0 ? (
                        <>Executar Plano de Rega <Clock size={18} /></>
                    ) : (
                        <>Hidratação Ideal <CheckCircle2 size={18} /></>
                    )}
                </button>
            </div>

            {/* 2. WATER STRESS SIMULATOR */}
            <div className="bg-white dark:bg-neutral-900 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 p-4 md:p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4 md:mb-6">
                    <div>
                        <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-xs md:text-base">Simulação de Stress</h4>
                        <p className="text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Baseado em Evapotranspiração (ET0)</p>
                    </div>
                    <Info size={16} className="text-gray-300 md:w-[18px]" />
                </div>

                <div className="relative h-16 md:h-24 flex items-center justify-center">
                    {/* Visual Stress Bar */}
                    <div className="w-full h-8 md:h-12 bg-gray-100 dark:bg-black rounded-full overflow-hidden relative border border-gray-200 dark:border-neutral-800">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${recommendation.waterStress}%` }}
                            className={`h-full ${getStressColor(recommendation.waterStress)} transition-colors duration-500 relative`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                        </motion.div>

                        {/* Markers */}
                        <div className="absolute inset-0 flex justify-between px-6 pointer-events-none items-center">
                            <span className="text-[10px] font-black text-gray-400">0%</span>
                            <span className="text-[10px] font-black text-white/50">STRESS</span>
                            <span className="text-[10px] font-black text-gray-400">100%</span>
                        </div>
                    </div>

                    {/* Float indicator */}
                    <motion.div
                        animate={{ x: `${recommendation.waterStress - 50}%` }}
                        className="absolute -top-1 left-1/2 flex flex-col items-center"
                    >
                        <div className="bg-white dark:bg-neutral-800 px-2 py-0.5 rounded-md shadow-md border border-gray-100 dark:border-neutral-700 text-[9px] font-black">
                            {recommendation.waterStress}%
                        </div>
                        <div className="w-px h-16 bg-gray-300 dark:bg-neutral-700 mt-1"></div>
                    </motion.div>
                </div>

                <div className="mt-6 md:mt-8 grid grid-cols-2 gap-3 md:gap-4">
                    <div className="bg-gray-50 dark:bg-black/40 p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 dark:border-neutral-800">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingDown size={14} className="text-blue-500 md:w-4" />
                            <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">ET0 Diário</span>
                        </div>
                        <p className="text-sm md:text-xl font-black text-gray-900 dark:text-white">{recommendation.et0} <span className="text-[8px] md:text-xs opacity-50">mm</span></p>
                    </div>

                    <div className="bg-gray-50 dark:bg-black/40 p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 dark:border-neutral-800">
                        <div className="flex items-center gap-2 mb-1">
                            <AlertCircle size={14} className="text-orange-500 md:w-4" />
                            <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</span>
                        </div>
                        <p className="text-[10px] md:text-base font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none mt-1">
                            {getStressLabel(recommendation.waterStress)}
                        </p>
                    </div>
                </div>
            </div>

            {/* 3. INPUT FACTORS */}
            <div className="grid grid-cols-3 gap-2 md:gap-3">
                {[
                    { icon: <Droplets size={14} />, label: 'Solo', value: `${field.humidity}%`, color: 'text-blue-500' },
                    { icon: <Thermometer size={14} />, label: 'Ar', value: `${forecast[0]?.temp || field.temp}°C`, color: 'text-orange-500' },
                    { icon: <CloudRain size={14} />, label: 'Chuva', value: `${recommendation.next24hRain}mm`, color: 'text-indigo-500' }
                ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center p-2 md:p-3 bg-white dark:bg-neutral-900 rounded-xl md:rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                        <div className={`${item.color} mb-1 md:w-4`}>{item.icon}</div>
                        <span className="text-[7px] md:text-[8px] font-black text-gray-400 uppercase tracking-widest">{item.label}</span>
                        <span className="text-xs md:text-sm font-black text-gray-900 dark:text-white mt-0.5">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default IrrigationTwin;
