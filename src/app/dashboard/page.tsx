'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useMode } from '@/components/providers/mode-provider';
import { motion, AnimatePresence } from 'framer-motion';
import { useTransactions } from '@/lib/hooks/use-transactions';
import { useTasks } from '@/lib/hooks/use-tasks';
import { MonthNavigator } from '@/components/finance/month-navigator';
import { CalendarGrid } from '@/components/finance/calendar-grid';
import { TransactionForm } from '@/components/finance/transaction-form';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { InsightsView } from '@/components/insights/insights-view';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { addMonths, subMonths, format } from 'date-fns';
import { Transaction, TransactionFormData } from '@/lib/types/transaction';

export default function DashboardPage() {
  const { mode } = useMode();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>(undefined);
  const [direction, setDirection] = useState(0);

  const { transactions, loading, balance, addTransaction, updateTransaction, deleteTransaction, deleteAllRecurring } =
    useTransactions(currentDate);
  const { syncTasksFromRecurringExpenses } = useTasks();

  // Track which transaction IDs we've synced to avoid duplicate syncs
  const syncedTransactionIdsRef = useRef<Set<string>>(new Set());

  // Sync tasks when recurring expenses change
  useEffect(() => {
    if (loading) return;

    // Get today's month
    const todayMonth = format(new Date(), 'yyyy-MM');

    // Get recurring expenses (negative amounts with isRecurring)
    const recurringExpenses = transactions.filter(
      t => t.isRecurring && t.amount < 0
    );

    // Check if there are any new recurring expenses we haven't synced yet
    const newExpenses = recurringExpenses.filter(t => {
      const baseId = t.id.includes('-202') ? t.id.split('-202')[0] : t.id;
      return !syncedTransactionIdsRef.current.has(baseId);
    });

    if (newExpenses.length > 0 || recurringExpenses.length > 0) {
      // Mark all as synced
      recurringExpenses.forEach(t => {
        const baseId = t.id.includes('-202') ? t.id.split('-202')[0] : t.id;
        syncedTransactionIdsRef.current.add(baseId);
      });

      // Sync (this will create new tasks or reset existing ones for the month)
      syncTasksFromRecurringExpenses(recurringExpenses, todayMonth);
    }
  }, [transactions, loading, syncTasksFromRecurringExpenses]);

  // Calculate income and expense totals
  const { income, expense } = useMemo(() => {
    const inc = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const exp = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { income: inc, expense: exp };
  }, [transactions]);

  const handlePreviousMonth = useCallback(() => {
    setDirection(-1);
    setCurrentDate((prev) => subMonths(prev, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setDirection(1);
    setCurrentDate((prev) => addMonths(prev, 1));
  }, []);

  const handleAddTransaction = useCallback(() => {
    setEditingTransaction(null);
    setDefaultDate(undefined);
    setIsFormOpen(true);
  }, []);

  const handleAddForDate = useCallback((date: Date) => {
    setEditingTransaction(null);
    setDefaultDate(date);
    setIsFormOpen(true);
  }, []);

  const handleEditTransaction = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction);
    setDefaultDate(undefined);
    setIsFormOpen(true);
  }, []);

  const handleSubmit = useCallback(async (data: TransactionFormData) => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, data);
    } else {
      await addTransaction(data);
    }
  }, [editingTransaction, updateTransaction, addTransaction]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteTransaction(id);
  }, [deleteTransaction]);

  const handleDeleteAllRecurring = useCallback(async (id: string) => {
    await deleteAllRecurring(id);
  }, [deleteAllRecurring]);

  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const pageTransition = {
    duration: 0.2
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0
    })
  };

  const slideTransition = {
    x: { type: 'spring' as const, stiffness: 300, damping: 30 },
    opacity: { duration: 0.2 }
  };

  // Create a unique key for AnimatePresence based on year-month
  const monthKey = useMemo(() => format(currentDate, 'yyyy-MM'), [currentDate]);

  return (
    <div className="flex h-[calc(100vh-57px)] sm:h-[calc(100vh-65px)] md:h-[calc(100vh-73px)] flex-col bg-[#121212] overflow-hidden">
      <AnimatePresence mode="wait">
        {mode === 'finance' ? (
          <motion.div
            key="finance"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
            className="flex h-full flex-col overflow-hidden"
          >
            <MonthNavigator
              currentDate={currentDate}
              onPreviousMonth={handlePreviousMonth}
              onNextMonth={handleNextMonth}
              balance={balance}
              income={income}
              expense={expense}
            />

            <div className="flex-1 overflow-hidden bg-[#121212] relative">
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={monthKey}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={slideTransition}
                  className="absolute inset-0 overflow-y-auto scrollbar-hide"
                >
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-12 w-12 animate-spin rounded-full border-b-4 border-t-4 border-[#03DAC6]"></div>
                        <p className="text-white/40 text-sm">Loading transactions...</p>
                      </div>
                    </div>
                  ) : (
                    <CalendarGrid
                      currentDate={currentDate}
                      transactions={transactions}
                      onEdit={handleEditTransaction}
                      onDelete={handleDelete}
                      onDeleteAllRecurring={handleDeleteAllRecurring}
                      onAddForDate={handleAddForDate}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <Button
              onClick={handleAddTransaction}
              size="lg"
              className="fixed bottom-6 right-4 md:bottom-8 md:right-8 h-14 w-14 md:h-16 md:w-16 rounded-2xl shadow-2xl bg-[#03DAC6] hover:bg-[#03DAC6]/90 text-black z-50"
            >
              <Plus className="h-6 w-6 md:h-7 md:w-7" />
            </Button>

            <TransactionForm
              open={isFormOpen}
              onClose={() => setIsFormOpen(false)}
              onSubmit={handleSubmit}
              transaction={editingTransaction}
              defaultDate={defaultDate}
            />
          </motion.div>
        ) : mode === 'tasks' ? (
          <motion.div
            key="tasks"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
            className="h-full shrink-0 overflow-hidden"
          >
            <KanbanBoard viewedDate={currentDate} />
          </motion.div>
        ) : (
          <motion.div
            key="insights"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
            className="h-full shrink-0 overflow-hidden"
          >
            <InsightsView currentDate={currentDate} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
