import type { ReactNode } from "react";

export interface InvestmentPackage {
  category: string;
  name: string;
  amount: number; // in HTG
  currency: 'HTG';
}

export interface CryptoData {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    price_change_percentage_24h: number;
    sparkline_in_7d: {
        price: number[];
    }
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export type Language = 'FR' | 'EN' | 'HT';

export type IntentStatus = 'en_revue' | 'preuve_recue' | 'validée' | 'terminée' | 'rejetée';
export type WithdrawalStatus = 'requested' | 'fees_required' | 'otp_pending' | 'approved' | 'paid' | 'rejected';
export type FeeStatus = 'pending' | 'proof_uploaded' | 'otp_sent' | 'verified' | 'paid' | 'rejected';


// --- Firestore Schema Types (Simplified for new flow) ---

export interface User {
  id: string;
  email: string;
  phoneE164: string;
  displayName: string;
  role: "user" | "admin";
  consentPhone: boolean;
  createdAt: Date;
  lastSeen: Date;
  language?: Language;
  password?: string; // For mock authentication
}

// --- Admin Panel Types ---

export interface SystemState {
  maintenance: boolean;
  autoStart: boolean;
  dailyRate: number;
}

export interface Investment {
  id: string;
  userId: string | null;
  userDisplayName: string;
  packageName: string;
  amount: number;
  total: number;
  progress: number; // 0.0 to 1.0
  status: 'pending' | 'active' | 'completed' | 'on_hold';
  createdAt: string;
  duration?: '4h' | '8h' | '1d' | '7d' | '1m';
}

export interface Withdrawal {
  id: string;
  investmentId: string;
  userId: string;
  amount: number;
  status: WithdrawalStatus;
  createdAt: string; // ISO Date String
  updatedAt: string; // ISO Date String
}

export interface Fee {
  id: string;
  withdrawalId: string;
  label: string;
  amount: number;
  status: FeeStatus;
  createdAt: string; // ISO Date String
  updatedAt: string; // ISO Date String
}

export interface Upload {
  id: string;
  investmentId: string;
  path: string;
  mimetype: string;
  size: number;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  adminNote?: string;
}

export interface Log {
  id: number;
  actor: string;
  action: string;
  targetType: string;
  targetId: string;
  details_json: string;
  ts: string;
}

export interface Notification {
  id: string;
  toUserId: string | 'all' | null;
  body: string;
  type?: string; // e.g. 'investment_started'
  createdAt: string;
}

export interface Testimonial {
  id: string;
  name: string;
  city: string;
  photo: string; // URL
  comment: string;
  stars: number; // 1-5
  createdAt: string; // ISO Date String
}

export interface Country {
  code: string;
  name: string;
  flag: string;
}

export interface AdminModal {
    isOpen: boolean;
    testimonial: Testimonial | null;
}

export interface ToastNotification {
  id: number;
  message: string;
  type: 'success' | 'info' | 'error';
}

export type Page = 'home' | 'admin' | 'open-international' | 'investment-journey' | 'dashboard' | 'login' | 'my-withdrawals';
