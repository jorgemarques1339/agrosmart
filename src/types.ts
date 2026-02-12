export interface WeatherForecast {
  day: string;
  temp: number;
  condition: 'sunny' | 'cloudy' | 'rain' | 'storm';
}

export interface Task {
  id: string;
  title: string;
  date: string; // ISO date
  type: 'task' | 'harvest';
  completed: boolean;
}

export interface ProductionRecord {
  date: string;
  value: number;
  type: 'milk' | 'weight'; // Distinguish between milk liters and weight kg
}

export interface Animal {
  id: string;
  tagId: string; // NFC Tag
  name: string;
  breed: string;
  birthDate: string;
  age: string; // Display string e.g. "4 Anos"
  weight: number; // Current weight in kg
  status: 'healthy' | 'sick' | 'pregnancy' | 'attention';
  productionHistory: ProductionRecord[];
  lastCheckup: string;
  notes?: string;
}

export interface FieldLog {
  id: string;
  date: string;
  type: 'observation' | 'treatment' | 'harvest';
  description: string;
}

export interface FieldHistory {
  time: string;
  humidity: number;
  ndvi: number;
}

export interface Field {
  id: string;
  name: string;
  emoji: string; // Visual identifier
  crop: string;
  areaHa: number;
  yieldPerHa: number; // Potential yield per hectare
  coordinates: [number, number]; // Lat, Lng center
  polygon: [number, number][];
  irrigationStatus: boolean;
  humidity: number; // MQTT value
  temp: number; // Soil/Air temperature
  healthScore: number; // 0-100
  harvestWindow: string; // Prediction text
  history: FieldHistory[]; // Graph data
  logs: FieldLog[]; // Journal
}

export interface StockItem {
  id: string;
  name: string;
  // Expanded categories to support legacy data and new requirements
  category: 'Fertilizante' | 'Semente' | 'Fito' | 'Combustível' | 'Ração' | 'Medicamento' | 'Outro'; 
  quantity: number;
  unit: string;
  minStock: number;
  pricePerUnit: number;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
}

export interface AppState {
  tasks: Task[];
  animals: Animal[];
  fields: Field[];
  stocks: StockItem[];
  transactions: Transaction[];
}