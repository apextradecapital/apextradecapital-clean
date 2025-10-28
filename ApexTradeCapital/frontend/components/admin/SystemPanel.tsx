
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';

const SystemPanel = () => {
    const { t, token, systemState, setSystemState } = useAppContext();
    const [dailyRate, setDailyRate] = useState(0);

    useEffect(() => {
        if(systemState) {
            setDailyRate(systemState.dailyRate * 100); // Convert to percentage for display
        }
    }, [systemState])

    const sendSystemCommand = async (action: 'stop' | 'resume' | 'maintenance', value?: any) => {
        if (!token || !systemState) return;
        try {
            // MOCK: Simulate API call and update context state directly.
            await new Promise(resolve => setTimeout(resolve, 300));
            
            setSystemState(currentState => {
                if (!currentState) return null;
                const newState = { ...currentState };
                switch(action) {
                    case 'stop':
                        newState.autoStart = false;
                        break;
                    case 'resume':
                        newState.autoStart = true;
                        if(value?.dailyRate !== undefined) {
                            newState.dailyRate = value.dailyRate;
                        }
                        break;
                    case 'maintenance':
                        newState.maintenance = value.maintenance;
                        break;
                }
                return newState;
            });
        } catch (err) {
            console.error(`Failed to send system command: ${action}`, err);
        }
    };

    const handleRateUpdate = () => {
        const rateValue = parseFloat(dailyRate.toString()) / 100;
        if(!isNaN(rateValue)) {
            sendSystemCommand('resume', { dailyRate: rateValue });
        }
    };
    
    if (!systemState) {
        return <p>Loading system state...</p>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg max-w-2xl space-y-8">
            <div>
                <h2 className="text-xl font-bold mb-4">{t('system_controls')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Investment Engine Control */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <h3 className="font-semibold">{t('investment_engine')}</h3>
                        <p className={`text-sm ${systemState.autoStart ? 'text-green-600' : 'text-red-600'}`}>
                            {systemState.autoStart ? t('engine_running') : t('engine_stopped')}
                        </p>
                        <div className="flex gap-2 mt-2">
                             <button onClick={() => sendSystemCommand('resume')} className="bg-green-600 text-white font-bold py-1 px-3 rounded-lg">{t('resume')}</button>
                            <button onClick={() => sendSystemCommand('stop')} className="bg-red-600 text-white font-bold py-1 px-3 rounded-lg">{t('stop')}</button>
                        </div>
                    </div>
                    {/* Maintenance Mode Control */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <h3 className="font-semibold">{t('maintenance_mode')}</h3>
                        <p className={`text-sm ${systemState.maintenance ? 'text-yellow-600' : 'text-gray-500'}`}>
                            {systemState.maintenance ? t('maintenance_enabled') : t('maintenance_disabled')}
                        </p>
                        <div className="flex gap-2 mt-2">
                             <button onClick={() => sendSystemCommand('maintenance', { maintenance: !systemState.maintenance })} className="bg-yellow-500 text-white font-bold py-1 px-3 rounded-lg">
                                {systemState.maintenance ? 'Disable' : 'Enable'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
             <div>
                <h3 className="font-semibold">{t('daily_rate')}</h3>
                <div className="flex items-center gap-2 mt-2">
                    <input 
                        type="number"
                        value={dailyRate}
                        onChange={(e) => setDailyRate(parseFloat(e.target.value) || 0)}
                        className="p-2 w-24 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"
                    />
                    <span>%</span>
                    <button onClick={handleRateUpdate} className="bg-brand-blue text-white font-bold py-1 px-3 rounded-lg">{t('update')}</button>
                </div>
            </div>
        </div>
    );
};

export default SystemPanel;

