
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Play, Pause, RotateCcw, MapPin, Battery,
    Navigation, Signal, ShieldAlert, Cpu,
    MousePointer2, Trash2, CheckCircle2, AlertTriangle, Cloud,
    Camera, Radio, Zap, Wind, Crosshair, Terminal
} from 'lucide-react';
import { MapContainer, TileLayer, Polygon, Polyline, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Field, Mission, FeedItem } from '../types';
import { haptics } from '../utils/haptics';
import OfflineTileLayer from './OfflineTileLayer';
import { useStore } from '../store/useStore';

// --- HELPERS ---

function isPointInPolygon(point: [number, number], vs: [number, number][]) {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0], yi = vs[i][1];
        const xj = vs[j][0], yj = vs[j][1];
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !intersect; // Fixed logic to match field.polygon orientation
        if (intersect) inside = !inside;
    }
    // Simple point-in-polygon check for leaflet coordinates
    return inside;
}

// Ray-casting algorithm to check if a point is inside a polygon
const checkPointInPoly = (point: [number, number], vs: [number, number][]) => {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0], yi = vs[i][1];
        const xj = vs[j][0], yj = vs[j][1];
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
};

interface MissionControlProps {
    field: Field;
    onClose?: () => void;
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

const DRONE_VIEW_URL = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWExYTFhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM0YWRlODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiPkxJVkUgRkVFRCBTSU1VTEFUSU9OPC90ZXh0Pjwvc3ZnPg==";

const MissionControl: React.FC<MissionControlProps> = ({ field, onMissionUpdate, onClose }) => {
    const [activeSwarm, setActiveSwarm] = useState<string[]>([FLEET[0].id]);
    const [isFleetExpanded, setIsFleetExpanded] = useState(false);
    const [waypoints, setWaypoints] = useState<[number, number][]>([]);
    const [isSimulationActive, setIsSimulationActive] = useState(false);
    const [progress, setProgress] = useState(0);
    const [battery, setBattery] = useState(100);
    const [isDrawing, setIsDrawing] = useState(true);
    const [isGeofenceViolated, setIsGeofenceViolated] = useState(false);
    const [missionLogs, setMissionLogs] = useState<Array<{ time: string, msg: string, type: 'info' | 'warn' | 'success' }>>([
        { time: new Date().toLocaleTimeString(), msg: 'SISTEMA INICIALIZADO', type: 'info' }
    ]);
    const feedItems = useStore(state => state.feedItems);

    const [leadPos, setLeadPos] = useState<[number, number] | null>(null);
    const activeVehicles = FLEET.filter(v => activeSwarm.includes(v.id));
    const speedMultiplier = activeVehicles.length;
    const simTimerRef = useRef<NodeJS.Timeout | null>(null);

    const addLog = (msg: string, type: 'info' | 'warn' | 'success' = 'info') => {
        setMissionLogs(prev => [{ time: new Date().toLocaleTimeString(), msg, type }, ...prev].slice(0, 15));
    };

    const getPositionAtProgress = (prog: number, path: [number, number][]) => {
        if (path.length < 2 || prog <= 0) return path[0];
        if (prog >= 100) return path[path.length - 1];
        const totalPoints = path.length;
        const totalSegments = totalPoints - 1;
        const rawIndex = (prog / 100) * totalSegments;
        const segmentIndex = Math.floor(rawIndex);
        const t = rawIndex - segmentIndex;
        const p1 = path[segmentIndex];
        const p2 = path[segmentIndex + 1];
        if (p1 && p2) {
            return [p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t] as [number, number];
        }
        return path[0];
    };

    useEffect(() => {
        if (isSimulationActive && waypoints.length >= 2) {
            addLog(`MISSAO INICIADA: ${activeVehicles.map(v => v.name).join(', ')}`, 'success');
            simTimerRef.current = setInterval(() => {
                setProgress(prev => {
                    const next = prev + (0.5 * speedMultiplier);
                    if (next >= 100) {
                        setIsSimulationActive(false);
                        haptics.success();
                        addLog('MISSAO CONCLUIDA COM SUCESSO', 'success');
                        return 100;
                    }

                    const newLeadPos = getPositionAtProgress(next, waypoints);
                    setLeadPos(newLeadPos);

                    if (newLeadPos) {
                        const isInside = checkPointInPoly(newLeadPos, field.polygon);
                        if (!isInside && !isGeofenceViolated) {
                            setIsGeofenceViolated(true);
                            haptics.warning();
                            addLog('ALERTA: VIOLACAO DE GEOFENCE DETETADA', 'warn');
                        } else if (isInside && isGeofenceViolated) {
                            setIsGeofenceViolated(false);
                            addLog('STATUS: DENTRO DO PERIMETRO', 'info');
                        }
                    }

                    const totalDrain = activeVehicles.reduce((acc, v) => acc + v.batteryDrain, 0);
                    setBattery(b => Math.max(0, b - (totalDrain / activeVehicles.length)));

                    return next;
                });
            }, 50);
        } else if (simTimerRef.current) {
            clearInterval(simTimerRef.current);
            if (!isSimulationActive && progress > 0 && progress < 100) {
                addLog('MISSAO PAUSADA PELO OPERADOR', 'warn');
            }
        }
        return () => { if (simTimerRef.current) clearInterval(simTimerRef.current); };
    }, [isSimulationActive, waypoints, field.polygon, isGeofenceViolated, speedMultiplier]);

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
        setLeadPos(null);
        setIsGeofenceViolated(false);
        setIsDrawing(true);
        addLog('SISTEMA REINICIALIZADO', 'info');
    };

