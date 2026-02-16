
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Sprout, PawPrint, Package, 
  Tractor, Wallet, Settings, Bell, X,
  FileText, Wifi, Plus, Save,
  Radio, Signal, Loader2, Droplets, Activity, CheckCircle2, ChevronDown,
  Truck, FileCheck, WifiOff, CloudOff // Added offline icons
} from 'lucide-react';
import mqtt from 'mqtt';
import jsPDF from 'jspdf'; 
import autoTable from 'jspdf-autotable'; 

import { AppState, Field, StockItem, FieldLog, Sensor, Task, Animal, Machine, Transaction, MaintenanceLog, WeatherForecast, DetailedForecast, Employee } from './types';
import { loadState, saveState } from './services/storageService';
import { INITIAL_WEATHER } from './constants';

import DashboardHome from './components/DashboardHome';
import AnimalCard from './components/AnimalCard';
import FieldCard from './components/FieldCard';
import StockManager from './components/StockManager';
import MachineManager from './components/MachineManager';
import FinanceManager from './components/FinanceManager';
import SettingsModal from './components/SettingsModal';
import NotificationsModal, { TabId } from './components/NotificationsModal';
import FieldNotebook from './components/FieldNotebook';
import InstallPrompt from './components/InstallPrompt';

// API Configuration
const WEATHER_API_KEY = 'c7f76605724ecafb54933077ede4166a';
// Coordinates for Laundos, PT (based on mock data)
const LAT = 41.442;
const LON = -8.723;

const MQTT_BROKER_URL = 'wss://broker.emqx.io:8084/mqtt';
const MQTT_TOPIC_SCAN = 'oriva/scan/sim';

