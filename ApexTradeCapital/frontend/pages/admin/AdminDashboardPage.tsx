import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import InvestmentsPanel from '../../components/admin/InvestmentsPanel';
import OtpPanel from '../../components/admin/OtpPanel';
import UploadsPanel from '../../components/admin/UploadsPanel';
import NotificationsPanel from '../../components/admin/NotificationsPanel';
import LogsPanel from '../../components/admin/LogsPanel';
import SystemPanel from '../../components/admin/SystemPanel';
import ExportPanel from '../../components/admin/ExportPanel';
import TestimonialsPanel from '../../components/admin/TestimonialsPanel';
import AdminToast from '../../components/admin/AdminToast';
import WithdrawalsPanel from '../../components/admin/WithdrawalsPanel';

type AdminTab = 'investments' | 'withdrawals' | 'otp' | 'uploads' | 'notifications' | 'logs' | 'system' | 'export' | 'testimonials';

const AdminDashboardPage = () => {
    const { t, logout, toasts } = useAppContext();
    const [activeTab, setActiveTab] = useState<AdminTab>('investments');

    const tabs: { id: AdminTab; label: string }[] = [
        { id: 'investments', label: t('investments') },
        { id: 'withdrawals', label: t('withdrawals') },
        { id: 'uploads', label: t('uploads') },
        { id: 'testimonials', label: t('testimonials') },
        { id: 'system', label: t('system') },
        { id: 'otp', label: 'OTP' },
        { id: 'notifications', label: t('notifications') },
        { id: 'logs', label: t('logs') },
        { id: 'export', label: t('export') },
    ];

    const renderPanel = () => {
        switch (activeTab) {
            case 'investments': return <InvestmentsPanel />;
            case 'withdrawals': return <WithdrawalsPanel />;
            case 'otp': return <OtpPanel />;
            case 'uploads': return <UploadsPanel />;
            case 'notifications': return <NotificationsPanel />;
            case 'logs': return <LogsPanel />;
            case 'system': return <SystemPanel />;
            case 'export': return <ExportPanel />;
            case 'testimonials': return <TestimonialsPanel />;
            default: return null;
        }
    };

    return (
        <div className="w-full dashboard-watermark">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
                <h1 className="text-4xl font-extrabold text-brand-blue dark:text-brand-gold">{t('admin_dashboard')}</h1>
                <button onClick={logout} className="mt-4 sm:mt-0 bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                    {t('logout')}
                </button>
            </div>
            
            <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-2 px-4 font-semibold -mb-px border-b-2 transition-colors duration-200 ${
                            activeTab === tab.id
                                ? 'border-brand-gold text-brand-gold'
                                : 'border-transparent text-gray-500 hover:text-brand-blue dark:hover:text-white'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div>
                {renderPanel()}
            </div>

            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-[200] space-y-2">
                {toasts.map(toast => (
                    <AdminToast key={toast.id} toast={toast} />
                ))}
            </div>
        </div>
    );
};

export default AdminDashboardPage;
