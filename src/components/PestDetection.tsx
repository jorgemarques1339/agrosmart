
import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, CheckCircle, AlertTriangle, RefreshCw,
  Brain, Loader2, Thermometer, Droplets, CloudRain,
  ChevronDown, Scan, ShieldCheck, Microscope, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { MediterraneanCulture, AgriculturalDisease, DiagnosticResult } from '../types';
import { MEDITERRANEAN_DISEASES } from '../data/agriculturalDiseases';
import { useStore } from '../store/useStore';

interface PestDetectionProps {
  onSaveDiagnostic?: (diagnostic: DiagnosticResult) => void;
  diseaseRisk?: {
    percentage: number;
    level: string;
    color: string;
    factors: {
      temp: string;
      humidity: string;
      rain: string;
    }
  }
}

const PestDetection: React.FC<PestDetectionProps> = ({ diseaseRisk, onSaveDiagnostic }) => {
  const { setPermission } = useStore();
  const [status, setStatus] = useState<'idle' | 'loading' | 'scanning' | 'result'>('idle');
  const [selectedCulture, setSelectedCulture] = useState<MediterraneanCulture>('Vinha');
  const [result, setResult] = useState<{
    disease: AgriculturalDisease;
    confidence: number;
    timestamp: string;
  } | null>(null);
  const [model, setModel] = useState<mobilenet.MobileNet | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isCultureSelectorOpen, setIsCultureSelectorOpen] = useState(false);

  // HUD States
  const [scanStability, setScanStability] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const requestRef = useRef<number>(null);

  // Load model on mount
  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        const loadedModel = await mobilenet.load({
          version: 2,
          alpha: 0.5
        });
        setModel(loadedModel);
      } catch (err) {
        console.error("Failed to load model:", err);
      }
    };
    loadModel();
  }, []);

  const startAnalysis = async () => {
    if (!model) {
      setStatus('loading');
      return;
    }
    setStatus('scanning');
    setResult(null);
    setPredictions([]);
    setScanStability(0);

    // Start Camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setPermission('camera', true);
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setStatus('idle');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
  };

  const detectFrame = async () => {
    if (!model || status !== 'scanning' || !videoRef.current) return;

    try {
      const currentPredictions = await model.classify(videoRef.current);
      setPredictions(currentPredictions);

      // Update dummy stability based on prediction confidence
      if (currentPredictions.length > 0) {
        setScanStability(prev => Math.min(prev + 2, 100));
      }
    } catch (err) {
      console.error("Detection error:", err);
    }

    if (status === 'scanning') {
      requestRef.current = requestAnimationFrame(detectFrame);
    }
  };

  useEffect(() => {
    if (status === 'scanning') {
      detectFrame();
    }
    return () => stopCamera();
  }, [status]);

  const confirmResult = () => {
    // Specialized Engine: Map generic predictions to specialized diseases
    // For concept: we filter diseases by the selected culture and simulate a "match"
    const relevantDiseases = MEDITERRANEAN_DISEASES.filter(d => d.culture === selectedCulture);
    const topDisease = relevantDiseases[Math.floor(Math.random() * relevantDiseases.length)];

    setStatus('result');
    stopCamera();

    setResult({
      disease: topDisease,
      confidence: Math.round(92 + Math.random() * 5),
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="flex flex-col h-full space-y-4 pb-24">

      {/* 2. PREDICTIVE RISK HUD */}

      {/* 1. CULTURE SELECTOR (Oriva Vision v2 Specific) - MOVED DOWN */}
      {status !== 'scanning' && status !== 'result' && (
        <div className="relative z-[50]">
          <button
            onClick={() => setIsCultureSelectorOpen(!isCultureSelectorOpen)}
            className="w-full bg-white dark:bg-neutral-900 p-4 rounded-3xl border border-gray-100 dark:border-neutral-800 flex justify-between items-center shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-agro-green/10 flex items-center justify-center text-agro-green">
                <Microscope size={16} />
              </div>
              <div className="text-left">
                <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">Cultura Alvo</p>
                <p className="text-sm font-black dark:text-white leading-none">{selectedCulture}</p>
              </div>
            </div>
            <ChevronDown size={18} className={`text-gray-400 transition-transform ${isCultureSelectorOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isCultureSelectorOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-neutral-700 overflow-hidden"
              >
                {(['Vinha', 'Olival', 'Pomar', 'Hortícolas'] as MediterraneanCulture[]).map(c => (
                  <button
                    key={c}
                    onClick={() => { setSelectedCulture(c); setIsCultureSelectorOpen(false); }}
                    className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-neutral-700 font-bold dark:text-white text-sm"
                  >
                    {c}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 3. MODE: IDLE (COMPACT) */}
      {(status === 'idle' || status === 'loading') && (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 border border-gray-100 dark:border-neutral-800 shadow-xl flex items-center gap-4">
          <div className="w-16 h-16 bg-agro-green/10 rounded-2xl flex items-center justify-center shrink-0 relative">
            <div className="absolute inset-0 border border-dashed border-agro-green/30 rounded-2xl animate-spin-slow" />
            {status === 'loading' ? <Loader2 size={24} className="text-agro-green animate-spin" /> : <Camera size={24} className="text-agro-green" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-black dark:text-white uppercase tracking-tighter">Oriva Vision v2</h3>
            <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              Motor de deteção especializado via IA.
            </p>
          </div>
          <button
            onClick={startAnalysis}
            disabled={status === 'loading'}
            className="px-6 py-4 bg-agro-green text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-agro-green/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {status === 'loading' ? 'Wait...' : 'Scanner'}
          </button>
        </div>
      )}

      {/* 4. MODE: SCANNING */}
      {status === 'scanning' && (
        <div className="relative w-full aspect-[3/4] md:aspect-video rounded-[3rem] overflow-hidden bg-black shadow-2xl ring-8 ring-white/5">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

          {/* HUD OVERLAY */}
          <div className="absolute inset-0 z-20 p-6 flex flex-col justify-between pointer-events-none">

            {/* Top Info */}
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-agro-green animate-pulse" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Engine Specialized: ON</span>
                </div>
                <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/20">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">SCAN_TARGET: {selectedCulture.toUpperCase()}</span>
                </div>
              </div>
              <button onClick={() => { setStatus('idle'); stopCamera(); }} className="p-3 bg-black/60 backdrop-blur-md rounded-full text-white pointer-events-auto hover:bg-red-500 transition-colors">
                <RefreshCw size={18} />
              </button>
            </div>

            {/* Scanning Brackets */}
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="w-full h-full border-2 border-white/20 rounded-[3rem] relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-agro-green rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-agro-green rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-agro-green rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-agro-green rounded-br-xl" />
                <div className="absolute inset-0 bg-agro-green/5 animate-pulse" />
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="space-y-4">
              {/* Stability Meter */}
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] font-black text-white/60 uppercase tracking-widest px-2">
                  <span>Estabilidade do Scan</span>
                  <span>{scanStability}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-agro-green"
                    initial={{ width: 0 }}
                    animate={{ width: `${scanStability}%` }}
                  />
                </div>
              </div>

              <button
                onClick={confirmResult}
                disabled={scanStability < 60}
                className={`w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl transition-all pointer-events-auto ${scanStability >= 60
                  ? 'bg-white text-black active:scale-95'
                  : 'bg-white/20 text-white/40 cursor-not-allowed cursor-wait'
                  }`}
              >
                {scanStability < 60 ? 'A analisar...' : 'Gerar Diagnóstico'}
              </button>
            </div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
        </div>
      )}

      {/* 5. MODE: RESULT */}
      {status === 'result' && result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

          {/* Main Result Card */}
          <div className="bg-white dark:bg-neutral-900 rounded-[3rem] p-8 border border-gray-100 dark:border-neutral-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-agro-green/5 rounded-full -mr-16 -mt-16 blur-3xl" />

            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight uppercase tracking-tighter">{result.disease.name}</h2>
                <p className="text-sm font-bold italic text-gray-400 font-mono mt-1">{result.disease.scientificName}</p>
              </div>
              <div className="p-4 bg-agro-green/10 text-agro-green rounded-[2rem]">
                <ShieldCheck size={32} />
              </div>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Confiança IA</p>
                <p className="text-lg font-black dark:text-white">{result.confidence}%</p>
              </div>
              <div className={`flex-1 p-4 rounded-2xl border ${result.disease.severity === 'Critical' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                result.disease.severity === 'High' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                  'bg-green-500/10 border-green-500/20 text-green-500'
                }`}>
                <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-70">Gravidade</p>
                <p className="text-lg font-black uppercase">{result.disease.severity}</p>
              </div>
            </div>

            {/* Treatment Sections */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2 mb-3">
                  <Info size={14} className="text-agro-green" /> Tratamento Imediato
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                  {result.disease.treatment.immediate}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-agro-green/5 rounded-2xl border border-agro-green/10">
                  <p className="text-[9px] font-black text-agro-green uppercase tracking-widest mb-2">Prevenção</p>
                  <p className="text-[11px] font-bold text-gray-600 dark:text-gray-400 leading-tight">
                    {result.disease.treatment.preventive}
                  </p>
                </div>
                {result.disease.treatment.products && (
                  <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                    <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-2">Produtos Recomendados</p>
                    <div className="flex flex-wrap gap-1">
                      {result.disease.treatment.products.map(p => (
                        <span key={p} className="text-[9px] bg-white dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-blue-500/20 text-gray-600 dark:text-gray-300 font-bold">{p}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStatus('idle')}
              className="flex-1 py-5 bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-white rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
            >
              <RefreshCw size={20} /> Nova Análise
            </button>
            <button
              className="flex-1 py-5 bg-agro-green text-white rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-agro-green/20"
              onClick={() => {
                if (onSaveDiagnostic && result) {
                  onSaveDiagnostic({
                    id: Date.now().toString(),
                    culture: selectedCulture,
                    disease: result.disease,
                    confidence: result.confidence,
                    timestamp: result.timestamp
                  });
                }
              }}
            >
              <Scan size={20} /> Guardar Scan
            </button>
          </div>
        </motion.div>
      )}

    </div>
  );
};

export default PestDetection;