// Component for IoT Pairing Wizard (Global)
const IoTPairingWizard = ({ onClose, fields, onPair }: { onClose: () => void, fields: Field[], onPair: (fieldId: string, sensor: Sensor) => void }) => {
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'found'>('idle');
  const [foundDevices, setFoundDevices] = useState<Sensor[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Sensor | null>(null);
  const [customDeviceName, setCustomDeviceName] = useState('');
  const [selectedFieldId, setSelectedFieldId] = useState('');

  // --- MQTT SCANNING LOGIC ---
  const startScanning = () => {
    // OFFLINE CHECK
    if (!navigator.onLine) {
      alert("A pesquisa de sensores requer conexão à internet. Verifique o seu sinal.");
      return;
    }

    setScanStatus('scanning');
    setFoundDevices([]);
    
    // Conectar ao Broker Público
    const client = mqtt.connect(MQTT_BROKER_URL);

    client.on('connect', () => {
      console.log('Connected to MQTT Broker');
      client.subscribe(MQTT_TOPIC_SCAN);
      
      // SIMULAÇÃO: Como não há sensores reais, a própria app publica mensagens "fake"
      setTimeout(() => {
        const mockSensor1: Sensor = {
          id: `lora-${Math.floor(Math.random() * 10000)}`,
          name: 'Oriva Soil Probe v2',
          type: 'moisture',
          batteryLevel: 98,
          signalStrength: -65, // RSSI Bom
          lastSeen: new Date().toISOString(),
          status: 'pairing'
        };
        client.publish(MQTT_TOPIC_SCAN, JSON.stringify(mockSensor1));
      }, 1500);

      setTimeout(() => {
        const mockSensor2: Sensor = {
          id: `ble-${Math.floor(Math.random() * 10000)}`,
          name: 'Weather Station Mini',
          type: 'weather',
          batteryLevel: 45,
          signalStrength: -82, // RSSI Médio
          lastSeen: new Date().toISOString(),
          status: 'pairing'
        };
        client.publish(MQTT_TOPIC_SCAN, JSON.stringify(mockSensor2));
      }, 3000);
    });

    client.on('message', (topic, message) => {
      if (topic === MQTT_TOPIC_SCAN) {
        try {
          const device = JSON.parse(message.toString()) as Sensor;
          setFoundDevices(prev => {
            // Evitar duplicados
            if (prev.find(d => d.id === device.id)) return prev;
            return [...prev, device];
          });
        } catch (e) {
          console.error("Invalid MQTT payload");
        }
      }
    });

    // Parar scan após 5 segundos
    setTimeout(() => {
      client.end();
      setScanStatus('found');
    }, 5500);
  };

  const confirmPairing = () => {
    if (selectedDevice && selectedFieldId) {
      onPair(selectedFieldId, {
        ...selectedDevice,
        name: customDeviceName || selectedDevice.name,
        status: 'online', 
        signalStrength: Math.abs(selectedDevice.signalStrength)
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl animate-scale-up border border-white/20" onClick={e => e.stopPropagation()}>
        
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black dark:text-white">Emparelhar Sensor</h3>
            <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
              <X size={20} className="dark:text-white" />
            </button>
        </div>

        {/* STATE 1: IDLE */}
        {scanStatus === 'idle' && (
            <div className="text-center py-4">
              <div className="w-24 h-24 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                  <Radio size={40} className="text-gray-400" />
                  <div className="absolute top-0 right-0 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Signal size={16} className="text-blue-600" />
                  </div>
              </div>
              <p className="text-sm text-gray-500 font-medium mb-6 px-4">
                  Aproxime o dispositivo para iniciar a descoberta via LoRaWAN / Bluetooth.
              </p>
              <button 
                onClick={startScanning}
                className="w-full py-4 bg-agro-green text-white rounded-[1.5rem] font-bold shadow-lg shadow-agro-green/30 active:scale-95 transition-transform"
              >
                  Iniciar Scan
              </button>
            </div>
        )}

        {/* STATE 2: SCANNING */}
        {scanStatus === 'scanning' && (
            <div className="py-8 flex flex-col items-center">
              <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                  {/* Radar Animation */}
                  <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
                  <div className="absolute inset-4 bg-green-500/20 rounded-full animate-ping delay-100"></div>
                  <div className="absolute inset-8 bg-green-500/20 rounded-full animate-ping delay-200"></div>
                  <div className="relative z-10 w-16 h-16 bg-white dark:bg-neutral-800 rounded-full flex items-center justify-center shadow-lg">
                    <Loader2 size={32} className="animate-spin text-agro-green" />
                  </div>
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">A procurar dispositivos...</h4>
              <p className="text-xs text-gray-500 mb-6">Mantenha o sensor ligado e próximo.</p>
              
              {/* Live Results List during scan */}
              <div className="w-full space-y-2">
                  {foundDevices.map(device => (
                    <div key={device.id} className="bg-gray-50 dark:bg-neutral-800 p-3 rounded-2xl flex items-center gap-3 animate-slide-up">
                        <div className="p-2 bg-white dark:bg-neutral-700 rounded-xl">
                          {device.type === 'moisture' ? <Droplets size={16} /> : <Activity size={16} />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold dark:text-white">{device.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{device.id}</p>
                        </div>
                        <span className="text-[10px] font-bold text-green-600">Encontrado</span>
                    </div>
                  ))}
              </div>
            </div>
        )}

        {/* STATE 3: RESULTS & CONFIGURE */}
        {scanStatus === 'found' && (
            <div className="space-y-4">
              {foundDevices.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500 font-bold mb-4">Nenhum dispositivo encontrado.</p>
                    <button onClick={startScanning} className="text-agro-green font-bold text-sm">Tentar Novamente</button>
                  </div>
              ) : (
                  <>
                    {!selectedDevice ? (
                        <>
                          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Selecione um dispositivo</p>
                          <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                              {foundDevices.map(device => (
                                <button 
                                  key={device.id}
                                  onClick={() => { setSelectedDevice(device); setCustomDeviceName(device.name); }}
                                  className="w-full bg-gray-50 dark:bg-neutral-800 hover:bg-green-50 dark:hover:bg-green-900/10 p-3 rounded-2xl flex items-center gap-3 border-2 border-transparent hover:border-agro-green transition-all text-left"
                                >
                                    <div className="p-2 bg-white dark:bg-neutral-700 rounded-xl shadow-sm">
                                      {device.type === 'moisture' ? <Droplets size={18} /> : <Activity size={18} />}
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-bold dark:text-white">{device.name}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                          <span className="text-[10px] text-gray-400 font-mono">{device.id}</span>
                                          <span className="text-[10px] font-bold text-green-600 flex items-center gap-0.5">
                                            <Signal size={8} /> {Math.abs(device.signalStrength)}%
                                          </span>
                                      </div>
                                    </div>
                                    <ChevronDown className="-rotate-90 text-gray-300" size={16} />
                                </button>
                              ))}
                          </div>
                        </>
                    ) : (
                        <div className="animate-slide-up space-y-4">
                          <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-2xl border border-green-100 dark:border-green-900/30">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 dark:bg-green-800 rounded-xl text-green-700 dark:text-green-300">
                                    <CheckCircle2 size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-green-800 dark:text-green-200">Pronto a Associar</p>
                                    <p className="text-xs text-green-600 dark:text-green-400">ID: {selectedDevice.id}</p>
                                </div>
                              </div>
                          </div>

                          <div>
                              <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Nome do Sensor</label>
                              <input 
                                value={customDeviceName}
                                onChange={(e) => setCustomDeviceName(e.target.value)}
                                className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                              />
                          </div>

                          <div>
                              <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Associar a Parcela</label>
                              <select 
                                value={selectedFieldId}
                                onChange={(e) => setSelectedFieldId(e.target.value)}
                                className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green appearance-none"
                              >
                                <option value="">Selecione...</option>
                                {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                              </select>
                          </div>

                          <div className="flex gap-3 pt-2">
                              <button 
                                onClick={() => setSelectedDevice(null)}
                                className="px-6 py-4 bg-gray-200 dark:bg-neutral-800 rounded-2xl font-bold text-gray-600 dark:text-gray-300"
                              >
                                Voltar
                              </button>
                              <button 
                                onClick={confirmPairing}
                                disabled={!selectedFieldId}
                                className={`flex-1 py-4 bg-agro-green text-white rounded-2xl font-bold shadow-lg shadow-agro-green/30 active:scale-95 transition-transform flex items-center justify-center gap-2 ${!selectedFieldId ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <Save size={18} /> Guardar
                              </button>
                          </div>
                        </div>
                    )}
                  </>
              )}
            </div>
        )}
      </div>
    </div>
  );
};

const CROP_TYPES = [
  { label: 'Uva Alvarinho', emoji: '🍇' },
  { label: 'Milho Silagem', emoji: '🌽' },
  { label: 'Trigo', emoji: '🌾' },
  { label: 'Olival', emoji: '🫒' },
  { label: 'Pastagem', emoji: '🌿' }
];

const CultivationView = ({ 
  fields, 
  stocks,
  employees,
  toggleIrrigation, 
  onAddLog,
  onUseStock,
  onAddField,
  onRegisterSensor,
  onModalChange,
  operatorName,
  onRegisterSale,
  onHarvest // New Prop
}: { 
  fields: Field[], 
  stocks: StockItem[],
  employees: Employee[],
  toggleIrrigation: (id: string, s: boolean) => void,
  onAddLog: (fieldId: string, log: Omit<FieldLog, 'id'>, stockId?: string) => void,
  onUseStock: (fieldId: string, stockId: string, quantity: number, date: string) => void,
  onAddField: (field: Pick<Field, 'name' | 'areaHa' | 'crop' | 'emoji'>) => void,
  onRegisterSensor: (fieldId: string, sensor: Sensor) => void,
  onModalChange?: (isOpen: boolean) => void,
  operatorName: string,
  onRegisterSale: (saleData: { stockId: string, quantity: number, pricePerUnit: number, clientName: string, date: string, fieldId?: string }) => void,
  onHarvest: (fieldId: string, data: { quantity: number; unit: string; batchId: string; date: string }) => void
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [showIoTWizard, setShowIoTWizard] = useState(false);
  
  // --- e-GUIAS MODAL STATE ---
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [saleStep, setSaleStep] = useState(1);
  const [saleData, setSaleData] = useState({
    stockId: '',
    quantity: '',
    clientName: '',
    clientNif: '',
    destination: '',
    plate: '',
    date: new Date().toISOString().split('T')[0],
    price: '',
    fieldId: ''
  });
  
  const [newName, setNewName] = useState('');
  const [newArea, setNewArea] = useState('');
  const [selectedCrop, setSelectedCrop] = useState(CROP_TYPES[0]);

  useEffect(() => {
    if (onModalChange) {
      onModalChange(isModalOpen || isNotebookOpen || showIoTWizard || showGuideModal);
    }
  }, [isModalOpen, isNotebookOpen, showIoTWizard, showGuideModal, onModalChange]);

  const handleSubmit = () => {
    if (newName && newArea) {
      onAddField({
        name: newName,
        areaHa: parseFloat(newArea),
        crop: selectedCrop.label,
        emoji: selectedCrop.emoji
      });
      setIsModalOpen(false);
      setNewName('');
      setNewArea('');
      setSelectedCrop(CROP_TYPES[0]);
    }
  };

  // --- e-GUIAS PDF GENERATION ---
  const generateGuidePDF = () => {
    if (!onRegisterSale) return;

    // 1. Validar e Encontrar Stock e Campo
    const selectedStock = stocks.find(s => s.id === saleData.stockId);
    const selectedField = fields.find(f => f.id === saleData.fieldId);
    
    if (!selectedStock || !selectedField) return;

    // 2. Registar Venda na App (Lógica)
    onRegisterSale({
      stockId: saleData.stockId,
      quantity: parseFloat(saleData.quantity),
      pricePerUnit: parseFloat(saleData.price),
      clientName: saleData.clientName,
      date: saleData.date,
      fieldId: selectedField.id
    });

    // 3. Gerar PDF
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(62, 104, 55); // Agro Green
    doc.text("GUIA DE TRANSPORTE", 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Documento de Acompanhamento de Mercadorias", 105, 26, { align: 'center' });

    doc.setDrawColor(200);
    doc.line(14, 32, 196, 32);

    // Section 1: Expedidor
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("EXPEDIDOR (Quinta):", 14, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Oriva Farms Enterprise", 14, 48);
    doc.text(`Local Carga: ${selectedField.name} (${selectedField.coordinates.join(', ')})`, 14, 53);
    doc.text(`Data/Hora: ${new Date().toLocaleString()}`, 14, 58);

    // Section 2: Destinatário
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DESTINATÁRIO:", 110, 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(saleData.clientName, 110, 48);
    doc.text(`NIF: ${saleData.clientNif || 'N/A'}`, 110, 53);
    doc.text(`Descarga: ${saleData.destination || 'Morada do Cliente'}`, 110, 58);

    // Section 3: Transporte
    doc.setFillColor(240, 240, 240);
    doc.rect(14, 65, 182, 15, 'F');
    doc.text(`Viatura: ${saleData.plate.toUpperCase()}`, 20, 75);
    doc.text(`Data Início: ${saleData.date}`, 120, 75);

    // Table
    const tableRows = [[
      selectedStock.name,
      `${saleData.quantity} ${selectedStock.unit}`,
      `${saleData.price} €`,
      `${(parseFloat(saleData.quantity) * parseFloat(saleData.price)).toFixed(2)} €`
    ]];

    autoTable(doc, {
      startY: 85,
      head: [['Mercadoria', 'Quantidade', 'Preço Unit.', 'Total']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [62, 104, 55] },
    });

    // Footer / Disclaimer
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Este documento não substitui a fatura oficial. Válido para circulação.", 14, finalY);
    doc.text(`Emitido via OrivaSmart App`, 14, finalY + 5);

    doc.save(`Guia_Transporte_${saleData.clientName.replace(/\s/g,'_')}.pdf`);

    // Reset Form & Close
    setShowGuideModal(false);
    setSaleStep(1);
    setSaleData({ stockId: '', quantity: '', clientName: '', clientNif: '', destination: '', plate: '', date: new Date().toISOString().split('T')[0], price: '', fieldId: '' });
  };

  return (
    <div className="space-y-6 animate-fade-in pt-4">
      <div className="flex justify-between items-start px-2 mb-4 md:mb-6">
        
        {/* Lado Esquerdo: Registo e e-Guias */}
        <div className="flex gap-3">
           <div className="flex flex-col items-center gap-1">
             <button 
               onClick={() => setIsNotebookOpen(true)}
               className="w-12 h-12 rounded-full bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-300 shadow-md border border-gray-100 dark:border-neutral-700 flex items-center justify-center active:scale-95 transition-transform"
               title="Caderno de Campo"
             >
               <FileText size={22} />
             </button>
             <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">Registo</span>
           </div>

           <div className="flex flex-col items-center gap-1">
             <button 
               onClick={() => setShowGuideModal(true)}
               className="w-12 h-12 rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/30 flex items-center justify-center active:scale-95 transition-transform"
               title="Emitir Guia"
             >
               <Truck size={22} />
             </button>
             <span className="text-[10px] font-bold text-orange-500 dark:text-orange-400">e-Guias</span>
           </div>
        </div>

        {/* Lado Direito: IoT e Novo */}
        <div className="flex gap-3">
           <div className="flex flex-col items-center gap-1">
             <button 
               onClick={() => setShowIoTWizard(true)}
               className="w-12 h-12 rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center active:scale-95 transition-transform"
               title="Adicionar Sensor IoT"
             >
               <Wifi size={22} />
             </button>
             <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400">IoT</span>
           </div>

           <div className="flex flex-col items-center gap-1">
             <button 
               onClick={() => setIsModalOpen(true)}
               className="w-12 h-12 rounded-full bg-agro-green text-white shadow-lg shadow-agro-green/30 flex items-center justify-center active:scale-95 transition-transform"
             >
               <Plus size={24} />
             </button>
             <span className="text-[10px] font-bold text-agro-green dark:text-green-400 whitespace-nowrap">Novo</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 items-start">
        {fields.map(field => (
          <FieldCard 
            key={field.id}
            field={field}
            stocks={stocks}
            onToggleIrrigation={toggleIrrigation}
            onAddLog={onAddLog}
            onUseStock={onUseStock}
            onRegisterSensor={onRegisterSensor}
            onRegisterSale={onRegisterSale}
            onHarvest={onHarvest} // Pass down
          />
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)}>
          <div 
            className="bg-white dark:bg-neutral-900 w-full max-w-md p-6 rounded-t-[2.5rem] shadow-2xl animate-slide-up border-t border-white/20" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold dark:text-white">Novo Cultivo</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                <X size={20} className="dark:text-white" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 ml-2">Nome do Campo</label>
                <input 
                  autoFocus
                  className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl mt-1 dark:text-white border-2 border-transparent focus:border-agro-green outline-none text-lg font-bold"
                  placeholder="Ex: Vinha Norte"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-400 ml-2">Área (Hectares)</label>
                <div className="relative">
                  <input 
                    type="number"
                    inputMode="decimal"
                    className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl mt-1 dark:text-white outline-none text-lg font-bold"
                    placeholder="0.0"
                    value={newArea}
                    onChange={e => setNewArea(e.target.value)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold bg-gray-200 dark:bg-neutral-700 px-2 py-1 rounded-lg text-xs">
                    ha
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-400 ml-2">Tipo de Cultura</label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {CROP_TYPES.map((crop) => (
                    <button
                      key={crop.label}
                      onClick={() => setSelectedCrop(crop)}
                      className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all border-2 ${
                        selectedCrop.label === crop.label
                          ? 'bg-agro-green/10 border-agro-green'
                          : 'bg-gray-5 dark:bg-neutral-800 border-transparent hover:bg-gray-100 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <span className="text-2xl mb-1">{crop.emoji}</span>
                      <span className={`text-[10px] font-bold ${selectedCrop.label === crop.label ? 'text-agro-green' : 'text-gray-500'}`}>
                        {crop.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={!newName || !newArea}
                className={`w-full py-4 rounded-[1.5rem] font-bold text-lg shadow-lg flex items-center justify-center gap-2 mt-4 transition-all ${
                  !newName || !newArea 
                    ? 'bg-gray-300 dark:bg-neutral-800 text-gray-500 cursor-not-allowed' 
                    : 'bg-agro-green text-white active:scale-95 shadow-agro-green/30'
                }`}
              >
                <Save size={20} />
                Criar Cultivo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- e-GUIAS MODAL (GLOBAL) --- */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowGuideModal(false)}>
          <div 
            className="bg-white dark:bg-neutral-900 w-full max-w-md p-6 rounded-t-[2.5rem] shadow-2xl animate-slide-up border-t border-white/20 max-h-[95vh] overflow-y-auto custom-scrollbar"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black dark:text-white flex items-center gap-2">
                   <Truck className="text-orange-500" size={24} /> Expedição
                </h3>
                <p className="text-xs font-bold text-gray-400 uppercase mt-1">Comercialização & Guia</p>
              </div>
              <button onClick={() => setShowGuideModal(false)} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                <X size={20} className="dark:text-white" />
              </button>
            </div>

            {saleStep === 1 ? (
              <div className="space-y-5">
                 {/* Field Selector (Location) */}
                 <div>
                    <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Local de Carga (Parcela)</label>
                    <select 
                      value={saleData.fieldId}
                      onChange={(e) => setSaleData({...saleData, fieldId: e.target.value})}
                      className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                    >
                      <option value="">Selecione o local...</option>
                      {fields.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                 </div>

                 {/* Stock Selector */}
                 <div>
                    <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">O que vai vender?</label>
                    <select 
                      value={saleData.stockId}
                      onChange={(e) => setSaleData({...saleData, stockId: e.target.value})}
                      className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                    >
                      <option value="">Selecione o produto...</option>
                      {stocks.filter(s => s.quantity > 0).map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.quantity} {s.unit})</option>
                      ))}
                    </select>
                 </div>

                 {/* Quantidade & Preço */}
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Quantidade</label>
                       <input 
                         type="number"
                         placeholder="0"
                         className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                         value={saleData.quantity}
                         onChange={(e) => setSaleData({...saleData, quantity: e.target.value})}
                       />
                    </div>
                    <div>
                       <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Preço Un. (€)</label>
                       <input 
                         type="number"
                         placeholder="0.00"
                         className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                         value={saleData.price}
                         onChange={(e) => setSaleData({...saleData, price: e.target.value})}
                       />
                    </div>
                 </div>

                 <button 
                   onClick={() => setSaleStep(2)}
                   disabled={!saleData.stockId || !saleData.quantity || !saleData.price || !saleData.fieldId}
                   className={`w-full py-4 rounded-[1.5rem] font-bold text-white flex items-center justify-center gap-2 mt-4 transition-all ${!saleData.stockId || !saleData.quantity || !saleData.fieldId ? 'bg-gray-300 dark:bg-neutral-800 cursor-not-allowed text-gray-500' : 'bg-orange-500 shadow-lg shadow-orange-500/30 active:scale-95'}`}
                 >
                   Próximo: Dados de Transporte
                 </button>
              </div>
            ) : (
              <div className="space-y-5 animate-slide-up">
                 {/* Client Info */}
                 <div>
                    <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Cliente</label>
                    <input 
                      placeholder="Nome do Cliente"
                      className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-orange-500 mb-2"
                      value={saleData.clientName}
                      onChange={(e) => setSaleData({...saleData, clientName: e.target.value})}
                    />
                    <input 
                      placeholder="NIF (Opcional)"
                      className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                      value={saleData.clientNif}
                      onChange={(e) => setSaleData({...saleData, clientNif: e.target.value})}
                    />
                 </div>

                 {/* Transport Info */}
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Matrícula</label>
                       <input 
                         placeholder="AA-00-BB"
                         className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none uppercase focus:ring-2 focus:ring-orange-500"
                         value={saleData.plate}
                         onChange={(e) => setSaleData({...saleData, plate: e.target.value})}
                       />
                    </div>
                    <div>
                       <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Data</label>
                       <input 
                         type="date"
                         className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                         value={saleData.date}
                         onChange={(e) => setSaleData({...saleData, date: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className="flex gap-3 pt-2">
                    <button onClick={() => setSaleStep(1)} className="px-6 py-4 bg-gray-200 dark:bg-neutral-800 rounded-[1.5rem] font-bold text-gray-600 dark:text-gray-300">Voltar</button>
                    <button 
                      onClick={generateGuidePDF}
                      disabled={!saleData.clientName || !saleData.plate}
                      className={`flex-1 py-4 rounded-[1.5rem] font-bold text-white flex items-center justify-center gap-2 transition-all ${!saleData.clientName ? 'bg-gray-300 cursor-not-allowed' : 'bg-agro-green shadow-lg shadow-agro-green/30 active:scale-95'}`}
                    >
                      <FileCheck size={20} /> Emitir Guia & Registar
                    </button>
                 </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FIELD NOTEBOOK COMPONENT */}
      <FieldNotebook 
        isOpen={isNotebookOpen}
        onClose={() => setIsNotebookOpen(false)}
        fields={fields}
        stocks={stocks}
        employees={employees} // Pass employees to Notebook for selection
        operatorName={operatorName}
        onSave={onAddLog}
      />

      {showIoTWizard && (
        <IoTPairingWizard 
          onClose={() => setShowIoTWizard(false)}
          fields={fields}
          onPair={(fieldId: string, sensor: Sensor) => {
            onRegisterSensor(fieldId, sensor);
          }}
        />
      )}
    </div>
  );
};

const App = () => {
  const [state, setState] = useState<AppState>(loadState());
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [userName, setUserName] = useState('Agricultor');
  
  // Modals Global States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isChildModalOpen, setIsChildModalOpen] = useState(false); // Track child modals to hide Nav

  // Weather Data
  const [weatherData, setWeatherData] = useState<WeatherForecast[]>(INITIAL_WEATHER);
  const [detailedForecast, setDetailedForecast] = useState<DetailedForecast[]>([]);

  // System State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showOnlineSuccess, setShowOnlineSuccess] = useState(false);

  // Theme - Start as Light by default
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSolarMode, setIsSolarMode] = useState(false);

  // --- ONLINE/OFFLINE EVENT LISTENERS ---
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineSuccess(true);
      setTimeout(() => setShowOnlineSuccess(false), 3000);
      // Try to re-fetch weather when online
      fetchWeather();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchWeather = async () => {
    // Only attempt fetch if online
    if (!navigator.onLine) {
      // Try to load cached weather from localStorage
      const cachedWeather = localStorage.getItem('oriva_cached_weather');
      const cachedHourly = localStorage.getItem('oriva_cached_hourly');
      if (cachedWeather) setWeatherData(JSON.parse(cachedWeather));
      if (cachedHourly) setDetailedForecast(JSON.parse(cachedHourly));
      return;
    }

    try {
      const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&units=metric&lang=pt&appid=${WEATHER_API_KEY}`);
      const current = await currentRes.json();

      const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&units=metric&lang=pt&appid=${WEATHER_API_KEY}`);
      const forecast = await forecastRes.json();

      const sprayData: DetailedForecast[] = forecast.list.slice(0, 8).map((item: any) => ({
        dt: item.dt,
        temp: Math.round(item.main.temp),
        windSpeed: Math.round(item.wind.speed * 3.6),
        humidity: item.main.humidity,
        rainProb: Math.round(item.pop * 100)
      }));
      setDetailedForecast(sprayData);
      localStorage.setItem('oriva_cached_hourly', JSON.stringify(sprayData));

      const mapCondition = (id: number): 'sunny' | 'cloudy' | 'rain' | 'storm' => {
        if (id >= 200 && id < 300) return 'storm';
        if (id >= 300 && id < 600) return 'rain';
        if (id >= 801) return 'cloudy';
        return 'sunny'; 
      };

      const dailyData: WeatherForecast[] = [];

      dailyData.push({
        day: 'Hoje',
        temp: Math.round(current.main.temp),
        condition: mapCondition(current.weather[0].id),
        description: current.weather[0].description,
        windSpeed: Math.round(current.wind.speed * 3.6),
        humidity: current.main.humidity
      });

      const processedDays = new Set<string>();
      const todayDate = new Date().getDate();

      forecast.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000);
        const dateNum = date.getDate();
        const dayName = date.toLocaleDateString('pt-PT', { weekday: 'short' }).replace('.', '');
        const hour = date.getHours();

        if (dateNum !== todayDate && !processedDays.has(dayName)) {
            if (hour >= 11 && hour <= 15) {
              dailyData.push({
                day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
                temp: Math.round(item.main.temp),
                condition: mapCondition(item.weather[0].id),
                description: item.weather[0].description,
                windSpeed: Math.round(item.wind.speed * 3.6),
                humidity: item.main.humidity
              });
              processedDays.add(dayName);
            }
        }
      });

      setWeatherData(dailyData.slice(0, 5));
      localStorage.setItem('oriva_cached_weather', JSON.stringify(dailyData.slice(0, 5)));
      setIsOnline(true);

    } catch (error) {
      console.error("Erro ao obter meteorologia:", error);
      // Fallback to cache if request fails despite being "online"
      const cachedWeather = localStorage.getItem('oriva_cached_weather');
      if (cachedWeather) setWeatherData(JSON.parse(cachedWeather));
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchWeather();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
     if(isSolarMode) {
        document.documentElement.classList.add('solar-mode');
        document.documentElement.classList.remove('dark'); 
     } else {
        document.documentElement.classList.remove('solar-mode');
        if(isDarkMode) document.documentElement.classList.add('dark');
     }
  }, [isSolarMode, isDarkMode]);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const alertCount = useMemo(() => {
    let count = 0;
    
    if (weatherData.length > 0 && (weatherData[0].condition === 'rain' || weatherData[0].condition === 'storm')) {
      count++;
    }
    count += state.animals.filter(a => a.status === 'sick').length;
    count += state.fields.filter(f => f.humidity < 30 || f.healthScore < 70).length;
    count += state.stocks.filter(s => s.quantity <= s.minStock).length;
    count += state.machines.filter(m => {
       const hoursSince = m.engineHours - m.lastServiceHours;
       const overdue = hoursSince > m.serviceInterval;
       const inspectionDue = (new Date(m.nextInspectionDate).getTime() - new Date().getTime()) < (30 * 24 * 60 * 60 * 1000);
       return overdue || inspectionDue;
    }).length;

    return count;
  }, [weatherData, state]);

  const toggleTask = (id: string) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    }));
  };

  const addTask = (title: string, type: 'task' | 'harvest', date?: string, relatedFieldId?: string, relatedStockId?: string, plannedQuantity?: number) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      type,
      date: date || new Date().toISOString().split('T')[0],
      completed: false,
      relatedFieldId,
      relatedStockId,
      plannedQuantity
    };
    setState(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
  };

  const deleteTask = (id: string) => {
    setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
  };

  const handleAddLog = (fieldId: string, log: Omit<FieldLog, 'id'>, stockId?: string) => {
    // ... (Existing log adding logic)
    if (stockId && log.quantity) {
       const stockItem = state.stocks.find(s => s.id === stockId);
       if (!stockItem) return;

       const newStocks = state.stocks.map(s => 
         s.id === stockId ? { ...s, quantity: Math.max(0, s.quantity - (log.quantity || 0)) } : s
       );

       const newLog: FieldLog = { ...log, id: Date.now().toString() };

       const totalCost = (log.quantity || 0) * stockItem.pricePerUnit;
       const newTransaction: Transaction = {
          id: Date.now().toString(),
          date: log.date,
          type: 'expense',
          amount: totalCost,
          category: 'Campo',
          description: `${log.description} (${log.quantity}${stockItem.unit})`
       };

       setState(prev => ({
         ...prev,
         stocks: newStocks,
         fields: prev.fields.map(f => f.id === fieldId ? { ...f, logs: [...(f.logs || []), newLog] } : f),
         transactions: [newTransaction, ...prev.transactions]
       }));

    } else {
      const newLog: FieldLog = { ...log, id: Date.now().toString() };
      
      let newTransactions = [...state.transactions];
      if (log.type === 'labor' && log.cost && log.cost > 0) {
         newTransactions = [{
            id: Date.now().toString(),
            date: log.date,
            type: 'expense',
            amount: log.cost,
            category: 'Salários',
            description: `${log.description} (${log.hoursWorked}h)`
         }, ...newTransactions];
      }

      setState(prev => ({
        ...prev,
        fields: prev.fields.map(f => 
          f.id === fieldId 
          ? { ...f, logs: [...(f.logs || []), newLog] } 
          : f
        ),
        transactions: newTransactions
      }));
    }
  };

  const handleRegisterSale = (saleData: { stockId: string, quantity: number, pricePerUnit: number, clientName: string, date: string, fieldId?: string }) => {
    setState(prev => {
      const stockItem = prev.stocks.find(s => s.id === saleData.stockId);
      if (!stockItem) return prev;

      const newStocks = prev.stocks.map(s => 
        s.id === saleData.stockId 
          ? { ...s, quantity: Math.max(0, s.quantity - saleData.quantity) } 
          : s
      );

      const totalIncome = saleData.quantity * saleData.pricePerUnit;
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        date: saleData.date,
        type: 'income',
        amount: totalIncome,
        category: 'Vendas',
        description: `Venda ${stockItem.name} a ${saleData.clientName}`
      };

      let newFields = prev.fields;
      if (saleData.fieldId) {
        newFields = prev.fields.map(f => {
          if (f.id !== saleData.fieldId) return f;
          return {
            ...f,
            logs: [...f.logs, {
              id: Date.now().toString(),
              date: saleData.date,
              type: 'harvest',
              description: `Venda/Expedição: ${saleData.quantity}${stockItem.unit} para ${saleData.clientName}`,
              quantity: saleData.quantity,
              unit: stockItem.unit,
            }]
          };
        });
      }

      return {
        ...prev,
        stocks: newStocks,
        transactions: [newTransaction, ...prev.transactions],
        fields: newFields
      };
    });
  };

  // --- HARVEST LOGIC ---
  const handleHarvest = (fieldId: string, data: { quantity: number; unit: string; batchId: string; date: string }) => {
    setState(prev => {
      // 1. Find Field to get Crop Name
      const field = prev.fields.find(f => f.id === fieldId);
      if (!field) return prev;

      // 2. Create New Stock Item
      const newStockItem: StockItem = {
        id: Date.now().toString(),
        name: `${field.crop} - ${data.batchId}`,
        category: 'Colheita',
        quantity: data.quantity,
        unit: data.unit,
        minStock: 0,
        pricePerUnit: 0 // To be set later or upon sale
      };

      // 3. Add Log to Field
      const newLog: FieldLog = {
        id: Date.now().toString(),
        date: data.date,
        type: 'harvest',
        description: `Colheita Realizada: Lote ${data.batchId}`,
        quantity: data.quantity,
        unit: data.unit
      };

      return {
        ...prev,
        stocks: [...prev.stocks, newStockItem],
        fields: prev.fields.map(f => 
          f.id === fieldId 
            ? { ...f, logs: [...(f.logs || []), newLog] } 
            : f
        )
      };
    });
  };

  const toggleIrrigation = (id: string, status: boolean) => {
    setState(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === id ? { ...f, irrigationStatus: status } : f)
    }));
  };

  const handleUseStockOnField = (fieldId: string, stockId: string, quantity: number, date: string) => {};

  const addField = (fieldData: Pick<Field, 'name' | 'areaHa' | 'crop' | 'emoji'>) => {
     const newField: Field = {
       id: Date.now().toString(),
       ...fieldData,
       yieldPerHa: 0,
       coordinates: [41.442, -8.723], 
       polygon: [],
       irrigationStatus: false,
       humidity: 50,
       temp: 20,
       healthScore: 100,
       harvestWindow: 'N/A',
       history: [],
       logs: []
     };
     setState(prev => ({ ...prev, fields: [...prev.fields, newField] }));
  };

  const handleRegisterSensor = (fieldId: string, sensor: Sensor) => {
     setState(prev => ({
        ...prev,
        fields: prev.fields.map(f => f.id === fieldId ? { ...f, sensors: [...(f.sensors || []), sensor] } : f)
     }));
  };

  // ... (Other handlers: addAnimal, updateAnimal, etc. kept same)
  const addAnimal = (animal: Omit<Animal, 'id'>) => {
    setState(prev => ({ ...prev, animals: [...prev.animals, { ...animal, id: Date.now().toString() }] }));
  };
  const updateAnimal = (id: string, updates: Partial<Animal>) => {
    setState(prev => ({ ...prev, animals: prev.animals.map(a => a.id === id ? { ...a, ...updates } : a) }));
  };
  const addProduction = (id: string, value: number, type: 'milk' | 'weight') => {
    setState(prev => ({
      ...prev,
      animals: prev.animals.map(a => {
        if (a.id !== id) return a;
        return {
          ...a,
          productionHistory: [...a.productionHistory, { date: new Date().toISOString().split('T')[0], value, type }],
          weight: type === 'weight' ? value : a.weight
        };
      })
    }));
  };
  const updateMachineHours = (id: string, hours: number) => {
    setState(prev => ({ ...prev, machines: prev.machines.map(m => m.id === id ? { ...m, engineHours: hours } : m) }));
  };
  const addMachineLog = (machineId: string, log: Omit<MaintenanceLog, 'id'>) => {
    setState(prev => {
      const machine = prev.machines.find(m => m.id === machineId);
      const machineName = machine ? machine.name : 'Máquina';
      return {
        ...prev,
        machines: prev.machines.map(m => m.id === machineId ? { ...m, logs: [...m.logs, { ...log, id: Date.now().toString() }] } : m),
        transactions: log.cost ? [{
           id: Date.now().toString(),
           date: log.date,
           type: 'expense',
           amount: log.cost,
           category: log.type === 'fuel' ? 'Combustível' : 'Manutenção',
           description: `${log.description} (${machineName})`
        }, ...prev.transactions] : prev.transactions
      };
    });
  };
  const handleAddTransaction = (tx: Omit<Transaction, 'id'>) => {
    setState(prev => ({ ...prev, transactions: [{ ...tx, id: Date.now().toString() }, ...prev.transactions] }));
  };
  const handleUpdateStock = (id: string, delta: number) => {
    setState(prev => ({ ...prev, stocks: prev.stocks.map(s => s.id === id ? { ...s, quantity: Math.max(0, s.quantity + delta) } : s) }));
  };
  const handleAddStock = (item: Omit<StockItem, 'id'>) => {
    setState(prev => ({ ...prev, stocks: [...prev.stocks, { ...item, id: Date.now().toString() }] }));
  };
  const handleEditStock = (id: string, updates: Partial<StockItem>) => {
    setState(prev => ({ ...prev, stocks: prev.stocks.map(s => s.id === id ? { ...s, ...updates } : s) }));
  };
  const handleChildModalChange = (isOpen: boolean) => {
    setIsChildModalOpen(isOpen);
  };

  const shouldHideNav = isChildModalOpen || isSettingsOpen || isNotificationsOpen;

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-black overflow-hidden transition-colors duration-300">
      
      {/* OFFLINE INDICATOR BANNER */}
      {!isOnline && (
        <div className="absolute top-0 left-0 right-0 z-[100] bg-orange-500 text-white text-[10px] font-bold text-center py-1 uppercase tracking-widest flex items-center justify-center gap-2 animate-slide-down shadow-md">
           <WifiOff size={12} /> Modo Offline • Dados Guardados no Dispositivo
        </div>
      )}
      
      {/* ONLINE RESTORED BANNER */}
      {showOnlineSuccess && (
        <div className="absolute top-0 left-0 right-0 z-[100] bg-green-500 text-white text-[10px] font-bold text-center py-1 uppercase tracking-widest flex items-center justify-center gap-2 animate-slide-down shadow-md">
           <Wifi size={12} /> Conexão Restaurada • Sincronizado
        </div>
      )}

      {/* Scrollable Content Area */}
      <main className={`flex-1 overflow-y-auto scrollbar-hide w-full max-w-md md:max-w-5xl mx-auto relative px-4 md:px-8 pb-28 ${(!isOnline || isSyncing || showOnlineSuccess) ? 'pt-14' : 'pt-2'} transition-all duration-300`}>
        {activeTab === 'dashboard' && (
          <DashboardHome 
            userName={userName}
            weather={weatherData} 
            hourlyForecast={detailedForecast}
            tasks={state.tasks}
            fields={state.fields}
            machines={state.machines || []} 
            stocks={state.stocks} 
            onToggleTask={toggleTask}
            onAddTask={addTask}
            onDeleteTask={deleteTask}
            onWeatherClick={() => setIsNotificationsOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onModalChange={handleChildModalChange}
            onUpdateMachineHours={updateMachineHours} 
            onAddMachineLog={addMachineLog} 
            alertCount={alertCount}
          />
        )}
        {activeTab === 'animal' && (
          <AnimalCard 
            animals={state.animals} 
            onAddProduction={addProduction} 
            onAddAnimal={addAnimal}
            onUpdateAnimal={updateAnimal} 
            onScheduleTask={addTask}
            onModalChange={handleChildModalChange} // Pass modal change handler
          />
        )}
        {activeTab === 'cultivation' && (
          <CultivationView 
            fields={state.fields}
            stocks={state.stocks} 
            employees={state.employees || []}
            toggleIrrigation={toggleIrrigation}
            onAddLog={handleAddLog}
            onUseStock={handleUseStockOnField}
            onAddField={addField}
            onRegisterSensor={handleRegisterSensor}
            onModalChange={handleChildModalChange}
            operatorName={userName}
            onRegisterSale={handleRegisterSale}
            onHarvest={handleHarvest} // Pass logic here
          />
        )}
        {activeTab === 'stocks' && (
          <StockManager 
            stocks={state.stocks}
            onUpdateStock={handleUpdateStock}
            onAddStock={handleAddStock}
            onEditStock={handleEditStock}
            onModalChange={handleChildModalChange}
          />
        )}
        {activeTab === 'machines' && (
          <MachineManager 
            machines={state.machines}
            stocks={state.stocks}
            onUpdateHours={updateMachineHours}
            onAddLog={addMachineLog}
            onAddMachine={(m: Omit<Machine, 'id' | 'logs'>) => setState(prev => ({ ...prev, machines: [...prev.machines, { ...m, id: Date.now().toString(), logs: [] }] }))}
            onModalChange={handleChildModalChange}
          />
        )}
        {activeTab === 'finance' && (
          <FinanceManager 
            transactions={state.transactions}
            stocks={state.stocks}
            onAddTransaction={handleAddTransaction}
            onModalChange={handleChildModalChange}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 shadow-2xl rounded-[2.5rem] px-2 py-3 flex items-end justify-between z-40 w-[96%] max-w-sm md:max-w-md mx-auto backdrop-blur-md bg-opacity-90 dark:bg-opacity-90 transition-all duration-300 ease-in-out ${
         shouldHideNav ? 'translate-y-[200%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}>
         {[
           { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
           { id: 'cultivation', icon: Sprout, label: 'Cultivo' },
           { id: 'animal', icon: PawPrint, label: 'Animais' },
           { id: 'stocks', icon: Package, label: 'Stock' },
           { id: 'machines', icon: Tractor, label: 'Frota' },
           { id: 'finance', icon: Wallet, label: 'Finanças' },
         ].map(tab => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={`transition-all duration-300 flex flex-col items-center justify-center rounded-2xl ${
               activeTab === tab.id 
                 ? 'bg-agro-green text-white shadow-lg shadow-agro-green/30 -translate-y-2 py-2 px-3 min-w-[56px] mb-1' 
                 : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-transparent p-2 mb-1'
             }`}
           >
             <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
             {activeTab === tab.id && (
               <span className="text-[9px] font-bold mt-1 animate-fade-in whitespace-nowrap leading-none">
                 {tab.label}
               </span>
             )}
           </button>
         ))}
      </nav>

      {/* Global Modals */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        onResetData={() => setState(loadState())} 
        currentName={userName}
        onSaveName={setUserName}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        isSolarMode={isSolarMode}
        onToggleSolarMode={() => setIsSolarMode(!isSolarMode)}
      />
      
      <NotificationsModal 
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        weather={weatherData}
        animals={state.animals}
        fields={state.fields}
        stocks={state.stocks}
        machines={state.machines}
        onNavigate={(tab) => setActiveTab(tab as TabId)}
      />

      <InstallPrompt />

    </div>
  );
};

export default App;
