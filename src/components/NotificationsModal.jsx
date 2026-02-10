import React from 'react';
import { X, Bell, CloudRain, AlertTriangle, ArrowRight, Package, CheckCircle, Droplets } from 'lucide-react';

const NotificationsModal = ({ isOpen, onClose, weather, animals = [], fields = [], stocks = [], onNavigate }) => {
  if (!isOpen) return null;

  // Lógica de Alertas (Movida do DashboardHome)
  const sickAnimals = Array.isArray(animals) ? animals.filter(a => a.status !== 'Saudável') : [];
  const fieldsAttention = Array.isArray(fields) ? fields.filter(f => f.health.includes('Atenção')) : [];
  const lowStocks = Array.isArray(stocks) ? stocks.filter(s => s.quantity <= (s.minLevel || 0)) : [];
  const rainAlert = weather.precip >= 20;

  const hasNotifications = sickAnimals.length > 0 || fieldsAttention.length > 0 || lowStocks.length > 0 || rainAlert;

  const handleNavigate = (tab) => {
    onNavigate(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in pt-20">
      <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden animate-slide-down border border-[#E0E4D6]">
        
        {/* Header */}
        <div className="bg-[#FDFDF5] p-5 border-b border-[#E0E4D6] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-[#BA1A1A]" />
            <h2 className="text-lg font-black text-[#1A1C18] tracking-tight">Centro de Alertas</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-[#43483E] shadow-sm active:scale-95 border border-[#E0E4D6]">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          
          {!hasNotifications && (
            <div className="text-center py-8 opacity-60">
              <CheckCircle size={48} className="mx-auto mb-2 text-[#3E6837]" />
              <p className="text-sm font-bold text-[#1A1C18]">Tudo tranquilo!</p>
              <p className="text-xs text-[#74796D]">Sem alertas pendentes na quinta.</p>
            </div>
          )}

          {/* Alerta de Chuva */}
          {rainAlert && (
            <div className="bg-[#FFDAD6] p-4 rounded-[20px] flex items-start gap-3 animate-pulse border border-[#FFB4AB]">
              <CloudRain className="text-[#410002] shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-bold text-[#410002] text-sm">Rega Cancelada</h3>
                <p className="text-[#410002] text-xs opacity-80 mt-1">Previsão de chuva forte ({weather.precip}mm).</p>
              </div>
            </div>
          )}

          {/* Animais Doentes */}
          {sickAnimals.map(animal => (
            <div key={animal.id} onClick={() => handleNavigate('animal')} className="bg-white p-4 rounded-[20px] border border-[#FFDAD6] shadow-sm flex items-center justify-between cursor-pointer active:scale-95 transition-transform hover:bg-[#FFF8F7]">
              <div className="flex items-center gap-3">
                <div className="bg-[#FFDAD6] p-2 rounded-full text-[#BA1A1A]"><AlertTriangle size={18} /></div>
                <div>
                  <h3 className="font-bold text-[#1A1C18] text-sm">{animal.name} ({animal.type})</h3>
                  <p className="text-[#BA1A1A] text-xs font-medium">{animal.notes}</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-[#74796D]" />
            </div>
          ))}

          {/* Stock Baixo */}
          {lowStocks.map(stock => (
            <div key={stock.id} onClick={() => handleNavigate('stocks')} className="bg-white p-4 rounded-[20px] border border-orange-200 shadow-sm flex items-center justify-between cursor-pointer active:scale-95 transition-transform hover:bg-orange-50">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-full text-orange-600"><Package size={18} /></div>
                <div>
                  <h3 className="font-bold text-[#1A1C18] text-sm">Stock Baixo: {stock.name}</h3>
                  <p className="text-[#43483E] text-xs">Resta apenas {stock.quantity}{stock.unit}</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-[#74796D]" />
            </div>
          ))}

          {/* Campos com Atenção */}
          {fieldsAttention.map(field => (
            <div key={field.id} onClick={() => handleNavigate('cultivo')} className="bg-white p-4 rounded-[20px] border border-yellow-200 shadow-sm flex items-center justify-between cursor-pointer active:scale-95 transition-transform hover:bg-yellow-50">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-2 rounded-full text-yellow-700"><Droplets size={18} /></div>
                <div>
                  <h3 className="font-bold text-[#1A1C18] text-sm">{field.name}</h3>
                  <p className="text-[#43483E] text-xs">{field.health}</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-[#74796D]" />
            </div>
          ))}

        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;