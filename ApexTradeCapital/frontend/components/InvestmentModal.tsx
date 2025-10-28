import React, { useState, useEffect } from 'react';
import type { InvestmentPackage } from '../types';
import { WHATSAPP_NUMBER } from '../constants';
import * as Calc from '../services/calculationService';
import { useAppContext } from '../context/AppContext';
import MonCashIcon from './icons/MonCashIcon';
import NatCashIcon from './icons/NatCashIcon';

interface InvestmentModalProps {
  pkg: InvestmentPackage;
  onClose: () => void;
}

const validatePhoneNumber = (phone: string, countryCode: string): { isValid: boolean; error: string; formattedNumber: string } => {
    const sanitizedPhone = phone.trim().replace(/\D/g, '');
    const fullNumber = `${countryCode}${sanitizedPhone}`;

    if (!sanitizedPhone) {
        return { isValid: false, error: 'Le numéro de téléphone est requis.', formattedNumber: '' };
    }

    // E.164-like validation: a '+' followed by 8 to 15 digits.
    // This is a reasonable general rule for international numbers.
    const isValidFormat = /^\+\d{8,15}$/.test(fullNumber);

    if (!isValidFormat) {
        return { isValid: false, error: 'Format de numéro international invalide ou de mauvaise longueur.', formattedNumber: fullNumber };
    }

    return { isValid: true, error: '', formattedNumber: fullNumber };
};


