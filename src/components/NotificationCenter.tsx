import React, { useState, useMemo } from 'react';
import { Bell, X, Check, Archive, AlertTriangle, Info, Calendar, ChevronRight, Filter, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Notification } from '../types';

interface NotificationCenterProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onClearHistory: () => void;
    onNavigate: (path: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
    isOpen,
    onClose,
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    onClearHistory,
    onNavigate
}) => {
    const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');

    const filteredNotifications = useMemo(() => {
        switch (filter) {
            case 'unread': return notifications.filter(n => !n.read);
            case 'critical': return notifications.filter(n => n.type === 'critical');
            default: return notifications;
        }
    }, [notifications, filter]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'critical': return <AlertTriangle size={18} className="text-red-500" />;
            case 'info': return <Info size={18} className="text-blue-500" />;
            case 'task': return <Calendar size={18} className="text-amber-500" />;
            case 'success': return <Check size={18} className="text-green-500" />;
            default: return <Bell size={18} className="text-gray-500" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case 'critical': return 'bg-red-100 dark:bg-red-900/20';
            case 'info': return 'bg-blue-100 dark:bg-blue-900/20';
            case 'task': return 'bg-amber-100 dark:bg-amber-900/20';
            case 'success': return 'bg-green-100 dark:bg-green-900/20';
            default: return 'bg-gray-100 dark:bg-neutral-800';
        }
    };

    // Prevent scroll when open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
            />

            {/* Slide-over Panel */}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 z-[201] w-full max-w-md bg-[#FDFDF5] dark:bg-[#0A0A0A] shadow-2xl border-l border-white/20 flex flex-col"
            >
                {/* Header */}
                <div className="flex flex-col gap-4 px-6 pt-8 pb-4 border-b border-gray-100 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-xl">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-black italic text-gray-900 dark:text-white uppercase tracking-tighter">Notificações</h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        {/* Filter Tabs */}
                        <div className="flex bg-gray-100 dark:bg-neutral-800 p-1 rounded-xl">
                            {(['all', 'unread', 'critical'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={clsx(
                                        "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all",
                                        filter === f
                                            ? "bg-white dark:bg-neutral-700 text-gray-900 dark:text-white shadow-sm"
                                            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    )}
                                >
                                    {f === 'all' && 'Todas'}
                                    {f === 'unread' && `Não Lidas (${unreadCount})`}
                                    {f === 'critical' && 'Críticas'}
                                </button>
                            ))}
                        </div>

                        {/* Actions */}
                        {unreadCount > 0 && (
                            <button
                                onClick={onMarkAllAsRead}
                                className="text-[10px] font-bold text-agro-green uppercase tracking-wide hover:underline"
                            >
                                Ler Todas
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
                    {filteredNotifications.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-40">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                                <Bell size={32} className="text-gray-400" />
                            </div>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Sem Notificações</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <AnimatePresence>
                                {filteredNotifications.map((notification) => (
                                    <motion.div
                                        key={notification.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        onClick={() => {
                                            if (!notification.read) onMarkAsRead(notification.id);
                                            if (notification.actionLink) {
                                                onNavigate(notification.actionLink);
                                                onClose();
                                            }
                                        }}
                                        className={clsx(
                                            "group relative p-4 rounded-2xl border transition-all cursor-pointer active:scale-[0.98]",
                                            notification.read
                                                ? "bg-white dark:bg-neutral-900 border-gray-100 dark:border-white/5 opacity-70 hover:opacity-100"
                                                : "bg-white dark:bg-neutral-800 border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md"
                                        )}
                                    >
                                        {!notification.read && (
                                            <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-agro-green shadow-sm animate-pulse" />
                                        )}

                                        <div className="flex gap-4">
                                            {/* Icon */}
                                            <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", getBgColor(notification.type))}>
                                                {getIcon(notification.type)}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between mb-1">
                                                    <span className={clsx(
                                                        "text-[10px] font-bold uppercase tracking-wide",
                                                        notification.type === 'critical' ? 'text-red-500' : 'text-gray-400'
                                                    )}>
                                                        {notification.type === 'critical' ? 'Alerta Crítico' : notification.type}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600">
                                                        {/* Formatar data simples */}
                                                        {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <h4 className={clsx("font-bold text-sm mb-1 leading-tight", notification.read ? "text-gray-600 dark:text-gray-400" : "text-gray-900 dark:text-white")}>
                                                    {notification.title}
                                                </h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                                    {notification.message}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-xl">
                    <button
                        onClick={onClearHistory}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 font-bold text-xs uppercase tracking-wide transition-colors"
                    >
                        <Trash2 size={16} /> Limpar Histórico
                    </button>
                </div>
            </motion.div>
        </>
    );
};
