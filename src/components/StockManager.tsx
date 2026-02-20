
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, AlertTriangle, TrendingUp, Zap, Droplets, Leaf, Info, X, Save, Package, Warehouse, Truck } from 'lucide-react';
import clsx from 'clsx';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { StockItem } from '../types';
import { useStore } from '../store/useStore';

interface StockManagerProps {
  stocks: StockItem[];
  // Fix: onUpdateStock expects (id, delta), not newQuantity
  onUpdateStock: (id: string, delta: number) => void;
  onAddStock: (item: Omit<StockItem, 'id'>) => void;
  onEditStock: (id: string, updates: Partial<StockItem>) => void;
  onDeleteStock?: (id: string) => void;
  onOpenGuide?: () => void;
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
  const daysRemaining = item.dailyUsage ? Math.floor(item.quantity / item.dailyUsage) : null;
  const isCritical = daysRemaining !== null && daysRemaining <= 5;

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
            {/* --- LIVING LIQUID EFFECT --- */}

            {/* 1. Deep Wave (Slow, Darker) */}
            <motion.div
              className="absolute -top-6 -left-[60%] w-[220%] h-24 bg-black/10 rounded-[35%]"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, ease: "linear", duration: 7 }}
            />

            {/* 2. Main Surface Wave (Faster, Lighter) */}
            <motion.div
              className="absolute -top-6 -left-[60%] w-[220%] h-24 bg-white/20 rounded-[40%]"
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, ease: "linear", duration: 5 }}
            />

            {/* 3. Meniscus Highlight (The "Glint" on top) */}
            <motion.div
              className="absolute top-0 left-0 w-full h-1 bg-white/40 blur-[2px]"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            />

            {/* 4. Suspended Micro-Particles (Texture) */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute bg-white/30 rounded-full"
                  style={{
                    width: Math.random() * 2 + 1 + 'px',
                    height: Math.random() * 2 + 1 + 'px',
                    left: Math.random() * 100 + '%',
                    top: Math.random() * 100 + '%',
                  }}
                  animate={{
                    y: [0, -20, 0],
                    x: [0, Math.random() * 10 - 5, 0],
                    opacity: [0, 0.8, 0]
                  }}
                  transition={{
                    duration: 4 + Math.random() * 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: Math.random() * 2
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute bottom-2 left-0 w-full text-center z-30">
          <span className="text-sm md:text-xl font-black text-white drop-shadow-md tracking-tighter">
            {Math.round(fillPercentage)}<span className="text-[10px] md:text-xs align-top">%</span>
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center w-full mt-1">
        <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center truncate w-full px-1 font-bold">
          {item.name}
        </p>
        {isCritical && (
          <span className="text-[8px] md:text-[9px] font-bold text-red-500 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full mt-0.5 animate-pulse">
            {daysRemaining} dias
          </span>
        )}
      </div>
    </div>
  );
};

const ProductDetailsModal = ({ item, isOpen, onClose, onUpdate, onEdit, onDelete, onGenerateOrder }: {
  item: StockItem | null,
  isOpen: boolean,
  onClose: () => void,
  onUpdate: (delta: number) => void,
  onEdit: (updates: Partial<StockItem>) => void,
  onDelete?: (id: string) => void,
  onGenerateOrder?: () => void
}) => {
  if (!isOpen || !item) return null;

  const [editPrice, setEditPrice] = useState(item.pricePerUnit.toString());
  const [editSupplier, setEditSupplier] = useState(item.supplier || '');
  const [editSupplierEmail, setEditSupplierEmail] = useState(item.supplierEmail || '');
  const [editDailyUsage, setEditDailyUsage] = useState(item.dailyUsage?.toString() || '');

  useEffect(() => {
    setEditPrice(item.pricePerUnit.toString());
    setEditSupplier(item.supplier || '');
    setEditSupplierEmail(item.supplierEmail || '');
    setEditDailyUsage(item.dailyUsage?.toString() || '');
  }, [item]);

  const handleSave = () => {
    onEdit({
      pricePerUnit: Number(editPrice),
      supplier: editSupplier,
      supplierEmail: editSupplierEmail,
      dailyUsage: editDailyUsage ? Number(editDailyUsage) : undefined
    });
    onClose();
  };

  const daysRemaining = item.dailyUsage ? Math.floor(item.quantity / item.dailyUsage) : null;
  const isCritical = daysRemaining !== null && daysRemaining <= 5;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl border border-white/10"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="text-[10px] font-bold text-agro-green uppercase tracking-wider">{item.category}</span>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-none mt-1">{item.name}</h3>
            {isCritical && (
              <p className="text-xs font-bold text-red-500 mt-2 flex items-center gap-1">
                <AlertTriangle size={14} /> Faltam {daysRemaining} dias
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full flex-shrink-0">
            <X size={20} className="text-gray-900 dark:text-white" />
          </button>
        </div>

        {/* Stock Management */}
        <div className="mb-8">
          <label className="text-[10px] font-bold uppercase text-gray-400 mb-2 block">Gestão de Stock ({item.unit})</label>
          <div className="flex items-center justify-between bg-gray-50 dark:bg-neutral-800 rounded-2xl p-2 md:p-3">
            <button
              onClick={() => onUpdate(-10)}
              className="w-12 h-12 rounded-xl bg-white dark:bg-neutral-700 shadow-sm flex items-center justify-center text-red-500 active:scale-90 transition-all"
            >
              <Minus size={20} strokeWidth={3} />
            </button>
            <div className="text-center">
              <span className="text-3xl font-black text-gray-900 dark:text-white block leading-none">{item.quantity}</span>
            </div>
            <button
              onClick={() => onUpdate(10)}
              className="w-12 h-12 rounded-xl bg-white dark:bg-neutral-700 shadow-sm flex items-center justify-center text-green-500 active:scale-90 transition-all"
            >
              <Plus size={20} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Details Form */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400 ml-2 mb-1 block">Fornecedor</label>
              <div className="relative">
                <Package size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={editSupplier}
                  onChange={(e) => setEditSupplier(e.target.value)}
                  placeholder="Nome"
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-100 dark:bg-neutral-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400 ml-2 mb-1 block">Email Forn.</label>
              <input
                value={editSupplierEmail}
                onChange={(e) => setEditSupplierEmail(e.target.value)}
                placeholder="email@..."
                className="w-full px-3 py-2.5 bg-gray-100 dark:bg-neutral-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400 ml-2 mb-1 block">Preço / {item.unit} (€)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">€</span>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 bg-gray-100 dark:bg-neutral-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-gray-400 ml-2 mb-1 block">Consumo/Dia ({item.unit})</label>
              <input
                type="number"
                value={editDailyUsage}
                onChange={(e) => setEditDailyUsage(e.target.value)}
                placeholder="Ex: 50"
                className="w-full px-3 py-2.5 bg-gray-100 dark:bg-neutral-800 rounded-xl font-bold text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-agro-green"
              />
            </div>
          </div>
        </div>

        {/* Generate Order Button (Only if Supplier info exists) */}
        {onGenerateOrder && (editSupplier || item.supplier) && (
          <button
            onClick={() => {
              handleSave(); // Save current edits first
              onGenerateOrder(); // Open generation
            }}
            className={clsx(
              "w-full py-4 rounded-xl font-bold mb-4 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2",
              isCritical
                ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/30 animate-pulse"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30"
            )}
          >
            <Package size={18} />
            Gerar Encomenda Automática
          </button>
        )}

        {/* Footer Actions */}
        <div className="flex gap-3">
          {onDelete && (
            <button
              onClick={() => {
                if (window.confirm('Eliminar produto?')) {
                  onDelete(item.id);
                  onClose();
                }
              }}
              className="p-4 rounded-xl bg-red-100 dark:bg-red-900/20 text-red-500 active:scale-95 transition-all"
              title="Eliminar"
            >
              <TrendingUp className="rotate-180" size={20} />
            </button>
          )}
          <button
            onClick={handleSave}
            className="flex-1 py-4 bg-agro-green text-white rounded-xl font-bold shadow-lg shadow-agro-green/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Save size={18} /> Guardar Alterações
          </button>
        </div>

      </motion.div>
    </div>
  );
};

// --- COMPACT VISUAL ROW (NAME + CATEGORY ONLY) ---
// User request: "fique somente o nome do produto e a categoria"
const InventoryRow = ({ item, onClick }: { item: StockItem; onClick: () => void }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-neutral-800 rounded-[1.5rem] p-4 shadow-sm border border-gray-100 dark:border-neutral-700/50 flex items-center justify-between gap-4 group hover:border-agro-green/50 cursor-pointer active:scale-[0.98] transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-neutral-900 flex items-center justify-center shadow-inner text-gray-400 flex-shrink-0 group-hover:bg-agro-green/10 group-hover:text-agro-green transition-colors">
          {item.name.toLowerCase().includes('gasóleo') ? <Zap size={20} /> :
            item.name.toLowerCase().includes('água') ? <Droplets size={20} /> :
              <Leaf size={20} />}
        </div>
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white text-sm md:text-lg leading-tight group-hover:text-agro-green transition-colors">{item.name}</h4>
          <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wide">{item.category}</p>
        </div>
      </div>

      {/* Right chevron or minimal indicator */}
      <div className="flex items-center gap-3">
        {item.dailyUsage && item.quantity / item.dailyUsage <= 5 && (
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-500 animate-pulse">
            <AlertTriangle size={12} strokeWidth={3} />
          </span>
        )}
        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-400 group-hover:bg-agro-green group-hover:text-white transition-all">
          <Plus size={16} strokeWidth={3} className={item.quantity === 0 ? "opacity-50" : ""} />
        </div>
      </div>
    </div>
  );
};

// --- AUTO ORDER MODAL ---
const AutoOrderModal = ({ item, isOpen, onClose }: { item: StockItem | null, isOpen: boolean, onClose: () => void }) => {
  const [status, setStatus] = useState<'idle' | 'generating' | 'success'>('idle');

  if (!isOpen || !item) return null;

  const orderQuantity = MAX_CAPACITY - item.quantity; // Suggest buying enough to fill logic capacity
  const estimatedCost = orderQuantity * item.pricePerUnit;

  const handleAction = (action: 'pdf' | 'email') => {
    setStatus('generating');
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        onClose();
      }, 2000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={status === 'generating' ? undefined : onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-[2rem] p-6 shadow-2xl border border-white/10 relative overflow-hidden"
      >
        {status === 'success' ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-500 flex items-center justify-center mb-2">
              <Save size={32} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">Sucesso!</h3>
            <p className="text-gray-500 font-medium">O seu pedido foi processado e gerado corretamente.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">Pedido de Orçamento</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Geração Automática</p>
              </div>
              <button onClick={onClose} disabled={status === 'generating'} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full disabled:opacity-50">
                <X size={20} className="text-gray-900 dark:text-white" />
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-neutral-800/50 rounded-2xl p-5 space-y-4 mb-6 relative">
              {status === 'generating' && (
                <div className="absolute inset-0 z-10 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-agro-green"></div>
                </div>
              )}

              <div className="flex justify-between items-center border-b border-gray-200 dark:border-neutral-700 pb-3">
                <span className="text-xs font-bold text-gray-500 uppercase">Fornecedor</span>
                <span className="font-bold text-gray-900 dark:text-white text-right">{item.supplier || 'Não Definido'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-neutral-700 pb-3">
                <span className="text-xs font-bold text-gray-500 uppercase">Artigo</span>
                <span className="font-bold text-agro-green">{item.name}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-neutral-700 pb-3">
                <span className="text-xs font-bold text-gray-500 uppercase">Quantidade Sugerida</span>
                <span className="font-bold text-gray-900 dark:text-white">{orderQuantity} {item.unit}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs font-bold text-gray-500 uppercase">Custo Estimado</span>
                <span className="text-lg font-black text-gray-900 dark:text-white">
                  {estimatedCost.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleAction('pdf')}
                disabled={status === 'generating'}
                className="py-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
              >
                <Save size={18} className="text-gray-600 dark:text-gray-300" />
                <span className="text-xs text-gray-600 dark:text-gray-300">Descarregar PDF</span>
              </button>
              <button
                onClick={() => handleAction('email')}
                disabled={status === 'generating' || !item.supplierEmail}
                className={clsx(
                  "py-3.5 rounded-xl font-bold flex flex-col items-center justify-center gap-1 transition-colors",
                  !item.supplierEmail || status === 'generating'
                    ? "bg-gray-100 dark:bg-neutral-800 opacity-50 cursor-not-allowed text-gray-400"
                    : "bg-agro-green text-white shadow-lg shadow-agro-green/30 hover:bg-green-600"
                )}
              >
                <Truck size={18} />
                <span className="text-xs">Enviar por Email</span>
              </button>
            </div>
            {!item.supplierEmail && (
              <p className="text-[10px] text-center text-red-400 font-medium mt-3">Configure o email do fornecedor para enviar automaticamente.</p>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

const StockManager = ({ stocks, onUpdateStock, onAddStock, onEditStock, onDeleteStock, onOpenGuide }: StockManagerProps) => {
  const { setChildModalOpen } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);

  const [newItem, setNewItem] = useState({
    name: '', category: 'Fertilizante', quantity: '', unit: 'kg', minStock: '', pricePerUnit: ''
  });

  const lowStockItems = stocks.filter(s => {
    if (s.quantity <= s.minStock) return true;
    if (s.dailyUsage) {
      const days = Math.floor(s.quantity / s.dailyUsage);
      if (days <= 5) return true;
    }
    return false;
  });

  // Find the most critical item to highlight in insight
  const insightItem = [...stocks].sort((a, b) => {
    const daysA = a.dailyUsage ? Math.floor(a.quantity / a.dailyUsage) : 999;
    const daysB = b.dailyUsage ? Math.floor(b.quantity / b.dailyUsage) : 999;
    return daysA - daysB;
  })[0];

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderItem, setOrderItem] = useState<StockItem | null>(null);

  useEffect(() => {
    setChildModalOpen(isAddModalOpen || !!selectedItem || isOrderModalOpen);
  }, [isAddModalOpen, selectedItem, isOrderModalOpen, setChildModalOpen]);

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
            <h1 className="text-xl md:text-3xl font-black italic text-gray-900 dark:text-white tracking-tight uppercase">Armazém</h1>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Gestão de Stocks</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onOpenGuide && (
            <button
              onClick={onOpenGuide}
              className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-4 py-2 rounded-full shadow-sm active:scale-95 transition-transform"
            >
              <Truck size={18} strokeWidth={2.5} />
              <span className="font-bold text-xs uppercase">Guias</span>
            </button>
          )}

          {lowStockItems.length > 0 && (
            <div className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg shadow-red-500/30 animate-pulse">
              <AlertTriangle size={16} strokeWidth={3} />
              <span className="font-bold text-xs uppercase hidden md:inline">{lowStockItems.length} Críticos</span>
            </div>
          )}
        </div>
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
              {insightItem && insightItem.dailyUsage ? (
                <>
                  Ritmo de consumo monitorizado. Previsão de rutura de {insightItem.name} em <strong className="text-red-400">{Math.floor(insightItem.quantity / insightItem.dailyUsage)} dias</strong>.
                </>
              ) : (
                <>Gestão controlada. Nenhum produto com taxa de consumo crítico detectada.</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 3. VOLUMETRIC VISUALIZATION (SMALLER) */}
      <div className="space-y-3">
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
            <span className="font-bold text-[8px] uppercase">Novo Item</span>
          </button>
        </div>

        <div className="flex flex-col gap-3 px-2 md:px-0">
          {stocks.map(item => (
            <InventoryRow
              key={item.id}
              item={item}
              onClick={() => setSelectedItem(item)}
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

      {/* --- DETAILS MODAL --- */}
      <AnimatePresence>
        {selectedItem && (
          <ProductDetailsModal
            item={selectedItem}
            isOpen={!!selectedItem}
            onClose={() => setSelectedItem(null)}
            onUpdate={(delta) => onUpdateStock(selectedItem.id, delta)}
            onEdit={(updates) => onEditStock(selectedItem.id, updates)}
            onDelete={onDeleteStock}
            onGenerateOrder={() => {
              setOrderItem(selectedItem);
              setIsOrderModalOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOrderModalOpen && orderItem && (
          <AutoOrderModal
            item={orderItem}
            isOpen={isOrderModalOpen}
            onClose={() => setIsOrderModalOpen(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default StockManager;