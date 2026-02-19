
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Play, Pause, RotateCcw, MapPin, Battery,
    Navigation, Signal, ShieldAlert, Cpu,
    MousePointer2, Trash2, CheckCircle2, AlertTriangle, Cloud
} from 'lucide-react';
import { MapContainer, TileLayer, Polygon, Polyline, Marker, useMapEvents, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Field, Mission } from '../types';
import { haptics } from '../utils/haptics';

// --- HELPERS ---

// Ray-casting algorithm to check if a point is inside a polygon
function isPointInPolygon(point: [number, number], vs: [number, number][]) {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0], yi = vs[i][1];
        const xj = vs[j][0], yj = vs[j][1];
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

interface MissionControlProps {
    field: Field;
    onMissionUpdate?: (fieldId: string, missions: Mission[]) => void;
}

const RouteLayer = ({ waypoints, setWaypoints, isDrawing }: { waypoints: [number, number][], setWaypoints: any, isDrawing: boolean }) => {
    useMapEvents({
        click(e) {
            if (!isDrawing) return;
            const { lat, lng } = e.latlng;
            setWaypoints([...waypoints, [lat, lng]] as [number, number][]);
            haptics.light();
        },
    });

    return (
        <>
            <Polyline positions={waypoints} pathOptions={{ color: '#8b5cf6', weight: 4, dashArray: '10, 10' }} />
            {waypoints.map((wp, i) => (
                <Marker key={i} position={wp} eventHandlers={{ click: (e) => (e as any).originalEvent.stopPropagation() }} />
            ))}
        </>
    );
};

const MapCenterer = ({ coords }: { coords: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(coords, map.getZoom());
    }, [coords, map]);
    return null;
};

const FLEET = [
    { id: 'd1', name: 'Drone Alpha-1', type: 'drone' as const, icon: <Cloud size={16} />, batteryDrain: 0.2 },
    { id: 'd2', name: 'AgroBot X-5', type: 'autonomous_tractor' as const, icon: <Cpu size={16} />, batteryDrain: 0.1 },
    { id: 'd3', name: 'Drone Bravo-2', type: 'drone' as const, icon: <Cloud size={16} />, batteryDrain: 0.25 },
];

const MissionControl: React.FC<MissionControlProps> = ({ field, onMissionUpdate }) => {
    const [selectedVehicleId, setSelectedVehicleId] = useState(FLEET[0].id);
    const [isFleetExpanded, setIsFleetExpanded] = useState(false);
    const [waypoints, setWaypoints] = useState<[number, number][]>([]);
    const [isSimulationActive, setIsSimulationActive] = useState(false);
    const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
    const [progress, setProgress] = useState(0);
    const [battery, setBattery] = useState(100);
    const [isDrawing, setIsDrawing] = useState(true);
    const [isGeofenceViolated, setIsGeofenceViolated] = useState(false);

    const selectedVehicle = FLEET.find(v => v.id === selectedVehicleId) || FLEET[0];

    const simTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Simulation Logic
    useEffect(() => {
        if (isSimulationActive && waypoints.length >= 2) {
            simTimerRef.current = setInterval(() => {
                setProgress(prev => {
                    const next = prev + 1;
                    if (next >= 100) {
                        setIsSimulationActive(false);
                        haptics.success();
                        return 100;
                    }

                    // Calculate current position along the path
                    const totalPoints = waypoints.length;
                    const segmentIndex = Math.floor((next / 100) * (totalPoints - 1));
                    const t = ((next / 100) * (totalPoints - 1)) - segmentIndex;

                    const p1 = waypoints[segmentIndex];
                    const p2 = waypoints[segmentIndex + 1];

                    if (p1 && p2) {
                        const lat = p1[0] + (p2[0] - p1[0]) * t;
                        const lng = p1[1] + (p2[1] - p1[1]) * t;
                        const newPos: [number, number] = [lat, lng];
                        setCurrentPos(newPos);

                        // Geofencing Check
                        const isInside = isPointInPolygon(newPos, field.polygon);
                        if (!isInside && !isGeofenceViolated) {
                            setIsGeofenceViolated(true);
                            haptics.warning();
                        } else if (isInside && isGeofenceViolated) {
                            setIsGeofenceViolated(false);
                        }
                    }

                    setBattery(b => Math.max(0, b - selectedVehicle.batteryDrain));
                    return next;
                });
            }, 200);
        } else {
            if (simTimerRef.current) clearInterval(simTimerRef.current);
        }

        return () => {
            if (simTimerRef.current) clearInterval(simTimerRef.current);
        };
    }, [isSimulationActive, waypoints, field.polygon, isGeofenceViolated, selectedVehicle.batteryDrain]);

    const handleToggleSim = () => {
        if (waypoints.length < 2) {
            alert("Desenhe pelo menos 2 pontos no mapa para iniciar a missão.");
            return;
        }
        haptics.medium();
        setIsSimulationActive(!isSimulationActive);
        setIsDrawing(false);
    };

    const handleReset = () => {
        haptics.light();
        setIsSimulationActive(false);
        setProgress(0);
        setBattery(100);
        setCurrentPos(null);
        setIsGeofenceViolated(false);
        setIsDrawing(true);
    };

    const handleClearRoute = () => {
        haptics.medium();
        handleReset();
        setWaypoints([]);
    };

    const handleVehicleSelect = (id: string) => {
        if (isSimulationActive) return;
        setSelectedVehicleId(id);
        setIsFleetExpanded(false);
        handleReset();
    };

    const FleetSelector = ({ isCompact = false }) => (
        <div className={clsx(
            "bg-white dark:bg-neutral-900 border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden transition-all",
            isCompact ? "rounded-2xl" : "rounded-3xl"
        )}>
            <button
                onClick={() => !isSimulationActive && setIsFleetExpanded(!isFleetExpanded)}
                disabled={isSimulationActive}
                className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-agro-green flex items-center justify-center text-white shadow-lg shadow-agro-green/20">
                        {selectedVehicle.icon}
                    </div>
                    <div className="text-left">
                        <h3 className="text-[7px] md:text-[8px] font-black uppercase text-gray-400 tracking-[0.2em]">Frota Activa</h3>
                        <p className="text-xs md:text-sm font-black text-gray-900 dark:text-white uppercase truncate max-w-[120px] md:max-w-none">{selectedVehicle.name}</p>
                    </div>
                </div>
                <div className={clsx("transition-transform duration-300", isFleetExpanded ? "rotate-180" : "")}>
                    <RotateCcw size={16} className="text-gray-400" />
                </div>
            </button>

            <AnimatePresence>
                {isFleetExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-50 dark:border-white/5 max-h-[300px] overflow-y-auto no-scrollbar"
                    >
                        <div className="p-2 md:p-3 grid grid-cols-1 gap-2 pb-4">
                            {FLEET.map(v => (
                                <button
                                    key={v.id}
                                    onClick={() => handleVehicleSelect(v.id)}
                                    className={clsx(
                                        "relative flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-300 group overflow-hidden",
                                        selectedVehicleId === v.id
                                            ? "border-agro-green bg-agro-green/10 ring-1 ring-agro-green"
                                            : "border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 hover:border-gray-200 dark:hover:border-white/10"
                                    )}
                                >
                                    <div className={clsx(
                                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                                        selectedVehicleId === v.id ? "bg-agro-green text-white" : "bg-white dark:bg-neutral-800 text-gray-400"
                                    )}>
                                        {v.icon}
                                    </div>

                                    <div className="text-left flex-1 min-w-0">
                                        <p className={clsx(
                                            "text-[10px] font-black leading-tight uppercase tracking-tight truncate",
                                            selectedVehicleId === v.id ? "text-agro-green" : "text-gray-900 dark:text-white"
                                        )}>
                                            {v.name}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    const ActionBar = () => (
        <div className="bg-white dark:bg-neutral-900 p-3 md:p-4 rounded-[1.8rem] border border-gray-100 dark:border-white/5 shadow-xl flex items-center gap-3">
            <button
                onClick={handleToggleSim}
                disabled={waypoints.length < 2 || battery < 5}
                className={clsx(
                    "flex-1 h-12 md:h-14 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 disabled:opacity-50 text-xs md:text-sm",
                    isSimulationActive
                        ? "bg-amber-500 text-white shadow-amber-500/50"
                        : "bg-agro-green text-white shadow-agro-green/50"
                )}
            >
                {isSimulationActive ? <><Pause size={18} fill="currentColor" /> Pausar</> : <><Play size={18} fill="currentColor" /> Iniciar Missão</>}
            </button>

            <div className="flex gap-2">
                <button
                    onClick={handleReset}
                    className="w-10 h-10 md:w-12 md:h-14 rounded-xl md:rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-500 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 transition-colors border border-transparent"
                    title="Reset"
                >
                    <RotateCcw size={18} />
                </button>
                <button
                    onClick={handleClearRoute}
                    className="w-10 h-10 md:w-12 md:h-14 rounded-xl md:rounded-2xl bg-red-50 dark:bg-red-900/10 text-red-500 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors border border-transparent"
                    title="Clear"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_300px] gap-4 h-full">
            {/* LATER COLUMN: MAP + HUD */}
            <div className="flex flex-col gap-3 min-w-0">
                <div className="lg:hidden">
                    <FleetSelector isCompact />
                </div>

                {/* 2. COMPACT HUD */}
                <div className="flex gap-2">
                    <div className="flex-1 bg-white dark:bg-neutral-900 px-3 py-2 rounded-[1.2rem] border border-gray-100 dark:border-white/5 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Battery size={14} className={clsx(battery < 20 ? "text-red-500 animate-pulse" : "text-emerald-500")} />
                            <span className="hidden md:block text-[8px] font-black uppercase text-gray-400">Bateria</span>
                        </div>
                        <span className="text-xs font-black text-gray-900 dark:text-white">{Math.floor(battery)}%</span>
                    </div>

                    <div className="flex-1 bg-white dark:bg-neutral-900 px-3 py-2 rounded-[1.2rem] border border-gray-100 dark:border-white/5 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Navigation size={14} className="text-blue-500" />
                            <span className="hidden md:block text-[8px] font-black uppercase text-gray-400">Progresso</span>
                        </div>
                        <span className="text-xs font-black text-gray-900 dark:text-white">{Math.floor(progress)}%</span>
                    </div>

                    <div className={clsx(
                        "flex-1 px-3 py-2 rounded-[1.2rem] border shadow-sm flex items-center justify-between transition-all",
                        isGeofenceViolated ? "bg-red-500 text-white border-transparent" : "bg-white dark:bg-neutral-900 border-gray-100 dark:border-white/5"
                    )}>
                        <div className="flex items-center gap-2">
                            <ShieldAlert size={14} className={isGeofenceViolated ? "text-white animate-pulse" : "text-gray-400"} />
                            <span className={clsx("hidden md:block text-[8px] font-black uppercase", isGeofenceViolated ? "text-white/80" : "text-gray-400")}>Auto-Piloto</span>
                        </div>
                        <span className="text-[10px] font-black uppercase">{isGeofenceViolated ? 'Alerta' : 'OK'}</span>
                    </div>
                </div>

                {/* 3. MAP PANEL */}
                <div className="flex-1 min-h-[300px] lg:min-h-0 rounded-[2rem] overflow-hidden border border-white/20 dark:border-white/5 shadow-2xl relative group">
                    <MapContainer
                        center={field.coordinates}
                        zoom={18}
                        style={{ height: '100%', width: '100%' }}
                        className="z-10"
                    >
                        <TileLayer
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            crossOrigin="anonymous"
                        />
                        <Polygon positions={field.polygon} pathOptions={{ color: '#4ade80', fillColor: '#4ade80', fillOpacity: 0.2, weight: 2 }} />
                        <RouteLayer waypoints={waypoints} setWaypoints={setWaypoints} isDrawing={isDrawing} />

                        {currentPos && (
                            <>
                                <Marker position={currentPos} icon={(window as any).L ? (window as any).L.divIcon({
                                    className: clsx(
                                        'bg-white rounded-full border-4 shadow-xl w-6 h-6',
                                        selectedVehicle.type === 'drone' ? 'border-blue-500' : 'border-amber-600'
                                    ),
                                    html: `<div class="absolute inset-0 animate-ping ${selectedVehicle.type === 'drone' ? 'bg-blue-400/50' : 'bg-amber-400/50'} rounded-full"></div>`
                                }) : undefined} />
                                <MapCenterer coords={currentPos} />
                            </>
                        )}
                    </MapContainer>

                    {/* Map Controls Prompt */}
                    <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 text-white flex items-center gap-2">
                            <div className={clsx("w-1.5 h-1.5 rounded-full", isDrawing ? "bg-blue-500 animate-pulse" : "bg-gray-500")} />
                            <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                                {isDrawing ? 'Desenho Ativo' : 'Simulação'}
                            </span>
                        </div>
                    </div>

                    <AnimatePresence>
                        {isGeofenceViolated && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-[19] bg-red-600/20 pointer-events-none animate-pulse"
                            />
                        )}
                    </AnimatePresence>
                </div>

                <div className="lg:hidden">
                    <ActionBar />
                </div>
            </div>

            {/* RIGHT COLUMN: DESKTOP CONTROLS */}
            <aside className="hidden lg:flex flex-col gap-4">
                <FleetSelector />

                <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm flex-1 flex flex-col">
                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">Command Engine</h3>

                    <div className="flex-1 space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-gray-400 uppercase">Status</span>
                                <span className={clsx("font-black uppercase", isSimulationActive ? "text-amber-500" : "text-agro-green")}>
                                    {isSimulationActive ? 'Execução' : 'Pronto'}
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-agro-green"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Coordenadas</p>
                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 font-mono text-[10px] text-gray-500">
                                {currentPos ? `${currentPos[0].toFixed(5)}, ${currentPos[1].toFixed(5)}` : 'Aguardando Início...'}
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <ActionBar />
                    </div>
                </div>
            </aside>
        </div>
    );
};

export default MissionControl;
