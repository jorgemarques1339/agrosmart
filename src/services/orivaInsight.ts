import { AppState } from '../store/useStore';
import { Transaction, Animal, StockItem, Machine, Task } from '../types';

export interface InsightResponse {
    answer: string;
    action?: { type: string; target?: string; action?: string };
    confidence: number;
}

export const processOrivaInsight = (transcript: string, state: AppState): InsightResponse | null => {
    const text = transcript.toLowerCase();

    // 1. FINANCE INSIGHTS
    if (text.includes('gasto') || text.includes('custo') || text.includes('dinheiro') || text.includes('contas')) {
        const totalExpenses = (state.transactions as Transaction[])
            .filter((t: Transaction) => t.type === 'expense')
            .reduce((acc: number, t: Transaction) => acc + t.amount, 0);

        const count = (state.transactions as Transaction[]).filter((t: Transaction) => t.type === 'expense').length;

        if (text.includes('quanto') || text.includes('total')) {
            return {
                answer: `Atualmente, tens um total de ${totalExpenses.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })} em despesas registadas através de ${count} transações.`,
                confidence: 0.9,
                action: { type: 'NAVIGATE', target: 'finance' }
            };
        }
    }

    // 2. ANIMAL INSIGHTS
    if (text.includes('animal') || text.includes('gado') || text.includes('peso') || text.includes('pecuária')) {
        const underweightAnimals = (state.animals as Animal[]).filter((a: Animal) => a.weight < 430);

        if (text.includes('peso') || text.includes('saúde') || text.includes('problema')) {
            if (underweightAnimals.length > 0) {
                return {
                    answer: `Identifiquei ${underweightAnimals.length} animais com peso abaixo do ideal (450kg), incluindo o ID ${underweightAnimals[0].id}. Queres ver a lista?`,
                    confidence: 0.9,
                    action: { type: 'NAVIGATE', target: 'animal' }
                };
            } else {
                return {
                    answer: "Todos os teus animais estão com o peso dentro dos parâmetros ideais para esta fase.",
                    confidence: 0.8
                };
            }
        }

        const totalAnimals = state.animals.length;
        return {
            answer: `Tens atualmente ${totalAnimals} animais registados na plataforma.`,
            confidence: 0.7,
            action: { type: 'NAVIGATE', target: 'animal' }
        };
    }

    // 3. STOCK INSIGHTS
    if (text.includes('stock') || text.includes('armazém') || text.includes('acabar') || text.includes('falta')) {
        const lowStock = (state.stocks as StockItem[]).filter((s: StockItem) => s.quantity < 20); // Critério de stock baixo

        if (lowStock.length > 0) {
            const names = lowStock.map((s: StockItem) => s.name).join(', ');
            return {
                answer: `Atenção: o stock de ${names} está abaixo do nível de alerta. Recomendo encomendar reforços.`,
                confidence: 0.9,
                action: { type: 'NAVIGATE', target: 'stocks' }
            };
        }
        return {
            answer: "Os teus níveis de stock estão estáveis em todos os itens principais.",
            confidence: 0.8
        };
    }

    // 4. MACHINE INSIGHTS
    if (text.includes('máquina') || text.includes('trator') || text.includes('consumo')) {
        const machinesWithIsobus = (state.machines as Machine[]).filter((m: Machine) => m.isobusData);
        if (machinesWithIsobus.length > 0) {
            const mainTrator = machinesWithIsobus[0];
            return {
                answer: `O ${mainTrator.name} está operacional com um consumo de ${mainTrator.isobusData?.fuelRate} L/h e carga de motor a ${mainTrator.isobusData?.engineLoad}%.`,
                confidence: 0.9,
                action: { type: 'NAVIGATE', target: 'machines' }
            };
        }
    }

    // 5. TASK INSIGHTS
    if (text.includes('tarefa') || text.includes('fazer') || text.includes('pendente')) {
        const pendingTasks = (state.tasks as Task[]).filter((t: Task) => !t.completed);
        if (pendingTasks.length > 0) {
            return {
                answer: `Tens ${pendingTasks.length} tarefas por concluir. A mais prioritária é: ${pendingTasks[0].title}.`,
                confidence: 0.9,
                action: { type: 'NAVIGATE', target: 'dashboard' }
            };
        }
        return {
            answer: "Bom trabalho! Não tens tarefas pendentes para hoje.",
            confidence: 0.8
        };
    }

    return null;
};
