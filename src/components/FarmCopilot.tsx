import React, { useMemo, useEffect, useRef } from 'react';
import {
    Sparkles, ShieldAlert, CloudRain, Wind,
    Thermometer, CheckCircle, TrendingUp, ChevronRight, Activity, Tractor, Droplets, Sun
} from 'lucide-react';
import { WeatherForecast, DetailedForecast, Task, UserProfile, Machine, Field } from '../types';

interface FarmCopilotProps {
    userName: string;
    weather: WeatherForecast[];
    hourlyForecast: DetailedForecast[];
    tasks: Task[];
    users: UserProfile[];
    machines: Machine[];
    fields: Field[];
    alertCount: number;
    onNavigate: (tab: string) => void;
    onOpenWeather: () => void;
    onOpenBriefing: () => void;
}

interface Insight {
    id: string;
    type: 'urgent' | 'warning' | 'suggestion' | 'success';
    title: string;
    description: string;
    icon: React.ReactNode;
    actionLabel?: string;
    action?: () => void;
}

const FarmCopilot: React.FC<FarmCopilotProps> = ({
    userName,
    weather,
    hourlyForecast,
    tasks,
    users,
    machines,
    fields,
    alertCount,
    onNavigate,
    onOpenWeather,
    onOpenBriefing
}) => {

    const insights = useMemo(() => {
        const generatedInsights: Insight[] = [];

        // 0. MORNING BRIEFING (Highest Priority Greeting)
        const hour = new Date().getHours();
        let greeting = 'Bom dia';
        if (hour >= 13 && hour < 20) greeting = 'Boa tarde';
        if (hour >= 20 || hour < 6) greeting = 'Boa noite';

        generatedInsights.push({
            id: 'briefing-greeting',
            type: 'suggestion',
            title: `${greeting}, ${userName.split(' ')[0]}!`,
            description: 'Aqui está o resumo proativo para a tua exploração hoje.',
            icon: <Sun size={20} className="text-yellow-500" />,
            actionLabel: 'Ver Resumo',
            action: onOpenBriefing
        });

        // 1. Safety Alerts (Urgent)
        const emergencyUsers = users.filter(u => u.safetyStatus?.status === 'emergency');
        if (emergencyUsers.length > 0) {
            generatedInsights.push({
                id: 'safety-urgent',
                type: 'urgent',
                title: 'Emergência de Segurança',
                description: `O trabalhador ${emergencyUsers[0].name} acionou SOS ou queda detetada.`,
                icon: <ShieldAlert size={20} className="text-red-500" />,
                actionLabel: 'Ver Mapa',
                action: () => onNavigate('team')
            });
        }

        // 2. Proactive Maintenance (Machine Data)
        machines.forEach(m => {
            const hoursUntilService = (m.lastServiceHours + m.serviceInterval) - m.engineHours;
            if (hoursUntilService <= 10 && hoursUntilService > 0) {
                generatedInsights.push({
                    id: `maintenance-${m.id}`,
                    type: 'urgent',
                    title: 'Manutenção Iminente',
                    description: `O trator ${m.name} está a ${Math.round(hoursUntilService)}h da revisão agendada.`,
                    icon: <Tractor size={20} className="text-rose-500" />,
                    actionLabel: 'Agendar',
                    action: () => onNavigate('machines')
                });
            }
        });

        // 3. Soil Stress Analysis (Field Sensors)
        fields.forEach(f => {
            if (f.humidity < 15) {
                generatedInsights.push({
                    id: `soil-stress-${f.id}`,
                    type: 'warning',
                    title: 'Stress Hídrico Crítico',
                    description: `A parcela ${f.name} atingiu 15% de humidade. Recomenda-se rega urgente.`,
                    icon: <Droplets size={20} className="text-blue-500" />,
                    actionLabel: 'Ligar Rega',
                    action: () => onNavigate('dashboard') // Or specific field view
                });
            }
        });

        // 4. Weather & Spraying Conditions
        const nextFewHours = hourlyForecast.slice(0, 6);
        const rainingSoon = nextFewHours.some(h => h.rainProb > 40);
        const highWindSoon = nextFewHours.some(h => h.windSpeed > 15);

        if (rainingSoon) {
            generatedInsights.push({
                id: 'weather-rain',
                type: 'warning',
                title: 'Aviso de Chuva',
                description: 'Probabilidade de chuva nas próximas horas. Suspenda pulverizações.',
                icon: <CloudRain size={20} className="text-blue-500" />,
                actionLabel: 'Previsão',
                action: onOpenWeather
            });
        } else if (highWindSoon) {
            generatedInsights.push({
                id: 'weather-wind',
                type: 'warning',
                title: 'Vento Forte Previsto',
                description: 'Vento acima de 15km/h nas próximas horas. Risco de deriva.',
                icon: <Wind size={20} className="text-teal-500" />,
                actionLabel: 'Previsão',
                action: onOpenWeather
            });
        }

        // 5. Task Management
        const pendingTasks = tasks.filter(t => !t.completed);
        if (pendingTasks.length > 0) {
            generatedInsights.push({
                id: 'tasks-pending',
                type: 'suggestion',
                title: `${pendingTasks.length} tarefas pendentes`,
                description: 'Mantenha a equipa sincronizada e acompanhe os trabalhos de hoje.',
                icon: <CheckCircle size={20} className="text-indigo-500" />,
                actionLabel: 'Ver Todas',
                action: () => onNavigate('tasks')
            });
        }

        // Sort: urgent first, then warnings, then others. Greeting stays first.
        return generatedInsights.sort((a, b) => {
            if (a.id === 'briefing-greeting') return -1;
            if (b.id === 'briefing-greeting') return 1;
            const priority = { urgent: 0, warning: 1, suggestion: 2, success: 3 };
            return priority[a.type] - priority[b.type];
        });
    }, [userName, hourlyForecast, alertCount, tasks, users, machines, fields, onNavigate, onOpenWeather]);

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            if (scrollRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

                // Se o scroll chegar ao fim (com uma pequena margem de 10px para evitar erros de floating point)
                if (scrollLeft + clientWidth >= scrollWidth - 10) {
                    scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    // Desliza a largura aproximada de um cartão, baseada no tamanho do ecrã
                    const scrollAmount = window.innerWidth < 640 ? window.innerWidth * 0.85 : 320;
                    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                }
            }
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="px-2 mb-6 animate-fade-in-up">
            <div className="flex items-center gap-2 px-1 mb-2.5">
                <Sparkles size={14} className="text-indigo-400 animate-pulse" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Farm Copilot</h3>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-indigo-500/20 to-transparent ml-2"></div>
            </div>

            <div ref={scrollRef} className="flex overflow-x-auto gap-3 pb-2 px-1 custom-scrollbar snap-x scroll-smooth">
                {insights.map((insight) => (
                    <div
                        key={insight.id}
                        className="group relative min-w-[280px] sm:min-w-[320px] rounded-2xl p-[1px] snap-center overflow-hidden transition-all hover:scale-[1.02] cursor-pointer"
                        onClick={insight.action}
                    >
                        {/* Animated Border Gradient */}
                        <div className={`absolute inset-0 opacity-40 group-hover:opacity-100 transition-opacity duration-500 ${insight.type === 'urgent' ? 'bg-gradient-to-r from-red-500 via-rose-500 to-red-500' :
                            insight.type === 'warning' ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400' :
                                insight.type === 'success' ? 'bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-400' :
                                    'bg-gradient-to-r from-indigo-400 via-purple-500 to-indigo-400'
                            }`}></div>

                        {/* Inner Content (Glass) */}
                        <div className={`relative h-full flex gap-3 p-3 rounded-2xl backdrop-blur-xl ${insight.type === 'urgent' ? 'bg-white/90 dark:bg-[#1A0B0B]/90' :
                            insight.type === 'warning' ? 'bg-white/90 dark:bg-[#1A140B]/90' :
                                insight.type === 'success' ? 'bg-white/90 dark:bg-[#0B1A12]/90' :
                                    'bg-white/90 dark:bg-[#0B0D1A]/90'
                            }`}>

                            {/* Floating Icon */}
                            <div className="shrink-0 flex items-center justify-center relative">
                                <div className={`absolute inset-0 blur-md opacity-50 ${insight.type === 'urgent' ? 'bg-red-500' :
                                    insight.type === 'warning' ? 'bg-amber-500' :
                                        insight.type === 'success' ? 'bg-emerald-500' :
                                            'bg-indigo-500'
                                    }`}></div>
                                <div className="relative w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 dark:bg-white/5 border border-white/20">
                                    {React.cloneElement(insight.icon as any, { size: 16 })}
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col justify-center min-w-0 pr-2">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                    <h4 className={`text-xs font-black truncate tracking-wide ${insight.type === 'urgent' ? 'text-red-600 dark:text-red-400' :
                                        insight.type === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                                            insight.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' :
                                                'text-indigo-600 dark:text-indigo-400'
                                        }`}>
                                        {insight.title}
                                    </h4>
                                    {insight.actionLabel && (
                                        <ChevronRight size={14} className="text-gray-400 shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                    )}
                                </div>
                                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 truncate">
                                    {insight.description}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FarmCopilot;
