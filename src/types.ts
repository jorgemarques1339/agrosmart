
export interface WeatherForecast {
  day: string;
  temp: number;
  condition: 'sunny' | 'cloudy' | 'rain' | 'storm';
  description?: string; // Descrição detalhada (ex: "Céu limpo")
  windSpeed?: number; // km/h
  humidity?: number; // %
  uv?: number;
}

export interface DetailedForecast {
  dt: number; // Timestamp
  temp: number;
  windSpeed: number; // km/h
  humidity: number; // %
  rainProb: number; // 0-100% (Pop)
}

export interface UserProfile {
  id: string;
  name: string;
  role: 'admin' | 'operator';
  avatar: string; // URL ou Initials
  specialty?: string; // ex: "Veterinária", "Máquinas"
  safetyStatus?: {
    status: 'safe' | 'warning' | 'emergency';
    lastMovement: string; // ISO timestamp
    location?: [number, number];
    batteryLevel?: number;
  };
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

  // Team Connect Fields
  assignedTo?: string; // ID do User
  status?: 'pending' | 'review' | 'done'; // Workflow status
  proofImage?: string; // Base64 proof
  feedback?: string; // Admin feedback
}

export interface ProductionRecord {
  date: string;
  value: number;
  type: 'milk' | 'weight'; // Distinguish between milk liters and weight kg
}

export interface AnimalEvent {
  id: string;
  date: string;
  type: 'birth' | 'insemination' | 'heat' | 'dry-off';
  description: string;
}

export interface AnimalBatch {
  id: string;
  name: string;
  species: string; // e.g. "Ovinos", "Suínos"
  animalCount: number;
  averageWeight: number;
  status: 'healthy' | 'sick' | 'attention';
  productionHistory: ProductionRecord[]; // For batch average weight tracking etc
  history: FieldLog[]; // Mass actions history
  lastCheckup: string;
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

  // Reproduction & Lineage (New)
  reproductionStatus?: 'empty' | 'pregnant' | 'heat' | 'post-partum';
  conceptionDate?: string; // ISO Date if pregnant
  lineage?: {
    motherId?: string;
    motherName?: string;
    fatherId?: string;
    fatherName?: string; // Bull name/code
    notes?: string;
  };
  events?: AnimalEvent[];

  productionHistory: ProductionRecord[];
  lastCheckup: string;
  notes?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  hourlyRate: number; // Custo por hora em €
}

export interface FieldLog {
  id: string;
  date: string;
  type: 'observation' | 'treatment' | 'harvest' | 'fertilization' | 'irrigation' | 'labor' | 'analysis'; // Added 'analysis'


  description: string;
  attachments?: string[]; // URLs or Base64

  // Technical / Legal Fields (Optional but recommended for Notebook)
  productName?: string; // Nome Comercial
  apv?: string; // Autorização de Venda
  activeSubstance?: string; // Substância Ativa
  target?: string; // Praga/Doença Alvo
  safetyDays?: number; // Intervalo Segurança (Dias)
  operator?: string; // Aplicador (Texto livre ou nome do funcionário)

  // Labor Specifics
  employeeId?: string;
  hoursWorked?: number;
  hourlyRate?: number;

  cost?: number;
  quantity?: number;
  unit?: string;
}

export type RegistryType = FieldLog['type'];

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
  metadata?: {
    protocol: 'mqtt' | 'ble' | 'serial';
    deviceId?: string; // BLE device ID or Serial Port path
    serviceUuid?: string;
    characteristicUuid?: string;
  };
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
  missions?: Mission[]; // Autonomous Missions (Drones/Robots)
  slope?: number; // Average terrain slope in degrees
}

export interface Mission {
  id: string;
  type: 'drone' | 'autonomous_tractor';
  name: string;
  status: 'idle' | 'running' | 'completed' | 'alert';
  progress: number; // 0-100
  route: [number, number][]; // Waypoints
  currentPosition?: [number, number];
  batteryLevel: number;
  altitude?: number; // meters (drones)
  lastUpdate: string;
}

