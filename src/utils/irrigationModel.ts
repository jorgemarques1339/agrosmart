import { Field, DetailedForecast } from '../types';

export interface IrrigationRecommendation {
    minutes: number;
    et0: number;
    waterStress: number; // 0-100
    next24hRain: number;
    kc: number;
}

const CROP_KC: Record<string, number> = {
    'Vinha': 0.7,
    'Olival': 0.6,
    'Pomar': 0.8,
    'Milho': 1.1,
    'Hortícolas': 1.0,
    'Mirtilos': 0.9,
    'default': 0.85
};

export const calculateIrrigationNeed = (
    field: Field,
    forecast: DetailedForecast[]
): IrrigationRecommendation => {
    // 1. Get Kc for the crop
    const kc = CROP_KC[field.crop] || CROP_KC['default'];

    // 2. Estimate ET0 (Reference Evapotranspiration)
    // Simple Hargreaves-Samani or approximation based on temp/humidity
    const avgTemp = forecast.length > 0 ? (forecast.reduce((acc, f) => acc + f.temp, 0) / forecast.length) : field.temp;
    const avgHum = forecast.length > 0 ? (forecast.reduce((acc, f) => acc + f.humidity, 0) / forecast.length) : field.humidity;

    // Empirical approximation for ET0 in Mediterranean climate (mm/day)
    // Higher temp and lower humidity = higher ET0
    const et0 = Math.max(1, (avgTemp * 0.15) + (100 - avgHum) * 0.05);

    // 3. Calculate Crop Water Requirement (ETc)
    const etc = et0 * kc;

    // 4. Calculate Rain Benefit (Sum of next 24h rain probability / intensity)
    // For demo, we assume 100% rain_prob = 5mm, and we take 24 entries (hourly)
    const next24h = forecast.slice(0, 24);
    const totalRainBenefit = next24h.reduce((acc, f) => acc + (f.rainProb > 50 ? (f.rainProb / 20) : 0), 0);

    // 5. Calculate Current Deficit
    // Assume Field Capacity is 80% humidity.
    const targetHumidity = 75;
    const currentHumidity = field.humidity;
    const deficit = Math.max(0, targetHumidity - currentHumidity);

    // 6. Net Irrigation Requirement
    const netRequirement = Math.max(0, deficit + etc - totalRainBenefit);

    // 7. Convert to Minutes
    // Assumption: 1 minute of irrigation increases soil humidity index by 0.5 units
    const minutes = Math.ceil(netRequirement * 2.5);

    // 8. Water Stress Calculation (0-100)
    // Stress is higher when current humidity is much lower than etc
    const waterStress = Math.min(100, Math.max(0, (etc / (currentHumidity + 1)) * 50));

    return {
        minutes: field.irrigationStatus ? 0 : minutes,
        et0: parseFloat(et0.toFixed(2)),
        waterStress: parseFloat(waterStress.toFixed(1)),
        next24hRain: parseFloat(totalRainBenefit.toFixed(1)),
        kc
    };
};
