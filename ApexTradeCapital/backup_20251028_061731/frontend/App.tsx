import React, { useEffect, useState, lazy, Suspense } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import Header from './components/Header';
import Footer from './components/Footer';
import SecurityBanner from './components/SecurityBanner';
import HomePage from './pages/HomePage';
import SoleyChatbot from './components/GeminiAssistant';
import OpenInternationalPage from './pages/OpenInternationalPage';
import SplashScreen from './pages/SplashScreen';
import InvestmentJourneyPage from './pages/InvestmentJourneyPage';
import LoginPage from './pages/LoginPage';
import LoadingSpinner from './components/ui/LoadingSpinner';
import OpenInternationalBanner from './components/OpenInternationalBanner';

const AdminPage = lazy(() => import('./pages/AdminPage'));
const ClientDashboardPage = lazy(() => import('./pages/ClientDashboardPage'));
const MyWithdrawals = lazy(() => import('./pages/MyWithdrawals'));

const PageRenderer = () => {
  const { page, currentUser, navigate } = useAppContext();
  
  const isUserAuthenticated = !!currentUser;

  useEffect(() => {
    if ((page === 'dashboard' || page === 'my-withdrawals') && !isUserAuthenticated) {
        navigate('login');
    }
  }, [page, isUserAuthenticated, navigate]);


  switch (page) {
    case 'admin':
      return <Suspense fallback={<LoadingSpinner />}><AdminPage /></Suspense>;
    case 'login':
        return isUserAuthenticated ? <Suspense fallback={<LoadingSpinner />}><ClientDashboardPage /></Suspense> : <LoginPage />;
    case 'open-international':
      return <OpenInternationalPage />;
    case 'investment-journey':
      return <InvestmentJourneyPage />;
    case 'dashboard':
      return isUserAuthenticated ? <Suspense fallback={<LoadingSpinner />}><ClientDashboardPage /></Suspense> : null;
    case 'my-withdrawals':
      return isUserAuthenticated ? <Suspense fallback={<LoadingSpinner />}><MyWithdrawals /></Suspense> : null;
    case 'home':
    default:
      return <HomePage />;
  }
};

const AdminShortcutHandler = () => {
  const { loginAdmin, navigate, t } = useAppContext();
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key === '1') {
        e.preventDefault();
        setShowAdminPrompt(true);
        setError('');
        setPassword('');
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const handleLogin = async () => {
    const success = await loginAdmin(password);
    if (success) {
      setShowAdminPrompt(false);
      navigate('admin');
    } else {
      setError(t('incorrect_password'));
      setPassword('');
    }
  };

  if (!showAdminPrompt) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[200]">
      <div className="bg-white dark:bg-brand-charcoal rounded-lg shadow-xl p-6 w-80 text-center">
        <h2 className="text-lg font-bold text-brand-blue dark:text-brand-gold mb-4">🔐 {t('admin_access_shortcut_title')}</h2>
        <input
          type="password"
          className="border dark:border-gray-600 p-2 rounded w-full text-center bg-gray-50 dark:bg-gray-800 focus:ring-brand-gold focus:border-brand-gold focus:outline-none"
          placeholder={t('password_placeholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          autoFocus
        />
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        <div className="flex justify-center gap-3 mt-4">
          <button
            onClick={() => setShowAdminPrompt(false)}
            className="border dark:border-gray-600 px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleLogin}
            className="bg-brand-blue hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            {t('enter_shortcut')}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          Raccourci: <b>Ctrl + Alt + 1</b>
        </p>
      </div>
    </div>
  );
};

function App() {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return <SplashScreen onFinish={() => setLoading(false)} />;
  }

  return (
    <AppProvider>
      <div className="bg-white dark:bg-brand-charcoal min-h-screen flex flex-col font-sans text-gray-800 dark:text-gray-200">
        <SecurityBanner />
        <Header />
        <main className="flex-grow">
          <PageRenderer />
        </main>
        <OpenInternationalBanner />
        <Footer />
        <SoleyChatbot />
        <AdminShortcutHandler />
      </div>
    </AppProvider>
  );
}

export default App;