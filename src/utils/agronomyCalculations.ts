import { DetailedForecast, Field, WeatherForecast } from '../types';

export const calculateSprayingConditions = (hourlyForecast: DetailedForecast[]) => {
    return hourlyForecast.slice(0, 5).map(hour => {
        const date = new Date(hour.dt * 1000);
        const time = date.getHours() + ":00";

        let status: 'good' | 'warning' | 'bad' = 'good';
        let reason = 'Ideal';

        if (hour.rainProb > 50) {
            status = 'bad';
            reason = 'Chuva';
        } else if (hour.windSpeed > 15) {
            status = 'bad';
            reason = 'Vento Forte';
        } else if (hour.temp > 28) {
            status = 'warning';
            reason = 'Calor';
        } else if (hour.windSpeed > 10) {
            status = 'warning';
            reason = 'Vento Mod.';
        }

        return { time, status, reason, ...hour };
    });
};

export const calculateWaterConsumption = (fields: Field[]) => {
    // Mock calculation: average consumption per hectare
    const totalArea = fields.reduce((acc, f) => acc + f.areaHa, 0);
    return Math.round(totalArea * 4.5); // m3 per day estimate
};

export const calculateSolarEnergy = (currentWeather: WeatherForecast | null) => {
    if (!currentWeather) return 0;
    const condition = currentWeather.condition;
    const production = condition === 'sunny' ? 12.4 : condition === 'cloudy' ? 5.8 : 1.2;
    return production;
};

export const calculateSolarForecast = (currentWeather: WeatherForecast | null) => {
    const now = new Date();
    const currentHour = now.getHours();

    return Array.from({ length: 12 }).map((_, i) => {
        const hour = (currentHour + i) % 24;
        // Solar peak around 13:00 - 15:00
        let factor = 0;
        if (hour >= 7 && hour <= 19) {
            factor = Math.sin((hour - 7) * Math.PI / 12);
        }

        const baseProduction = currentWeather?.condition === 'sunny' ? 15 : currentWeather?.condition === 'cloudy' ? 8 : 2;
        const production = Number((baseProduction * factor).toFixed(1));

        return { hour: `${hour}:00`, production };
    });
};

export const calculateWaterConsumptionByCrop = (fields: Field[]) => {
    const breakdown: Record<string, { area: number, consumption: number }> = {};

    fields.forEach(f => {
        if (!breakdown[f.crop]) {
            breakdown[f.crop] = { area: 0, consumption: 0 };
        }
        breakdown[f.crop].area += f.areaHa;
        breakdown[f.crop].consumption += f.areaHa * 4.5;
    });

    // If no fields, provide example data
    if (fields.length === 0) {
        return [
            { crop: 'Vinha', area: 12.5, consumption: 56.2, isExample: true },
            { crop: 'Olival', area: 8.2, consumption: 36.9, isExample: true },
            { crop: 'Milho', area: 5.0, consumption: 22.5, isExample: true }
        ];
    }

    return Object.entries(breakdown).map(([crop, data]) => ({
        crop,
        area: data.area,
        consumption: Number((Number(data.consumption) || 0).toFixed(1)),
        isExample: false
    })).sort((a, b) => b.consumption - a.consumption);
};
