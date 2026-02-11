import React, { useState } from 'react';
import { X, Trash2, User, Save, Info, AlertTriangle, Moon, Sun } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, onResetData, currentName, onSaveName, isDarkMode, onToggleDarkMode }) => {
  const [name, setName] = useState(currentName || 'Agricultor');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden animate-scale-up border dark:border-neutral-800">
        
        {/* Header */}
        <div className="bg-[#FDFDF5] dark:bg-neutral-950 p-6 border-b border-[#E0E4D6] dark:border-neutral-800 flex justify-between items-center">
          <h2 className="text-xl font-black text-[#1A1C18] dark:text-white tracking-tight">Definições</h2>
          <button onClick={onClose} className="p-2 bg-white dark:bg-neutral-800 rounded-full text-[#43483E] dark:text-neutral-400 shadow-sm active:scale-95 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Modo Noturno Toggle */}
          <div className="bg-[#FDFDF5] dark:bg-neutral-800 p-4 rounded-2xl border border-[#E0E4D6] dark:border-neutral-700 flex justify-between items-center transition-colors">
             <div className="flex items-center gap-3">
               <div className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-orange-100 text-orange-500'}`}>
                 {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
               </div>
               <div>
                 <p className="text-sm font-bold text-[#1A1C18] dark:text-white">Modo Noturno</p>
                 <p className="text-[10px] text-[#74796D] dark:text-neutral-400">Poupa bateria e visão.</p>
               </div>
             </div>
             
             {/* Switch UI */}
             <button 
               onClick={onToggleDarkMode}
               className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${isDarkMode ? 'bg-purple-600' : 'bg-gray-300'}`}
             >
               <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`}></div>
             </button>
          </div>

          {/* Perfil */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-[#74796D] dark:text-neutral-500 uppercase tracking-wider flex items-center gap-1">
              <User size={14} /> Nome da Quinta / Agricultor
            </label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-[#FDFDF5] dark:bg-neutral-800 border-2 border-[#E0E4D6] dark:border-neutral-700 rounded-xl px-4 py-3 font-bold text-[#1A1C18] dark:text-white focus:border-[#3E6837] dark:focus:border-[#3E6837] outline-none transition-colors"
                placeholder="O seu nome"
              />
              <button 
                onClick={() => onSaveName(name)}
                className="bg-[#3E6837] text-white p-3 rounded-xl active:scale-95 shadow-md hover:bg-[#2D4F00] transition-colors"
              >
                <Save size={20} />
              </button>
            </div>
          </div>

          {/* Sobre */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-bold text-sm mb-1">
              <Info size={16} /> Sobre a AgroSmart
            </div>
            <p className="text-blue-600 dark:text-blue-400 text-xs leading-relaxed">
              Versão 1.1.0 (Com Modo Escuro)<br/>
              Desenvolvido para máxima eficiência no campo.
            </p>
          </div>

          {/* Zona de Perigo */}
          <div className="pt-4 border-t border-[#E0E4D6] dark:border-neutral-800">
            <button 
              onClick={() => {
                if(window.confirm("ATENÇÃO: Isto vai apagar TODOS os seus dados locais. Tem a certeza absoluta?")) {
                  onResetData();
                }
              }}
              className="w-full flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 py-4 rounded-2xl font-bold text-sm border-2 border-red-100 dark:border-red-900/30 active:bg-red-100 dark:active:bg-red-900/40 transition-colors"
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