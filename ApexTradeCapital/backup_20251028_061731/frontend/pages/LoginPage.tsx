import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

const LoginPage = () => {
    const { loginUser, navigate, currentUser, t } = useAppContext();
    const [countryCode, setCountryCode] = useState('+509');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Redirect if already logged in
    useEffect(() => {
        if (currentUser) {
            navigate('dashboard');
        }
    }, [currentUser, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);
        setError('');

        if (!phone.trim() || !password.trim()) {
            setError('Veuillez remplir tous les champs.');
            setLoading(false);
            return;
        }

        const fullPhoneNumber = `${countryCode}${phone.replace(/\D/g, '')}`;

        const result = await loginUser(fullPhoneNumber, password);
        
        if (result.success) {
            navigate('dashboard');
        } else {
            setError(result.error || 'Une erreur est survenue.');
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center">
            <div className="bg-white dark:bg-brand-charcoal p-8 rounded-2xl shadow-2xl w-full max-w-md">
                <h1 className="text-3xl font-bold text-center mb-6 text-brand-blue dark:text-brand-gold">{t('login_client')}</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('phone_number')}</label>
                        <div className="mt-1 flex gap-0 items-center rounded-md shadow-sm border border-gray-300 dark:border-gray-600 focus-within:ring-1 focus-within:ring-brand-gold focus-within:border-brand-gold">
                            <select
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                                className="pl-3 pr-2 py-2 bg-gray-50 dark:bg-gray-800 border-r dark:border-gray-600 rounded-l-md focus:outline-none h-full"
                                >
                                <option value="+509">🇭🇹 +509 Haïti</option>
                                <option value="+1">🇺🇸 +1 États-Unis</option>
                                <option value="+33">🇫🇷 +33 France</option>
                            </select>
                            <input 
                                type="tel" 
                                id="phone" 
                                value={phone} 
                                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} 
                                required 
                                placeholder="Votre numéro" 
                                className="flex-1 block w-full px-3 py-2 bg-transparent dark:bg-gray-700 border-0 rounded-r-md focus:outline-none focus:ring-0"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="password"className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('password')}</label>
                        <input 
                            type="password" 
                            id="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-gold focus:border-brand-gold"
                        />
                    </div>
                    {error && <p className="text-red-500 text-center text-sm">{error}</p>}
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full bg-brand-blue text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50"
                    >
                        {loading ? t('login_in_progress') : t('login')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;