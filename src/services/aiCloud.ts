
import { DiagnosticResult, MediterraneanCulture } from '../types';
import { MEDITERRANEAN_DISEASES } from '../data/agriculturalDiseases';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini Client
const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
});

/**
 * AICloudService processes images using Gemini Vision API.
 * Falls back to simulation if no API key is provided.
 */
export class AICloudService {
    static async analyzeFrame(
        imageData: string,
        culture: MediterraneanCulture
    ): Promise<Partial<DiagnosticResult>> {

        if (!import.meta.env.VITE_GEMINI_API_KEY) {
            console.log("Oriva-Vision: No API Key found. Using simulation fallback.");
            await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
            const relevantDiseases = MEDITERRANEAN_DISEASES.filter(d => d.culture === culture);
            const topDisease = relevantDiseases[Math.floor(Math.random() * relevantDiseases.length)];
            return {
                disease: topDisease,
                confidence: Math.round(90 + Math.random() * 8),
                timestamp: new Date().toISOString()
            };
        }

        console.log(`Oriva-Vision: Calling Gemini Vision for culture: ${culture}...`);

        try {
            // Strip the base64 prefix if present (e.g., "data:image/jpeg;base64,")
            const base64Data = imageData.split(',')[1] || imageData;

            // Try to infer mime type from string, default to jpeg
            let mimeType = 'image/jpeg';
            if (imageData.startsWith('data:image/png')) mimeType = 'image/png';
            if (imageData.startsWith('data:image/webp')) mimeType = 'image/webp';

            const prompt = `
            És o Oriva-Vision, um perito agrónomo especializado na deteção de doenças, pragas e carências nutricionais em culturas mediterrânicas.
            Analisa a imagem fornecida para uma cultura de "${culture}".
            
            Retorna a resposta estritamente no seguinte formato JSON, sem Markdown ou texto adicional:
            {
              "id": "identificador_unico_curto_em_minusculas",
              "name": "Nome da Doença ou Praga ou 'Saudável'",
              "scientificName": "Nome Científico (opcional)",
              "symptoms": ["Sintoma 1 visível na imagem", "Sintoma 2"],
              "severity": "Low" | "Medium" | "High" | "Critical",
              "treatment": {
                 "immediate": "Ação imediata a tomar",
                 "preventive": "Ação preventiva a longo prazo",
                 "products": ["Produto A", "Produto B"]
              },
              "confidence": numero inteiro de 0 a 100
            }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    prompt,
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType: mimeType
                        }
                    }
                ],
                config: {
                    temperature: 0.2, // Low temperature for more analytical/factual response
                    responseMimeType: 'application/json'
                }
            });

            if (response.text) {
                const parsedResult = JSON.parse(response.text);

                // Map the dynamic disease object and the confidence
                return {
                    disease: {
                        id: parsedResult.id || 'ai-detected',
                        name: parsedResult.name || 'Desconhecido',
                        scientificName: parsedResult.scientificName,
                        culture: culture,
                        symptoms: parsedResult.symptoms || ['Problema visualmente detetado'],
                        severity: parsedResult.severity || 'Medium',
                        treatment: parsedResult.treatment || {
                            immediate: 'Isolar a área afetada e consultar um agronomo.',
                            preventive: 'Monitorizar as parcelas adjacentes.'
                        }
                    },
                    confidence: parsedResult.confidence !== undefined ? parsedResult.confidence : 85,
                    timestamp: new Date().toISOString()
                };
            } else {
                throw new Error("Empty response from AI");
            }

        } catch (error) {
            console.error("Oriva-Vision AI Error:", error);
            // Fallback gracefully on error
            const relevantDiseases = MEDITERRANEAN_DISEASES.filter(d => d.culture === culture);
            const topDisease = relevantDiseases[Math.floor(Math.random() * relevantDiseases.length)];
            return {
                disease: topDisease,
                confidence: 50, // Low confidence to indicate fallback/error state
                timestamp: new Date().toISOString()
            };
        }
    }
}
