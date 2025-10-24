import React from 'react';
import type { InvestmentPackage } from '../types';

interface InvestmentPackageCardProps {
  pkg: InvestmentPackage;
  onSelect: () => void;
}

const InvestmentPackageCard: React.FC<InvestmentPackageCardProps> = ({ pkg, onSelect }) => {
  const isVip = pkg.name.toLowerCase().includes('vip');

  return (
    <div className={`
      bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col
      border-2 ${isVip ? 'border-brand-gold' : 'border-transparent'}
      transform hover:-translate-y-2 transition-transform duration-300
    `}>
      <h3 className={`text-2xl font-bold flex-grow ${isVip ? 'text-brand-gold' : 'text-brand-blue dark:text-blue-300'}`}>
        {pkg.name}
      </h3>
      <div className="mt-6">
        <p className="text-sm text-gray-500">Multiplier de Rendement</p>
        <p className="text-4xl font-extrabold text-green-600 dark:text-green-400">4x</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Sur le total investi</p>
      </div>
      <button onClick={onSelect} className="mt-6 w-full bg-brand-blue text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-800 transition-colors duration-300">
        Commencer à investir
      </button>
    </div>
  );
};

export default InvestmentPackageCard;
