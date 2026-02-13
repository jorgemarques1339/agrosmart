
import React, { useState, useMemo, useRef } from 'react';
import { 
  Droplets, Thermometer, Brain, Sprout, ChevronDown, 
  MapPin, Loader2, Activity, Wifi, Plus, Trash2, Calendar,
  Package, ShoppingBag, ArrowRight, Mic, MicOff, StopCircle
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import { Field, FieldLog, StockItem } from '../types';
import PestDetection from './PestDetection';

interface FieldCardProps {
  field: Field;
  stocks?: StockItem[]; // Optional prop to support legacy usage
  onToggleIrrigation: (id: string, status: boolean) => void;
  onAddLog: (fieldId: string, log: Omit<FieldLog, 'id'>) => void;
  onUseStock?: (fieldId: string, stockId: string, quantity: number, date: string) => void;
}

const FieldCard: React.FC<FieldCardProps> = ({ field, stocks = [], onToggleIrrigation, onAddLog, onUseStock }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'sensors' | 'journal' | 'ai'>('sensors');
  const [isLoadingIoT, setIsLoadingIoT] = useState(false);
  
  // Journal Modes
  const [journalMode, setJournalMode] = useState<'note' | 'stock'>('note');
  const [newLogText, setNewLogText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  // Stock Usage Form
  const [selectedStockId, setSelectedStockId] = useState('');
  const [stockQty, setStockQty] = useState('');

  // Voice Recognition Ref
  const recognitionRef = useRef<any>(null);

  // Simular latência de hardware
  const handleIoTToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoadingIoT(true);
    setTimeout(() => {
      onToggleIrrigation(field.id, !field.irrigationStatus);
      setIsLoadingIoT(false);
    }, 1200);
  };

  // --- Voice Logic ---
  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        alert("O seu navegador não suporta reconhecimento de voz.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-PT';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        // Capitalize first letter
        const formatted = transcript.charAt(0).toUpperCase() + transcript.slice(1);
        setNewLogText(prev => prev ? `${prev} ${formatted}` : formatted);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech error", event);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const handleAddLogSubmit = () => {
    if (journalMode === 'note') {
      if (!newLogText.trim()) return;
      onAddLog(field.id, {
        date: new Date().toISOString().split('T')[0],
        type: 'observation',
        description: newLogText
      });
      setNewLogText('');
    } else {
      // Stock Mode
      if (!selectedStockId || !stockQty || !onUseStock) return;
      onUseStock(
        field.id, 
        selectedStockId, 
        parseFloat(stockQty), 
        new Date().toISOString().split('T')[0]
      );
      // Reset form
      setSelectedStockId('');
      setStockQty('');
      setJournalMode('note'); // Switch back to note after adding
    }
  };

  // Helper to get selected stock details
  const selectedStockItem = useMemo(() => {
    return stocks.find(s => s.id === selectedStockId);
  }, [selectedStockId, stocks]);

  // Helper to calculate estimated cost
  const estimatedCost = useMemo(() => {
    if (!selectedStockItem || !stockQty) return 0;
    return selectedStockItem.pricePerUnit * parseFloat(stockQty);
  }, [selectedStockItem, stockQty]);

  return (
    <div 
      className={`bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'ring-2 ring-agro-green/20' : ''}`}
    >
      {/* Header do Card (Sempre Visível) */}
      <div 
        className="p-5 pb-14 cursor-pointer relative" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          {/* Ícone da Cultura */}
          <div className="relative w-16 h-16 rounded-3xl bg-gray-50 dark:bg-neutral-800 shadow-inner flex items-center justify-center text-3xl shrink-0">
            {field.emoji}
            {/* Status Indicator */}
            <div className={`absolute top-1 right-1 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-800 ${field.healthScore > 80 ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
          </div>

          {/* Informação Principal */}
          <div className="flex-1 min-w-0">
            {/* Tamanho da fonte ajustado: text-sm em mobile para melhor enquadramento, text-lg em desktop */}
            <h3 className="font-bold text-sm md:text-lg text-gray-900 dark:text-white uppercase tracking-tight truncate">
              {field.name}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
               <span className="flex items-center gap-1"><Sprout size={12}/> {field.crop}</span>
               <span className="w-1 h-1 rounded-full bg-gray-300"></span>
               <span>{field.areaHa} ha</span>
            </div>
            
            {/* Sensor Pills Mini - Agora com espaço garantido abaixo */}
            <div className="flex gap-2 mt-2 relative z-10">
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${field.humidity < 40 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                <Droplets size={10} /> {field.humidity}%
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                <Thermometer size={10} /> {field.temp}°C
              </span>
            </div>
          </div>

          {/* IoT Switch */}
          <button
            onClick={handleIoTToggle}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-95 shrink-0 ${field.irrigationStatus ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-100 dark:bg-neutral-800 text-gray-400 dark:text-gray-500'}`}
          >
            {isLoadingIoT ? (
              <Loader2 size={24} className="animate-spin" />
            ) : field.irrigationStatus ? (
              <Wifi size={24} />
            ) : (
              <Droplets size={24} className="opacity-50" />
            )}
          </button>
        </div>

        {/* Expand Indicator / Hint Visual */}
        {/* Posicionado no padding inferior criado (pb-14) */}
        <div className="absolute bottom-3 w-full left-0 right-0 flex justify-center pointer-events-none">
          {isExpanded ? (
            <div className="bg-gray-100 dark:bg-neutral-800 rounded-full p-1 animate-fade-in">
              <ChevronDown size={16} className="text-gray-400 rotate-180 transition-transform duration-300" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 animate-bounce bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm border border-gray-100 dark:border-neutral-700">
               <span className="text-[10px] font-bold uppercase tracking-widest text-agro-green dark:text-green-400">
                 Toque para detalhes
               </span>
               <ChevronDown size={12} className="text-agro-green dark:text-green-400" />
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo Expandido */}
      {isExpanded && (
        <div className="px-5 pb-8 animate-fade-in border-t border-gray-100 dark:border-neutral-800">
          
          {/* Tabs Navegação */}
          <div className="flex p-1 bg-gray-100 dark:bg-neutral-800 rounded-2xl my-6">
             {(['sensors', 'journal', 'ai'] as const).map(tab => (
               <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
                  activeTab === tab 
                    ? 'bg-white dark:bg-neutral-700 shadow-sm text-agro-green dark:text-white' 
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {tab === 'ai' ? 'AI ✨' : tab === 'sensors' ? 'Sensores' : 'Diário'}
              </button>
             ))}
          </div>

          {/* TAB: SENSORES */}
          {activeTab === 'sensors' && (
            <div className="space-y-6 animate-slide-up">
              {/* Mini Mapa - Optimized Height for Tablet */}
              <div className="h-48 md:h-64 w-full rounded-[2rem] overflow-hidden shadow-inner border border-gray-100 dark:border-neutral-800 relative z-0">
                {/* @ts-ignore */}
                <MapContainer 
                  center={field.coordinates} 
                  zoom={14} 
                  scrollWheelZoom={false} 
                  dragging={false}
                  zoomControl={false}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                  <Polygon positions={field.polygon} pathOptions={{ color: '#4ade80', fillColor: '#4ade80', fillOpacity: 0.3, weight: 2 }} />
                </MapContainer>
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] text-white font-mono flex items-center gap-1">
                  <MapPin size={10} /> GPS: {field.coordinates[0].toFixed(3)}, {field.coordinates[1].toFixed(3)}
                </div>
              </div>

              {/* Gráficos - Grid for Tablet */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-3xl">
                    <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Humidade do Solo (24h)</p>
                    <div className="h-24 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={field.history}>
                          <defs>
                            <linearGradient id="gradHum" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }} />
                          <Area type="monotone" dataKey="humidity" stroke="#3b82f6" fill="url(#gradHum)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                 </div>

                 <div className="bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-3xl">
                    <div className="flex justify-between mb-2">
                       <p className="text-xs font-bold text-gray-500 uppercase">Índice NDVI</p>
                       <span className="text-xs font-mono text-green-600 dark:text-green-400">0.72 (Vigoroso)</span>
                    </div>
                    <div className="h-24 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={field.history}>
                          <defs>
                            <linearGradient id="gradNdvi" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="ndvi" stroke="#4ade80" fill="url(#gradNdvi)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* TAB: DIÁRIO */}
          {activeTab === 'journal' && (
            <div className="space-y-4 animate-slide-up">
              
              {/* Journal Mode Toggle */}
              <div className="flex bg-gray-50 dark:bg-neutral-800/50 p-1 rounded-xl mb-2">
                 <button 
                   onClick={() => setJournalMode('note')}
                   className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${journalMode === 'note' ? 'bg-white dark:bg-neutral-700 shadow text-gray-800 dark:text-white' : 'text-gray-400'}`}
                 >
                   Nota Rápida
                 </button>
                 <button 
                   onClick={() => setJournalMode('stock')}
                   className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${journalMode === 'stock' ? 'bg-white dark:bg-neutral-700 shadow text-agro-green' : 'text-gray-400'}`}
                 >
                   Aplicar Produto
                 </button>
              </div>

              {/* Input Zone */}
              {journalMode === 'note' ? (
                <div className="flex gap-2 relative">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      value={newLogText}
                      onChange={(e) => setNewLogText(e.target.value)}
                      placeholder={isRecording ? "A ouvir..." : "Nova observação..."}
                      className={`w-full bg-gray-100 dark:bg-neutral-800 rounded-2xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-agro-green dark:text-white transition-shadow ${isRecording ? 'ring-2 ring-red-400 bg-red-50 dark:bg-red-900/10' : ''}`}
                    />
                    
                    {/* Botão de Voz */}
                    <button 
                      onClick={toggleRecording}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all ${
                        isRecording 
                          ? 'bg-red-500 text-white animate-pulse' 
                          : 'text-gray-400 hover:text-agro-green hover:bg-gray-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {isRecording ? <StopCircle size={18} /> : <Mic size={18} />}
                    </button>
                  </div>

                  <button 
                    onClick={handleAddLogSubmit}
                    disabled={isRecording}
                    className="bg-gray-800 text-white p-3 rounded-2xl active:scale-90 transition-transform shadow-lg disabled:opacity-50"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              ) : (
                <div className="bg-agro-green/5 dark:bg-agro-green/10 border border-agro-green/20 rounded-[1.5rem] p-4 space-y-3 animate-fade-in">
                  {/* Selector Stock */}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-500 ml-1 mb-1 block">Produto do Armazém</label>
                    <div className="relative">
                      <select 
                        value={selectedStockId}
                        onChange={(e) => setSelectedStockId(e.target.value)}
                        className="w-full bg-white dark:bg-neutral-800 border-none rounded-xl px-4 py-3 text-sm font-bold text-gray-800 dark:text-white appearance-none outline-none focus:ring-2 focus:ring-agro-green"
                      >
                        <option value="">Selecione um produto...</option>
                        {stocks.map(s => (
                           <option key={s.id} value={s.id} disabled={s.quantity <= 0}>
                             {s.name} ({s.quantity} {s.unit})
                           </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronDown size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Quantity Input */}
                  <div className="flex gap-3">
                     <div className="flex-1">
                        <label className="text-[10px] font-bold uppercase text-gray-500 ml-1 mb-1 block">Qtd a Aplicar</label>
                        <div className="relative">
                           <input 
                             type="number"
                             value={stockQty}
                             onChange={(e) => setStockQty(e.target.value)}
                             placeholder="0.0"
                             className="w-full bg-white dark:bg-neutral-800 rounded-xl px-4 py-3 text-lg font-black text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                           />
                           {selectedStockItem && (
                             <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 bg-gray-100 dark:bg-neutral-700 px-2 py-0.5 rounded">
                               {selectedStockItem.unit}
                             </span>
                           )}
                        </div>
                     </div>
                     
                     <div className="flex items-end pb-1">
                        <button 
                          onClick={handleAddLogSubmit}
                          disabled={!selectedStockId || !stockQty}
                          className={`h-[3.25rem] px-5 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all flex items-center gap-2 ${
                             !selectedStockId || !stockQty ? 'bg-gray-300 dark:bg-neutral-700 cursor-not-allowed' : 'bg-agro-green'
                          }`}
                        >
                          <Plus size={20} />
                          Aplicar
                        </button>
                     </div>
                  </div>

                  {/* Estimated Cost Preview */}
                  {estimatedCost > 0 && (
                     <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-black/20 p-2 rounded-lg">
                        <ShoppingBag size={12} />
                        <span>Custo estimado: <strong className="text-gray-900 dark:text-white">{estimatedCost.toFixed(2)}€</strong> (será registado nas finanças)</span>
                     </div>
                  )}
                </div>
              )}

              {/* Lista de Logs */}
              <div className="space-y-3 pl-4 border-l-2 border-gray-100 dark:border-neutral-800 mt-4">
                {field.logs && field.logs.length > 0 ? (
                  field.logs.slice().reverse().map(log => (
                    <div key={log.id} className="relative group">
                      <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-900 ${
                        log.type === 'treatment' ? 'bg-orange-400' : 'bg-green-400'
                      }`}></div>
                      <div className="flex justify-between items-start">
                         <div className="flex-1">
                            <p className="text-xs text-gray-400 font-mono mb-0.5">{log.date}</p>
                            <p className="text-sm text-gray-800 dark:text-gray-200">{log.description}</p>
                            
                            {/* Badges de Custo e Dose */}
                            <div className="flex gap-2 mt-1">
                              {log.cost !== undefined && log.cost > 0 && (
                                 <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-gray-100 dark:bg-neutral-800 text-gray-500 px-1.5 py-0.5 rounded">
                                    {log.cost.toFixed(2)}€
                                 </span>
                              )}
                              {log.quantity !== undefined && log.unit && (
                                 <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                                    <Package size={8} /> {log.quantity} {log.unit}
                                 </span>
                              )}
                            </div>
                         </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm italic py-4">Sem registos recentes.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB: AI */}
          {activeTab === 'ai' && (
             <div className="space-y-6 animate-slide-up">
               {/* Yield Prediction Card - Responsive Layout */}
               <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[2.2rem] p-6 text-white shadow-xl shadow-purple-900/20 relative overflow-hidden">
                  <Brain className="absolute -top-4 -right-4 w-32 h-32 opacity-10 text-white" />
                  
                  <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <p className="text-purple-200 text-xs font-bold uppercase tracking-wider mb-2">Previsão de Colheita</p>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-4xl font-black">{(field.areaHa * field.yieldPerHa).toFixed(1)}</h2>
                            <span className="text-lg opacity-80">Ton</span>
                        </div>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 w-full md:w-auto">
                      <div className="flex justify-between md:gap-6 items-center text-sm">
                        <span className="opacity-80">Janela Ideal:</span>
                        <span className="font-bold">{field.harvestWindow}</span>
                      </div>
                    </div>
                  </div>
               </div>

               {/* Pest Detection Component */}
               <PestDetection />
             </div>
          )}

        </div>
      )}
    </div>
  );
};

export default FieldCard;
