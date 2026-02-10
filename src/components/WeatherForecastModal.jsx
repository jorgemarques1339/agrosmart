import React from 'react';
import { X, CloudRain, Sun, Cloud, Wind, Droplets } from 'lucide-react';

const WeatherForecastModal = ({ isOpen, onClose, forecast = [] }) => {
  if (!isOpen) return null;

  const getIcon = (iconName) => {
    switch(iconName) {
      case 'rain': return <CloudRain size={24} className="text-blue-500" />;
      case 'sun': return <Sun size={24} className="text-orange-500" />;
      case 'wind': return <Wind size={24} className="text-gray-500" />;
      default: return <Cloud size={24} className="text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="bg-[#FDFDF5] p-6 border-b border-[#E0E4D6] flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-[#1A1C18] tracking-tight">Previsão 5 Dias</h2>
            <p className="text-xs text-[#74796D] mt-1">Laundos, Portugal</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-[#43483E] shadow-sm active:scale-95 border border-[#E0E4D6]">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {forecast.map((day, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-[#FDFDF5] border border-[#EFF2E6] rounded-2xl hover:border-[#3E6837] transition-colors">
              
              <div className="flex items-center gap-4">
                <div className="bg-white p-2 rounded-xl shadow-sm">
                  {getIcon(day.icon)}
                </div>
                <div>
                  <p className="font-bold text-[#1A1C18]">{day.day}</p>
                  <p className="text-xs text-[#74796D] font-medium">{day.condition}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end gap-2 text-sm font-bold text-[#1A1C18]">
                  <span>{day.tempMax}°</span>
                  <span className="text-[#74796D] opacity-60 text-xs">{day.tempMin}°</span>
                </div>
                {day.precip !== '0mm' && (
                  <div className="flex items-center justify-end gap-1 text-[10px] text-blue-600 font-bold mt-0.5">
                    <Droplets size={10} /> {day.precip}
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>

        <div className="p-4 bg-blue-50 border-t border-blue-100">
          <p className="text-xs text-blue-800 text-center font-medium">
            💡 Dica: Evite regar nos dias de chuva para poupar água.
          </p>
        </div>

      </div>
    </div>
  );
};

export default WeatherForecastModal;