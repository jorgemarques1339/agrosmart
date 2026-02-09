import React from 'react';
import { Loader2, CloudRain, Wind } from 'lucide-react';

const WeatherWidget = ({ weather }) => {
  const getIcon = () => {
    if (weather.loading) return <Loader2 className="animate-spin opacity-50" size={32} />;
    if (weather.condition === 'Chuva') return <CloudRain className="animate-bounce" size={32} />;
    return <Wind className="opacity-80" size={32} />;
  };

  const getStyle = () => weather.condition === 'Chuva' ? 'bg-[#A2C7E6] text-[#001E30]' : 'bg-[#CBE6A2] text-[#1A3400]';

  return (
    <div className={`${getStyle()} rounded-[24px] p-5 mb-2 relative overflow-hidden transition-colors duration-700`}>
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className="text-sm font-medium opacity-70">Meteorologia (Laundos)</p>
          <h2 className="text-4xl font-normal mt-1 flex items-start gap-1">
            {weather.temp}°<span className="text-lg mt-2 opacity-80">C</span>
          </h2>
          <p className="text-sm mt-1 font-bold">{weather.condition} {weather.precip > 0 ? `(${weather.precip}mm)` : ''}</p>
        </div>
        <div className="p-2 bg-white/20 rounded-full">{getIcon()}</div>
      </div>
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#FFFFFF] opacity-20 rounded-full"></div>
    </div>
  );
};

export default WeatherWidget;