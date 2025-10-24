import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import type { Language, User, SystemState, Investment, Testimonial, ToastNotification, Notification, Page, Withdrawal, Fee, Upload } from '../types';
import { translations } from '../services/i18n';
import { MOCK_INVESTMENTS, MOCK_TESTIMONIALS, MOCK_USERS, MOCK_WITHDRAWALS, MOCK_FEES, MOCK_UPLOADS } from '../constants';
import { getNotificationBody } from '../services/translationService';

type PageParams = { intentId?: string; packageName?: string; userId?: string };
type Theme = 'light' | 'dark';

const MOCK_NOTIFICATIONS: (Omit<Notification, 'body'> & { body?: string })[] = [
    { id: "notif_1", toUserId: "user_1", type: "investment_started", createdAt: new Date().toISOString() },
    { id: "notif_2", toUserId: "user_2", type: "investment_completed", createdAt: new Date().toISOString() },
    { id: "notif_3", toUserId: "all", body: "Maintenance prévue ce soir à minuit.", createdAt: new Date().toISOString() },
];


interface ExchangeRates {
  htgToUsd: number;
  htgToEur: number;
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  page: Page;
  params: PageParams;
  navigate: (page: Page, params?: PageParams) => void;
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  exchangeRates: ExchangeRates;
  convertHTGtoUSDString: (amountHTG: number) => string;
  convertHTGtoEURString: (amountHTG: number) => string;
  theme: Theme;
  toggleTheme: () => void;
  // Auth
  loginUser: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAdmin: (password: string) => Promise<boolean>;
  logout: () => void;
  // Admin state
  token: string | null;
  isAdmin: boolean;
  systemState: SystemState | null;
  setSystemState: React.Dispatch<React.SetStateAction<SystemState | null>>;
  wsEvents: any[];
  // Shared Data
  users: User[];
  investments: Investment[];
  setInvestments: React.Dispatch<React.SetStateAction<Investment[]>>;
  updateInvestmentStatus: (id: string, status: Investment['status'], progress?: number) => void;
  testimonials: Testimonial[];
  addTestimonial: (testimonial: Omit<Testimonial, 'id' | 'createdAt'>) => void;
  updateTestimonial: (testimonial: Testimonial) => void;
  deleteTestimonial: (id: string) => void;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  addSystemNotification: (toUserId: string, type: string) => void;
  addManualNotification: (body: string, toUserId?: string | 'all') => void;
  uploads: Upload[];
  updateUploadStatus: (uploadId: string, status: 'approved' | 'rejected', adminNote?: string) => void;
  // Toast Notifications
  toasts: ToastNotification[];
  showToast: (message: string, type?: ToastNotification['type']) => void;
  // OTP Management
  generateOtpForInvestment: (investmentId: string) => string;
  verifyOtpForInvestment: (investmentId: string, otp: string) => boolean;
  verifyFeeOtp: (feeId: string, otp: string) => boolean;
  // Withdrawal Management
  withdrawals: Withdrawal[];
  fees: Fee[];
  requestWithdrawal: (investmentId: string) => Promise<{ success: boolean; withdrawalId?: string }>;
  updateWithdrawalStatus: (withdrawalId: string, status: Withdrawal['status']) => void;
  addFeeToWithdrawal: (withdrawalId: string, label: string, amount: number) => void;
  uploadProof: (linkedToId: string, linkedToType: 'fee' | 'withdrawal', fileInfo: { name: string; type: string; size: number }) => Promise<{ success: boolean; uploadId?: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getInitialLanguage = (): Language => {
    const savedLang = localStorage.getItem('apex-lang') as Language;
    if (savedLang && ['FR', 'EN', 'HT'].includes(savedLang)) {
        return savedLang;
    }
    const browserLang = (navigator.language || 'fr').substring(0, 2).toUpperCase();
    if (['EN', 'HT'].includes(browserLang)) {
        return browserLang as Language;
    }
    return 'FR';
};

export const AppProvider = ({ children }: { children?: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);
  const [page, setPage] = useState<Page>('home');
  const [params, setParams] = useState<PageParams>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [exchangeRates] = useState<ExchangeRates>({ 
    htgToUsd: 1 / 132.5,
    htgToEur: 1 / 145,
  });
  const [theme, setTheme] = useState<Theme>('light');
  
  // Admin state
  const [token, setToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [wsEvents, setWsEvents] = useState<any[]>([]);

  // Shared Data
  const [investments, setInvestments] = useState<Investment[]>(MOCK_INVESTMENTS);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(MOCK_TESTIMONIALS);
  const [uploads, setUploads] = useState<Upload[]>(MOCK_UPLOADS);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(MOCK_WITHDRAWALS);
  const [fees, setFees] = useState<Fee[]>(MOCK_FEES);
  
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    MOCK_NOTIFICATIONS.map(n => {
        let body = n.body || '';
        if (n.type && n.toUserId && n.toUserId !== 'all') {
            const user = MOCK_USERS.find(u => u.id === n.toUserId);
            const lang = user?.language || 'FR';
            body = getNotificationBody(n.type, lang);
        }
        return { ...n, body };
    }) as Notification[]
  );

  // Toasts
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  
  // OTPs
  const [generatedOtps, setGeneratedOtps] = useState<Record<string, string>>({});
  const [feeOtps, setFeeOtps] = useState<Record<string, string>>({ fee_3: '555111' }); // Mock OTP for testing


  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('apex-lang', lang);
  }

  // Effect to rehydrate sessions from localStorage on initial load
  useEffect(() => {
    // User session
    const savedUserJson = localStorage.getItem('apex-user-session');
    if (savedUserJson) {
      try {
        setCurrentUser(JSON.parse(savedUserJson));
      } catch (error) {
        console.error("Failed to parse user session", error);
        localStorage.removeItem('apex-user-session');
      }
    }
    // Admin session (with 24h expiry)
    const savedAdminJson = localStorage.getItem('apex-admin-session');
    if (savedAdminJson) {
        try {
            const { token, timestamp } = JSON.parse(savedAdminJson);
            const sessionAgeHours = (Date.now() - timestamp) / (1000 * 60 * 60);
            if (sessionAgeHours < 24) {
                setToken(token);
                setIsAdmin(true);
            } else {
                localStorage.removeItem('apex-admin-session');
            }
        } catch (error) {
            console.error("Failed to parse admin session", error);
            localStorage.removeItem('apex-admin-session');
        }
    }
  }, []);

  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let result: any = translations[language];
    for(const k of keys) {
        result = result?.[k];
        if (result === undefined) return key;
    }
    return result || key;
  }, [language]);

  const loginAdmin = async (password: string): Promise<boolean> => {
    console.log(`Attempting admin login...`);
    if (password === 'Innovaia1306@') {
      const mockToken = 'mock-jwt-token-for-apex-trade-capital';
      setToken(mockToken);
      setIsAdmin(true);
      localStorage.setItem('apex-admin-session', JSON.stringify({ token: mockToken, timestamp: Date.now() }));
      return true;
    }
    return false;
  };

  const loginUser = async (phoneE164: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const userToLogin = MOCK_USERS.find(u => u.phoneE164 === phoneE164 && u.password === password);
    if (userToLogin) {
      const { password: _, ...userToStore } = userToLogin;
      setCurrentUser(userToStore);
      localStorage.setItem('apex-user-session', JSON.stringify(userToStore));
      return { success: true };
    }
    return { success: false, error: t('incorrect_password') };
  };

  const logout = () => {
    setToken(null);
    setIsAdmin(false);
    localStorage.removeItem('apex-admin-session');
    setCurrentUser(null);
    localStorage.removeItem('apex-user-session');
    navigate('home');
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);
  
  useEffect(() => {
    if (isAdmin && token) {
      setSystemState({ maintenance: false, autoStart: true, dailyRate: 0.01 });
    }
  }, [isAdmin, token]);


  const toggleTheme = () => {
    setTheme(prevTheme => {
        const newTheme = prevTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        return newTheme;
    });
  };

  const convertHTGtoUSDString = (amountHTG: number): string => {
    const val = amountHTG * exchangeRates.htgToUsd;
    return `≈ ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
  };
  
  const convertHTGtoEURString = (amountHTG: number): string => {
    const val = amountHTG * exchangeRates.htgToEur;
    return `≈ ${val.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`;
  };

  const navigate = (newPage: Page, newParams: PageParams = {}) => {
    setPage(newPage);
    setParams(newParams);
    window.scrollTo(0, 0);
  };

  const updateInvestmentStatus = (id: string, status: Investment['status'], progress?: number) => {
    setInvestments(prev => prev.map(inv => 
      inv.id === id ? { ...inv, status, progress: progress !== undefined ? progress : inv.progress } : inv
    ));
  };

  const addTestimonial = (testimonial: Omit<Testimonial, 'id' | 'createdAt'>) => {
    const newTestimonial: Testimonial = {
      ...testimonial,
      id: `test_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTestimonials(prev => [newTestimonial, ...prev]);
  };

  const updateTestimonial = (updatedTestimonial: Testimonial) => {
    setTestimonials(prev => prev.map(t => t.id === updatedTestimonial.id ? updatedTestimonial : t));
  };

  const deleteTestimonial = (id: string) => {
    setTestimonials(prev => prev.filter(t => t.id !== id));
  };
  
  const showToast = (message: string, type: ToastNotification['type'] = 'info') => {
    const newToast: ToastNotification = { id: Date.now(), message, type };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 5000);
  };
  
  const addSystemNotification = (toUserId: string, type: string) => {
    const user = MOCK_USERS.find(u => u.id === toUserId);
    const lang = user?.language || 'FR';
    const body = getNotificationBody(type, lang);
    const newNotif: Notification = {
        id: `notif_${Date.now()}`,
        createdAt: new Date().toISOString(),
        toUserId,
        type,
        body
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const addManualNotification = (body: string, toUserId: string | 'all' = 'all') => {
      const newNotif: Notification = {
          id: `notif_${Date.now()}`,
          createdAt: new Date().toISOString(),
          toUserId,
          body
      };
      setNotifications(prev => [newNotif, ...prev]);
  };

  const updateUploadStatus = (uploadId: string, status: 'approved' | 'rejected', adminNote = '') => {
    setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status, adminNote: u.adminNote ? `${u.adminNote} | ${adminNote}` : adminNote } : u));
    showToast(`Upload ${uploadId} ${status}.`, 'info');

    // If an upload linked to a fee is approved, trigger the OTP step.
    const approvedUpload = uploads.find(u => u.id === uploadId);
    if (status === 'approved' && approvedUpload?.adminNote) {
        try {
            const noteData = JSON.parse(approvedUpload.adminNote);
            if (noteData.linkedTo === 'fee' && noteData.id) {
                const feeId = noteData.id;
                setFees(prevFees => prevFees.map(f => f.id === feeId ? { ...f, status: 'otp_sent' } : f));
                const fee = fees.find(f => f.id === feeId);
                if (fee) {
                    updateWithdrawalStatus(fee.withdrawalId, 'otp_pending');
                    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
                    setFeeOtps(prev => ({...prev, [feeId]: mockOtp }));
                    showToast(`OTP ${mockOtp} generated for fee ${feeId}.`, 'info');
                    addSystemNotification(fee.id, 'otp_sent');
                }
            }
        } catch (e) { console.error("Could not parse adminNote to trigger fee update", e); }
    }
};

  // --- OTP Management ---
  const generateOtpForInvestment = (investmentId: string): string => {
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtps(prev => ({ ...prev, [investmentId]: mockOtp }));
      return mockOtp;
  };

  const verifyOtpForInvestment = (investmentId: string, otp: string): boolean => {
      return generatedOtps[investmentId] === otp;
  };
  
  const verifyFeeOtp = (feeId: string, otp: string): boolean => {
      if (feeOtps[feeId] === otp) {
          let parentWithdrawalId = '';
          setFees(prev => prev.map(f => {
              if (f.id === feeId) {
                  parentWithdrawalId = f.withdrawalId;
                  return { ...f, status: 'verified' };
              }
              return f;
          }));

          // Check if all fees for the withdrawal are now verified
          setTimeout(() => { // Use timeout to ensure state update has propagated
            const allFeesForWithdrawal = fees.filter(f => f.withdrawalId === parentWithdrawalId);
            const allVerified = allFeesForWithdrawal.every(f => f.status === 'verified' || f.id === feeId);
            if (allVerified) {
                updateWithdrawalStatus(parentWithdrawalId, 'approved');
            }
          }, 100);

          return true;
      }
      return false;
  };

  // --- Withdrawal Management ---
  const requestWithdrawal = async (investmentId: string): Promise<{ success: boolean; withdrawalId?: string }> => {
      const inv = investments.find(i => i.id === investmentId);
      if (!inv || !inv.userId) return { success: false };
      if (inv.status !== 'completed') return { success: false };
      
      const existingWithdrawal = withdrawals.find(w => w.investmentId === investmentId);
      if (existingWithdrawal) {
          showToast('Une demande de retrait existe déjà.', 'info');
          return { success: true, withdrawalId: existingWithdrawal.id };
      }

      const withdrawalId = `wdr_${Date.now()}`;
      const newWithdrawal: Withdrawal = {
          id: withdrawalId,
          investmentId: investmentId,
          userId: inv.userId,
          amount: inv.total,
          status: 'requested',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
      };
      setWithdrawals(prev => [...prev, newWithdrawal]);
      addManualNotification(`Nouvelle demande de retrait pour l'investissement ${investmentId}.`);
      addSystemNotification(inv.userId, 'withdrawal_requested');
      showToast("Demande de retrait envoyée.", 'success');
      return { success: true, withdrawalId };
  };

  const updateWithdrawalStatus = (withdrawalId: string, status: Withdrawal['status']) => {
      setWithdrawals(prev => prev.map(w => 
        w.id === withdrawalId ? { ...w, status, updatedAt: new Date().toISOString() } : w
      ));
  };

  const addFeeToWithdrawal = (withdrawalId: string, label: string, amount: number) => {
      const newFee: Fee = {
          id: `fee_${Date.now()}`,
          withdrawalId,
          label,
          amount,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
      };
      setFees(prev => [...prev, newFee]);
      updateWithdrawalStatus(withdrawalId, 'fees_required');
      const withdrawal = withdrawals.find(w => w.id === withdrawalId);
      if(withdrawal) {
          addSystemNotification(withdrawal.userId, 'fees_required');
      }
  };

  const uploadProof = async (linkedToId: string, linkedToType: 'fee' | 'withdrawal', fileInfo: { name: string; type: string; size: number }): Promise<{ success: boolean; uploadId?: string }> => {
      const newUploadId = `up_${Date.now()}`;
      const newUpload: Upload = {
          id: newUploadId,
          investmentId: '', 
          path: `/uploads/${fileInfo.name}`,
          mimetype: fileInfo.type,
          size: fileInfo.size,
          status: 'pending',
          uploadedAt: new Date().toISOString(),
          adminNote: JSON.stringify({ linkedTo: linkedToType, id: linkedToId }),
      };
      setUploads(prev => [...prev, newUpload]);
      
      if (linkedToType === 'fee') {
          setFees(prev => prev.map(f => f.id === linkedToId ? { ...f, status: 'proof_uploaded' } : f));
      }
      showToast('Preuve envoyée pour vérification.', 'success');
      return { success: true, uploadId: newUploadId };
  };

  const contextValue: AppContextType = {
    language, setLanguage, t,
    page, params, navigate,
    currentUser, setCurrentUser,
    exchangeRates, convertHTGtoUSDString, convertHTGtoEURString,
    theme, toggleTheme,
    loginAdmin, loginUser, logout,
    token, isAdmin,
    systemState, setSystemState,
    wsEvents,
    users: MOCK_USERS,
    investments, setInvestments, updateInvestmentStatus,
    testimonials, addTestimonial, updateTestimonial, deleteTestimonial,
    notifications, setNotifications, addSystemNotification, addManualNotification,
    uploads, updateUploadStatus,
    toasts, showToast,
    generateOtpForInvestment, verifyOtpForInvestment, verifyFeeOtp,
    withdrawals, fees, requestWithdrawal, updateWithdrawalStatus, addFeeToWithdrawal, uploadProof,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};