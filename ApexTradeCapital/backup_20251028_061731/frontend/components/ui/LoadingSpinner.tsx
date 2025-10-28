import React from 'react';

const LoadingSpinner = () => {
    return (
        <div className="flex justify-center items-center p-8">
            <div className="w-16 h-16 border-4 border-brand-blue border-t-transparent dark:border-brand-gold dark:border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
};

export default LoadingSpinner;