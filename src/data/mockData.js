// --- CALENDÁRIO AGRÍCOLA INTELIGENTE ---
// Define as datas ideais e a produtividade esperada (toneladas/hectare) para a IA
export const CROP_CALENDAR = {
  '🌽': { plant: '15 Abril', harvest: '15 Setembro', label: 'Milho', yieldPerHa: 12 },
  '🍇': { plant: 'Jan-Mar (Poda)', harvest: 'Set-Out (Vindima)', label: 'Vinha', yieldPerHa: 8 },
  '🍅': { plant: '15 Março', harvest: '15 Julho', label: 'Tomate', yieldPerHa: 80 },
  '🥔': { plant: 'Fevereiro', harvest: 'Junho', label: 'Batata', yieldPerHa: 25 },
  '🥕': { plant: 'Março', harvest: 'Junho', label: 'Cenoura', yieldPerHa: 40 },
  '🌻': { plant: 'Abril', harvest: 'Agosto', label: 'Girassol', yieldPerHa: 2 },
  '🌾': { plant: 'Outubro', harvest: 'Junho', label: 'Trigo', yieldPerHa: 6 },
  '🍓': { plant: 'Novembro', harvest: 'Maio', label: 'Morango', yieldPerHa: 15 },
};

// --- DADOS PARA GRÁFICOS (Novos) ---
export const HUMIDITY_HISTORY_DATA = [
  { time: '08:00', hum: 45 }, 
  { time: '10:00', hum: 40 }, 
  { time: '12:00', hum: 35 },
  { time: '14:00', hum: 30 }, 
  { time: '16:00', hum: 42 }, 
  { time: '18:00', hum: 55 }
];

// --- ANIMAIS (Com histórico de produção de leite) ---
export const INITIAL_ANIMALS = [
  {
    id: 'PT-12345', 
    name: 'Mimosa', 
    type: 'Vaca Leiteira', 
    age: '4 Anos', 
    weight: '650kg',
    status: 'Saudável', 
    lastVetVisit: '10/01/2026', 
    notes: 'Produção leite acima da média.',
    feed: 'Ração A + Silagem', 
    needs: ['Suplemento Cálcio', 'Verificar Cascos'],
    productionHistory: [
      { day: '01/02', value: 28 }, { day: '02/02', value: 30 }, { day: '03/02', value: 29 },
      { day: '04/02', value: 32 }, { day: '05/02', value: 31 }, { day: '06/02', value: 33 },
    ]
  },
  {
    id: 'PT-67890', 
    name: 'Bebé', 
    type: 'Bezerro', 
    age: '3 Meses', 
    weight: '120kg',
    status: 'Atenção', 
    lastVetVisit: '02/02/2026', 
    notes: 'Ligeira febre.',
    feed: 'Leite Materno + Ração', 
    needs: ['Monitorizar Febre', 'Vacina B dia 15'],
    productionHistory: [] 
  },
  {
    id: 'PT-11223', 
    name: 'Trovão', 
    type: 'Cavalo Lusitano', 
    age: '6 Anos', 
    weight: '580kg',
    status: 'Saudável', 
    lastVetVisit: '15/12/2025', 
    notes: 'Prep. feira.',
    feed: 'Feno + Aveia', 
    needs: ['Treino Diário', 'Escovagem'],
    productionHistory: []
  }
];

// --- CAMPOS DE CULTIVO (Com histórico NDVI e Área) ---
export const INITIAL_FIELDS = [
  { 
    id: 1, 
    name: 'Campo Milho Norte', 
    humidity: 45, 
    temp: 24, 
    irrigation: false, 
    health: 'Excelente', 
    img: '🌽', 
    area: 5.5, // Hectares
    cropCycle: CROP_CALENDAR['🌽'],
    ndviHistory: [
      { date: '01/01', value: 0.2 }, { date: '15/02', value: 0.35 }, 
      { date: '30/03', value: 0.6 }, { date: '15/04', value: 0.85 }, 
      { date: '30/05', value: 0.75 }, { date: '15/06', value: 0.4 }
    ]
  },
  { 
    id: 2, 
    name: 'Vinha do Vale', 
    humidity: 30, 
    temp: 22, 
    irrigation: true, 
    health: 'Bom', 
    img: '🍇', 
    area: 3.2,
    cropCycle: CROP_CALENDAR['🍇'],
    ndviHistory: [
      { date: '01/01', value: 0.3 }, { date: '30/03', value: 0.45 }, 
      { date: '15/04', value: 0.6 }, { date: '15/06', value: 0.8 }
    ]
  },
  { 
    id: 3, 
    name: 'Estufa Tomates', 
    humidity: 60, 
    temp: 28, 
    irrigation: false, 
    health: 'Atenção (Praga)', 
    img: '🍅', 
    area: 1.0,
    cropCycle: CROP_CALENDAR['🍅'],
    ndviHistory: [
      { date: '01/01', value: 0.1 }, { date: '30/03', value: 0.7 }, 
      { date: '15/04', value: 0.6 }, { date: '30/05', value: 0.55 }
    ]
  },
];

// --- STOCKS (ARMAZÉM - Com Preços Unitários) ---
export const INITIAL_STOCKS = [
  { id: 's1', name: 'Ração A', category: 'feed', quantity: 500, unit: 'kg', minLevel: 100, price: 1.50 },
  { id: 's2', name: 'Vacina B', category: 'meds', quantity: 10, unit: 'doses', minLevel: 5, price: 25.00 },
  { id: 's3', name: 'Adubo NPK', category: 'fertilizer', quantity: 200, unit: 'kg', minLevel: 50, price: 0.80 },
  { id: 's4', name: 'Gasóleo', category: 'fuel', quantity: 45, unit: 'L', minLevel: 20, price: 1.65 },
];

// --- TAREFAS (AGROAGENDA - Com ligação a Stock) ---
export const INITIAL_TASKS = [
  { id: 1, title: 'Vacinar Gado (Mimosa)', date: 'Hoje', done: false, stockId: 's2', usage: 1 },
  { id: 2, title: 'Comprar Adubo', date: 'Amanhã', done: false },
  { id: 3, title: 'Verificar sensores', date: 'Hoje', done: true, fieldId: 3 }
];

// --- LOTES DE PRODUÇÃO (RASTREABILIDADE) ---
export const INITIAL_BATCHES = [
  { id: 'b1', crop: 'Milho', fieldName: 'Campo Milho Norte', date: '2023-09-15', quantity: '500kg', code: 'LT-2023-CN-01' },
  { id: 'b2', crop: 'Tomate', fieldName: 'Estufa Tomates', date: '2023-07-20', quantity: '200kg', code: 'LT-2023-ET-05' }
];