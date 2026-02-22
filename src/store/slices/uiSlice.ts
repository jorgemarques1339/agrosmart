import { StateCreator } from 'zustand';
import { AppState } from '../useStore';
import { WeatherForecast, DetailedForecast, Task, ProductBatch } from '../../types';

export interface Conflict {
    id: string; // Entity ID
    type: string; // 'fields', 'animals', etc.
    localData: any;
    remoteData: any;
    timestamp: string;
}

export interface UISlice {
    activeTab: string;
    isDarkMode: boolean;
    isSolarMode: boolean;
    isOnline: boolean;
    weatherData: WeatherForecast[];
    detailedForecast: DetailedForecast[];
    permissions: {
        gps: boolean;
        camera: boolean;
        nfc: boolean;
        motion: boolean;
    };
    conflicts: Conflict[];
    focusedTarget: { type: 'sensor' | 'field', id: string } | null;
    ui: {
        modals: {
            settings: boolean;
            notificationCenter: boolean;
            notifications: boolean;
            teamManager: boolean;
            omniSearch: boolean;
            taskProof: Task | null;
            traceability: ProductBatch | null;
            fieldFeed: boolean;
            guide: boolean;
            guideStep: number;
            guideData: any;
            iotWizard: boolean;
        };
        isChildModalOpen: boolean;
    };
    setActiveTab: (tab: string) => void;
    setDarkMode: (isDark: boolean) => void;
    setSolarMode: (isSolar: boolean) => void;
    setOnline: (isOnline: boolean) => void;
    setWeatherData: (data: WeatherForecast[]) => void;
    setDetailedForecast: (data: DetailedForecast[]) => void;
    setPermission: (key: keyof UISlice['permissions'], status: boolean) => void;
    setFocusedTarget: (target: { type: 'sensor' | 'field', id: string } | null) => void;
    openModal: (modalId: keyof UISlice['ui']['modals'], data?: any) => void;
    setModalOpen: (modalId: keyof UISlice['ui']['modals'], isOpen: boolean) => void;
    closeModal: (modalId: keyof UISlice['ui']['modals']) => void;
    setChildModalOpen: (isOpen: boolean) => void;
    updateGuideData: (updates: any) => void;
    addConflict: (conflict: Conflict) => void;
    resolveConflict: (entityId: string, choice: 'local' | 'remote') => void;
}

export const createUISlice: StateCreator<AppState, [], [], UISlice> = (set, get) => ({
    activeTab: 'dashboard',
    isDarkMode: localStorage.getItem('oriva_dark_mode') === 'true',
    isSolarMode: localStorage.getItem('oriva_solar_mode') === 'true',
    isOnline: navigator.onLine,
    weatherData: [],
    detailedForecast: [],
    permissions: {
        gps: false,
        camera: false,
        nfc: false,
        motion: false
    },
    conflicts: [],
    focusedTarget: null,
    ui: {
        modals: {
            settings: false,
            notificationCenter: false,
            notifications: false,
            teamManager: false,
            omniSearch: false,
            taskProof: null,
            traceability: null,
            fieldFeed: false,
            guide: false,
            guideStep: 1,
            guideData: {
                stockId: '', quantity: '', clientName: '', clientNif: '',
                destination: '', plate: '', date: new Date().toISOString().split('T')[0],
                price: '', fieldId: ''
            },
            iotWizard: false
        },
        isChildModalOpen: false
    },

    setActiveTab: (tab) => set({ activeTab: tab }),
    setDarkMode: (isDark) => {
        localStorage.setItem('oriva_dark_mode', String(isDark));
        set({ isDarkMode: isDark });
    },
    setSolarMode: (isSolar) => {
        localStorage.setItem('oriva_solar_mode', String(isSolar));
        set({ isSolarMode: isSolar });
    },
    setOnline: (isOnline) => set({ isOnline, syncStatus: isOnline ? 'idle' : 'offline' }),
    setWeatherData: (weatherData) => set({ weatherData }),
    setDetailedForecast: (data) => set({ detailedForecast: data }),
    setPermission: (key, status) => set(state => ({
        permissions: { ...state.permissions, [key]: status }
    })),
    setFocusedTarget: (target) => set({ focusedTarget: target }),

    openModal: (modalId, data) => set(state => {
        const newModals = { ...state.ui.modals };
        if (modalId === 'taskProof') newModals.taskProof = data;
        else if (modalId === 'traceability') newModals.traceability = data;
        else (newModals as any)[modalId] = true;

        return { ui: { ...state.ui, modals: newModals } };
    }),

    closeModal: (modalId) => set(state => {
        const newModals = { ...state.ui.modals };
        if (modalId === 'taskProof') newModals.taskProof = null;
        else if (modalId === 'traceability') newModals.traceability = null;
        else if (modalId === 'guide') {
            newModals.guide = false;
            newModals.guideStep = 1;
            newModals.guideData = {
                stockId: '', quantity: '', clientName: '', clientNif: '',
                destination: '', plate: '', date: new Date().toISOString().split('T')[0],
                price: '', fieldId: ''
            };
        } else (newModals as any)[modalId] = false;

        return { ui: { ...state.ui, modals: newModals } };
    }),

    setModalOpen: (modalId, isOpen) => set(state => ({
        ui: {
            ...state.ui,
            modals: { ...state.ui.modals, [modalId]: isOpen }
        }
    })),

    setChildModalOpen: (isOpen) => set(state => ({ ui: { ...state.ui, isChildModalOpen: isOpen } })),
    updateGuideData: (updates) => set(state => ({
        ui: {
            ...state.ui,
            modals: {
                ...state.ui.modals,
                guideData: { ...state.ui.modals.guideData, ...updates }
            }
        }
    })),
    addConflict: (conflict) => set(state => {
        // Avoid duplicate conflicts for the same entity
        if (state.conflicts.some(c => c.id === conflict.id)) return state;
        return { conflicts: [...state.conflicts, conflict] };
    }),
    resolveConflict: (entityId, choice) => {
        const conflict = get().conflicts.find(c => c.id === entityId);
        if (!conflict) return;

        // Choice logic will be handled by the caller (SyncManager or Component)
        // This action primarily clears the conflict from the queue
        set(state => ({
            conflicts: state.conflicts.filter(c => c.id !== entityId)
        }));
    },
});
