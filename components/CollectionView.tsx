import React, { useState, useMemo } from 'react';
import { AppraisalReport } from '../types';
import { Trash2, TrendingUp, TrendingDown, Minus, Search, ArrowUpDown, DollarSign, Wallet, LineChart as IconLineChart, Globe } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  collection: AppraisalReport[];
  onDelete: (id: string) => void;
  onBack: () => void;
  onSelect: (report: AppraisalReport) => void;
}

// Approximate rates for dashboard visual summary only (Base HKD)
// In a real app, fetch live rates
const EXCHANGE_RATES: Record<string, number> = {
  'HKD': 1,
  'USD': 7.8,
  'CNY': 1.08, // RMB
  'EUR': 8.5
};

export const CollectionView: React.FC<Props> = ({ collection, onDelete, onBack, onSelect }) => {
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'value'>('date');

  const formatCurrency = (val: number, currency: string = 'HKD') => {
    return new Intl.NumberFormat('zh-HK', { style: 'currency', currency: currency, maximumFractionDigits: 0 }).format(val);
  };

  // Helper to convert any currency to HKD for total stats
  const toHKD = (val: number, currency: string = 'HKD') => {
    const rate = EXCHANGE_RATES[currency] || 1;
    return val * rate;
  };

  const filteredCollection = useMemo(() => {
    let result = collection.filter(item => 
      item.identity.brand.toLowerCase().includes(filter.toLowerCase()) ||
      item.identity.model.toLowerCase().includes(filter.toLowerCase())
    );

    result.sort((a, b) => {
      if (sortBy === 'price') return toHKD(b.purchasePrice, b.marketData.currency) - toHKD(a.purchasePrice, a.marketData.currency);
      if (sortBy === 'value') return toHKD(b.marketData.averagePrice, b.marketData.currency) - toHKD(a.marketData.averagePrice, a.marketData.currency);
      // Default date (newest first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return result;
  }, [collection, filter, sortBy]);

  const stats = useMemo(() => {
    // Normalize all to HKD for the summary dashboard
    const totalCost = collection.reduce((acc, item) => acc + toHKD(item.purchasePrice, item.marketData.currency), 0);
    const totalValue = collection.reduce((acc, item) => acc + toHKD(item.marketData.averagePrice, item.marketData.currency), 0);
    const totalProfit = totalValue - totalCost;
    return { totalCost, totalValue, totalProfit };
  }, [collection]);

  // Calculate cumulative value over time for the chart (Normalized to HKD)
  const chartData = useMemo(() => {
    if (collection.length === 0) return [];

    // Sort by date ascending for the chart calculations
    const sortedByDate = [...collection].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let cumulativeValue = 0;
    return sortedByDate.map(item => {
      // Add value converted to HKD
      cumulativeValue += toHKD(item.marketData.averagePrice, item.marketData.currency);
      
      const dateObj = new Date(item.date);
      const shortDate = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
      
      return {
        date: shortDate,
        fullDate: item.date,
        value: cumulativeValue,
        name: `${item.identity.brand} ${item.identity.model}`,
      };
    });
  }, [collection]);

  return (
    <div className="max-w-7xl mx-auto animate-fade-in space-y-8 pb-12">
      
      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl">
          <div className="flex items-center gap-3 text-gray-400 mb-2">
            <Wallet size={18} />
            <span className="text-sm font-bold uppercase tracking-wider">總投入成本 (Est. HKD)</span>
          </div>
          <p className="text-2xl font-serif text-white">{formatCurrency(stats.totalCost)}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-900/20 to-gray-900 border border-yellow-500/30 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 blur-2xl rounded-full"></div>
          <div className="flex items-center gap-3 text-yellow-500 mb-2">
            <DollarSign size={18} />
            <span className="text-sm font-bold uppercase tracking-wider">當前總市值 (Est. HKD)</span>
          </div>
          <p className="text-3xl font-serif font-bold text-white">{formatCurrency(stats.totalValue)}</p>
        </div>
        <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl">
           <div className="flex items-center gap-3 text-gray-400 mb-2">
            <TrendingUp size={18} />
            <span className="text-sm font-bold uppercase tracking-wider">未實現損益 (Est. HKD)</span>
          </div>
          <div className={`flex items-baseline gap-2 ${stats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            <p className="text-2xl font-serif font-bold">
              {stats.totalProfit >= 0 ? '+' : ''}{formatCurrency(stats.totalProfit)}
            </p>
            <span className="text-sm font-medium bg-gray-800 px-2 py-0.5 rounded">
              {stats.totalCost > 0 ? ((stats.totalProfit / stats.totalCost) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {collection.length > 0 && (
        <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-xl animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <IconLineChart size={20} className="text-yellow-500" />
            <h3 className="text-white font-bold tracking-wide">收藏總市值趨勢 (Portfolio Value HKD)</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af" 
                  tick={{fill: '#9ca3af', fontSize: 12}}
                  axisLine={{stroke: '#4b5563'}}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  tick={{fill: '#9ca3af', fontSize: 12}}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#f3f4f6' }}
                  itemStyle={{ color: '#eab308' }}
                  formatter={(value: number) => [formatCurrency(value), '總市值 (HKD)']}
                  labelFormatter={(label) => `日期: ${label}`}
                  cursor={{ stroke: '#6b7280', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#eab308" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#1f2937', stroke: '#eab308', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#eab308', stroke: '#fff' }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-900/30 p-4 rounded-lg border border-gray-800">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="搜尋品牌或型號..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-gray-950 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-yellow-500 transition-colors placeholder-gray-600"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <ArrowUpDown size={16} className="text-gray-500" />
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-gray-950 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500 cursor-pointer w-full md:w-auto"
          >
            <option value="date">按日期 (最新)</option>
            <option value="price">按購入價 (高到低)</option>
            <option value="value">按市值 (高到低)</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {filteredCollection.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg">您的收藏夾是空的，或沒有符合搜尋條件的結果。</p>
          <button onClick={onBack} className="mt-4 text-yellow-500 hover:text-yellow-400 underline">
            開始新的鑑賞
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollection.map((item) => {
            const currency = item.marketData.currency || 'HKD';
            const profit = item.marketData.averagePrice - item.purchasePrice;
            const isProfit = profit >= 0;

            // Trend styling logic
            let TrendIcon = Minus;
            let trendColor = 'text-gray-500 bg-gray-100';
            if (item.marketData.trend === 'rising') {
                TrendIcon = TrendingUp;
                trendColor = 'text-green-700 bg-green-100 border border-green-200';
            } else if (item.marketData.trend === 'falling') {
                TrendIcon = TrendingDown;
                trendColor = 'text-red-700 bg-red-100 border border-red-200';
            } else {
                trendColor = 'text-gray-600 bg-gray-100 border border-gray-200';
            }

            return (
              <div 
                key={item.id} 
                onClick={() => onSelect(item)}
                className="bg-white rounded-xl overflow-hidden shadow-lg group relative hover:shadow-2xl hover:shadow-yellow-500/10 transition-all duration-300 border border-gray-100 cursor-pointer"
              >
                <div className="h-48 overflow-hidden relative group-hover:opacity-100">
                   {/* Primary Image - Centered and Contained to show dial */}
                   <div className="absolute inset-0 bg-gray-100 flex items-center justify-center overflow-hidden">
                       <div 
                          className="absolute inset-0 bg-cover bg-center blur-md opacity-30" 
                          style={{backgroundImage: `url(${item.imageUrls[0]})`}}
                       ></div>
                       <img 
                          src={item.imageUrls[0]} 
                          alt={item.identity.model} 
                          className="relative z-10 h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-110" 
                       />
                   </div>
                  
                  {/* Tooltip Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 bg-black/10 backdrop-blur-[1px]">
                     <div className="bg-[#0f1115]/90 border border-gray-700 px-4 py-2.5 rounded-lg shadow-2xl transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <div className="flex items-center gap-4">
                           <div className="text-center">
                              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Ref.</p>
                              <p className="text-gray-100 font-mono text-xs font-bold">{item.identity.referenceNumber || 'N/A'}</p>
                           </div>
                           <div className="w-px h-5 bg-gray-700"></div>
                           <div className="text-center">
                              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Year</p>
                              <p className="text-gray-100 font-serif text-xs">{item.identity.estimatedYear || 'Unknown'}</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="absolute top-3 right-3 z-30">
                     <span className="bg-black/50 backdrop-blur text-white text-[10px] px-2 py-1 rounded border border-white/10 font-bold flex items-center gap-1">
                        <Globe size={10} />
                        {currency}
                     </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent text-white z-30">
                    <p className="text-xs font-bold text-yellow-500 tracking-widest uppercase mb-1">{item.identity.brand}</p>
                    <p className="font-serif font-bold text-lg leading-none truncate">{item.identity.model}</p>
                  </div>
                </div>
                
                <div className="p-5">
                   {/* Retail Price (MSRP) */}
                   <div className="flex justify-end mb-2">
                       <p className="text-[10px] text-gray-400 font-medium">MSRP: {item.marketData.retailPrice ? formatCurrency(item.marketData.retailPrice, currency) : 'N/A'}</p>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Purchase Price</p>
                        <p className="font-medium text-gray-900 text-sm">{formatCurrency(item.purchasePrice, currency)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold text-yellow-600">Second Market</p>
                        <p className="font-bold text-gray-900 text-lg leading-tight">{formatCurrency(item.marketData.averagePrice, currency)}</p>
                        <p className="text-[9px] text-gray-400 mt-1 truncate">via {item.marketData.priceSource || 'Market Data'} ({item.date})</p>
                      </div>
                   </div>

                   {/* Trend Indicator */}
                   <div className="flex items-center justify-end mb-4">
                       <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${trendColor}`}>
                          <TrendIcon size={12} strokeWidth={3} />
                          {item.marketData.trend} Market
                       </div>
                   </div>

                   <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                      <div className={`flex items-center gap-1.5 text-sm font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                        {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {isProfit ? '+' : ''}{formatCurrency(profit, currency)}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                        className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
                        title="刪除"
                      >
                        <Trash2 size={18} />
                      </button>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};