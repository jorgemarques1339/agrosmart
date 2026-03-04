import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { MapPin, Wind, Droplets, Thermometer } from 'lucide-react';

export interface WeatherHeroProps {
    currentWeather: any;
    activeTheme: string;
    rotateX: any;
    rotateY: any;
    glareX: any;
    glareY: any;
    onMouseMove: (e: any) => void;
    onMouseLeave: () => void;
    onOpenWeather: (tab: 'forecast' | 'spraying') => void;
    getWeatherIcon: (condition: string, size: number) => React.ReactNode;
}

export const WeatherHero: React.FC<WeatherHeroProps> = ({
    currentWeather,
    activeTheme,
    rotateX,
    rotateY,
    glareX,
    glareY,
    onMouseMove,
    onMouseLeave,
    onOpenWeather,
    getWeatherIcon
}) => {
    if (!currentWeather) return null;

    return (
        <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.15 }}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            onClick={() => onOpenWeather('forecast')}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            className="mx-3 rounded-[2rem] h-36 sm:h-48 group cursor-pointer relative overflow-hidden shadow-2xl active:scale-[0.985] transition-transform duration-300"
        >
            {/* Dynamic gradient background */}
            <div className={clsx(
                "absolute inset-0 transition-all duration-1000",
                activeTheme === 'sunny' && 'bg-gradient-to-br from-amber-400 via-orange-400 to-red-400',
                activeTheme === 'rain' && 'bg-gradient-to-br from-slate-600 via-blue-700 to-indigo-800',
                activeTheme === 'night' && 'bg-gradient-to-br from-indigo-950 via-violet-900 to-slate-900',
                activeTheme === 'default' && 'bg-gradient-to-br from-emerald-700 via-teal-600 to-cyan-700'
            )} />
            {/* Glare shimmer */}
            <motion.div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 pointer-events-none" style={{ x: glareX, y: glareY }} />
            {/* Noise texture for depth */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")' }} />

            <div className="relative h-full flex flex-col justify-between p-3 sm:p-7" style={{ transform: 'translateZ(20px)' }}>
                {/* Top row */}
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full w-fit">
                            <MapPin size={10} className="text-white/80" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/90">Laundos, PT</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-1.5 ml-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
                            <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/50">Tempo Real</span>
                        </div>
                    </div>
                    <div className="opacity-90 group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl" style={{ transform: 'translateZ(40px)' }}>
                        {getWeatherIcon(currentWeather.condition, 50)}
                    </div>
                </div>

                {/* Bottom row */}
                <div className="flex items-end justify-between">
                    <div>
                        <div className="flex items-start">
                            <span className="text-4xl sm:text-8xl font-black tracking-tighter leading-none text-white drop-shadow-md">{currentWeather.temp}</span>
                            <span className="text-xl sm:text-3xl font-light text-white/60 mt-1 sm:mt-2">°C</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60 mt-0.5 block">
                            {currentWeather.condition === 'sunny' ? '☀️ Céu Limpo' : currentWeather.condition === 'rain' ? '🌧 Chuva' : currentWeather.condition === 'storm' ? '⛈ Tempestade' : '⛅ Parcial'}
                        </span>
                    </div>
                    <div className="hidden sm:flex gap-3">
                        <div
                            className="flex flex-col items-center gap-1 cursor-pointer group/metric"
                            onClick={(e) => { e.stopPropagation(); onOpenWeather('spraying'); }}
                        >
                            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover/metric:-translate-y-1 transition-transform">
                                <Wind size={16} className="text-white" />
                            </div>
                            <span className="text-[9px] font-black text-white/60 uppercase tracking-tight">{currentWeather.windSpeed}km/h</span>
                        </div>
                        <div
                            className="flex flex-col items-center gap-1 cursor-pointer group/metric"
                            onClick={(e) => { e.stopPropagation(); onOpenWeather('spraying'); }}
                        >
                            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover/metric:-translate-y-1 transition-transform" style={{ transitionDelay: '50ms' }}>
                                <Droplets size={16} className="text-cyan-200" />
                            </div>
                            <span className="text-[9px] font-black text-white/60 uppercase tracking-tight">{currentWeather.humidity}%</span>
                        </div>
                        {currentWeather.temp !== undefined && (
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:-translate-y-1 transition-transform" style={{ transitionDelay: '100ms' }}>
                                    <Thermometer size={16} className="text-orange-200" />
                                </div>
                                <span className="text-[9px] font-black text-white/60 uppercase tracking-tight">Toque</span>
                            </div>
                        )}
                    </div>
                    {/* Mobile: compact wind+humidity inline */}
                    <div className="flex sm:hidden gap-2">
                        <div
                            className="flex items-center gap-1 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); onOpenWeather('spraying'); }}
                        >
                            <Wind size={10} className="text-white/80" />
                            <span className="text-[9px] font-black text-white/70">{currentWeather.windSpeed}km/h</span>
                        </div>
                        <div
                            className="flex items-center gap-1 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); onOpenWeather('spraying'); }}
                        >
                            <Droplets size={10} className="text-cyan-200" />
                            <span className="text-[9px] font-black text-white/70">{currentWeather.humidity}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
