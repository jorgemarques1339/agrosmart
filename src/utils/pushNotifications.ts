
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

        // We use a trick here: in a real environment, the SW receives a 'push' event.
        // For local testing/demo without a backend, we can show a local notification 
        // from the SW registration which is almost identical in behavior.

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
