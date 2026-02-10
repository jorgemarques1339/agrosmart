import React from 'react';
import { X, CloudRain, Sun, Cloud, Wind, Droplets, CloudLightning, Snowflake, MapPin } from 'lucide-react';

const WeatherForecastModal = ({ isOpen, onClose, forecast = [], locationName = "Localização Atual" }) => {
  if (!isOpen) return null;

  // Função inteligente para escolher ícone baseado na descrição da API Real
  const getIcon = (condition = "") => {
    // Converter para minúsculas para facilitar a comparação
    const c = condition.toLowerCase();
    
    if (c.includes('trovoada') || c.includes('storm')) return <CloudLightning size={24} className="text-purple-600" />;
    if (c.includes('neve') || c.includes('snow') || c.includes('geada')) return <Snowflake size={24} className="text-cyan-400" />;
    if (c.includes('chuva') || c.includes('rain') || c.includes('garoa')) return <CloudRain size={24} className="text-blue-500" />;
    if (c.includes('limpo') || c.includes('sol') || c.includes('clear')) return <Sun size={24} className="text-orange-500" />;
    if (c.includes('vento') || c.includes('wind')) return <Wind size={24} className="text-gray-500" />;
    
    // Default para nuvens ou neblina
    return <Cloud size={24} className="text-gray-400" />;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="bg-[#FDFDF5] p-6 border-b border-[#E0E4D6] flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-[#1A1C18] tracking-tight">Previsão 5 Dias</h2>
            <div className="flex items-center gap-1 mt-1 text-[#74796D]">
              <MapPin size={12} />
              <p className="text-xs font-bold uppercase tracking-wider">{locationName}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white rounded-full text-[#43483E] shadow-sm active:scale-95 border border-[#E0E4D6] transition-transform"
          >
            <X size={20} />
          </button>
        </div>

        {/* Lista de Previsão */}
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {forecast.length > 0 ? (
            forecast.map((day, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-[#FDFDF5] border border-[#EFF2E6] rounded-2xl hover:border-[#3E6837] transition-colors">
                
                <div className="flex items-center gap-4">
                  <div className="bg-white p-2 rounded-xl shadow-sm">
                    {getIcon(day.condition)}
                  </div>
                  <div>
                    <p className="font-bold text-[#1A1C18] capitalize">{day.day}</p>
                    <p className="text-[10px] text-[#74796D] font-black uppercase tracking-wide">{day.condition}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center justify-end gap-2 text-sm font-bold text-[#1A1C18]">
                    <span>{day.tempMax}°</span>
                    <span className="text-[#74796D] opacity-60 text-xs">{day.tempMin}°</span>
                  </div>
                  {/* Mostra precipitação apenas se houver chuva prevista */}
                  {day.precip && day.precip !== '0mm' && (
                    <div className="flex items-center justify-end gap-1 text-[10px] text-blue-600 font-bold mt-0.5">
                      <Droplets size={10} /> {day.precip}
                    </div>
                  )}
                </div>

              </div>
            ))
          ) : (
            <div className="py-8 text-center text-[#74796D]">
              <Cloud size={40} className="mx-auto mb-2 opacity-20" />
              <p className="text-xs font-medium">A carregar previsão...</p>
            </div>
          )}
        </div>

        {/* Footer com Dica */}
        <div className="p-4 bg-blue-50 border-t border-blue-100">
          <p className="text-xs text-blue-800 text-center font-medium leading-relaxed">
            💡 <strong>Dica:</strong> Planeie a rega com base na previsão de chuva para poupar recursos.
          </p>
        </div>

      </div>
    </div>
  );
};

export default WeatherForecastModal;