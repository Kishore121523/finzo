'use client';

import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { collection, query, where, getDocs, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Helper to format year-month
function formatYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export default function CleanupPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState<{ total: number; duplicates: number; unique: number } | null>(null);

  const analyzeRecurringTransactions = async () => {
    if (!user) {
      setMessage('Please log in first');
      return;
    }

    try {
      setLoading(true);
      setMessage('Analyzing recurring transactions...');

      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid),
        where('isRecurring', '==', true)
      );

      const snapshot = await getDocs(q);

      // Group by description+amount to find duplicates
      const groups = new Map<string, any[]>();

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const key = `${data.description}|${data.amount}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push({ id: doc.id, ref: doc.ref, data });
      });

      const unique = groups.size;
      const duplicates = snapshot.size - unique;

      setStats({ total: snapshot.size, duplicates, unique });
      setMessage(`Found ${snapshot.size} recurring transactions: ${unique} unique, ${duplicates} duplicates`);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cleanupDuplicates = async () => {
    if (!user) {
      setMessage('Please log in first');
      return;
    }

    if (!confirm('This will keep only ONE copy of each recurring transaction (the oldest one) and delete all duplicates. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      setMessage('Cleaning up duplicates...');

      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid),
        where('isRecurring', '==', true)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setMessage('No recurring transactions found');
        setStats(null);
        return;
      }

      // Group by description+amount
      const groups = new Map<string, any[]>();

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const key = `${data.description}|${data.amount}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push({ id: doc.id, ref: doc.ref, data });
      });

      const batch = writeBatch(db);
      let deletedCount = 0;
      let updatedCount = 0;

      groups.forEach((docs) => {
        // Sort by date ascending (oldest first)
        docs.sort((a, b) => a.data.date.toDate().getTime() - b.data.date.toDate().getTime());

        // Keep the first (oldest) one, delete the rest
        const [keepDoc, ...duplicates] = docs;

        // Update the kept document with recurringStartMonth if missing
        if (!keepDoc.data.recurringStartMonth) {
          const startMonth = formatYearMonth(keepDoc.data.date.toDate());
          batch.update(keepDoc.ref, { recurringStartMonth: startMonth });
          updatedCount++;
        }

        // Delete all duplicates
        duplicates.forEach((doc) => {
          batch.delete(doc.ref);
          deletedCount++;
        });
      });

      if (deletedCount > 0 || updatedCount > 0) {
        await batch.commit();
      }

      setMessage(`✅ Cleanup complete! Deleted ${deletedCount} duplicates, updated ${updatedCount} templates.`);
      setStats({ total: groups.size, duplicates: 0, unique: groups.size });
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteAllRecurringTransactions = async () => {
    if (!user) {
      setMessage('Please log in first');
      return;
    }

    if (!confirm('Are you sure you want to delete ALL recurring transactions? This cannot be undone!')) {
      return;
    }

    try {
      setLoading(true);
      setMessage('Deleting all recurring transactions...');

      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', user.uid),
        where('isRecurring', '==', true)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setMessage('No recurring transactions found');
        setStats(null);
        return;
      }

      // Delete in batches of 500 (Firestore limit)
      const batchSize = 500;
      let totalDeleted = 0;

      for (let i = 0; i < snapshot.docs.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchDocs = snapshot.docs.slice(i, i + batchSize);

        batchDocs.forEach((docSnapshot) => {
          batch.delete(docSnapshot.ref);
        });

        await batch.commit();
        totalDeleted += batchDocs.length;
        setMessage(`Deleted ${totalDeleted}/${snapshot.size} transactions...`);
      }

      setMessage(`✅ Successfully deleted ${totalDeleted} recurring transactions!`);
      setStats(null);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#121212] p-4">
      <Card className="w-full max-w-md bg-[#1E1E1E] border-[#2C2C2C] p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Cleanup Recurring Transactions</h1>
        <p className="text-white/50 text-sm mb-6">
          Remove duplicate entries created by the old generation logic
        </p>

        {!user ? (
          <p className="text-white/60 mb-4">Please log in to use this tool</p>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              <Button
                onClick={analyzeRecurringTransactions}
                disabled={loading}
                className="w-full bg-[#03DAC6] hover:bg-[#03DAC6]/90 text-black"
              >
                {loading ? 'Analyzing...' : '1. Analyze Recurring Transactions'}
              </Button>

              {stats && stats.duplicates > 0 && (
                <Button
                  onClick={cleanupDuplicates}
                  disabled={loading}
                  className="w-full bg-[#BB86FC] hover:bg-[#BB86FC]/90 text-black"
                >
                  {loading ? 'Cleaning...' : `2. Remove ${stats.duplicates} Duplicates (Recommended)`}
                </Button>
              )}

              {stats && (
                <Button
                  onClick={deleteAllRecurringTransactions}
                  disabled={loading}
                  variant="outline"
                  className="w-full border-[#CF6679] text-[#CF6679] hover:bg-[#CF6679]/10"
                >
                  {loading ? 'Deleting...' : 'Delete ALL Recurring (Nuclear Option)'}
                </Button>
              )}
            </div>

            {message && (
              <div className="p-4 rounded-xl bg-[#2C2C2C] border border-[#3C3C3C]">
                <p className="text-white text-sm">{message}</p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-[#3C3C3C]">
              <a href="/dashboard" className="text-[#BB86FC] hover:underline text-sm">
                ← Back to Dashboard
              </a>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
