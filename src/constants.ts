
import { Animal, AppState, Field, StockItem, Task, Transaction, WeatherForecast, Machine, Employee, UserProfile, AnimalBatch } from './types';

export const INITIAL_WEATHER: WeatherForecast[] = [
  { day: 'Seg', temp: 22, condition: 'sunny' },
  { day: 'Ter', temp: 24, condition: 'cloudy' },
  { day: 'Qua', temp: 19, condition: 'rain' },
  { day: 'Qui', temp: 21, condition: 'cloudy' },
  { day: 'Sex', temp: 25, condition: 'sunny' },
];

const MOCK_USERS: UserProfile[] = [
  {
    id: 'u1', name: 'Carlos (Admin)', role: 'admin', avatar: 'CD', specialty: 'Administrador',
    safetyStatus: { status: 'safe', lastMovement: new Date().toISOString(), batteryLevel: 85 }
  },
  {
    id: 'u2', name: 'João Tratorista', role: 'mechanic', avatar: 'JT', specialty: 'Mecânico',
    safetyStatus: {
      status: 'warning',
      lastMovement: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      location: [41.442, -8.723],
      batteryLevel: 12
    }
  },
  {
    id: 'u3', name: 'Sílvia Vet', role: 'vet', avatar: 'SV', specialty: 'Veterinária',
    safetyStatus: { status: 'safe', lastMovement: new Date().toISOString(), batteryLevel: 92 }
  },
  {
    id: 'u4', name: 'Ricardo Horta', role: 'farmer', avatar: 'RH', specialty: 'Agricultor',
    safetyStatus: { status: 'safe', lastMovement: new Date().toISOString(), batteryLevel: 78 }
  },
  {
    id: 'u5', name: 'Jorge Marques (Master)', role: 'admin', avatar: 'JM', specialty: 'Administrador Geral',
    username: 'jorge_marques',
    password: 'Cax1nasCity',
    safetyStatus: { status: 'safe', lastMovement: new Date().toISOString(), batteryLevel: 100 }
  },
];

const MOCK_BATCHES: AnimalBatch[] = [
  {
    id: 'b1',
    name: 'Lote 01 - Ovelhas Campaniças',
    species: 'Ovinos',
    animalCount: 45,
    averageWeight: 52,
    status: 'healthy',
    productionHistory: [
      { date: '2023-10-01', value: 50, type: 'weight' },
      { date: '2023-10-15', value: 52, type: 'weight' },
    ],
    history: [
      { id: 'h1', date: '2023-10-10', type: 'treatment', description: 'Vacinação em Massa: Febre Aftosa' }
    ],
    medicalHistory: [
      { id: 'm1', date: '2023-10-10', type: 'vaccine', description: 'Vacinação em Massa: Febre Aftosa', drugName: 'BioVax', dosage: '2ml', administeredBy: 'Dra. Sílvia' }
    ],
    lastCheckup: '2023-10-15'
  }
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx1', date: '2023-10-01', type: 'income', amount: 15000, description: 'Venda: Milho Silagem (40 Ton)', category: 'Vendas', relatedCrop: 'Milho Silagem' },
  { id: 'tx2', date: '2023-10-05', type: 'expense', amount: 450, description: 'Reparação: Trator Principal', category: 'Manutenção' },
  { id: 'tx3', date: '2023-10-10', type: 'income', amount: 8500, description: 'Venda: Uva Alvarinho (12 Ton)', category: 'Vendas', relatedCrop: 'Uva Alvarinho' },
  { id: 'tx4', date: '2023-10-12', type: 'expense', amount: 1200, description: 'Stock: Fertilizante NPK', category: 'Stock' },
  { id: 'tx5', date: '2023-10-15', type: 'expense', amount: 350, description: 'Stock: Ração Gado', category: 'Stock' },
  { id: 'tx6', date: '2023-10-20', type: 'income', amount: 2000, description: 'Venda: Novilho PT-45921', category: 'Vendas', relatedCrop: 'Pecuária' }
];

