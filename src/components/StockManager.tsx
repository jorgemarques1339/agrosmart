
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Package, Droplets, Sprout, Syringe, ArrowDown, ArrowUp, 
  Edit2, Plus, X, Save, Info, AlertTriangle, Search, Fuel, Minus,
  CheckCircle2
} from 'lucide-react';
import { StockItem } from '../types';

interface StockManagerProps {
  stocks: StockItem[];
  onUpdateStock: (id: string, delta: number) => void;
  onAddStock: (item: Omit<StockItem, 'id'>) => void;
  onEditStock: (id: string, updates: Partial<StockItem>) => void;
  onModalChange?: (isOpen: boolean) => void;
}

// Componente Helper: Stepper Gigante para Touch
const BigStepper = ({ 
  value, 
  onChange, 
  step = 1, 
  min = 0, 
  unit = '', 
  isFloat = false 
}: { 
  value: number, 
  onChange: (val: number) => void, 
  step?: number, 
  min?: number, 
  unit?: string,
  isFloat?: boolean
}) => {
  
  const adjust = (delta: number) => {
    const next = value + delta;
    if (next < min) return;
    onChange(isFloat ? parseFloat(next.toFixed(2)) : Math.round(next));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => adjust(-step)}
          className="w-14 h-14 bg-gray-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center text-gray-500 border border-gray-200 dark:border-neutral-700 active:scale-90 transition-transform"
        >
          <Minus size={24} strokeWidth={3} />
        </button>
        
        <div className="flex-1 bg-gray-50 dark:bg-neutral-900 border-b-2 border-gray-200 dark:border-neutral-800 h-14 flex items-center justify-center rounded-t-xl">
           <span className="text-2xl font-black text-gray-900 dark:text-white">
             {value} <span className="text-sm font-medium text-gray-400 ml-1">{unit}</span>
           </span>
        </div>

        <button 
          onClick={() => adjust(step)}
          className="w-14 h-14 bg-agro-green rounded-2xl flex items-center justify-center text-white shadow-lg shadow-agro-green/20 active:scale-90 transition-transform"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>

      {/* Preset Buttons for Quick Add (Only for Integers or if explicitly enabled) */}
      {!isFloat && (
        <div className="flex justify-center gap-2">
          {[10, 50].map(preset => (
            <button 
              key={preset}
              onClick={() => adjust(preset)}
              className="px-3 py-1 bg-gray-100 dark:bg-neutral-800 rounded-lg text-xs font-bold text-gray-500 active:bg-gray-200"
            >
              +{preset}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

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
          <div className="flex flex-col items-center gap-1">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="w-12 h-12 bg-agro-green text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <Plus size={24} />
            </button>
            <span className="text-[10px] font-bold text-agro-green dark:text-green-400 whitespace-nowrap">Novo Item</span>
          </div>
        </div>

        {/* Dashboard Cards (Updated to Premium Style) */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* Card 1: Total Itens */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-neutral-800 dark:to-neutral-900 rounded-[2rem] p-4 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
               <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Itens</p>
               <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black">{metrics.totalItems}</span>
                  <span className="text-sm opacity-60">sku</span>
               </div>
               <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full w-fit">
                  <Package size={10} /> {metrics.totalValue.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, notation: 'compact' })}
               </div>
            </div>
            <Package className="absolute -right-4 -bottom-4 text-white/5 w-24 h-24 rotate-12" />
          </div>

          {/* Card 2: Alertas */}
          <div className={`rounded-[2rem] p-4 text-white shadow-lg relative overflow-hidden transition-colors ${
            metrics.lowStock > 0 
              ? 'bg-gradient-to-br from-red-600 to-red-700 animate-pulse' 
              : 'bg-gradient-to-br from-agro-green to-green-600'
          }`}>
            <div className="relative z-10">
               <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-1">
                 {metrics.lowStock > 0 ? 'Stock Crítico' : 'Stock Seguro'}
               </p>
               <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black">{metrics.lowStock}</span>
                  <span className="text-sm opacity-80">alertas</span>
               </div>
               <div className="mt-2 flex items-center gap-1 text-[10px] font-bold bg-white/20 px-2 py-1 rounded-full w-fit">
                  {metrics.lowStock > 0 ? <AlertTriangle size={10} /> : <CheckCircle2 size={10} />}
                  {metrics.lowStock > 0 ? 'Repor Stock' : 'Tudo OK'}
               </div>
            </div>
            <AlertTriangle className="absolute -right-4 -bottom-4 text-white/10 w-24 h-24 rotate-12" />
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

                   {/* Botões Grandes para Uso com Luvas */}
                   <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onUpdateStock(item.id, -1)}
                        className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-white active:scale-90 transition-transform shadow-sm border border-gray-200 dark:border-neutral-700"
                      >
                        <ArrowDown size={24} />
                      </button>
                      <button 
                        onClick={() => onUpdateStock(item.id, 1)}
                        className="w-12 h-12 rounded-2xl bg-agro-green flex items-center justify-center text-white active:scale-90 transition-transform shadow-lg shadow-agro-green/30"
                      >
                        <ArrowUp size={24} />
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
            className="bg-white dark:bg-neutral-900 w-full max-w-md p-6 rounded-t-[2.5rem] shadow-2xl animate-slide-up border-t border-white/20 h-[85vh] overflow-y-auto" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold dark:text-white">Novo Item</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                <X size={20} className="dark:text-white" />
              </button>
            </div>

            <div className="space-y-6">
              
              {/* Nome do Produto */}
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Nome do Produto</label>
                <input 
                  className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl dark:text-white border-2 border-transparent focus:border-agro-green outline-none text-lg font-bold"
                  placeholder="Ex: Ração A"
                  value={newItem.name}
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                />
              </div>

              {/* Categorias (Chips Grandes) */}
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Categoria</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {['Fertilizante', 'Semente', 'Fito', 'Combustível', 'Ração', 'Outro'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setNewItem({...newItem, category: cat as any})}
                      className={`px-3 py-3 rounded-xl text-sm font-bold transition-colors ${
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

              {/* Quantidade (Stepper Gigante) */}
              <div>
                 <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Quantidade Inicial</label>
                 <BigStepper 
                    value={newItem.quantity || 0} 
                    onChange={(val) => setNewItem({...newItem, quantity: val})} 
                    unit={newItem.unit || 'un'}
                 />
                 
                 {/* Unidade Selector Rapido */}
                 <div className="flex gap-2 mt-2 justify-center">
                    {['kg', 'L', 'un', 'sc'].map(u => (
                      <button 
                        key={u}
                        onClick={() => setNewItem({...newItem, unit: u})}
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          newItem.unit === u ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-neutral-800 text-gray-500'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                 </div>
              </div>

              {/* Detalhes Extra */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Preço (€)</label>
                   <BigStepper 
                      value={newItem.pricePerUnit || 0} 
                      onChange={(val) => setNewItem({...newItem, pricePerUnit: val})} 
                      step={0.5} 
                      isFloat={true}
                   />
                </div>
                 <div>
                   <label className="text-xs font-bold uppercase text-gray-400 ml-2 mb-1 block">Mínimo</label>
                   <BigStepper 
                      value={newItem.minStock || 0} 
                      onChange={(val) => setNewItem({...newItem, minStock: val})} 
                      step={1}
                   />
                </div>
              </div>

              <div className="h-4"></div> {/* Spacer */}

              <button 
                onClick={handleSaveNewItem}
                className="w-full py-5 bg-agro-green text-white rounded-[1.5rem] font-bold text-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 mb-6"
              >
                <Save size={24} />
                Adicionar Stock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockManager;