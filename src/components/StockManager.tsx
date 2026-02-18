
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, AlertTriangle, TrendingUp, Zap, Droplets, Leaf, Info, X, Save, Package, Warehouse } from 'lucide-react';
import clsx from 'clsx';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { StockItem } from '../types';

interface StockManagerProps {
  stocks: StockItem[];
  // Fix: onUpdateStock expects (id, delta), not newQuantity
  onUpdateStock: (id: string, delta: number) => void;
  onAddStock: (item: Omit<StockItem, 'id'>) => void;
  onEditStock: (id: string, updates: Partial<StockItem>) => void;
  onDeleteStock?: (id: string) => void;
  onModalChange?: (isOpen: boolean) => void;
}

const MAX_CAPACITY = 1000;

// --- MOCK DATA FOR CONSUMPTION CHARTS ---
const generateMockData = (baseValue: number) => {
  return Array.from({ length: 7 }, (_, i) => ({
    day: `D${i}`,
    val: Math.max(0, baseValue - Math.random() * 50 + Math.random() * 20),
  }));
};

// --- ELITE 3D SILO COMPONENT (SMALLER SIZE) ---
const EliteSilo = ({ item, onUpdate }: { item: StockItem; onUpdate: (delta: number) => void }) => {
  const [optimisticValue, setOptimisticValue] = useState(item.quantity);
  const fillPercentage = Math.min((optimisticValue / MAX_CAPACITY) * 100, 100);

  useEffect(() => {
    setOptimisticValue(item.quantity);
  }, [item.quantity]);

  const getStyle = () => {
    const nameLower = item.name.toLowerCase();

    if (nameLower.includes('gasóleo') || nameLower.includes('diesel')) {
      return {
        liquid: 'bg-gradient-to-t from-blue-700 to-blue-500',
        glow: 'shadow-[0_0_40px_rgba(59,130,246,0.6)]',
        surface: 'bg-blue-400',
      };
    }
    if (nameLower.includes('fertilizante') || nameLower.includes('adubo')) {
      return {
        liquid: 'bg-gradient-to-t from-emerald-800 to-emerald-500',
        glow: 'shadow-[0_0_40px_rgba(16,185,129,0.5)]',
        surface: 'bg-emerald-400',
      };
    }
    return {
      liquid: 'bg-gradient-to-t from-amber-600 to-amber-400',
      glow: 'shadow-[0_0_40px_rgba(245,158,11,0.5)]',
      surface: 'bg-amber-300',
    };
  };

  const style = getStyle();

  // Reduced dimensions: w-16 h-36 on mobile, w-24 md:w-32 on larger screens
  return (
    <div className="flex-shrink-0 w-16 md:w-24 group flex flex-col items-center gap-2">
      <div className="relative h-36 md:h-48 w-full perspective-1000 transition-transform hover:scale-105 duration-300">
        <div className="absolute inset-0 z-20 rounded-[1rem] md:rounded-[1.5rem] bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/10 to-transparent skew-x-12"></div>
          <div className="absolute top-0 w-full h-6 bg-gradient-to-b from-white/20 to-transparent"></div>
          <div className="absolute bottom-0 w-full h-6 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        <div className="absolute inset-1 z-10 rounded-[0.8rem] md:rounded-[1.3rem] overflow-hidden bg-black/20">
          <motion.div
            initial={{ height: `${fillPercentage}%` }}
            animate={{ height: `${fillPercentage}%` }}
            transition={{ type: 'spring', bounce: 0.1, duration: 1.5 }}
            className={clsx("absolute bottom-0 w-full", style.liquid)}
          >
            <div className={clsx("absolute top-0 w-full h-1 blur-[1px]", style.surface)}></div>
            <div className={clsx("absolute top-0 w-full h-px", style.surface, style.glow)}></div>
          </motion.div>
        </div>

        <div className="absolute bottom-2 left-0 w-full text-center z-30">
          <span className="text-sm md:text-xl font-black text-white drop-shadow-md tracking-tighter">
            {Math.round(fillPercentage)}<span className="text-[10px] md:text-xs align-top">%</span>
          </span>
        </div>
      </div>

      <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center truncate w-full px-1 font-bold">
        {item.name}
      </p>
    </div>
  );
};

// --- COMPACT HORIZONTAL INVENTORY ROW (LIST VIEW) ---
const InventoryRow = ({ item, onUpdate, onDelete }: { item: StockItem; onUpdate: (delta: number) => void; onDelete?: (id: string) => void }) => {
  const [data] = useState(generateMockData(item.quantity));

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-[1.5rem] p-3 shadow-sm border border-gray-100 dark:border-neutral-700/50 flex items-center justify-between gap-3 md:gap-6 group hover:border-agro-green/30 transition-all active:scale-[0.99]">

      {/* 1. Identity (Icon + Name) */}
      <div className="flex items-center gap-3 min-w-0 flex-1 md:flex-initial md:w-1/3">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gray-50 dark:bg-neutral-900 flex items-center justify-center shadow-inner text-gray-400 flex-shrink-0">
          {item.name.toLowerCase().includes('gasóleo') ? <Zap size={18} className="text-amber-500" /> :
            item.name.toLowerCase().includes('água') ? <Droplets size={18} className="text-blue-500" /> :
              <Leaf size={18} className="text-green-500" />}
        </div>
        <div className="overflow-hidden min-w-0">
          <h4 className="font-bold text-gray-900 dark:text-white text-sm md:text-lg truncate leading-tight">{item.name}</h4>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide truncate">{item.category}</p>
        </div>
      </div>

      {/* 2. Mini Sparkline (Hidden on smallest screens if needed, or compact) */}
      <div className="hidden md:block w-32 h-10 opacity-30 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`grad-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="val" stroke="#8884d8" strokeWidth={2} fill={`url(#grad-${item.id})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 3. Controls (Right Aligned) */}
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        <button
          onClick={() => onUpdate(-10)}
          className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#eee] dark:bg-[#1a1a1a] shadow-inner flex items-center justify-center text-gray-500 hover:text-red-500 active:scale-90 transition-all"
        >
          <Minus size={14} strokeWidth={3} />
        </button>

        <div className="text-center min-w-[3rem] md:min-w-[4rem]">
          <span className="block text-lg md:text-xl font-black text-gray-800 dark:text-white leading-none">{item.quantity}</span>
          <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase">{item.unit}</span>
        </div>

        <button
          onClick={() => onUpdate(10)}
          className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-[#eee] dark:bg-[#1a1a1a] shadow-inner flex items-center justify-center text-gray-500 hover:text-green-500 active:scale-90 transition-all"
        >
          <Plus size={14} strokeWidth={3} />
        </button>

        {/* Delete Button */}
        {onDelete && (
          <button
            onClick={() => {
              if (window.confirm('Tem a certeza que deseja eliminar este item?')) {
                onDelete(item.id);
              }
            }}
            className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center active:scale-90 transition-all ml-1 md:opacity-0 group-hover:opacity-100"
            title="Eliminar Item"
          >
            <X size={14} strokeWidth={3} />
          </button>
        )}
      </div>
    </div>
  );
};

const StockManager = ({ stocks, onUpdateStock, onAddStock, onEditStock, onDeleteStock, onModalChange }: StockManagerProps) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '', category: 'Fertilizante', quantity: '', unit: 'kg', minStock: '', pricePerUnit: ''
  });

  const lowStockItems = stocks.filter(s => s.quantity <= s.minStock);

  useEffect(() => {
    if (onModalChange) onModalChange(isAddModalOpen);
  }, [isAddModalOpen, onModalChange]);

  const handleCreate = () => {
    if (newItem.name && newItem.quantity && newItem.pricePerUnit) {
      onAddStock({
        name: newItem.name,
        category: newItem.category as any,
        quantity: Number(newItem.quantity),
        unit: newItem.unit,
        minStock: Number(newItem.minStock) || 0,
        pricePerUnit: Number(newItem.pricePerUnit)
      });
      setIsAddModalOpen(false);
      setNewItem({ name: '', category: 'Fertilizante', quantity: '', unit: 'kg', minStock: '', pricePerUnit: '' });
    }
  };

  return (
    <div className="w-full space-y-6 md:space-y-8 pb-32 animate-fade-in relative pt-4">

      {/* 1. HEADER: ARMAZEM & ALERTS */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-700">
            <Warehouse size={24} className="text-gray-900 dark:text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black italic text-gray-900 dark:text-white tracking-tight uppercase">Armazém</h1>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Gestão de Stocks</p>
          </div>
        </div>

        {lowStockItems.length > 0 && (
          <div className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg shadow-red-500/30 animate-pulse">
            <AlertTriangle size={16} strokeWidth={3} />
            <span className="font-bold text-xs uppercase hidden md:inline">{lowStockItems.length} Críticos</span>
          </div>
        )}
      </div>

      {/* 2. AI INSIGHT (MOVED TO TOP) */}
      <div className="relative overflow-hidden bg-[#0A1F1C] border border-emerald-500/30 rounded-[2rem] p-5 shadow-lg mx-2 md:mx-0">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-emerald-500/20 rounded-xl flex-shrink-0">
            <Zap className="text-emerald-400" size={20} />
          </div>
          <div>
            <h4 className="text-emerald-400 font-black uppercase text-xs mb-1 tracking-wider">IA Logística Insight</h4>
            <p className="text-emerald-100/80 font-medium text-xs leading-relaxed">
              Ritmo de consumo estável. Previsão de rutura de adubo em <strong className="text-white">4 dias</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 3. VOLUMETRIC VISUALIZATION (SMALLER) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tanques Volumétricos</h3>
          <span className="text-[9px] font-mono text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded">LIVE</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-6 pt-2 px-4 snap-x custom-scrollbar">
          {stocks.map(item => (
            <EliteSilo key={item.id} item={item} onUpdate={(delta) => onUpdateStock(item.id, delta)} />
          ))}
        </div>
      </div>

      {/* 4. RESPONSIVE INVENTORY LIST (Original Single Column List for Tablet/Desktop as requested) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Registo de Inventário</h3>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-agro-green text-white px-4 py-2 rounded-full shadow-lg shadow-agro-green/30 active:scale-95 transition-transform"
          >
            <Plus size={16} strokeWidth={3} />
            <span className="font-bold text-[10px] uppercase">Novo Item</span>
          </button>
        </div>

        <div className="flex flex-col gap-3 px-2 md:px-0">
          {stocks.map(item => (
            <InventoryRow
              key={item.id}
              item={item}
              onUpdate={(delta) => onUpdateStock(item.id, delta)}
              onDelete={onDeleteStock}
            />
          ))}
        </div>
      </div>

      {/* --- ADD STOCK MODAL --- */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setIsAddModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-[2.5rem] p-6 shadow-2xl border border-white/10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black dark:text-white">Adicionar Stock</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 ml-2 mb-1 block">Nome do Produto</label>
                  <input
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                    placeholder="Ex: Ureia 46%"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-2 mb-1 block">Categoria</label>
                    <select
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none appearance-none"
                    >
                      <option value="Fertilizante">Fertilizante</option>
                      <option value="Semente">Semente</option>
                      <option value="Fito">Fito</option>
                      <option value="Combustível">Combustível</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-2 mb-1 block">Unidade</label>
                    <select
                      value={newItem.unit}
                      onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                      className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none appearance-none"
                    >
                      <option value="kg">kg</option>
                      <option value="L">Litros</option>
                      <option value="un">Unidade</option>
                      <option value="sacas">Sacas</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-2 mb-1 block">Quantidade Inicial</label>
                    <input
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                      className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-400 ml-2 mb-1 block">Preço / Un (€)</label>
                    <input
                      type="number"
                      value={newItem.pricePerUnit}
                      onChange={(e) => setNewItem({ ...newItem, pricePerUnit: e.target.value })}
                      className="w-full p-4 bg-gray-100 dark:bg-neutral-800 rounded-2xl font-bold dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCreate}
                  disabled={!newItem.name || !newItem.quantity}
                  className="w-full py-4 bg-agro-green text-white rounded-[1.5rem] font-bold shadow-xl shadow-agro-green/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={20} /> Guardar Produto
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default StockManager;