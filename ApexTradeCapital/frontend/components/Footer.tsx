import React from 'react';
import { TIKTOK_PROFILE_URL, WHATSAPP_NUMBER } from '../constants';
import { useAppContext } from '../context/AppContext';
import HaitiFlagIcon from './icons/HaitiFlagIcon';
import FranceFlagIcon from './icons/FranceFlagIcon';
import UsaFlagIcon from './icons/UsaFlagIcon';

const Footer = () => {
    const { t } = useAppContext();
    const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}`;

    return (
        <footer className="bg-brand-charcoal text-white">
            <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">
                    <div className="flex items-center gap-3">
                        <HaitiFlagIcon className="w-6 h-auto rounded-sm" />
                        <FranceFlagIcon className="w-6 h-auto rounded-sm" />
                        <UsaFlagIcon className="w-6 h-auto rounded-sm" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-400">© 2025 PrimeFX Trust Capital – Investir • Prospérer • Partager</p>
                    </div>
                    <div className="flex space-x-6">
                        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-gold transition-colors">
                            WhatsApp
                        </a>
                        <a href={TIKTOK_PROFILE_URL} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-gold transition-colors">
                            TikTok
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
