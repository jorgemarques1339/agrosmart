
import { Machine, SystemAlert } from '../types';

/**
 * AI Predictive Analysis based on real-time ISO-BUS telemetry.
 * Detects anomalies and patterns to predict sub-system failures.
 */
export function analyzePredictiveHealth(machine: Machine): SystemAlert[] {
    const alerts: SystemAlert[] = [];
    const bus = machine.isobusData;

    if (!bus) return [];

    // 1. Engine Cooling & Turbo Stress
    if (bus.coolantTemp > 95 && bus.engineLoad > 85) {
        alerts.push({
            id: 'eng-01',
            system: 'Motor',
            severity: 'high',
            message: 'Sobreaquecimento crítico sob carga elevada detetado.',
            probability: 88,
            recommendation: 'Reduzir carga imediatamente e verificar radiadores.'
        });
    } else if (bus.coolantTemp > 90) {
        alerts.push({
            id: 'eng-02',
            system: 'Motor',
            severity: 'medium',
            message: 'Temperatura de refrigeração acima da curva nominal.',
            probability: 45,
            recommendation: 'Limpar filtros de ar e verificar nível de anticongelante.'
        });
    }

    // 2. Hydraulic System Fatigue
    if (bus.hydraulicPressure > 195) {
        alerts.push({
            id: 'hyd-01',
            system: 'Hidráulico',
            severity: 'high',
            message: 'Pico de pressão hidráulica constante detetado.',
            probability: 72,
            recommendation: 'Verificar válvulas de alívio e possíveis obstruções no fluxo.'
        });
    } else if (bus.hydraulicPressure > 185 && bus.engineLoad > 60) {
        alerts.push({
            id: 'hyd-02',
            system: 'Hidráulico',
            severity: 'low',
            message: 'Carga hidráulica em regime severo.',
            probability: 25,
            recommendation: 'Monitorizar ruídos na bomba hidráulica.'
        });
    }

    // 3. Transmission / Traction Stress
    if (bus.engineRpm > 2200 && bus.groundSpeed < 2) {
        alerts.push({
            id: 'trs-01',
            system: 'Transmissão',
            severity: 'high',
            message: 'Desfasamento rpm/velocidade: Possível patinagem severa.',
            probability: 65,
            recommendation: 'Verificar estado da embraiagem ou calibração da transmissão.'
        });
    }

    // 4. DTC (Diagnostic Trouble Codes) integration
    if (bus.dtc && bus.dtc.length > 0) {
        alerts.push({
            id: 'sys-01',
            system: 'Geral',
            severity: 'critical',
            message: `Códigos de erro ativos: ${bus.dtc.join(', ')}`,
            probability: 100,
            recommendation: 'Ligar computador de diagnóstico oficial para leitura de logs.'
        });
    }

    return alerts;
}

/**
 * Calculates the maintenance risk for a machine based on engine hours and mechanical stress.
 * AI Index Logic:
 * - 60% Weight: Hours progress toward service interval.
 * - 40% Weight: Mechanical stress level (intensity of work) + ISO-BUS Anomaly Index.
 */
export function calculateMaintenanceRisk(machine: Machine) {
    const hoursSinceService = machine.engineHours - machine.lastServiceHours;
    const hoursProgress = Math.min((hoursSinceService / machine.serviceInterval) * 100, 100);

    const alerts = analyzePredictiveHealth(machine);
    const alertStress = alerts.reduce((acc, alert) => {
        const weight = alert.severity === 'critical' ? 30 : alert.severity === 'high' ? 20 : alert.severity === 'medium' ? 10 : 5;
        return acc + weight;
    }, 0);

    // Risk index: hours progress (60%) + (stress level + alert score) (40%)
    const riskPercentage = Math.round((hoursProgress * 0.6) + (Math.min(machine.stressLevel + alertStress, 100) * 0.4));

    let level = 'Baixo';
    let color = 'text-emerald-500';
    let recommendation = 'Máquina em estado ideal.';

    if (riskPercentage > 85) {
        level = 'Crítico';
        color = 'text-red-500';
        recommendation = 'Manutenção imediata recomendada. Risco de falha mecânica elevado.';
    } else if (riskPercentage > 60) {
        level = 'Alto';
        color = 'text-orange-500';
        recommendation = 'Planear revisão para os próximos 2-3 dias úteis.';
    } else if (riskPercentage > 30) {
        level = 'Moderado';
        color = 'text-yellow-500';
        recommendation = 'Monitorizar performance. Stress mecânico detetado.';
    }

    return {
        percentage: riskPercentage,
        level,
        color,
        recommendation,
        hoursProgress,
        alerts // Include the specific predictive alerts
    };
}
