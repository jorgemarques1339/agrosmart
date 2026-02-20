import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, PawPrint, Tractor, CheckCircle, ChevronRight, X, Sparkles } from 'lucide-react';
import { Field, Animal, Machine, Task } from '../types';

interface OmniSearchProps {
    isOpen: boolean;
    onClose: () => void;
    fields: Field[];
    animals: Animal[];
    machines: Machine[];
    tasks: Task[];
    onNavigate: (tab: string, itemId?: string) => void;
}

interface SearchResult {
    id: string;
    type: 'field' | 'animal' | 'machine' | 'task';
    title: string;
    subtitle: string;
    icon: React.ElementType;
    tab: string;
    colorClass: string;
}

const OmniSearch: React.FC<OmniSearchProps> = ({
    isOpen,
    onClose,
    fields,
    animals,
    machines,
    tasks,
    onNavigate
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    // Handle global keyboard shortcuts (Ctrl+K or Cmd+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Search Logic
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const searchTerm = query.toLowerCase();
        const newResults: SearchResult[] = [];

        // Search Fields
        fields.forEach(f => {
            if (f.name.toLowerCase().includes(searchTerm) || f.crop.toLowerCase().includes(searchTerm)) {
                newResults.push({
                    id: f.id,
                    type: 'field',
                    title: f.name,
                    subtitle: `Campo • ${f.crop} • ${f.areaHa} ha`,
                    icon: MapPin,
                    tab: 'cultivation',
                    colorClass: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30'
                });
            }
        });

        // Search Animals
        animals.forEach(a => {
            if (
                (a.tagId && a.tagId.toLowerCase().includes(searchTerm)) ||
                (a.name && a.name.toLowerCase().includes(searchTerm)) ||
                a.breed.toLowerCase().includes(searchTerm)
            ) {
                newResults.push({
                    id: a.id,
                    type: 'animal',
                    title: a.tagId ? `Brinco ${a.tagId}` : (a.name || 'Animal sem identificação'),
                    subtitle: `Pecuária • ${a.breed} • ${(a as any).purpose === 'milk' ? 'Leite' : 'Carne'}`,
                    icon: PawPrint,
                    tab: 'animal',
                    colorClass: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30'
                });
            }
        });

        // Search Machines
        machines.forEach(m => {
            if (m.name.toLowerCase().includes(searchTerm) || m.plate.toLowerCase().includes(searchTerm)) {
                newResults.push({
                    id: m.id,
                    type: 'machine',
                    title: m.name,
                    subtitle: `Frota • Matrícula: ${m.plate}`,
                    icon: Tractor,
                    tab: 'machines',
                    colorClass: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
                });
            }
        });

        // Search Tasks
        tasks.forEach(t => {
            if (t.title.toLowerCase().includes(searchTerm)) {
                newResults.push({
                    id: t.id,
                    type: 'task',
                    title: t.title,
                    subtitle: `Tarefa • ${t.date} • ${t.completed ? 'Concluída' : 'Pendente'}`,
                    icon: CheckCircle,
                    tab: 'dashboard',
                    colorClass: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30'
                });
            }
        });

        // Sort to prioritize exact matches or specific types if needed
        setResults(newResults.slice(0, 15)); // Limit to 15 results
    }, [query, fields, animals, machines, tasks]);

    const handleSelect = (result: SearchResult) => {
        onNavigate(result.tab, result.id);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[500] flex items-start justify-center pt-8 sm:pt-20 px-4 bg-gray-50/80 dark:bg-neutral-900/80 backdrop-blur-xl animate-fade-in" onClick={onClose}>

            {/* Search Container */}
            <div
                className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-neutral-800 animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Input Header */}
                <div className="flex items-center p-4 border-b border-gray-100 dark:border-neutral-800">
                    <Search size={24} className="text-gray-400 ml-2" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Pesquisar animais, parcelas, máquinas..."
                        className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-lg font-bold text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600"
                    />
                    {query && (
                        <button
                            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}
                    <div className="hidden sm:flex items-center gap-1 ml-4 px-2 py-1 rounded-lg bg-gray-100 dark:bg-neutral-800">
                        <span className="text-[10px] font-bold text-gray-400">ESC</span>
                    </div>
                </div>

                {/* Results Area */}
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">

                    {!query.trim() && (
                        <div className="p-8 text-center text-gray-400">
                            <Search size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="font-bold text-sm">O que procura hoje?</p>
                            <p className="text-xs mt-1 opacity-70">Encontre qualquer registo rapidamente: brinco, campo ou matrícula.</p>
                        </div>
                    )}

                    {query.trim() && results.length === 0 && (
                        <div className="p-8 text-center text-gray-400">
                            <p className="font-bold text-sm">Nenhum resultado encontrado para "{query}"</p>
                            <p className="text-xs mt-1 opacity-70">Tente usar outros termos de pesquisa.</p>
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="space-y-1">
                            {results.map((result) => (
                                <button
                                    key={result.id}
                                    onClick={() => handleSelect(result)}
                                    className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors group text-left focus:outline-none focus:bg-gray-50 dark:focus:bg-neutral-800"
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${result.colorClass}`}>
                                        <result.icon size={20} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-gray-900 dark:text-white truncate text-base leading-tight">
                                            {result.title}
                                        </h4>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest truncate block mt-0.5">
                                            {result.subtitle}
                                        </span>
                                    </div>

                                    <ChevronRight size={20} className="text-gray-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-gray-50 dark:bg-neutral-800/50 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between text-[10px] font-bold text-gray-400">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1"><kbd className="bg-white dark:bg-neutral-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-neutral-600">↑↓</kbd> Navegar</span>
                        <span className="flex items-center gap-1"><kbd className="bg-white dark:bg-neutral-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-neutral-600">↵</kbd> Selecionar</span>
                    </div>
                    <span className="flex items-center gap-1 text-indigo-500">
                        <Sparkles size={12} /> Omni-Search IA
                    </span>
                </div>
            </div>
        </div>
    );
};

export default OmniSearch;
