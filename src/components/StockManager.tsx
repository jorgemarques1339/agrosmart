import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, Droplets, Sprout, Syringe, ArrowDown, ArrowUp, 
  Edit2, Plus, X, Save, Info, AlertTriangle, Search, Fuel
} from 'lucide-react';
import { StockItem } from '../types';

interface StockManagerProps {
  stocks: StockItem[];
  onUpdateStock: (id: string, delta: number) => void;
  onAddStock: (item: Omit<StockItem, 'id'>) => void;
  onEditStock: (id: string, updates: Partial<StockItem>) => void;
  onModalChange?: (isOpen: boolean) => void;
}

const StockManager: React.FC<StockManagerProps> = ({ 
  stocks, 
  onUpdateStock, 
  onAddStock,
  onEditStock,
  onModalChange
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState('');
  
  // Notificar o pai quando o estado do modal muda
  useEffect(() => {
    if (onModalChange) {
      onModalChange(isAddModalOpen);
    }
  }, [isAddModalOpen, onModalChange]);

  // Estado para novo item
  const [newItem, setNewItem] = useState<Partial<StockItem>>({
    name: '',
    category: 'Outro',
    quantity: 0,
    unit: 'un',
    minStock: 5,
    pricePerUnit: 0
  });

  // Métricas Computadas
  const metrics = useMemo(() => {
    const totalItems = stocks.length;
    const lowStock = stocks.filter(s => s.quantity <= s.minStock).length;
    const totalValue = stocks.reduce((acc, s) => acc + (s.quantity * s.pricePerUnit), 0);
    return { totalItems, lowStock, totalValue };
  }, [stocks]);

  // Helper de Ícones por Categoria
  const getCategoryIcon = (cat: string) => {
    switch(cat) {
      case 'Fertilizante': return <Sprout size={18} />;
      case 'Semente': return <Package size={18} />;
      case 'Fito': 
      case 'Medicamento': return <Syringe size={18} />;
      case 'Combustível': return <Fuel size={18} />;
      case 'Ração': return <Package size={18} />; // Generic package for feed if specific icon unavailable
      default: return <Droplets size={18} />;
    }
  };

  const handleSaveNewItem = () => {
    if (newItem.name && newItem.quantity !== undefined) {
      onAddStock(newItem as Omit<StockItem, 'id'>);
      setNewItem({
        name: '',
        category: 'Outro',
        quantity: 0,
        unit: 'un',
        minStock: 5,
        pricePerUnit: 0
      });
      setIsAddModalOpen(false);
    }
  };

  const handlePriceUpdate = (id: string) => {
    const price = parseFloat(tempPrice);
    if (!isNaN(price)) {
      onEditStock(id, { pricePerUnit: price });
    }
    setEditingPriceId(null);
  };

  return (
    <div className="animate-fade-in pb-24">
      
      {/* Header & Métricas */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-3xl font-black italic text-gray-900 dark:text-white">Armazém</h2>
            <p className="text-sm text-gray-500 font-medium tracking-wide">Inventário Mobile</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-agro-green text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-transform"
          >
            <Plus size={24} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-[2rem] border border-gray-100 dark:border-neutral-800 shadow-sm">
            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Total Itens</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-black text-gray-800 dark:text-white">{metrics.totalItems}</span>
              <span className="text-xs text-gray-400 mb-1">sku</span>
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-4 rounded-[2rem] border border-gray-100 dark:border-neutral-800 shadow-sm relative overflow-hidden">
            {metrics.lowStock > 0 && <div className="absolute right-0 top-0 p-2"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div></div>}
            <p className="text-xs text-gray-400 font-bold uppercase mb-1">Alertas</p>
            <div className="flex items-end gap-2">
              <span className={`text-2xl font-black ${metrics.lowStock > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {metrics.lowStock}
              </span>
              <span className="text-xs text-gray-400 mb-1">críticos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Stocks */}
      <div className="space-y-3">
        {stocks.map(item => {
          const isLowStock = item.quantity <= item.minStock;
          const progressPercent = Math.min((item.quantity / (item.minStock * 3)) * 100, 100);

          return (
            <div 
              key={item.id} 
              className="group relative bg-white dark:bg-neutral-900 rounded-[2.2rem] p-4 shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden transition-all active:scale-[0.99]"
            >
              {/* Barra de Estado Lateral */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isLowStock ? 'bg-red-500' : 'bg-green-500'}`}></div>

              <div className="pl-3 flex flex-col gap-3">
                
                {/* Topo do Card */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="p-1.5 bg-gray-100 dark:bg-neutral-800 rounded-lg text-gray-500 dark:text-gray-400">
                        {getCategoryIcon(item.category)}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{item.category}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{item.name}</h3>
                  </div>

                  {/* Preço Chip */}
                  {editingPriceId === item.id ? (
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-neutral-800 rounded-xl p-1 animate-fade-in">
                      <input 
                        type="number" 
                        autoFocus
                        className="w-12 bg-transparent text-xs font-bold text-right outline-none dark:text-white"
                        value={tempPrice}
                        onChange={(e) => setTempPrice(e.target.value)}
                        onBlur={() => handlePriceUpdate(item.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handlePriceUpdate(item.id)}
                      />
                      <span className="text-[10px] text-gray-500">€</span>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setEditingPriceId(item.id); setTempPrice(item.pricePerUnit.toString()); }}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700 active:bg-gray-200"
                    >
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{item.pricePerUnit}€</span>
                      <Edit2 size={10} className="text-gray-400" />
                    </button>
                  )}
                </div>

                {/* Controlo de Quantidade e Barra */}
                <div className="flex items-center justify-between gap-4">
                   <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-bold text-gray-800 dark:text-white">{item.quantity} <span className="text-gray-400 font-normal">{item.unit}</span></span>
                        {isLowStock && <span className="text-red-500 font-bold flex items-center gap-1"><AlertTriangle size={10}/> Baixo</span>}
                      </div>
                      <div className="h-2 w-full bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${isLowStock ? 'bg-red-500' : 'bg-gradient-to-r from-agro-green to-green-400'}`}
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                   </div>

                   <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onUpdateStock(item.id, -1)}
                        className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-white active:scale-90 transition-transform shadow-sm"
                      >
                        <ArrowDown size={18} />
                      </button>
                      <button 
                        onClick={() => onUpdateStock(item.id, 10)}
                        className="w-10 h-10 rounded-2xl bg-agro-green flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg shadow-agro-green/30"
                      >
                        <ArrowUp size={18} />
                      </button>
                   </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Bottom Sheet: Adicionar Item */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsAddModalOpen(false)}>
          <div 
            className="bg-white dark:bg-neutral-900 w-full max-w-md p-6 rounded-t-[2.5rem] shadow-2xl animate-slide-up border-t border-white/20" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold dark:text-white">Novo Item</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                <X size={20} className="dark:text-white" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 ml-2">Nome do Produto</label>
                <input 
                  className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl mt-1 dark:text-white border-2 border-transparent focus:border-agro-green outline-none"
                  placeholder="Ex: Ração A"
                  value={newItem.name}
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-gray-400 ml-2">Categoria</label>
                <div className="flex gap-2 overflow-x-auto pb-2 mt-1">
                  {['Fertilizante', 'Semente', 'Fito', 'Combustível', 'Ração', 'Medicamento'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setNewItem({...newItem, category: cat as any})}
                      className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
                        newItem.category === cat 
                          ? 'bg-agro-green text-white shadow-md' 
                          : 'bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                   <label className="text-xs font-bold uppercase text-gray-400 ml-2">Qtd Inicial</label>
                   <input 
                    type="number"
                    inputMode="decimal"
                    className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl mt-1 dark:text-white outline-none"
                    value={newItem.quantity}
                    onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="w-24">
                   <label className="text-xs font-bold uppercase text-gray-400 ml-2">Unidade</label>
                   <input 
                    className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl mt-1 dark:text-white outline-none text-center"
                    placeholder="kg"
                    value={newItem.unit}
                    onChange={e => setNewItem({...newItem, unit: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4 mb-6">
                 <div className="flex-1">
                   <label className="text-xs font-bold uppercase text-gray-400 ml-2">Preço Unit (€)</label>
                   <input 
                    type="number"
                    inputMode="decimal"
                    className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl mt-1 dark:text-white outline-none"
                    value={newItem.pricePerUnit}
                    onChange={e => setNewItem({...newItem, pricePerUnit: parseFloat(e.target.value) || 0})}
                  />
                </div>
                 <div className="flex-1">
                   <label className="text-xs font-bold uppercase text-gray-400 ml-2">Alerta Min.</label>
                   <input 
                    type="number"
                    className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl mt-1 dark:text-white outline-none"
                    value={newItem.minStock}
                    onChange={e => setNewItem({...newItem, minStock: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              <button 
                onClick={handleSaveNewItem}
                className="w-full py-4 bg-agro-green text-white rounded-[1.5rem] font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
              >
                <Save size={20} />
                Adicionar ao Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManager;