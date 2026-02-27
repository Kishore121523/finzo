'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { startOfMonth, subMonths } from 'date-fns';
import { BudgetView } from '@/components/insights/budget-view';
import { BudgetSettingsModal } from '@/components/insights/budget-settings-modal';
import { useTransactions } from '@/lib/hooks/use-transactions';
import { useBudgets } from '@/lib/hooks/use-budgets';
import {
  EXPENSE_CATEGORIES,
  Category,
  DEFAULT_EXPENSE_CATEGORY,
} from '@/lib/constants/categories';

const BRIGHT_EXPENSE_COLORS: Record<string, string> = {
  'food': '#FF6B6B', 'groceries': '#4ECDC4', 'transport': '#45B7D1', 'fuel': '#F97316',
  'utilities': '#FFD93D', 'rent': '#FFEAA7', 'emi': '#EF4444', 'insurance': '#A78BFA',
  'subscriptions': '#8B5CF6', 'phone': '#06B6D4', 'internet': '#3B82F6',
  'entertainment': '#EC4899', 'shopping': '#F472B6', 'travel': '#14B8A6', 'dining': '#FB923C',
  'health': '#EF4444', 'fitness': '#10B981', 'education': '#6366F1',
  'sip': '#A855F7', 'mutual_funds': '#06B6D4', 'stocks': '#3B82F6', 'fixed_deposit': '#14B8A6',
  'ppf': '#8B5CF6', 'nps': '#0EA5E9', 'gold': '#FBBF24', 'crypto': '#F97316', 'real_estate': '#22C55E',
  'personal': '#D946EF', 'gifts': '#F43F5E', 'charity': '#FB7185', 'family': '#E879F9',
  'taxes': '#78716C', 'fees': '#A1A1AA', 'misc': '#6B7280',
};

interface CategoryData {
  id: Category;
  label: string;
  color: string;
  amount: number;
  percentage: number;
  count: number;
}

