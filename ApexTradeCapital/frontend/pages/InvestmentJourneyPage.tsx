import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { INVESTMENT_PACKAGES } from '../constants';
import type { Investment, User } from '../types';

const validatePhoneNumber = (phone: string, countryCode: string, t: (key: string) => string): { isValid: boolean; error: string; formattedNumber: string } => {
    const sanitizedPhone = phone.trim().replace(/\D/g, '');
    const fullNumber = `${countryCode}${sanitizedPhone}`;

    if (!sanitizedPhone) {
        return { isValid: false, error: t('phone_required'), formattedNumber: '' };
    }

    const isValidFormat = /^\+\d{8,15}$/.test(fullNumber);

    if (!isValidFormat) {
        return { isValid: false, error: t('phone_invalid'), formattedNumber: fullNumber };
    }

    return { isValid: true, error: '', formattedNumber: fullNumber };
};

const InvestmentJourneyPage = () => {
    const { params, setInvestments, showToast, setCurrentUser, navigate, language, addSystemNotification, t, verifyOtpForInvestment } = useAppContext();
    const [step, setStep] = useState(1);
    
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+509');
    const selectedPackage = useMemo(() => {
        return INVESTMENT_PACKAGES.find(p => p.name === params.packageName) || INVESTMENT_PACKAGES[0];
    }, [params.packageName]);
    const [duration, setDuration] = useState<'4h' | '8h' | '1d' | '7d' | '1m'>('4h');
    const [nameError, setNameError] = useState('');
    const [phoneError, setPhoneError] = useState('');

    const [otp, setOtp] = useState('');
    const [investmentId, setInvestmentId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const durationMap: { [key: string]: string } = {
        '4h': t('duration_4h'),
        '8h': t('duration_8h'),
        '1d': t('duration_1d'),
        '7d': t('duration_7d'),
        '1m': t('duration_1m'),
    };

    useEffect(() => {
        try {
          const lang = navigator.language || navigator.languages[0];
          if (lang.startsWith("fr-FR")) setCountryCode("+33");
          else if (lang.startsWith("en-US")) setCountryCode("+1");
          else if (lang.startsWith("ht")) setCountryCode("+509");
        } catch {
          setCountryCode("+1");
        }
    }, []);

    const validateForm = () => {
        let isValid = true;
        if (!name.trim()) {
            setNameError(t('full_name_required'));
            isValid = false;
        } else {
            setNameError('');
        }

        const phoneValidation = validatePhoneNumber(phone, countryCode, t);
        if (!phoneValidation.isValid) {
            setPhoneError(phoneValidation.error);
            isValid = false;
        } else {
            setPhoneError('');
        }
        return isValid;
    };

    const handleIntentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        const newInvestmentId = `inv_${Date.now()}`;
        const newInvestment: Investment = {
            id: newInvestmentId,
            userId: null,
            userDisplayName: name,
            packageName: selectedPackage.name,
            amount: selectedPackage.amount,
            total: selectedPackage.amount,
            progress: 0,
            status: 'pending',
            createdAt: new Date().toISOString(),
            duration: duration,
        };
        setTimeout(() => {
            setInvestments(prev => [...prev, newInvestment]);
            showToast(`Nouvelle intention: ${name}`, 'info');
            setInvestmentId(newInvestmentId);
            setLoading(false);
            setStep(2);
        }, 1000);
    };

    const handleConfirmSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        setError('');
        setTimeout(() => {
            if (!otp.trim() || !/^\d{6}$/.test(otp) || !verifyOtpForInvestment(investmentId, otp)) {
                setError(t('otp_incorrect'));
                setLoading(false);
                return;
            }

            const phoneValidation = validatePhoneNumber(phone, countryCode, t);
            const newUserId = `usr_${Date.now()}`;
            const newUser: User = {
                id: newUserId,
                displayName: name,
                phoneE164: phoneValidation.formattedNumber,
                email: '',
                role: 'user',
                consentPhone: true,
                createdAt: new Date(),
                lastSeen: new Date(),
                language: language,
            };
            setInvestments(prev => prev.map(inv => 
                inv.id === investmentId ? { ...inv, userId: newUserId, status: 'active', progress: 0 } : inv
            ));
            setCurrentUser(newUser);
            addSystemNotification(newUserId, 'investment_created');
            addSystemNotification(newUserId, 'otp_verified');
            showToast(`Compte créé pour ${name}!`, 'success');
            navigate('dashboard', { userId: newUserId });
        }, 1000);
    };

    return (
        <div className="container mx-auto max-w-lg px-4 py-12">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl">
                {step === 1 && (
                    <div>
                        <h1 className="text-2xl font-bold text-center mb-2 text-brand-blue dark:text-brand-gold">{t('investment_intent')}</h1>
                        <p className="text-center text-gray-500 dark:text-gray-400 mb-6">{t('package')}: <strong>{selectedPackage.name}</strong> ({selectedPackage.amount.toLocaleString()} HTG)</p>
                        <form onSubmit={handleIntentSubmit} className="space-y-4">
                             <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('full_name')}</label>
                                <input id="name" type="text" required placeholder={t('full_name')} value={name} onChange={e=>setName(e.target.value)} className={`mt-1 w-full p-2 border rounded dark:bg-gray-700 ${nameError ? 'border-red-500' : 'dark:border-gray-600 border-gray-300'}`}/>
                                {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
                            </div>
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('whatsapp_number')}</label>
                                <div className={`mt-1 flex gap-0 items-center rounded-md shadow-sm border ${phoneError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} focus-within:ring-1 focus-within:ring-brand-gold focus-within:border-brand-gold`}>
                                    <select
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                        className="pl-3 pr-2 py-2 bg-gray-50 dark:bg-gray-800 border-r dark:border-gray-600 rounded-l-md focus:outline-none h-full"
                                    >
                                        <option value="+1">🇺🇸 +1</option>
                                        <option value="+33">🇫🇷 +33</option>
                                        <option value="+509">🇭🇹 +509</option>
                                    </select>
                                    <input type="tel" inputMode="numeric" id="phone" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} required placeholder={t('whatsapp_number')} className="flex-1 block w-full px-3 py-2 bg-transparent dark:bg-gray-700 border-0 rounded-r-md focus:outline-none focus:ring-0"/>
                                </div>
                                {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
                            </div>
                            <div>
                                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('investment_duration')}</label>
                                <select id="duration" value={duration} onChange={e=>setDuration(e.target.value as any)} className="mt-1 w-full p-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600">
                                    <option value="4h">{durationMap['4h']}</option>
                                    <option value="8h">{durationMap['8h']}</option>
                                    <option value="1d">{durationMap['1d']}</option>
                                    <option value="7d">{durationMap['7d']}</option>
                                    <option value="1m">{durationMap['1m']}</option>
                                </select>
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-brand-blue text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50">
                                {loading ? t('creating') : t('create_intent')}
                            </button>
                        </form>
                    </div>
                )}
                {step === 2 && (
                    <div>
                        <h1 className="text-2xl font-bold text-center mb-2 text-brand-blue dark:text-brand-gold">{t('otp_verification')}</h1>
                        <p className="text-center text-gray-500 dark:text-gray-400 mb-6">{t('otp_instruction')}</p>
                        
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg mb-6 space-y-2 border dark:border-gray-700">
                            <h3 className="font-bold text-center text-brand-charcoal dark:text-white">{t('intent_summary')}</h3>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">{t('package')}:</span>
                                <span className="font-semibold">{selectedPackage.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">{t('amount_htg')}:</span>
                                <span className="font-semibold">{selectedPackage.amount.toLocaleString()} HTG</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">{t('duration')}:</span>
                                <span className="font-semibold">{durationMap[duration]}</span>
                            </div>
                        </div>

                        <form onSubmit={handleConfirmSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('otp_code_label')}</label>
                                <input
                                    id="otp"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="------"
                                    value={otp}
                                    onChange={e=>setOtp(e.target.value)}
                                    disabled={loading}
                                    className={`mt-1 w-full p-3 text-center tracking-[0.5rem] border rounded dark:bg-gray-700 dark:border-gray-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                />
                            </div>
                             {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            <button type="submit" disabled={loading} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                                {loading ? t('validating') : t('validate_and_activate')}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvestmentJourneyPage;