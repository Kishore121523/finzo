'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/components/providers/auth-provider';
import { firestoreHelpers, where, query, collection, onSnapshot, getDocs, Timestamp } from '@/lib/firebase/firestore';

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;     // ISO date "2026-12-31"
  color: string;        // hex from preset palette
  icon: string;         // lucide icon key
  createdAt: string;    // ISO date
}

export function useSavingsGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchGoals() {
      try {
        const userDoc = await getDoc(doc(db, 'users', user!.uid));
        if (!cancelled) {
          if (userDoc.exists() && userDoc.data().savingsGoals) {
            setGoals(userDoc.data().savingsGoals as SavingsGoal[]);
          } else {
            setGoals([]);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch goals:', error);
        if (!cancelled) setLoading(false);
      }
    }

    fetchGoals();
    return () => { cancelled = true; };
  }, [user]);

  const saveGoals = useCallback(async (newGoals: SavingsGoal[]) => {
    if (!user) return;
    setGoals(newGoals);
    const userRef = doc(db, 'users', user.uid);
    try {
      await updateDoc(userRef, { savingsGoals: newGoals });
    } catch {
      await setDoc(userRef, { savingsGoals: newGoals }, { merge: true });
    }
  }, [user]);

  const addGoal = useCallback(async (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'savedAmount'>) => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: crypto.randomUUID(),
      savedAmount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    await saveGoals([...goals, newGoal]);
    return newGoal;
  }, [goals, saveGoals]);

  const updateGoal = useCallback(async (id: string, updates: Partial<Omit<SavingsGoal, 'id' | 'createdAt'>>) => {
    if (!user) return;
    const updated = goals.map(g => g.id === id ? { ...g, ...updates } : g);
    await saveGoals(updated);

    // If name or color changed, batch-update denormalized fields on linked transactions
    if (updates.name || updates.color) {
      const goal = goals.find(g => g.id === id);
      if (!goal) return;
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid),
        where('goalId', '==', id)
      );
      const snapshot = await getDocs(q);
      const updateData: Record<string, string> = {};
      if (updates.name) updateData.goalName = updates.name;
      if (updates.color) updateData.goalColor = updates.color;
      if (updates.name) updateData.description = `Saved to ${updates.name}`;
      await Promise.all(
        snapshot.docs.map(d => firestoreHelpers.updateDocument('transactions', d.id, updateData))
      );
    }
  }, [goals, saveGoals, user]);

  const deleteGoal = useCallback(async (id: string) => {
    if (!user) return;
    await saveGoals(goals.filter(g => g.id !== id));

    // Delete all linked transactions
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      where('goalId', '==', id)
    );
    const snapshot = await getDocs(q);
    await Promise.all(
      snapshot.docs.map(d => firestoreHelpers.deleteDocument('transactions', d.id))
    );
  }, [goals, saveGoals, user]);

  const addFunds = useCallback(async (id: string, amount: number) => {
    if (!user) return;
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    const updated = goals.map(g =>
      g.id === id ? { ...g, savedAmount: g.savedAmount + amount } : g
    );
    await saveGoals(updated);

    // Create a balance-neutral transaction linked to this goal
    await firestoreHelpers.addDocument('transactions', {
      userId: user.uid,
      description: `Saved to ${goal.name}`,
      amount: 0,
      date: Timestamp.fromDate(new Date()),
      isRecurring: false,
      goalId: goal.id,
      goalFundAmount: amount,
      goalName: goal.name,
      goalColor: goal.color,
    });
  }, [goals, saveGoals, user]);

  const removeFunds = useCallback(async (goalId: string, transactionId: string, fundAmount: number) => {
    if (!user) return;
    // Subtract from goal's savedAmount
    const updated = goals.map(g =>
      g.id === goalId ? { ...g, savedAmount: Math.max(g.savedAmount - fundAmount, 0) } : g
    );
    await saveGoals(updated);

    // Delete the transaction
    await firestoreHelpers.deleteDocument('transactions', transactionId);
  }, [goals, saveGoals, user]);

  const editFundEntry = useCallback(async (goalId: string, transactionId: string, oldAmount: number, newAmount: number) => {
    if (!user) return;
    // Adjust goal's savedAmount by the difference
    const diff = newAmount - oldAmount;
    const updated = goals.map(g =>
      g.id === goalId ? { ...g, savedAmount: Math.max(g.savedAmount + diff, 0) } : g
    );
    await saveGoals(updated);

    // Update the transaction's goalFundAmount
    await firestoreHelpers.updateDocument('transactions', transactionId, {
      goalFundAmount: newAmount,
    });
  }, [goals, saveGoals, user]);

  return { goals, loading, addGoal, updateGoal, deleteGoal, addFunds, removeFunds, editFundEntry };
}
