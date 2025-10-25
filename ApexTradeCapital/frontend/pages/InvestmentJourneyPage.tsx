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
    const { params, setInvestments, showToast, setCurrentUser, navigate, language, addSystemNotification, addManualNotification, generateOtpForInvestment, t } = useAppContext();
    // We no longer use a multi‑step flow with an OTP entered by the client.
    // As soon as the investment intent is created we automatically generate an OTP and
    // activate the user’s account.  The administrator can still view and copy
    // this OTP from the admin dashboard, but the client never needs to manually
    // enter it.  Therefore we only track the form fields and a loading flag here.
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+509');
    const selectedPackage = useMemo(() => {
        return INVESTMENT_PACKAGES.find(p => p.name === params.packageName) || INVESTMENT_PACKAGES[0];
    }, [params.packageName]);
    const [duration, setDuration] = useState<'4h' | '8h' | '1d' | '7d' | '1m'>('4h');
    const [nameError, setNameError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    // Track loading state during async operations
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

    const handleIntentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        // Create a new investment intent
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
        // Append the new investment to the list immediately so the admin can see it
        setInvestments(prev => [...prev, newInvestment]);
        showToast(`Nouvelle intention: ${name}`, 'info');

        // Generate an OTP for this investment so the admin can verify it later
        const otp = generateOtpForInvestment(newInvestmentId);
        // Notify the admin via a manual notification containing the OTP
        addManualNotification(`OTP généré pour l'investissement ${newInvestmentId}: ${otp}`, 'all');

        // Automatically create a user account and activate the investment
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
        // Update the investment with the user ID and status
        setInvestments(prev => prev.map(inv => inv.id === newInvestmentId ? { ...inv, userId: newUserId, status: 'active', progress: 0 } : inv));
        setCurrentUser(newUser);
        // Send system notifications for investment creation and OTP verification
        addSystemNotification(newUserId, 'investment_created');
        addSystemNotification(newUserId, 'otp_verified');
        showToast(`Compte créé pour ${name}!`, 'success');

        setLoading(false);
        navigate('dashboard', { userId: newUserId });
    };

    // The client no longer confirms via OTP; therefore the previous handleConfirmSubmit
    // function is removed.

    return (
        <div className="container mx-auto max-w-lg px-4 py-12">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl">
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
        </div>
    );
};

export default InvestmentJourneyPage;