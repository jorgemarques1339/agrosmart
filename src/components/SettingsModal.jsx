import React, { useState } from 'react';
import { X, Trash2, User, Save, Info, Moon, Sun } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, onResetData, currentName, onSaveName, isDarkMode, onToggleDarkMode }) => {
  const [name, setName] = useState(currentName || 'Agricultor');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Contentor Principal com limite de altura e scroll */}
      <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden animate-scale-up border border-[#E0E4D6] dark:border-neutral-800 flex flex-col max-h-[90vh]">
        
        {/* Header Fixo */}
        <div className="bg-[#FDFDF5] dark:bg-neutral-950 p-5 border-b border-[#E0E4D6] dark:border-neutral-800 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-black text-[#1A1C18] dark:text-white tracking-tight">Definições</h2>
          <button 
            onClick={onClose} 
            className="p-2 bg-white dark:bg-neutral-800 rounded-full text-[#43483E] dark:text-neutral-400 shadow-sm active:scale-90 transition-all border border-[#EFF2E6] dark:border-neutral-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Área de Conteúdo com Scroll */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          
          {/* Alternar Modo Noturno */}
          <section className="space-y-3">
            <label className="text-[10px] font-black text-[#74796D] dark:text-neutral-500 uppercase tracking-widest ml-1">Aparência</label>
            <div 
              onClick={onToggleDarkMode}
              className="bg-[#FDFDF5] dark:bg-neutral-800 p-4 rounded-2xl border border-[#E0E4D6] dark:border-neutral-700 flex justify-between items-center cursor-pointer active:bg-[#EFF2E6] dark:active:bg-neutral-700 transition-colors"
            >
               <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-orange-100 text-orange-500'}`}>
                   {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                 </div>
                 <div>
                   <p className="text-sm font-bold text-[#1A1C18] dark:text-white">Modo Noturno</p>
                   <p className="text-[10px] text-[#74796D] dark:text-neutral-400">Ideal para uso noturno no campo.</p>
                 </div>
               </div>
               
               <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${isDarkMode ? 'bg-purple-600' : 'bg-gray-300'}`}>
                 <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
               </div>
            </div>
          </section>

          {/* Nome do Perfil */}
          <section className="space-y-3">
            <label className="text-[10px] font-black text-[#74796D] dark:text-neutral-500 uppercase tracking-widest ml-1 flex items-center gap-1">
              <User size={12} /> Identificação do Agricultor
            </label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-[#FDFDF5] dark:bg-neutral-800 border-2 border-[#E0E4D6] dark:border-neutral-700 rounded-xl px-4 py-3 text-sm font-bold text-[#1A1C18] dark:text-white focus:border-[#3E6837] dark:focus:border-[#4ade80] outline-none transition-all"
                placeholder="Insira o seu nome"
              />
              <button 
                onClick={() => onSaveName(name)}
                className="bg-[#3E6837] dark:bg-[#4ade80] text-white dark:text-neutral-900 p-3 rounded-xl active:scale-90 shadow-md hover:bg-[#2D4F00] transition-all"
                title="Guardar nome"
              >
                <Save size={20} />
              </button>
            </div>
          </section>

          {/* Informação do Sistema */}
          <section className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold text-xs mb-1">
              <Info size={14} /> AgroSmart v1.2.0
            </div>
            <p className="text-blue-600 dark:text-blue-400 text-[10px] leading-relaxed">
              Sistema de gestão agrícola offline-first. Os seus dados são guardados localmente para garantir privacidade e rapidez.
            </p>
          </section>

          {/* Zona de Perigo / Manutenção */}
          <section className="pt-4 border-t border-[#E0E4D6] dark:border-neutral-800 space-y-3">
            <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest ml-1">Zona de Perigo</p>
            <button 
              onClick={() => {
                if(window.confirm("CUIDADO: Isto vai apagar todos os dados da aplicação. Esta ação não pode ser revertida. Continuar?")) {
                  onResetData();
                }
              }}
              className="w-full flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-500 py-4 rounded-2xl font-bold text-xs border border-red-100 dark:border-red-900/30 active:bg-red-100 transition-colors shadow-sm"
            >
              <Trash2 size={16} /> Limpar Todos os Dados
            </button>
          </section>

        </div>

        {/* Footer do Modal */}
        <div className="p-4 bg-[#FDFDF5] dark:bg-neutral-950 border-t border-[#E0E4D6] dark:border-neutral-800 shrink-0">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-white dark:bg-neutral-800 text-[#43483E] dark:text-neutral-300 rounded-xl font-bold text-xs uppercase tracking-widest border border-[#E0E4D6] dark:border-neutral-700 active:scale-95 transition-all"
          >
            Fechar Definições
          </button>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E0E4D6;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #404040;
        }
      `}</style>
    </div>
  );
};

export default SettingsModal;