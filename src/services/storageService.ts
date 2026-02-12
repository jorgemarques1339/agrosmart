import { MOCK_STATE, STORAGE_KEY } from '../constants';
import { AppState } from '../types';

export const loadState = (): AppState => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      return MOCK_STATE;
    }
    return JSON.parse(serializedState);
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