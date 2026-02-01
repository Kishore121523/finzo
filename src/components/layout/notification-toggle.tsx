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
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2C2C2C]">
        <div className="h-4 w-4 animate-pulse rounded-full bg-white/20" />
      </div>
    );
  }

  return (
    <button
      onClick={toggleNotifications}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
        enabled
          ? 'bg-[#03DAC6]/20 text-[#03DAC6] hover:bg-[#03DAC6]/30'
          : 'bg-[#2C2C2C] text-white/40 hover:bg-[#3C3C3C] hover:text-white/60'
      }`}
      title={enabled ? 'Email reminders on' : 'Email reminders off'}
    >
      {enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
    </button>
  );
}
