import React, { useState, useRef, useEffect } from 'react';
import { runChat } from '../services/geminiService';
import type { ChatMessage } from '../types';
import SparklesIcon from './icons/SparklesIcon';
import { useAppContext } from '../context/AppContext';

const SoleyChatbot = () => {
  const { t } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      setHistory([{ role: 'model', text: t('gemini_greeting') }]);
  }, [t]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    const newHistory = [...history, userMessage];
    setHistory(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const modelResponse = await runChat(newHistory);
      setHistory(prev => [...prev, { role: 'model', text: modelResponse }]);
    } catch (error) {
      setHistory(prev => [...prev, { role: 'model', text: 'Désolé, une erreur est survenue.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className={`fixed bottom-8 right-8 z-50 transition-all duration-300 ${isOpen ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
        <button
          onClick={() => setIsOpen(true)}
          className="bg-brand-blue text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-brand-gold"
          aria-label="Open AI Assistant"
        >
          <SparklesIcon className="w-8 h-8 text-brand-gold" />
        </button>
      </div>

      <div className={`fixed bottom-0 right-0 sm:bottom-8 sm:right-8 w-full h-full sm:w-96 sm:h-[600px] bg-white dark:bg-brand-charcoal rounded-none sm:rounded-lg shadow-2xl flex flex-col z-50 transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <header className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
          <h3 className="font-bold text-lg text-brand-blue dark:text-brand-gold flex items-center">
            <SparklesIcon className="w-5 h-5 mr-2 text-brand-gold"/> PrimeFX Assistant
          </h3>
          <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800 dark:hover:text-white">&times;</button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {history.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-brand-blue text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="max-w-xs lg:max-w-sm px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                  <div className="flex items-center space-x-1">
                     <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
	                  <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
	                  <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></span>
                  </div>
               </div>
            </div>
          )}
          <div ref={chatEndRef}></div>
        </div>

        <footer className="p-4 border-t dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t('gemini_input_placeholder')}
              className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-gold"
              disabled={isLoading}
            />
            <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-brand-gold text-brand-charcoal font-bold px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
              {t('gemini_send_button')}
            </button>
          </div>
        </footer>
      </div>
    </>
  );
};

export default SoleyChatbot;
