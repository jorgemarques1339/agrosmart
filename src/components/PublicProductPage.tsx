import React from 'react';
import { ProductBatch } from '../types';
import { MapPin, Calendar, Sun, Droplets, Award, Share2, ArrowLeft } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';

interface PublicProductPageProps {
  batchId: string;
}

// MOCK DATA GENERATOR (Simulando uma API fetch baseada no ID)
const getBatchData = (id: string): ProductBatch => {
  return {
    batchId: id,
    crop: 'Mirtilos Premium',
    harvestDate: new Date().toISOString().split('T')[0],
    origin: 'Quinta do Oriva, Laundos',
    coordinates: [41.442, -8.723],
    quantity: 1250,
    unit: 'kg',
    stats: {
      sunDays: 120,
      waterSavedLitres: 4500,
      harvestMethod: 'Manual'
    },
    farmerName: 'João Silva',
    imageUrl: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?q=80&w=1000&auto=format&fit=crop'
  };
};

const PublicProductPage: React.FC<PublicProductPageProps> = ({ batchId }) => {
  const data = getBatchData(batchId);
  const MapContainerAny = MapContainer as any;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans pb-20">
      
      {/* 1. HEADER HERO */}
      <div className="relative h-[40vh] w-full overflow-hidden">
        <img 
          src={data.imageUrl} 
          alt={data.crop} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        {/* Navigation & Badge */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start">
           <div className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white cursor-pointer hover:bg-white/30 transition-colors" onClick={() => window.history.back()}>
              <ArrowLeft size={24} />
           </div>
           <div className="bg-yellow-400 text-black text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
              <Award size={12} /> Certificado Oriva
           </div>
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white animate-slide-up">
           <p className="text-sm font-bold uppercase tracking-widest opacity-80 mb-1">{data.farmerName}</p>
           <h1 className="text-4xl font-black leading-none mb-2">{data.crop}</h1>
           <div className="flex items-center gap-2 text-xs font-bold bg-white/20 backdrop-blur-sm inline-flex px-3 py-1.5 rounded-lg border border-white/20">
              <MapPin size={12} /> {data.origin}
           </div>
        </div>
      </div>

      {/* 2. TIMELINE STORY */}
      <div className="max-w-md mx-auto px-6 py-10">
         <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
            A História do seu Produto
         </h2>

         <div className="relative border-l-2 border-gray-100 ml-3 space-y-12 pb-4">
            
            {/* Step 1: Origem */}
            <div className="relative pl-8 group">
               <div className="absolute -left-[9px] top-0 w-4 h-4 bg-agro-green rounded-full border-4 border-white shadow-sm"></div>
               <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 shadow-sm transition-transform active:scale-95">
                  <span className="text-[10px] font-black text-agro-green uppercase tracking-wider mb-2 block">A Origem</span>
                  <h3 className="font-bold text-lg mb-2">Cultivado em {data.origin}</h3>
                  <div className="h-32 w-full rounded-xl overflow-hidden relative z-0">
                     <MapContainerAny 
                        center={data.coordinates} 
                        zoom={13} 
                        zoomControl={false}
                        dragging={false}
                        scrollWheelZoom={false}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                        <Marker position={data.coordinates} />
                      </MapContainerAny>
                  </div>
               </div>
            </div>

            {/* Step 2: Crescimento */}
            <div className="relative pl-8 group">
               <div className="absolute -left-[9px] top-0 w-4 h-4 bg-yellow-400 rounded-full border-4 border-white shadow-sm"></div>
               <div className="bg-yellow-50/50 rounded-2xl p-4 border border-yellow-100 shadow-sm">
                  <span className="text-[10px] font-black text-yellow-600 uppercase tracking-wider mb-2 block">O Crescimento</span>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 text-yellow-600 rounded-full"><Sun size={20}/></div>
                        <div>
                           <p className="text-xl font-black text-gray-800">{data.stats.sunDays}</p>
                           <p className="text-[10px] font-bold text-gray-400 uppercase leading-tight">Dias de Sol</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><Droplets size={20}/></div>
                        <div>
                           <p className="text-xl font-black text-gray-800">Sustentável</p>
                           <p className="text-[10px] font-bold text-gray-400 uppercase leading-tight">Rega Inteligente</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Step 3: Colheita */}
            <div className="relative pl-8 group">
               <div className="absolute -left-[9px] top-0 w-4 h-4 bg-red-500 rounded-full border-4 border-white shadow-sm"></div>
               <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-2 block">A Colheita</span>
                  <div className="flex justify-between items-center">
                     <div>
                        <h3 className="font-bold text-base">Colhido à Mão</h3>
                        <p className="text-xs text-gray-500 mt-1">Seleção rigorosa de qualidade.</p>
                     </div>
                     <div className="text-right bg-gray-100 px-3 py-2 rounded-xl">
                        <Calendar size={16} className="mb-1 text-gray-400 ml-auto" />
                        <p className="text-xs font-black">{data.harvestDate}</p>
                     </div>
                  </div>
               </div>
            </div>

         </div>
      </div>

      {/* 3. FOOTER SEAL */}
      <div className="px-6 text-center space-y-4">
         <div className="inline-block p-6 rounded-full bg-gradient-to-br from-agro-green to-emerald-700 shadow-xl shadow-green-900/20 text-white relative">
            <Award size={48} />
            <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-black text-[10px] font-black px-2 py-1 rounded-md shadow-sm">100% BIO</div>
         </div>
         <div>
            <h3 className="text-lg font-black text-gray-800">Garantia OrivaSmart</h3>
            <p className="text-xs text-gray-500 max-w-[250px] mx-auto leading-relaxed mt-1">
               Este produto foi monitorizado desde a semente até à colheita para garantir a máxima qualidade e segurança alimentar.
            </p>
         </div>
         
         <div className="pt-4">
            <p className="text-[10px] text-gray-300 font-mono">BATCH ID: {batchId}</p>
         </div>
      </div>

      {/* Share FAB */}
      <button 
         onClick={() => navigator.share({ title: data.crop, url: window.location.href })}
         className="fixed bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform z-50"
      >
         <Share2 size={24} />
      </button>

    </div>
  );
};

export default PublicProductPage;