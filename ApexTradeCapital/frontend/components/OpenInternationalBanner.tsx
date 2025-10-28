import React from 'react';
import { useAppContext } from '../context/AppContext';
import HaitiFlagIcon from './icons/HaitiFlagIcon';
import UsaFlagIcon from './icons/UsaFlagIcon';
import FranceFlagIcon from './icons/FranceFlagIcon';

const OpenInternationalBanner = () => {
    const { navigate } = useAppContext();

    return (
        <div className="bg-brand-blue text-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row justify-between items-center">
                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                    <div className="flex -space-x-4">
                        <HaitiFlagIcon className="w-10 h-10 rounded-full border-2 border-white shadow-md"/>
                        <UsaFlagIcon className="w-10 h-10 rounded-full border-2 border-white shadow-md"/>
                        <FranceFlagIcon className="w-10 h-10 rounded-full border-2 border-white shadow-md"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Découvrez le Programme Open International</h3>
                        <p className="text-sm text-gray-300">Votre pont vers de nouvelles opportunités professionnelles.</p>
                    </div>
                </div>
                <button 
                    onClick={() => navigate('open-international')}
                    className="bg-brand-gold text-brand-charcoal font-bold py-2 px-6 rounded-lg hover:opacity-90 transition-opacity duration-300"
                >
                    En savoir plus
                </button>
            </div>
        </div>
    );
};

export default OpenInternationalBanner;
