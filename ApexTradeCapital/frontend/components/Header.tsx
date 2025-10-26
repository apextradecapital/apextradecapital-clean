import React from 'react';
import RealTimeClock from './RealTimeClock';
import { useAppContext } from '../context/AppContext';
import HaitiFlagIcon from './icons/HaitiFlagIcon';
import UsaFlagIcon from './icons/UsaFlagIcon';
import FranceFlagIcon from './icons/FranceFlagIcon';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useAppContext();

  const iconStyle = "w-6 h-6 rounded-full cursor-pointer transition-transform duration-200 transform hover:scale-110";
  const activeIconStyle = "ring-2 ring-brand-gold ring-offset-2 ring-offset-brand-charcoal";

  return (
    <div className="flex items-center space-x-3">
       <button onClick={() => setLanguage('HT')} className={`${language === 'HT' ? activeIconStyle : 'opacity-60'} ${iconStyle}`} aria-label="Switch to Haitian Creole">
        <HaitiFlagIcon className="w-full h-full rounded-full" />
      </button>
      <button onClick={() => setLanguage('FR')} className={`${language === 'FR' ? activeIconStyle : 'opacity-60'} ${iconStyle}`} aria-label="Switch to French">
        <FranceFlagIcon className="w-full h-full rounded-full" />
      </button>
      <button onClick={() => setLanguage('EN')} className={`${language === 'EN' ? activeIconStyle : 'opacity-60'} ${iconStyle}`} aria-label="Switch to English">
        <UsaFlagIcon className="w-full h-full rounded-full" />
      </button>
    </div>
  );
};


const Header = () => {
  const { navigate, theme, toggleTheme, currentUser, logout, t } = useAppContext();

  const scrollToOffers = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.location.pathname !== '/') {
      navigate('home');
      // Need a slight delay for the page to switch before scrolling
      setTimeout(() => {
        document.getElementById('offers')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById('offers')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header className="bg-white dark:bg-brand-charcoal shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <button onClick={() => navigate('home')} className="flex items-center gap-2 focus:outline-none">
              <img src="/logo.png" alt="Apex Trust Capital Logo" className="h-10" />
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-xl font-extrabold text-brand-blue dark:text-white">APEX TRUST</span>
                <span className="text-sm font-bold text-brand-gold -mt-1">CAPITAL</span>
              </div>
            </button>
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => navigate('home')} className="text-gray-600 dark:text-gray-300 hover:text-brand-blue dark:hover:text-brand-gold font-semibold transition-colors duration-200">{t('home')}</button>
              <a href="#offers" onClick={scrollToOffers} className="text-gray-600 dark:text-gray-300 hover:text-brand-blue dark:hover:text-brand-gold font-semibold transition-colors duration-200">{t('offers')}</a>
              <button onClick={() => navigate('open-international')} className="text-gray-600 dark:text-gray-300 hover:text-brand-blue dark:hover:text-brand-gold font-semibold transition-colors duration-200">{t('open_international')}</button>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold"
                aria-label="Toggle dark mode"
              >
                {theme === 'light' ? (
                    <MoonIcon className="w-5 h-5" />
                ) : (
                    <SunIcon className="w-5 h-5" />
                )}
              </button>
              
              <div className="hidden sm:block">
                  <LanguageSwitcher />
              </div>
              
              {currentUser ? (
                <div className="flex items-center gap-2">
                    <span className="font-semibold hidden sm:inline text-brand-charcoal dark:text-white">{currentUser.displayName}</span>
                    <button onClick={() => navigate('dashboard')} className="bg-brand-blue hover:bg-blue-800 text-white px-3 py-2 rounded-md transition-colors text-sm font-semibold">
                        {t('dashboard')}
                    </button>
                     <button onClick={() => navigate('my-withdrawals')} className="text-gray-600 dark:text-gray-300 hover:text-brand-blue dark:hover:text-brand-gold font-semibold transition-colors duration-200 text-sm">
                        💰 {t('mes_retraits')}
                    </button>
                    <button onClick={logout} className="text-gray-600 dark:text-gray-300 hover:text-brand-blue dark:hover:text-brand-gold font-semibold transition-colors duration-200 text-sm">
                        {t('logout_button')}
                    </button>
                </div>
              ) : (
                <button onClick={() => navigate('login')} className="bg-brand-blue hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    {t('login_button')}
                </button>
              )}

            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;