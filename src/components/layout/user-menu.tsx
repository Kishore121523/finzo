'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Bell, BellOff, Info } from 'lucide-react';
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
        <div className="w-8 h-8 rounded-full bg-[#03DAC6]/20 flex items-center justify-center border border-[#03DAC6]/30">
          <span className="text-sm font-semibold text-[#03DAC6]">{initials}</span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-48 bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {/* User name */}
            <div className="px-4 py-3 border-b border-[#2C2C2C]">
              <p className="text-sm font-medium text-white truncate">{user.displayName || 'User'}</p>
            </div>

            {/* Email reminders toggle */}
            {!notifLoading && (
              <button
                onClick={toggleNotifications}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2C2C2C] transition-colors cursor-pointer text-white/70"
              >
                {notificationsEnabled ? <Bell className="w-4 h-4 text-[#03DAC6]" /> : <BellOff className="w-4 h-4" />}
                <span className="text-sm">{notificationsEnabled ? 'Email reminders on' : 'Email reminders off'}</span>
              </button>
            )}

            {/* App guide */}
            {onOpenGuide && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenGuide();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2C2C2C] transition-colors cursor-pointer text-white/70"
              >
                <Info className="w-4 h-4 text-[#03DAC6]" />
                <span className="text-sm">App guide</span>
              </button>
            )}

            {/* Logout */}
            <div className="border-t border-[#2C2C2C]">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2C2C2C] transition-colors cursor-pointer text-red-400"
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
