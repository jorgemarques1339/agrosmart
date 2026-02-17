
import React, { useState, useEffect } from 'react';
import { 
  X, Wheat, Scale, Barcode, Save, 
  PackageCheck, ArrowRight, Calendar 
} from 'lucide-react';
import { Field } from '../types';

interface HarvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  field: Field;
  onConfirm: (data: { quantity: number; unit: string; batchId: string; date: string }) => void;
}

const HarvestModal: React.FC<HarvestModalProps> = ({ isOpen, onClose, field, onConfirm }) => {
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Ton');
  const [batchId, setBatchId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Generate Batch ID on open
  useEffect(() => {
    if (isOpen) {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      // Normalize crop name for ID (e.g. "Uva Alvarinho" -> "UVA")
      const cropCode = field.crop.split(' ')[0].toUpperCase().substring(0, 4);
      setBatchId(`AGRO-${year}-${cropCode}-${random}`);
      setQuantity('');
    }
  }, [isOpen, field]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!quantity || parseFloat(quantity) <= 0) return;
    onConfirm({
      quantity: parseFloat(quantity),
      unit,
      batchId,
      date
    });
    // Nota: O fechamento (onClose) é gerido pelo pai após o sucesso
    // ou podemos fechar aqui, mas o pai deve abrir o TraceabilityModal de seguida.
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white dark:bg-neutral-900 w-full max-w-md p-6 rounded-t-[2.5rem] shadow-2xl animate-slide-up border-t border-white/20" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-black dark:text-white flex items-center gap-2">
               <Wheat className="text-yellow-500" size={28} /> Registo de Colheita
            </h3>
            <p className="text-xs font-bold text-gray-400 uppercase mt-1 ml-1">{field.name}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
            <X size={24} className="dark:text-white" />
          </button>
        </div>

        <div className="space-y-6 pb-4">
          
          {/* Main Input: Quantity */}
          <div className="bg-yellow-50 dark:bg-yellow-900/10 p-6 rounded-[2rem] border border-yellow-200 dark:border-yellow-900/30 flex flex-col items-center">
             <label className="text-xs font-bold uppercase text-yellow-600 dark:text-yellow-500 mb-2 flex items-center gap-1">
                <Scale size={14} /> Rendimento Total
             </label>
             <div className="flex items-baseline gap-2 w-full justify-center">
                <input 
                  type="number"
                  autoFocus
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.0"
                  className="bg-transparent text-center text-6xl font-black text-gray-900 dark:text-white outline-none w-2/3 placeholder-gray-300"
                />
             </div>
             
             {/* Unit Toggle */}
             <div className="flex bg-white dark:bg-neutral-800 p-1 rounded-xl mt-4 shadow-sm">
                {['Ton', 'Kg', 'Arr'].map(u => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                      unit === u 
                        ? 'bg-yellow-500 text-white shadow-md' 
                        : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {u}
                  </button>
                ))}
             </div>
          </div>

          {/* Traceability Details */}
          <div className="space-y-4">
             <div className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-2xl border border-dashed border-gray-300 dark:border-neutral-700 flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-neutral-700 rounded-xl text-gray-500">
                   <Barcode size={20} />
                </div>
                <div className="flex-1">
                   <label className="text-[10px] font-bold uppercase text-gray-400 block">ID do Lote (Automático)</label>
                   <input 
                     value={batchId}
                     onChange={(e) => setBatchId(e.target.value)}
                     className="bg-transparent font-mono font-bold text-gray-800 dark:text-white w-full outline-none"
                   />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-2xl">
                   <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1 flex items-center gap-1">
                      <Calendar size={12} /> Data
                   </label>
                   <input 
                     type="date"
                     value={date}
                     onChange={(e) => setDate(e.target.value)}
                     className="bg-transparent font-bold text-gray-900 dark:text-white w-full outline-none"
                   />
                </div>
                <div className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-2xl">
                   <label className="text-[10px] font-bold uppercase text-gray-400 block mb-1 flex items-center gap-1">
                      <PackageCheck size={12} /> Destino
                   </label>
                   <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                      Armazém <ArrowRight size={12} className="text-gray-400" /> Stock
                   </div>
                </div>
             </div>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={!quantity || parseFloat(quantity) <= 0}
            className={`w-full py-5 rounded-[1.5rem] font-bold text-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform ${
               !quantity || parseFloat(quantity) <= 0 
                 ? 'bg-gray-300 dark:bg-neutral-800 text-gray-500 cursor-not-allowed' 
                 : 'bg-agro-green text-white shadow-agro-green/30'
            }`}
          >
            <Save size={24} /> Confirmar & Gerar QR
          </button>

        </div>
      </div>
    </div>
  );
};

export default HarvestModal;