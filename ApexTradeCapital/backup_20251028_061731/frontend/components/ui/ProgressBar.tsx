import React from 'react';
import type { IntentStatus, Investment } from '../../types';

type ProgressStatus = IntentStatus | Investment['status'];

interface ProgressBarProps {
  status: ProgressStatus;
  progress?: number; // Optional progress from 0.0 to 1.0
}

const statusMap: Record<ProgressStatus, { percentage: number; label: string; color: string; animation?: string }> = {
  // IntentStatus
  'en_revue': { percentage: 25, label: 'En revue', color: 'bg-yellow-500' },
  'preuve_recue': { percentage: 50, label: 'Preuve reçue', color: 'bg-blue-500' },
  'validée': { percentage: 75, label: 'Validée', color: 'bg-green-500' },
  'terminée': { percentage: 100, label: 'Terminée', color: 'bg-brand-gold' },
  'rejetée': { percentage: 100, label: 'Rejetée', color: 'bg-red-500' },
  // Investment['status']
  'pending': { percentage: 5, label: 'En attente', color: 'bg-gray-400', animation: 'animate-pulse' },
  'active': { percentage: 0, label: 'Actif', color: 'bg-green-500' }, // For 'active', progress is driven by the 'progress' prop.
  'completed': { percentage: 100, label: 'Terminé', color: 'bg-brand-gold' },
  'on_hold': { percentage: 0, label: 'En pause', color: 'bg-yellow-500', animation: 'animate-progress-stripes' }, // For 'on_hold', progress is driven by the 'progress' prop.
};


const ProgressBar: React.FC<ProgressBarProps> = ({ status, progress }) => {
  const statusInfo = statusMap[status] || statusMap.pending;
  
  const percentage = progress !== undefined ? progress * 100 : statusInfo.percentage;
  const { label, color, animation } = statusInfo;
  
  const barClasses = [
    'h-4',
    'rounded-full',
    'transition-[width]',
    'duration-1000',
    'ease-out',
    color,
    animation
  ].filter(Boolean).join(' ');

  const barStyle: React.CSSProperties = {
    width: `${percentage}%`,
    // Apply striped background for on_hold status, which will be animated
    ...(status === 'on_hold' && {
        backgroundImage: `linear-gradient(45deg, rgba(255, 255, 255, 0.2) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.2) 75%, transparent 75%, transparent)`,
        backgroundSize: `1rem 1rem`,
    }),
  };

  return (
    <div>
        <div className="flex justify-between mb-1">
            <span className="text-base font-medium text-brand-blue dark:text-white">{label}</span>
            <span className="text-sm font-medium text-brand-blue dark:text-white">{Math.round(percentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700 overflow-hidden">
            <div
                className={barClasses}
                style={barStyle}
            ></div>
        </div>
    </div>
  );
};

export default ProgressBar;