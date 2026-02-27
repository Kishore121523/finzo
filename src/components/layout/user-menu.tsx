'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Bell, BellOff, Info, Sun, Moon, ChevronRight, Check, PieChart, Target } from 'lucide-react';
import { useTheme } from 'next-themes';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useCurrency, CURRENCIES, Currency } from '@/components/providers/currency-provider';

interface UserMenuProps {
  user: User;
  onLogout: () => void;
  onOpenGuide?: () => void;
  showCurrency?: boolean;
  onNavigateToBudgets?: () => void;
  onNavigateToGoals?: () => void;
}

export function UserMenu({ user, onLogout, onOpenGuide, showCurrency, onNavigateToBudgets, onNavigateToGoals }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notifLoading, setNotifLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setCurrencyOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset currency sub-menu when main menu closes
  useEffect(() => {
    if (!isOpen) setCurrencyOpen(false);
  }, [isOpen]);

  // Fetch notification preference
  useEffect(() => {
    const fetchPreference = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setNotificationsEnabled(userDoc.data().emailNotifications !== false);
        }
      } catch (error) {
        console.error('Error fetching notification preference:', error);
      } finally {
        setNotifLoading(false);
      }
    };

    fetchPreference();
  }, [user.uid]);

  const toggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);

    try {
      await setDoc(doc(db, 'users', user.uid), {
        emailNotifications: newValue,
      }, { merge: true });
    } catch (error) {
      console.error('Error updating notification preference:', error);
      setNotificationsEnabled(!newValue);
    }
  };

  const handleSelectCurrency = (c: Currency) => {
    setCurrency(c);
    setCurrencyOpen(false);
  };

  const initials = user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full bg-[var(--teal-bg)] flex items-center justify-center border border-[var(--teal-border)]">
          <span className="text-sm font-semibold text-[var(--teal)]">{initials}</span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-48 bg-[var(--surface)] border border-[var(--border-main)] rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {/* User name */}
            <div className="px-4 py-3 border-b border-[var(--border-main)]">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user.displayName || 'User'}</p>
            </div>

            {/* Currency selector (inline sub-menu) */}
            {showCurrency && (
              <div className="relative">
                <button
                  onClick={() => setCurrencyOpen(!currencyOpen)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer text-[var(--text-secondary)]"
                >
                  <span className="w-4 h-4 flex items-center justify-center text-sm font-medium text-[var(--teal)]">{currency.symbol}</span>
                  <span className="text-sm flex-1 text-left">{currency.code}</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${currencyOpen ? 'rotate-90' : ''}`} />
                </button>

                <AnimatePresence>
                  {currencyOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden bg-[var(--surface-hover)]"
                    >
                      {CURRENCIES.map((c) => (
                        <button
                          key={c.code}
                          onClick={() => handleSelectCurrency(c)}
                          className="w-full flex items-center justify-between px-6 py-2 hover:bg-[var(--fill-subtle)] transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm font-medium text-[var(--teal)]">{c.symbol}</span>
                            <span className="text-xs text-[var(--text-secondary)]">{c.code}</span>
                          </div>
                          {currency.code === c.code && (
                            <Check className="w-3.5 h-3.5 text-[var(--teal)]" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Email reminders toggle */}
            {!notifLoading && (
              <button
                onClick={toggleNotifications}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer text-[var(--text-secondary)]"
              >
                {notificationsEnabled ? <Bell className="w-4 h-4 text-[var(--teal)]" /> : <BellOff className="w-4 h-4" />}
                <span className="text-sm">{notificationsEnabled ? 'Email reminders on' : 'Email reminders off'}</span>
              </button>
            )}

            {/* Budgets (mobile only) */}
            {onNavigateToBudgets && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToBudgets();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer text-[var(--text-secondary)]"
              >
                <PieChart className="w-4 h-4 text-[var(--expense-color)]" />
                <span className="text-sm">Budgets</span>
              </button>
            )}

            {/* Goals (mobile only) */}
            {onNavigateToGoals && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToGoals();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer text-[var(--text-secondary)]"
              >
                <Target className="w-4 h-4 text-[var(--purple-color)]" />
                <span className="text-sm">Goals</span>
              </button>
            )}

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer text-[var(--text-secondary)]"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[var(--teal)]" /> : <Moon className="w-4 h-4 text-[var(--teal)]" />}
              <span className="text-sm">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>

            {/* App guide */}
            {onOpenGuide && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenGuide();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer text-[var(--text-secondary)]"
              >
                <Info className="w-4 h-4 text-[var(--teal)]" />
                <span className="text-sm">App guide</span>
              </button>
            )}

            {/* Logout */}
            <div className="border-t border-[var(--border-main)]">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer text-red-400"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
