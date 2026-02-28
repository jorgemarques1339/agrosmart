import React from 'react';
import clsx from 'clsx';
import {
    SprayCan, Wind, Droplets, Thermometer, Clock, Target, ArrowRight, Activity, TrendingUp, Sun, Zap
} from 'lucide-react';
import { Dialog, DialogClose, DialogContent } from '../../../components/ui/Dialog';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/Tabs';

export interface DashboardModalsProps {
    isWeatherModalOpen: boolean;
    setIsWeatherModalOpen: (open: boolean) => void;
    weatherTab: 'forecast' | 'spraying';
    setWeatherTab: (tab: 'forecast' | 'spraying') => void;
    weather: any[];
    sprayingConditions: any[];
    getWeatherIcon: (condition: string, size: number) => React.ReactNode;
    isMarketModalOpen: boolean;
    setIsMarketModalOpen: (open: boolean) => void;
    MarketPricesComponent: React.ComponentType;
    isWaterModalOpen: boolean;
    setIsWaterModalOpen: (open: boolean) => void;
    waterConsumptionByCrop: any[];
    waterConsumption: number | string;
    isBriefingModalOpen: boolean;
    setIsBriefingModalOpen: (open: boolean) => void;
    MorningBriefingComponent: React.ComponentType;
    isEnergyModalOpen: boolean;
    setIsEnergyModalOpen: (open: boolean) => void;
    energyInsights: any[];
    solarForecast: any[];
    solarEnergy: number | string;
    isCalendarOpen: boolean;
    setIsCalendarOpen: (open: boolean) => void;
    CalendarComponent: React.ComponentType;
    isCheckInOpen: boolean;
    setIsCheckInOpen: (open: boolean) => void;
    CheckInComponent: React.ComponentType;
    isCollaborativeModalOpen: boolean;
    setIsCollaborativeModalOpen: (open: boolean) => void;
    CollaborativeComponent: React.ComponentType;
}

