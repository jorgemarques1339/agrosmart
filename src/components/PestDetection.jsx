import React from 'react';
import { Camera, X, Loader2 } from 'lucide-react';

const PestDetection = ({ selectedImage, isAnalyzing, result, onUpload, onClose }) => {
  if (!selectedImage) {
    return (
      <div className="bg-white rounded-[20px] p-4 border border-[#E0E4D6] shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium text-[#1A1C18]">Detetar Pragas (IA)</h3>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">BETA</span>
        </div>
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-[#74796D] border-dashed rounded-xl cursor-pointer bg-[#FDFDF5] hover:bg-[#EFF2E6] transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Camera className="w-8 h-8 mb-2 text-[#43483E]" />
            <p className="text-sm text-[#43483E] font-medium">Tirar foto ou carregar</p>
          </div>
          <input type="file" className="hidden" accept="image/*" capture="environment" onChange={onUpload} />
        </label>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[20px] overflow-hidden border border-[#E0E4D6] shadow-md animate-slide-up">
      <div className="relative h-48 bg-black">
        <img src={selectedImage} alt="Preview" className="w-full h-full object-cover opacity-90" />
        <button onClick={onClose} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70">
          <X size={20} />
        </button>
        {isAnalyzing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
            <Loader2 className="w-10 h-10 text-[#CBE6A2] animate-spin mb-2" />
            <p className="text-white font-medium tracking-wide">A analisar planta...</p>
          </div>
        )}
      </div>

      {result && (
        <div className="p-4 bg-[#FDFDF5]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-[#43483E] uppercase tracking-wider">Diagnóstico IA</p>
              <h3 className="text-lg font-bold text-[#1A1C18]">{result.disease}</h3>
            </div>
            <div className={`px-3 py-1 rounded-lg text-xs font-bold ${result.status === 'Saudável' ? 'bg-[#CBE6A2] text-[#2D4F00]' : 'bg-[#FFDAD6] text-[#410002]'}`}>
              {result.status}
            </div>
          </div>
          <div className="bg-[#EFF2E6] p-3 rounded-xl mb-3">
            <p className="text-xs font-bold text-[#43483E] mb-1">TRATAMENTO:</p>
            <p className="text-sm text-[#1A1C18]">{result.treatment}</p>
          </div>
          <p className="text-xs text-right text-[#74796D]">Confiança: {result.confidence}</p>
        </div>
      )}
    </div>
  );
};

export default PestDetection;