'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/components/providers/auth-provider';

export function NotificationToggle() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchPreference = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setEnabled(userDoc.data().emailNotifications !== false);
        }
      } catch (error) {
        console.error('Error fetching notification preference:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreference();
  }, [user]);

  const toggleNotifications = async () => {
    if (!user) return;

    const newValue = !enabled;
    setEnabled(newValue);

    try {
      await setDoc(doc(db, 'users', user.uid), {
        emailNotifications: newValue,
      }, { merge: true });
    } catch (error) {
      console.error('Error updating notification preference:', error);
      setEnabled(!newValue); // Revert on error
    }
  };

  if (loading) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-hover)]">
        <div className="h-4 w-4 animate-pulse rounded-full bg-[var(--text-faint)]" />
      </div>
    );
  }

  return (
    <div className="relative group">
      <button
        onClick={toggleNotifications}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors cursor-pointer ${
          enabled
            ? 'bg-[var(--teal-bg)] text-[var(--teal)] hover:bg-[var(--teal-border)]'
            : 'bg-[var(--surface-hover)] text-[var(--text-muted)] hover:bg-[var(--border-secondary)] hover:text-[var(--text-secondary)]'
        }`}
      >
        {enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
      </button>
      <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-[var(--text-primary)] bg-[var(--surface-hover)] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {enabled ? 'Email reminders on' : 'Email reminders off'}
      </span>
    </div>
  );
}
