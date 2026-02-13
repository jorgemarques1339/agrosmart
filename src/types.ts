
export interface WeatherForecast {
  day: string;
  temp: number;
  condition: 'sunny' | 'cloudy' | 'rain' | 'storm';
  description?: string; // Descrição detalhada (ex: "Céu limpo")
  windSpeed?: number; // km/h
  humidity?: number; // %
  uv?: number;
}

export interface Task {
  id: string;
  title: string;
  date: string; // ISO date
  type: 'task' | 'harvest';
  completed: boolean;
  // Resource Linking (Optional)
  relatedFieldId?: string; // Qual o campo alvo?
  relatedStockId?: string; // Que produto vai ser usado?
  plannedQuantity?: number; // Quanto vai ser usado?
  resourceDeducted?: boolean; // Flag para saber se já descontou do stock
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
  cost?: number; // Custo associado à operação
  quantity?: number; // Quantidade de produto utilizado
  unit?: string;
}

export interface FieldHistory {
  time: string;
  humidity: number;
  ndvi: number;
}

export interface Sensor {
  id: string;
  type: 'moisture' | 'weather' | 'valve' | 'camera';
  name: string;
  batteryLevel: number; // 0-100
  signalStrength: number; // 0-100 (RSSI logic)
  lastSeen: string;
  status: 'online' | 'offline' | 'pairing';
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
  sensors?: Sensor[]; // Connected IoT Devices
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

export interface MaintenanceLog {
  id: string;
  date: string;
  type: 'fuel' | 'oil_change' | 'repair' | 'inspection' | 'other';
  description: string;
  cost: number;
  engineHoursAtLog: number;
  quantity?: number; // Liters of fuel or parts count
}

export interface Machine {
  id: string;
  name: string;
  brand: string;
  model: string;
  plate: string;
  type: 'tractor' | 'harvester' | 'vehicle' | 'implement';
  engineHours: number; // Horas atuais
  lastServiceHours: number; // Horas na ultima revisão
  serviceInterval: number; // Intervalo de revisão (ex: 500h)
  nextInspectionDate: string; // Data da inspeção obrigatória
  status: 'active' | 'maintenance' | 'broken';
  fuelLevel: number; // 0-100%
  image?: string;
  logs: MaintenanceLog[];
}

export interface AppState {
  tasks: Task[];
  animals: Animal[];
  fields: Field[];
  stocks: StockItem[];
  transactions: Transaction[];
  machines: Machine[];
}
