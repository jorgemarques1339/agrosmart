import React from 'react';
import { X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const PestDetection = ({ selectedImage, isAnalyzing, result, onClose }) => {
  // Se não houver imagem, o componente não renderiza nada (layout limpo)
  if (!selectedImage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[28px] overflow-hidden border border-[#E0E4D6] shadow-2xl w-full max-w-sm animate-slide-up">
        
        {/* Preview da Imagem */}
        <div className="relative h-64 bg-black flex items-center justify-center">
          <img 
            src={selectedImage} 
            alt="Preview" 
            className={`w-full h-full object-cover ${isAnalyzing ? 'opacity-50' : 'opacity-100'}`} 
          />
          
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
          >
            <X size={20} />
          </button>

          {isAnalyzing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-[#CBE6A2] animate-spin mb-3" />
              <p className="text-white font-bold tracking-widest text-sm uppercase">Analisando Praga...</p>
            </div>
          )}
        </div>

        {/* Resultados da Análise */}
        {result && (
          <div className="p-6 bg-[#FDFDF5]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] text-[#43483E] font-bold uppercase tracking-widest mb-1">Resultado da IA</p>
                <h3 className="text-xl font-bold text-[#1A1C18]">{result.disease}</h3>
              </div>
              <div className={`p-2 rounded-full ${result.status === 'Saudável' ? 'bg-[#CBE6A2] text-[#2D4F00]' : 'bg-[#FFDAD6] text-[#BA1A1A]'}`}>
                {result.status === 'Saudável' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
              </div>
            </div>

            <div className={`p-4 rounded-2xl mb-4 ${result.status === 'Saudável' ? 'bg-[#CBE6A2]/20' : 'bg-[#BA1A1A]/10'}`}>
              <p className="text-xs font-bold text-[#43483E] mb-1 uppercase tracking-wider">Ação Sugerida:</p>
              <p className="text-sm text-[#1A1C18] leading-relaxed font-medium">{result.treatment}</p>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-[10px] text-[#74796D] font-medium italic">Confiança do Diagnóstico: {result.confidence}</p>
              <button 
                onClick={onClose}
                className="text-sm font-bold text-[#3E6837] hover:underline"
              >
                Concluir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PestDetection;