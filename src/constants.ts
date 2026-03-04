
import { Animal, AppState, Field, StockItem, Task, Transaction, WeatherForecast, Machine, Employee, UserProfile, AnimalBatch } from './types';

export const INITIAL_WEATHER: WeatherForecast[] = [
  { day: 'Seg', temp: 22, condition: 'sunny' },
  { day: 'Ter', temp: 24, condition: 'cloudy' },
  { day: 'Qua', temp: 19, condition: 'rain' },
  { day: 'Qui', temp: 21, condition: 'cloudy' },
  { day: 'Sex', temp: 25, condition: 'sunny' },
];



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
