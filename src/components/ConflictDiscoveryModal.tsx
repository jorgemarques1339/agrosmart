import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cloud, Smartphone, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Conflict } from '../store/slices/uiSlice';
import { haptics } from '../utils/haptics';
import { db } from '../services/db';

export const ConflictDiscoveryModal: React.FC = () => {
    const { conflicts, resolveConflict, addNotification } = useStore();
    const conflict = conflicts[0]; // Process one at a time

    if (!conflict) return null;

    const handleResolve = async (choice: 'local' | 'remote') => {
        haptics.medium();

        try {
            if (choice === 'remote') {
                // Keep Remote: Update local DB with remote data and remove pending sync op
                const dexieTable = (db as any)[conflict.type];
                if (dexieTable) {
                    await dexieTable.put(conflict.remoteData);
                }

                // Clear pending sync op for this entity
                await db.syncQueue
                    .filter(op => {
                        const opId = op.data.id || op.data.updates?.id || op.data.fieldId || op.data.batchId;
                        return opId === conflict.id;
                    })
                    .delete();
            } else {
                // Keep Local: Force push local data again
                // We don't need to do much here because the op is already in syncQueue.
                // But we might want to update its updatedAt to be even newer than the remote one
                // so it "wins" on the next sync pass.
                const dexieTable = (db as any)[conflict.type];
                if (dexieTable) {
                    const localWithNewTime = { ...conflict.localData, updatedAt: new Date().toISOString() };
                    await dexieTable.put(localWithNewTime);
                }
            }

            resolveConflict(conflict.id, choice);

            addNotification({
                id: `conflict-res-${Date.now()}`,
                title: 'Conflito Resolvido',
                message: `As alterações do ${conflict.type} foram harmonizadas.`,
                type: 'success',
                timestamp: new Date().toISOString(),
                read: false
            });
        } catch (error) {
            console.error('[Conflict] Error resolving:', error);
            haptics.error();
        }
    };

    const renderDataDiff = () => {
        // Simple diff: only show fields that differ
        const local = conflict.localData;
        const remote = conflict.remoteData;
        const keys = Object.keys({ ...local, ...remote }).filter(k => k !== 'updatedAt' && k !== 'id');

        return (
            <div className="space-y-3">
                {keys.map(key => {
                    const valL = JSON.stringify(local[key]);
                    const valR = JSON.stringify(remote[key]);
                    if (valL === valR) return null;

                    return (
                        <div key={key} className="grid grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700/50">
                            <div>
                                <p className="text-[10px] uppercase font-black text-gray-400 mb-1">{key} (Local)</p>
                                <p className="text-sm font-bold text-gray-700 dark:text-neutral-200 truncate">{valL}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-blue-400 mb-1">{key} (Nuvem)</p>
                                <p className="text-sm font-bold text-blue-600 dark:text-blue-400 truncate">{valR}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl"
                >
                    <div className="p-8 border-b dark:border-neutral-800 relative">
                        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center mb-6">
                            <AlertTriangle className="text-amber-500" size={32} />
                        </div>
                        <h3 className="text-2xl font-black dark:text-white leading-tight">Conflito de Dados</h3>
                        <p className="text-gray-500 text-sm mt-2">
                            Alguém editou o registo <span className="text-amber-600 font-bold">"{conflict.localData.name || conflict.id}"</span> na nuvem enquanto trabalhava localmente.
                        </p>
                    </div>

                    <div className="p-8 max-h-[40vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex-1 p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl border-2 border-transparent">
                                <div className="flex items-center gap-2 mb-2">
                                    <Smartphone className="text-gray-400" size={16} />
                                    <span className="text-xs font-black uppercase text-gray-400">Teu Dispositivo</span>
                                </div>
                                <p className="text-xs text-gray-500">Alterações não sincronizadas ainda.</p>
                            </div>
                            <ArrowRight className="text-gray-300" />
                            <div className="flex-1 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border-2 border-blue-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Cloud className="text-blue-500" size={16} />
                                    <span className="text-xs font-black uppercase text-blue-500">Servidor Cloud</span>
                                </div>
                                <p className="text-xs text-blue-600 dark:text-blue-400">Versão mais recente de outro utilizador.</p>
                            </div>
                        </div>

                        {renderDataDiff()}
                    </div>

                    <div className="p-8 pt-0 grid grid-cols-2 gap-4">
                        <button
                            onClick={() => handleResolve('remote')}
                            className="flex flex-col items-center justify-center p-5 bg-blue-600 text-white rounded-3xl font-black shadow-lg shadow-blue-600/30 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            <Cloud size={24} className="mb-2" />
                            <span>MANTER NUVEM</span>
                            <p className="text-[9px] opacity-70 mt-1 font-medium">Descarta as tuas alterações</p>
                        </button>

                        <button
                            onClick={() => handleResolve('local')}
                            className="flex flex-col items-center justify-center p-5 bg-agro-green text-white rounded-3xl font-black shadow-lg shadow-agro-green/30 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            <Smartphone size={24} className="mb-2" />
                            <span>MANTER LOCAL</span>
                            <p className="text-[9px] opacity-70 mt-1 font-medium">Subscreve a versão cloud</p>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
