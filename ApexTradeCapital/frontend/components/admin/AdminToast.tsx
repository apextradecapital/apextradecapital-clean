import React from 'react';
import type { ToastNotification } from '../../types';

interface AdminToastProps {
  toast: ToastNotification;
}

const toastColors = {
  info: 'bg-blue-500',
  success: 'bg-green-500',
  error: 'bg-red-500',
};

const AdminToast: React.FC<AdminToastProps> = ({ toast }) => {
  return (
    <div
      className={`relative w-80 max-w-sm p-4 rounded-lg shadow-lg text-white transition-all duration-500 animate-fade-in-right ${toastColors[toast.type]}`}
    >
      <p>{toast.message}</p>
    </div>
  );
};

export default AdminToast;
