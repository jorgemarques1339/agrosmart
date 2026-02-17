
import { MOCK_STATE, STORAGE_KEY } from '../constants';
import { AppState } from '../types';

export const loadState = (): AppState => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      return MOCK_STATE;
    }
    const loadedState = JSON.parse(serializedState);
    
    // MIGRATION LOGIC:
    // Mesclar o estado carregado com o MOCK_STATE.
    // Isto garante que se adicionarmos novas funcionalidades (ex: machines, employees, harvests), 
    // os utilizadores antigos recebem os dados de exemplo em vez de 'undefined'.
    return {
      ...MOCK_STATE, // Valores por defeito 
      ...loadedState, // Valores do utilizador (sobrepõem os defeitos)
      // Forçar a existência de arrays críticos se estiverem em falta no objeto antigo
      machines: loadedState.machines || MOCK_STATE.machines,
      employees: loadedState.employees || MOCK_STATE.employees,
      tasks: loadedState.tasks || MOCK_STATE.tasks,
      animals: loadedState.animals || MOCK_STATE.animals,
      fields: loadedState.fields || MOCK_STATE.fields,
      stocks: loadedState.stocks || MOCK_STATE.stocks,
      transactions: loadedState.transactions || MOCK_STATE.transactions,
      harvests: loadedState.harvests || MOCK_STATE.harvests, // Add migration for harvests
    };
  } catch (err) {
    console.error("Failed to load state", err);
    return MOCK_STATE;
  }
};

export const saveState = (state: AppState) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (err) {
    console.error("Failed to save state", err);
  }
};