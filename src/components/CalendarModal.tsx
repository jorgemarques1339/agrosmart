
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, ChevronLeft, ChevronRight, Calendar,
    Wheat, CheckSquare, Plus,
    Trash2, User, FileText, Loader2, AlertTriangle, ArrowLeft
} from 'lucide-react';
import { Task, Field, Animal, UserProfile } from '../types';
import clsx from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarEvent {
    id: string;
    date: string;
    title: string;
    type: 'task' | 'harvest' | 'vaccine' | 'treatment';
    completed?: boolean;
    isAnimalEvent?: boolean;
}

interface CalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    tasks: Task[];
    fields: Field[];
    animals: Animal[];
    users: UserProfile[];
    currentUser: UserProfile;
    onNavigate: (tab: string) => void;
    onAddTask: (title: string, type: 'task' | 'harvest', date?: string, relatedFieldId?: string, relatedStockId?: string, plannedQuantity?: number, assignedTo?: string) => void;
    onDeleteTask: (id: string) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const EVENT_STYLES: Record<string, { bg: string; border: string; text: string; dot: string; badge: string; label: string }> = {
    task: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500', badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300', label: 'Tarefa' },
    harvest: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300', label: 'Colheita' },
    vaccine: { bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-400', badge: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300', label: 'Vacina' },
    treatment: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500', badge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300', label: 'Tratamento' },
};

const TYPE_OPTIONS: Array<{ value: 'task' | 'harvest'; label: string; icon: React.ReactNode }> = [
    { value: 'task', label: 'Tarefa', icon: <CheckSquare size={18} /> },
    { value: 'harvest', label: 'Colheita', icon: <Wheat size={18} /> },
];

// ─── Day Events Sheet ─────────────────────────────────────────────────────────
// Opens when tapping a day that already has events.

