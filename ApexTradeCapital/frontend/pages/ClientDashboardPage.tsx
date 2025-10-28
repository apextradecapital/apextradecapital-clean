import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { WHATSAPP_NUMBER } from '../constants';
import ProgressBar from '../components/ui/ProgressBar';
import WithdrawalStatusTracker from '../components/WithdrawalStatusTracker';

const ClientDashboardPage = () => {
    // Fix: Add 'notifications' to the destructuring from useAppContext.
    const { currentUser, investments, withdrawals, fees, requestWithdrawal, t, notifications } = useAppContext();
    const [myInvestment, setMyInvestment] = useState(investments.find(inv => inv.userId === currentUser?.id && inv.status === 'active'));
    
    useEffect(() => {
        const activeInvestment = investments.find(inv => inv.userId === currentUser?.id && inv.status === 'active');
        if (activeInvestment) {
          setMyInvestment(activeInvestment);
        }
    }, [investments, currentUser?.id]);
    
    const completedInvestments = investments.filter(inv => inv.userId === currentUser?.id && inv.status === 'completed');
    const myNotifications = (currentUser ? notifications.filter(n => n.toUserId === currentUser.id || n.toUserId === 'all') : []).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}`;

    if (!currentUser) {
        return null; // Should be redirected by App.tsx logic
    }
    
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 dashboard-watermark">
            <h1 className="text-3xl font-bold text-brand-blue dark:text-brand-gold">{t('welcome')}, {currentUser.displayName}!</h1>
            
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {myInvestment ? (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                            <h2 className="text-xl font-bold mb-4">{t('my_active_investment')}</h2>
                            <p className="text-gray-500 dark:text-gray-400">{myInvestment.packageName}</p>
                            <div className="mt-4">
                                <ProgressBar status={myInvestment.status} progress={myInvestment.progress} />
                                {myInvestment.status === 'completed' && <p className="text-green-500 font-bold text-center mt-4">{t('investment_complete_message')}</p>}
                            </div>
                        </div>
                    ) : (
                       !completedInvestments.length && (
                         <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
                            <p className="text-gray-600 dark:text-gray-400">{t('no_active_investment')}</p>
                         </div>
                       )
                    )}

                    {completedInvestments.map(inv => {
                        const withdrawal = withdrawals.find(w => w.investmentId === inv.id);
                        return (
                            <div key={inv.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                                <h2 className="text-xl font-bold mb-2">{t('completed_investment')}: {inv.packageName}</h2>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">{t('final_amount')}: <span className="font-bold">{inv.total.toLocaleString()} HTG</span></p>
                                
                                {withdrawal ? (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">{t('withdrawal_status')}</h3>
                                        <WithdrawalStatusTracker 
                                            withdrawal={withdrawal} 
                                            fees={fees.filter(f => f.withdrawalId === withdrawal.id)} 
                                        />
                                    </div>
                                ) : (
                                    <button onClick={() => requestWithdrawal(inv.id)} className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                                        {t('request_withdrawal')}
                                    </button>
                                )}
                            </div>
                        );
                    })}

                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold mb-4">{t('notifications')}</h2>
                    <ul className="space-y-3 max-h-96 overflow-y-auto">
                        {myNotifications.length > 0 ? myNotifications.map(n => (
                            <li key={n.id} className="border-b dark:border-gray-700 pb-2 text-sm text-gray-700 dark:text-gray-300">
                                {n.body}
                                <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                            </li>
                        )).slice(0, 10) : <p className="text-sm text-gray-500">{t('no_notifications')}</p>}
                    </ul>
                </div>
            </div>

            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" title={t('contact_manager_title')} className="fixed bottom-6 right-6 bg-green-500 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-3xl hover:bg-green-600 transition-colors">
              💬
            </a>
        </div>
    );
};

export default ClientDashboardPage;

