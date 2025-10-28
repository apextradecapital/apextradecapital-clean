import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

const OtpPanel = () => {
    const { t, investments, generateOtpForInvestment } = useAppContext();
    const [investmentId, setInvestmentId] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleGenerate = () => {
        setGeneratedOtp('');
        setError('');

        if (!investmentId) {
            setError(t('investment_id_required'));
            return;
        };
        const investmentExists = investments.find(inv => inv.id === investmentId && inv.status === 'pending');
        if (!investmentExists) {
            setError(t('investment_id_not_found'));
            return;
        }

        const newOtp = generateOtpForInvestment(investmentId);
        setGeneratedOtp(newOtp);
    };

    const copyToClipboard = () => {
        if (!generatedOtp) return;
        navigator.clipboard.writeText(generatedOtp);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg max-w-lg">
            <h2 className="text-xl font-bold mb-4">{t('generate_otp')}</h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="investmentId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('investment_id')}</label>
                    <input
                        type="text"
                        id="investmentId"
                        value={investmentId}
                        onChange={e => setInvestmentId(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-gold focus:border-brand-gold"
                        placeholder={t('investment_id_placeholder')}
                    />
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={loading || !investmentId}
                    className="w-full bg-brand-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50"
                >
                    {loading ? '...' : t('generate')}
                </button>
                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                
                {generatedOtp && (
                    <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg space-y-4">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('otp_code')}:</p>
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-3xl font-mono tracking-widest">{generatedOtp}</p>
                                <button onClick={copyToClipboard} className="bg-gray-200 dark:bg-gray-600 font-bold px-4 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                                    {copied ? t('copied') : t('copy')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OtpPanel;