    const handleClearRoute = () => {
        haptics.medium();
        handleReset();
        setWaypoints([]);
        addLog('ROTA LIMPA PELO OPERADOR', 'info');
    };

    const TelemetryValue = ({ icon: Icon, label, value, unit, colorClass = "text-white" }: any) => (
        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-2 md:p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className={clsx("p-1.5 rounded-lg bg-white/5", colorClass)}>
                    <Icon size={14} />
                </div>
                <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider font-mono">{label}</span>
            </div>
            <div className="text-right">
                <span className="text-sm font-black text-white font-mono">{value}</span>
                {unit && <span className="text-[10px] ml-1 text-gray-500 font-bold uppercase">{unit}</span>}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_350px] gap-4 min-h-[700px] bg-neutral-950 p-2 md:p-4 rounded-[2.5rem] border border-white/5 overflow-hidden font-sans text-gray-100">

            {/* LEFT: LIVE COMMAND CENTER */}
            <div className="flex flex-col gap-4 min-w-0 h-full overflow-hidden">

                {/* STATUS BAR */}
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className={clsx("w-2 h-2 rounded-full", isSimulationActive ? "bg-red-500 animate-pulse" : "bg-emerald-500")} />
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                                {isSimulationActive ? 'LIVE: MISSION ACTIVE' : 'SYSTEM: STANDBY'}
                            </span>
                        </div>
                        <div className="hidden md:flex items-center gap-2 text-gray-400">
                            <Radio size={12} />
                            <span className="text-[9px] font-black uppercase tracking-widest leading-none">SAT-COM: CONNECTED (84%)</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="px-2 py-1 bg-white/5 rounded-lg border border-white/10 text-white text-[9px] font-black uppercase">
                            Swarm: {activeVehicles.length}x
                        </div>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-1 px-3 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all text-[10px] font-black uppercase tracking-widest border border-red-500/30"
                            >
                                Sair
                            </button>
                        )}
                    </div>
                </div>

                {/* LIVE FEED + MAP OVERLAY */}
                <div className="relative flex-1 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl group bg-black min-h-[400px]">

                    {/* Simulated Drone Feed */}
                    <div className="absolute inset-0 z-0">
                        <img src="/drone_sim.png" className="w-full h-full object-cover opacity-60" alt="Drone View" />

                        {/* Scanlines Effect */}
                        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

                        {/* HUD Elements */}
                        <div className="absolute inset-0 p-3 md:p-6 pointer-events-none text-white/80 font-mono">

                            {/* Corners */}
                            <div className="absolute top-3 left-3 md:top-6 md:left-6 w-6 h-6 md:w-10 md:h-10 border-t-2 border-l-2 border-white/40" />
                            <div className="absolute top-3 right-3 md:top-6 md:right-6 w-6 h-6 md:w-10 md:h-10 border-t-2 border-r-2 border-white/40" />
                            <div className="absolute bottom-3 left-3 md:bottom-6 md:left-6 w-6 h-6 md:w-10 md:h-10 border-b-2 border-l-2 border-white/40" />
                            <div className="absolute bottom-3 right-3 md:bottom-6 md:right-6 w-6 h-6 md:w-10 md:h-10 border-b-2 border-r-2 border-white/40" />

                            {/* Central Crosshair */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-40">
                                <div className="relative w-24 h-24 md:w-40 md:h-40">
                                    <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white" />
                                    <div className="absolute top-0 left-1/2 w-[1px] h-full bg-white" />
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 border border-dashed border-white rounded-full"
                                    />
                                </div>
                            </div>

                            {/* Altitude / Pitch Gauge */}
                            <div className="absolute left-6 md:left-10 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                                <div className="text-[8px] md:text-[10px] font-black">ALT</div>
                                <div className="h-24 md:h-40 w-1 bg-white/20 relative">
                                    <motion.div
                                        animate={{ y: isSimulationActive ? [0, 10, -5, 0] : 0 }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 md:w-4 h-[2px] bg-red-500 shadow-[0_0_10px_red]"
                                    />
                                </div>
                                <div className="text-[8px] md:text-[10px] font-black">{isSimulationActive ? '24' : '0'}m</div>
                            </div>
                        </div>

                        {/* REC indicator */}
                        <div className="absolute top-10 right-10 flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                            <span className="text-xs font-black tracking-widest uppercase">REC</span>
                        </div>
                    </div>

                    {/* BOTTOM ACTION OVERLAY */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex items-end justify-between bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex flex-col gap-2">
                            <div className="bg-black/60 backdrop-blur-xl p-3 rounded-2xl border border-white/10 max-w-[200px]">
                                <h4 className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Ponto Alvo GPS</h4>
                                <p className="text-xs text-white font-mono leading-none truncate">
                                    {leadPos ? `${leadPos[0].toFixed(5)}, ${leadPos[1].toFixed(5)}` : 'SINAL GPS AGUARDANDO...'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={handleToggleSim} className={clsx(
                                "px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-tight shadow-xl transition-all active:scale-95 flex items-center gap-2 border border-white/20",
                                isSimulationActive ? "bg-amber-600 text-white" : "bg-emerald-600 text-white"
                            )}>
                                {isSimulationActive ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                                {isSimulationActive ? 'PAUSAR MISSÃO' : 'EXECUTAR MISSÃO'}
                            </button>
                            <button onClick={handleReset} className="p-3 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl text-white hover:bg-white/20 transition-all">
                                <RotateCcw size={18} />
                            </button>
                        </div>
                    </div>

                    {/* MINI MAP HUD */}
                    <div className="absolute top-6 left-6 w-48 h-48 rounded-[1.5rem] overflow-hidden border-2 border-white/20 shadow-2xl z-20 group-hover:scale-110 transition-transform duration-500">
                        <MapContainer center={field.coordinates} zoom={18} style={{ height: '100%', width: '100%' }} zoomControl={false} scrollWheelZoom={false}>
                            <OfflineTileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                            <Polygon positions={field.polygon} pathOptions={{ color: '#10b981', weight: 1, fillOpacity: 0.2 }} />
                            <RouteLayer waypoints={waypoints} setWaypoints={setWaypoints} isDrawing={isDrawing} />
                            {leadPos && <Marker position={leadPos} icon={L.divIcon({ className: 'custom-radar', html: '<div class="w-4 h-4 bg-agro-green rounded-full shadow-[0_0_15px_#10b981] animate-ping"></div>' })} />}
                            {leadPos && <MapCenterer coords={leadPos} />}
                        </MapContainer>
                        <div className="absolute inset-0 pointer-events-none border border-white/30 rounded-[1.5rem]" />
                        <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/60 text-[7px] text-white font-black uppercase rounded">TATIC-MAP</div>
                    </div>
                </div>
            </div>

            {/* RIGHT: DATA & ANALYTICS SIDEBAR */}
            <aside className="bg-neutral-900/50 backdrop-blur-xl rounded-[2rem] border border-white/5 p-4 flex flex-col gap-4 overflow-hidden">

                <div className="space-y-4 overflow-y-auto no-scrollbar flex-1 pb-4">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-1">TELEMETRY_ENGINE v2.5</h3>

                    <div className="grid grid-cols-1 gap-2">
                        <TelemetryValue icon={Zap} label="POTENCIA" value={Math.floor(battery)} unit="%" colorClass={battery < 20 ? "text-red-500" : "text-yellow-400"} />
                        <TelemetryValue icon={Navigation} label="PROGRESSO" value={Math.floor(progress)} unit="%" colorClass="text-blue-400" />
                        <TelemetryValue icon={Wind} label="VELOCIDADE" value={isSimulationActive ? (4.2 * speedMultiplier).toFixed(1) : 0.0} unit="km/h" colorClass="text-emerald-400" />
                        <TelemetryValue icon={MapPin} label="COORD_X" value={leadPos ? leadPos[0].toFixed(5) : '---'} colorClass="text-purple-400" />
                        <TelemetryValue icon={MapPin} label="COORD_Y" value={leadPos ? leadPos[1].toFixed(5) : '---'} colorClass="text-purple-400" />
                        <TelemetryValue icon={Signal} label="SINAL_LINK" value={92} unit="%" colorClass="text-blue-500" />
                    </div>

                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Terminal size={12} /> MISSION_LOG
                            </h3>
                            <div className="w-1.5 h-1.5 bg-agro-green rounded-full animate-pulse" />
                        </div>

                        <div className="bg-black/60 rounded-2xl border border-white/5 p-3 h-[250px] overflow-y-auto font-mono text-[9px] space-y-2 no-scrollbar">
                            {missionLogs.map((log, idx) => (
                                <div key={idx} className={clsx(
                                    "flex gap-2 leading-tight",
                                    log.type === 'warn' ? "text-red-400" : log.type === 'success' ? "text-emerald-400" : "text-gray-400"
                                )}>
                                    <span className="opacity-40 shrink-0">[{log.time}]</span>
                                    <span className="font-bold">{log.msg}</span>
                                </div>
                            ))}
                            <div className="animate-pulse text-agro-green font-black">_</div>
                        </div>
                    </div>
                </div>

                {/* FLEET QUICK CONTROL */}
                <div className="pt-2 border-t border-white/5">
                    <button onClick={() => setIsFleetExpanded(!isFleetExpanded)} className="w-full bg-white/5 hover:bg-white/10 transition-colors rounded-xl p-3 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-agro-green flex items-center justify-center text-white shadow-lg">
                                <Cpu size={16} />
                            </div>
                            <div className="text-left">
                                <p className="text-[7px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">GESTAO_DE_FROTA</p>
                                <p className="text-[10px] font-black text-white uppercase">{activeVehicles.length} VEÍCULOS ACTIVOS</p>
                            </div>
                        </div>
                        <Crosshair size={16} className="text-gray-500 group-hover:text-agro-green transition-colors" />
                    </button>
                </div>

            </aside>

        </div>
    );
};

export default MissionControl;