const InvestmentModal: React.FC<InvestmentModalProps> = ({ pkg, onClose }) => {
    const { convertHTGtoUSDString, convertHTGtoEURString } = useAppContext();
    const [name, setName] = useState('');
    const [nameError, setNameError] = useState('');
    const [countryCode, setCountryCode] = useState('+509');
    const [phone, setPhone] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'MonCash' | 'NatCash'>('MonCash');
    
    useEffect(() => {
        try {
          const lang = navigator.language || navigator.languages[0];
          if (lang.startsWith("fr-FR")) setCountryCode("+33");
          else if (lang.startsWith("fr-BE")) setCountryCode("+32");
          else if (lang.startsWith("en-US")) setCountryCode("+1");
          else if (lang.startsWith("ht")) setCountryCode("+509");
          else if (lang.startsWith("fr-CM")) setCountryCode("+237");
          else if (lang.startsWith("fr-CI")) setCountryCode("+225");
          else if (lang.startsWith("fr-SN")) setCountryCode("+221");
          else if (lang.startsWith("es")) setCountryCode("+34");
          else setCountryCode("+1");
        } catch {
          setCountryCode("+1");
        }
    }, []);

    const fees = Calc.calculateAccompanimentFee(pkg.amount);
    const totalAmount = Calc.calculateTotalInvestment(pkg.amount);
    const expectedPayout = Calc.calculateExpectedPayout(pkg.amount);

    const formatCurrencyHTG = (amount: number) => {
        return `${new Intl.NumberFormat('fr-HT', {
            maximumFractionDigits: 0,
        }).format(amount)} HTG`;
    };

    const validateForm = () => {
        let isValid = true;
        if (!name.trim()) {
            setNameError('Nom et Prénom sont requis.');
            isValid = false;
        } else {
            setNameError('');
        }

        const phoneValidation = validatePhoneNumber(phone, countryCode);
        if (!phoneValidation.isValid) {
            setPhoneError(phoneValidation.error);
            isValid = false;
        } else {
            setPhoneError('');
        }
        return isValid;
    };

    const handleConfirm = () => {
        if (!validateForm()) return;
        
        const { formattedNumber: fullPhoneNumber } = validatePhoneNumber(phone, countryCode);

        const message = `👋 Bonjour PrimeFX,

Je souhaite souscrire à une offre d'investissement.

*Voici les détails de mon choix :*
🔹 *Pack :* ${pkg.name} (${pkg.category})
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _

*Récapitulatif Financier :*
💰 *Investissement :* ${formatCurrencyHTG(pkg.amount)}
📑 *Frais d'accompagnement :* ${formatCurrencyHTG(fees)}
*-----------------------------------*
*TOTAL À INVESTIR :* *${formatCurrencyHTG(totalAmount)}*
*-----------------------------------*

✨ *GAIN ASSURÉ (4x) :* ~*${formatCurrencyHTG(expectedPayout)}*
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _

*Mes Informations :*
👤 *Nom Complet :* ${name}
📞 *Téléphone :* ${fullPhoneNumber}
💳 *Méthode de Paiement :* ${paymentMethod}

Merci de m'indiquer les prochaines étapes.
`;

        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4" onClick={onClose}>
            <div className="bg-white dark:bg-brand-charcoal rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-start">
                        <h2 className="text-2xl font-bold text-brand-blue dark:text-brand-gold mb-4">Confirmer votre investissement</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">&times;</button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                        {/* Summary Section */}
                        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg space-y-4">
                            <h3 className="text-xl font-bold text-brand-charcoal dark:text-white">{pkg.name}</h3>
                            <div className="border-t dark:border-gray-700 pt-4 space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Investissement:</span>
                                    <span className="font-semibold text-right text-brand-charcoal dark:text-white">{formatCurrencyHTG(pkg.amount)} <br/><span className="text-xs font-normal text-gray-500">{convertHTGtoUSDString(pkg.amount)} / {convertHTGtoEURString(pkg.amount)}</span></span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Frais (5% capé):</span>
                                    <span className="font-semibold text-right text-brand-charcoal dark:text-white">{formatCurrencyHTG(fees)} <br/><span className="text-xs font-normal text-gray-500">{convertHTGtoUSDString(fees)} / {convertHTGtoEURString(fees)}</span></span>
                                </div>
                                <div className="flex justify-between font-bold text-base border-t pt-2 dark:border-gray-600">
                                    <span className="text-brand-charcoal dark:text-white">Total à investir:</span>
                                    <span className="text-right text-brand-charcoal dark:text-white">{formatCurrencyHTG(totalAmount)} <br/><span className="text-xs font-normal text-gray-500">{convertHTGtoUSDString(totalAmount)} / {convertHTGtoEURString(totalAmount)}</span></span>
                                </div>
                            </div>
                            <div className="border-t dark:border-gray-700 pt-4 text-center bg-green-50 dark:bg-green-900/50 p-4 rounded-md">
                                <h3 className="text-sm font-semibold text-green-800 dark:text-green-300">Gain Assuré (4x)</h3>
                                <p className="text-2xl font-extrabold text-green-600 dark:text-green-400 mt-1">{formatCurrencyHTG(expectedPayout)}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{convertHTGtoUSDString(expectedPayout)} / {convertHTGtoEURString(expectedPayout)}</p>
                            </div>
                        </div>

                        {/* Form Section */}
                        <div className="p-2">
                             <div className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom et Prénom</label>
                                    <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border ${nameError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-brand-gold focus:border-brand-gold`}/>
                                    {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Téléphone WhatsApp</label>
                                    <div className={`mt-1 flex gap-0 items-center rounded-md shadow-sm border ${phoneError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus-within:ring-1 focus-within:ring-brand-gold focus-within:border-brand-gold`}>
                                        <select
                                            value={countryCode}
                                            onChange={(e) => setCountryCode(e.target.value)}
                                            className="pl-3 pr-2 py-2 bg-gray-50 dark:bg-gray-800 border-r dark:border-gray-600 rounded-l-md focus:outline-none h-full"
                                            >
                                            <option value="+1">🇺🇸 +1</option>
                                            <option value="+33">🇫🇷 +33</option>
                                            <option value="+32">🇧🇪 +32</option>
                                            <option value="+44">🇬🇧 +44</option>
                                            <option value="+49">🇩🇪 +49</option>
                                            <option value="+509">🇭🇹 +509</option>
                                            <option value="+225">🇨🇮 +225</option>
                                            <option value="+237">🇨🇲 +237</option>
                                            <option value="+221">🇸🇳 +221</option>
                                            <option value="+243">🇨🇩 +243</option>
                                            <option value="+234">🇳🇬 +234</option>
                                            <option value="+229">🇧🇯 +229</option>
                                            <option value="+39">🇮🇹 +39</option>
                                            <option value="+34">🇪🇸 +34</option>
                                        </select>
                                        <input type="tel" inputMode="numeric" id="phone" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} required placeholder="Votre numéro" className="flex-1 block w-full px-3 py-2 bg-transparent dark:bg-gray-700 border-0 rounded-r-md focus:outline-none focus:ring-0"/>
                                    </div>
                                    {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Méthode de paiement</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={() => setPaymentMethod('MonCash')} className={`py-3 px-4 rounded-lg font-semibold border-2 transition-colors flex items-center justify-center gap-2 ${paymentMethod === 'MonCash' ? 'bg-red-600 border-red-700 text-white' : 'bg-gray-200 dark:bg-gray-700 border-transparent hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                                            <MonCashIcon className="w-6 h-6" />
                                            <span>MonCash</span>
                                        </button>
                                        <button onClick={() => setPaymentMethod('NatCash')} className={`py-3 px-4 rounded-lg font-semibold border-2 transition-colors flex items-center justify-center gap-2 ${paymentMethod === 'NatCash' ? 'bg-red-600 border-red-700 text-white' : 'bg-gray-200 dark:bg-gray-700 border-transparent hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                                            <NatCashIcon className="w-6 h-6" />
                                            <span>NatCash</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleConfirm} className="mt-8 w-full bg-brand-gold text-brand-charcoal font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity duration-300 text-lg">
                                Confirmer via WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvestmentModal;
