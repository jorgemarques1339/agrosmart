import React, { useState } from 'react';
import { QrCode, Plus, Calendar, MapPin, Package, X } from 'lucide-react';

const TraceabilityManager = ({ batches, fields, onAddBatch }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBatchQR, setSelectedBatchQR] = useState(null); // Para mostrar o QR em grande

  // Estado do formulário
  const [newBatch, setNewBatch] = useState({
    fieldId: '',
    date: new Date().toISOString().split('T')[0],
    quantity: ''
  });

  const handleCreate = () => {
    if (!newBatch.fieldId || !newBatch.quantity) return;
    
    const selectedField = fields.find(f => f.id === parseInt(newBatch.fieldId));
    
    // Gerar código único de lote
    const code = `LT-${new Date().getFullYear()}-${selectedField.name.substring(0, 2).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

    onAddBatch({
      id: Date.now(),
      crop: selectedField.img, // Emoji da cultura
      fieldName: selectedField.name,
      date: newBatch.date,
      quantity: newBatch.quantity,
      code: code
    });

    setIsModalOpen(false);
    setNewBatch({ fieldId: '', date: new Date().toISOString().split('T')[0], quantity: '' });
  };

  return (
    <div className="space-y-4 animate-fade-in pb-24">
      {/* Botão de Criar Lote */}
      <div 
        onClick={() => setIsModalOpen(true)}
        className="bg-white p-5 rounded-[24px] shadow-sm border-2 border-dashed border-[#CBE6A2] flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
      >
        <div className="w-12 h-12 bg-[#E1E4D5] rounded-full flex items-center justify-center text-[#3E6837]">
          <Plus size={24} />
        </div>
        <p className="text-sm font-bold text-[#3E6837]">Gerar Novo Lote</p>
      </div>

      {/* Lista de Lotes */}
      <div className="grid gap-3">
        {batches.slice().reverse().map(batch => (
          <div key={batch.id} className="bg-white p-4 rounded-[20px] border border-[#EFF2E6] shadow-sm flex justify-between items-center">
            <div>
               <div className="flex items-center gap-2 mb-1">
                 <span className="text-xl">{batch.crop}</span>
                 <h3 className="font-bold text-[#1A1C18] text-sm">{batch.code}</h3>
               </div>
               <div className="text-[10px] text-[#43483E] space-y-0.5">
                 <p className="flex items-center gap-1"><MapPin size={10} /> {batch.fieldName}</p>
                 <p className="flex items-center gap-1"><Calendar size={10} /> {batch.date}</p>
                 <p className="flex items-center gap-1"><Package size={10} /> {batch.quantity}</p>
               </div>
            </div>
            
            <button 
              onClick={() => setSelectedBatchQR(batch)}
              className="p-3 bg-[#FDFDF5] border border-[#E0E4D6] rounded-xl text-[#1A1C18] active:bg-[#E1E4D5]"
            >
              <QrCode size={24} />
            </button>
          </div>
        ))}
      </div>

      {/* Modal Criar Lote */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-t-[2.5rem] p-7 w-full max-w-md shadow-2xl animate-slide-up">
            <h3 className="text-xl font-black text-[#1A1C18] mb-6">Novo Lote de Produção</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-[#74796D] uppercase ml-1 block mb-2">Campo de Origem</label>
                <select 
                  className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:border-[#3E6837]"
                  value={newBatch.fieldId}
                  onChange={(e) => setNewBatch({...newBatch, fieldId: e.target.value})}
                >
                  <option value="">Selecione um campo...</option>
                  {fields.map(f => (
                    <option key={f.id} value={f.id}>{f.img} {f.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-black text-[#74796D] uppercase ml-1 block mb-2">Data de Colheita</label>
                <input 
                  type="date" 
                  className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:border-[#3E6837]"
                  value={newBatch.date}
                  onChange={(e) => setNewBatch({...newBatch, date: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-[#74796D] uppercase ml-1 block mb-2">Quantidade</label>
                <input 
                  type="text" 
                  className="w-full bg-[#FDFDF5] border-2 border-[#E0E4D6] rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:border-[#3E6837]"
                  placeholder="Ex: 500kg"
                  value={newBatch.quantity}
                  onChange={(e) => setNewBatch({...newBatch, quantity: e.target.value})}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border-2 rounded-2xl font-black text-xs uppercase text-[#43483E]">Cancelar</button>
                <button onClick={handleCreate} className="flex-1 py-4 bg-[#3E6837] text-white rounded-2xl font-black text-xs uppercase shadow-lg">Gerar Etiqueta</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver QR Code */}
      {selectedBatchQR && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl relative text-center">
            <button 
              onClick={() => setSelectedBatchQR(null)} 
              className="absolute top-4 right-4 p-2 bg-[#FDFDF5] rounded-full text-[#43483E]"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-xl font-black text-[#1A1C18] mb-1">Rastreabilidade</h3>
            <p className="text-xs text-[#74796D] mb-6 font-mono">{selectedBatchQR.code}</p>
            
            <div className="bg-white p-4 border-4 border-[#1A1C18] rounded-xl inline-block mb-6">
              {/* Gerador de QR Code via API (seguro e sem dependências npm extra) */}
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Origem:${selectedBatchQR.fieldName}|Produto:${selectedBatchQR.crop}|Data:${selectedBatchQR.date}|Qtd:${selectedBatchQR.quantity}`} 
                alt="QR Code" 
                className="w-48 h-48"
              />
            </div>

            <div className="text-left bg-[#FDFDF5] p-4 rounded-xl space-y-2 border border-[#E0E4D6]">
              <p className="text-xs text-[#43483E]"><strong>Origem:</strong> {selectedBatchQR.fieldName}</p>
              <p className="text-xs text-[#43483E]"><strong>Produto:</strong> {selectedBatchQR.crop}</p>
              <p className="text-xs text-[#43483E]"><strong>Colheita:</strong> {selectedBatchQR.date}</p>
              <p className="text-xs text-[#43483E]"><strong>Qtd:</strong> {selectedBatchQR.quantity}</p>
            </div>
            
            <button className="w-full mt-6 py-4 bg-[#1A1C18] text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg">
              Imprimir Etiqueta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TraceabilityManager;