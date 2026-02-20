
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, Activity, Thermometer, Fuel, Gauge,
    AlertTriangle, Cpu, List, Terminal,
    ChevronRight, Radio
} from 'lucide-react';
import clsx from 'clsx';
import { Machine, ISOBUSData } from '../types';
import { haptics } from '../utils/haptics';
import MachineCockpit from './MachineCockpit';

interface ISOBUSBridgeProps {
    machine: Machine;
    onPair?: (data: ISOBUSData) => void;
}

const ISOBUSBridge: React.FC<ISOBUSBridgeProps> = ({ machine, onPair }) => {
    const [data, setData] = useState<ISOBUSData | null>(machine.isobusData || null);
    const [isPairing, setIsPairing] = useState(false);
    const [pairingProgress, setPairingProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>(machine.isobusData ? [
        "[SISTEMA] Ligação ISO-11783 Reestabelecida",
        "[CAN-BUS] Transmissão ativa PGN:F004",
        "[CAN-BUS] Transmissão ativa PGN:F003"
    ] : []);
    const [isConnected, setIsConnected] = useState(true);

    // [FIX] Sync internal state if machine prop updates (e.g. from parent sync)
    useEffect(() => {
        if (machine.isobusData) {
            setData(machine.isobusData);
        }
    }, [machine.isobusData]);

    // Mock live data updates
    useEffect(() => {
        if (!isConnected || !data) return;

        const interval = setInterval(() => {
            setData(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    engineRpm: prev.engineRpm + (Math.random() * 40 - 20),
                    groundSpeed: Math.max(0, prev.groundSpeed + (Math.random() * 0.4 - 0.2)),
                    fuelRate: prev.fuelRate + (Math.random() * 0.2 - 0.1),
                    engineLoad: Math.min(100, Math.max(0, prev.engineLoad + (Math.random() * 4 - 2))),
                    adBlueLevel: Math.max(0, prev.adBlueLevel - 0.001), // Very slow depletion
                    implementDepth: Math.max(0, Math.min(100, prev.implementDepth + (Math.random() * 2 - 1))),
                    lastUpdate: new Date().toISOString()
                };
            });

            // Add conceptual bus log
            const hex = Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
            const pgn = Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0');
            setLogs(prev => [`[CAN-BUS] PGN:${pgn} DATA:0x${hex}`, ...prev].slice(0, 10));
        }, 1000);

        return () => clearInterval(interval);
    }, [isConnected, !!data]);

    const handlePair = () => {
        setIsPairing(true);
        setPairingProgress(0);
        setLogs(["[SISTEMA] Iniciando busca de Bridge Oriva...", "[SISTEMA] Escaneando rede CAN-BUS..."]);

        const interval = setInterval(() => {
            setPairingProgress(prev => {
                const step = 2;
                const next = prev + step;

                // Simulated contextual logs during pairing
                if (next === 20) setLogs(l => ["[ISO-TP] Protocolo J1939 detectado", ...l]);
                if (next === 40) setLogs(l => ["[ISO-TP] Estabelecendo conexão com ECU...", ...l]);
                if (next === 60) setLogs(l => ["[BRIDGE] Handshake Oriva v2 efetuado", ...l]);
                if (next === 80) setLogs(l => ["[SISTEMA] Sincronizando parâmetros de telemetria...", ...l]);

                if (next >= 100) {
                    clearInterval(interval);
                    const initialData: ISOBUSData = {
                        engineRpm: 1850,
                        groundSpeed: 8.4,
                        fuelRate: 12.5,
                        ptoSpeed: 540,
                        hydraulicPressure: 185,
                        engineLoad: 68,
                        coolantTemp: 82,
                        adBlueLevel: 85,
                        implementDepth: 15,
                        dtc: [],
                        lastUpdate: new Date().toISOString()
                    };
                    setData(initialData);
                    setIsPairing(false);
                    setLogs(l => ["[SISTEMA] Conexão ISO-11783 Estabilizada!", ...l]);
                    if (onPair) onPair(initialData);
                    return 100;
                }
                return next;
            });
        }, 30);
    };

    const Parameter = ({ label, value, unit, icon: Icon, color }: any) => (
        <div className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center gap-3">
            <div className={clsx("p-2 rounded-lg bg-white/5", color)}>
                <Icon size={16} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
                <p className="text-lg font-black font-mono text-white">
                    {typeof value === 'number' ? value.toFixed(1) : value}<span className="text-[10px] ml-0.5 opacity-50">{unit}</span>
                </p>
            </div>
        </div>
    );

    if (!data && !isPairing) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-6">
                <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/20 relative">
                    <Cpu className="text-purple-400" size={48} />
                    <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">ISO-BUS Desconfigurado</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">Este veículo ainda não está emparelhado com a Bridge de Telemetria Oriva ISO-11783.</p>
                </div>
                <button
                    onClick={() => { haptics.medium(); handlePair(); }}
                    className="w-full py-5 bg-purple-600 hover:bg-purple-500 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
                >
                    <Radio size={20} className="animate-pulse" /> Emparelhar Bridge
                </button>
            </div>
        );
    }

    if (isPairing) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-8">
                <div className="relative w-32 h-32">
                    <svg className="w-full h-full -rotate-90">
                        <circle cx="64" cy="64" r="60" className="stroke-white/5 fill-none" strokeWidth="4" />
                        <motion.circle
                            cx="64" cy="64" r="60"
                            className="stroke-purple-500 fill-none"
                            strokeWidth="4"
                            strokeDasharray="377"
                            animate={{ strokeDashoffset: 377 - (pairingProgress / 100) * 377 }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Radio size={32} className="text-purple-400 animate-bounce" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest">A procurar Bridge...</h3>
                    <p className="text-xs text-gray-500 font-mono tracking-widest">{pairingProgress}% concluído</p>
                </div>
                <div className="w-full max-w-xs h-1 bg-white/5 rounded-full overflow-hidden mb-4">
                    <motion.div
                        className="h-full bg-purple-500"
                        animate={{ width: `${pairingProgress}%` }}
                    />
                </div>

                {/* Pairing Terminal View */}
                <div className="w-full bg-black/80 rounded-2xl p-4 border border-white/10 font-mono text-left opacity-60 scale-90">
                    <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-2">
                        <Terminal size={12} className="text-purple-400" />
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Processo de Emparelhamento</span>
                    </div>
                    <div className="space-y-1 h-24 overflow-hidden">
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-4">
                                <span className={clsx("text-[9px]", i === 0 ? "text-emerald-400" : "text-gray-500")}>{log}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const busData = data!;
    if (!data) return null;

    return (
        <div className="space-y-4">
            {/* Connection Status Header */}
            <div className="flex items-center justify-between bg-white/5 border border-white/10 p-3 rounded-2xl">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Cpu className="text-purple-400" size={24} />
                        <motion.div
                            animate={{ opacity: isConnected ? [0.3, 1, 0.3] : 0.3 }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className={clsx("absolute -top-1 -right-1 w-2 h-2 rounded-full shadow-[0_0_8px]", isConnected ? "bg-emerald-500 shadow-emerald-500/80" : "bg-red-500 shadow-red-500/80")}
                        />
                    </div>
                    <div>
                        <h3 className="text-sm font-black uppercase italic text-purple-200">Terminal ISO-11783</h3>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                            Estado: <span className={isConnected ? "text-emerald-400" : "text-red-400"}>{isConnected ? "Ligação Ativa" : "Sinal Perdido"}</span>
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => { haptics.medium(); setIsConnected(!isConnected); }}
                    className={clsx(
                        "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all",
                        isConnected ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    )}
                >
                    {isConnected ? "Desligar" : "Ligar"}
                </button>
            </div>

            <MachineCockpit data={busData} />

            <div className="grid grid-cols-1 gap-4">
                {/* Telemetry Details */}
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <Parameter
                            icon={Fuel}
                            label="Consumo Inst."
                            value={busData.fuelRate}
                            unit="L/h"
                            color="text-amber-400"
                        />
                        <Parameter
                            icon={Zap}
                            label="Velocidade PDF"
                            value={busData.ptoSpeed}
                            unit="RPM"
                            color="text-emerald-400"
                        />
                        <Parameter
                            icon={Activity}
                            label="Pressão Hidráulica"
                            value={busData.hydraulicPressure}
                            unit="Bar"
                            color="text-blue-400"
                        />
                        <Parameter
                            icon={Thermometer}
                            label="Temp. Líquido"
                            value={busData.coolantTemp}
                            unit="°C"
                            color="text-red-400"
                        />
                    </div>
                </div>
            </div>

            {/* Console / Log Terminal */}
            <div className="bg-black/80 rounded-2xl p-4 border border-white/10 font-mono">
                <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                    <Terminal size={14} className="text-purple-400" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Terminal de Dados CAN-BUS</span>
                </div>
                <div className="space-y-1 h-32 overflow-y-auto custom-scrollbar">
                    {logs.map((log, i) => (
                        <div key={i} className="flex gap-4">
                            <span className="text-gray-600 text-[10px]">{new Date().toLocaleTimeString([], { hour12: false })}</span>
                            <span className={clsx("text-[10px]", i === 0 ? "text-emerald-400" : "text-gray-400")}>{log}</span>
                        </div>
                    ))}
                    {logs.length === 0 && (
                        <p className="text-gray-600 text-[10px] italic">A aguardar tráfego de dados...</p>
                    )}
                </div>
            </div>

            {/* Warnings / DTC Panel */}
            {busData.dtc.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                        <AlertTriangle size={16} />
                        <span className="text-xs font-black uppercase">Códigos de Erro Ativos (DTC)</span>
                    </div>
                    <div className="space-y-1">
                        {busData.dtc.map((code, i) => (
                            <div key={i} className="text-[10px] font-bold text-red-300/80 bg-red-500/5 p-2 rounded-lg flex justify-between">
                                <span>{code}</span>
                                <span className="opacity-50 tracking-wider">CRÍTICO</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ISOBUSBridge;
