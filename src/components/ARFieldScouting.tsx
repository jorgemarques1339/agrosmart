import React, { useState, useEffect, useRef } from 'react';
import {
    Camera,
    Wifi,
    Thermometer,
    Droplets,
    Scan,
    Zap,
    Navigation,
    Activity,
    Crosshair,
    ShieldCheck,
    RefreshCw,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Field } from '../types';
import { haptics } from '../utils/haptics';

interface ARFieldScoutingProps {
    field: Field;
    onSaveCapture?: (dataUrl: string) => void;
}

const ARFieldScouting: React.FC<ARFieldScoutingProps> = ({ field, onSaveCapture }) => {
    const [status, setStatus] = useState<'idle' | 'scanning' | 'captured'>('idle');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startAR = async () => {
        setStatus('scanning');
        haptics.medium();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } },
                audio: false
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch(e => console.error("AR Feed Play prevented", e));
                };
            }
        } catch (err) {
            console.error("AR Camera access denied:", err);
            alert("Acesso à câmara negado para AR. Verifique as permissões.");
            setStatus('idle');
        }
    };

    const stopAR = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    useEffect(() => {
        return () => stopAR();
    }, []);

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        setStatus('captured');
        haptics.success();
        stopAR();

        if (onSaveCapture) {
            onSaveCapture(dataUrl);
        }
    };

    const resetAR = () => {
        setCapturedImage(null);
        startAR();
    };

    const hudVariants = {
        animate: {
            y: [0, -5, 0],
            x: [0, 2, 0],
            transition: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* AR Viewport */}
            <div className="relative w-full aspect-[4/5] md:aspect-video rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-black shadow-2xl ring-8 ring-white/5 group">

                {/* Real-time Video Feed */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover grayscale-[0.2] contrast-[1.1] ${status === 'captured' ? 'hidden' : 'block'}`}
                />

                {/* Captured Static View */}
                {status === 'captured' && capturedImage && (
                    <img src={capturedImage} alt="AR Capture" className="w-full h-full object-cover" />
                )}

                <canvas ref={canvasRef} className="hidden" />

                {/* --- AR HUD OVERLAY --- */}
                <AnimatePresence>
                    {status === 'scanning' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-20 pointer-events-none p-3 md:p-6 flex flex-col justify-between"
                        >
                            {/* TOP HUD: Telemetry */}
                            <motion.div
                                variants={hudVariants}
                                animate="animate"
                                className="flex justify-between items-start"
                            >
                                <div className="space-y-2 md:space-y-3">
                                    <div className="px-3 py-1.5 md:px-4 md:py-2 bg-black/40 backdrop-blur-xl rounded-xl md:rounded-2xl border border-white/20 flex items-center gap-2 md:gap-3">
                                        <Activity size={12} className="text-agro-green animate-pulse md:w-[14px]" />
                                        <div>
                                            <p className="text-[7px] md:text-[8px] font-black text-white/50 uppercase tracking-widest leading-none mb-0.5">AR_FIELD</p>
                                            <p className="text-[9px] md:text-xs font-black text-white uppercase tracking-tighter">TELEMETRY</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5 md:gap-2">
                                        <div className="flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 bg-blue-500/20 backdrop-blur-md rounded-lg md:rounded-xl border border-blue-500/30">
                                            <Droplets size={10} className="text-blue-400 md:w-[12px]" />
                                            <span className="text-[9px] md:text-[10px] font-black text-white">{field.humidity}% <span className="text-[7px] md:text-[8px] opacity-60">HUMID.</span></span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 bg-orange-500/20 backdrop-blur-md rounded-lg md:rounded-xl border border-orange-500/30">
                                            <Thermometer size={10} className="text-orange-400 md:w-[12px]" />
                                            <span className="text-[9px] md:text-[10px] font-black text-white">{field.temp}°C <span className="text-[7px] md:text-[8px] opacity-60">TEMP.</span></span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5 md:gap-2 items-end">
                                    <div className="px-3 md:px-4 py-1.5 md:py-2 bg-agro-green/20 backdrop-blur-xl rounded-xl md:rounded-2xl border border-agro-green/30 text-right">
                                        <p className="text-[7px] md:text-[8px] font-black text-agro-green uppercase tracking-widest leading-none mb-1">VIGOR_NDVI</p>
                                        <p className="text-lg md:text-2xl font-black text-white tracking-tighter leading-none">{field.currentNdvi || '0.86'}</p>
                                        <div className="h-0.5 md:h-1 w-full bg-white/10 rounded-full mt-1.5 md:mt-2 overflow-hidden">
                                            <div className="h-full bg-agro-green rounded-full" style={{ width: `${(field.currentNdvi || 0.86) * 100}%` }} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/10">
                                        <Zap size={8} className="text-yellow-400 md:w-[10px]" />
                                        <span className="text-[7px] md:text-[8px] font-black text-white uppercase tracking-widest">REAL-TIME</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* CENTER HUD: Targeting Reticle */}
                            <div className="flex-1 flex items-center justify-center relative">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.05, 1],
                                        rotate: [0, 90, 180, 270, 360]
                                    }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="relative w-32 h-32 md:w-48 md:h-48 flex items-center justify-center opacity-60 md:opacity-100"
                                >
                                    <div className="absolute inset-0 border border-white/10 rounded-full" />
                                    <div className="absolute inset-3 md:inset-4 border border-white/5 rounded-full" />
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-3 md:h-4 bg-white/40" />
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-3 md:h-4 bg-white/40" />
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 md:w-4 h-0.5 bg-white/40" />
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 md:w-4 h-0.5 bg-white/40" />
                                </motion.div>

                                <div className="absolute flex flex-col items-center">
                                    <Crosshair size={24} className="text-white/20 md:w-[32px]" />
                                </div>

                                {/* Tracking simulation info */}
                                <div className="absolute bottom-[20%] md:bottom-1/4 flex flex-col items-center gap-0.5">
                                    <div className="flex items-center gap-1.5 group">
                                        <div className="w-1.5 h-1.5 rounded-full bg-agro-green animate-pulse" />
                                        <span className="text-[8px] md:text-[9px] font-black text-agro-green uppercase tracking-widest text-shadow-sm">POINT_TRACKING_LOCKED</span>
                                    </div>
                                    <p className="text-[7px] md:text-[8px] font-mono text-white/40 tracking-tighter">LAT: {field.coordinates[0].toFixed(4)}... | LNG: {field.coordinates[1].toFixed(4)}...</p>
                                </div>
                            </div>

                            {/* BOTTOM HUD: Navigation & Status */}
                            <motion.div
                                variants={hudVariants}
                                animate="animate"
                                className="flex items-end justify-between"
                            >
                                <div className="bg-black/40 backdrop-blur-xl p-2.5 md:p-4 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 flex items-center gap-3 md:gap-4 max-w-[50%]">
                                    <div className="p-1.5 md:p-2 bg-white/10 rounded-lg md:rounded-xl">
                                        <Navigation size={14} className="text-agro-green md:w-[18px]" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[6px] md:text-[8px] font-black text-white/40 uppercase tracking-widest truncate">{field.crop}</p>
                                        <p className="text-[10px] md:text-xs font-black text-white uppercase truncate">{field.name}</p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="text-[7px] md:text-[8px] font-black text-white uppercase tracking-widest animate-pulse mb-0.5">RECORDING_DATA</p>
                                    <div className="flex gap-0.5 justify-end">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="w-1 md:w-1.5 h-2.5 md:h-3 bg-agro-green/30 rounded-full overflow-hidden">
                                                <motion.div
                                                    animate={{ height: ["20%", "80%", "20%"] }}
                                                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                                                    className="w-full bg-agro-green"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* CAPTURE FEEDBACK Overlay */}
                <AnimatePresence>
                    {status === 'captured' && (
                        <motion.div
                            initial={{ backgroundColor: 'rgba(255,255,255,1)' }}
                            animate={{ backgroundColor: 'rgba(255,255,255,0)' }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0 z-[100] pointer-events-none"
                        />
                    )}
                </AnimatePresence>

                {/* Capture Controls */}
                <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 pointer-events-auto w-full px-4 justify-center">
                    {status === 'idle' && (
                        <button
                            onClick={startAR}
                            className="w-full max-w-xs md:max-w-none md:px-8 py-3.5 md:py-4 bg-agro-green text-white rounded-[1.5rem] md:rounded-[2rem] font-black uppercase tracking-widest text-[11px] md:text-sm shadow-2xl flex items-center justify-center gap-2 md:gap-3 active:scale-95 transition-all"
                        >
                            <Camera size={18} className="md:w-[20px]" /> Ativar Realidade Aumentada
                        </button>
                    )}

                    {status === 'scanning' && (
                        <button
                            onClick={handleCapture}
                            className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 backdrop-blur-md active:scale-90 transition-all shadow-2xl relative"
                        >
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white shadow-inner" />
                        </button>
                    )}

                    {status === 'captured' && (
                        <div className="flex gap-2.5 md:gap-4 w-full max-w-sm justify-center">
                            <button
                                onClick={resetAR}
                                className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl border border-white/20 text-white font-black uppercase text-[10px] md:text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                            >
                                <RefreshCw size={14} className="md:w-[16px]" /> Repetir
                            </button>
                            <div className="flex-[1.5] px-4 md:px-6 py-2.5 md:py-3 bg-agro-green text-white rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs flex items-center justify-center gap-2 shadow-lg shadow-agro-green/30 border border-agro-green/50">
                                <ShieldCheck size={14} className="md:w-[16px]" /> Registado
                            </div>
                        </div>
                    )}
                </div>

                {/* Close Button */}
                {status === 'scanning' && (
                    <button
                        onClick={() => { stopAR(); setStatus('idle'); }}
                        className="absolute top-6 right-6 z-50 p-3 bg-black/60 backdrop-blur-md rounded-full text-white pointer-events-auto hover:bg-neutral-800 transition-colors border border-white/10"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Info Card - Compacted for mobile */}
            <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 border border-gray-100 dark:border-white/5 shadow-xl flex items-center gap-3 md:gap-5">
                <div className="w-10 h-10 md:w-16 md:h-16 bg-agro-green/10 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                    <Scan size={20} className="text-agro-green md:w-[32px]" />
                </div>
                <div>
                    <h3 className="text-sm md:text-lg font-black dark:text-white uppercase tracking-tighter leading-none mb-0.5 md:mb-1">ORIVA-AR v1</h3>
                    <p className="text-[10px] md:text-xs font-medium text-gray-400 dark:text-gray-500 line-clamp-2 md:line-clamp-none">
                        Sobreposição de sensores IoT e vigor NDVI em tempo real.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ARFieldScouting;
