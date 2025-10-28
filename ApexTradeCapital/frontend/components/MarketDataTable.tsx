
import React, { useState, useEffect } from 'react';
import type { CryptoData } from '../types';

// Static mock data for offline use
const mockCryptoData: CryptoData[] = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', current_price: 68000, price_change_percentage_24h: 1.5, sparkline_in_7d: { price: [67000, 67500, 68200, 68100, 69000, 68500, 68000] }},
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', current_price: 3500, price_change_percentage_24h: -0.5, sparkline_in_7d: { price: [3400, 3450, 3550, 3520, 3580, 3510, 3500] }},
  { id: 'tether', symbol: 'usdt', name: 'Tether', image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png', current_price: 1, price_change_percentage_24h: 0.01, sparkline_in_7d: { price: [1, 1, 1, 1, 1, 1, 1] }},
  { id: 'binancecoin', symbol: 'bnb', name: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', current_price: 600, price_change_percentage_24h: 2.1, sparkline_in_7d: { price: [580, 585, 595, 610, 605, 602, 600] }},
  { id: 'solana', symbol: 'sol', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', current_price: 150, price_change_percentage_24h: -3.2, sparkline_in_7d: { price: [160, 155, 158, 152, 154, 151, 150] }},
];
const mockHtgRate = 132.5;

const Sparkline: React.FC<{ data: number[], color: string }> = ({ data, color }) => {
    if (!data || data.length < 2) return <div className="w-24 h-8" />;

    const width = 100;
    const height = 30;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    
    // Handle cases where all data points are the same
    if (range === 0) {
        const y = height / 2;
        return (
            <svg viewBox={`0 0 ${width} ${height}`} className="w-24 h-8" preserveAspectRatio="none">
                <line x1="0" y1={y} x2={width} y2={y} stroke={color} strokeWidth="2" />
            </svg>
        );
    }

    const points = data
        .map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((d - min) / range) * height;
            return `${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(' ');

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-24 h-8" preserveAspectRatio="none">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                points={points}
            />
        </svg>
    );
};

const MarketDataTable = () => {
    const cryptoData = mockCryptoData;
    const htgRate = mockHtgRate;

    const PriceChangeIndicator: React.FC<{ change: number }> = ({ change }) => {
        const isPositive = change >= 0;
        return (
            <span className={`flex items-center justify-end text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                 {isPositive ? '▲' : '▼'}
                {change.toFixed(2)}%
            </span>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <h3 className="text-xl font-bold text-brand-blue dark:text-white mb-2 sm:mb-0">📈 Marchés (Illustratif)</h3>
                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <span className={`relative flex h-3 w-3 mr-2 bg-gray-400`}>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-400"></span>
                    </span>
                    Données statiques à titre d'exemple
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-brand-blue text-white">
                        <tr>
                            <th className="p-3 font-semibold">Symbole</th>
                            <th className="p-3 font-semibold">Nom</th>
                            <th className="p-3 font-semibold text-right">Prix (USD)</th>
                            <th className="p-3 font-semibold text-right">Prix (HTG)</th>
                            <th className="p-3 font-semibold text-right">24h %</th>
                            <th className="p-3 font-semibold text-center">Sparkline (7j)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cryptoData.map((coin) => (
                            <tr key={coin.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <td className="p-3">
                                    <div className="flex items-center space-x-3">
                                        <img src={coin.image} alt={coin.name} className="w-6 h-6"/>
                                        <p className="font-bold text-gray-500 dark:text-gray-400">{coin.symbol.toUpperCase()}</p>
                                    </div>
                                </td>
                                <td className="p-3 font-bold">{coin.name}</td>
                                <td className="p-3 text-right font-mono">${coin.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</td>
                                <td className="p-3 text-right font-mono">
                                    {htgRate ? (coin.current_price * htgRate).toLocaleString('fr-FR', { style: 'currency', currency: 'HTG', minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'}
                                </td>
                                <td className="p-3 text-right">
                                    <PriceChangeIndicator change={coin.price_change_percentage_24h} />
                                </td>
                                <td className="p-3 flex justify-center">
                                    <Sparkline data={coin.sparkline_in_7d.price} color="#D4AF37" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MarketDataTable;
