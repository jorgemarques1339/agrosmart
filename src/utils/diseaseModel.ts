
import { Field, DetailedForecast } from '../types';

/**
 * Calculates the risk of Míldio (Downy Mildew) based on weather factors.
 * This is a simplified model inspired by the 3-10-10 rule and humidity indexing.
 * 3-10-10 Rule: 10mm rain, 10°C min temp, 10cm shoot length (simplified here).
 */
export function calculateMildioRisk(field: Field, forecast: DetailedForecast[]) {
    if (!forecast || forecast.length === 0) return {
        percentage: 0,
        level: 'Baixo',
        color: 'text-gray-400',
        factors: { temp: 'N/A', humidity: 'N/A', rain: 'N/A' }
    };

    // 1. Temperature Factor (Favors 15-25°C)
    const avgTemp = forecast.reduce((acc, f) => acc + f.temp, 0) / forecast.length;
    let tempScore = 0;
    if (avgTemp >= 10 && avgTemp <= 30) {
        tempScore = avgTemp >= 15 && avgTemp <= 25 ? 100 : 50;
    }

    // 2. Humidity Factor (High humidity > 85% is critical)
    const highHumidityHours = forecast.filter(f => f.humidity > 85).length;
    let humidityScore = (highHumidityHours / forecast.length) * 100;

    // Include Historical Humidity if available (last 3 records)
    if (field.history && field.history.length > 0) {
        const historicalHumidity = field.history.slice(-3).reduce((acc, h) => acc + h.humidity, 0) / Math.min(field.history.length, 3);
        if (historicalHumidity > 80) humidityScore += 20; // Extra risk if it was already humid
    }
    humidityScore = Math.min(humidityScore, 100);

    // 3. Rain Probability (Pop)
    const avgRainProb = forecast.reduce((acc, f) => acc + f.rainProb, 0) / forecast.length;
    const rainScore = avgRainProb;

    // Weighted Risk Calculation
    // Humidity is most critical for Mildio (45%), followed by Temp (30%) and Rain (25%)
    const rawRisk = (humidityScore * 0.45) + (tempScore * 0.3) + (rainScore * 0.25);
    const percentage = Math.round(rawRisk);

    let level: 'Baixo' | 'Moderado' | 'Alto' | 'Crítico' = 'Baixo';
    let color = 'text-green-500';

    if (percentage > 80) {
        level = 'Crítico';
        color = 'text-red-600';
    } else if (percentage > 60) {
        level = 'Alto';
        color = 'text-red-500';
    } else if (percentage > 30) {
        level = 'Moderado';
        color = 'text-orange-500';
    }

    return {
        percentage,
        level,
        color,
        factors: {
            temp: tempScore > 70 ? 'Favorável' : 'Desfavorável',
            humidity: humidityScore > 50 ? 'Elevada' : 'Normal',
            rain: rainScore > 40 ? 'Alta Probabilidade' : 'Baixa'
        }
    };
}
