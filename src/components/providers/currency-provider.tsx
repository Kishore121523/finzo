'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP' },
];

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number, options?: { compact?: boolean; showSign?: boolean }) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(CURRENCIES[0]); // Default to INR

  // Load saved currency from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('finzo-currency');
    if (saved) {
      const found = CURRENCIES.find(c => c.code === saved);
      if (found) {
        setCurrencyState(found);
      }
    }
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('finzo-currency', newCurrency.code);
  };

  const formatCurrency = (amount: number, options?: { compact?: boolean; showSign?: boolean }) => {
    const { compact = false, showSign = false } = options || {};
    
    const absAmount = Math.abs(amount);
    
    let formatted: string;
    
    if (compact && absAmount >= 1000) {
      formatted = new Intl.NumberFormat(currency.locale, {
        style: 'currency',
        currency: currency.code,
        notation: 'compact',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(absAmount);
    } else {
      formatted = new Intl.NumberFormat(currency.locale, {
        style: 'currency',
        currency: currency.code,
        maximumFractionDigits: currency.code === 'JPY' ? 0 : 0,
      }).format(absAmount);
    }

    if (showSign) {
      return amount >= 0 ? `+${formatted}` : `-${formatted}`;
    }
    
    return formatted;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
