import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Corrigir ícones padrão do Leaflet no React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Configuração do Ícone Padrão (Verde/Azul)
const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Configuração do Ícone de Alerta (Vermelho) - Simulando com CSS filter ou imagem diferente
// Para simplificar, vamos usar o mesmo ícone mas o popup indica o estado
L.Marker.prototype.options.icon = DefaultIcon;

// Coordenadas aproximadas de Laundos, Portugal para o centro
const CENTER_POS = [41.438, -8.723];

const FieldMap = ({ fields }) => {
  return (
    <div className="h-[400px] w-full rounded-[24px] overflow-hidden border border-[#E0E4D6] shadow-sm relative z-0">
      <MapContainer 
        center={CENTER_POS} 
        zoom={14} 
        scrollWheelZoom={false} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {fields.map((field, idx) => {
          // Simular posições ligeiramente diferentes para cada campo
          const offset = idx * 0.005; 
          const position = [CENTER_POS[0] + offset, CENTER_POS[1] + offset];

          return (
            <Marker key={field.id} position={position}>
              <Popup>
                <div className="p-1">
                  <h3 className="font-bold text-[#1A1C18]">{field.name}</h3>
                  <p className="text-xs text-[#43483E] mt-1">Humidade: {field.humidity}%</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 inline-block ${field.health.includes('Atenção') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {field.health}
                  </span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default FieldMap;