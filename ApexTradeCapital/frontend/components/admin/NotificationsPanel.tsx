import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import type { Language } from '../../types';

const NotificationsPanel = () => {
    const { t, addManualNotification } = useAppContext();
    const [message, setMessage] = useState('');
    const [notifLang, setNotifLang] = useState<Language>('FR');
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState('');

    const handleSend = async () => {
        if (!message.trim()) return;
        setLoading(true);
        setFeedback('');
        try {
            // MOCK: Simulate API call to send a notification.
            await new Promise(resolve => setTimeout(resolve, 500));
            addManualNotification(message); // Add to local state
            
            setFeedback(t('notification_sent_success'));
            setMessage('');
        } catch (err) {
            setFeedback(t('notification_sent_error'));
            console.error(err);
        } finally {
            setLoading(false);
            setTimeout(() => setFeedback(''), 3000);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg max-w-lg">
            <h2 className="text-xl font-bold mb-4">{t('notifications')}</h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="notif-lang" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('message_language')}</label>
                    <select 
                        id="notif-lang" 
                        value={notifLang}
                        onChange={e => setNotifLang(e.target.value as Language)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-brand-gold focus:border-brand-gold sm:text-sm rounded-md"
                    >
                        <option value="FR">🇫🇷 {t('french')}</option>
                        <option value="EN">🇺🇸 {t('english')}</option>
                        <option value="HT">🇭🇹 {t('haitian_creole')}</option>
                    </select>
                </div>
                <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={t('write_message')}
                    rows={5}
                    className="w-full p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-gold focus:border-brand-gold"
                />
                <button
                    onClick={handleSend}
                    disabled={loading || !message.trim()}
                    className="w-full bg-brand-gold text-brand-charcoal font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {loading ? '...' : t('send')}
                </button>
                {feedback && <p className={feedback.startsWith('Error') ? 'text-red-500' : 'text-green-500'}>{feedback}</p>}
            </div>
        </div>
    );
};

export default NotificationsPanel;