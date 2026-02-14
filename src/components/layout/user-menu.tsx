'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Bell, BellOff, Info, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface UserMenuProps {
  user: User;
  onLogout: () => void;
  onOpenGuide?: () => void;
}

export function UserMenu({ user, onLogout, onOpenGuide }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notifLoading, setNotifLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
