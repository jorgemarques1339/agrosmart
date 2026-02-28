import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { MapPin, TrendingUp, MessageSquare, Calendar, Network, ChevronRight } from 'lucide-react';

export interface QuickActionsProps {
    activeSession: any;
    setIsCheckInOpen: (open: boolean) => void;
    setIsMarketModalOpen: (open: boolean) => void;
    hasUnreadFeed: boolean;
    onNavigate: (path: string) => void;
    setIsCalendarOpen: (open: boolean) => void;
    myPendingTaskCount: number;
    tasksToReviewCount: number;
    setIsCollaborativeModalOpen: (open: boolean) => void;
    itemVariants: any;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
    activeSession,
    setIsCheckInOpen,
    setIsMarketModalOpen,
    hasUnreadFeed,
    onNavigate,
    setIsCalendarOpen,
    myPendingTaskCount,
    tasksToReviewCount,
    setIsCollaborativeModalOpen,
    itemVariants
}) => {
    return (
        <>
            {/* 3. QUICK ACTIONS */}
            <motion.div variants={itemVariants} className="px-3 mt-1">
                <div className="grid grid-cols-4 gap-2">

                    {/* Check-in — Emerald */}
                    <button
                        onClick={() => setIsCheckInOpen(true)}
                        className={clsx(
                            "relative py-2 sm:py-4 rounded-[1.75rem] font-black text-[9px] sm:text-[10px] uppercase tracking-wider transition-all duration-300 flex flex-col items-center justify-center gap-1.5 sm:gap-2.5 overflow-hidden group active:scale-95 border",
                            activeSession
                                ? 'bg-emerald-500/30 border-emerald-500/60 text-emerald-600 dark:text-emerald-300 shadow-lg shadow-emerald-500/20'
                                : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                        )}
                    >
                        <div className={clsx('p-2 sm:p-2.5 rounded-2xl transition-all', activeSession ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-emerald-200 dark:bg-emerald-500/25 group-hover:bg-emerald-300 dark:group-hover:bg-emerald-500/35')}>
                            <MapPin size={19} className={activeSession ? 'text-white animate-bounce' : 'text-emerald-700 dark:text-emerald-300'} />
                        </div>
                        <span>{activeSession ? 'Ativo' : 'Check-in'}</span>
                        {activeSession && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                    </button>

                    {/* Cotações — Amber */}
                    <button
                        onClick={() => setIsMarketModalOpen(true)}
                        className="relative py-2 sm:py-4 rounded-[1.75rem] font-black text-[9px] sm:text-[10px] uppercase tracking-wider transition-all duration-300 flex flex-col items-center justify-center gap-1.5 sm:gap-2.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 active:scale-95 group"
                    >
                        <div className="p-2 sm:p-2.5 rounded-2xl bg-amber-200 dark:bg-amber-500/25 group-hover:bg-amber-300 dark:group-hover:bg-amber-500/35 transition-all">
                            <TrendingUp size={19} className="text-amber-700 dark:text-amber-300" />
                        </div>
                        Cotações
                    </button>

                    {/* Feed — Rose */}
                    <button
                        onClick={() => onNavigate('feed')}
                        className={clsx(
                            "relative py-2 sm:py-4 rounded-[1.75rem] font-black text-[9px] sm:text-[10px] uppercase tracking-wider transition-all duration-300 flex flex-col items-center justify-center gap-1.5 sm:gap-2.5 border active:scale-95 group",
                            hasUnreadFeed
                                ? 'bg-rose-500/20 border-rose-500/50 text-rose-600 dark:text-rose-400 shadow-lg shadow-rose-500/10'
                                : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20'
                        )}
                    >
                        <div className={clsx('p-2 sm:p-2.5 rounded-2xl transition-all relative', hasUnreadFeed ? 'bg-rose-500 shadow-lg shadow-rose-500/30' : 'bg-rose-200 dark:bg-rose-500/25 group-hover:bg-rose-300 dark:group-hover:bg-rose-500/35')}>
                            <MessageSquare size={19} className={hasUnreadFeed ? 'text-white' : 'text-rose-700 dark:text-rose-300'} />
                            {hasUnreadFeed && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full border-2 border-rose-500 animate-ping" />}
                        </div>
                        Feed
                    </button>

                    {/* Tarefas — Indigo */}
                    <button
                        onClick={() => setIsCalendarOpen(true)}
                        className={clsx(
                            "relative py-2 sm:py-4 rounded-[1.75rem] font-black text-[9px] sm:text-[10px] uppercase tracking-wider transition-all duration-300 flex flex-col items-center justify-center gap-1.5 sm:gap-2.5 border active:scale-95 group",
                            (myPendingTaskCount > 0 || tasksToReviewCount > 0)
                                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-600 dark:text-indigo-400 shadow-lg shadow-indigo-500/10'
                                : 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20'
                        )}
                    >
                        <div className={clsx('p-2 sm:p-2.5 rounded-2xl transition-all relative', (myPendingTaskCount > 0 || tasksToReviewCount > 0) ? 'bg-indigo-500 shadow-lg shadow-indigo-500/30' : 'bg-indigo-200 dark:bg-indigo-500/25 group-hover:bg-indigo-300 dark:group-hover:bg-indigo-500/35')}>
                            <Calendar size={19} className={(myPendingTaskCount > 0 || tasksToReviewCount > 0) ? 'text-white' : 'text-indigo-700 dark:text-indigo-300'} />
                            {(myPendingTaskCount > 0 || tasksToReviewCount > 0) && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[9px] flex items-center justify-center font-black text-white border border-indigo-500/50">
                                    {myPendingTaskCount + tasksToReviewCount}
                                </span>
                            )}
                        </div>
                        Tarefas
                    </button>
                </div>
            </motion.div>

            {/* COLLABORATIVE NETWORK PILL */}
            <motion.div variants={itemVariants} className="px-3 mt-3 sm:mt-4">
                <button
                    onClick={() => setIsCollaborativeModalOpen(true)}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-800 text-white rounded-[1.5rem] sm:rounded-[1.75rem] py-2.5 sm:py-4 px-4 sm:px-5 flex items-center justify-between shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 active:scale-[0.98] transition-all group"
                >
                    <div className="flex items-center gap-2.5 sm:gap-3.5">
                        <div className="bg-white/20 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl group-hover:scale-110 transition-transform flex items-center justify-center">
                            <Network className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="text-left flex flex-col justify-center">
                            <div className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-indigo-100">Cooperativas</div>
                            <div className="text-xs sm:text-base font-bold mt-0.5 sm:mt-1 leading-none">Rede Colaborativa</div>
                        </div>
                    </div>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/70 group-hover:translate-x-1 hover:text-white transition-all" />
                </button>
            </motion.div>
        </>
    );
};
