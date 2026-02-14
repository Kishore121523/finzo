'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { useCurrency, CURRENCIES, Currency } from '@/components/providers/currency-provider';

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border-secondary)] text-[var(--text-primary)] text-sm hover:bg-[var(--border-secondary)] transition-colors cursor-pointer"
      >
        <span className="font-medium text-[var(--teal)]">{currency.symbol}</span>
        <span className="hidden sm:inline text-[var(--text-secondary)]">{currency.code}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-secondary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-48 bg-[var(--surface)] border border-[var(--border-main)] rounded-xl shadow-xl overflow-hidden z-50"
          >
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                onClick={() => handleSelect(c)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-[var(--surface-hover)] transition-colors ${
                  currency.code === c.code ? 'bg-[var(--surface-hover)]' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center text-[var(--teal)]">{c.symbol}</span>
                  <div>
                    <p className="text-sm text-[var(--text-primary)] font-medium">{c.code}</p>
                    <p className="text-xs text-[var(--text-muted)]">{c.name}</p>
                  </div>
                </div>
                {currency.code === c.code && (
                  <Check className="w-4 h-4 text-[var(--teal)]" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
