declare global {
    interface NotificationAction {
        action: string;
        title: string;
        icon?: string;
    }
    interface NotificationOptions {
        actions?: NotificationAction[];
        vibrate?: number | number[];
    }
}

export const notificationService = {
    /**
     * Tenta registar um Periodic Sync nativo (se o browser/SO permitir)
     * para acordar o Service Worker esporadicamente e evitar suspensão iOS/Android
     */
    async registerPeriodicSync() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                // @ts-ignore
                if ('periodicSync' in registration) {
                    // @ts-ignore
                    const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
                    if (status.state === 'granted') {
                        // @ts-ignore
                        await registration.periodicSync.register('agrosmart-health-check', {
                            minInterval: 12 * 60 * 60 * 1000, // 12 hours
                        });
                        console.log('[NotificationService] Periodic Sync registado com sucesso.');
                    } else {
                        console.warn('[NotificationService] Permissão para Periodic Sync negada.');
                    }
                } else {
                    console.log('[NotificationService] Periodic Sync não suportado neste browser.');
                }
            } catch (error) {
                console.error('[NotificationService] Erro ao registar Periodic Sync:', error);
            }
        }
    },

    /**
     * Solicita permissão e retorna true se foi concedida
     */
    async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn('Este browser não suporta notificações web.');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                await this.registerPeriodicSync();
                return true;
            }
            return false;
        }

        return false;
    },

    /**
     * Dispara uma notificação nativa interativa (suporta ServiceWorker context)
     */
    async showGeofencePrompt(title: string, body: string, actionId: string, actionTitle: string, data: any) {
        const hasPermission = await this.requestPermission();
        if (!hasPermission) return;

        const options: NotificationOptions = {
            body,
            icon: '/icons/icon-192x192.png', // Fallback PWA icon assuming structure
            vibrate: [200, 100, 200, 100, 200],
            tag: 'geofence-alert',
            requireInteraction: true,
            data, // Passed to the Service Worker
            actions: [
                {
                    action: actionId,
                    title: actionTitle
                },
                {
                    action: 'dismiss',
                    title: 'Ignorar'
                }
            ]
        };

        try {
            // Trying to show notification through ServiceWorker registration for background capability
            const registration = await navigator.serviceWorker?.getRegistration();
            if (registration) {
                await registration.showNotification(title, options);
            } else {
                // Fallback to normal Notification API
                new Notification(title, options);
            }
        } catch (e) {
            console.error('Erro a disparar notificação push:', e);
            // Fallback
        }
    },

    /**
     * Envia um sinal para o ServiceWorker processar uma notificação inteligente
     * (Usado para simular timers/eventos de background no frontend)
     */
    async sendSmartPush(type: 'DRONE_ALERT' | 'PEST_ALERT', data: any) {
        const hasPermission = await this.requestPermission();
        if (!hasPermission) return;

        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            console.log(`[NotificationService] Sending ${type} to Service Worker...`);
            navigator.serviceWorker.controller.postMessage({
                type,
                payload: data
            });
        } else {
            console.warn('[NotificationService] No active Service Worker found to handle Smart Push.');
        }
    }
};
