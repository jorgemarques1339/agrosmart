import React, { useState } from 'react';
import { 
  Package, Syringe, Droplets, Sprout, ClipboardList, 
  ArrowDown, ArrowUp, Edit2, AlertCircle, CheckCircle2,
  Box, Info, Plus, X, Save
} from 'lucide-react';

const StockManager = ({ stocks = [], onUpdateStock, onUpdatePrice, onAddStock }) => {
  const [isAdding, setIsAdding] = useState(false);
  
  // Estado para o formulário de novo item
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'default',
    quantity: '',
    unit: 'kg',
    minLevel: '',
    price: ''
  });

  // Estatísticas rápidas (Tipografia reduzida para densidade de dados)
  const lowStockCount = stocks.filter(s => s.quantity <= (s.minLevel || 0)).length;
  const totalItems = stocks.length;

  const getIcon = (category) => {
    switch(category) {
      case 'meds': return <Syringe size={18} className="text-blue-500" strokeWidth={2} />;
      case 'fuel': return <Droplets size={18} className="text-orange-500" strokeWidth={2} />;
      case 'fertilizer': return <Sprout size={18} className="text-emerald-500" strokeWidth={2} />;
      default: return <Box size={18} className="text-amber-600" strokeWidth={2} />;
    }
  };

  const handleEditPrice = (stock) => {
    const newPrice = window.prompt(`Novo preço para ${stock.name}:`, stock.price);
    if (newPrice !== null && newPrice.trim() !== '' && onUpdatePrice) {
      onUpdatePrice(stock.id, parseFloat(newPrice));
    }
  };

  const handleSaveNewItem = () => {
    if (!newItem.name || !newItem.quantity) return;
    
    if (onAddStock) {
      onAddStock({
        ...newItem,
        id: `s${Date.now()}`,
        quantity: parseFloat(newItem.quantity),
        minLevel: parseFloat(newItem.minLevel || 0),
        price: parseFloat(newItem.price || 0)
      });
    }

    setNewItem({ name: '', category: 'default', quantity: '', unit: 'kg', minLevel: '', price: '' });
    setIsAdding(false);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-32 px-1">
      
      {/* 1. Cabeçalho Compacto com Arredondamentos Profissionais */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <div>
            <h2 className="text-lg font-black text-[#1A1C18] dark:text-white uppercase tracking-tight leading-none">Armazém</h2>
            <p className="text-[9px] font-bold text-[#74796D] dark:text-neutral-500 uppercase tracking-widest mt-0.5">Inventário</p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-[#3E6837] dark:bg-[#4ade80] text-white dark:text-neutral-900 h-10 px-4 rounded-2xl shadow-md flex items-center gap-2 active:scale-95 transition-all border-b-2 border-[#2D4F28] dark:border-[#3aab63]"
          >
            <Plus size={16} strokeWidth={3} />
            <span className="text-[9px] font-black uppercase">Novo Item</span>
          </button>
        </div>

        {/* Grelha de Métricas */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white dark:bg-neutral-900 p-3 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-sm">
            <p className="text-[8px] font-black text-[#74796D] dark:text-neutral-500 uppercase mb-0.5">Total Itens</p>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-[#1A1C18] dark:text-white leading-none">{totalItems}</span>
              <Package size={12} className="text-gray-300 dark:text-neutral-700" />
            </div>
          </div>
          <div className={`p-3 rounded-2xl border shadow-sm transition-all ${lowStockCount > 0 
            ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20' 
            : 'bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800'}`}>
            <p className="text-[8px] font-black text-[#74796D] dark:text-neutral-500 uppercase mb-0.5">Alertas</p>
            <div className="flex items-center gap-1.5">
              <span className={`text-xl font-black leading-none ${lowStockCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-[#3E6837] dark:text-[#4ade80]'}`}>
                {lowStockCount}
              </span>
              {lowStockCount > 0 && <AlertCircle size={12} className="text-red-400 animate-pulse" />}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Lista de Recursos Otimizada */}
      <div className="space-y-2">
        {stocks.map(stock => {
          const isLow = stock.quantity <= (stock.minLevel || 0);
          const percentage = Math.min(100, (stock.quantity / ((stock.minLevel || 10) * 3)) * 100);

          return (
            <div key={stock.id} className="bg-white dark:bg-neutral-900 p-4 rounded-[2rem] border border-gray-100 dark:border-neutral-800 shadow-sm transition-all active:bg-gray-50 dark:active:bg-neutral-800 overflow-hidden relative">
              
              <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${isLow ? 'bg-red-500' : 'bg-[#3E6837] dark:bg-[#4ade80]'}`}></div>

              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-[#FDFDF5] dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 flex items-center justify-center shrink-0">
                    {getIcon(stock.category)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-[#1A1C18] dark:text-white text-xs truncate uppercase tracking-tight leading-tight">
                      {stock.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                       <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full border ${isLow 
                         ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400' 
                         : 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>
                         {isLow ? 'Nível Crítico' : 'Operacional'}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xl font-black text-[#1A1C18] dark:text-white tracking-tighter leading-none">
                    {stock.quantity}
                  </p>
                  <p className="text-[8px] font-bold text-[#74796D] dark:text-neutral-500 uppercase mt-0.5">
                    {stock.unit}
                  </p>
                </div>
              </div>

              {/* Barra de Progresso Arredondada */}
              <div className="space-y-1 mb-4 px-0.5">
                <div className="flex justify-between items-center text-[7px] font-black uppercase tracking-widest text-gray-400 dark:text-neutral-600">
                  <span>Capacidade</span>
                  <span className={isLow ? 'text-red-500' : ''}>Mín: {stock.minLevel}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${isLow ? 'bg-red-500' : 'bg-[#3E6837] dark:bg-[#4ade80]'}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Ações Mobile */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-neutral-800">
                <button 
                  onClick={() => handleEditPrice(stock)}
                  className="flex items-center gap-1.5 bg-[#FDFDF5] dark:bg-neutral-950 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-neutral-800 active:bg-white"
                >
                  <Edit2 size={10} className="text-[#3E6837] dark:text-[#4ade80]" />
                  <span className="text-[9px] font-black text-[#1A1C18] dark:text-white">
                    {Number(stock.price).toFixed(2)}€<span className="opacity-40">/{stock.unit}</span>
                  </span>
                </button>

                <div className="flex gap-2">
                  <button 
                    onClick={() => onUpdateStock(stock.id, -1)}
                    className="w-9 h-9 bg-white dark:bg-neutral-800 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center active:scale-90 shadow-sm"
                  >
                    <ArrowDown size={16} strokeWidth={2.5} />
                  </button>
                  <button 
                    onClick={() => onUpdateStock(stock.id, 10)}
                    className="w-9 h-9 bg-[#3E6837] dark:bg-[#4ade80] text-white dark:text-neutral-900 rounded-xl flex items-center justify-center active:scale-90 shadow-md"
                  >
                    <ArrowUp size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Modal Novo Recurso (Bottom Sheet Arredondado) */}
      {isAdding && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-black/60 backdrop-blur-sm p-0 animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-t-[2.5rem] p-6 pb-12 w-full max-w-md shadow-2xl animate-slide-up border-t border-[#E0E4D6] dark:border-neutral-800 max-h-[90dvh] overflow-y-auto">
            
            <div className="w-12 h-1.5 bg-gray-200 dark:bg-neutral-800 rounded-full mx-auto mb-6 opacity-50"></div>

            <div className="flex justify-between items-center mb-6">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-[#1A1C18] dark:text-white uppercase">Novo Recurso</h3>
              </div>
              <button onClick={() => setIsAdding(false)} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full text-gray-500 active:scale-90">
                <X size={20}/>
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-[#74796D] uppercase tracking-widest ml-1">Descrição</label>
                <input 
                  className="w-full bg-[#FDFDF5] dark:bg-neutral-800 border border-[#E0E4D6] dark:border-neutral-700 rounded-xl px-4 py-3 text-sm font-bold text-[#1A1C18] dark:text-white outline-none focus:border-[#3E6837]" 
                  placeholder="Ex: Ração Super A..." 
                  value={newItem.name} 
                  onChange={e => setNewItem({...newItem, name: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-[#74796D] uppercase tracking-widest ml-1">Categoria</label>
                  <select 
                    className="w-full bg-[#FDFDF5] dark:bg-neutral-800 border border-[#E0E4D6] dark:border-neutral-700 rounded-xl px-3 py-3 text-xs font-bold text-[#1A1C18] dark:text-white outline-none"
                    value={newItem.category}
                    onChange={e => setNewItem({...newItem, category: e.target.value})}
                  >
                    <option value="default">📦 Geral</option>
                    <option value="feed">🌾 Ração</option>
                    <option value="meds">💊 Medicamentos</option>
                    <option value="fertilizer">🌱 Fertilizante</option>
                    <option value="fuel">⛽ Combustível</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-[#74796D] uppercase tracking-widest ml-1">Unidade</label>
                  <input 
                    className="w-full bg-[#FDFDF5] dark:bg-neutral-800 border border-[#E0E4D6] dark:border-neutral-700 rounded-xl px-3 py-3 text-xs font-bold text-[#1A1C18] dark:text-white outline-none" 
                    placeholder="kg, L, un" 
                    value={newItem.unit} 
                    onChange={e => setNewItem({...newItem, unit: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-[#74796D] uppercase tracking-widest ml-1">Qtd. Inicial</label>
                  <input 
                    type="number"
                    inputMode="decimal"
                    className="w-full bg-[#FDFDF5] dark:bg-neutral-800 border border-[#E0E4D6] dark:border-neutral-700 rounded-xl px-3 py-3 text-xs font-bold text-[#1A1C18] dark:text-white outline-none" 
                    value={newItem.quantity} 
                    onChange={e => setNewItem({...newItem, quantity: e.target.value})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-[#74796D] uppercase tracking-widest ml-1">Preço Unit. (€)</label>
                  <input 
                    type="number"
                    inputMode="decimal"
                    className="w-full bg-[#FDFDF5] dark:bg-neutral-800 border border-[#E0E4D6] dark:border-neutral-700 rounded-xl px-3 py-3 text-xs font-bold text-[#1A1C18] dark:text-white outline-none" 
                    value={newItem.price} 
                    onChange={e => setNewItem({...newItem, price: e.target.value})} 
                  />
                </div>
              </div>

              <button 
                onClick={handleSaveNewItem}
                disabled={!newItem.name || !newItem.quantity}
                className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.1em] shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 mt-4 border-b-4 ${
                  !newItem.name || !newItem.quantity 
                  ? 'bg-gray-100 text-gray-400 border-gray-200' 
                  : 'bg-[#1A1C18] dark:bg-[#4ade80] text-white dark:text-neutral-900 border-black dark:border-[#3aab63]'
                }`}
              >
                <Save size={16} /> Guardar Inventário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rodapé Informativo */}
      <div className="bg-[#FDFDF5] dark:bg-neutral-900 p-4 rounded-2xl border border-[#E0E4D6] dark:border-neutral-800 flex gap-3 items-start transition-colors mx-1">
         <Info size={14} className="text-[#3E6837] dark:text-[#4ade80] shrink-0 mt-0.5" />
         <p className="text-[8px] font-bold text-[#74796D] dark:text-neutral-400 leading-tight uppercase tracking-wider">
           Custos são calculados com base no preço unitário. Mantenha os valores atualizados para um balanço rigoroso.
         </p>
      </div>
    </div>
  );
};

export default StockManager;