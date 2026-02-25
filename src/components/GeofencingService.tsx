
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { MapPin, ArrowRight, X, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '../utils/haptics';
import {
    sendGeofenceNotification,
    dismissGeofenceNotification,
    requestNotificationPermission,
    getNotificationPermission
} from '../utils/pushNotifications';

// Haversine distance in km
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

const GeofencingService: React.FC = () => {
    const { fields, activeSession, startSession, permissions } = useStore();
    const [nearbyField, setNearbyField] = useState<any>(null);
    const [notifPermission, setNotifPermission] = useState<string>(() => getNotificationPermission());
    const notifiedFieldIds = useRef<Set<string>>(new Set()); // prevent double-firing

    // ── 1. Request notification permission on mount ─────────────────────────
    useEffect(() => {
        if (notifPermission !== 'granted') {
            requestNotificationPermission().then((granted) => {
                setNotifPermission(granted ? 'granted' : 'denied');
            });
        }
    }, []);

    // ── 2. Listen for SW → page messages (GEOFENCE_CHECKIN from lock screen) ─
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return;

        const handleSWMessage = (event: MessageEvent) => {
            if (event.data?.type === 'GEOFENCE_CHECKIN') {
                const { fieldId } = event.data;
                const field = fields.find(f => f.id === fieldId);
                if (field && !activeSession) {
                    console.log('[Geofencing] Auto check-in from lock screen notification for:', field.name);
                    startSession(fieldId, false);
                    haptics.success();
                    // Clear in-app banner since session started from notification
                    setNearbyField(null);
                    notifiedFieldIds.current.delete(fieldId);
                }
            }
        };

        navigator.serviceWorker.addEventListener('message', handleSWMessage);
        return () => navigator.serviceWorker.removeEventListener('message', handleSWMessage);
    }, [fields, activeSession, startSession]);

    // ── 3. GPS watchPosition + geofence detection ───────────────────────────
    useEffect(() => {
        if (!permissions.gps || activeSession) {
            setNearbyField(null);
            return;
        }

        let watchId: number;

        if ('geolocation' in navigator) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;

                    const fieldFound = fields.find(f => {
                        const dist = getDistance(latitude, longitude, f.coordinates[0], f.coordinates[1]);
                        return dist <= 0.1; // 100 metres
                    });

                    if (fieldFound) {
                        if (!nearbyField || nearbyField.id !== fieldFound.id) {
                            setNearbyField(fieldFound);
                            haptics.warning();

                            // Fire native push notification (once per field entry)
                            if (!notifiedFieldIds.current.has(fieldFound.id)) {
                                notifiedFieldIds.current.add(fieldFound.id);
                                sendGeofenceNotification(fieldFound).then((fired) => {
                                    console.log('[Geofencing] Native push fired:', fired, 'for', fieldFound.name);
                                });
                            }
                        }
                    } else {
                        // Left field — clear banner and dismiss notification
                        if (nearbyField) {
                            dismissGeofenceNotification(nearbyField.id);
                            notifiedFieldIds.current.delete(nearbyField.id);
                        }
                        setNearbyField(null);
                    }
                },
                (error) => {
                    console.error('[Geofencing] position error:', error);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [fields, activeSession, permissions.gps, nearbyField]);

    // ── 4. In-app check-in handler ──────────────────────────────────────────
    const handleAutoCheckIn = useCallback(() => {
        if (nearbyField) {
            startSession(nearbyField.id, false);
            setNearbyField(null);
            notifiedFieldIds.current.delete(nearbyField.id);
            dismissGeofenceNotification(nearbyField.id);
            haptics.success();
        }
    }, [nearbyField, startSession]);

    const handleDismiss = useCallback(() => {
        if (nearbyField) {
            dismissGeofenceNotification(nearbyField.id);
            notifiedFieldIds.current.delete(nearbyField.id);
        }
        setNearbyField(null);
    }, [nearbyField]);

    return (
        <AnimatePresence>
            {nearbyField && (
                <motion.div
                    initial={{ y: -120, opacity: 0, scale: 0.9 }}
                    animate={{ y: 20, opacity: 1, scale: 1 }}
                    exit={{ y: -120, opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    className="fixed top-20 left-3 right-3 z-[250] mx-auto max-w-sm"
                >
                    {/* iOS-style notification card */}
                    <div className="bg-white/90 dark:bg-neutral-900/95 backdrop-blur-2xl rounded-[2rem] p-4 shadow-2xl border border-white/40 dark:border-white/10 relative overflow-hidden">
                        {/* Green glow */}
                        <div className="absolute inset-0 bg-agro-green/5 pointer-events-none" />

                        <div className="flex items-center gap-3.5 relative z-10">
                            {/* Icon */}
                            <div className="w-12 h-12 rounded-2xl bg-agro-green flex items-center justify-center text-white shadow-lg shadow-agro-green/30 shrink-0">
                                <MapPin size={22} strokeWidth={2.5} />
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-[9px] font-black text-agro-green uppercase tracking-widest">AgroSmart · Localização</span>
                                    {notifPermission === 'granted' && (
                                        <Bell size={9} className="text-agro-green opacity-60" />
                                    )}
                                </div>
                                <h4 className="text-[13px] font-black text-gray-900 dark:text-white leading-tight">
                                    Bem-vindo a {nearbyField.name}
                                </h4>
                                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                                    Quer iniciar o check-in agora?
                                </p>
                            </div>

                            {/* Close */}
                            <button
                                onClick={handleDismiss}
                                className="w-7 h-7 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center active:scale-90 transition-transform shrink-0"
                            >
                                <X size={13} className="text-gray-500 dark:text-gray-300" />
                            </button>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 mt-3 relative z-10">
                            <button
                                onClick={handleDismiss}
                                className="flex-1 py-2.5 rounded-2xl bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all"
                            >
                                Ignorar
                            </button>
                            <button
                                onClick={handleAutoCheckIn}
                                className="flex-1 py-2.5 rounded-2xl bg-agro-green text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lg shadow-agro-green/25"
                            >
                                Iniciar <ArrowRight size={13} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GeofencingService;
