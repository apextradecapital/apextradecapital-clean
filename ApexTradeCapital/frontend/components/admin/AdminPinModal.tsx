import React, { useState } from 'react';

interface AdminPinModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ADMIN_PIN = '123456'; // Mock PIN

const AdminPinModal: React.FC<AdminPinModalProps> = ({ onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) {
      setPin(value);
      setError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      onSuccess();
    } else {
      setError('PIN incorrect.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100]">
      <div className="bg-white dark:bg-brand-charcoal p-8 rounded-lg shadow-2xl w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center text-brand-blue dark:text-brand-gold mb-6">Accès Administrateur</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={pin}
            onChange={handlePinChange}
            maxLength={6}
            className="w-full p-4 text-center text-2xl tracking-[1rem] bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-gold"
            placeholder="------"
            autoFocus
          />
          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-gray-300 dark:bg-gray-600 text-brand-charcoal dark:text-white font-bold py-3 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="w-full bg-brand-blue text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition-colors"
            >
              Entrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPinModal;
