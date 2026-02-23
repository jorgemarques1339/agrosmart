import { Field, DetailedForecast } from '../types';

export interface IrrigationRecommendation {
    minutes: number;
    et0: number;
    waterStress: number; // 0-100
    next24hRain: number;
    kc: number;
    ndviValue?: number;
    ndviImpact?: 'increase' | 'decrease' | 'neutral';
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
    // 1. Get Base Kc for the crop
    const baseKc = CROP_KC[field.crop] || CROP_KC['default'];

    // 2. Adjust Kc based on Satellite NDVI (if available)
    // Target NDVI for peak vigor is usually around 0.85
    let kc = baseKc;
    let ndviImpact: 'increase' | 'decrease' | 'neutral' = 'neutral';

    if (field.currentNdvi !== undefined) {
        const ndviFactor = field.currentNdvi / 0.8; // Normalized against a healthy 0.8 baseline
        kc = baseKc * ndviFactor;

        if (ndviFactor > 1.05) ndviImpact = 'increase';
        else if (ndviFactor < 0.95) ndviImpact = 'decrease';
    }

    // 3. Estimate ET0 (Reference Evapotranspiration)
    const avgTemp = forecast.length > 0 ? (forecast.reduce((acc, f) => acc + f.temp, 0) / forecast.length) : field.temp;
    const avgHum = forecast.length > 0 ? (forecast.reduce((acc, f) => acc + f.humidity, 0) / forecast.length) : field.humidity;

    const et0 = Math.max(1, (avgTemp * 0.15) + (100 - avgHum) * 0.05);

    // 4. Calculate Crop Water Requirement (ETc)
    const etc = et0 * kc;

    // 5. Calculate Rain Benefit
    const next24h = forecast.slice(0, 24);
    const totalRainBenefit = next24h.reduce((acc, f) => acc + (f.rainProb > 50 ? (f.rainProb / 20) : 0), 0);

    // 6. Calculate Current Deficit
    const targetHumidity = 75;
    const currentHumidity = field.humidity;
    const deficit = Math.max(0, targetHumidity - currentHumidity);

    // 7. Net Irrigation Requirement
    const netRequirement = Math.max(0, deficit + etc - totalRainBenefit);

    // 8. Convert to Minutes
    const minutes = Math.ceil(netRequirement * 2.5);

    // 9. Water Stress Calculation (0-100)
    // Augmented with NDVI: low NDVI might indicate physiological stress even if humidity is OK
    let waterStress = Math.min(100, Math.max(0, (etc / (currentHumidity + 1)) * 50));

    if (field.currentNdvi !== undefined && field.currentNdvi < 0.45) {
        waterStress = Math.max(waterStress, 75); // Forced high stress if satellite detects low biomass/vigor
    }

    return {
        minutes: field.irrigationStatus ? 0 : minutes,
        et0: parseFloat(et0.toFixed(2)),
        waterStress: parseFloat(waterStress.toFixed(1)),
        next24hRain: parseFloat(totalRainBenefit.toFixed(1)),
        kc: parseFloat(kc.toFixed(2)),
        ndviValue: field.currentNdvi,
        ndviImpact
    };
};
