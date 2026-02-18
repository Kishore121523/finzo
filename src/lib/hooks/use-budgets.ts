'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/components/providers/auth-provider';

export interface Budgets {
  totalMonthly: number | null;
  categories: Record<string, number>;
}

const DEFAULT_BUDGETS: Budgets = {
  totalMonthly: null,
  categories: {},
};

export function useBudgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budgets>(DEFAULT_BUDGETS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBudgets(DEFAULT_BUDGETS);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchBudgets() {
      try {
        const userDoc = await getDoc(doc(db, 'users', user!.uid));
        if (!cancelled) {
          if (userDoc.exists() && userDoc.data().budgets) {
            const data = userDoc.data().budgets;
            setBudgets({
              totalMonthly: data.totalMonthly ?? null,
              categories: data.categories ?? {},
            });
          } else {
            setBudgets(DEFAULT_BUDGETS);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch budgets:', error);
        if (!cancelled) setLoading(false);
      }
    }

    fetchBudgets();
    return () => { cancelled = true; };
  }, [user]);

  const saveBudgets = useCallback(async (newBudgets: Budgets) => {
    if (!user) return;
    setBudgets(newBudgets);
    // Use updateDoc to replace the entire budgets field (not deep-merge),
    // so removed category keys are actually deleted from Firestore.
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, { budgets: newBudgets });
    } catch {
      // Doc may not exist yet (new user), fall back to setDoc
      await setDoc(userRef, { budgets: newBudgets }, { merge: true });
    }
  }, [user]);

  const setTotalBudget = useCallback(async (amount: number | null) => {
    const updated = { ...budgets, totalMonthly: amount };
    await saveBudgets(updated);
  }, [budgets, saveBudgets]);

  const setCategoryBudget = useCallback(async (catId: string, amount: number | null) => {
    const updated = { ...budgets, categories: { ...budgets.categories } };
    if (amount === null || amount <= 0) {
      delete updated.categories[catId];
    } else {
      updated.categories[catId] = amount;
    }
    await saveBudgets(updated);
  }, [budgets, saveBudgets]);

  return { budgets, loading, setTotalBudget, setCategoryBudget, saveBudgets };
}