export function BudgetOverlay() {
  const [open, setOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => startOfMonth(new Date()));
  const [budgetSettingsOpen, setBudgetSettingsOpen] = useState(false);
  const [focusCategoryId, setFocusCategoryId] = useState<string | null>(null);
  const [focusCategoryAmount, setFocusCategoryAmount] = useState<number | undefined>(undefined);

  const { budgets, saveBudgets } = useBudgets();
  const { transactions } = useTransactions(currentDate);

  const prevMonthDate = useMemo(() => subMonths(currentDate, 1), [currentDate]);
  const { transactions: prevTransactions } = useTransactions(prevMonthDate);

  const prevSpendingMap = useMemo(() => {
    const map: Record<string, number> = {};
    prevTransactions
      .filter(t => t.amount < 0)
      .forEach(t => {
        const cat = t.category || DEFAULT_EXPENSE_CATEGORY;
        map[cat] = (map[cat] || 0) + Math.abs(t.amount);
      });
    return map;
  }, [prevTransactions]);

  const categoryData = useMemo(() => {
    const filteredTransactions = transactions.filter(t => t.amount < 0);

    const categoryTotals: Record<string, { amount: number; count: number }> = {};
    filteredTransactions.forEach(t => {
      const cat = t.category || DEFAULT_EXPENSE_CATEGORY;
      const amount = Math.abs(t.amount);
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { amount: 0, count: 0 };
      }
      categoryTotals[cat].amount += amount;
      categoryTotals[cat].count += 1;
    });

    const total = Object.values(categoryTotals).reduce((sum, val) => sum + val.amount, 0);
    const totalCount = filteredTransactions.length;

    const data: CategoryData[] = EXPENSE_CATEGORIES
      .filter(cat => categoryTotals[cat.id]?.amount > 0)
      .map(cat => ({
        id: cat.id,
        label: cat.label,
        color: BRIGHT_EXPENSE_COLORS[cat.id] || cat.color,
        amount: categoryTotals[cat.id].amount,
        percentage: total > 0 ? (categoryTotals[cat.id].amount / total) * 100 : 0,
        count: categoryTotals[cat.id].count,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { data, total, totalCount };
  }, [transactions]);

  const close = useCallback(() => setOpen(false), []);

  // Listen for custom event
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-budget', handler);
    return () => window.removeEventListener('open-budget', handler);
  }, []);

  // ESC key + Shift+B hotkey
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !budgetSettingsOpen) {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === 'B' && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, budgetSettingsOpen, close]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Sync with calendar date
  useEffect(() => {
    const handler = (e: Event) => {
      const date = (e as CustomEvent).detail?.date;
      if (date) setCurrentDate(startOfMonth(new Date(date)));
    };
    window.addEventListener('calendar-date-changed', handler);
    return () => window.removeEventListener('calendar-date-changed', handler);
  }, []);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="budget-zen"
            className="fixed inset-0 z-[100] flex flex-col bg-[var(--app-bg)] overflow-hidden"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { duration: 0.4 } },
              exit: { opacity: 0, transition: { delay: 1.4, duration: 0.6 } }
            }}
          >
            {/* Ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-[0.06] blur-[100px] pointer-events-none" style={{ background: 'var(--expense-color, #CF6679)' }} />

            {/* Intro Text */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
              variants={{
                hidden: { opacity: 0, scale: 0.8, filter: 'blur(10px)' },
                visible: {
                  opacity: [0, 1, 1, 0],
                  scale: [0.8, 1, 1, 1.2],
                  filter: ['blur(10px)', 'blur(0px)', 'blur(0px)', 'blur(10px)'],
                  transition: { times: [0, 0.2, 0.8, 1], duration: 1.8, ease: "easeInOut" }
                },
                exit: {
                  opacity: [0, 1, 1, 0],
                  scale: [1.2, 1, 1, 0.8],
                  filter: ['blur(10px)', 'blur(0px)', 'blur(0px)', 'blur(10px)'],
                  transition: { times: [0, 0.2, 0.8, 1], duration: 1.6, ease: "easeInOut" }
                }
              }}
            >
              <h2 className="text-4xl sm:text-6xl font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--expense-color, #CF6679)' }}>
                Budget
              </h2>
            </motion.div>

            {/* Content (Delayed) */}
            <motion.div
              className="flex flex-col flex-1 w-full h-full"
              variants={{
                hidden: { opacity: 0, scale: 0.95, filter: 'blur(10px)' },
                visible: {
                  opacity: 1, scale: 1, filter: 'blur(0px)',
                  transition: { delay: 1.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
                },
                exit: {
                  opacity: 0, scale: 0.95, filter: 'blur(10px)',
                  transition: { duration: 0.4, ease: "easeInOut" }
                }
              }}
            >
              {/* Minimal header */}
              <div className="flex items-center gap-3 px-4 sm:px-8 pt-5 sm:pt-8 pb-2">
                <button
                  onClick={close}
                  className="p-2 rounded-xl hover:bg-[var(--fill-subtle-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] -ml-2 sm:ml-0">Budget</h1>
              </div>

              {/* Content body */}
              <div
                className="flex-1 overflow-x-hidden px-2 sm:px-6 pb-8 lg:py-4 scrollbar-hide mt-3 sm:mt-0"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                <div className="flex flex-col items-center w-full lg:h-full lg:justify-evenly lg:px-4 lg:gap-8">
                  <div className="flex flex-col w-full lg:w-auto lg:flex-row items-center gap-3 sm:gap-12 lg:gap-32">
                    <BudgetView
                      categoryData={categoryData}
                      currentDate={currentDate}
                      onDateChange={(d) => setCurrentDate(startOfMonth(d))}
                      onOpenSettings={(catId, catAmount) => {
                        setFocusCategoryId(catId ?? null);
                        setFocusCategoryAmount(catAmount);
                        setBudgetSettingsOpen(true);
                      }}
                      budgets={budgets}
                      transactions={transactions}
                      prevSpending={prevSpendingMap}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Budget Settings Modal — rendered outside overlay; dialog z-[150] sits above zen z-[100] */}
      {open && (
        <BudgetSettingsModal
          open={budgetSettingsOpen}
          onOpenChange={(v) => {
            setBudgetSettingsOpen(v);
            if (!v) {
              setFocusCategoryId(null);
              setFocusCategoryAmount(undefined);
            }
          }}
          budgets={budgets}
          onSave={saveBudgets}
          focusCategoryId={focusCategoryId}
          focusCategoryAmount={focusCategoryAmount}
        />
      )}
    </>
  );
}
