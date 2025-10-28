
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { INVESTMENT_PACKAGES } from '../constants';
import * as Calc from '../services/calculationService';

const IntentCreationPage = () => {
    const { params } = useAppContext();
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [selectedPackageName, setSelectedPackageName] = useState(params.packageName || INVESTMENT_PACKAGES[0].name);

    const selectedPackage = useMemo(() => {
        return INVESTMENT_PACKAGES.find(p => p.name === selectedPackageName) || INVESTMENT_PACKAGES[0];
    }, [selectedPackageName]);

    const feesHTG = Calc.calculateAccompanimentFee(selectedPackage.amount);
    const totalAmountHTG = Calc.calculateTotalInvestment(selectedPackage.amount);
    const totalPayoutHTG = Calc.calculateExpectedPayout(selectedPackage.amount);

    const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'HTG', maximumFractionDigits: 0 }).format(amount);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock submission
        alert('Intent creation logic to be implemented.');
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-center mb-8 text-brand-charcoal dark:text-white">Nouvelle Intention d'Investissement</h1>
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Form Section */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-gold focus:border-brand-gold"/>
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone</label>
                                <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-gold focus:border-brand-gold"/>
                            </div>
                            <div>
                                <label htmlFor="package" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Choix du Pack</label>
                                <select id="package" value={selectedPackageName} onChange={e => setSelectedPackageName(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm rounded-md">
                                    {INVESTMENT_PACKAGES.map(pkg => <option key={pkg.name} value={pkg.name}>{pkg.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="mt-8 w-full bg-brand-blue text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-800 transition-colors duration-300">
                            Créer l'intention
                        </button>
                    </form>
                </div>

                {/* Live Calculation Section */}
                <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-lg shadow-inner space-y-4">
                    <h2 className="text-2xl font-bold text-brand-blue dark:text-blue-300">Récapitulatif en direct</h2>
                    <div className="border-t dark:border-gray-700 pt-4 space-y-3">
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Montant investi:</span> <span className="font-bold">{formatCurrency(selectedPackage.amount)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Frais d'accompagnement:</span> <span className="font-bold">{formatCurrency(feesHTG)}</span></div>
                        <div className="flex justify-between text-lg font-bold text-brand-charcoal dark:text-white"><span >Total à investir:</span> <span>{formatCurrency(totalAmountHTG)}</span></div>
                    </div>
                     <div className="border-t dark:border-gray-700 pt-4 space-y-3">
                        <h3 className="font-bold text-green-600 dark:text-green-400">Gain potentiel (4x)</h3>
                        <div className="flex justify-between text-lg"><span className="text-gray-600 dark:text-gray-400">Total à recevoir:</span> <span className="font-bold font-mono">{formatCurrency(totalPayoutHTG)}</span></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntentCreationPage;

