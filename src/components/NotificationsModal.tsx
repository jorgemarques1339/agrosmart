
import React, { useMemo } from 'react';
import { 
  X, Bell, AlertTriangle, CloudRain, 
  Package, Droplets, CheckCircle, ArrowRight,
  Thermometer, Activity, Tractor, Wrench, Clock
} from 'lucide-react';
import { Animal, Field, StockItem, WeatherForecast, Machine } from '../types';

// Define specific union type to match App state
export type TabId = 'dashboard' | 'animal' | 'cultivation' | 'stocks' | 'machines' | 'finance';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherForecast[];
  animals: Animal[];
  fields: Field[];
  stocks: StockItem[];
  machines?: Machine[];
  onNavigate: (tabId: TabId) => void;
}

type AlertLevel = 'critical' | 'warning' | 'info';

interface NotificationItem {
  id: string;
  type: AlertLevel;
  title: string;
  message: string;
  targetTab: TabId;
  icon: React.ElementType;
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  weather,
  animals,
  fields,
  stocks,
  machines = [],
  onNavigate
}) => {
  
  // Lógica central de alertas: Recalcula apenas quando os dados mudam
  const notifications = useMemo(() => {
    const alerts: NotificationItem[] = [];

    // 1. Verificação Meteorológica (Hoje)
    if (Array.isArray(weather) && weather.length > 0) {
      const today = weather[0];
      if (today.condition === 'rain' || today.condition === 'storm') {
        alerts.push({
          id: 'weather-alert',
          type: 'critical',
          title: 'Precipitação Detetada',
          message: 'Rega automática suspensa preventivamente.',
          targetTab: 'dashboard',
          icon: CloudRain
        });
      }
    }

    // 2. Verificação de Saúde Animal
    if (Array.isArray(animals)) {
      animals.forEach(animal => {
        if (animal.status === 'sick') {
          alerts.push({
            id: `animal-${animal.id}`,
            type: 'critical',
            title: `Atenção: ${animal.name}`,
            message: 'Animal marcado como doente. Requer isolamento.',
            targetTab: 'animal',
            icon: Activity
          });
        }
      });
    }

    // 3. Verificação de Campos (Humidade e Pragas)
    if (Array.isArray(fields)) {
      fields.forEach(field => {
        if (field.humidity < 30) {
          alerts.push({
            id: `field-dry-${field.id}`,
            type: 'warning',
            title: `Seca: ${field.name}`,
            message: `Humidade crítica (${field.humidity}%). Ativar rega.`,
            targetTab: 'cultivation',
            icon: Droplets
          });
        }
        if (field.healthScore < 70) {
           alerts.push({
            id: `field-health-${field.id}`,
            type: 'warning',
            title: `Risco: ${field.name}`,
            message: 'Índice de saúde baixo. Verificar pragas.',
            targetTab: 'cultivation',
            icon: AlertTriangle
          });
        }
      });
    }

    // 4. Verificação de Stocks
    if (Array.isArray(stocks)) {
      stocks.forEach(item => {
        if (item.quantity <= item.minStock) {
          alerts.push({
            id: `stock-${item.id}`,
            type: 'warning',
            title: `Stock Baixo: ${item.name}`,
            message: `Restam apenas ${item.quantity} ${item.unit}.`,
            targetTab: 'stocks',
            icon: Package
          });
        }
      });
    }

    // 5. Verificação de Máquinas
    if (Array.isArray(machines)) {
      machines.forEach(machine => {
        // Cálculo de Horas
        const hoursSince = machine.engineHours - machine.lastServiceHours;
        const hoursRemaining = machine.serviceInterval - hoursSince;

        // Alerta de Atraso (Crítico)
        if (hoursRemaining < 0) {
          alerts.push({
            id: `machine-service-overdue-${machine.id}`,
            type: 'critical',
            title: `Revisão Atrasada: ${machine.name}`,
            message: `Ultrapassado por ${Math.abs(hoursRemaining)} horas! Risco de avaria.`,
            targetTab: 'machines',
            icon: Wrench
          });
        }
        // Alerta Preditivo (Aviso) - Menos de 50h
        else if (hoursRemaining <= 50) {
          alerts.push({
            id: `machine-service-soon-${machine.id}`,
            type: 'warning',
            title: `Manutenção Breve: ${machine.name}`,
            message: `Muda de óleo recomendada em ${hoursRemaining} horas.`,
            targetTab: 'machines',
            icon: Clock
          });
        }

        // Inspeção (Data)
        const daysUntilInspection = Math.ceil((new Date(machine.nextInspectionDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilInspection < 30) {
          alerts.push({
            id: `machine-inspection-${machine.id}`,
            type: daysUntilInspection < 0 ? 'critical' : 'warning',
            title: `Inspeção: ${machine.name}`,
            message: daysUntilInspection < 0 ? 'Inspeção obrigatória expirada!' : `Inspeção obrigatória em ${daysUntilInspection} dias.`,
            targetTab: 'machines',
            icon: Tractor
          });
        }
      });
    }

    return alerts;
  }, [weather, animals, fields, stocks, machines]);

  if (!isOpen) return null;

  const handleAlertClick = (targetTab: TabId) => {
    onNavigate(targetTab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 animate-fade-in">
      {/* Backdrop Vidro */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-sm bg-[#FDFDF5] dark:bg-[#0A0A0A] rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-down border border-white/20 dark:border-neutral-800 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-neutral-800 bg-white/50 dark:bg-black/20 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              {notifications.length > 0 ? (
                <>
                  {/* Heartbeat Effect */}
                  <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                  {/* Red Icon Container */}
                  <div className="relative p-2.5 bg-red-500 text-white rounded-full shadow-lg shadow-red-500/50">
                     <Bell size={24} fill="currentColor" />
                  </div>
                </>
              ) : (
                <div className="p-2">
                  <Bell className="text-gray-900 dark:text-white" size={24} />
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Centro de Alertas</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors text-gray-600 dark:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* Lista de Notificações */}
        <div className="p-4 overflow-y-auto space-y-3 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="text-green-600 dark:text-green-400" size={40} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tudo Tranquilo</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-[200px]">
                Nenhum alerta crítico detetado na sua exploração.
              </p>
            </div>
          ) : (
            notifications.map((alert) => (
              <div 
                key={alert.id}
                onClick={() => handleAlertClick(alert.targetTab)}
                className={`group relative p-4 rounded-[2rem] border transition-all active:scale-95 cursor-pointer overflow-hidden ${
                  alert.type === 'critical' 
                    ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' 
                    : 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30'
                }`}
              >
                {/* Indicador lateral */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  alert.type === 'critical' ? 'bg-red-500' : 'bg-orange-500'
                }`}></div>

                <div className="flex items-start gap-4 pl-2">
                  <div className={`p-3 rounded-2xl shrink-0 ${
                    alert.type === 'critical' 
                      ? 'bg-red-100 dark:bg-red-800/30 text-red-600 dark:text-red-300' 
                      : 'bg-orange-100 dark:bg-orange-800/30 text-orange-600 dark:text-orange-300'
                  }`}>
                    <alert.icon size={20} />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className={`font-bold text-sm mb-1 ${
                      alert.type === 'critical' ? 'text-red-900 dark:text-red-100' : 'text-orange-900 dark:text-orange-100'
                    }`}>
                      {alert.title}
                    </h4>
                    <p className={`text-xs leading-relaxed ${
                      alert.type === 'critical' ? 'text-red-700 dark:text-red-200/70' : 'text-orange-700 dark:text-orange-200/70'
                    }`}>
                      {alert.message}
                    </p>
                  </div>

                  <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                    <ArrowRight size={16} className={alert.type === 'critical' ? 'text-red-400' : 'text-orange-400'} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default NotificationsModal;