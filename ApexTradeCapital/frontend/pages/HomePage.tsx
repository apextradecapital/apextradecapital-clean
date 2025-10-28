import React, { useState, useMemo, useRef, useEffect } from 'react';
import { INVESTMENT_PACKAGES, WHATSAPP_NUMBER } from '../constants';
import type { InvestmentPackage } from '../types';
import MarketDataTable from '../components/MarketDataTable';
import HaitiFlagIcon from '../components/icons/HaitiFlagIcon';
import UsaFlagIcon from '../components/icons/UsaFlagIcon';
import { useAppContext } from '../context/AppContext';
import BriefcaseIcon from '../components/icons/BriefcaseIcon';
import SparklesIcon from '../components/icons/SparklesIcon';
import HomeIcon from '../components/icons/HomeIcon';
import SunIcon from '../components/icons/SunIcon';
import * as Calc from '../services/calculationService';

// --- Helper Hook for Scroll Animations ---
const useOnScreen = (options: IntersectionObserverInit) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                if (ref.current) {
                    observer.unobserve(ref.current);
                }
            }
        }, options);

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [ref, options]);

    return [ref, isVisible] as const;
};


// --- New Icon Components ---
const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);

const LightbulbIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.311a7.5 7.5 0 01-7.5 0c1.433- .326 2.942-.578 4.5-.847m3.75.847a10.5 10.5 0 00-4.5 0m4.5 0a3.75 3.75 0 00-3.75 0m-3.75 0h7.5M9 12.75a3 3 0 013-3h.008c1.657 0 3-1.343 3-3s-1.343-3-3-3H9.75a3 3 0 00-3 3h0" />
  </svg>
);

const GlobeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zM3.75 9h16.5M3.75 15h16.5M9 3.75a19.485 19.485 0 015.19 0M9 20.25a19.485 19.485 0 015.19 0" />
  </svg>
);


// --- Open International Section Components ---

const openInternationalTestimonials = [
    { name: 'Widlyne Dorcely', city: 'Port-au-Prince', photo: 'https://i.pravatar.cc/150?u=wdorcely', comment: 'Grâce au programme PrimeFX Trust, j’ai lancé mon atelier solaire à Port-au-Prince.' },
    { name: 'Samuel Jean', city: 'Carrefour', photo: 'https://i.pravatar.cc/150?u=sjean', comment: 'Je crois à leur vision : connecter Haïti au monde. Un support incroyable.' },
    { name: 'Linda Michel', city: 'Pétion-Ville', photo: 'https://i.pravatar.cc/150?u=lmichel', comment: 'La fondation m’a aidé à préparer mon départ pour le Canada. Je suis si reconnaissante.' },
    { name: 'Ricardo Chery', city: 'Cap-Haïtien', photo: 'https://i.pravatar.cc/150?u=rchery', comment: 'Investir dans la santé avec PrimeFX a été une décision qui a du sens pour ma communauté.' },
    { name: 'Nathalie Augustin', city: 'Delmas', photo: 'https://i.pravatar.cc/150?u=naugustin', comment: 'Leur soutien aux startups tech est une véritable bouffée d’air frais pour l’innovation en Haïti.' },
    { name: 'Jean-Pierre Louis', city: 'Gonaïves', photo: 'https://i.pravatar.cc/150?u=jplouis', comment: 'Le programme de mobilité est très sérieux. J\'ai pu rejoindre ma famille aux USA.' },
    { name: 'Fabienne Joseph', city: 'Saint-Marc', photo: 'https://i.pravatar.cc/150?u=fjoseph', comment: 'En tant que volontaire, je vois l\'impact direct de la fondation. C\'est inspirant.' },
    { name: 'David Exantus', city: 'Jacmel', photo: 'https://i.pravatar.cc/150?u=dexantus', comment: 'J\'ai pu financer mes études grâce à une bourse de la fondation PrimeFX. Merci!' },
    { name: 'Stéphanie Baptiste', city: 'Léogâne', photo: 'https://i.pravatar.cc/150?u=sbaptiste', comment: 'Leur projet d\'énergie renouvelable est l\'avenir pour nos quartiers.' },
    { name: 'Emmanuel Constant', city: 'Croix-des-Bouquets', photo: 'https://i.pravatar.cc/150?u=econstant', comment: 'Un accompagnement humain et professionnel. On se sent vraiment soutenu.' },
];

