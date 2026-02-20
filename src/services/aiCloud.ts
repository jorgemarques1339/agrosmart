
import { DiagnosticResult, MediterraneanCulture } from '../types';
import { MEDITERRANEAN_DISEASES } from '../data/agriculturalDiseases';

/**
 * AICloudService simulates an Edge Function (Lambda) that processes images remotely.
 * This offloads heavy TensorFlow.js computation from the mobile device to save battery.
 */
export class AICloudService {
    /**
     * Simulates sending an image (Base64) to a remote lambda for analysis.
     */
    static async analyzeFrame(
        imageData: string,
        culture: MediterraneanCulture
    ): Promise<Partial<DiagnosticResult>> {
        // Simulate network latency (200-500ms)
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));

        // In a real scenario, we would POST the imageData to a Lambda:
        // const response = await fetch('https://edge-ai.oriva.harvest/analyze', { method: 'POST', body: imageData });
        // return response.json();

        // For simulation: filter diseases by culture and return a likely match
        const relevantDiseases = MEDITERRANEAN_DISEASES.filter(d => d.culture === culture);
        const topDisease = relevantDiseases[Math.floor(Math.random() * relevantDiseases.length)];

        return {
            disease: topDisease,
            confidence: Math.round(90 + Math.random() * 8),
            timestamp: new Date().toISOString()
        };
    }
}
