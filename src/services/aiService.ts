import { UserProfile, WeatherForecast, DetailedForecast, Task, Field, Machine, StockItem } from '../types';
import { GoogleGenAI } from '@google/genai';

export interface ContextData {
    userName: string;
    users: UserProfile[];
    weather: WeatherForecast[];
    hourlyForecast: DetailedForecast[];
    tasks: Task[];
    fields: Field[];
    machines: Machine[];
    stocks: StockItem[];
}

// Initialize Gemini Client
// We use VITE_GEMINI_API_KEY from environment variables.
// Note: In a real production app, exposing the API key to the client is dangerous.
// This should ideally be routed through a backend proxy.
const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
});

export const generateCopilotResponse = async (
    prompt: string,
    contextData: ContextData,
    onChunk?: (chunk: string) => void
): Promise<string> => {
    try {
        const contextStr = `
        O meu nome é ${contextData.userName}.
        O tempo atual é ${contextData.weather?.[0]?.temp ?? 'desconhecido'}°C e ${contextData.weather?.[0]?.condition ?? 'desconhecido'}.
        Temos ${contextData.tasks.filter(t => !t.completed).length} tarefas pendentes.
        Existem ${contextData.machines.length} máquinas registadas (${contextData.machines.filter(m => m.status === 'active').length} ativas).
        E temos ${contextData.stocks.length} itens no stock.
        `;

        const systemPrompt = `
        Você é o FarmCopilot, um assistente de inteligência artificial de elite especializado em gestão agrícola moderna para a plataforma AgroSmart.
        As suas respostas devem ser úteis, altamente proativas, e focadas em otimizar a exploração agrícola.
        Responda sempre de forma profissional, clara e concisa (evite textos demasiado longos).
        Se identificar problemas no contexto, sugira soluções ou ações imediatas para a equipa.
        
        Contexto Atual da Exploração em Tempo Real:
        ${contextStr}
        `;

        if (!import.meta.env.VITE_GEMINI_API_KEY) {
            // Fallback to simulation if no API key is set
            return simulateFallbackResponse(prompt, contextData, onChunk);
        }

        console.log("FarmCopilot: Calling Gemini API...");

        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: [
                { role: 'user', parts: [{ text: systemPrompt + '\n\nPedido do utilizador: ' + prompt }] }
            ],
            config: {
                temperature: 0.7,
            }
        });

        let fullResponse = "";
        for await (const chunk of responseStream) {
            const chunkText = chunk.text || "";
            fullResponse += chunkText;
            if (onChunk) {
                onChunk(chunkText);
            }
        }

        return fullResponse;

    } catch (error) {
        console.error("FarmCopilot LLM Error:", error);
        return "Lamento, encontrei um erro de rede ao contactar a central de Inteligência Artificial. Por favor verifique a configuração da sua API Key ou tente novamente mais tarde.";
    }
}

// Keep the old simulated response active ONLY as a fallback if no API key is found
const simulateFallbackResponse = async (prompt: string, contextData: ContextData, onChunk?: (chunk: string) => void) => {
    let response = "Aviso: Nenhuma chave de API detetada. Detenho a simulação... ";
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes("tempo") || lowerPrompt.includes("meteorologia") || lowerPrompt.includes("chuva")) {
        response += `O tempo hoje está ${contextData.weather[0]?.condition} com ${contextData.weather[0]?.temp}°C. ${contextData.weather[0]?.condition === 'rain' ? 'Não recomendo pulverizações hoje.' : 'As condições são ideais para trabalho no campo.'}`;
    } else if (lowerPrompt.includes("máquina") || lowerPrompt.includes("trator")) {
        const brokenMachines = contextData.machines.filter(m => m.status === 'maintenance');
        if (brokenMachines.length > 0) {
            response += `Temos ${brokenMachines.length} máquina(s) em manutenção, nomeadamente: ${brokenMachines.map(m => m.name).join(', ')}. As restantes estão operacionais.`;
        } else {
            response += `Todas as ${contextData.machines.length} máquinas estão operacionais e prontas a usar.`;
        }
    } else if (lowerPrompt.includes("stock") || lowerPrompt.includes("inventário")) {
        response += `Nós temos ${contextData.stocks.length} itens no armazém. Recomendaria verificar se os níveis de adubo estão suficientes para a próxima época.`;
    } else if (lowerPrompt.includes("tarefa") || lowerPrompt.includes("fazer")) {
        response += `Temos ${contextData.tasks.filter(t => !t.completed).length} tarefas para concluir. Que tal começar por verificar o estado das parcelas principais?`;
    } else {
        response += `Compreendo. Como gestor desta exploração, estou aqui para ajudar a otimizar a sua produção. As suas ${contextData.fields.length} parcelas parecem estar dentro dos parâmetros normais. O que precisa de saber mais?`;
    }

    await new Promise(resolve => setTimeout(resolve, 800));

    if (onChunk) {
        const chunks = response.split(' ');
        for (let i = 0; i < chunks.length; i++) {
            onChunk(chunks[i] + ' ');
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    return response;
};
