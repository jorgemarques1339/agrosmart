
import { Field } from '../types';

export class PushNotificationManager {
    static async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn("Este browser não suporta notificações Desktop.");
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    static async getSubscriptionState(): Promise<NotificationPermission> {
        return Notification.permission;
    }

    /**
     * Simulates a push event from the background by sending a message to the SW
     * in a real app, this would be triggered by a backend via VAPID.
     */
    static async triggerTestPush(title: string, body: string, url: string = '/') {
        if (!('serviceWorker' in navigator)) return;

        const registration = await navigator.serviceWorker.ready;

        if (Notification.permission === 'granted') {
            registration.showNotification(title, {
                body,
                icon: '/pwa-192x192.png',
                badge: '/pwa-192x192.png',
                vibrate: [200, 100, 200],
                data: { url },
                actions: [
                    { action: 'open', title: 'Ver Agora' },
                    { action: 'close', title: 'Fechar' }
                ]
            } as any);
        } else {
            console.warn("Notifications not granted. Cannot trigger test push.");
        }
    }

    /**
     * Schedules a delayed notification to simulate a background alert
     */
    static async scheduleDelayedPush(title: string, body: string, delayMs: number = 5000) {
        setTimeout(() => {
            this.triggerTestPush(title, body);
        }, delayMs);
    }
}

// ── Geofence-specific helpers (used by GeofencingService.tsx) ─────────────────

/**
 * Request OS notification permission if not already granted.
 * Returns true if granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
}

/**
 * Fire a native OS notification for a geofence field entry.
 * Posts a GEOFENCE_ENTRY message to the SW which calls showNotification().
 * Works on iOS 16.4+ lock screen, Apple Watch, Android, Desktop.
 */
export async function sendGeofenceNotification(field: Field): Promise<boolean> {
    if (!('serviceWorker' in navigator)) return false;
    const granted = await requestNotificationPermission();
    if (!granted) return false;
    const registration = await navigator.serviceWorker.ready;
    if (!registration?.active) return false;

    registration.active.postMessage({
        type: 'GEOFENCE_ENTRY',
        field: { id: field.id, name: field.name }
    });

    return true;
}

/**
 * Dismiss all pending geofence notifications for a specific fieldId.
 */
export async function dismissGeofenceNotification(fieldId: string): Promise<void> {
    if (!('serviceWorker' in navigator)) return;
    const registration = await navigator.serviceWorker.ready;
    if (!registration) return;
    const notifications = await registration.getNotifications({
        tag: 'geofence-checkin-' + fieldId
    });
    notifications.forEach(n => n.close());
}
