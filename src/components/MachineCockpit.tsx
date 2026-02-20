
import React from 'react';
import { motion } from 'framer-motion';
import { Fuel, Gauge, Activity, ArrowDown } from 'lucide-react';
import { ISOBUSData } from '../types';
import clsx from 'clsx';

interface MachineCockpitProps {
    data: ISOBUSData;
}

const CircularGauge = ({
    value,
    max,
    label,
    unit,
    color,
    size = 120,
    strokeWidth = 8,
    icon: Icon
}: {
    value: number,
    max: number,
    label: string,
    unit: string,
    color: string,
    size?: number,
    strokeWidth?: number,
    icon?: any
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (Math.min(value, max) / max) * circumference;

    return (
        <div className="flex flex-col items-center justify-center relative" style={{ width: size, height: size }}>
            <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_10px_rgba(255,255,255,0.05)]">
                {/* Background track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    className="stroke-white/5 fill-none"
                    strokeWidth={strokeWidth}
                />
                {/* Progress track */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    className={clsx("fill-none transition-all duration-500", color)}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset: offset }}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                {Icon && <Icon size={size * 0.15} className="mb-1 opacity-40 text-white" />}
                <p className="text-xl font-black font-mono leading-none text-white">
                    {Math.round(value)}<span className="text-[10px] opacity-50 ml-0.5">{unit}</span>
                </p>
                <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500 mt-1">{label}</p>
            </div>
        </div>
    );
};

const MachineCockpit: React.FC<MachineCockpitProps> = ({ data }) => {
    return (
        <div className="bg-[#111] dark:bg-black rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden">
            {/* HUD Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,118,0.02))] bg-[length:100%_2px,3px_100%]" />

            <div className="relative z-10 flex flex-col gap-8">
                {/* Main Gauges Row */}
                <div className="flex flex-wrap justify-around items-center gap-6">

                    {/* Secondary: AdBlue */}
                    <div className="animate-fade-in delay-100">
                        <CircularGauge
                            value={data.adBlueLevel || 0}
                            max={100}
                            label="AdBlue"
                            unit="%"
                            color="stroke-blue-400"
                            size={100}
                            icon={Fuel}
                        />
                    </div>

                    {/* Primary: RPM */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-purple-500/10 blur-[40px] rounded-full group-hover:bg-purple-500/20 transition-all duration-700" />
                        <CircularGauge
                            value={data.engineRpm}
                            max={3000}
                            label="RPM Motor"
                            unit=""
                            color="stroke-purple-500"
                            size={180}
                            strokeWidth={12}
                            icon={Gauge}
                        />
                        {/* Dynamic RPM Needle or digital peak could be added here */}
                    </div>

                    {/* Secondary: Implement Depth */}
                    <div className="animate-fade-in delay-200">
                        <CircularGauge
                            value={data.implementDepth || 0}
                            max={100}
                            label="Profundidade"
                            unit="cm"
                            color="stroke-emerald-400"
                            size={100}
                            icon={ArrowDown}
                        />
                    </div>
                </div>

                {/* Digital HUD Elements */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center">
                        <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Velocidade</p>
                        <p className="text-3xl font-black font-mono text-white leading-none">
                            {data.groundSpeed.toFixed(1)}<span className="text-xs ml-1 opacity-50 italic">km/h</span>
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center">
                        <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Carga Motor</p>
                        <p className="text-3xl font-black font-mono text-white leading-none">
                            {data.engineLoad.toFixed(0)}<span className="text-xs ml-1 opacity-50 italic">%</span>
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center">
                        <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Fuel Rate</p>
                        <p className="text-3xl font-black font-mono text-white leading-none">
                            {data.fuelRate.toFixed(1)}<span className="text-xs ml-1 opacity-50 italic">L/h</span>
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center">
                        <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1">Pressão Hidr.</p>
                        <p className="text-3xl font-black font-mono text-white leading-none">
                            {data.hydraulicPressure}<span className="text-xs ml-1 opacity-50 italic">Bar</span>
                        </p>
                    </div>
                </div>

                {/* Footer Status Bar */}
                <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2">
                        <Activity size={14} className="text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Ligação ISO-11783 Estável</span>
                    </div>
                    <p className="text-[10px] font-mono font-bold text-gray-500 uppercase">
                        PGN: 0xFEF1 (EBC1) • CAN-ID: 18F0E131
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MachineCockpit;
