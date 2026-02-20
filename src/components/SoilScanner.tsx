import React, { useState, useRef } from 'react';
import { Camera, Scan, CheckCircle2, AlertTriangle, FlaskConical, Sprout, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { haptics } from '../utils/haptics';

interface SoilAnalysisResult {
    id: string;
    date: string;
    npk: {
        n: number; // Nitrogen (mg/kg)
        p: number; // Phosphorus (mg/kg)
        k: number; // Potassium (mg/kg)
        ph: number;
    };
    deficiencies: string[];
    recommendation: {
        product: string;
        dosage: string;
        reason: string;
    }[];
}

interface SoilScannerProps {
    onSaveAnalysis: (result: SoilAnalysisResult) => void;
}

const SoilScanner: React.FC<SoilScannerProps> = ({ onSaveAnalysis }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [result, setResult] = useState<SoilAnalysisResult | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
    };

    React.useEffect(() => {
        return () => stopCamera();
    }, []);

    const startScan = async () => {
        setIsScanning(true);
        setScanProgress(0);
        setResult(null);
        haptics.medium();

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } },
                audio: false
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch(e => console.error("Play prevented", e));
                };
            }
        } catch (err) {
            console.error("Camera access denied:", err);
            alert("Acesso à câmara negado ou dispositivo indisponível. Verifique as permissões do seu dispositivo ou navegador. (Nota: Pode não funcionar se a aplicação não estiver servida sobre HTTPS).");
            setIsScanning(false);
            return;
        }

        // Simulate scanning progress while showing real camera feed
        let progress = 0;
        scanIntervalRef.current = setInterval(() => {
            progress += 5;
            setScanProgress(progress);
            if (progress % 20 === 0) haptics.light();

            if (progress >= 100) {
                stopCamera();
                setIsScanning(false);
                haptics.success();
                generateMockResult();
            }
        }, 150);
    };

    const generateMockResult = () => {
        // Randomize slightly for demo
        const n = Math.floor(Math.random() * (40 - 10) + 10); // Low N
        const p = Math.floor(Math.random() * (60 - 30) + 30); // Medium P
        const k = Math.floor(Math.random() * (200 - 100) + 100); // Good K
        const ph = Number((Math.random() * (7.5 - 5.5) + 5.5).toFixed(1));

        const mockResult: SoilAnalysisResult = {
            id: crypto.randomUUID(),
            date: new Date().toISOString().split('T')[0],
            npk: { n, p, k, ph },
            deficiencies: n < 20 ? ['Nitrogénio (N)'] : [],
            recommendation: []
        };

        // Simple Logic for Recommendation
        if (n < 20) {
            mockResult.recommendation.push({
                product: 'Nitrato de Amónio 27%',
                dosage: '150 kg/ha',
                reason: 'Níveis críticos de Nitrogénio detetados. Aplicação imediata recomendada.'
            });
        }
        if (ph < 6.0) {
            mockResult.recommendation.push({
                product: 'Calcário Dolomítico',
                dosage: '2000 kg/ha',
                reason: 'Acidez do solo elevada (pH < 6.0). Correção necessária.'
            });
        }

        if (mockResult.recommendation.length === 0) {
            mockResult.recommendation.push({
                product: 'Manutenção Padrão (NPK 15-15-15)',
                dosage: '50 kg/ha',
                reason: 'Solo equilibrado. Manter níveis nutricionais.'
            });
        }

        setResult(mockResult);
    };

    return (
        <div className="space-y-6">
            <div className="bg-black/90 rounded-[2rem] overflow-hidden relative shadow-2xl border border-white/10 aspect-[4/3] md:aspect-[16/9] group">
                {/* Viewfinder Overlay */}
                <div className="absolute inset-0 z-10 p-8 flex flex-col justify-between pointer-events-none">
                    <div className="flex justify-between">
                        <div className="w-16 h-16 border-l-4 border-t-4 border-white/30 rounded-tl-3xl" />
                        <div className="w-16 h-16 border-r-4 border-t-4 border-white/30 rounded-tr-3xl" />
                    </div>
                    <div className="flex justify-between">
                        <div className="w-16 h-16 border-l-4 border-b-4 border-white/30 rounded-bl-3xl" />
                        <div className="w-16 h-16 border-r-4 border-b-4 border-white/30 rounded-br-3xl" />
                    </div>
                </div>

                {/* Scan Line Animation */}
                {isScanning && (
                    <motion.div
                        className="absolute inset-x-0 h-1 bg-green-400 shadow-[0_0_20px_rgba(74,222,128,0.8)] z-20"
                        initial={{ top: '10%' }}
                        animate={{ top: '90%' }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear", repeatType: "reverse" }}
                    />
                )}

                {/* Real Camera Feed */}
                <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center overflow-hidden">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={clsx("w-full h-full object-cover", (!isScanning || result) ? "hidden" : "block")}
                    />

                    {!isScanning && !result && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-40 z-10 bg-neutral-800">
                            <ArrowRight size={48} className="mx-auto mb-2 text-white" />
                            <p className="text-white font-bold uppercase tracking-widest px-4">Aponte para o relatório de solo para analisar online</p>
                        </div>
                    )}

                    {result && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-8 z-30">
                            <CheckCircle2 size={64} className="text-agro-green mb-4" />
                            <h3 className="text-2xl font-black uppercase text-center leading-tight">Análise Concluída</h3>
                            <p className="opacity-70 text-center mt-2">Dados OCR extraídos com sucesso.</p>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
                    {!isScanning && !result && (
                        <button
                            onClick={startScan}
                            className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                        >
                            <Camera size={28} />
                        </button>
                    )}
                    {isScanning && (
                        <div className="bg-black/50 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 text-white font-mono text-sm">
                            A processar OCR... {scanProgress}%
                        </div>
                    )}
                    {result && (
                        <button
                            onClick={() => {
                                setResult(null);
                                setScanProgress(0);
                            }}
                            className="px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white font-bold uppercase text-xs transition-colors border border-white/10"
                        >
                            Nova Leitura
                        </button>
                    )}
                </div>
            </div>

            {/* Results Panel */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        {/* NPK Gauges */}
                        <div className="bg-white dark:bg-neutral-900 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
                                    <FlaskConical size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase text-gray-900 dark:text-white">Composição Química</h3>
                                    <p className="text-xs text-gray-400 font-bold uppercase">Fonte: Relatório OCR</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span>Nitrogénio (N)</span>
                                        <span className={result.npk.n < 20 ? "text-red-500" : "text-emerald-500"}>{result.npk.n} mg/kg</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (result.npk.n / 50) * 100)}%` }}
                                            className={clsx("h-full", result.npk.n < 20 ? "bg-red-500" : "bg-emerald-500")}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span>Fósforo (P)</span>
                                        <span className="text-emerald-500">{result.npk.p} mg/kg</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (result.npk.p / 80) * 100)}%` }}
                                            className="h-full bg-emerald-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span>Potássio (K)</span>
                                        <span className="text-emerald-500">{result.npk.k} mg/kg</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (result.npk.k / 200) * 100)}%` }}
                                            className="h-full bg-emerald-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span>pH (Acidez)</span>
                                        <span className={result.npk.ph < 6 ? "text-amber-500" : "text-emerald-500"}>{result.npk.ph}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-red-400 via-green-400 to-blue-400 opacity-30" />
                                        <motion.div
                                            initial={{ left: '50%' }}
                                            animate={{ left: `${(result.npk.ph / 14) * 100}%` }}
                                            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10 scale-150"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Prescription */}
                        <div className="bg-white dark:bg-neutral-900 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600">
                                    <Sprout size={20} />
                                </div>
                                <div>
                                    <h3 className="font-black uppercase text-gray-900 dark:text-white">Prescrição IA</h3>
                                    <p className="text-xs text-gray-400 font-bold uppercase">Plano de Fertilização</p>
                                </div>
                            </div>

                            <div className="flex-1 space-y-4">
                                {result.recommendation.map((rec, i) => (
                                    <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">{rec.product}</h4>
                                            <span className="bg-white dark:bg-black px-2 py-1 rounded-md text-[10px] font-black uppercase text-purple-600 shadow-sm border border-gray-100 dark:border-white/10">
                                                {rec.dosage}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                            {rec.reason}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => onSaveAnalysis(result)}
                                className="w-full mt-6 py-4 bg-agro-green hover:bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-colors shadow-lg shadow-agro-green/20 active:scale-[0.98]"
                            >
                                Aplicar Plano de Fertilização
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SoilScanner;
