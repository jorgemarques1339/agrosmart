import { UserProfile, WeatherForecast, DetailedForecast, Task, Field, Machine, StockItem } from '../types';

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

export const generateCopilotResponse = async (
    prompt: string,
    contextData: ContextData,
    onChunk?: (chunk: string) => void
): Promise<string> => {
    // Em uma aplicação real, aqui faríamos um call para um endpoint da nossa API 
    // (e.g., Supabase Edge Function ou uma API Gateway) passando o prompt e o contextData.

    // Para fins desta implementação, vamos simular uma resposta do LLM que parece ciente
    // do contexto passado e demora um pouco para simular a rede.

    const contextStr = `
    O meu nome é ${contextData.userName}.
    O tempo atual é ${contextData.weather?.[0]?.temp ?? 'desconhecido'}°C e ${contextData.weather?.[0]?.condition ?? 'desconhecido'}.
    Temos ${contextData.tasks.filter(t => !t.completed).length} tarefas pendentes.
    Existem ${contextData.machines.length} máquinas registadas (${contextData.machines.filter(m => m.status === 'active').length} ativas).
    E temos ${contextData.stocks.length} itens no stock.
  `;

    const systemPrompt = `
  Você é o FarmCopilot, um assistente especializado em gestão agrícola moderna. 
  Responda de forma concisa e útil.
  Contexto da Fazenda: ${contextStr}
  `;

    console.log("LLM Context Builder:", systemPrompt);
    console.log("User Prompt:", prompt);

    // Simulated AI response generation based on basic keyword matching for demo purposes
    let response = "";
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes("tempo") || lowerPrompt.includes("meteorologia") || lowerPrompt.includes("chuva")) {
        response = `O tempo hoje está ${contextData.weather[0]?.condition} com ${contextData.weather[0]?.temp}°C. ${contextData.weather[0]?.condition === 'rain' ? 'Não recomendo pulverizações hoje.' : 'As condições são ideais para trabalho no campo.'}`;
    } else if (lowerPrompt.includes("máquina") || lowerPrompt.includes("trator")) {
        const brokenMachines = contextData.machines.filter(m => m.status === 'maintenance');
        if (brokenMachines.length > 0) {
            response = `Temos ${brokenMachines.length} máquina(s) em manutenção, nomeadamente: ${brokenMachines.map(m => m.name).join(', ')}. As restantes estão operacionais.`;
        } else {
            response = `Todas as ${contextData.machines.length} máquinas estão operacionais e prontas a usar.`;
        }
    } else if (lowerPrompt.includes("stock") || lowerPrompt.includes("inventário")) {
        response = `Nós temos ${contextData.stocks.length} itens no armazém. Recomendaria verificar se os níveis de adubo estão suficientes para a próxima época.`;
    } else if (lowerPrompt.includes("tarefa") || lowerPrompt.includes("fazer")) {
        response = `Temos ${contextData.tasks.filter(t => !t.completed).length} tarefas para concluir. Que tal começar por verificar o estado das parcelas principais?`;
    } else {
        response = `Compreendo. Como gestor desta exploração, estou aqui para ajudar a otimizar a sua produção. As suas ${contextData.fields.length} parcelas parecem estar dentro dos parâmetros normais. O que precisa de saber mais?`;
    }

    // Simulate network delay and streaming
    await new Promise(resolve => setTimeout(resolve, 800));

    if (onChunk) {
        const chunks = response.split(' ');
        for (let i = 0; i < chunks.length; i++) {
            onChunk(chunks[i] + ' ');
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    return response;
}
