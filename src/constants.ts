
import { Animal, AppState, Field, StockItem, Task, Transaction, WeatherForecast, Machine, Employee, UserProfile } from './types';

export const INITIAL_WEATHER: WeatherForecast[] = [
  { day: 'Seg', temp: 22, condition: 'sunny' },
  { day: 'Ter', temp: 24, condition: 'cloudy' },
  { day: 'Qua', temp: 19, condition: 'rain' },
  { day: 'Qui', temp: 21, condition: 'cloudy' },
  { day: 'Sex', temp: 25, condition: 'sunny' },
];

const MOCK_USERS: UserProfile[] = [
  { id: 'u1', name: 'Carlos Dono', role: 'admin', avatar: 'CD', specialty: 'Gestão' },
  { id: 'u2', name: 'João Tratorista', role: 'operator', avatar: 'JT', specialty: 'Máquinas' },
  { id: 'u3', name: 'Maria Vet', role: 'operator', avatar: 'MV', specialty: 'Animais' },
];

export const MOCK_STATE: AppState = {
  users: MOCK_USERS,
  employees: [
    { id: 'e1', name: 'João Silva', role: 'Ajudante Geral', hourlyRate: 7.50 },
    { id: 'e2', name: 'Maria Santos', role: 'Tratorista', hourlyRate: 9.00 }
  ],
  tasks: [
    { 
      id: '1', 
      title: 'Aplicar Fungicida Vinha A', 
      date: new Date().toISOString().split('T')[0], 
      type: 'task', 
      completed: false, 
      status: 'pending',
      assignedTo: 'u2' // João
    },
    { 
      id: '2', 
      title: 'Colheita Milho Híbrido', 
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0], 
      type: 'harvest', 
      completed: false, 
      status: 'pending' 
    },
  ],
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
      notes: 'Animal com excelente historial produtivo. Vacinação em dia.',
      productionHistory: [
        { date: '2023-10-20', value: 28, type: 'milk' },
        { date: '2023-10-21', value: 30, type: 'milk' },
        { date: '2023-10-22', value: 29, type: 'milk' },
        { date: '2023-10-23', value: 31, type: 'milk' },
        { date: '2023-10-24', value: 30, type: 'milk' },
      ],
      reproductionStatus: 'pregnant',
      conceptionDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(), // ~6 months pregnant
      lineage: {
        motherName: 'Estrela',
        fatherName: 'Touro X200',
        notes: 'Gestante de: Touro X200'
      }
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
      notes: 'A apresentar sinais de mastite leve. Sob observação.',
      productionHistory: [
        { date: '2023-10-20', value: 15, type: 'milk' },
        { date: '2023-10-21', value: 14, type: 'milk' },
        { date: '2023-10-22', value: 12, type: 'milk' },
      ],
      reproductionStatus: 'empty',
      lineage: {
        fatherName: 'Touro Y100'
      }
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
      notes: 'Ganho de peso constante. Preparação para reprodução.',
      productionHistory: [
        { date: '2023-09-01', value: 680, type: 'weight' },
        { date: '2023-10-01', value: 710, type: 'weight' },
      ],
      reproductionStatus: 'heat',
      lineage: {
        motherName: 'Mimosa',
        fatherName: 'Touro Z50'
      }
    }
  ],
  fields: [
    {
      id: 'f1',
      name: 'Vinha do Monte',
      emoji: '🍇',
      crop: 'Uva Alvarinho',
      areaHa: 4.5,
      yieldPerHa: 8.5,
      coordinates: [41.442, -8.723], // Laundos approx
      polygon: [[41.442, -8.723], [41.443, -8.721], [41.441, -8.720], [41.440, -8.724]],
      irrigationStatus: false,
      humidity: 45,
      temp: 18,
      healthScore: 92,
      harvestWindow: 'Setembro 15-30',
      history: [
        { time: '08:00', humidity: 60, ndvi: 0.7 },
        { time: '12:00', humidity: 45, ndvi: 0.72 },
        { time: '16:00', humidity: 40, ndvi: 0.71 },
        { time: '20:00', humidity: 55, ndvi: 0.7 }
      ],
      logs: [
        { id: 'l1', date: '2023-10-01', type: 'observation', description: 'Início da maturação.' },
        { id: 'l2', date: '2023-10-05', type: 'treatment', description: 'Aplicação preventiva de enxofre.' }
      ]
    },
    {
      id: 'f2',
      name: 'Campo da Veiga',
      emoji: '🌽',
      crop: 'Milho Silagem',
      areaHa: 12.0,
      yieldPerHa: 45.0,
      coordinates: [41.435, -8.710],
      polygon: [[41.435, -8.710], [41.438, -8.705], [41.432, -8.705], [41.431, -8.712]],
      irrigationStatus: true,
      humidity: 68,
      temp: 20,
      healthScore: 75,
      harvestWindow: 'Outubro 01-10',
      history: [
        { time: '08:00', humidity: 80, ndvi: 0.6 },
        { time: '12:00', humidity: 65, ndvi: 0.62 },
        { time: '16:00', humidity: 50, ndvi: 0.65 },
        { time: '20:00', humidity: 70, ndvi: 0.6 }
      ],
      logs: [
        { id: 'l1', date: '2023-09-15', type: 'observation', description: 'Detetada ligeira infestação de lagarta.' }
      ]
    }
  ],
  stocks: [
    { id: 's1', name: 'NPK 10-10-10', category: 'Fertilizante', quantity: 1500, unit: 'kg', minStock: 500, pricePerUnit: 1.20 },
    { id: 's2', name: 'Semente Milho Bayer', category: 'Semente', quantity: 8, unit: 'sacos', minStock: 10, pricePerUnit: 85.00 },
    { id: 's3', name: 'Gasóleo Agrícola', category: 'Combustível', quantity: 240, unit: 'L', minStock: 100, pricePerUnit: 1.15 },
  ],
  transactions: [
    { id: 't1', date: '2023-10-01', type: 'expense', amount: 450, category: 'Manutenção', description: 'Reparação Trator' },
    { id: 't2', date: '2023-10-15', type: 'income', amount: 3200, category: 'Vendas', description: 'Venda Leitão' },
  ],
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
      engineHours: 150000, // Km no caso de veiculos
      lastServiceHours: 145000,
      serviceInterval: 10000,
      nextInspectionDate: '2023-11-01', // Próxima data
      status: 'active',
      fuelLevel: 40,
      logs: []
    }
  ],
  harvests: [] // Initial empty state for harvests
};

export const STORAGE_KEY = 'oriva_enterprise_v1';
export const MQTT_BROKER = 'wss://broker.emqx.io:8084/mqtt'; // Using public websocket broker
export const MQTT_TOPIC_PREFIX = 'oriva/fields';
