import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

const AdminLoginPage: React.FC = () => {
  // Fix: Use `loginAdmin` for admin authentication, as `login` does not exist in the context.
  const { loginAdmin, t } = useAppContext();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    // Fix: Call `loginAdmin` with the password.
    const success = await loginAdmin(password);
    if (!success) {
      setError("Mot de passe incorrect.");
      setPassword('');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="bg-white dark:bg-brand-charcoal p-8 rounded-2xl shadow-2xl w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center text-brand-blue dark:text-brand-gold mb-6">{t('login_admin')}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            className="w-full p-3 bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-gold"
            placeholder="Mot de passe"
            autoFocus
            disabled={isLoading}
          />
          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              disabled={isLoading || password.length === 0}
              className="w-full bg-brand-blue text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '...' : t('enter')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