const OpenInternationalTestimonialCarousel = () => {
    // Duplicate testimonials for a seamless loop effect
    const testimonialsToDisplay = [...openInternationalTestimonials, ...openInternationalTestimonials];
    
    return (
        <div className="w-full overflow-hidden relative group py-8">
            <div className="flex animate-scroll-horizontal group-hover:[animation-play-state:paused]">
                {testimonialsToDisplay.map((testimonial, index) => (
                    <div key={index} className="flex-shrink-0 w-80 mx-4">
                         <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col h-full text-center">
                            <img src={testimonial.photo} alt={testimonial.name} className="mx-auto w-20 h-20 rounded-full mb-4 object-cover border-4 border-brand-gold" />
                            <figcaption className="font-bold text-brand-blue dark:text-brand-gold">
                                {testimonial.name}
                            </figcaption>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.city}</p>
                            <p className="text-yellow-400 my-2 text-xl">★★★★★</p>
                            <blockquote className="text-gray-600 dark:text-gray-300 flex-grow mt-2 text-sm italic">
                                <p>"{testimonial.comment}"</p>
                            </blockquote>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ActionDomainCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => {
    const [ref, isVisible] = useOnScreen({ threshold: 0.1 });
    return (
        <div ref={ref} className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center transform transition-all duration-700 ease-out animate-on-scroll ${isVisible ? 'animate-fade-up' : ''}`}>
            <div className="flex justify-center items-center mb-4 text-brand-gold h-16 w-16 mx-auto transition-transform duration-300 hover:scale-110">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-brand-blue dark:text-blue-300 mb-2">{title}</h3>
            <p className="text-gray-600 dark:text-gray-400">{children}</p>
        </div>
    );
};

const JoinProgramForm = () => {
    const [ref, isVisible] = useOnScreen({ threshold: 0.1 });
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+509');
    const [reason, setReason] = useState('Investir');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        try {
          const lang = navigator.language || navigator.languages[0];
          if (lang.startsWith("fr")) setCountryCode("+33");
          else if (lang.startsWith("en-US")) setCountryCode("+1");
          else if (lang.startsWith("ht")) setCountryCode("+509");
        } catch {
          setCountryCode("+509");
        }
    }, []);

    const handleSubmit = () => {
        if (!name || !phone) return;
        const fullPhoneNumber = `${countryCode}${phone.replace(/\D/g, '')}`;
        const message = `Bonjour, je souhaite rejoindre le programme Open International.\n\n- Nom: ${name}\n- Numéro: ${fullPhoneNumber}\n- Motif: ${reason}`;
        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        setSubmitted(true);
        setName('');
        setPhone('');
    };
    
    return (
        <div ref={ref} className={`bg-white dark:bg-brand-charcoal p-8 rounded-2xl shadow-2xl transition-all duration-700 ease-out animate-on-scroll ${isVisible ? 'animate-fade-up' : ''}`}>
            <h2 className="text-3xl font-bold text-center mb-8 text-brand-blue dark:text-brand-gold">Rejoindre le programme</h2>
            {submitted ? (
                <div className="text-center p-8 bg-green-50 dark:bg-green-900/50 rounded-lg">
                    <h3 className="text-2xl font-bold text-green-700 dark:text-green-300">✅ Inscription envoyée !</h3>
                    <p className="mt-2 text-gray-700 dark:text-gray-300">Votre message a été préparé. Veuillez l'envoyer sur WhatsApp pour finaliser.</p>
                    <button onClick={() => setSubmitted(false)} className="mt-4 text-sm text-brand-blue dark:text-brand-gold underline">Envoyer un autre message</button>
                </div>
            ) : (
                <div className="max-w-xl mx-auto space-y-6">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nom complet" required className="w-full p-3 border rounded dark:bg-gray-800 dark:border-gray-600" />
                    <div className="flex gap-0 items-center rounded-md border border-gray-300 dark:border-gray-600 focus-within:ring-1 focus-within:ring-brand-gold">
                        <select value={countryCode} onChange={e => setCountryCode(e.target.value)} className="p-3 bg-gray-50 dark:bg-gray-800 border-r dark:border-gray-600 rounded-l-md focus:outline-none h-full">
                            <option value="+509">🇭🇹 +509</option>
                            <option value="+1">🇺🇸 +1</option>
                            <option value="+33">🇫🇷 +33</option>
                        </select>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Numéro WhatsApp" required className="flex-1 w-full p-3 bg-transparent dark:bg-gray-700 border-0 rounded-r-md focus:outline-none focus:ring-0"/>
                    </div>
                    <select value={reason} onChange={e => setReason(e.target.value)} className="w-full p-3 border rounded dark:bg-gray-800 dark:border-gray-600">
                        <option>Investir</option>
                        <option>Être volontaire</option>
                        <option>Demander un accompagnement</option>
                    </select>
                    <button onClick={handleSubmit} className="w-full bg-brand-gold text-brand-charcoal font-bold py-3 px-6 rounded-lg text-lg hover:bg-brand-blue hover:text-white transition-colors duration-300">
                        📲 Rejoindre via WhatsApp
                    </button>
                </div>
            )}
        </div>
    );
};

const categoryStyles: { [key: string]: string } = {
  'Standard': 'bg-blue-600 hover:bg-blue-700',
  'Normal': 'bg-green-600 hover:bg-green-700',
  'Premium': 'bg-purple-600 hover:bg-purple-700',
  'VIP': 'bg-gray-800 hover:bg-black',
};

const OfferCard: React.FC<{ pkg: InvestmentPackage; onSelect: (pkg: InvestmentPackage) => void; }> = ({ pkg, onSelect }) => {
    const { convertHTGtoUSDString, convertHTGtoEURString } = useAppContext();
    const buttonStyle = categoryStyles[pkg.category] || 'bg-brand-blue hover:bg-blue-800';
    
    const fees = Calc.calculateAccompanimentFee(pkg.amount);
    const totalAmount = Calc.calculateTotalInvestment(pkg.amount);
    const expectedPayout = Calc.calculateExpectedPayout(pkg.amount);

    const formatCurrencyHTG = (amount: number) => 
        `${amount.toLocaleString('fr-HT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} HTG`;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col text-left transform hover:-translate-y-1 transition-transform duration-200">
            <h3 className="text-lg font-bold text-brand-charcoal dark:text-white text-center">{pkg.name}</h3>
            
            <div className="my-4 flex-grow space-y-3 text-sm border-t border-b py-4 dark:border-gray-700">
                <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Investissement:</span>
                    <span className="font-semibold text-right text-brand-charcoal dark:text-white">
                        {formatCurrencyHTG(pkg.amount)}
                        <br />
                        <span className="text-xs font-normal text-gray-500">{convertHTGtoUSDString(pkg.amount)} / {convertHTGtoEURString(pkg.amount)}</span>
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Frais:</span>
                    <span className="font-semibold text-right text-brand-charcoal dark:text-white">
                        {formatCurrencyHTG(fees)}
                        <br />
                        <span className="text-xs font-normal text-gray-500">{convertHTGtoUSDString(fees)} / {convertHTGtoEURString(fees)}</span>
                    </span>
                </div>
                 <div className="flex justify-between font-bold">
                    <span className="text-gray-600 dark:text-gray-400">Total:</span>
                    <span className="text-right text-brand-charcoal dark:text-white">
                        {formatCurrencyHTG(totalAmount)}
                        <br />
                        <span className="text-xs font-normal text-gray-500">{convertHTGtoUSDString(totalAmount)} / {convertHTGtoEURString(totalAmount)}</span>
                    </span>
                </div>
            </div>

            <div className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">Gain Assuré (4x)</p>
                <p className="text-xl font-extrabold text-green-600 dark:text-green-400">
                    {formatCurrencyHTG(expectedPayout)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {convertHTGtoUSDString(expectedPayout)} / {convertHTGtoEURString(expectedPayout)}
                </p>
            </div>
            
            <button onClick={() => onSelect(pkg)} className={`mt-4 w-full text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 ${buttonStyle}`}>
                Choisir ce Pack
            </button>
        </div>
    );
};


const OffersGrid: React.FC<{
    packages: InvestmentPackage[];
    onPackageSelect: (pkg: InvestmentPackage) => void;
}> = ({ packages, onPackageSelect }) => {
    
    const packagesByCategory: Record<string, InvestmentPackage[]> = {};
    packages.forEach((pkg) => {
        if (!packagesByCategory[pkg.category]) {
            packagesByCategory[pkg.category] = [];
        }
        packagesByCategory[pkg.category].push(pkg);
    });

    return (
        <div className="space-y-8">
            {Object.entries(packagesByCategory).map(([category, pkgs]) => (
                <div key={category}>
                    <h3 className="text-2xl font-bold mb-4 text-brand-charcoal dark:text-white border-l-4 border-brand-gold pl-3">{category}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                        {pkgs.map(pkg => (
                            <OfferCard key={pkg.name} pkg={pkg} onSelect={onPackageSelect} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const BenefitCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
        <div className="flex justify-center items-center mb-4 text-brand-gold h-12 w-12 mx-auto">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-brand-blue dark:text-blue-300 mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400">{children}</p>
    </div>
);

const testimonials = [
  { name: 'Emmanuela J.', quote: "Une plateforme simple et efficace. J'ai vu mes investissements grandir rapidement. Très satisfait!", bgColor: '#60a5fa' },
  { name: 'Ricardo A.', quote: "Enfin une solution financière qui comprend nos besoins. Le support client est exceptionnel.", bgColor: '#fbbf24' },
  { name: 'Stevenson P.', quote: "PrimeFX Trust Capital m'a donné la confiance nécessaire pour investir. Les résultats parlent d'eux-mêmes.", bgColor: '#f87171' },
  { name: 'Nathalie D.', quote: "La transparence et la sécurité sont au rendez-vous. Je recommande vivement.", bgColor: '#4ade80' },
  { name: 'Widler B.', quote: "J'apprécie la clarté des offres et le suivi personnalisé. On se sent vraiment accompagné.", bgColor: '#c084fc' },
  { name: 'Fabienne G.', quote: "Leur vision pour la communauté est inspirante. C'est plus qu'un investissement, c'est un partenariat.", bgColor: '#2dd4bf' }
];

const TestimonialCarousel = () => {
    const testimonialsToDisplay = [...testimonials, ...testimonials];

    return (
        <div className="w-full overflow-hidden relative group py-8">
            <div className="flex animate-scroll-horizontal-slow group-hover:[animation-play-state:paused]">
                {testimonialsToDisplay.map((testimonial, index) => {
                    const initials = testimonial.name.split(' ').map(n => n[0]).join('');
                    return (
                        <div key={index} className="flex-shrink-0 w-80 mx-4">
                            <figure className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col h-full text-center">
                                <div className="mx-auto w-20 h-20 rounded-full mb-4 flex items-center justify-center text-white text-3xl font-bold" style={{ backgroundColor: testimonial.bgColor }}>
                                    {initials}
                                </div>
                                <figcaption className="font-semibold text-center text-brand-blue dark:text-brand-gold">
                                    {testimonial.name}
                                </figcaption>
                                <p className="text-yellow-400 my-2 text-xl">★★★★★</p>
                                <blockquote className="text-gray-600 dark:text-gray-300 flex-grow mt-2 text-sm italic">
                                    <p>"{testimonial.quote}"</p>
                                </blockquote>
                            </figure>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const HomePage = () => {
    const { navigate, t } = useAppContext();
    const [ref, isVisible] = useOnScreen({ threshold: 0.1 });

    const handlePackageSelect = (pkg: InvestmentPackage) => {
        navigate('investment-journey', { packageName: pkg.name });
    };

  return (
    <>
    <div className="space-y-16 py-12">
      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-brand-charcoal dark:text-white"
          dangerouslySetInnerHTML={{ __html: t('invest_with_bridges').replace(/ponts/g, '<span class="text-brand-blue dark:text-blue-400">ponts</span>').replace(/bridges/g, '<span class="text-brand-blue dark:text-blue-400">bridges</span>') }}
        />
        <p className="mt-4 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          PrimeFX Trust Capital fusionne finance, mobilité et opportunités pour la communauté haïtiano-américaine. Un écosystème de confiance pour votre avenir.
        </p>
        <a href="#offers" onClick={(e) => { e.preventDefault(); document.getElementById('offers')?.scrollIntoView({ behavior: 'smooth' }); }} className="mt-8 inline-block bg-brand-gold text-brand-charcoal font-bold py-3 px-8 rounded-lg text-lg hover:opacity-90 transition-opacity duration-300">
          {t('discover_offers')}
        </a>
      </section>

      {/* Investment Packages Section */}
      <section id="offers" className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div>
            <div className="flex items-center justify-center gap-4 mb-6">
                <HaitiFlagIcon className="w-10 h-10 rounded-full shadow-lg"/>
                <span className="text-2xl font-bold text-brand-gold">&harr;</span>
                <UsaFlagIcon className="w-10 h-10 rounded-full shadow-lg"/>
            </div>
            <h2 className="text-3xl font-bold text-brand-charcoal dark:text-white text-center">{t('investment_offers')}</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mt-2 mb-8 max-w-2xl mx-auto">
                Découvrez nos packs d'investissement flexibles conçus pour la communauté. Chaque investissement offre un potentiel de gain de 4x.
            </p>
            <OffersGrid packages={INVESTMENT_PACKAGES} onPackageSelect={handlePackageSelect} />
        </div>
      </section>

       {/* Live Markets Section */}
       <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <MarketDataTable />
      </section>

      {/* Why Invest Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12 text-brand-charcoal dark:text-white">{t('why_invest')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <BenefitCard icon={<BriefcaseIcon className="w-10 h-10"/>} title={t('pro_management')}>
                    {t('pro_management_desc')}
                </BenefitCard>
                <BenefitCard icon={<SparklesIcon className="w-10 h-10"/>} title={t('growth_potential')}>
                    {t('growth_potential_desc')}
                </BenefitCard>
                <BenefitCard icon={<HomeIcon className="w-10 h-10"/>} title={t('community_service')}>
                    {t('community_service_desc')}
                </BenefitCard>
            </div>
        </section>

        {/* Testimonials Section */}
        <section className="bg-gray-50 dark:bg-gray-900 py-16 overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-3xl font-bold text-center mb-4 text-brand-charcoal dark:text-white">{t('what_clients_say')}</h2>
            </div>
            <TestimonialCarousel />
        </section>

        {/* --- Open International Program Section --- */}
        <section id="open-international-program" className="bg-brand-blue text-white py-20 overflow-hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div ref={ref} className={`transition-all duration-700 ease-out animate-on-scroll ${isVisible ? 'animate-fade-up' : ''}`}>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-brand-gold">Open International Program</h2>
                    <p className="mt-2 text-lg md:text-xl text-gray-300 font-semibold">Investir dans l'avenir de l'humanité depuis Haïti.</p>
                    <p className="mt-4 max-w-3xl mx-auto text-gray-300">
                        Le programme Open International d’PrimeFX Trust Capital offre des opportunités d’investissement durable en Haïti et à l’étranger : énergie solaire, santé, technologie, mobilité et accompagnement humanitaire. Notre fondation soutient aussi ceux qui souhaitent bâtir un avenir meilleur. Ensemble, nous investissons dans le progrès et l’humain.
                    </p>
                </div>
            </div>

            <OpenInternationalTestimonialCarousel />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
                 <div>
                    <h3 className="text-3xl font-bold text-center mb-12 text-white">Nos Domaines d'Action</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        <ActionDomainCard icon={<SunIcon className="w-12 h-12"/>} title="Énergie Solaire">Investir dans la lumière durable.</ActionDomainCard>
                        <ActionDomainCard icon={<HeartIcon className="w-12 h-12"/>} title="Santé & Bien-être">Soigner et prévenir ensemble.</ActionDomainCard>
                        <ActionDomainCard icon={<LightbulbIcon className="w-12 h-12"/>} title="Technologie & Innovation">Propulser les jeunes entreprises.</ActionDomainCard>
                        <ActionDomainCard icon={<GlobeIcon className="w-12 h-12"/>} title="Mobilité Internationale">Accompagner ceux qui veulent partir et réussir.</ActionDomainCard>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 py-16 px-4 rounded-2xl">
                    <JoinProgramForm />
                </div>
            </div>
        </section>
    </div>
    </>
  );
};

export default HomePage;
