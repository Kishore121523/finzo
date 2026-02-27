'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, TrendingDown, Target, CalendarClock, BarChart3, Zap } from 'lucide-react';
import { useTransactions } from '@/lib/hooks/use-transactions';
import { useTasks } from '@/lib/hooks/use-tasks';
import { useBudgets } from '@/lib/hooks/use-budgets';
import { useSavingsGoals } from '@/lib/hooks/use-savings-goals';
import { useCurrency } from '@/components/providers/currency-provider';
import { getCategoryInfo, type Category } from '@/lib/constants/categories';
import { FinancialSummary } from './overview-widgets/financial-summary';
import { TopSpendingCategories } from './overview-widgets/top-spending-categories';
import { GoalsProgress } from './overview-widgets/goals-progress';
import { UpcomingBills } from './overview-widgets/upcoming-bills';
import { SpendingTrend } from './overview-widgets/spending-trend';

export function DashboardOverviewOverlay() {
  const [open, setOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const { transactions, loading: txLoading, balance } = useTransactions(currentDate);
  const { tasks, loading: tasksLoading, isTransactionOverdue } = useTasks();
  const { budgets, loading: budgetsLoading } = useBudgets();
  const { goals, loading: goalsLoading } = useSavingsGoals();
  const { formatCurrency } = useCurrency();

  const loading = txLoading || tasksLoading || budgetsLoading || goalsLoading;

  const close = useCallback(() => setOpen(false), []);

  // Listen for custom events
  useEffect(() => {
    const openHandler = () => setOpen(true);
    const closeHandler = () => setOpen(false);
    const dateChangeHandler = (e: Event) => {
      const date = (e as CustomEvent).detail?.date;
      if (date) {
        setCurrentDate(date);
      }
    };
    window.addEventListener('open-overview', openHandler);
    window.addEventListener('close-overview', closeHandler);
    window.addEventListener('calendar-date-changed', dateChangeHandler);
    return () => {
      window.removeEventListener('open-overview', openHandler);
      window.removeEventListener('close-overview', closeHandler);
      window.removeEventListener('calendar-date-changed', dateChangeHandler);
    };
  }, []);

  // ESC + Shift+O hotkey
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === 'O' && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, close]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Derived data
  const { totalIncome, totalExpenses, topCategories, upcomingBills, budgetUtilization, effectiveBudget, avgDailySpend, biggestDayNum, biggestDayAmt, totalTxnCount, expenseTxnCount, savingsRate, largestSingleTxn, monthlyPace, budgetRemaining } = useMemo(() => {
    let income = 0;
    let expenses = 0;
    const catMap = new Map<string, { amount: number; category: string }>();

    for (const t of transactions) {
      if (t.amount > 0) {
        income += t.amount;
      } else {
        const absAmt = Math.abs(t.amount);
        expenses += absAmt;
        if (t.category) {
          const existing = catMap.get(t.category);
          if (existing) {
            existing.amount += absAmt;
          } else {
            catMap.set(t.category, { amount: absAmt, category: t.category });
          }
        }
      }
    }

    // All categories sorted by amount
    const sortedCats = Array.from(catMap.values())
      .sort((a, b) => b.amount - a.amount)
      .map((c) => {
        const info = getCategoryInfo(c.category as Category, 'expense');
        return { id: info.id, label: info.label, color: info.color, amount: c.amount };
      });

    // Quick stats
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === currentDate.getFullYear() && today.getMonth() === currentDate.getMonth();
    const daysSoFar = isCurrentMonth ? today.getDate() : daysInMonth;
    // avgDailySpend computed below after activeDays

    // Biggest single spending day
    const dailyMap = new Map<number, number>();
    for (const t of transactions) {
      if (t.amount < 0) {
        const day = t.date.toDate().getDate();
        dailyMap.set(day, (dailyMap.get(day) || 0) + Math.abs(t.amount));
      }
    }
    let biggestDayNum = 0;
    let biggestDayAmt = 0;
    for (const [day, amt] of dailyMap) {
      if (amt > biggestDayAmt) {
        biggestDayNum = day;
        biggestDayAmt = amt;
      }
    }

    const totalTxnCount = transactions.length;
    const expenseTxnCount = transactions.filter(t => t.amount < 0).length;
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    const largestSingleTxn = transactions.reduce((max, t) => t.amount < 0 && Math.abs(t.amount) > max ? Math.abs(t.amount) : max, 0);
    const activeDays = Array.from(dailyMap.values()).filter(v => v > 0).length;
    const avgDailySpend = activeDays > 0 ? expenses / activeDays : 0;
    const monthlyPace = daysSoFar > 0 ? (expenses / daysSoFar) * daysInMonth : 0;

    // Monthly payments: all tasks for the viewed month
    const viewedMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const bills = tasks
      .filter((t) => t.linkedMonth === viewedMonth)
      .map((t) => ({
        id: t.id,
        title: t.title,
        amount: t.amount,
        dueDate: t.dueDate ? t.dueDate.toDate() : undefined,
        status: t.status,
        isPaid: t.status === 'done',
        isOverdue: t.status !== 'done' && t.dueDate ? new Date() > t.dueDate.toDate() : false,
      }))
      .sort((a, b) => {
        // Overdue first, then pending, then paid
        if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
        if (a.isPaid !== b.isPaid) return a.isPaid ? 1 : -1;
        if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
        return 0;
      });

    // Budget utilization — use totalMonthly if set, otherwise sum of category budgets
    const effectiveBudget = budgets.totalMonthly
      ?? (Object.values(budgets.categories).reduce((sum, v) => sum + v, 0) || null);

    const budgetUtil = effectiveBudget
      ? (expenses / effectiveBudget) * 100
      : null;

    const budgetRemaining = effectiveBudget
      ? Math.max(effectiveBudget - expenses, 0)
      : null;

    return {
      totalIncome: income,
      totalExpenses: expenses,
      topCategories: sortedCats,
      upcomingBills: bills,
      budgetUtilization: budgetUtil,
      effectiveBudget,
      avgDailySpend,
      biggestDayNum,
      biggestDayAmt,
      totalTxnCount,
      expenseTxnCount,
      savingsRate,
      largestSingleTxn,
      monthlyPace,
      budgetRemaining,
    };
  }, [transactions, tasks, budgets, currentDate]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overview-zen"
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
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-[0.06] blur-[100px] pointer-events-none bg-[var(--teal)]" />

          {/* Intro Text (The "Realm" transition) */}
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
            <h2 className="text-4xl sm:text-6xl font-bold tracking-[0.2em] text-[#F59E0B] uppercase">
              Overview
            </h2>
          </motion.div>

          {/* Content (Delayed) */}
          <motion.div
            className="flex flex-col flex-1 w-full h-full lg:overflow-hidden"
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
            {/* Header */}
            <div className="flex items-center gap-3 px-4 lg:px-6 pt-5 pb-2 shrink-0">
              <button
                onClick={close}
                className="p-2 rounded-xl hover:bg-[var(--fill-subtle-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] -ml-2 sm:ml-0">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h1>
            </div>

            {/* Content body */}
            <div
              className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 pb-8 lg:p-6 lg:overflow-hidden"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {loading ? (
                <OverviewSkeleton />
              ) : (
                <motion.div
                  className="mx-auto w-full max-w-7xl lg:h-full flex flex-col gap-4 sm:gap-5"
                  variants={{
                    visible: {
                      transition: { staggerChildren: 0.08, delayChildren: 0 },
                    },
                  }}
                  initial="hidden"
                  animate="visible"
                >
                  {/*
                    DESKTOP LAYOUT (h-full constrained):
                    Row 1 (fixed ht): Financial Summary
                    Row 2 (flex-1): Grid of 3 cols (Top Spending | Goals & Bills | Trend)
                  */}

                  {/* Financial Summary — Top Row */}
                  <OverviewCard className="shrink-0">
                    <FinancialSummary
                      balance={balance}
                      totalIncome={totalIncome}
                      totalExpenses={totalExpenses}
                      budgetUtilization={budgetUtilization}
                      effectiveBudget={effectiveBudget}
                      formatCurrency={formatCurrency}
                    />
                  </OverviewCard>

                  {/* Row 1: Top Spending + Spending Trend (equal height) */}
                  <div className="flex flex-col lg:flex-row lg:flex-1 gap-4 sm:gap-5 min-h-0">
                    <OverviewCard
                      className="lg:w-1/2 flex flex-col min-h-[280px] max-h-[300px] lg:max-h-none lg:min-h-0"
                      title="Top Spending"
                      icon={<TrendingDown className="h-4 w-4 text-[var(--expense-color)]" />}
                      contentClassName="flex-1 overflow-y-auto scrollbar-hide pr-2 mt-1"
                    >
                      <TopSpendingCategories
                        categories={topCategories}
                        formatCurrency={formatCurrency}
                      />
                    </OverviewCard>

                    <OverviewCard
                      className="hidden lg:flex lg:w-1/2 flex-col lg:min-h-0"
                      title="Spending Trend"
                      icon={<BarChart3 className="h-4 w-4 text-[var(--expense-color)]" />}
                      contentClassName="flex-1 min-h-0"
                    >
                      <SpendingTrend transactions={transactions} currentDate={currentDate} />
                    </OverviewCard>
                  </div>

                  {/* Row 2: Quick Stats + Goals + Bills */}
                  <div className="flex flex-col lg:flex-row shrink-0 gap-4 sm:gap-5">
                    {/* Quick Stats — wider */}
                    <OverviewCard
                      className="lg:w-[40%] flex flex-col"
                      title="Quick Stats"
                      icon={<Zap className="h-4 w-4 text-[var(--yellow-color,#f5a623)]" />}
                      contentClassName="flex-1 flex flex-col justify-between"
                    >
                      <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">Avg / Day</span>
                          <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">{formatCurrency(avgDailySpend, { compact: true })}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">Peak Day</span>
                          <span className="text-sm font-bold text-[var(--expense-color)] tabular-nums">
                            {biggestDayAmt > 0
                              ? new Date(currentDate.getFullYear(), currentDate.getMonth(), biggestDayNum).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                              : '—'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">Peak Spend</span>
                          <span className="text-sm font-bold text-[var(--expense-color)] tabular-nums">{biggestDayAmt > 0 ? formatCurrency(biggestDayAmt, { compact: true }) : '—'}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">Savings Rate</span>
                          <span className={`text-sm font-bold tabular-nums ${savingsRate >= 0 ? 'text-[var(--teal)]' : 'text-[var(--expense-color)]'}`}>
                            {savingsRate.toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">Largest Txn</span>
                          <span className="text-sm font-bold text-[var(--expense-color)] tabular-nums">{largestSingleTxn > 0 ? formatCurrency(largestSingleTxn, { compact: true }) : '—'}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">Budget Left</span>
                          <span className={`text-sm font-bold tabular-nums ${budgetRemaining !== null ? (budgetRemaining > 0 ? 'text-[var(--teal)]' : 'text-[var(--expense-color)]') : 'text-[var(--text-muted)]'}`}>
                            {budgetRemaining !== null ? formatCurrency(budgetRemaining, { compact: true }) : 'No budget'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">Transactions</span>
                          <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">{totalTxnCount}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">Avg / Txn</span>
                          <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">{expenseTxnCount > 0 ? formatCurrency(totalExpenses / expenseTxnCount, { compact: true }) : '—'}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">Monthly Pace</span>
                          <span className="text-sm font-bold text-[var(--expense-color)] tabular-nums">{formatCurrency(monthlyPace, { compact: true })}</span>
                        </div>
                      </div>

                      {/* Income vs Expense bar */}
                      <div className="pt-2 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">
                          <span>Income vs Expense</span>
                          <span className="normal-case tracking-normal">{totalIncome > 0 ? `${((totalExpenses / totalIncome) * 100).toFixed(0)}% spent` : ''}</span>
                        </div>
                        <div className="flex h-2.5 rounded-full overflow-hidden bg-[var(--fill-subtle)] gap-[2px]">
                          <div
                            className="h-full rounded-full bg-[var(--teal)] transition-all duration-700"
                            style={{ width: `${totalIncome > 0 ? Math.min(((totalIncome - totalExpenses) / totalIncome) * 100, 100) : 0}%` }}
                          />
                          <div
                            className="h-full rounded-full bg-[var(--expense-color)] transition-all duration-700"
                            style={{ width: `${totalIncome > 0 ? Math.min((totalExpenses / totalIncome) * 100, 100) : 0}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[var(--teal)]" />
                            <span className="text-[var(--text-secondary)]">Saved {formatCurrency(Math.max(totalIncome - totalExpenses, 0), { compact: true })}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[var(--expense-color)]" />
                            <span className="text-[var(--text-secondary)]">Spent {formatCurrency(totalExpenses, { compact: true })}</span>
                          </div>
                        </div>
                      </div>
                    </OverviewCard>

                    {/* Goals */}
                    <OverviewCard
                      className="lg:w-[30%] flex flex-col min-h-0"
                      title="Goals"
                      icon={<Target className="h-4 w-4 text-[var(--purple-color)]" />}
                      contentClassName="flex-1 overflow-y-auto scrollbar-hide pr-1"
                    >
                      <GoalsProgress goals={goals} formatCurrency={formatCurrency} />
                    </OverviewCard>

                    {/* Monthly Payments */}
                    <OverviewCard
                      className="lg:w-[30%] flex flex-col min-h-0 max-h-[280px]"
                      title="Monthly Payments"
                      icon={<CalendarClock className="h-4 w-4 text-[var(--teal)]" />}
                      contentClassName="flex-1 overflow-y-auto scrollbar-hide pr-1"
                    >
                      <UpcomingBills bills={upcomingBills} formatCurrency={formatCurrency} />
                    </OverviewCard>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Card wrapper
function OverviewCard({
  children,
  className = '',
  contentClassName = '',
  title,
  icon,
}: {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  title?: string;
  icon?: React.ReactNode;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, scale: 0.92, y: 16 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
      }}
      className={`rounded-xl bg-[var(--surface)] p-4 sm:p-5 border border-[var(--border-secondary)] ${className}`}
      style={{
        boxShadow: '0 0 30px color-mix(in srgb, var(--teal) 4%, transparent)',
      }}
    >
      {title && (
        <div className="flex items-center gap-2 mb-3 shrink-0">
          {icon}
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">{title}</h3>
        </div>
      )}
      <div className={contentClassName}>
        {children}
      </div>
    </motion.div>
  );
}

// Skeleton loader
function OverviewSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl h-full flex flex-col gap-4 sm:gap-5 animate-pulse">
      {/* Top row */}
      <div className="shrink-0 rounded-xl bg-[var(--surface)] p-5 border border-[var(--border-secondary)] h-[160px]" />

      {/* Bottom area */}
      <div className="flex flex-col lg:flex-row lg:flex-1 gap-4 sm:gap-5">
        <div className="lg:w-1/3 rounded-xl bg-[var(--surface)] p-5 border border-[var(--border-secondary)] h-[300px] lg:h-auto" />
        <div className="lg:w-1/3 rounded-xl bg-[var(--surface)] p-5 border border-[var(--border-secondary)] h-[300px] lg:h-auto" />
        <div className="lg:w-1/3 flex flex-col gap-4 sm:gap-5">
          <div className="flex-1 rounded-xl bg-[var(--surface)] p-5 border border-[var(--border-secondary)] h-[200px] lg:h-auto" />
          <div className="flex-1 rounded-xl bg-[var(--surface)] p-5 border border-[var(--border-secondary)] h-[200px] lg:h-auto" />
        </div>
      </div>
    </div>
  );
}
