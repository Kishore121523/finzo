'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { firestoreHelpers } from '@/lib/firebase/firestore';
import { Transaction, TransactionFormData } from '@/lib/types/transaction';
import { useAuth } from '@/components/providers/auth-provider';

// Helper to format year-month as string (e.g., "2025-02")
function formatYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Helper to compare year-month strings
function isMonthOnOrAfter(viewingMonth: string, startMonth: string): boolean {
  return viewingMonth >= startMonth;
}

export function useTransactions(currentDate: Date) {
  const { user } = useAuth();
  const [regularTransactions, setRegularTransactions] = useState<Transaction[]>([]);
  const [recurringTemplates, setRecurringTemplates] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentYearMonth = formatYearMonth(currentDate);

  // Fetch regular (non-recurring) transactions for the current month
  useEffect(() => {
    if (!user) {
      setRegularTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      where('isRecurring', '==', false),
      where('date', '>=', Timestamp.fromDate(monthStart)),
      where('date', '<=', Timestamp.fromDate(monthEnd)),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Transaction[];
        setRegularTransactions(data);
        setLoading(false);
      },
      (error) => {
        if (error.code !== 'permission-denied') {
          console.error('Firestore listener error (regular):', error);
        }
        setRegularTransactions([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, currentYear, currentMonth]);

  // Fetch ALL recurring templates (no date filter - they apply to all future months)
  useEffect(() => {
    if (!user) {
      setRecurringTemplates([]);
      return;
    }

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      where('isRecurring', '==', true)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Transaction[];
        setRecurringTemplates(data);
      },
      (error) => {
        if (error.code !== 'permission-denied') {
          console.error('Firestore listener error (recurring):', error);
        }
        setRecurringTemplates([]);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Merge regular transactions with virtual recurring transactions
  const transactions = useMemo(() => {
    const result: Transaction[] = [...regularTransactions];
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    recurringTemplates.forEach((template) => {
      // Get the start month from the template (or derive from its date)
      const templateDate = template.date.toDate();
      const startMonth = template.recurringStartMonth || formatYearMonth(templateDate);

      // Only show if current viewing month is on or after the start month
      if (!isMonthOnOrAfter(currentYearMonth, startMonth)) {
        return;
      }

      // Check if this month is excluded (user deleted "this only")
      const excludedMonths = template.excludedMonths || [];
      if (excludedMonths.includes(currentYearMonth)) {
        return;
      }

      // Create a virtual transaction for this month
      const originalDay = templateDate.getDate();
      const dayOfMonth = Math.min(originalDay, lastDayOfMonth);
      const virtualDate = new Date(currentYear, currentMonth, dayOfMonth);
      virtualDate.setHours(templateDate.getHours(), templateDate.getMinutes(), templateDate.getSeconds());

      const virtualTransaction: Transaction = {
        ...template,
        id: `${template.id}-${currentYearMonth}`, // Unique ID for this month's instance
        date: Timestamp.fromDate(virtualDate),
        isVirtual: true,
      };

      result.push(virtualTransaction);
    });

    // Sort by date descending
    result.sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime());

    return result;
  }, [regularTransactions, recurringTemplates, currentYear, currentMonth, currentYearMonth]);

  // Calculate balance from merged transactions
  const balance = useMemo(() => {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const addTransaction = async (data: TransactionFormData) => {
    if (!user) throw new Error('User not authenticated');

    const transactionData: any = {
      userId: user.uid,
      description: data.description,
      amount: data.amount,
      date: Timestamp.fromDate(data.date),
      isRecurring: data.isRecurring || false,
    };

    // Add category if provided
    if (data.category) {
      transactionData.category = data.category;
    }

    // If recurring, store the start month
    if (data.isRecurring) {
      transactionData.recurringStartMonth = formatYearMonth(data.date);
    }

    await firestoreHelpers.addDocument('transactions', transactionData);
  };

  const updateTransaction = async (id: string, data: Partial<TransactionFormData>) => {
    if (!user) throw new Error('User not authenticated');

    // Check if this is a virtual transaction (ID contains year-month suffix)
    const isVirtualId = id.includes('-202'); // Simple check for virtual IDs like "abc123-2025-02"

    if (isVirtualId) {
      // Extract the original template ID
      const originalId = id.split('-202')[0];

      // For virtual transactions, we update the template itself
      // This affects all months - if user wants month-specific edit,
      // we'd need to create a new non-recurring transaction instead
      const updateData: any = {};
      if (data.description !== undefined) updateData.description = data.description;
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.category !== undefined) updateData.category = data.category;
      // Note: We don't update date for recurring templates as it would change the start month

      await firestoreHelpers.updateDocument('transactions', originalId, updateData);
    } else {
      // Regular transaction update
      const updateData: any = {};
      if (data.description !== undefined) updateData.description = data.description;
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.date !== undefined) updateData.date = Timestamp.fromDate(data.date);
      if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring;
      if (data.category !== undefined) updateData.category = data.category;

      await firestoreHelpers.updateDocument('transactions', id, updateData);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    // Check if this is a virtual transaction (ID format: "templateId-YYYY-MM")
    const virtualMatch = id.match(/^(.+)-(\d{4}-\d{2})$/);

    if (virtualMatch) {
      // For virtual transactions, add the month to excludedMonths (don't delete template)
      const [, originalId, monthToExclude] = virtualMatch;

      // Find the template to get current excludedMonths
      const template = recurringTemplates.find(t => t.id === originalId);
      const currentExcluded = template?.excludedMonths || [];

      // Add this month to excluded list
      const newExcluded = [...currentExcluded, monthToExclude];

      await firestoreHelpers.updateDocument('transactions', originalId, {
        excludedMonths: newExcluded,
      });
    } else {
      // Regular transaction - delete it
      await firestoreHelpers.deleteDocument('transactions', id);
    }
  };

  const deleteAllRecurring = async (description: string, amount: number) => {
    if (!user) throw new Error('User not authenticated');

    // Find recurring templates matching the description and amount
    const transactionQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      where('isRecurring', '==', true),
      where('description', '==', description),
      where('amount', '==', amount)
    );

    const transactionSnapshot = await getDocs(transactionQuery);

    if (transactionSnapshot.empty) return;

    // Collect transaction IDs to find linked tasks
    const transactionIds = transactionSnapshot.docs.map(doc => doc.id);

    const batch = writeBatch(db);

    // Delete the transactions
    transactionSnapshot.docs.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });

    // Find and delete linked tasks for each transaction
    for (const transactionId of transactionIds) {
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('userId', '==', user.uid),
        where('linkedTransactionId', '==', transactionId)
      );
      const tasksSnapshot = await getDocs(tasksQuery);
      tasksSnapshot.docs.forEach((taskDoc) => {
        batch.delete(taskDoc.ref);
      });
    }

    await batch.commit();
  };

  return {
    transactions,
    loading,
    balance,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteAllRecurring,
  };
}