export interface StockItem {
  id: string;
  name: string;
  // Expanded categories to support legacy data and new requirements
  category: 'Fertilizante' | 'Semente' | 'Fito' | 'Combustível' | 'Ração' | 'Medicamento' | 'Colheita' | 'Outro';
  quantity: number;
  unit: string;
  minStock: number;
  pricePerUnit: number;
  supplier?: string;
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
  mechanic?: string; // Nome do mecânico/oficina
  attachments?: string[]; // URLs ou Base64 de fotos/PDFs
  quantity?: number; // Liters of fuel or parts count
  workIntensity?: 'heavy' | 'standard' | 'light';
}

export interface ISOBUSData {
  engineRpm: number;
  groundSpeed: number;
  fuelRate: number;
  ptoSpeed: number;
  hydraulicPressure: number;
  engineLoad: number;
  coolantTemp: number;
  dtc: string[]; // Diagnostic Trouble Codes
  lastUpdate: string; // ISO Date
}

export interface SystemAlert {
  id: string;
  system: 'Motor' | 'Hidráulico' | 'Transmissão' | 'Geral';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  probability: number; // 0-100
  recommendation: string;
}

export interface Machine {
  id: string;
  name: string;
  brand: string;
  model: string;
  plate: string;
  type: 'tractor' | 'harvester' | 'vehicle' | 'implement' | 'drone' | 'autonomous_tractor';
  engineHours: number; // Horas atuais
  lastServiceHours: number; // Horas na ultima revisão
  serviceInterval: number; // Intervalo de revisão (ex: 500h)
  nextInspectionDate: string; // Data da inspeção obrigatória
  status: 'active' | 'maintenance' | 'broken';
  fuelLevel: number; // 0-100%
  stressLevel: number; // 0-100 (Mechanical Stress AI Index)
  image?: string;
  specs: {
    powerHp: number;
    fuelCapacity: number;
    maxSpeed: number;
  };
  logs: MaintenanceLog[];
  isobusData?: ISOBUSData; // Conceptual ISOBUS Bridge data
}

// --- Mercados & Cotações ---
export interface MarketPrice {
  id: string;
  name: string; // Ex: Trigo Panificável, Milho, Cevada
  price: number;
  change: number; // Percentagem de variação
  unit: string; // Ex: €/ton
  market: 'Euronext' | 'SIMA' | 'CBOT';
  lastUpdate: string;
  history: { date: string; price: number }[];
}

// --- Oriva Vision v2 ---
export type MediterraneanCulture = 'Vinha' | 'Olival' | 'Pomar' | 'Hortícolas' | 'Cereais';

export interface AgriculturalDisease {
  id: string;
  name: string;
  scientificName?: string;
  culture: MediterraneanCulture;
  symptoms: string[];
  treatment: {
    immediate: string;
    preventive: string;
    products?: string[];
  };
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface DiagnosticResult {
  id: string;
  culture: MediterraneanCulture;
  disease?: AgriculturalDisease;
  confidence: number;
  timestamp: string;
  imageUrl?: string;
  coordinates?: [number, number];
}
export interface ProductBatch {
  batchId: string; // e.g. "AGRO-2026-MILHO-04"
  crop: string; // "Mirtilos Premium"
  harvestDate: string; // ISO date
  origin: string; // "Laundos, Portugal"
  coordinates: [number, number];
  quantity: number; // New: Total harvested
  unit: string; // New: Unit (Ton, kg)
  stats: {
    sunDays: number;
    waterSavedLitres?: number;
    harvestMethod: string;
  };
  farmerName: string;
  imageUrl?: string;
}

export interface AppState {
  users: UserProfile[]; // Team Connect
  tasks: Task[];
  animals: Animal[];
  fields: Field[];
  stocks: StockItem[];
  transactions: Transaction[];
  animalBatches: AnimalBatch[];
  machines: Machine[];
  employees: Employee[];
  harvests: ProductBatch[];
  notifications: Notification[];
  reclaimCredits: (amount: number, value: number) => Promise<void>;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'critical' | 'info' | 'task' | 'success';
  timestamp: string;
  read: boolean;
  actionLink?: string;
  relatedId?: string;
}
