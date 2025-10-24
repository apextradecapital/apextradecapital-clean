import React from 'react';
import { useAppContext } from '../context/AppContext';
import WithdrawalStatusTracker from '../components/WithdrawalStatusTracker';

const MyWithdrawals = () => {
    const { currentUser, withdrawals, fees, t } = useAppContext();

    if (!currentUser) {
        return null; // Should be redirected by the main App component
    }

    const myWithdrawals = withdrawals
        .filter(w => w.userId === currentUser.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-brand-blue dark:text-brand-gold mb-8">{t('mes_retraits')}</h1>
            
            {myWithdrawals.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
                    <p className="text-gray-600 dark:text-gray-400">{t('aucun_retrait')}</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {myWithdrawals.map(withdrawal => (
                        <div key={withdrawal.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                            <div className="border-b dark:border-gray-700 pb-4 mb-4">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                    {t('investment_id')}: <span className="font-mono text-brand-blue dark:text-blue-400">{withdrawal.investmentId}</span>
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    {t('final_amount')}: <span className="font-bold">{withdrawal.amount.toLocaleString()} HTG</span>
                                </p>
                            </div>
                            <WithdrawalStatusTracker 
                                withdrawal={withdrawal} 
                                fees={fees.filter(f => f.withdrawalId === withdrawal.id)} 
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyWithdrawals;