import { useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { INITIAL_WEATHER } from '../constants';
import { WeatherForecast, DetailedForecast } from '../types';

import { weatherService } from '../services/weatherService';

export const useWeatherSync = () => {
    const setWeatherData = useStore(state => state.setWeatherData);
    const setDetailedForecast = useStore(state => state.setDetailedForecast);
    const setOnline = useStore(state => state.setOnline);

    const fetchWeather = useCallback(async () => {
        if (!navigator.onLine) {
            const cachedWeather = localStorage.getItem('oriva_cached_weather');
            const cachedHourly = localStorage.getItem('oriva_cached_hourly');
            if (cachedWeather) setWeatherData(JSON.parse(cachedWeather));
            if (cachedHourly) setDetailedForecast(JSON.parse(cachedHourly));
            return;
        }

        try {
            const { dailyData, sprayData } = await weatherService.getForecast();

            setDetailedForecast(sprayData);
            localStorage.setItem('oriva_cached_hourly', JSON.stringify(sprayData));

            setWeatherData(dailyData);
            localStorage.setItem('oriva_cached_weather', JSON.stringify(dailyData));

            setOnline(true);
        } catch (error) {
            console.error("Erro ao obter meteorologia:", error);
            const cachedWeather = localStorage.getItem('oriva_cached_weather');
            if (cachedWeather) setWeatherData(JSON.parse(cachedWeather));
        }
    }, [setWeatherData, setDetailedForecast, setOnline]);

    useEffect(() => {
        fetchWeather();
        const interval = setInterval(fetchWeather, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchWeather]);

    useEffect(() => {
        const handleOnline = () => {
            setOnline(true);
            fetchWeather();
        };
        const handleOffline = () => setOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [fetchWeather, setOnline]);

    return { fetchWeather };
};
