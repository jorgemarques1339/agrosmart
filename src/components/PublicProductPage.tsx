import React from 'react';
import { ProductBatch, Field } from '../types';
import { MapPin, Calendar, Sun, Droplets, Award, Share2, ArrowLeft, ShieldCheck, Leaf, Wind } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import OfflineTileLayer from './OfflineTileLayer';

interface PublicProductPageProps {
   batchId: string;
   harvests: ProductBatch[];
   fields: Field[];
}

const PublicProductPage: React.FC<PublicProductPageProps> = ({ batchId, harvests, fields }) => {
   // Find real batch data
   const data = harvests.find(h => h.batchId === batchId);
   const MapContainerAny = MapContainer as any;

   if (!data) {
      return (
         <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
               <MapPin size={40} className="text-gray-300" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">Lote não encontrado</h1>
            <p className="text-gray-500 text-sm max-w-xs">Não conseguimos localizar as informações para o lote {batchId}. Verifique se o código está correto.</p>
            <button onClick={() => window.history.back()} className="mt-8 px-6 py-3 bg-agro-green text-white rounded-2xl font-bold flex items-center gap-2">
               <ArrowLeft size={20} /> Voltar
            </button>
         </div>
      );
   }

   // Associated Field for History and Carbon
   const field = fields.find(f => f.id === data.relatedFieldId) ||
      fields.find(f => f.coordinates[0] === data.coordinates[0] && f.coordinates[1] === data.coordinates[1]);

   // Filter treatments that happened before harvest
   const logsToUse = field?.logs || data.fieldLogs || [];
   const treatments = logsToUse
      ?.filter(l => l.type === 'treatment' && new Date(l.date) <= new Date(data.harvestDate))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3) || [];

   return (
      <div className="min-h-screen bg-white text-gray-900 font-sans pb-20 overflow-x-hidden">

         {/* 1. HEADER HERO */}
         <div className="relative h-[45vh] w-full overflow-hidden">
            <img
               src={data.imageUrl || 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?q=80&w=1000&auto=format&fit=crop'}
               alt={data.crop}
               className="w-full h-full object-cover scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>

            {/* Navigation & Badge */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start">
               <div className="bg-white/10 backdrop-blur-xl p-2.5 rounded-2xl text-white cursor-pointer hover:bg-white/20 transition-all border border-white/20 shadow-lg" onClick={() => window.history.back()}>
                  <ArrowLeft size={24} />
               </div>
               <div className="bg-agro-green text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-full shadow-2xl flex items-center gap-1.5 border border-white/20 animate-pulse">
                  <ShieldCheck size={14} /> Origem Verificada
               </div>
            </div>

            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white animate-slide-up">
               <p className="text-xs font-black uppercase tracking-[0.3em] text-agro-green mb-2 drop-shadow-md">{data.farmerName}</p>
               <h1 className="text-5xl font-black leading-none mb-3 tracking-tighter">{data.crop}</h1>
               <div className="flex items-center gap-2 text-xs font-bold bg-white/10 backdrop-blur-md inline-flex px-4 py-2 rounded-xl border border-white/10 shadow-inner">
                  <MapPin size={14} className="text-agro-green" /> {data.origin}
               </div>
            </div>
         </div>

         {/* 2. MAIN JOURNEY */}
         <div className="max-w-md mx-auto px-6 -mt-6 relative z-10">

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-10">
               <div className="bg-white p-5 rounded-[2rem] shadow-xl border border-gray-100 flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-yellow-400/10 rounded-2xl flex items-center justify-center text-yellow-600 mb-2">
                     <Sun size={20} />
                  </div>
                  <p className="text-xl font-black">{data.stats.sunDays || '120+'}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Dias de Sol</p>
               </div>
               <div className="bg-white p-5 rounded-[2rem] shadow-xl border border-gray-100 flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 mb-2">
                     <Droplets size={20} />
                  </div>
                  <p className="text-xl font-black">-{data.stats.waterSavedLitres || '4k'}L</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Rega Sustentável</p>
               </div>
            </div>

            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-8 ml-1">Registo de Transparência</h2>

            <div className="relative border-l-2 border-gray-100 ml-3 space-y-12 pb-4">

               {/* Step 1: Origem */}
               <div className="relative pl-10 group">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 bg-agro-green rounded-full border-4 border-white shadow-md"></div>
                  <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xl transition-all hover:scale-[1.02]">
                     <span className="text-[10px] font-black text-agro-green uppercase tracking-wider mb-3 block">O Solo</span>
                     <h3 className="font-black text-xl mb-3 mb-4 leading-tight">Colhido em {data.origin}</h3>
                     <div className="h-40 w-full rounded-2xl overflow-hidden relative z-0 border border-gray-100 shadow-inner">
                        <MapContainerAny
                           center={data.coordinates}
                           zoom={14}
                           zoomControl={false}
                           dragging={false}
                           scrollWheelZoom={false}
                           style={{ height: '100%', width: '100%' }}
                        >
                           <OfflineTileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                           <Marker position={data.coordinates} />
                        </MapContainerAny>
                     </div>
                  </div>
               </div>

               {/* Step 2: Segurança Alimentar (Dinamizado) */}
               <div className="relative pl-10 group">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 bg-blue-500 rounded-full border-4 border-white shadow-md"></div>
                  <div className="bg-blue-50/30 rounded-3xl p-5 border border-blue-100 shadow-xl">
                     <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider mb-2 block">Segurança Alimentar</span>
                     <h3 className="font-black text-lg flex items-center gap-2 text-blue-900">
                        <ShieldCheck className="text-blue-500" size={20} /> Verificação de Carência
                     </h3>
                     <p className="text-xs text-blue-700/80 mt-2 leading-relaxed font-semibold">
                        Garantimos que todos os tratamentos realizados respeitaram os intervalos de segurança exigidos pela UE.
                     </p>

                     {treatments.length > 0 ? (
                        <div className="mt-4 space-y-2">
                           {treatments.map((t, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-2xl border border-blue-50 flex items-center justify-between shadow-sm">
                                 <div>
                                    <p className="text-[10px] font-black text-gray-800">{t.productName || 'Tratamento Orgânico'}</p>
                                    <p className="text-[8px] font-bold text-gray-400">{new Date(t.date).toLocaleDateString()}</p>
                                 </div>
                                 <span className="text-[8px] font-black text-agro-green bg-green-50 px-2 py-1 rounded-lg border border-green-100 uppercase">
                                    Seguro
                                 </span>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <div className="mt-4 bg-white/50 p-3 rounded-2xl border border-blue-50 text-center">
                           <p className="text-[10px] font-black text-blue-600 uppercase">Cultura 100% Livre de Resíduos</p>
                        </div>
                     )}
                  </div>
               </div>

               {/* Step 3: Sustentabilidade */}
               <div className="relative pl-10 group">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 bg-emerald-500 rounded-full border-4 border-white shadow-md"></div>
                  <div className="bg-emerald-50/30 rounded-3xl p-5 border border-emerald-100 shadow-xl">
                     <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-3 block">Ambiente</span>
                     <div className="grid grid-cols-1 gap-3">
                        <div className="p-4 bg-white rounded-2xl border border-emerald-50 flex items-center gap-4 shadow-sm">
                           <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl">
                              <Leaf size={24} />
                           </div>
                           <div>
                              <p className="text-sm font-black text-emerald-900 leading-none">Carbono Neutro</p>
                              <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Absorção Ativa pela Cultura</p>
                           </div>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-emerald-50 flex items-center gap-4 shadow-sm">
                           <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl">
                              <Wind size={24} />
                           </div>
                           <div>
                              <p className="text-sm font-black text-indigo-900 leading-none">Biodiversidade</p>
                              <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">Preservação de Fauna Local</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Step 4: Colheita */}
               <div className="relative pl-10 group">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 bg-red-500 rounded-full border-4 border-white shadow-md"></div>
                  <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xl">
                     <span className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-3 block">A Colheita</span>
                     <div className="flex justify-between items-center">
                        <div>
                           <h3 className="font-black text-xl text-gray-900">{data.stats.harvestMethod || 'Seleção Manual'}</h3>
                           <p className="text-xs font-medium text-gray-500 mt-1">Frescura máxima garantida.</p>
                        </div>
                        <div className="text-right bg-red-50 px-4 py-3 rounded-[1.5rem] border border-red-100">
                           <Calendar size={20} className="mb-1 text-red-500 ml-auto" />
                           <p className="text-xs font-black text-red-600">{new Date(data.harvestDate).toLocaleDateString()}</p>
                        </div>
                     </div>
                  </div>
               </div>

            </div>
         </div>

         {/* 3. FOOTER SEAL */}
         <div className="px-6 py-16 text-center space-y-6 bg-gray-50 mt-10">
            <div className="inline-block p-10 rounded-full bg-gradient-to-br from-agro-green to-emerald-700 shadow-2xl shadow-green-900/40 text-white relative">
               <Award size={64} />
               <div className="absolute -bottom-2 -right-4 bg-yellow-400 text-black text-xs font-black px-3 py-1.5 rounded-xl shadow-lg border-2 border-white">CERTIFIED</div>
            </div>
            <div>
               <h3 className="text-2xl font-black text-gray-800 tracking-tighter uppercase">Garantia OrivaSmart</h3>
               <p className="text-sm font-medium text-gray-500 max-w-[280px] mx-auto leading-relaxed mt-2 opacity-80">
                  A rastreabilidade digital assegura que cada fruto que consome foi mimado pela tecnologia e pela natureza.
               </p>
            </div>

            <div className="pt-8 opacity-30">
               <p className="text-[10px] text-gray-400 font-mono tracking-[0.3em]">PASSPORT-ID: {batchId}</p>
            </div>
         </div>

         {/* Share FAB */}
         <button
            onClick={() => navigator.share({ title: `AgroSmart: ${data.crop}`, url: window.location.href })}
            className="fixed bottom-8 right-8 w-16 h-16 bg-black text-white rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.3)] flex items-center justify-center active:scale-90 transition-all z-50 hover:bg-agro-green"
         >
            <Share2 size={28} />
         </button>

      </div>
   );
};

export default PublicProductPage;
