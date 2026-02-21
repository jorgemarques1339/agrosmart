import mqtt from 'mqtt';
import { MQTT_BROKER } from '../constants';
import { useStore } from '../store/useStore';
import { Field } from '../types';

class IoTManager {
    private client: mqtt.MqttClient | null = null;
    private subscriptions: Set<string> = new Set();

    init() {
        if (this.client) return;

        console.log('[IoTManager] Initializing MQTT Connection...');
        this.client = mqtt.connect(MQTT_BROKER);

        this.client.on('connect', () => {
            console.log('[IoTManager] Connected to MQTT Broker');
            this.resubscribeAll();
        });

        this.client.on('message', (topic, message) => {
            this.handleMessage(topic, message.toString());
        });

        this.client.on('error', (err) => {
            console.error('[IoTManager] Connection Error:', err);
        });
    }

    private resubscribeAll() {
        const fields = useStore.getState().fields;
        fields.forEach(field => this.subscribeToField(field.id));
    }

    subscribeToField(fieldId: string) {
        if (!this.client || !this.client.connected) return;

        const topic = `oriva/fields/${fieldId}/telemetry`;
        if (!this.subscriptions.has(topic)) {
            this.client.subscribe(topic);
            this.subscriptions.add(topic);
            console.log(`[IoTManager] Subscribed to ${topic}`);
        }
    }

    toggleIrrigation(fieldId: string, status: boolean) {
        if (!this.client || !this.client.connected) {
            console.warn('[IoTManager] MQTT not connected. Using local state fallback.');
            // Fallback to local state if MQTT fails
            useStore.getState().toggleIrrigation(fieldId, status);
            return;
        }

        const topic = `oriva/fields/${fieldId}/command`;
        const payload = JSON.stringify({ irrigationStatus: status, timestamp: new Date().toISOString() });

        this.client.publish(topic, payload, { qos: 1 }, (err) => {
            if (err) {
                console.error(`[IoTManager] Failed to send command to ${fieldId}`, err);
            } else {
                console.log(`[IoTManager] Command sent to ${topic}: ${payload}`);
                // Optimistic update
                useStore.getState().toggleIrrigation(fieldId, status);
            }
        });
    }

    private handleMessage(topic: string, message: string) {
        try {
            const data = JSON.parse(message);
            const fieldMatch = topic.match(/oriva\/fields\/(.+)\/telemetry/);

            if (fieldMatch) {
                const fieldId = fieldMatch[1];
                console.log(`[IoTManager] Received telemetry for ${fieldId}:`, data);

                // Update specific field fields (humidity, temp, etc)
                const updates: Partial<Field> = {};
                if (typeof data.humidity === 'number') updates.humidity = data.humidity;
                if (typeof data.temp === 'number') updates.temp = data.temp;
                if (typeof data.healthScore === 'number') updates.healthScore = data.healthScore;

                if (Object.keys(updates).length > 0) {
                    useStore.getState().updateField(fieldId, updates);
                }
            }
        } catch (e) {
            console.error('[IoTManager] Error parsing message:', topic, message);
        }
    }

    stop() {
        if (this.client) {
            this.client.end();
            this.client = null;
            this.subscriptions.clear();
        }
    }
}

export const iotManager = new IoTManager();
