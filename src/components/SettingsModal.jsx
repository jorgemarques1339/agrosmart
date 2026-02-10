import React, { useState } from 'react';
import { X, Trash2, User, Save, Info, AlertTriangle } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, onResetData, currentName, onSaveName }) => {
  const [name, setName] = useState(currentName || 'Agricultor');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden animate-scale-up">
        
        {/* Header */}
        <div className="bg-[#FDFDF5] p-6 border-b border-[#E0E4D6] flex justify-between items-center">
          <h2 className="text-xl font-black text-[#1A1C18] tracking-tight">Definições</h2>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-[#43483E] shadow-sm active:scale-95">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Perfil */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-[#74796D] uppercase tracking-wider flex items-center gap-1">
              <User size={14} /> Perfil
            </label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-xl px-4 py-3 font-bold text-[#1A1C18] focus:border-[#3E6837] outline-none"
              />
              <button 
                onClick={() => onSaveName(name)}
                className="bg-[#3E6837] text-white p-3 rounded-xl active:scale-95 shadow-md"
              >
                <Save size={20} />
              </button>
            </div>
          </div>

          {/* Sobre */}
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-2 text-blue-800 font-bold text-sm mb-1">
              <Info size={16} /> Sobre a AgroSmart
            </div>
            <p className="text-blue-600 text-xs leading-relaxed">
              Versão 1.0.0 (Beta)<br/>
              Os dados são guardados localmente no seu dispositivo.
            </p>
          </div>

          {/* Zona de Perigo */}
          <div className="pt-4 border-t border-[#E0E4D6]">
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3 flex items-center gap-1">
              <AlertTriangle size={12} /> Zona de Perigo
            </p>
            <button 
              onClick={() => {
                if(window.confirm("ATENÇÃO: Isto vai apagar TODOS os seus dados (Animais, Campos, Finanças). Tem a certeza?")) {
                  onResetData();
                }
              }}
              className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-4 rounded-2xl font-bold text-sm border-2 border-red-100 active:bg-red-100 transition-colors"
            >
              <Trash2 size={18} /> Apagar Todos os Dados
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;