export const DashboardModals: React.FC<DashboardModalsProps> = ({
    isWeatherModalOpen, setIsWeatherModalOpen,
    weatherTab, setWeatherTab,
    weather, sprayingConditions, getWeatherIcon,
    isMarketModalOpen, setIsMarketModalOpen, MarketPricesComponent: MarketPrices,
    isWaterModalOpen, setIsWaterModalOpen, waterConsumptionByCrop, waterConsumption,
    isBriefingModalOpen, setIsBriefingModalOpen, MorningBriefingComponent: MorningBriefing,
    isEnergyModalOpen, setIsEnergyModalOpen, energyInsights, solarForecast, solarEnergy,
    isCalendarOpen, setIsCalendarOpen, CalendarComponent: Calendar,
    isCheckInOpen, setIsCheckInOpen, CheckInComponent: CheckIn,
    isCollaborativeModalOpen, setIsCollaborativeModalOpen, CollaborativeComponent: CollaborativeNetwork
}) => {
    return (
        <>
            {/* --- WEATHER MODAL --- */}
            <Dialog isOpen={isWeatherModalOpen} onClose={() => setIsWeatherModalOpen(false)}>
                <DialogContent className="max-w-sm p-0 h-[80vh] flex flex-col">
                    {/* Header */}
                    <div className="flex justify-between items-center px-6 pt-6 pb-4">
                        <div>
                            <h3 className="text-xl font-black dark:text-white">Meteorologia</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase">Suporte à Decisão</p>
                        </div>
                        <DialogClose onClose={() => setIsWeatherModalOpen(false)} />
                    </div>

                    {/* Tab Selector */}
                    <div className="px-6 mb-4">
                        <Tabs>
                            <TabsList>
                                <TabsTrigger
                                    active={weatherTab === 'forecast'}
                                    onClick={() => setWeatherTab('forecast')}
                                >
                                    Previsão
                                </TabsTrigger>
                                <TabsTrigger
                                    active={weatherTab === 'spraying'}
                                    onClick={() => setWeatherTab('spraying')}
                                    className={weatherTab === 'spraying' ? 'text-blue-500' : ''}
                                >
                                    <SprayCan size={14} className="mr-1" /> Pulverização
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">

                        {/* TAB: FORECAST */}
                        {weatherTab === 'forecast' && (
                            <div className="space-y-3">
                                {weather.map((day, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-neutral-800/50 rounded-2xl border border-gray-100 dark:border-neutral-800">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900 dark:text-white text-sm">{day.day}</span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">{day.description || 'Parcial'}</span>
                                            </div>
                                            {getWeatherIcon(day.condition, 24)}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="flex items-center gap-1 justify-end text-[10px] text-gray-400 font-bold">
                                                    <Wind size={10} /> {day.windSpeed} km/h
                                                </div>
                                                <div className="flex items-center gap-1 justify-end text-[10px] text-gray-400 font-bold">
                                                    <Droplets size={10} /> {day.humidity}%
                                                </div>
                                            </div>
                                            <span className="font-black text-xl dark:text-white w-8 text-right">{day.temp}°</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* TAB: SPRAYING */}
                        {weatherTab === 'spraying' && (
                            <div className="space-y-4">
                                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                                    <p className="text-xs text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                                        <span className="font-bold">Nota:</span> Janela ideal: Vento &lt; 10km/h, Temp &lt; 25°C, Sem chuva.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {sprayingConditions.length === 0 ? (
                                        <div className="text-center py-8 opacity-50">
                                            <p className="text-sm font-bold text-gray-400">Sem dados horários disponíveis.</p>
                                        </div>
                                    ) : (
                                        sprayingConditions.map((slot, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-4 bg-white dark:bg-neutral-800/50 rounded-2xl relative overflow-hidden border border-gray-100 dark:border-neutral-800">
                                                {/* Status Indicator Strip */}
                                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${slot.status === 'good' ? 'bg-green-500' :
                                                    slot.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`}></div>

                                                <div className="flex flex-col items-center min-w-[50px]">
                                                    <span className="text-lg font-black text-gray-900 dark:text-white">{slot.time}</span>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${slot.status === 'good' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                                            slot.status === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                            }`}>
                                                            {slot.status === 'good' ? 'Recomendado' : slot.status === 'warning' ? 'Atenção' : 'Não Recomendado'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium">{slot.reason}</p>
                                                </div>

                                                <div className="text-right">
                                                    <div className="flex items-center gap-1 justify-end text-[10px] font-bold text-gray-400">
                                                        <Wind size={10} /> {slot.windSpeed}km/h
                                                    </div>
                                                    <div className="flex items-center gap-1 justify-end text-[10px] font-bold text-gray-400">
                                                        <Thermometer size={10} /> {slot.temp}°
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </DialogContent>
            </Dialog>

            {/* --- MARKET PRICES MODAL --- */}
            <Dialog isOpen={isMarketModalOpen} onClose={() => setIsMarketModalOpen(false)}>
                <DialogContent className="max-w-sm p-0 h-[85vh] flex flex-col overflow-hidden">
                    <MarketPrices />
                </DialogContent>
            </Dialog>

            {/* --- WATER CONSUMPTION MODAL --- */}
            <Dialog isOpen={isWaterModalOpen} onClose={() => setIsWaterModalOpen(false)}>
                <DialogContent className="max-w-sm p-0 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="p-6 pb-2">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-xl font-black dark:text-white">Consumo Hídrico</h3>
                                    {waterConsumptionByCrop[0]?.isExample && (
                                        <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">Exemplo</span>
                                    )}
                                </div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Análise por Cultivo</p>
                            </div>
                            <DialogClose onClose={() => setIsWaterModalOpen(false)} />
                        </div>

                        <div className="bg-cyan-50 dark:bg-cyan-900/10 p-4 rounded-3xl border border-cyan-100 dark:border-cyan-900/30 mb-6">
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="text-3xl font-black text-cyan-600 dark:text-cyan-400 tracking-tighter leading-none">
                                        {waterConsumption}m³
                                    </span>
                                    <span className="text-[10px] font-bold text-cyan-500/60 uppercase tracking-widest block mt-1">Total Diário Estimado</span>
                                </div>
                                <Droplets size={32} className="text-cyan-500/20" />
                            </div>
                        </div>
                    </div>

                    {/* List Content */}
                    <div className="flex-1 overflow-y-auto px-6 pb-8 custom-scrollbar space-y-3">
                        {waterConsumptionByCrop.map((item, idx) => {
                            const maxConsumption = Math.max(...waterConsumptionByCrop.map(i => i.consumption));
                            const percentage = (item.consumption / maxConsumption) * 100;

                            return (
                                <div key={idx} className="bg-white dark:bg-neutral-800/40 p-4 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-tight">{item.crop}</h4>
                                            <span className="text-[10px] font-bold text-gray-400">{item.area} Hectares</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-black text-gray-900 dark:text-white leading-none">{item.consumption}m³</span>
                                            <span className="text-[9px] font-bold text-gray-400 tracking-tighter uppercase mt-1 block">p/ dia</span>
                                        </div>
                                    </div>

                                    {/* Small Progress Bar */}
                                    <div className="h-1.5 w-full bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-cyan-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer Advice */}
                    <div className="p-6 bg-gray-50 dark:bg-neutral-900/50 border-t border-gray-100 dark:border-neutral-800">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium text-center italic">
                            "Estes valores são estimativas baseadas nos coeficientes de evapotranspiração médios para a sua região."
                        </p>
                    </div>
                </DialogContent>
            </Dialog>

            {/* --- ENERGY MONITORING MODAL --- */}
            <Dialog isOpen={isEnergyModalOpen} onClose={() => setIsEnergyModalOpen(false)}>
                <DialogContent className="max-w-sm md:max-w-2xl p-0 h-[85vh] md:h-auto md:max-h-[90vh] flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="p-6 md:p-8 pb-2 md:pb-4">
                        <div className="flex justify-between items-start mb-4 md:mb-6">
                            <div>
                                <h3 className="text-xl md:text-2xl font-black dark:text-white">Autoconsumo Solar</h3>
                                <p className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest">Otimização Energética</p>
                            </div>
                            <DialogClose onClose={() => setIsEnergyModalOpen(false)} />
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-900/10 p-5 md:p-8 rounded-3xl border border-amber-100 dark:border-amber-900/30 mb-6 relative overflow-hidden group">
                            <div className="relative z-10 flex justify-between items-end">
                                <div>
                                    <span className="text-4xl md:text-6xl font-black text-amber-600 dark:text-amber-400 tracking-tighter leading-none block">
                                        {solarEnergy}kW
                                    </span>
                                    <span className="text-[10px] md:text-xs font-bold text-amber-500/80 uppercase tracking-widest block mt-1 md:mt-2 flex items-center gap-1">
                                        <Sun size={12} className="animate-spin-slow" /> Produção Atual
                                    </span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-xs md:text-sm font-black text-amber-600/60 uppercase">Eficiência</span>
                                    <span className="text-lg md:text-2xl font-black text-amber-600">94%</span>
                                </div>
                            </div>
                            <Zap size={100} className="absolute -right-4 -bottom-4 text-amber-500/10 -rotate-12 transition-transform group-hover:scale-110 duration-700 md:w-40 md:h-40" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-8 custom-scrollbar space-y-8 md:space-y-12">

                        {/* 1. Production Forecast Chart (Simple CSS) */}
                        <section>
                            <div className="flex items-center justify-between mb-4 md:mb-6">
                                <h4 className="text-[10px] md:text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                    <Clock size={14} /> Previsão 12h
                                </h4>
                            </div>
                            <div className="flex items-end justify-between h-24 md:h-40 gap-1 md:gap-2 px-1">
                                {solarForecast.map((item, idx) => {
                                    const maxProd = Math.max(...solarForecast.map(f => f.production));
                                    const height = (item.production / maxProd) * 100;
                                    const isCurrent = idx === 0;

                                    return (
                                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                                            <div className="w-full relative flex items-end justify-center h-full">
                                                <div
                                                    className={`w-full rounded-t-lg transition-all duration-1000 ${isCurrent ? 'bg-amber-500' : 'bg-amber-200 dark:bg-amber-900/30 group-hover:bg-amber-300'}`}
                                                    style={{ height: `${height}%` }}
                                                />
                                            </div>
                                            <span className={`text-[7px] md:text-[9px] font-bold ${isCurrent ? 'text-amber-600' : 'text-gray-400'}`}>
                                                {item.hour.split(':')[0]}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* 2. Proactive Insights (Smart Recommendations) */}
                        <section className="space-y-4 md:space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] md:text-xs font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                    <Target size={14} /> Sugestões de Otimização
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                {energyInsights.map((insight) => (
                                    <div
                                        key={insight.id}
                                        className={`p-4 md:p-6 rounded-3xl border animate-slide-up flex gap-4 items-start ${insight.priority === 'high'
                                            ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30 shadow-sm shadow-emerald-500/10'
                                            : 'bg-white dark:bg-neutral-800/40 border-gray-100 dark:border-neutral-800'
                                            }`}
                                    >
                                        <div className={`p-2 md:p-3 rounded-2xl ${insight.priority === 'high' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-neutral-800'
                                            }`}>
                                            {insight.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h5 className="font-black text-gray-900 dark:text-white text-xs md:text-sm uppercase tracking-tight mb-0.5">
                                                {insight.title}
                                            </h5>
                                            <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                                                {insight.description}
                                            </p>
                                        </div>
                                        <button className="p-1.5 md:p-2 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-400 hover:text-agro-green transition-colors">
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 3. Potential Savings Card */}
                        <div className="bg-indigo-600 rounded-3xl p-5 md:p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-3">
                                    <Activity size={18} className="text-indigo-200" />
                                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-indigo-100">Impacto Mensal</span>
                                </div>
                                <h4 className="text-2xl md:text-4xl font-black mb-1 md:mb-2">Poupança de 240€</h4>
                                <p className="text-[10px] md:text-sm font-medium text-indigo-100 leading-relaxed max-w-[80%]">
                                    Ao otimizar a rega para janelas solares, reduziu a dependência da rede em 35% este mês.
                                </p>
                            </div>
                            <TrendingUp size={120} className="absolute -right-6 -bottom-6 text-white/10 -rotate-6 group-hover:rotate-0 transition-transform duration-700 md:w-48 md:h-48" />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* --- CALENDAR MODAL --- */}
            <Calendar />

            {/* --- MORNING BRIEFING MODAL --- */}
            <MorningBriefing />

            {/* --- CHECK-IN MODAL --- */}
            <CheckIn />

            {/* --- COLLABORATIVE NETWORK MODAL --- */}
            <CollaborativeNetwork />
        </>
    );
};
