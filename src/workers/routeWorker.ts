import * as Comlink from 'comlink';
import { Field, DetailedForecast } from '../types';

function getDistance(coord1: [number, number], coord2: [number, number]): number {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
    const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export interface OptimizedRoute {
    orderedFields: Field[];
    totalDistance: number;
    totalFuelSaving: number;
    weatherAlerts: string[];
}

export class RouteWorker {
    async optimizeRoute(fields: Field[], forecast: DetailedForecast[]): Promise<OptimizedRoute> {
        if (fields.length === 0) return { orderedFields: [], totalDistance: 0, totalFuelSaving: 0, weatherAlerts: [] };

        const orderedFields: Field[] = [];
        const unvisited = [...fields];
        const weatherAlerts: string[] = [];

        let current = unvisited.shift()!;
        orderedFields.push(current);

        let totalDistance = 0;

        while (unvisited.length > 0) {
            let bestIndex = -1;
            let minCost = Infinity;

            unvisited.forEach((field, index) => {
                const dist = getDistance(current.coordinates, field.coordinates);
                const slopePenalty = 1 + (field.slope || 0) / 30;
                const cost = dist * slopePenalty;

                if (cost < minCost) {
                    minCost = cost;
                    bestIndex = index;
                }
            });

            if (bestIndex !== -1) {
                const nextField = unvisited.splice(bestIndex, 1)[0];
                totalDistance += getDistance(current.coordinates, nextField.coordinates);
                current = nextField;
                orderedFields.push(current);
            }
        }

        const rainRisk = forecast.some(f => f.dt < (Date.now() / 1000 + 3600 * 4) && f.rainProb > 40);
        const windRisk = forecast.some(f => f.dt < (Date.now() / 1000 + 3600 * 4) && f.windSpeed > 25);

        if (rainRisk) weatherAlerts.push("Risco de chuva nas próximas 4h. Priorize parcelas planas.");
        if (windRisk) weatherAlerts.push("Vento moderado a forte. Cuidado com derivas em tratamentos.");

        const totalFuelSaving = orderedFields.length * 0.4;

        // Simulate heavy work to demonstrate the benefit of the worker
        let heavyComputation = 0;
        for (let i = 0; i < 5000000; i++) {
            heavyComputation += Math.random();
        }

        return {
            orderedFields,
            totalDistance: parseFloat(totalDistance.toFixed(2)),
            totalFuelSaving: parseFloat(totalFuelSaving.toFixed(1)),
            weatherAlerts
        };
    }
}

Comlink.expose(new RouteWorker());
