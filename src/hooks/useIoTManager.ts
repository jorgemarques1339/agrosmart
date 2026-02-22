import { useCallback } from 'react';
import { useStore } from '../store/useStore';
import { VoiceActionType } from '../components/VoiceAssistant';
import { Sensor } from '../types';

export const useIoTManager = () => {
    const { fields, toggleIrrigation, updateField, addNotification, setActiveTab } = useStore();

    const handleVoiceCommand = useCallback((action: VoiceActionType) => {
        switch (action.type) {
            case 'NAVIGATE':
                setActiveTab(action.target);
                break;
            case 'OPEN_MODAL':
                if (action.target === 'new_task') setActiveTab('dashboard');
                else if (action.target === 'new_animal') setActiveTab('animal');
                else if (action.target === 'add_stock') setActiveTab('stocks');
                break;
            case 'IOT_CONTROL':
                if (action.action === 'irrigation_on') {
                    const f = fields.find(f => !f.irrigationStatus);
                    if (f) toggleIrrigation(f.id, true);
                } else if (action.action === 'irrigation_off' || action.action === 'stop_all') {
                    fields.forEach(f => { if (f.irrigationStatus) toggleIrrigation(f.id, false); });
                }
                break;
        }
    }, [fields, setActiveTab, toggleIrrigation]);

    const handleRegisterSensor = (fieldId: string, sensor: Sensor) => {
        const field = fields.find(f => f.id === fieldId);
        if (!field) return;
        updateField(fieldId, { sensors: [...(field.sensors || []), sensor] });
        addNotification({
            id: `iot-success-${Date.now()}`,
            title: 'Sensor Registado',
            message: `O dispositivo "${sensor.name}" foi associado ao campo ${field.name} com sucesso.`,
            type: 'success',
            timestamp: new Date().toISOString(),
            read: false
        });
    };

    return {
        handleVoiceCommand,
        handleRegisterSensor
    };
};
