import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { iotManager } from '../../services/IoTManager';
import { haptics } from '../../utils/haptics';
import { Zap, CheckCircle2, XCircle } from 'lucide-react';

export const AutoPilotService: React.FC = () => {
    const pendingAutoPilotRequest = useStore(state => state.pendingAutoPilotRequest);
    const setPendingAutoPilotRequest = useStore(state => state.setPendingAutoPilotRequest);

    const handleApprove = () => {
        if (!pendingAutoPilotRequest) return;

        haptics.success();

        // Atuar as válvulas via protocolo MQTT da aplicação
        const enableIrrigation = pendingAutoPilotRequest.action === 'irrigate';
        iotManager.toggleIrrigation(pendingAutoPilotRequest.fieldId, enableIrrigation);

        // Limpar o pedido e fechar a notificação
        setPendingAutoPilotRequest(null);
    };

    const handleReject = () => {
        haptics.warning();
        setPendingAutoPilotRequest(null);
    };

    return (
        <AnimatePresence>
            {pendingAutoPilotRequest && (
                <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[9999] pointer-events-auto"
                >
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden relative">
                        {/* Status bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500 animate-pulse"></div>

                        <div className="p-4 md:p-5">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                    <Zap size={20} className="animate-pulse" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-gray-900 dark:text-white text-sm md:text-base leading-tight">
                                        AutoPilot: {pendingAutoPilotRequest.fieldName}
                                    </h3>
                                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                                        {pendingAutoPilotRequest.reason}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-end gap-2">
                                <button
                                    onClick={handleReject}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5 uppercase tracking-wide"
                                >
                                    <XCircle size={14} /> Rejeitar
                                </button>
                                <button
                                    onClick={handleApprove}
                                    className="px-4 py-2 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-colors flex items-center gap-1.5 uppercase tracking-wide"
                                >
                                    <CheckCircle2 size={14} /> Aprovar
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
