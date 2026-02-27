import { Field, DetailedForecast } from '../types';

export interface YieldPrediction {
    estimatedYieldChange: number; // percentage (-5 to +10, etc)
    trend: 'up' | 'down' | 'stable';
    estimatedHarvestDate: string; // ISO string
    factors: string[];
}

/**
 * AI-driven Yield Prediction (Mock Algorithm)
 * Uses field history (NDVI, soil moisture) and weather forecast to predict yield trends.
 */
export function calculateYieldPrediction(field: Field, forecast: DetailedForecast[]): YieldPrediction {
    let estimatedYieldChange = 0;
    const factors: string[] = [];

    // 1. Analyze historical NDVI if available
    if (field.history && field.history.length > 0) {
        // Simple trend: compare latest NDVI to the average
        const avgNdvi = field.history.reduce((acc, h) => acc + h.ndvi, 0) / field.history.length;
        const latestNdvi = field.history[field.history.length - 1].ndvi;

        if (latestNdvi > avgNdvi * 1.05) {
            estimatedYieldChange += 3;
            factors.push('Vigor vegetativo (NDVI) acima da média histórica.');
        } else if (latestNdvi < avgNdvi * 0.95) {
            estimatedYieldChange -= 4;
            factors.push('Declínio recente de vigor vegetativo (NDVI).');
        }
    }

    // 2. Analyze weather forecast impact
    if (forecast && forecast.length > 0) {
        const avgTemp = forecast.reduce((acc, f) => acc + f.temp, 0) / forecast.length;
        const extremeHeatHours = forecast.filter(f => f.temp > 35).length;
        const extremeColdHours = forecast.filter(f => f.temp < 5).length;

        if (extremeHeatHours > 10) {
            estimatedYieldChange -= 5;
            factors.push('Previsão de stress térmico extremo (calor) afeta enchimento do grão/fruto.');
        } else if (extremeColdHours > 10) {
            estimatedYieldChange -= 3;
            factors.push('Previsão de temperaturas críticas (geada) pode atrasar maturação.');
        } else if (avgTemp >= 18 && avgTemp <= 26) {
            estimatedYieldChange += 2;
            factors.push('Temperaturas ótimas para fotossíntese nos próximos dias.');
        }
    }

    // 3. Estimate Harvest Date
    // If we have an expected harvest window based on crop type, adjust it.
    // For this mock, we'll set a default base date 30 days from now, and adjust based on temp.
    const baseDaysToHarvest = 30; // Mock base days
    let adjustedDays = baseDaysToHarvest;

    if (estimatedYieldChange > 2) {
        adjustedDays -= 2; // Good conditions = slightly earlier harvest
    } else if (estimatedYieldChange < -2) {
        adjustedDays += 3; // Bad conditions = delayed harvest
    }

    const harvestDate = new Date();
    harvestDate.setDate(harvestDate.getDate() + adjustedDays);

    return {
        estimatedYieldChange: Math.round(estimatedYieldChange * 10) / 10,
        trend: estimatedYieldChange > 1 ? 'up' : estimatedYieldChange < -1 ? 'down' : 'stable',
        estimatedHarvestDate: harvestDate.toISOString(),
        factors
    };
}