export const MOCK_STATE: AppState = {
  users: MOCK_USERS,
  employees: [
    { id: 'e1', name: 'João Silva', role: 'Ajudante Geral', hourlyRate: 7.50 },
    { id: 'e2', name: 'Maria Santos', role: 'Tratorista', hourlyRate: 9.00 }
  ],
  tasks: [],
  animalBatches: MOCK_BATCHES,
  animals: [
    {
      id: 'a1',
      tagId: 'PT-45921',
      name: 'Mimosa',
      breed: 'Holstein-Frísia',
      birthDate: '2019-03-12',
      age: '4 Anos',
      weight: 650,
      status: 'healthy',
      lastCheckup: '2023-10-01',
      productionHistory: [
        { date: '2023-10-20', value: 28, type: 'milk' },
        { date: '2023-10-21', value: 30, type: 'milk' },
        { date: '2023-10-22', value: 29, type: 'milk' },
        { date: '2023-10-23', value: 31, type: 'milk' },
        { date: '2023-10-24', value: 30, type: 'milk' },
      ],
      reproductionStatus: 'pregnant',
      conceptionDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
      lineage: { motherName: 'Estrela', fatherName: 'Touro X200', notes: 'Gestante de: Touro X200' },
      medicalHistory: []
    },
    {
      id: 'a2',
      tagId: 'PT-99100',
      name: 'Estrela',
      breed: 'Alentejana',
      birthDate: '2020-05-15',
      age: '3 Anos',
      weight: 580,
      status: 'sick',
      lastCheckup: '2023-10-24',
      productionHistory: [
        { date: '2023-10-20', value: 15, type: 'milk' },
        { date: '2023-10-21', value: 14, type: 'milk' },
        { date: '2023-10-22', value: 12, type: 'milk' },
      ],
      reproductionStatus: 'empty',
      lineage: { fatherName: 'Touro Y100' },
      medicalHistory: [
        { id: 'v1', date: '2023-10-24', type: 'treatment', description: 'Mastite clínica no quarto posterior esquerdo', drugName: 'MastiStop', dosage: '1 seringa', withdrawalDays: 5, withdrawalEndDate: '2023-10-29', administeredBy: 'Dra. Sílvia' }
      ],
      withdrawalEndDate: '2023-10-29'
    },
    {
      id: 'a3',
      tagId: 'PT-10293',
      name: 'Bravia',
      breed: 'Angus',
      birthDate: '2021-02-10',
      age: '2 Anos',
      weight: 710,
      status: 'healthy',
      lastCheckup: '2023-09-15',
      productionHistory: [
        { date: '2023-09-01', value: 680, type: 'weight' },
        { date: '2023-10-01', value: 710, type: 'weight' },
      ],
      reproductionStatus: 'heat',
      lineage: { motherName: 'Mimosa', fatherName: 'Touro Z50' },
      medicalHistory: []
    }
  ],
  fields: [
    {
      id: 'f1',
      name: 'Parcela Norte',
      emoji: '🌽',
      crop: 'Milho Silagem',
      areaHa: 12.5,
      yieldPerHa: 45,
      coordinates: [41.442, -8.723],
      polygon: [],
      irrigationStatus: true,
      humidity: 48,
      temp: 18,
      healthScore: 92,
      harvestWindow: '15 dias',
      history: [],
      logs: [
        { id: 'log1', date: '2023-09-15', type: 'fertilization', description: 'Aplicação NPK', cost: 850 },
        { id: 'log2', date: '2023-10-01', type: 'labor', description: 'Trabalhos de sementeira', cost: 320 }
      ]
    },
    {
      id: 'f2',
      name: 'Vinha Velha',
      emoji: '🍇',
      crop: 'Uva Alvarinho',
      areaHa: 5.2,
      yieldPerHa: 8,
      coordinates: [41.445, -8.725],
      polygon: [],
      irrigationStatus: false,
      humidity: 35,
      temp: 20,
      healthScore: 88,
      harvestWindow: 'Concluída',
      history: [],
      logs: [
        { id: 'log3', date: '2023-09-10', type: 'treatment', description: 'Tratamento anti-míldio', cost: 420 }
      ]
    }
  ],
  stocks: [
    { id: 's1', name: 'NPK 10-10-10', category: 'Fertilizante', quantity: 1500, unit: 'kg', minStock: 500, pricePerUnit: 1.20, supplier: 'FertPlus S.A.', supplierEmail: 'vendas@fertplus.pt' },
    { id: 's2', name: 'Semente Milho Bayer', category: 'Semente', quantity: 8, unit: 'sacos', minStock: 10, pricePerUnit: 85.00 },
    { id: 's3', name: 'Gasóleo Agrícola', category: 'Combustível', quantity: 240, unit: 'L', minStock: 100, pricePerUnit: 1.15, supplier: 'AgroComb, Lda', dailyUsage: 50 },
    { id: 's4', name: 'Ração Engorda Bovinos', category: 'Ração', quantity: 120, unit: 'kg', minStock: 100, pricePerUnit: 0.45, supplier: 'Raçōes do Norte, S.A.', supplierEmail: 'encomendas@racoesdonorte.pt', dailyUsage: 35 },
  ],
  transactions: MOCK_TRANSACTIONS,
  machines: [
    {
      id: 'm1',
      name: 'Trator Principal',
      brand: 'John Deere',
      model: '6120M',
      plate: '92-VX-12',
      type: 'tractor',
      engineHours: 4230,
      lastServiceHours: 4000,
      serviceInterval: 500,
      nextInspectionDate: '2024-05-15',
      status: 'active',
      fuelLevel: 65,
      stressLevel: 15,
      specs: { powerHp: 120, fuelCapacity: 250, maxSpeed: 40 },
      isobusData: {
        engineRpm: 1850, groundSpeed: 8.4, fuelRate: 12.5, ptoSpeed: 540,
        hydraulicPressure: 185, engineLoad: 68, coolantTemp: 82, dtc: [],
        lastUpdate: new Date().toISOString()
      },
      logs: [
        { id: 'l1', date: '2023-08-10', type: 'oil_change', description: 'Revisão das 4000h (Óleo + Filtros)', cost: 450, engineHoursAtLog: 4000 }
      ]
    },
    {
      id: 'm2',
      name: 'Carrinha da Quinta',
      brand: 'Toyota',
      model: 'Hilux',
      plate: 'AA-00-BB',
      type: 'vehicle',
      engineHours: 150000,
      lastServiceHours: 145000,
      serviceInterval: 10000,
      nextInspectionDate: '2023-11-01',
      status: 'active',
      fuelLevel: 40,
      stressLevel: 0,
      specs: { powerHp: 150, fuelCapacity: 80, maxSpeed: 160 },
      logs: []
    }
  ],
  harvests: [],
  notifications: [],

  // Minimal methods mock to satisfy type without runtime errors in fallback
  hydrate: async () => { },
  setActiveTab: () => { },
  setDarkMode: () => { },
  setSolarMode: () => { },
  setOnline: () => { },
  setWeatherData: () => { },
  setDetailedForecast: () => { },
  setCurrentUserId: () => { },
  setPermission: () => { },
  setFields: () => { },
  addField: async () => { },
  updateField: async () => { },
  deleteField: async () => { },
  setStocks: () => { },
  addStock: async () => { },
  updateStock: async () => { },
  deleteStock: async () => { },
  addAnimal: async () => { },
  updateAnimal: async () => { },
  addProduction: async () => { },
  addAnimalBatch: async () => { },
  updateAnimalBatch: async () => { },
  deleteAnimalBatch: async () => { },
  reclaimCredits: async () => { },
  applyBatchAction: async () => { },
  addMachine: async () => { },
  updateMachine: async () => { },
  addTask: async () => { },
  updateTask: async () => { },
  deleteTask: async () => { },
  updateUser: async () => { },
  addTransaction: async () => { },
  addNotification: async () => { },
  markNotificationRead: async () => { },
  toggleIrrigation: async () => { },
  addLogToField: async () => { },
  registerSale: async () => { },
  harvestField: async () => { },
  focusedTarget: null,
  setFocusedTarget: () => { },
  isHydrated: false,
  activeTab: 'dashboard',
  isDarkMode: false,
  isSolarMode: false,
  isOnline: true,
  weatherData: [],
  detailedForecast: [],
  currentUserId: 'u1',
  permissions: { gps: false, camera: false, nfc: false, motion: false }
} as AppState;

export const CROP_TYPES = [
  { label: 'Uva Alvarinho', emoji: '🍇' },
  { label: 'Milho Silagem', emoji: '🌽' },
  { label: 'Trigo', emoji: '🌾' },
  { label: 'Olival', emoji: '🫒' },
  { label: 'Pastagem', emoji: '🌿' }
];

export const STORAGE_KEY = 'oriva_enterprise_v1';
export const MQTT_BROKER = 'wss://broker.emqx.io:8084/mqtt';
export const MQTT_TOPIC_PREFIX = 'oriva/fields';
