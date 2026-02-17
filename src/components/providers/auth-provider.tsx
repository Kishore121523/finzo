'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';

const RECENT_MAX = 6;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  hasSeenOnboarding: boolean;
  recentExpenseCategories: string[];
  recentIncomeCategories: string[];
  markOnboardingSeen: () => Promise<void>;
  trackRecentCategory: (categoryId: string, type: 'expense' | 'income') => void;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true);
  const [recentExpenseCategories, setRecentExpenseCategories] = useState<string[]>([]);
  const [recentIncomeCategories, setRecentIncomeCategories] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setHasSeenOnboarding(data.hasSeenOnboarding ?? true);
          setRecentExpenseCategories(data.recentExpenseCategories ?? []);
          setRecentIncomeCategories(data.recentIncomeCategories ?? []);
        }
      } else {
        setHasSeenOnboarding(true);
        setRecentExpenseCategories([]);
        setRecentIncomeCategories([]);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const markOnboardingSeen = async () => {
    if (!user) return;
    setHasSeenOnboarding(true);
    await setDoc(doc(db, 'users', user.uid), { hasSeenOnboarding: true }, { merge: true });
  };

  const trackRecentCategory = (categoryId: string, type: 'expense' | 'income') => {
    if (!user) return;
    const isExpense = type === 'expense';
    const current = isExpense ? recentExpenseCategories : recentIncomeCategories;
    const updated = [categoryId, ...current.filter(id => id !== categoryId)].slice(0, RECENT_MAX);

    if (isExpense) {
      setRecentExpenseCategories(updated);
      setDoc(doc(db, 'users', user.uid), { recentExpenseCategories: updated }, { merge: true });
    } else {
      setRecentIncomeCategories(updated);
      setDoc(doc(db, 'users', user.uid), { recentIncomeCategories: updated }, { merge: true });
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Save user data to Firestore for email notifications
      if (result.user) {
        const userRef = doc(db, 'users', result.user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          // First time user - create profile with notifications enabled
          await setDoc(userRef, {
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            emailNotifications: true,
            hasSeenOnboarding: false,
            createdAt: new Date(),
          });
          // Immediately update state so onboarding shows on first login
          // (onAuthStateChanged may have already fired before this doc was written)
          setHasSeenOnboarding(false);
        } else {
          // Existing user - update email in case it changed
          await setDoc(userRef, {
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
          }, { merge: true });
        }
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, hasSeenOnboarding, recentExpenseCategories, recentIncomeCategories, markOnboardingSeen, trackRecentCategory, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