const DayEventsSheet: React.FC<{
    date: string;
    events: CalendarEvent[];
    currentUser: UserProfile;
    onClose: () => void;
    onAddEvent: () => void;
    onDeleteEvent: (id: string) => void;
}> = ({ date, events, currentUser, onClose, onAddEvent, onDeleteEvent }) => {
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('pt-PT', {
        weekday: 'long', day: 'numeric', month: 'long',
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[310] flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 340 }}
                onClick={e => e.stopPropagation()}
                className="w-full md:max-w-lg bg-white dark:bg-neutral-950 rounded-t-[2.5rem] shadow-2xl border-t border-white/10 flex flex-col overflow-hidden"
                style={{ maxHeight: '88dvh' }}
            >
                {/* Handle */}
                <div className="w-12 h-1 bg-gray-300 dark:bg-neutral-700 rounded-full mx-auto mt-2.5 shrink-0" />

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center active:scale-90 transition-transform shrink-0"
                        >
                            <ArrowLeft size={18} className="text-gray-700 dark:text-white" />
                        </button>
                        <div>
                            <h3 className="text-base font-black text-gray-900 dark:text-white leading-none capitalize">
                                {displayDate}
                            </h3>
                            <p className="text-[11px] text-gray-400 font-bold mt-0.5">
                                {events.length} evento{events.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {/* Add button — admins only */}
                    {currentUser.role === 'admin' && (
                        <button
                            onClick={onAddEvent}
                            className="flex items-center gap-1.5 pl-3 pr-4 h-10 bg-agro-green text-white rounded-2xl text-[12px] font-black active:scale-95 transition-transform shadow-lg shadow-agro-green/25 shrink-0"
                        >
                            <Plus size={14} /> Adicionar
                        </button>
                    )}
                </div>

                {/* Event list */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-3">
                    {events.map(event => {
                        const style = EVENT_STYLES[event.type];
                        const isConfirming = confirmDeleteId === event.id;
                        return (
                            <div
                                key={event.id}
                                className={clsx(
                                    'flex items-start gap-3 p-4 rounded-3xl border-2 transition-all',
                                    style.bg, style.border,
                                    event.completed && 'opacity-55',
                                )}
                            >
                                {/* Left accent */}
                                <div className={clsx('w-1 self-stretch rounded-full shrink-0 mt-0.5', style.dot)} />

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className={clsx('text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide', style.badge)}>
                                            {style.label}
                                        </span>
                                        {event.isAnimalEvent && (
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-500 uppercase tracking-wide">Animal</span>
                                        )}
                                        {event.completed && (
                                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">✓ Feito</span>
                                        )}
                                    </div>
                                    <p className={clsx('text-sm font-bold leading-snug', style.text, event.completed && 'line-through')}>
                                        {event.title}
                                    </p>
                                </div>

                                {/* Delete — admin + non-animal only */}
                                {!event.isAnimalEvent && currentUser.role === 'admin' && (
                                    <div className="shrink-0 flex items-center">
                                        {isConfirming ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setConfirmDeleteId(null)}
                                                    className="px-3 py-2 bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-200 rounded-xl text-[11px] font-bold active:scale-95"
                                                >
                                                    Não
                                                </button>
                                                <button
                                                    onClick={() => { onDeleteEvent(event.id); setConfirmDeleteId(null); }}
                                                    className="px-3 py-2 bg-red-500 text-white rounded-xl text-[11px] font-bold active:scale-95 flex items-center gap-1.5"
                                                >
                                                    <AlertTriangle size={12} /> Sim
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmDeleteId(event.id)}
                                                className="w-10 h-10 rounded-2xl flex items-center justify-center text-gray-400 active:bg-red-50 dark:active:bg-red-900/20 active:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={17} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Safe area bottom */}
                <div style={{ height: 'env(safe-area-inset-bottom)', minHeight: '0.5rem' }} className="shrink-0" />
            </motion.div>
        </motion.div>
    );
};

// ─── Add Event Sheet ──────────────────────────────────────────────────────────

const AddEventSheet: React.FC<{
    date: string;
    users: UserProfile[];
    onConfirm: (title: string, type: 'task' | 'harvest', assigneeId: string) => void;
    onCancel: () => void;
}> = ({ date, users, onConfirm, onCancel }) => {
    const [title, setTitle] = useState('');
    const [type, setType] = useState<'task' | 'harvest'>('task');
    const [assignee, setAssignee] = useState('');
    const [loading, setLoading] = useState(false);
    const [sheetH, setSheetH] = useState<number | undefined>(undefined);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const vv = window.visualViewport;
        const update = () => { const h = vv ? vv.height : window.innerHeight; setSheetH(Math.round(h * 0.97)); };
        update();
        vv?.addEventListener('resize', update);
        vv?.addEventListener('scroll', update);
        return () => { vv?.removeEventListener('resize', update); vv?.removeEventListener('scroll', update); };
    }, []);

    useEffect(() => {
        const t = setTimeout(() => inputRef.current?.focus(), 320);
        return () => clearTimeout(t);
    }, []);

    const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'long' });

    const handleSubmit = () => {
        if (!title.trim() || loading) return;
        setLoading(true);
        setTimeout(() => { onConfirm(title.trim(), type, assignee); setLoading(false); }, 280);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[320] flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.6)' }}
            onClick={onCancel}
        >
            <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 32, stiffness: 360 }}
                onClick={e => e.stopPropagation()}
                className="w-full md:max-w-lg bg-white dark:bg-neutral-950 rounded-t-[2.5rem] shadow-2xl border-t border-white/10 flex flex-col overflow-hidden"
                style={{ height: sheetH ? `${sheetH}px` : '90dvh', maxHeight: '96dvh' }}
            >
                <div className="w-12 h-1 bg-gray-300 dark:bg-neutral-700 rounded-full mx-auto mt-2.5 shrink-0" />

                <div className="flex items-center gap-3 px-4 pt-3 pb-3 border-b border-gray-100 dark:border-white/5 shrink-0">
                    <button onClick={onCancel} className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center active:scale-90 transition-transform shrink-0">
                        <ArrowLeft size={18} className="text-gray-700 dark:text-white" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-black text-gray-900 dark:text-white leading-none">Novo Evento</h3>
                        <p className="text-[11px] text-agro-green font-bold capitalize truncate mt-0.5">{displayDate}</p>
                    </div>
                    <button onClick={handleSubmit} disabled={!title.trim() || loading} className="h-10 px-4 bg-agro-green text-white rounded-2xl text-[12px] font-black disabled:opacity-40 flex items-center gap-1.5 active:scale-95 transition-transform shadow-lg shadow-agro-green/25 shrink-0">
                        {loading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Criar
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-5">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                            <FileText size={11} /> Descrição <span className="text-agro-green">*</span>
                        </label>
                        <input
                            ref={inputRef}
                            type="text"
                            inputMode="text"
                            enterKeyHint="done"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                            placeholder="Ex: Pulverizar Parcela A com fungicida..."
                            className="w-full bg-gray-50 dark:bg-neutral-900 border-2 border-gray-200 dark:border-white/10 rounded-2xl px-4 py-4 text-[16px] font-semibold text-gray-900 dark:text-white placeholder-gray-400/70 outline-none focus:border-agro-green transition-colors"
                        />
                        <p className="text-[10px] text-gray-400 mt-1.5 px-1">Prima Enter para criar rapidamente</p>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Tipo de Evento</label>
                        <div className="flex gap-2">
                            {TYPE_OPTIONS.map(opt => (
                                <button key={opt.value} type="button" onClick={() => setType(opt.value)}
                                    className={clsx('flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl border-2 font-bold text-sm transition-all active:scale-95',
                                        type === opt.value ? 'border-agro-green bg-agro-green text-white shadow-lg shadow-agro-green/25' : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-neutral-900 text-gray-600 dark:text-gray-300')}>
                                    {opt.icon} {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <User size={11} /> Trabalhador <span className="text-gray-300 dark:text-gray-600 font-medium normal-case tracking-normal">(opcional)</span>
                        </label>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                            <button type="button" onClick={() => setAssignee('')}
                                className={clsx('flex flex-col items-center gap-1.5 shrink-0 w-16 py-2.5 rounded-2xl border-2 transition-all active:scale-95',
                                    assignee === '' ? 'border-agro-green bg-agro-green/10' : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-neutral-900')}>
                                <div className={clsx('w-11 h-11 rounded-full flex items-center justify-center', assignee === '' ? 'bg-agro-green/20' : 'bg-gray-200 dark:bg-neutral-700')}>
                                    <User size={20} className={assignee === '' ? 'text-agro-green' : 'text-gray-400'} />
                                </div>
                                <span className={clsx('text-[10px] font-bold', assignee === '' ? 'text-agro-green' : 'text-gray-500 dark:text-gray-400')}>Nenhum</span>
                            </button>
                            {users.map(u => (
                                <button key={u.id} type="button" onClick={() => setAssignee(u.id)}
                                    className={clsx('flex flex-col items-center gap-1.5 shrink-0 w-16 py-2.5 rounded-2xl border-2 transition-all active:scale-95',
                                        assignee === u.id ? 'border-agro-green bg-agro-green/10' : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-neutral-900')}>
                                    <div className={clsx('w-11 h-11 rounded-full flex items-center justify-center relative', assignee === u.id ? 'bg-agro-green shadow-md shadow-agro-green/30' : 'bg-agro-green/20')}>
                                        <span className={clsx('text-lg font-black', assignee === u.id ? 'text-white' : 'text-agro-green')}>{u.name.charAt(0)}</span>
                                        {assignee === u.id && (
                                            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white dark:bg-neutral-950 border-2 border-agro-green flex items-center justify-center">
                                                <span className="text-[8px] font-black text-agro-green">✓</span>
                                            </span>
                                        )}
                                    </div>
                                    <span className={clsx('text-[10px] font-bold truncate w-full text-center px-0.5', assignee === u.id ? 'text-agro-green' : 'text-gray-500 dark:text-gray-400')}>{u.name.split(' ')[0]}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-2" />
                </div>

                <div className="px-4 pt-3 border-t border-gray-100 dark:border-white/5 shrink-0 bg-white dark:bg-neutral-950"
                    style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
                    <button onClick={handleSubmit} disabled={!title.trim() || loading}
                        className="w-full py-4 bg-agro-green text-white rounded-2xl font-black text-base active:scale-[0.98] transition-transform disabled:opacity-40 flex items-center justify-center gap-2 shadow-xl shadow-agro-green/20">
                        {loading ? <><Loader2 size={18} className="animate-spin" /> A criar...</> : <><Plus size={18} /> Criar Evento</>}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ─── Main Calendar Modal ──────────────────────────────────────────────────────

const CalendarModal: React.FC<CalendarModalProps> = ({
    isOpen, onClose, tasks, fields, animals, users, currentUser,
    onNavigate, onAddTask, onDeleteTask,
}) => {
    const today = new Date();
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    // 'none' = inline empty-state panel, 'events' = DayEventsSheet, 'add' = AddEventSheet
    const [sheetMode, setSheetMode] = useState<'none' | 'events' | 'add'>('none');

    const allEvents = useMemo(() => {
        const evts: CalendarEvent[] = [];
        tasks.forEach(t => {
            if (!t.date) return;
            evts.push({ id: t.id, date: t.date, title: t.title, type: t.type === 'harvest' ? 'harvest' : 'task', completed: t.completed, isAnimalEvent: false });
        });
        animals.forEach(a => {
            (a.medicalHistory || []).forEach(r => {
                if (!r.date) return;
                evts.push({ id: `${a.id}-${r.id}`, date: r.date, title: a.name || a.tagId, type: r.type === 'vaccine' ? 'vaccine' : 'treatment', isAnimalEvent: true });
            });
        });
        return evts;
    }, [tasks, animals]);

    const eventsByDate = useMemo(() => {
        const map: Record<string, CalendarEvent[]> = {};
        allEvents.forEach(e => { if (!map[e.date]) map[e.date] = []; map[e.date].push(e); });
        return map;
    }, [allEvents]);

    const calendarDays = useMemo(() => {
        const firstDay = new Date(viewYear, viewMonth, 1).getDay();
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();
        const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];
        for (let i = firstDay - 1; i >= 0; i--) days.push({ date: new Date(viewYear, viewMonth - 1, daysInPrev - i), isCurrentMonth: false });
        for (let d = 1; d <= daysInMonth; d++) days.push({ date: new Date(viewYear, viewMonth, d), isCurrentMonth: true });
        const rem = 42 - days.length;
        for (let d = 1; d <= rem; d++) days.push({ date: new Date(viewYear, viewMonth + 1, d), isCurrentMonth: false });
        return days;
    }, [viewYear, viewMonth]);

    const fmt = (d: Date) => d.toISOString().split('T')[0];
    const prevMonth = () => { setSelectedDate(null); setSheetMode('none'); viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1); };
    const nextMonth = () => { setSelectedDate(null); setSheetMode('none'); viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1); };

    const handleDay = (ds: string) => {
        const hasEvents = (eventsByDate[ds] || []).length > 0;
        if (selectedDate === ds) {
            // second tap → deselect
            setSelectedDate(null);
            setSheetMode('none');
        } else {
            setSelectedDate(ds);
            // Open DayEventsSheet when day has events; otherwise show inline empty-state
            setSheetMode(hasEvents ? 'events' : 'none');
        }
    };

    const handleConfirmAdd = (title: string, type: 'task' | 'harvest', assigneeId: string) => {
        onAddTask(title, type, selectedDate || undefined, undefined, undefined, undefined, assigneeId || undefined);
        // After adding, go back to events sheet (the new event will appear there)
        setSheetMode('events');
    };

    const closeSheets = () => { setSheetMode('none'); setSelectedDate(null); };

    if (!isOpen) return null;

    const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];

    return (
        <>
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white dark:bg-neutral-950 w-full md:max-w-lg rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl border-t md:border border-white/10 flex flex-col overflow-hidden"
                        style={{ maxHeight: '92dvh' }}
                    >
                        {/* Handle */}
                        <div className="w-14 h-1.5 bg-gray-300 dark:bg-neutral-700 rounded-full mx-auto mt-3 shrink-0" />

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-white/5 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-agro-green/10 rounded-2xl">
                                    <Calendar size={20} className="text-agro-green" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 dark:text-white leading-none">Calendário</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{allEvents.length} eventos</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-10 h-10 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center active:scale-90 transition-transform">
                                <X size={18} className="text-gray-600 dark:text-white" />
                            </button>
                        </div>

                        {/* Month nav */}
                        <div className="flex items-center justify-between px-5 py-2.5 shrink-0">
                            <button onClick={prevMonth} className="w-11 h-11 rounded-2xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center active:scale-90 transition-transform"><ChevronLeft size={20} /></button>
                            <span className="text-base font-black text-gray-900 dark:text-white">{MONTHS[viewMonth]} <span className="text-agro-green">{viewYear}</span></span>
                            <button onClick={nextMonth} className="w-11 h-11 rounded-2xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center active:scale-90 transition-transform"><ChevronRight size={20} /></button>
                        </div>

                        {/* Weekday labels */}
                        <div className="grid grid-cols-7 px-2 shrink-0">
                            {WEEKDAYS.map((d, i) => (
                                <div key={i} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-wider py-1">{d}</div>
                            ))}
                        </div>

                        {/* Day grid */}
                        <div className="grid grid-cols-7 px-2 shrink-0">
                            {calendarDays.map((day, idx) => {
                                const ds = fmt(day.date);
                                const evts = eventsByDate[ds] || [];
                                const isToday = ds === fmt(today);
                                const isSel = selectedDate === ds;
                                return (
                                    <button key={idx} onClick={() => handleDay(ds)}
                                        className={clsx('flex flex-col items-center justify-center py-2 rounded-2xl transition-all active:scale-90 min-h-[52px]',
                                            !day.isCurrentMonth && 'opacity-20',
                                            isSel && 'bg-agro-green/10 ring-2 ring-agro-green ring-inset',
                                            !isSel && 'active:bg-gray-100 dark:active:bg-white/5')}>
                                        <span className={clsx('w-9 h-9 flex items-center justify-center rounded-full text-[15px] font-black',
                                            isToday && !isSel && 'bg-agro-green text-white shadow-lg shadow-agro-green/30',
                                            isToday && isSel && 'bg-agro-green text-white',
                                            !isToday && isSel && 'text-agro-green',
                                            !isToday && !isSel && 'text-gray-900 dark:text-white')}>
                                            {day.date.getDate()}
                                        </span>
                                        {evts.length > 0 && (
                                            <div className="flex gap-[3px] mt-1">
                                                {evts.slice(0, 3).map((e, i) => <span key={i} className={clsx('w-1.5 h-1.5 rounded-full', EVENT_STYLES[e.type]?.dot || 'bg-gray-400')} />)}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-3 px-4 py-2 border-t border-gray-100 dark:border-white/5 shrink-0 flex-wrap">
                            {Object.entries(EVENT_STYLES).map(([type, style]) => (
                                <div key={type} className="flex items-center gap-1">
                                    <span className={clsx('w-2 h-2 rounded-full shrink-0', style.dot)} />
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wide">{style.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* ── Inline empty-state panel (only when day has NO events) ── */}
                        <AnimatePresence>
                            {selectedDate && sheetMode === 'none' && (
                                <motion.div
                                    key="inline-panel"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                                    className="border-t border-gray-100 dark:border-white/5 overflow-hidden"
                                >
                                    <div className="flex items-center justify-between px-4 py-4">
                                        <p className="text-sm font-black text-gray-900 dark:text-white capitalize">
                                            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </p>
                                        {currentUser.role === 'admin' && (
                                            <button
                                                onClick={() => setSheetMode('add')}
                                                className="flex items-center gap-1.5 pl-3 pr-4 h-10 bg-agro-green text-white rounded-2xl text-[12px] font-black active:scale-95 transition-transform shadow-lg shadow-agro-green/25"
                                            >
                                                <Plus size={14} /> Adicionar
                                            </button>
                                        )}
                                    </div>
                                    <div className="text-center pb-6 text-gray-400">
                                        <Calendar size={26} className="mx-auto mb-2 opacity-30" />
                                        <p className="text-sm font-bold">Nenhum evento neste dia</p>
                                        {currentUser.role === 'admin' && <p className="text-xs mt-0.5">Toca "Adicionar" para criar</p>}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Footer */}
                        <div className="px-4 pt-3 border-t border-gray-100 dark:border-white/5 shrink-0"
                            style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
                            <button onClick={() => { onNavigate('tasks'); onClose(); }}
                                className="w-full py-4 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:bg-gray-200 dark:active:bg-neutral-700 transition-colors active:scale-[0.98]">
                                <CheckSquare size={17} className="text-agro-green" />
                                Gerir Todas as Tarefas
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            </AnimatePresence>

            {/* ── Day Events Sheet (when day has events) ── */}
            <AnimatePresence>
                {sheetMode === 'events' && selectedDate && (
                    <DayEventsSheet
                        key="day-events"
                        date={selectedDate}
                        events={selectedEvents}
                        currentUser={currentUser}
                        onClose={closeSheets}
                        onAddEvent={() => setSheetMode('add')}
                        onDeleteEvent={id => { onDeleteTask(id); }}
                    />
                )}
            </AnimatePresence>

            {/* ── Add Event Sheet ── */}
            <AnimatePresence>
                {sheetMode === 'add' && selectedDate && (
                    <AddEventSheet
                        key="add-event"
                        date={selectedDate}
                        users={users}
                        onConfirm={handleConfirmAdd}
                        onCancel={() => setSheetMode(selectedEvents.length > 0 ? 'events' : 'none')}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default CalendarModal;
