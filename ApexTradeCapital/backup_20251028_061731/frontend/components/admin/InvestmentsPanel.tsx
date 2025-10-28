import React, { useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import type { Investment } from '../../types';

const InvestmentsPanel = () => {
    const { t, investments, setInvestments, showToast, systemState, addSystemNotification } = useAppContext();

    useEffect(() => {
        const interval = setInterval(() => {
            if (!systemState || systemState.maintenance || !systemState.autoStart) {
                return;
            }

            setInvestments(prevInvestments => {
                const newlyCompleted: Investment[] = [];
                const intervalMs = 60000;

                const updatedInvestments = prevInvestments.map(inv => {
                    if (inv.status === 'active' && inv.progress < 1) {
                        let progressPerMinute = 0;
                        switch (inv.duration) {
                            case '4h': progressPerMinute = intervalMs / 24000000; break;
                            case '8h': progressPerMinute = intervalMs / 48000000; break;
                            case '1d': progressPerMinute = intervalMs / 86400000; break;
                            case '7d': progressPerMinute = intervalMs / 604800000; break;
                            case '1m': progressPerMinute = intervalMs / 2592000000; break;
                            default: progressPerMinute = 0;
                        }

                        const newProgress = Math.min(inv.progress + progressPerMinute, 1);
                        
                        if (newProgress >= 1 && inv.progress < 1) {
                            const completedInv = {
                                ...inv,
                                progress: 1,
                                status: 'completed' as const,
                            };
                            newlyCompleted.push(completedInv);
                            return completedInv;
                        }
                        
                        return {
                            ...inv,
                            progress: newProgress,
                        };
                    }
                    return inv;
                });
                
                if (newlyCompleted.length > 0) {
                     newlyCompleted.forEach(inv => {
                        // Show toast in admin panel
                        setTimeout(() => showToast(`L'investissement ${inv.id} (${inv.userDisplayName}) est terminé.`, 'success'), 0);
                        // Send translated notification to the user
                        if (inv.userId) {
                            addSystemNotification(inv.userId, 'investment_completed');
                        }
                    });
                }

                return updatedInvestments;
            });
        }, 60000); // Run every 60 seconds (1 minute)

        return () => clearInterval(interval);
    }, [setInvestments, showToast, systemState, addSystemNotification]);


    const statusColor = (status: Investment['status']) => {
        switch(status) {
            case 'active': return 'bg-green-500';
            case 'completed': return 'bg-brand-gold text-brand-charcoal';
            case 'on_hold': return 'bg-yellow-500';
            case 'pending': return 'bg-gray-400';
            default: return 'bg-gray-400';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">{t('investments')}</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-gray-900">
                            <th className="p-3 font-semibold">{t('user')}</th>
                            <th className="p-3 font-semibold">{t('amount')}</th>
                            <th className="p-3 font-semibold">{t('total')}</th>
                            <th className="p-3 font-semibold">{t('progress')}</th>
                            <th className="p-3 font-semibold">{t('status')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {investments.map(inv => (
                            <tr key={inv.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="p-3">{inv.userDisplayName}</td>
                                <td className="p-3 font-mono">{inv.amount.toLocaleString()} HTG</td>
                                <td className="p-3 font-mono">{inv.total.toLocaleString()} HTG</td>
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                            <div
                                                className={`h-2.5 rounded-full transition-all duration-1000 ease-linear ${inv.status === 'completed' ? 'bg-brand-gold' : 'bg-brand-blue'}`}
                                                style={{ width: `${inv.progress * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs font-mono w-12 text-right">
                                            {(inv.progress * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 text-xs font-bold text-white rounded-full ${statusColor(inv.status)}`}>
                                        {inv.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InvestmentsPanel;