import React, { useMemo } from 'react';
import { X, Navigation, Fuel, AlertTriangle, CheckCircle2, MapPin, ArrowRight } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Polygon, Marker } from 'react-leaflet';
import OfflineTileLayer from './OfflineTileLayer';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Field, DetailedForecast } from '../types';
import { optimizeRoute } from '../utils/routeOptimizer';

interface RouteOptimizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    fields: Field[];
    forecast: DetailedForecast[];
}

const RouteOptimizationModal: React.FC<RouteOptimizationModalProps> = ({ isOpen, onClose, fields, forecast }) => {
    const optimization = useMemo(() => optimizeRoute(fields, forecast), [fields, forecast]);

    // Calculate map center (average of all field coordinates)
    const mapCenter = useMemo(() => {
        if (fields.length === 0) return [41.442, -8.723] as [number, number];
        const lat = fields.reduce((acc, f) => acc + f.coordinates[0], 0) / fields.length;
        const lng = fields.reduce((acc, f) => acc + f.coordinates[1], 0) / fields.length;
        return [lat, lng] as [number, number];
    }, [fields]);

    const routePositions = useMemo(() => optimization.orderedFields.map(f => f.coordinates), [optimization]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in px-4" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-white dark:bg-neutral-900 w-full max-w-4xl h-[90vh] md:h-[80vh] rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-white/20"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
                    <div>
                        <h3 className="text-xl md:text-2xl font-black dark:text-white uppercase italic tracking-tighter flex items-center gap-2">
                            <Navigation className="text-agro-green" size={24} /> Otimização de Rota IA
                        </h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Algoritmo de Eficiência de Combustível</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white dark:bg-neutral-800 rounded-full shadow-sm hover:bg-gray-100 transition-colors">
                        <X size={20} className="dark:text-white" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col md:grid md:grid-cols-[1fr_320px] overflow-hidden">
                    {/* Map Area */}
                    <div className="relative h-48 md:h-auto border-b md:border-b-0 md:border-r border-gray-100 dark:border-white/5">
                        <MapContainer
                            center={mapCenter}
                            zoom={15}
                            style={{ height: '100%', width: '100%' }}
                            className="z-10"
                        >
                            <OfflineTileLayer
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                crossOrigin="anonymous"
                            />
                            {fields.map(field => (
                                <Polygon
                                    key={field.id}
                                    positions={field.polygon}
                                    pathOptions={{ color: '#4ade80', fillColor: '#4ade80', fillOpacity: 0.2, weight: 2 }}
                                />
                            ))}
                            <Polyline
                                positions={routePositions}
                                pathOptions={{ color: '#8b5cf6', weight: 4, dashArray: '10, 10' }}
                            />
                            {optimization.orderedFields.map((field, i) => (
                                <Marker
                                    key={field.id}
                                    position={field.coordinates}
                                    icon={L.divIcon({
                                        className: 'custom-div-icon',
                                        html: `<div class="w-6 h-6 bg-agro-green text-white rounded-full flex items-center justify-center font-black text-xs shadow-lg border-2 border-white">${i + 1}</div>`,
                                        iconSize: [24, 24],
                                        iconAnchor: [12, 12]
                                    })}
                                />
                            ))}
                        </MapContainer>

                        {/* Floating Stats */}
                        <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2">
                            <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl text-white border border-white/20 flex items-center gap-3">
                                <div className="p-1.5 bg-agro-green rounded-lg"><Fuel size={14} /></div>
                                <div>
                                    <p className="text-[8px] font-bold uppercase opacity-60 leading-none">Poupança Est.</p>
                                    <p className="text-sm font-black leading-none">{optimization.totalFuelSaving} L <span className="text-[10px] text-agro-green">Gasóleo</span></p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* sidebar: Route List */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Sequência Sugerida</h4>
                            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{fields.length} Parcelas</span>
                        </div>

                        <div className="space-y-3 relative">
                            {optimization.orderedFields.map((field, i) => (
                                <div key={field.id} className="relative">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-white/5 group hover:border-agro-green/30 transition-all">
                                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-black/20 flex items-center justify-center font-black text-agro-green shadow-sm border border-gray-100 dark:border-white/5">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm font-black dark:text-white uppercase truncate">{field.name}</p>
                                                <span className="text-[10px] font-mono text-gray-400">{field.slope}° Inclinação</span>
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{field.crop}</p>
                                        </div>
                                    </div>
                                    {i < optimization.orderedFields.length - 1 && (
                                        <div className="flex justify-center my-1 opacity-20">
                                            <ArrowRight className="rotate-90 text-agro-green" size={14} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {optimization.weatherAlerts.length > 0 && (
                            <div className="mt-6 space-y-3">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Alertas IA</h4>
                                {optimization.weatherAlerts.map((alert, i) => (
                                    <div key={i} className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl">
                                        <AlertTriangle className="text-amber-500 shrink-0" size={16} />
                                        <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 leading-tight">
                                            {alert}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="pt-4">
                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-agro-green text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-lg shadow-agro-green/30 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 size={18} /> Aplicar Ordem de Trabalho
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default RouteOptimizationModal;
