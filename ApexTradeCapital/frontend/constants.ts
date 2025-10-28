import type { InvestmentPackage, Investment, Testimonial, User, Withdrawal, Fee, Upload } from './types';

export const WHATSAPP_NUMBER = "+16265333367";
export const TIKTOK_PROFILE_URL = "https://www.tiktok.com/@capitaltrusthtg"; // Placeholder URL

export const INVESTMENT_PACKAGES: InvestmentPackage[] = [
  // Standard
  { category: 'Standard', name: 'Standard 1', amount: 5000, currency: 'HTG' },
  { category: 'Standard', name: 'Standard 2', amount: 10000, currency: 'HTG' },
  { category: 'Standard', name: 'Standard 3', amount: 15000, currency: 'HTG' },
  { category: 'Standard', name: 'Standard 4', amount: 20000, currency: 'HTG' },
  // Normal
  { category: 'Normal', name: 'Normal 1', amount: 30000, currency: 'HTG' },
  { category: 'Normal', name: 'Normal 2', amount: 40000, currency: 'HTG' },
  { category: 'Normal', name: 'Normal 3', amount: 50000, currency: 'HTG' },
  { category: 'Normal', name: 'Normal 4', amount: 60000, currency: 'HTG' },
  // Premium
  { category: 'Premium', name: 'Premium 1', amount: 75000, currency: 'HTG' },
  { category: 'Premium', name: 'Premium 2', amount: 100000, currency: 'HTG' },
  { category: 'Premium', name: 'Premium 3', amount: 125000, currency: 'HTG' },
  { category: 'Premium', name: 'Premium 4', amount: 150000, currency: 'HTG' },
  // VIP
  { category: 'VIP', name: 'VIP 1 / A', amount: 200000, currency: 'HTG' },
  { category: 'VIP', name: 'VIP 1 / B', amount: 250000, currency: 'HTG' },
  { category: 'VIP', name: 'VIP 1 / C', amount: 300000, currency: 'HTG' },
  { category: 'VIP', name: 'VIP 1 / D', amount: 350000, currency: 'HTG' },
  { category: 'VIP', name: 'VIP 2 / A', amount: 400000, currency: 'HTG' },
  { category: 'VIP', name: 'VIP 2 / B', amount: 450000, currency: 'HTG' },
  { category: 'VIP', name: 'VIP 2 / C', amount: 475000, currency: 'HTG' },
  { category: 'VIP', name: 'VIP 2 / D', amount: 500000, currency: 'HTG' },
];

export const MOCK_INVESTMENTS: Investment[] = [
    { id: 'inv_1', userId: 'user_1', userDisplayName: 'Emmanuela J.', packageName: 'Premium 1', amount: 75000, total: 78750, progress: 1.0, status: 'completed', createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), duration: '1d' },
    { id: 'inv_2', userId: 'user_2', userDisplayName: 'Ricardo A.', packageName: 'VIP 1 / A', amount: 200000, total: 210000, progress: 1.0, status: 'completed', createdAt: new Date(Date.now() - 86400000 * 30).toISOString() },
    { id: 'inv_3', userId: 'user_3', userDisplayName: 'Stevenson P.', packageName: 'Standard 2', amount: 10000, total: 10500, progress: 0.0, status: 'pending', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 'inv_4', userId: 'user_4', userDisplayName: 'Nathalie D.', packageName: 'Normal 3', amount: 50000, total: 52500, progress: 0.45, status: 'active', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), duration: '8h' },
    { id: 'inv_5', userId: 'user_5', userDisplayName: 'Widler B.', packageName: 'VIP 2 / C', amount: 475000, total: 485000, progress: 0.10, status: 'active', createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), duration: '7d' },
    { id: 'inv_6', userId: 'user_6', userDisplayName: 'Fabienne G.', packageName: 'Standard 4', amount: 20000, total: 21000, progress: 0.95, status: 'active', createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), duration: '4h' },
    { id: 'inv_7', userId: 'user_7', userDisplayName: 'David M.', packageName: 'VIP 2 / D', amount: 500000, total: 510000, progress: 1.0, status: 'completed', createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), duration: '1m'},
];

export const MOCK_USERS: User[] = [
    { id: 'user_1', email: 'emmanuela@example.com', phoneE164: '+150911111111', displayName: 'Emmanuela J.', role: 'user', consentPhone: true, createdAt: new Date(), lastSeen: new Date(), language: 'FR', password: 'password123' },
    { id: 'user_2', email: 'ricardo@example.com', phoneE164: '+150922222222', displayName: 'Ricardo A.', role: 'user', consentPhone: true, createdAt: new Date(), lastSeen: new Date(), language: 'HT', password: 'password123' },
    { id: 'user_3', email: 'stevenson@example.com', phoneE164: '+150933333333', displayName: 'Stevenson P.', role: 'user', consentPhone: true, createdAt: new Date(), lastSeen: new Date(), language: 'FR', password: 'password123' },
    { id: 'user_4', email: 'nathalie@example.com', phoneE164: '+150944444444', displayName: 'Nathalie D.', role: 'user', consentPhone: true, createdAt: new Date(), lastSeen: new Date(), language: 'EN', password: 'password123' },
    { id: 'user_5', email: 'widler@example.com', phoneE164: '+150955555555', displayName: 'Widler B.', role: 'user', consentPhone: true, createdAt: new Date(), lastSeen: new Date(), language: 'FR', password: 'password123' },
    { id: 'user_6', email: 'fabienne@example.com', phoneE164: '+150966666666', displayName: 'Fabienne G.', role: 'user', consentPhone: true, createdAt: new Date(), lastSeen: new Date(), language: 'HT', password: 'password123' },
    { id: 'user_7', email: 'david@example.com', phoneE164: '+150977777777', displayName: 'David M.', role: 'user', consentPhone: true, createdAt: new Date(), lastSeen: new Date(), language: 'EN', password: 'password123' },
];

