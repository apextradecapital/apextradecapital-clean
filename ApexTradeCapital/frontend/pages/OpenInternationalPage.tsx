import React, { useState, ChangeEvent, FormEvent } from 'react';
import HaitiFlagIcon from '../components/icons/HaitiFlagIcon';
import UsaFlagIcon from '../components/icons/UsaFlagIcon';
import BriefcaseIcon from '../components/icons/BriefcaseIcon';
import PlaneIcon from '../components/icons/PlaneIcon';
import HomeIcon from '../components/icons/HomeIcon';
import DocumentIcon from '../components/icons/DocumentIcon';
import VoixHaitiCarousel from '../components/VoixHaitiCarousel';
import { useAppContext } from '../context/AppContext';

const BenefitCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
        <div className="flex justify-center items-center mb-4 text-brand-gold h-12 w-12 mx-auto">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-brand-blue dark:text-blue-300 mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400">{children}</p>
    </div>
);

const OpenInternationalPage = () => {
    const { t } = useAppContext();
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', specialty: '', message: '' });
    const [submitted, setSubmitted] = useState(false);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        console.log("Open International Interest Form Submission:", formData);
        setSubmitted(true);
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-900">
            {/* Hero Section */}
            <section className="bg-brand-blue relative overflow-hidden">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-white z-10 relative">
                     <div className="flex justify-center items-center space-x-8 mb-4">
                        <HaitiFlagIcon className="w-20 h-20 rounded-full shadow-lg"/>
                        <span className="text-5xl font-bold text-brand-gold">&harr;</span>
                        <UsaFlagIcon className="w-20 h-20 rounded-full shadow-lg"/>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold">{t('oi_title')}</h1>
                    <p className="mt-4 text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
                        {t('oi_subtitle')}
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
                {/* Program Overview Section */}
                <section>
                    <h2 className="text-3xl font-bold text-center mb-4 text-brand-charcoal dark:text-white">{t('oi_overview_title')}</h2>
                    <p className="text-center text-lg text-gray-600 dark:text-gray-400 max-w-4xl mx-auto">
                        {t('oi_overview_text')}
                    </p>
                </section>

                 {/* Testimonials Section */}
                <section>
                    <h2 className="text-3xl font-bold text-center mb-12 text-brand-charcoal dark:text-white">{t('oi_testimonials_title')}</h2>
                    <VoixHaitiCarousel />
                </section>

                {/* Key Benefits Section */}
                <section>
                     <h2 className="text-3xl font-bold text-center mb-12 text-brand-charcoal dark:text-white">{t('oi_services_title')}</h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        <BenefitCard icon={<BriefcaseIcon className="w-12 h-12"/>} title={t('oi_service1_title')}>
                            {t('oi_service1_desc')}
                        </BenefitCard>
                        <BenefitCard icon={<DocumentIcon className="w-12 h-12"/>} title={t('oi_service2_title')}>
                            {t('oi_service2_desc')}
                        </BenefitCard>
                        <BenefitCard icon={<PlaneIcon className="w-12 h-12"/>} title={t('oi_service3_title')}>
                             {t('oi_service3_desc')}
                        </BenefitCard>
                        <BenefitCard icon={<HomeIcon className="w-12 h-12"/>} title={t('oi_service4_title')}>
                            {t('oi_service4_desc')}
                        </BenefitCard>
                     </div>
                </section>
                
                {/* Call to Action / Form Section */}
                <section id="contact-form" className="bg-white dark:bg-brand-charcoal p-8 rounded-2xl shadow-2xl">
                    <h2 className="text-3xl font-bold text-center mb-8 text-brand-blue dark:text-brand-gold">{t('oi_form_title')}</h2>
                    {submitted ? (
                        <div className="text-center p-8 bg-green-50 dark:bg-green-900/50 rounded-lg">
                            <h3 className="text-2xl font-bold text-green-700 dark:text-green-300">{t('oi_form_success_title')}</h3>
                            <p className="mt-2 text-gray-700 dark:text-gray-300">{t('oi_form_success_text')}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('oi_form_fullname_label')}</label>
                                <input type="text" name="name" id="name" required value={formData.name} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-gold focus:border-brand-gold"/>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('oi_form_email_label')}</label>
                                    <input type="email" name="email" id="email" required value={formData.email} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-gold focus:border-brand-gold"/>
                                </div>
                                 <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('oi_form_phone_label')}</label>
                                    <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-gold focus:border-brand-gold"/>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('oi_form_specialty_label')}</label>
                                <input type="text" name="specialty" id="specialty" required value={formData.specialty} onChange={handleInputChange} placeholder={t('oi_form_specialty_placeholder')} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-gold focus:border-brand-gold"/>
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('oi_form_message_label')}</label>
                                <textarea name="message" id="message" rows={4} value={formData.message} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-brand-gold focus:border-brand-gold"></textarea>
                            </div>
                             <div>
                                <button type="submit" className="w-full bg-brand-gold text-brand-charcoal font-bold py-3 px-6 rounded-lg text-lg hover:opacity-90 transition-opacity duration-300">
                                    {t('oi_form_submit_button')}
                                </button>
                            </div>
                        </form>
                    )}
                </section>
            </div>
        </div>
    );
};

export default OpenInternationalPage;