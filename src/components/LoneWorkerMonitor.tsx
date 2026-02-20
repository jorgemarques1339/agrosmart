
import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertCircle, CheckCircle2, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { haptics } from '../utils/haptics';

const LoneWorkerMonitor: React.FC = () => {
    const { permissions } = useStore();
    const [isFallDetected, setIsFallDetected] = useState(false);
    const [countdown, setCountdown] = useState(10);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        if (!permissions.motion || !isActive) return;

        let lastAccel = 0;
        const FALL_THRESHOLD = 15; // G-force like
        const STILL_THRESHOLD = 0.5;

        const handleMotion = (event: DeviceMotionEvent) => {
            const accel = event.accelerationIncludingGravity;
            if (!accel) return;

            const totalAccel = Math.sqrt(
                (accel.x || 0) ** 2 +
                (accel.y || 0) ** 2 +
                (accel.z || 0) ** 2
            );

            // Simple Fall Detection Logic
            // 1. Detect spike
            if (totalAccel > FALL_THRESHOLD && !isFallDetected) {
                setIsFallDetected(true);
                haptics.warning();
            }
        };

        window.addEventListener('devicemotion', handleMotion);
        return () => window.removeEventListener('devicemotion', handleMotion);
    }, [permissions.motion, isActive, isFallDetected]);

    // Countdown logic when fall detected
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isFallDetected && countdown > 0) {
            timer = setInterval(() => setCountdown(c => c - 1), 1000);
        } else if (countdown === 0) {
            // Trigger emergency (mock notification)
            console.log("EMERGENCY TRIGGERED");
        }
        return () => clearInterval(timer);
    }, [isFallDetected, countdown]);

    const cancelAlert = () => {
        setIsFallDetected(false);
        setCountdown(10);
        haptics.light();
    };

    if (!permissions.motion) return null;

    return (
        <div className="fixed bottom-24 right-4 z-[100]">
            <AnimatePresence>
                {!isFallDetected ? (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsActive(!isActive)}
                        className={`p-4 rounded-full shadow-2xl flex items-center gap-2 transition-all ${isActive ? 'bg-orange-500 text-white animate-pulse' : 'bg-white dark:bg-neutral-800 text-gray-500'}`}
                    >
                        <Activity size={20} />
                        {isActive && <span className="text-[10px] font-black uppercase tracking-widest">Lone Worker ON</span>}
                    </motion.button>
                ) : (
                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-red-600 text-white p-6 rounded-[2rem] shadow-2xl w-64 border border-white/20"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldAlert size={32} className="animate-bounce" />
                            <div>
                                <h4 className="font-black uppercase text-sm tracking-tighter">Queda Detetada!</h4>
                                <p className="text-[10px] opacity-80 font-bold uppercase">A enviar alerta em {countdown}s</p>
                            </div>
                        </div>

                        <button
                            onClick={cancelAlert}
                            className="w-full py-3 bg-white text-red-600 rounded-xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                        >
                            Estou Bem (Cancelar)
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LoneWorkerMonitor;
