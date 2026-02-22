import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Notification } from '../types';

export const useUIPreferences = () => {
    const {
        isDarkMode, isSolarMode, currentUserId, users,
        setDarkMode, setSolarMode, setCurrentUserId,
        openModal, closeModal, addNotification, ui
    } = useStore();

    const { modals } = ui;

    // Dark Mode Class Toggle
    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDarkMode);
    }, [isDarkMode]);

    // Solar Mode Logic
    useEffect(() => {
        if (isSolarMode) {
            document.documentElement.classList.add('solar-mode');
            document.documentElement.classList.remove('dark');
        } else {
            document.documentElement.classList.remove('solar-mode');
            if (isDarkMode) document.documentElement.classList.add('dark');
        }
    }, [isSolarMode, isDarkMode]);

    // OmniSearch Shortcut (Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (modals.omniSearch) closeModal('omniSearch');
                else openModal('omniSearch');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [modals.omniSearch, openModal, closeModal]);

    // QR Onboarding & URL Params
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        // Onboarding logic
        const onboardId = params.get('onboard');
        if (onboardId && onboardId !== currentUserId) {
            const userExists = users.find(u => u.id === onboardId);
            if (userExists) {
                setCurrentUserId(onboardId);
                const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({ path: newUrl }, '', newUrl);

                addNotification({
                    id: `onboard-${Date.now()}`,
                    title: 'Configuração Concluída',
                    message: `Bem-vindo à SmartAgro, ${userExists.name}! O teu perfil foi configurado.`,
                    type: 'success',
                    timestamp: new Date().toISOString(),
                    read: false
                });
            }
        }
    }, [users, currentUserId, setCurrentUserId, addNotification]);

    return {
        isDarkMode,
        isSolarMode,
        setDarkMode,
        setSolarMode
    };
};