export const MOCK_TESTIMONIALS: Testimonial[] = [
    { id: 'test_1', name: 'Jean-Pierre Dubois', city: 'Port-au-Prince', photo: 'https://i.pravatar.cc/150?u=jp_dubois', comment: 'Un service exceptionnel qui a changé ma perspective sur l\'investissement. L\'équipe est professionnelle et toujours à l\'écoute. Je recommande vivement PrimeFX!', stars: 5, createdAt: new Date('2023-10-20T10:00:00Z').toISOString() },
    { id: 'test_2', name: 'Marie-Lourdes Célestin', city: 'Cap-Haïtien', photo: 'https://i.pravatar.cc/150?u=ml_celestin', comment: 'Grâce à Open International, j\'ai pu enfin concrétiser mon projet de mobilité. Un accompagnement de A à Z, je me suis sentie en sécurité et bien conseillée.', stars: 5, createdAt: new Date('2023-11-05T14:30:00Z').toISOString() },
    { id: 'test_3', name: 'Kenny Joseph', city: 'Pétion-Ville', photo: 'https://i.pravatar.cc/150?u=k_joseph', comment: 'J\'étais sceptique au début, mais les résultats sont là. Mon capital a grandi et j\'ai pu financer mes projets personnels. Une plateforme fiable et transparente.', stars: 4, createdAt: new Date('2023-11-15T09:00:00Z').toISOString() },
    { id: 'test_4', name: 'Stéphanie Auguste', city: 'Jacmel', photo: 'https://i.pravatar.cc/150?u=s_auguste', comment: 'Le programme de mobilité pour les infirmières est une opportunité en or. PrimeFX a tout géré, des documents au logement. Je suis très reconnaissante.', stars: 5, createdAt: new Date('2024-01-22T18:00:00Z').toISOString() }
];

export const MOCK_WITHDRAWALS: Withdrawal[] = [
    { 
        id: 'wdr_1', 
        investmentId: 'inv_1', 
        userId: 'user_1', 
        amount: 78750, 
        status: 'fees_required', 
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), 
        updatedAt: new Date(Date.now() - 86400000 * 1).toISOString() 
    },
    { 
        id: 'wdr_2', 
        investmentId: 'inv_2', 
        userId: 'user_2', 
        amount: 210000, 
        status: 'otp_pending', 
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), 
        updatedAt: new Date().toISOString() 
    },
     { 
        id: 'wdr_3', 
        investmentId: 'inv_7', 
        userId: 'user_7', 
        amount: 510000, 
        status: 'requested', 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
    },
];

export const MOCK_FEES: Fee[] = [
    { 
        id: 'fee_1', 
        withdrawalId: 'wdr_1', 
        label: 'Frais de conversion', 
        amount: 2500,
        status: 'pending', 
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), 
        updatedAt: new Date(Date.now() - 86400000 * 1).toISOString() 
    },
    { 
        id: 'fee_2', 
        withdrawalId: 'wdr_1', 
        label: 'Frais de réseau', 
        amount: 500,
        status: 'proof_uploaded', 
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString(), 
        updatedAt: new Date(Date.now() - 3600000).toISOString() 
    },
    { 
        id: 'fee_3', 
        withdrawalId: 'wdr_2', 
        label: 'Frais de conversion', 
        amount: 5250,
        status: 'otp_sent', 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
    },
];

export const MOCK_UPLOADS: Upload[] = [
    { id: 'up_1', investmentId: 'inv_3', path: '/uploads/receipt_inv3.jpg', mimetype: 'image/jpeg', size: 78910, status: 'pending', uploadedAt: new Date(Date.now() - 7200000).toISOString(), adminNote: JSON.stringify({ linkedTo: 'investment' }) },
    { id: 'up_2', investmentId: '', path: '/uploads/fee_proof_fee2.png', mimetype: 'image/png', size: 150230, status: 'pending', uploadedAt: new Date(Date.now() - 3600000).toISOString(), adminNote: JSON.stringify({ linkedTo: 'fee', id: 'fee_2' }) },
];


export const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,binancecoin,tether,usd-coin,tron,matic-network,solana,cardano&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h';
export const EXCHANGERATE_API_URL_USD_TO_HTG = 'https://api.exchangerate.host/convert?from=USD&to=HTG';
export const EXCHANGERATE_API_URL_HTG_TO_USD = 'https://api.exchangerate.host/convert?from=HTG&to=USD';
