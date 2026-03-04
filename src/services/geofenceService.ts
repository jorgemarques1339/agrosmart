import { getDistance } from 'geolib';
import { Field } from '../types';
import { notificationService } from './notificationService';

export const GEOFENCE_RADIUS_METERS = 50; // Raio em metros para disparar a notificação

class GeofenceService {
    private watchId: number | null = null;
    private lastNotifiedFieldId: string | null = null;
    private isActive: boolean = false;

    getIsActive() {
        return this.isActive;
    }

    startTracking(fields: Field[], onStatusChange?: (status: boolean) => void) {
        if (!('geolocation' in navigator)) {
            console.error('Geolocalização não suportada');
            return;
        }

        if (this.watchId !== null) {
            this.stopTracking(onStatusChange);
        }

        this.isActive = true;
        onStatusChange?.(this.isActive);

        // Assegura permissão antes de começar
        notificationService.requestPermission();

        console.log('[Geofence] Rastreio de Parcela Ativo (Modo Copiloto).');

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                console.debug(`[Geofence] Nova Localização: ${latitude}, ${longitude}`);

                this.checkGeofences(latitude, longitude, fields);
            },
            (error) => {
                console.error('[Geofence] Erro de geolocalização:', error);
                if (error.code === 1) { // PERMISSION_DENIED
                    this.stopTracking(onStatusChange);
                }
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 10000
            }
        );
    }

    stopTracking(onStatusChange?: (status: boolean) => void) {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
            console.log('[Geofence] Rastreio Desativado.');
        }
        this.isActive = false;
        this.lastNotifiedFieldId = null;
        onStatusChange?.(this.isActive);
    }

    private checkGeofences(lat: number, lng: number, fields: Field[]) {
        // Procura qual o campo mais próximo dentro do raio definido
        for (const field of fields) {
            if (!field.coordinates || field.coordinates.length < 2) continue;

            const distance = getDistance(
                { latitude: lat, longitude: lng },
                { latitude: field.coordinates[0], longitude: field.coordinates[1] }
            );

            if (distance <= GEOFENCE_RADIUS_METERS) {
                // Entrou na Geofence
                if (this.lastNotifiedFieldId !== field.id) {
                    console.log(`[Geofence] Entrou em: ${field.name} (${distance}m)`);
                    this.lastNotifiedFieldId = field.id;

                    this.triggerCheckInNotification(field);
                }
                return; // Pára de iterar assim que encontra o mais próximo no raio
            }
        }

        // Se saiu de todas as geofences, reset
        // Para evitar spam, o reset só acontece se estiver suficientemente longe de *qualquer* campo
        // (Opcional: implementar um threshold duplo, tipo "sair a 100 metros" mas simplificamo aqui)
        const isOutsideAll = fields.every(field => {
            if (!field.coordinates || field.coordinates.length < 2) return true;
            return getDistance(
                { latitude: lat, longitude: lng },
                { latitude: field.coordinates[0], longitude: field.coordinates[1] }
            ) > GEOFENCE_RADIUS_METERS * 1.5; // buffer de saída
        });

        if (isOutsideAll) {
            this.lastNotifiedFieldId = null;
        }
    }

    private triggerCheckInNotification(field: Field) {
        notificationService.showGeofencePrompt(
            `📍 Chegou à: ${field.name}`,
            `Deseja registar entrada e descarregar offline map para esta zona?`,
            'check_in',
            'Fazer Check-In Rápido',
            { fieldId: field.id, fieldName: field.name, type: 'geofence' }
        );
    }
}

export const geofenceService = new GeofenceService();
