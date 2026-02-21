import React, { useState } from 'react';
import { X, Radio, Signal, Loader2, Droplets, Activity, CheckCircle2, ChevronDown, Save, Bluetooth, Usb, Globe } from 'lucide-react';
import mqtt from 'mqtt';
import { Field, Sensor } from '../types';

const MQTT_BROKER_URL = 'wss://broker.emqx.io:8084/mqtt';
const MQTT_TOPIC_SCAN = 'oriva/scan/sim';

interface IoTPairingWizardProps {
    onClose: () => void;
    fields: Field[];
    onPair: (fieldId: string, sensor: Sensor) => void;
}

const IoTPairingWizard: React.FC<IoTPairingWizardProps> = ({ onClose, fields, onPair }) => {
    const [scanStatus, setScanStatus] = useState<'idle' | 'protocol_choice' | 'scanning' | 'found'>('idle');
    const [protocol, setProtocol] = useState<'mqtt' | 'bluetooth' | 'serial' | null>(null);
    const [foundDevices, setFoundDevices] = useState<Sensor[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<Sensor | null>(null);
    const [customDeviceName, setCustomDeviceName] = useState('');
    const [selectedFieldId, setSelectedFieldId] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const scanBluetooth = async () => {
        if (!('bluetooth' in navigator)) {
            alert("O seu browser não suporta Web Bluetooth.");
            return;
        }

        try {
            setScanStatus('scanning');
            // @ts-ignore - Web Bluetooth API
            const device = await (navigator as any).bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['battery_service', 'environmental_sensing']
            });

            const newSensor: Sensor = {
                id: device.id,
                name: device.name || 'Sensor Bluetooth',
                type: 'moisture',
                batteryLevel: 100,
                signalStrength: 100,
                lastSeen: new Date().toISOString(),
                status: 'pairing',
                metadata: {
                    protocol: 'ble',
                    deviceId: device.id
                }
            };

            setFoundDevices([newSensor]);
            setScanStatus('found');
        } catch (err) {
            console.error(err);
            setScanStatus('idle');
        }
    };

    const scanSerial = async () => {
        if (!('serial' in navigator)) {
            alert("O seu browser não suporta Web Serial.");
            return;
        }

        try {
            setScanStatus('scanning');
            // @ts-ignore - Web Serial API
            const port = await (navigator as any).serial.requestPort();
            await port.open({ baudRate: 9600 });

            const newSensor: Sensor = {
                id: `serial-${Math.floor(Math.random() * 1000)}`,
                name: 'Sensor Serial (USB)',
                type: 'moisture',
                batteryLevel: 100,
                signalStrength: 100,
                lastSeen: new Date().toISOString(),
                status: 'pairing',
                metadata: {
                    protocol: 'serial',
                    deviceId: 'com-port'
                }
            };

            setFoundDevices([newSensor]);
            setScanStatus('found');
        } catch (err) {
            console.error(err);
            setScanStatus('idle');
        }
    };

    const startScanning = () => {
        if (protocol === 'bluetooth') {
            scanBluetooth();
            return;
        }
        if (protocol === 'serial') {
            scanSerial();
            return;
        }

        if (!navigator.onLine) {
            alert("A pesquisa de sensores via Cloud requer conexão à internet.");
            return;
        }

        setScanStatus('scanning');
        setFoundDevices([]);

        const client = mqtt.connect(MQTT_BROKER_URL);

        client.on('connect', () => {
            client.subscribe(MQTT_TOPIC_SCAN);
            setTimeout(() => {
                const mockSensor1: Sensor = {
                    id: `lora-${Math.floor(Math.random() * 10000)}`,
                    name: 'Oriva Soil Probe v2 (Cloud)',
                    type: 'moisture',
                    batteryLevel: 98,
                    signalStrength: -65,
                    lastSeen: new Date().toISOString(),
                    status: 'pairing',
                    metadata: { protocol: 'mqtt' }
                };
                client.publish(MQTT_TOPIC_SCAN, JSON.stringify(mockSensor1));
            }, 1000);
        });

        client.on('message', (topic, message) => {
            if (topic === MQTT_TOPIC_SCAN) {
                try {
                    const device = JSON.parse(message.toString()) as Sensor;
                    setFoundDevices(prev => {
                        if (prev.find(d => d.id === device.id)) return prev;
                        return [...prev, device];
                    });
                } catch (e) {
                    console.error("Invalid MQTT payload");
                }
            }
        });

        setTimeout(() => {
            client.end();
            setScanStatus('found');
        }, 4000);
    };

    const confirmPairing = () => {
        if (selectedDevice && selectedFieldId) {
            onPair(selectedFieldId, {
                ...selectedDevice,
                name: customDeviceName || selectedDevice.name,
                status: 'online',
                signalStrength: Math.abs(selectedDevice.signalStrength)
            });
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1500);
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

                {isSuccess ? (
                    <div className="py-12 flex flex-col items-center justify-center animate-bounce-in">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 size={48} className="text-green-600 dark:text-green-400" />
                        </div>
                        <h4 className="text-xl font-black dark:text-white mb-2 text-center uppercase tracking-tighter italic">Sensor Associado!</h4>
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">A Sincronizar com a Nuvem...</p>
                    </div>
                ) : (
                    <>
                        {scanStatus === 'idle' && (
                            <div className="text-center py-4">
                                <div className="w-24 h-24 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                    <Radio size={40} className="text-gray-400" />
                                    <div className="absolute top-0 right-0 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                        <Signal size={16} className="text-blue-600" />
                                    </div>
                                </div>
                                <h4 className="font-bold dark:text-white mb-2 text-lg">Ponte IoT</h4>
                                <p className="text-sm text-gray-500 font-medium mb-6 px-4 leading-relaxed">
                                    Como deseja ligar o seu sensor?
                                </p>

                                <div className="grid grid-cols-1 gap-3 mb-6">
                                    <button
                                        onClick={() => { setProtocol('bluetooth'); startScanning(); }}
                                        className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl transition-all"
                                    >
                                        <div className="p-3 bg-white dark:bg-neutral-800 rounded-xl text-blue-600 shadow-sm"><Bluetooth size={20} /></div>
                                        <div className="text-left">
                                            <p className="text-sm font-black text-blue-900 dark:text-blue-100">Bluetooth (BLE)</p>
                                            <p className="text-[10px] font-bold text-blue-500/60 uppercase">Hardware Próximo</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => { setProtocol('serial'); startScanning(); }}
                                        className="flex items-center gap-4 p-4 bg-agro-green/5 dark:bg-agro-green/10 hover:bg-agro-green/10 dark:hover:bg-agro-green/20 border border-agro-green/10 dark:border-agro-green/20 rounded-2xl transition-all"
                                    >
                                        <div className="p-3 bg-white dark:bg-neutral-800 rounded-xl text-agro-green shadow-sm"><Usb size={20} /></div>
                                        <div className="text-left">
                                            <p className="text-sm font-black text-agro-green dark:text-green-100">Web Serial (USB)</p>
                                            <p className="text-[10px] font-bold text-agro-green/60 uppercase">Ligação por Cabo</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => { setProtocol('mqtt'); startScanning(); }}
                                        className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-neutral-800/50 hover:bg-gray-100 dark:hover:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-2xl transition-all"
                                    >
                                        <div className="p-3 bg-white dark:bg-neutral-800 rounded-xl text-gray-500 shadow-sm"><Globe size={20} /></div>
                                        <div className="text-left">
                                            <p className="text-sm font-black text-gray-900 dark:text-white font-mono">MQTT Cloud</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Longa Distância / LoRa</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {scanStatus === 'scanning' && (
                            <div className="py-8 flex flex-col items-center">
                                <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
                                    <div className="absolute inset-4 bg-green-500/20 rounded-full animate-ping delay-100"></div>
                                    <div className="absolute inset-8 bg-green-500/20 rounded-full animate-ping delay-200"></div>
                                    <div className="relative z-10 w-16 h-16 bg-white dark:bg-neutral-800 rounded-full flex items-center justify-center shadow-lg">
                                        <Loader2 size={32} className="animate-spin text-agro-green" />
                                    </div>
                                </div>
                                <h4 className="font-bold text-gray-900 dark:text-white mb-2">A procurar dispositivos...</h4>
                                <p className="text-xs text-gray-500 mb-6"> {protocol === 'bluetooth' ? 'Procure o sensor na janela do browser.' : protocol === 'serial' ? 'Selecione a porta USB.' : 'Mantenha o sensor ligado e próximo.'}</p>
                                <div className="w-full space-y-2 mb-6">
                                    {foundDevices.map(device => (
                                        <div key={device.id} className="bg-gray-50 dark:bg-neutral-800 p-3 rounded-2xl flex items-center gap-3 animate-slide-up">
                                            <div className="p-2 bg-white dark:bg-neutral-700 rounded-xl">
                                                {device.metadata?.protocol === 'ble' ? <Bluetooth size={16} className="text-blue-500" /> : device.metadata?.protocol === 'serial' ? <Usb size={16} className="text-agro-green" /> : <Globe size={16} className="text-gray-400" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold dark:text-white">{device.name}</p>
                                                <p className="text-[10px] text-gray-400 font-mono">{device.id}</p>
                                            </div>
                                            <span className="text-[10px] font-bold text-green-600">Encontrado</span>
                                        </div>
                                    ))}
                                </div>

                                <button onClick={() => setScanStatus('idle')} className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">Cancelar pesquisa</button>
                            </div>
                        )}

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
                                                <div className="flex justify-between items-center mb-2">
                                                    <p className="text-xs font-bold text-gray-400 uppercase">Selecione um dispositivo</p>
                                                    <button onClick={() => setScanStatus('idle')} className="text-[10px] font-bold text-agro-green uppercase tracking-tighter">Mudar Modo</button>
                                                </div>
                                                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                                                    {foundDevices.map(device => (
                                                        <button
                                                            key={device.id}
                                                            onClick={() => { setSelectedDevice(device); setCustomDeviceName(device.name); }}
                                                            className="w-full bg-gray-50 dark:bg-neutral-800 hover:bg-green-50 dark:hover:bg-green-900/10 p-3 rounded-2xl flex items-center gap-3 border-2 border-transparent hover:border-agro-green transition-all text-left"
                                                        >
                                                            <div className="p-2 bg-white dark:bg-neutral-700 rounded-xl shadow-sm">
                                                                {device.metadata?.protocol === 'ble' ? <Bluetooth size={18} className="text-blue-500" /> : device.metadata?.protocol === 'serial' ? <Usb size={18} className="text-agro-green" /> : <Globe size={18} className="text-gray-400" />}
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
                                                    <input value={customDeviceName} onChange={(e) => setCustomDeviceName(e.target.value)} className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Associar a Parcela</label>
                                                    <select value={selectedFieldId} onChange={(e) => setSelectedFieldId(e.target.value)} className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green appearance-none">
                                                        <option value="">Selecione...</option>
                                                        {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex gap-3 pt-2">
                                                    <button onClick={() => setSelectedDevice(null)} className="px-6 py-4 bg-gray-200 dark:bg-neutral-800 rounded-2xl font-bold text-gray-600 dark:text-gray-300">Voltar</button>
                                                    <button onClick={confirmPairing} disabled={!selectedFieldId} className={`flex-1 py-4 bg-agro-green text-white rounded-2xl font-bold shadow-lg shadow-agro-green/30 active:scale-95 transition-transform flex items-center justify-center gap-2 ${!selectedFieldId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                        <Save size={18} /> Guardar
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default IoTPairingWizard;
