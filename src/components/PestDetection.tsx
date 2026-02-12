import React, { useState } from 'react';
import { Camera, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const PestDetection: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'result'>('idle');
  const [result, setResult] = useState<any>(null);

  const startAnalysis = () => {
    setStatus('scanning');
    setResult(null);
    // Simula tempo de processamento da IA
    setTimeout(() => {
      setStatus('result');
      setResult({
        disease: 'Míldio da Videira',
        confidence: 94,
        severity: 'Moderada',
        treatment: 'Aplicação de fungicida sistémico (Metalaxil) + Cobre.'
      });
    }, 3500);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      
      {/* Estado Inicial */}
      {status === 'idle' && (
        <div className="flex-1 bg-gray-100 dark:bg-neutral-800 rounded-[2rem] border-2 border-dashed border-gray-300 dark:border-neutral-700 flex flex-col items-center justify-center p-8 text-center min-h-[300px] md:min-h-[400px]">
          <div className="w-24 h-24 bg-white dark:bg-neutral-700 rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100 dark:border-neutral-600">
            <Camera size={36} className="text-gray-400 dark:text-gray-300" />
          </div>
          <h3 className="font-bold text-2xl text-gray-900 dark:text-white mb-2">Agro-Vision</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-[240px] text-base leading-relaxed">
            Detete pragas e doenças em segundos com a nossa IA avançada.
          </p>
          <button 
            onClick={startAnalysis}
            className="w-full max-w-xs py-5 bg-agro-green text-white rounded-[1.5rem] font-bold text-lg shadow-xl shadow-agro-green/30 active:scale-95 transition-all touch-manipulation"
          >
            Abrir Câmara
          </button>
        </div>
      )}

      {/* Estado de Scanning (Otimizado com Aspect Ratios) */}
      {status === 'scanning' && (
        <div className="relative w-full aspect-[3/4] md:aspect-video rounded-[2.5rem] overflow-hidden bg-black shadow-2xl ring-4 ring-black/5">
          {/* Imagem simulada */}
          <img 
            src="https://images.unsplash.com/photo-1615811361523-6bd03d7748dc?q=80&w=1000&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-70" 
            alt="Scanning" 
          />
          
          {/* Scan Overlay */}
          <div className="absolute inset-0 z-10">
             <div className="w-full h-1/2 bg-gradient-to-b from-agro-green/30 to-transparent border-b-4 border-agro-green shadow-[0_0_30px_#4ade80] animate-scan"></div>
          </div>
          
          {/* HUD de Informação Mobile */}
          <div className="absolute top-0 left-0 right-0 p-6 flex justify-between text-white/90 font-mono text-xs z-20">
            <span className="bg-black/40 px-2 py-1 rounded backdrop-blur-md">AI: ON</span>
            <span className="bg-black/40 px-2 py-1 rounded backdrop-blur-md">ISO 200</span>
          </div>

          {/* Feedback de Estado */}
          <div className="absolute bottom-10 left-0 right-0 text-center px-4 z-20">
            <p className="text-white font-bold text-sm bg-black/60 inline-block px-6 py-3 rounded-full backdrop-blur-xl border border-white/10 shadow-lg animate-pulse">
              A analisar tecidos foliares...
            </p>
          </div>
        </div>
      )}

      {/* Estado de Resultado */}
      {status === 'result' && result && (
        <div className="animate-slide-up space-y-4">
          
          {/* Imagem de Destaque */}
          <div className="relative w-full aspect-video rounded-[2rem] overflow-hidden shadow-lg border border-gray-100 dark:border-neutral-800">
            <img 
              src="https://images.unsplash.com/photo-1615811361523-6bd03d7748dc?q=80&w=1000&auto=format&fit=crop" 
              className="w-full h-full object-cover" 
              alt="Result" 
            />
            {/* Tag de Confiança */}
            <div className="absolute bottom-4 right-4 bg-white/95 dark:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-white/20">
               <span className="text-xs font-bold text-gray-500 uppercase mr-1">Confiança</span>
               <span className="text-sm font-black text-green-600">{result.confidence}%</span>
            </div>
          </div>

          {/* Card de Diagnóstico */}
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-[2.2rem] border border-gray-100 dark:border-neutral-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
               <div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{result.disease}</h2>
                  <p className="text-sm text-gray-500 font-medium mt-1">Severity: <span className="text-orange-500">{result.severity}</span></p>
               </div>
               <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-2xl">
                  <AlertTriangle size={24} />
               </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100 dark:border-neutral-800">
               <div className="flex items-start gap-4">
                  <div className="mt-1 p-1 bg-green-100 dark:bg-green-900/30 rounded-full text-agro-green shrink-0">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide">Tratamento</h4>
                    <p className="text-base text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                      {result.treatment}
                    </p>
                  </div>
               </div>
            </div>
          </div>
          
          <button 
            onClick={() => setStatus('idle')} 
            className="w-full py-4 bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-white rounded-[1.5rem] font-bold text-base flex items-center justify-center gap-2 hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors active:scale-95 touch-manipulation"
          >
            <RefreshCw size={20} /> Nova Análise
          </button>
        </div>
      )}
    </div>
  );
};

export default PestDetection;