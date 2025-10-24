import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import type { Log } from '../../types';

// MOCK: Mock log data for offline display.
const mockLogs: Log[] = [
    { id: 4, actor: 'system', action: 'investment_progress', targetType: 'investment', targetId: 'inv_1', details_json: JSON.stringify({ from: 0.74, to: 0.75, ip: '127.0.0.1' }), ts: new Date().toISOString() },
    { id: 3, actor: 'admin', action: 'login_success', targetType: 'session', targetId: 'admin', details_json: JSON.stringify({ ip: '192.168.1.10' }), ts: new Date(Date.now() - 60000).toISOString() },
    { id: 2, actor: 'admin', action: 'review_upload', targetType: 'upload', targetId: 'up_x', details_json: JSON.stringify({ status: 'approved', note: 'Looks good.', ip: '192.168.1.10' }), ts: new Date(Date.now() - 120000).toISOString() },
    { id: 1, actor: 'user_3', action: 'upload_document', targetType: 'upload', targetId: 'up_2', details_json: JSON.stringify({ filename: 'receipt_inv3.jpg', ip: '10.0.0.5' }), ts: new Date(Date.now() - 180000).toISOString() },
];


const LogsPanel = () => {
    const { t, token } = useAppContext();
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actorFilter, setActorFilter] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            if (!token) return;
            try {
                setLoading(true);
                await new Promise(resolve => setTimeout(resolve, 500));
                setLogs(mockLogs);
                setError('');
            } catch (err) {
                setError('Could not load logs.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [token]);

    const filteredLogs = logs.filter(log => 
        log.actor.toLowerCase().includes(actorFilter.toLowerCase())
    );

    if (loading) return <p>Loading logs...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{t('logs')}</h2>
                <input
                    type="text"
                    placeholder={t('filter_by_actor')}
                    value={actorFilter}
                    onChange={(e) => setActorFilter(e.target.value)}
                    className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                />
            </div>
            <div className="overflow-auto h-[60vh] font-mono text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded-lg">
                {filteredLogs.map(log => (
                    <div key={log.id} className="p-2 border-b dark:border-gray-700">
                        <span className="text-gray-500">{new Date(log.ts).toLocaleString()}</span>
                        <span className="text-green-500 font-bold ml-2">[{log.actor}]</span>
                        <span className="ml-2">{log.action}</span>
                        <span className="text-blue-400 ml-2">{log.targetType}:{log.targetId}</span>
                        <details className="mt-1">
                            <summary className="cursor-pointer text-gray-400">{t('details')}</summary>
                            <pre className="p-2 bg-gray-100 dark:bg-black rounded mt-1 whitespace-pre-wrap break-all">{JSON.stringify(JSON.parse(log.details_json), null, 2)}</pre>
                        </details>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LogsPanel;