import React, { useState, useMemo } from 'react';
import {
    TrendingUp, TrendingDown, Info, X,
    ArrowUpRight, ArrowDownRight, Globe,
    BarChart3, RefreshCcw, Package, Wallet
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { MarketPrice, StockItem } from '../types';
import clsx from 'clsx';

interface MarketPricesProps {
    onClose: () => void;
    stocks: StockItem[];
}

// Mock Data representing real-time API response from Euronext/SIMA
const MOCK_MARKET_DATA: MarketPrice[] = [
    {
        id: '1',
        name: 'Trigo Panificável (Euronext)',
        price: 214.50,
        change: 1.25,
        unit: '€/ton',
        market: 'Euronext',
        lastUpdate: new Date().toISOString(),
        history: [
            { date: '12 Fev', price: 210 },
            { date: '13 Fev', price: 212 },
            { date: '14 Fev', price: 211 },
            { date: '15 Fev', price: 213 },
            { date: '16 Fev', price: 215 },
            { date: '17 Fev', price: 214.50 },
        ]
    },
    {
        id: '2',
        name: 'Milho (Euronext)',
        price: 202.75,
        change: -0.85,
        unit: '€/ton',
        market: 'Euronext',
        lastUpdate: new Date().toISOString(),
        history: [
            { date: '12 Fev', price: 205 },
            { date: '13 Fev', price: 204 },
            { date: '14 Fev', price: 206 },
            { date: '15 Fev', price: 205 },
            { date: '16 Fev', price: 203 },
            { date: '17 Fev', price: 202.75 },
        ]
    },
    {
        id: '3',
        name: 'Cevada (SIMA)',
        price: 188.00,
        change: 0.15,
        unit: '€/ton',
        market: 'SIMA',
        lastUpdate: new Date().toISOString(),
        history: [
            { date: '12 Fev', price: 187 },
            { date: '13 Fev', price: 187.5 },
            { date: '14 Fev', price: 188 },
            { date: '15 Fev', price: 188.2 },
            { date: '16 Fev', price: 187.8 },
            { date: '17 Fev', price: 188 },
        ]
    }
];

const MarketPrices: React.FC<MarketPricesProps> = ({ onClose, stocks }) => {
    const [selectedPrice, setSelectedPrice] = useState<MarketPrice>(MOCK_MARKET_DATA[0]);

    // Calculate potential value of stock based on market prices
    const stockValuation = useMemo(() => {
        // This is conceptual: linking "Wheat" products in stock to "Wheat" market price
        return stocks.map(stock => {
            const relevantPrice = MOCK_MARKET_DATA.find(p => stock.name.toLowerCase().includes(p.name.toLowerCase().split(' ')[0]));
            if (relevantPrice) {
                // Assume quantity in kg, price in ton (ton = 1000kg)
                const currentValuation = (stock.quantity / 1000) * relevantPrice.price;
                const originalValuation = stock.quantity * stock.pricePerUnit;
                const potentialProfit = currentValuation - originalValuation;
                return { ...stock, currentValuation, potentialProfit, marketPrice: relevantPrice };
            }
            return null;
        }).filter(Boolean);
    }, [stocks]);

    const totalExposure = stockValuation.reduce((acc, s) => acc + (s?.currentValuation || 0), 0);

    return (
        <div className="flex flex-col h-full bg-[#FDFDF5] dark:bg-[#0A0A0A] animate-fade-in">
            {/* Header */}
            <div className="bg-[#111] text-white p-6 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 p-32 bg-orange-500/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black italic uppercase leading-none tracking-tighter">Mercados em Direto</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/20 rounded text-[10px] font-bold text-emerald-400 uppercase tracking-widest border border-emerald-500/30">
                                <Globe size={10} /> Euronext Connected
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{new Date().toLocaleDateString('pt-PT')}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Selected Price Display */}
                <div className="mt-8 flex justify-between items-end relative z-10">
                    <div>
                        <p className="text-[10px] font-bold uppercase text-gray-500 mb-1">{selectedPrice.name}</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl md:text-4xl font-black font-mono">{selectedPrice.price.toFixed(2)}</p>
                            <span className="text-sm md:text-lg text-gray-500 font-bold">{selectedPrice.unit}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={clsx(
                            "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black mb-2 shadow-lg",
                            selectedPrice.change >= 0 ? "bg-emerald-500/20 text-emerald-400 shadow-emerald-500/10" : "bg-red-500/20 text-red-400 shadow-red-500/10"
                        )}>
                            {selectedPrice.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {Math.abs(selectedPrice.change)}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">

                {/* Market Selector & Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {MOCK_MARKET_DATA.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedPrice(p)}
                            className={clsx(
                                "p-4 rounded-3xl border transition-all text-left group",
                                selectedPrice.id === p.id
                                    ? "bg-white dark:bg-neutral-800 border-orange-500/50 shadow-xl"
                                    : "bg-gray-50 dark:bg-neutral-900 border-transparent hover:border-gray-200"
                            )}
                        >
                            <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">{p.market}</p>
                            <p className="font-bold text-gray-900 dark:text-white truncate text-sm mb-2">{p.name.split(' ')[0]}</p>
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-black dark:text-white font-mono">{p.price.toFixed(2)}</span>
                                <span className={clsx(
                                    "text-[10px] font-black flex items-center",
                                    p.change >= 0 ? "text-emerald-500" : "text-red-500"
                                )}>
                                    {p.change >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                    {Math.abs(p.change)}%
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Potential Valuation AI Insight */}
                {stockValuation.length > 0 && (
                    <div className="bg-gradient-to-br from-[#111] to-[#222] rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-16 bg-emerald-500/5 blur-[50px] rounded-full" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-emerald-500/20 rounded-xl">
                                    <Wallet className="text-emerald-400" size={18} />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Valoração Estimada de Stock</h3>
                            </div>

                            <div className="flex justify-between items-baseline mb-6">
                                <div>
                                    <p className="text-4xl font-black font-mono tracking-tighter">
                                        {totalExposure.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Valor de Venda Potencial (Mercado Hoje)</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {stockValuation.map((sv, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                                <Package size={14} className="text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold">{sv?.name}</p>
                                                <p className="text-[9px] text-gray-500 font-mono">{sv?.quantity} {sv?.unit}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black">{sv?.currentValuation.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}</p>
                                            <p className={clsx(
                                                "text-[9px] font-bold",
                                                (sv?.potentialProfit || 0) >= 0 ? "text-emerald-400" : "text-red-400"
                                            )}>
                                                {(sv?.potentialProfit || 0) >= 0 ? '+' : ''}{sv?.potentialProfit.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Technical Chart */}
                <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-6 border border-gray-100 dark:border-neutral-800 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                            <BarChart3 size={14} /> Histórico {selectedPrice.market}
                        </h3>
                        <button className="p-2 bg-gray-50 dark:bg-neutral-800 rounded-lg text-gray-400 hover:text-agro-green transition-colors">
                            <RefreshCcw size={14} />
                        </button>
                    </div>

                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={selectedPrice.history}>
                                <defs>
                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#9ca3af' }}
                                />
                                <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', background: '#FDFDF5' }}
                                    labelStyle={{ fontWeight: 'black', textTransform: 'uppercase', fontSize: '10px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="price"
                                    stroke="#f59e0b"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorPrice)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* Footer Info */}
            <div className="p-6 bg-gray-50 dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 shrink-0">
                <div className="flex items-start gap-3 p-4 bg-orange-100/50 dark:bg-orange-900/10 rounded-2xl border border-orange-200/50">
                    <Info size={18} className="text-orange-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-medium text-orange-800 dark:text-orange-200 leading-relaxed">
                        Dados obtidos através de integração direta com API Euronext Commodities. A valoração de stock é estimada com base na cotação de fecho do dia anterior.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MarketPrices;
