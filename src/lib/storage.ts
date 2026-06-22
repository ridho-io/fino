'use client';

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  color: string;
  cardNumber?: string;
}

export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  category: string;
  date: string;
  walletId: string;
  type: 'expense' | 'income';
  note?: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  icon: string;
  color: string;
}

export interface UserSettings {
  notifications: boolean;
  darkMode: boolean;
  biometric: boolean;
  currency: string;
  language: 'id' | 'en';
  userName: string;
  userEmail: string;
  pin?: string;
  isPinEnabled: boolean;
}

const STORAGE_KEYS = {
  WALLETS: 'fino_wallets',
  TRANSACTIONS: 'fino_transactions',
  BUDGETS: 'fino_budgets',
  SETTINGS: 'fino_settings'
};

const DEFAULT_WALLETS: Wallet[] = [
  { id: '1', name: 'Rekening Utama', balance: 75000000, color: '#1A312C', cardNumber: '4422' },
  { id: '2', name: 'Tabungan', balance: 150000000, color: '#428475', cardNumber: '1190' }
];

const DEFAULT_BUDGETS: Budget[] = [
  { id: '1', category: 'Makanan', limit: 5000000, icon: '🍔', color: 'bg-orange-100 text-orange-600' },
  { id: '2', category: 'Belanja', limit: 3000000, icon: '🛍️', color: 'bg-blue-100 text-blue-600' },
  { id: '3', category: 'Transportasi', limit: 1500000, icon: '🚗', color: 'bg-purple-100 text-purple-600' }
];

const DEFAULT_SETTINGS: UserSettings = {
  notifications: true,
  darkMode: false,
  biometric: true,
  currency: 'IDR',
  language: 'id',
  userName: 'Jane Doe',
  userEmail: 'jane.doe@example.com',
  isPinEnabled: false
};

const isBrowser = typeof window !== 'undefined';

export const storage = {
  // Wallets
  getWallets: (): Wallet[] => {
    if (!isBrowser) return DEFAULT_WALLETS;
    const data = localStorage.getItem(STORAGE_KEYS.WALLETS);
    return data ? JSON.parse(data) : DEFAULT_WALLETS;
  },
  getWallet: (id: string): Wallet | undefined => {
    return storage.getWallets().find(w => w.id === id);
  },
  saveWallets: (wallets: Wallet[]) => {
    if (!isBrowser) return;
    localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
  },
  addWallet: (wallet: Omit<Wallet, 'id'>) => {
    const wallets = storage.getWallets();
    const newWallet = { ...wallet, id: Math.random().toString(36).substr(2, 9) };
    storage.saveWallets([...wallets, newWallet]);
    return newWallet;
  },
  updateWallet: (id: string, updates: Partial<Wallet>) => {
    const wallets = storage.getWallets();
    const updated = wallets.map(w => w.id === id ? { ...w, ...updates } : w);
    storage.saveWallets(updated);
  },
  deleteWallet: (id: string) => {
    const wallets = storage.getWallets();
    const updated = wallets.filter(w => w.id !== id);
    storage.saveWallets(updated);
  },

  // Transactions
  getTransactions: (): Transaction[] => {
    if (!isBrowser) return [];
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },
  getTransaction: (id: string): Transaction | undefined => {
    return storage.getTransactions().find(t => t.id === id);
  },
  addTransaction: (tx: Omit<Transaction, 'id'>) => {
    const transactions = storage.getTransactions();
    const newTx = { ...tx, id: Math.random().toString(36).substr(2, 9) };
    const updatedTransactions = [newTx, ...transactions];
    
    if (isBrowser) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedTransactions));
    }
    
    // Update wallet balance
    const wallets = storage.getWallets();
    const updatedWallets = wallets.map(w => 
      w.id === tx.walletId ? { ...w, balance: w.balance + tx.amount } : w
    );
    storage.saveWallets(updatedWallets);
    return newTx;
  },
  updateTransaction: (id: string, updates: Partial<Transaction>) => {
    const transactions = storage.getTransactions();
    const oldTx = transactions.find(t => t.id === id);
    if (!oldTx) return;

    // 1. Revert old wallet balance
    const wallets = storage.getWallets();
    let intermediateWallets = wallets.map(w => 
      w.id === oldTx.walletId ? { ...w, balance: w.balance - oldTx.amount } : w
    );

    // 2. Update transaction
    const newTx = { ...oldTx, ...updates };
    const updatedTransactions = transactions.map(t => t.id === id ? newTx : t);
    
    if (isBrowser) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedTransactions));
    }

    // 3. Apply new wallet balance
    const finalWallets = intermediateWallets.map(w => 
      w.id === newTx.walletId ? { ...w, balance: w.balance + newTx.amount } : w
    );
    storage.saveWallets(finalWallets);
  },
  deleteTransaction: (id: string) => {
    const transactions = storage.getTransactions();
    const txToDelete = transactions.find(t => t.id === id);
    if (!txToDelete) return;

    // Revert wallet balance
    const wallets = storage.getWallets();
    const updatedWallets = wallets.map(w => 
      w.id === txToDelete.walletId ? { ...w, balance: w.balance - txToDelete.amount } : w
    );
    storage.saveWallets(updatedWallets);

    const updatedTransactions = transactions.filter(t => t.id !== id);
    if (isBrowser) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedTransactions));
    }
  },

  // Budgets
  getBudgets: (): Budget[] => {
    if (!isBrowser) return DEFAULT_BUDGETS;
    const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    return data ? JSON.parse(data) : DEFAULT_BUDGETS;
  },
  addBudget: (budget: Omit<Budget, 'id'>) => {
    const budgets = storage.getBudgets();
    const newBudget = { ...budget, id: Math.random().toString(36).substr(2, 9) };
    if (isBrowser) {
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify([...budgets, newBudget]));
    }
    return newBudget;
  },
  deleteBudget: (id: string) => {
    const budgets = storage.getBudgets().filter(b => b.id !== id);
    if (isBrowser) {
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    }
  },

  // Settings
  getSettings: (): UserSettings => {
    if (!isBrowser) return DEFAULT_SETTINGS;
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  },
  updateSettings: (updates: Partial<UserSettings>) => {
    if (!isBrowser) return;
    const current = storage.getSettings();
    const updated = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    
    // Immediate side effect for theme
    if (updated.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    return updated;
  },
  
  // App Reset
  resetAllData: () => {
    if (!isBrowser) return;
    localStorage.clear();
    window.location.href = '/';
  },

  // Health Score calculation
  getFinancialHealth: () => {
    const transactions = storage.getTransactions();
    const budgets = storage.getBudgets();
    
    if (transactions.length === 0) return 100;

    const totalSpent = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const totalLimit = budgets.reduce((acc, b) => acc + b.limit, 0);

    let score = 100;
    
    // Penalty for over budgeting
    if (totalLimit > 0 && totalSpent > totalLimit) {
      score -= Math.min(40, ((totalSpent - totalLimit) / totalLimit) * 100);
    }

    // Bonus for saving (ratio)
    if (totalIncome > 0) {
      const savingRatio = (totalIncome - totalSpent) / totalIncome;
      if (savingRatio > 0.2) score += 10;
      else if (savingRatio < 0) score -= 20;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }
};
