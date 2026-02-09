import React from 'react';
import { Package, Syringe, Droplets, Sprout, ClipboardList, ArrowDown, ArrowUp, Edit2 } from 'lucide-react';

const StockManager = ({ stocks, onUpdateStock, onUpdatePrice }) => {
  const getIcon = (category) => {
    switch(category) {
      case 'meds': return <Syringe size={20} className="text-blue-500" />;
      case 'fuel': return <Droplets size={20} className="text-orange-500" />;
      case 'fertilizer': return <Sprout size={20} className="text-green-500" />;
      default: return <Package size={20} className="text-amber-600" />;
    }
  };

  const handleEditPrice = (stock) => {
    // Abre um prompt simples para o agricultor inserir o novo preço
    const newPrice = window.prompt(`Novo preço por ${stock.unit} para ${stock.name}:`, stock.price);
    
    // Se o utilizador inseriu um valor e carregou em OK
    if (newPrice !== null && newPrice.trim() !== '') {
      onUpdatePrice(stock.id, newPrice);
    }
  };

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="bg-white p-5 rounded-[24px] shadow-sm border border-[#E0E4D6] flex justify-between items-center">
        <div>
          <h2 className="text-xl font-normal text-[#1A1C18]">Armazém Digital</h2>
          <p className="text-xs text-[#43483E]">Gestão de recursos da quinta</p>
        </div>
        <div className="w-10 h-10 bg-[#E1E4D5] rounded-full flex items-center justify-center">
          <ClipboardList size={20} className="text-[#3E6837]" />
        </div>
      </div>

      <div className="grid gap-3">
        {stocks.map(stock => {
          const isLow = stock.quantity <= stock.minLevel;
          const percentage = Math.min(100, (stock.quantity / (stock.minLevel * 3)) * 100);

          return (
            <div key={stock.id} className="bg-white p-4 rounded-[20px] border border-[#EFF2E6] shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-2 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-[#FDFDF5] p-2 rounded-xl border border-[#E0E4D6]">
                    {getIcon(stock.category)}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1A1C18] text-sm">{stock.name}</h3>
                    
                    {/* Linha do Preço e Estado */}
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className={`text-xs ${isLow ? 'text-red-600 font-bold' : 'text-[#43483E]'}`}>
                        {isLow ? 'Nível Crítico!' : 'Stock Adequado'}
                      </p>
                      <span className="text-[#E0E4D6] text-xs">|</span>
                      
                      {/* Botão de Editar Preço */}
                      <button 
                        onClick={() => handleEditPrice(stock)}
                        className="text-xs text-[#3E6837] font-medium flex items-center gap-1 hover:bg-[#E1E4D5] px-1.5 py-0.5 rounded transition-colors"
                        title="Alterar preço unitário"
                      >
                        {stock.price ? stock.price.toFixed(2) : '0.00'}€/{stock.unit} 
                        <Edit2 size={10} />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className="text-lg font-bold text-[#1A1C18]">{stock.quantity}</span>
                  <span className="text-xs text-[#74796D] ml-1">{stock.unit}</span>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="w-full h-2 bg-[#F0F5E9] rounded-full mt-2 overflow-hidden relative z-10">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-red-500' : 'bg-[#3E6837]'}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>

              {/* Botões de Ajuste Rápido */}
              <div className="flex justify-end gap-2 mt-3 relative z-10">
                <button 
                  onClick={() => onUpdateStock(stock.id, -1)}
                  className="p-1.5 rounded-lg hover:bg-[#FFDAD6] text-[#410002] transition-colors flex items-center gap-1 text-xs font-medium"
                  title="Gastar (-1)"
                >
                  <ArrowDown size={14} /> Gastar
                </button>
                <button 
                  onClick={() => onUpdateStock(stock.id, 5)}
                  className="p-1.5 rounded-lg hover:bg-[#CBE6A2] text-[#042100] transition-colors flex items-center gap-1 text-xs font-medium"
                  title="Repor (+5)"
                >
                  <ArrowUp size={14} /> Repor
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StockManager;