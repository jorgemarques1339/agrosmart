import React, { useMemo } from 'react';
import {
    Droplets, Thermometer, CloudRain, Zap,
    AlertCircle, TrendingDown, Clock, Info, CheckCircle2,
    Leaf, TrendingUp, Wind
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

    const getNdviColor = (val: number) => {
        if (val > 0.7) return 'text-emerald-500';
        if (val > 0.4) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="space-y-3 md:space-y-6">
            {/* 1. MAIN RECOMMENDATION CARD */}
            <div className={`rounded-[1.5rem] md:rounded-[2.5rem] p-3 md:p-6 text-white shadow-xl relative overflow-hidden group transition-colors duration-500 ${recommendation.ndviImpact === 'increase'
                ? 'bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-700'
                : 'bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600'
                }`}>
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>

                <div className="flex justify-between items-start relative z-10">
                    <div className="p-2 md:p-3 bg-white/20 rounded-xl md:rounded-2xl backdrop-blur-md">
                        <Zap size={20} className="text-yellow-300 md:w-6 md:h-6" />
                    </div>
                    <div className="flex flex-col items-end gap-1.5 md:gap-2">
                        <div className="bg-white/20 px-2 py-0.5 md:px-3 md:py-1 rounded-full backdrop-blur-md flex items-center gap-1 border border-white/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Otimização</span>
                        </div>
                        {recommendation.ndviValue !== undefined && (
                            <div className="bg-emerald-500/30 px-2 py-0.5 md:px-3 md:py-1 rounded-full backdrop-blur-md flex items-center gap-1 border border-emerald-400/30">
                                <Leaf size={10} className="text-emerald-300 md:w-3 md:h-3" />
                                <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest">Sentinel-2</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-2 md:mt-6 relative z-10">
                    <h3 className="text-[9px] md:text-sm font-bold opacity-80 uppercase tracking-widest leading-none">Rega Recomendada</h3>
                    <div className="flex items-baseline gap-1 md:gap-2 mt-1">
                        <span className="text-2xl md:text-5xl font-black leading-none">{recommendation.minutes}</span>
                        <span className="text-[10px] md:text-xl font-bold opacity-70">Minutos</span>
                    </div>
                    <div className="mt-2 md:mt-4 space-y-1.5 md:space-y-2">
                        <p className="text-[9px] md:text-xs opacity-90 leading-relaxed max-w-[95%] md:max-w-[80%] font-medium">
                            ET0 {recommendation.et0}mm | Kc {recommendation.kc} p/ {field.crop}.
                            {recommendation.next24hRain > 0 ? ` Prevista chuva (${recommendation.next24hRain}mm).` : ' Sem chuva.'}
                        </p>
                        {recommendation.ndviImpact !== 'neutral' && (
                            <div className="flex items-center gap-1.5 md:gap-2 text-[8px] md:text-[10px] font-black uppercase bg-black/20 self-start px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl border border-white/10">
                                {recommendation.ndviImpact === 'increase' ? (
                                    <>
                                        <TrendingUp size={12} className="text-indigo-300 md:w-3.5 md:h-3.5" />
                                        <span className="leading-none">Biomassa elevada</span>
                                    </>
                                ) : (
                                    <>
                                        <TrendingDown size={12} className="text-yellow-300 md:w-3.5 md:h-3.5" />
                                        <span className="leading-none">Vigor reduzido</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => onApplyIrrigation(recommendation.minutes)}
                    disabled={recommendation.minutes <= 0}
                    className={`w-full mt-3 md:mt-6 py-2.5 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${recommendation.minutes > 0
                        ? 'bg-white text-blue-600 hover:bg-blue-50'
                        : 'bg-white/10 text-white/50 cursor-not-allowed border border-white/10'
                        }`}
                >
                    {recommendation.minutes > 0 ? (
                        <>Executar Rega <Clock size={16} /></>
                    ) : (
                        <>Hidratação Ideal <CheckCircle2 size={16} /></>
                    )}
                </button>
            </div>

            {/* 2. SATELLITE MONITORING & STRESS DASHBOARD */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4">
                {/* Stress Simulator */}
                <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 p-3 md:p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-2 md:mb-6">
                        <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-[10px] md:text-base leading-none">Stress</h4>
                        <Info size={12} className="text-gray-300 md:w-4 md:h-4" />
                    </div>

                    <div className="relative h-8 md:h-12 flex items-center justify-center my-3">
                        <div className="w-full h-4 md:h-6 bg-gray-100 dark:bg-black rounded-full overflow-hidden relative border border-gray-200 dark:border-neutral-800">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${recommendation.waterStress}%` }}
                                className={`h-full ${getStressColor(recommendation.waterStress)} transition-colors duration-500 relative`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                            </motion.div>
                        </div>
                        <div className="absolute -top-4 left-0 right-0 flex justify-between px-1">
                            <span className="text-[7px] md:text-[9px] font-black text-gray-400">0%</span>
                            <span className="text-[7px] md:text-[9px] font-black text-gray-900 dark:text-white">{recommendation.waterStress}%</span>
                        </div>
                    </div>

                    <p className="mt-2 text-[8px] md:text-[10px] font-black text-gray-900 dark:text-white uppercase text-center bg-gray-50 dark:bg-black/40 py-1.5 rounded-lg border border-gray-100 dark:border-neutral-800 truncate">
                        {getStressLabel(recommendation.waterStress).split(' ')[0]}
                    </p>
                </div>

                {/* Satellite Vigor (NDVI) */}
                <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] md:rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 p-3 md:p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-1 md:mb-4">
                        <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-[10px] md:text-base leading-none">Vigor</h4>
                        <div className="p-1 md:p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-lg">
                            <Wind size={12} className="md:w-4 md:h-4" />
                        </div>
                    </div>

                    <div className="flex items-end gap-2 md:gap-3">
                        <div className="flex-1">
                            <div className="flex items-baseline gap-0.5">
                                <span className={`text-xl md:text-4xl font-black leading-none ${recommendation.ndviValue !== undefined ? getNdviColor(recommendation.ndviValue) : 'text-gray-300'}`}>
                                    {recommendation.ndviValue?.toFixed(2) || '--'}
                                </span>
                                <span className="text-[7px] md:text-xs font-bold text-gray-400">NDVI</span>
                            </div>
                            <p className="text-[6px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">SENTINEL-2</p>
                        </div>
                        <div className="w-12 md:w-20 h-6 md:h-10 flex gap-0.5 md:gap-1 items-end shrink-0">
                            {[0.7, 0.72, 0.75, 0.73, 0.8, 0.85, (recommendation.ndviValue || 0)].map((v, i) => (
                                <div
                                    key={i}
                                    className="flex-1 bg-emerald-500/20 rounded-t-[1px]"
                                    style={{ height: `${v * 100}%`, opacity: i === 6 ? 1 : 0.3 }}
                                ></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. INPUT FACTORS */}
            <div className="grid grid-cols-3 gap-2 md:gap-3">
                {[
                    { icon: <Droplets size={12} />, label: 'Solo', value: `${field.humidity}%`, color: 'text-blue-500' },
                    { icon: <Thermometer size={12} />, label: 'Ar', value: `${forecast[0]?.temp || field.temp}°C`, color: 'text-orange-500' },
                    { icon: <CloudRain size={12} />, label: 'Chuva', value: `${recommendation.next24hRain}mm`, color: 'text-indigo-500' }
                ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center p-1.5 md:p-3 bg-white dark:bg-neutral-900 rounded-xl md:rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                        <div className={`${item.color} mb-0.5 md:w-4`}>{item.icon}</div>
                        <span className="text-[6px] md:text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">{item.label}</span>
                        <span className="text-[10px] md:text-sm font-black text-gray-900 dark:text-white mt-1 leading-none">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default IrrigationTwin;
