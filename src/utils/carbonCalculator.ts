import { Machine, Field, FieldLog } from '../types';

export interface AuditLogItem {
    id: string;
    date: string;
    type: 'fuel' | 'fertilizer' | 'sequestration';
    description: string;
    value: number; // tCO2e
    evidence?: string[]; // Attachments
    isobus?: boolean;
}

interface CarbonMetrics {
    emissions: {
        fuel: number; // Tonnes CO2e
        fertilizer: number; // Tonnes CO2e
        total: number;
    };
    sequestration: {
        crops: number; // Tonnes CO2e
        soil: number; // Tonnes CO2e (Simplistic)
        total: number;
    };
    netBalance: number; // Tonnes CO2e (Negative is Good)
    potentialCredits: {
        amount: number; // Tonnes available to sell
        value: number; // Estimated Value in EUR
    };
    auditLogs: AuditLogItem[];
}

// Emission Factors (Standard Estimations)
const FACTORS = {
    DIESEL_KG_CO2_L: 2.68, // kg CO2 per Liter of Diesel
    N_FERTILIZER_KG_CO2_KG: 5.67, // kg CO2e per kg of Nitrogen
    CARBON_PRICE_EUR_TON: 65.00, // Market Price Estimate
};

// Sequestration Factors (Tonnes CO2e per Hectare per Year)
const SEQUESTRATION_RATES: Record<string, number> = {
    'Vinha': 1.2,
    'Olival': 3.5,
    'Pomar': 2.8,
    'Floresta': 10.0,
    'Pastagem': 0.5,
    'Hortícolas': 0.2,
    'Milho': 0.1, // Annual crops capture less permanently
};

export function calculateCarbonFootprint(
    machines: Machine[],
    fields: Field[],
    logs: FieldLog[] // Should be filtered by date range (e.g., last year)
): CarbonMetrics {
    const auditLogs: AuditLogItem[] = [];

    // 1. Calculate Fuel Emissions
    let fuelEmissions = 0;
    machines.forEach(m => {
        let liters = 0;
        if (m.isobusData) {
            // ISO-BUS Integrated: Power * Hours (Mocking a real consumption integration)
            liters = (m.specs?.powerHp || 100) * (m.engineHours / 50); // Weighted consumption
        } else {
            liters = 300 + (m.engineHours / 100); // Standard estimate
        }

        const metric = (liters * FACTORS.DIESEL_KG_CO2_L) / 1000;
        fuelEmissions += metric;

        auditLogs.push({
            id: `audit-fuel-${m.id}`,
            date: new Date().toISOString().split('T')[0],
            type: 'fuel',
            description: `Consumo Estimado: ${m.name} (${m.brand} ${m.model}) - ISO-BUS Telemetry`,
            value: Number(metric.toFixed(3)),
            isobus: !!m.isobusData
        });
    });

    // 2. Calculate Fertilizer Emissions
    let fertilizerEmissions = 0;
    logs.forEach(log => {
        if (log.type === 'fertilization' || (log.type === 'treatment' && log.productName?.toLowerCase().includes('adubo'))) {
            const kgN = log.quantity || 50;
            const metric = (kgN * FACTORS.N_FERTILIZER_KG_CO2_KG) / 1000;
            fertilizerEmissions += metric;

            auditLogs.push({
                id: log.id,
                date: log.date,
                type: 'fertilizer',
                description: `Aplicação: ${log.productName || 'Fertilizante N'} em área tratada`,
                value: Number(metric.toFixed(3)),
                evidence: log.attachments
            });
        }
    });

    // 3. Calculate Sequestration
    let cropSequestration = 0;
    fields.forEach(f => {
        const rate = SEQUESTRATION_RATES[f.crop] || 0.5;
        const metric = (f.areaHa * rate);
        cropSequestration += metric;

        auditLogs.push({
            id: `audit-seq-${f.id}`,
            date: new Date().toISOString().split('T')[0],
            type: 'sequestration',
            description: `Sequestro Biológico: ${f.crop} (${f.areaHa} ha)`,
            value: Number(metric.toFixed(3))
        });
    });

    // 4. Totals
    const totalEmissions = fuelEmissions + fertilizerEmissions;
    const totalSequestration = cropSequestration;
    const netBalance = totalEmissions - totalSequestration;

    const creditAmount = netBalance < 0 ? Math.abs(netBalance) : 0;
    const creditValue = creditAmount * FACTORS.CARBON_PRICE_EUR_TON;

    return {
        emissions: {
            fuel: Number(fuelEmissions.toFixed(2)),
            fertilizer: Number(fertilizerEmissions.toFixed(2)),
            total: Number(totalEmissions.toFixed(2))
        },
        sequestration: {
            crops: Number(cropSequestration.toFixed(2)),
            soil: 0,
            total: Number(totalSequestration.toFixed(2))
        },
        netBalance: Number(netBalance.toFixed(2)),
        potentialCredits: {
            amount: Number(creditAmount.toFixed(2)),
            value: Number(creditValue.toFixed(2))
        },
        auditLogs: auditLogs.sort((a, b) => b.date.localeCompare(a.date))
    };
}
