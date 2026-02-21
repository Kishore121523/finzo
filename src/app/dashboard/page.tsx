'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useMode } from '@/components/providers/mode-provider';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useTransactions } from '@/lib/hooks/use-transactions';
import { useTasks } from '@/lib/hooks/use-tasks';
import { MonthNavigator } from '@/components/finance/month-navigator';
import { CalendarGrid } from '@/components/finance/calendar-grid';
import { MobileAgendaView } from '@/components/finance/mobile-agenda-view';
import { TransactionForm } from '@/components/finance/transaction-form';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { InsightsView } from '@/components/insights/insights-view';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { addMonths, subMonths, format } from 'date-fns';
import { Transaction, TransactionFormData } from '@/lib/types/transaction';
import { TransactionSearch } from '@/components/search/transaction-search';

export default function DashboardPage() {
  const { mode, navigateTo } = useMode();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date | undefined>(undefined);
  const [direction, setDirection] = useState(0);
  const [isMobileBottomSheetOpen, setIsMobileBottomSheetOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Ignore if a dialog/modal is open
      if (document.querySelector('[role="dialog"]')) {
        return;
      }

      // Search: Shift + Space
      if (e.shiftKey && e.key === ' ') {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }

      // New Transaction: Shift + N
      if (e.shiftKey && (e.key === 'N' || e.key === 'n')) {
        e.preventDefault();
        handleAddTransaction();
      }

      // Navigate Months: Shift + ArrowLeft / Right
      if (e.shiftKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePreviousMonth();
      }
      if (e.shiftKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextMonth();
      }

      // Toggle Theme: Shift + D
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
      }

      // Budgets: Shift + B
      if (e.shiftKey && (e.key === 'B' || e.key === 'b')) {
        e.preventDefault();
        navigateTo('insights', 'budget');
      }

      // Calendar: Shift + C
      if (e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        navigateTo('finance');
      }

      // Payments: Shift + P
      if (e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        navigateTo('tasks');
      }

      // Insights: Shift + I
      if (e.shiftKey && (e.key === 'I' || e.key === 'i')) {
        e.preventDefault();
        navigateTo('insights');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAddTransaction, handlePreviousMonth, handleNextMonth, resolvedTheme, setTheme, navigateTo]);

  // Listen for mobile search icon event
  useEffect(() => {
    const handler = () => setSearchOpen(true);
    window.addEventListener('open-search', handler);
    return () => window.removeEventListener('open-search', handler);
  }, []);

  return (
    <div className="flex h-[calc(100vh-57px-56px)] sm:h-[calc(100vh-57px-56px)] md:h-[calc(100vh-73px)] flex-col bg-[var(--app-bg)] overflow-hidden">
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
              transactions={transactions}
            />

            <div className="flex-1 overflow-hidden bg-[var(--app-bg)] relative">
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
                    <>
                      {/* Mobile skeleton */}
                      <div className="md:hidden p-4 space-y-2">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border-main)]">
                            <div className="flex flex-col items-center gap-1 w-10">
                              <div className="skeleton h-3 w-7 rounded" />
                              <div className="skeleton h-5 w-8 rounded" />
                            </div>
                            <div className="flex-1 space-y-1.5">
                              <div className="skeleton h-3.5 w-24 rounded" />
                            </div>
                            <div className="skeleton h-4 w-16 rounded" />
                          </div>
                        ))}
                      </div>
                      {/* Desktop skeleton */}
                      <div className="hidden md:block p-4">
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <div key={i} className="text-center text-xs text-white/30 py-2">{d}</div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {[...Array(35)].map((_, i) => (
                            <div key={i} className="skeleton h-24 rounded-lg" />
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Mobile: Agenda View */}
                      <div className="md:hidden h-full">
                        <MobileAgendaView
                          currentDate={currentDate}
                          transactions={transactions}
                          onEdit={handleEditTransaction}
                          onDelete={handleDelete}
                          onDeleteAllRecurring={handleDeleteAllRecurring}
                          onAddForDate={handleAddForDate}
                          onBottomSheetChange={setIsMobileBottomSheetOpen}
                        />
                      </div>
                      {/* Desktop: Calendar Grid */}
                      <div className="hidden md:block h-full">
                        <CalendarGrid
                          currentDate={currentDate}
                          transactions={transactions}
                          onEdit={handleEditTransaction}
                          onDelete={handleDelete}
                          onDeleteAllRecurring={handleDeleteAllRecurring}
                          onAddForDate={handleAddForDate}
                        />
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <Button
              onClick={handleAddTransaction}
              size="lg"
              className={`fixed bottom-24 right-4 md:bottom-8 md:right-8 h-14 w-14 md:h-16 md:w-16 rounded-2xl shadow-2xl bg-[var(--teal)] hover:bg-[var(--teal)]/90 text-[var(--text-inverse)] z-40 transition-opacity ${isMobileBottomSheetOpen ? 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto' : ''
                }`}
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
            <InsightsView currentDate={currentDate} onDateChange={setCurrentDate} />
          </motion.div>
        )}
      </AnimatePresence>

      <TransactionSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleEditTransaction}
        currentDate={currentDate}
      />
    </div>
  );
}
