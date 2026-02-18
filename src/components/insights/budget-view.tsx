'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowLeft, Pencil, Plus, EyeOff, AlertTriangle } from 'lucide-react';
import { useCurrency } from '@/components/providers/currency-provider';
import { Budgets } from '@/lib/hooks/use-budgets';
import { EXPENSE_CATEGORIES, Category, DEFAULT_EXPENSE_CATEGORY } from '@/lib/constants/categories';
import { Transaction } from '@/lib/types/transaction';

interface CategoryData {
  id: Category;
  label: string;
  color: string;
  amount: number;
  percentage: number;
  count: number;
}

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

interface BudgetedCategory {
  id: string;
  label: string;
  color: string;
  budget: number;
  spent: number;
  isAutoAdded: boolean; // true = no explicit budget, auto-derived from spending
}

interface BudgetViewProps {
  categoryData: { data: CategoryData[]; total: number; totalCount: number };
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onOpenSettings: (focusCategoryId?: string, focusCategoryAmount?: number) => void;
  budgets: Budgets;
  transactions: Transaction[];
}

export function BudgetView({ categoryData, currentDate, onDateChange, onOpenSettings, budgets, transactions }: BudgetViewProps) {
  const { formatCurrency } = useCurrency();
  const [selectedCategory, setSelectedCategory] = useState<BudgetedCategory | null>(null);

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;

  const handlePreviousMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    onDateChange(d);
  };

  const handleNextMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    onDateChange(d);
  };

  // Build spending map from categoryData
  const spendingByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    categoryData.data.forEach(c => { map[c.id] = c.amount; });
    return map;
  }, [categoryData.data]);

  // Categories with explicit budgets + auto-added from spending
  const budgetedCategories = useMemo(() => {
    const result: BudgetedCategory[] = [];
    const seen = new Set<string>();

    // 1. Explicitly budgeted categories
    for (const [id, budget] of Object.entries(budgets.categories)) {
      const catInfo = EXPENSE_CATEGORIES.find(c => c.id === id);
      if (!catInfo) continue;
      const spent = spendingByCategory[id] || 0;
      const color = BRIGHT_EXPENSE_COLORS[id] || catInfo.color;
      result.push({ id, label: catInfo.label, color, budget, spent, isAutoAdded: false });
      seen.add(id);
    }

    // 2. Auto-add categories that have spending but no explicit budget
    for (const cat of categoryData.data) {
      if (seen.has(cat.id)) continue;
      result.push({
        id: cat.id,
        label: cat.label,
        color: BRIGHT_EXPENSE_COLORS[cat.id] || cat.color,
        budget: cat.amount, // use spent as budget
        spent: cat.amount,
        isAutoAdded: true,
      });
    }

    // Sort: explicit budgets first (by spent desc), then auto-added (by spent desc)
    result.sort((a, b) => {
      if (a.isAutoAdded !== b.isAutoAdded) return a.isAutoAdded ? 1 : -1;
      return b.spent - a.spent;
    });

    return result;
  }, [budgets.categories, spendingByCategory, categoryData.data]);

  const totalSpent = categoryData.total;
  const totalBudget = budgets.totalMonthly;
  const hasTotalBudget = totalBudget != null && totalBudget > 0;

  // If no explicit total budget, derive from sum of all category budgets (explicit + auto)
  const effectiveBudget = useMemo(() => {
    if (hasTotalBudget) return totalBudget!;
    return budgetedCategories.reduce((sum, cat) => sum + cat.budget, 0);
  }, [hasTotalBudget, totalBudget, budgetedCategories]);
  const hasAnyBudget = effectiveBudget > 0;

  const totalFraction = hasAnyBudget ? Math.min(totalSpent / effectiveBudget, 1) : 0;
  const isOverBudget = hasAnyBudget && totalSpent > effectiveBudget;
  const remaining = hasAnyBudget ? effectiveBudget - totalSpent : 0;

  // All categories with a budget or spending for the bar chart — same order as budget card
  const chartCategories = useMemo(() => {
    return budgetedCategories.filter(c => c.spent > 0 || !c.isAutoAdded);
  }, [budgetedCategories]);

  // Max value — round up to the nearest 5k for clean Y-axis ticks
  const TICK_INTERVAL = 5000;
  const chartMax = useMemo(() => {
    if (chartCategories.length === 0) return TICK_INTERVAL;
    const rawMax = Math.max(...chartCategories.map(c => Math.max(c.spent, c.budget)));
    return Math.ceil(rawMax / TICK_INTERVAL) * TICK_INTERVAL;
  }, [chartCategories]);

  // Y-axis ticks at every 5k
  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let v = 0; v <= chartMax; v += TICK_INTERVAL) {
      ticks.push(v);
    }
    return ticks;
  }, [chartMax]);

  const overBudgetCount = useMemo(() => {
    return budgetedCategories.filter(c => !c.isAutoAdded && c.spent > c.budget).length;
  }, [budgetedCategories]);

  // Transactions for selected category
  const selectedCategoryTransactions = useMemo(() => {
    if (!selectedCategory) return [];
    return transactions
      .filter(t => {
        if (t.amount >= 0) return false;
        const cat = t.category || DEFAULT_EXPENSE_CATEGORY;
        return cat === selectedCategory.id;
      })
      .sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime());
  }, [selectedCategory, transactions]);

  const handleCategoryClick = (cat: BudgetedCategory) => {
    setSelectedCategory(cat);
  };

  return (
    <>
      {/* Budget Summary */}
      <div className="w-80 h-80 sm:w-[420px] sm:h-[420px] lg:w-[500px] lg:h-[500px] shrink-0 flex flex-col items-center justify-center mt-5">
        {hasAnyBudget ? (
          <div className="w-full h-full flex flex-col justify-center py-2 sm:py-4 sm:pt-10 px-1 sm:px-4">
            {/* Vertical bar chart with Y-axis */}
            <div className="flex-1 flex gap-1 sm:gap-2 pt-1 sm:pt-2 min-h-0 max-h-[65%] sm:max-h-[70%]">
              {/* Y-axis labels */}
              <div className="relative shrink-0 w-6 sm:w-10 lg:w-12">
                {yTicks.map(val => (
                  <span
                    key={val}
                    className="absolute right-0 text-[7px] sm:text-[9px] lg:text-[10px] text-[var(--text-secondary)] tabular-nums -translate-y-1/2"
                    style={{ bottom: `${(val / chartMax) * 100}%` }}
                  >
                    {formatCurrency(val, { compact: true })}
                  </span>
                ))}
              </div>

              {/* Bars area */}
              <div className="flex-1 flex items-end justify-center gap-[3px] sm:gap-1.5 lg:gap-2 border-l border-b border-[var(--fill-subtle)] pl-1 sm:pl-2 pb-1 relative">
                {/* Horizontal grid lines */}
                {yTicks.filter(v => v > 0 && v < chartMax).map(val => (
                  <div
                    key={val}
                    className="absolute left-0 right-0 border-t border-[var(--fill-subtle)]"
                    style={{ bottom: `${(val / chartMax) * 100}%` }}
                  />
                ))}

                {chartCategories.map((cat, i) => {
                  const spentHeight = chartMax > 0 ? (cat.spent / chartMax) * 100 : 0;
                  const budgetHeight = chartMax > 0 ? (cat.budget / chartMax) * 100 : 0;
                  const isOver = cat.spent > cat.budget && !cat.isAutoAdded;
                  return (
                    <div
                      key={cat.id}
                      className="relative flex flex-col items-center flex-1 max-w-[40px] sm:max-w-[48px] lg:max-w-[56px] h-full group/bar"
                    >
                      {/* Bar container */}
                      <div className="relative w-full flex-1 flex items-end">
                        {/* Spent bar */}
                        <motion.div
                          className="w-full rounded-t-sm sm:rounded-t-md"
                          style={{
                            backgroundColor: cat.color,
                            opacity: isOver ? 1 : 0.8,
                          }}
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.min(spentHeight, 100)}%` }}
                          transition={{ delay: i * 0.05 + 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                        />
                        {/* Budget limit line — only for over-budget categories */}
                        {isOver && (
                          <div
                            className="absolute left-[-2px] right-[-2px] border-t-[1.5px] sm:border-t-2 border-dashed z-20"
                            style={{
                              bottom: `${budgetHeight}%`,
                              borderColor: '#ffffff',
                            }}
                          />
                        )}
                      </div>
                      {/* Category dot label */}
                      <div
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mt-1 sm:mt-1.5 shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      {/* Tooltip — positioned on top of the bar */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 px-2 py-1.5 rounded-md bg-[var(--surface-elevated)] text-[8px] sm:text-[10px] whitespace-nowrap opacity-0 pointer-events-none group-hover/bar:opacity-100 transition-opacity shadow-lg border border-[var(--border)] z-30 text-center leading-relaxed"
                        style={{ bottom: `${Math.min(spentHeight, 100) + 4}%` }}
                      >
                        <span className="text-[var(--text-primary)] font-medium">{cat.label}</span>
                        <br />
                        <span style={{ color: isOver ? '#EF4444' : cat.color }}>{formatCurrency(cat.spent)}</span>
                        <span className="text-[var(--text-faint)]"> / {formatCurrency(cat.budget)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total summary + stats row */}
            <div className="flex flex-col items-center gap-1.5 sm:gap-2 pt-4 sm:pt-4">
              <div className="text-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`spent-${monthKey}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs sm:text-sm lg:text-xl"
                  >
                    <span className="font-bold" style={{ color: 'var(--expense-color)' }}>
                      {formatCurrency(totalSpent)}
                    </span>
                    <span className="text-[var(--text-secondary)] font-bold">/ {formatCurrency(effectiveBudget)}</span>
                  </motion.div>
                </AnimatePresence>
                <span className="text-[9px] sm:text-xs text-[var(--text-secondary)] font-medium block mt-0.5">
                  {Math.round(totalFraction * 100)}% used
                </span>
              </div>
              {/* Stats row */}
              <div className="flex items-center gap-1.5 sm:gap-3">
                <div className="flex justify-center items-center text-center px-2 sm:px-3 py-1 rounded-md bg-[var(--fill-subtle)]">
                  <span
                    className="text-[9px] sm:text-xs font-bold"
                    style={{ color: isOverBudget ? '#EF4444' : 'var(--teal)' }}
                  >
                    {isOverBudget ? `-${formatCurrency(Math.abs(remaining), { compact: true })}` : formatCurrency(remaining, { compact: true })}
                  </span>
                  <span className="text-[7px] sm:text-[9px] text-[var(--text-muted)] ml-1">
                    {isOverBudget ? 'over' : 'left'}
                  </span>
                </div>
                <div className="flex justify-center items-center text-center px-2 sm:px-3 py-1 rounded-md bg-[var(--fill-subtle)]">
                  <span className="text-[9px] sm:text-xs font-bold text-[var(--text-primary)]">
                    {budgetedCategories.filter(c => !c.isAutoAdded).length}
                  </span>
                  <span className="text-[7px] sm:text-[9px] text-[var(--text-muted)] ml-1 mt-0.5">tracked</span>
                </div>
                {overBudgetCount > 0 && (
                  <div className="flex justify-center items-center text-center px-2 sm:px-3 py-1 rounded-md bg-[var(--fill-subtle)]">
                    <span className="text-[9px] sm:text-xs font-bold text-[#EF4444]">
                      {overBudgetCount}
                    </span>
                    <span className="text-[7px] sm:text-[9px] text-[var(--text-muted)] ml-1">over</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onOpenSettings()}
            className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-[var(--text-faint)] flex items-center justify-center">
              <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--text-faint)]" />
            </div>
            <span className="text-xs sm:text-sm text-[var(--text-muted)]">No budget set</span>
            <span className="text-xs sm:text-sm font-medium text-[var(--teal)]">Set Budget</span>
          </button>
        )}
      </div>

      {/* Budget Categories Card */}
      <div
        className="w-[calc(100%-2rem)] max-w-full min-h-[280px] h-[360px] sm:w-[480px] lg:w-[560px] sm:h-[400px] lg:h-[540px] rounded-xl sm:rounded-2xl bg-[var(--surface)] p-3 sm:p-6 lg:p-8 flex flex-col relative overflow-hidden"
        style={{
          border: selectedCategory
            ? `1px solid ${selectedCategory.color}20`
            : `1px solid color-mix(in srgb, var(--expense-color) 12%, transparent)`,
          boxShadow: selectedCategory
            ? `0 0 40px ${selectedCategory.color}10, inset 0 1px 0 ${selectedCategory.color}10`
            : `0 0 40px color-mix(in srgb, var(--expense-color) 6%, transparent), inset 0 1px 0 color-mix(in srgb, var(--expense-color) 6%, transparent)`,
        }}
      >
        {/* Subtle gradient overlay */}
        <div
          className="absolute top-0 right-0 w-32 h-32 opacity-10 blur-3xl pointer-events-none transition-colors duration-300"
          style={{ background: selectedCategory ? selectedCategory.color : 'var(--expense-color)' }}
        />

        <AnimatePresence mode="wait">
          {selectedCategory ? (
            /* Transaction Details View */
            <motion.div
              key="budget-transactions"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex flex-col h-full w-full min-w-0 overflow-hidden"
            >
              {/* Header with back button */}
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 min-w-0">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-[var(--fill-subtle-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shrink-0"
                  style={{
                    backgroundColor: selectedCategory.color,
                    boxShadow: `0 0 12px ${selectedCategory.color}`
                  }}
                />
                <h3 className="text-base sm:text-xl font-semibold text-[var(--text-primary)] flex-1 min-w-0 truncate">
                  {selectedCategory.label}
                </h3>
                <div className="text-right shrink-0">
                  <div
                    className="text-sm sm:text-lg font-bold"
                    style={{ color: selectedCategory.spent > selectedCategory.budget ? '#EF4444' : selectedCategory.color }}
                  >
                    {formatCurrency(selectedCategory.spent)}
                  </div>
                  <div className="text-[10px] sm:text-xs text-[var(--text-muted)]">
                    of {formatCurrency(selectedCategory.budget)}
                  </div>
                </div>
              </div>

              {/* Transaction List */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide space-y-2 sm:space-y-3">
                {selectedCategoryTransactions.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-sm text-[var(--text-muted)]">No transactions this month</p>
                  </div>
                ) : (
                  selectedCategoryTransactions.map((txn, index) => (
                    <motion.div
                      key={txn.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04, duration: 0.2 }}
                      className="rounded-lg sm:rounded-xl bg-[var(--fill-subtle)] hover:bg-[var(--fill-subtle-hover)] p-3 sm:p-4 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className="text-sm sm:text-base text-[var(--text-primary)] truncate">{txn.description}</p>
                          <p className="text-[10px] sm:text-xs text-[var(--text-muted)] mt-0.5">
                            {txn.date.toDate().toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                            {txn.isRecurring && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-[var(--fill-subtle)] text-[var(--text-primary)]/50 text-[8px] sm:text-[10px]">
                                Recurring
                              </span>
                            )}
                          </p>
                        </div>
                        <span
                          className="text-sm sm:text-base font-semibold tabular-nums shrink-0"
                          style={{ color: selectedCategory.color }}
                        >
                          -{formatCurrency(Math.abs(txn.amount))}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          ) : (
            /* Budget List View */
            <motion.div
              key="budget-list"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex flex-col h-full"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2.5 sm:mb-5">
                <div className="flex items-center gap-2 sm:gap-3">
                  <h3 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">Budgets</h3>
                  <button
                    onClick={() => onOpenSettings()}
                    className="px-1 sm:px-1 py-0.5 rounded text-[10px] sm:text-xs font-medium text-[var(--text-muted)] hover:text-[var(--teal)] hover:bg-[var(--fill-subtle-hover)] transition-colors cursor-pointer flex items-center gap-1 mt-1 -ml-1"
                  >
                    <Pencil className="w-3 h-3" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={handlePreviousMonth}
                    className="p-1 sm:p-1.5 rounded-lg hover:bg-[var(--fill-subtle-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <span className="text-[10px] sm:text-base text-[var(--text-muted)]">
                    {monthName}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-1 sm:p-1.5 rounded-lg hover:bg-[var(--fill-subtle-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              {/* Budget list */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`budgets-${monthKey}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1 sm:space-y-2"
                  >
                    {budgetedCategories.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-sm text-[var(--text-muted)] mb-2">No category budgets set</p>
                        <button
                          onClick={() => onOpenSettings()}
                          className="text-sm font-medium text-[var(--teal)] hover:opacity-80 transition-opacity cursor-pointer"
                        >
                          Add budgets
                        </button>
                      </div>
                    ) : (
                      budgetedCategories.map((cat, index) => {
                        const fraction = cat.budget > 0 ? Math.min(cat.spent / cat.budget, 1) : 0;
                        const isOver = cat.spent > cat.budget;

                        return (
                          <motion.div
                            key={cat.id}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03, duration: 0.2 }}
                            className="rounded-lg sm:rounded-xl p-2 sm:p-4 hover:bg-[var(--fill-subtle)] transition-colors cursor-pointer"
                            onClick={() => handleCategoryClick(cat)}
                          >
                            {/* Desktop: single row | Mobile: label row + amount row */}
                            <div className="flex items-center gap-2 mb-1 sm:mb-2">
                              <div
                                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0"
                                style={{ backgroundColor: cat.color }}
                              />
                              <span className="flex-1 text-[13px] sm:text-base text-[var(--text-primary)] truncate">
                                {cat.label}
                              </span>
                              {cat.isAutoAdded && (
                                <>
                                  <div className="relative group/untracked shrink-0">
                                    <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--text-faint)]" />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-md bg-[var(--surface-elevated)] text-[9px] sm:text-[10px] text-[var(--text-secondary)] whitespace-nowrap opacity-0 pointer-events-none group-hover/untracked:opacity-100 transition-opacity shadow-lg border border-[var(--border)] leading-relaxed z-10">
                                      No monthly limit set<br /><span className="text-[var(--teal)]">Click + to Set limit</span>
                                    </div>
                                  </div>
                                  <div className="relative group/setlimit shrink-0">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenSettings(cat.id, cat.spent);
                                      }}
                                      className="p-1 rounded-md text-[var(--teal)] hover:bg-[color-mix(in_srgb,var(--teal)_10%,transparent)] transition-colors cursor-pointer"
                                    >
                                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md bg-[var(--surface-elevated)] text-[9px] sm:text-[10px] text-[var(--text-secondary)] whitespace-nowrap opacity-0 pointer-events-none group-hover/setlimit:opacity-100 transition-opacity shadow-lg border border-[var(--border)] z-10">
                                      Set current spend as limit<br /><span className="text-[var(--text-muted)]">You can edit it later</span>
                                    </div>
                                  </div>
                                </>
                              )}
                              {isOver && !cat.isAutoAdded && (
                                <div className="relative group/over shrink-0">
                                  <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#EF4444]" />
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md bg-[var(--surface-elevated)] text-[9px] sm:text-[10px] text-[#EF4444] whitespace-nowrap opacity-0 pointer-events-none group-hover/over:opacity-100 transition-opacity shadow-lg border border-[var(--border)] z-10">
                                    Over by {formatCurrency(cat.spent - cat.budget)}
                                  </div>
                                </div>
                              )}
                              {/* Amount — hidden on mobile, shown on desktop */}
                              <span
                                className="hidden sm:inline text-sm tabular-nums font-medium"
                                style={{ color: isOver && !cat.isAutoAdded ? '#EF4444' : 'var(--text-secondary)' }}
                              >
                                {formatCurrency(cat.spent)}
                                <span className="text-[var(--text-faint)]"> / {formatCurrency(cat.budget)}</span>
                              </span>
                            </div>
                            {/* Amount — mobile only, on its own line */}
                            <div className="flex items-center justify-between ml-5 mb-1 sm:hidden">
                              <span
                                className="text-[11px] tabular-nums font-medium"
                                style={{ color: isOver && !cat.isAutoAdded ? '#EF4444' : 'var(--text-secondary)' }}
                              >
                                {formatCurrency(cat.spent)}
                                <span className="text-[var(--text-faint)]"> / {formatCurrency(cat.budget)}</span>
                              </span>
                            </div>
                            {/* Progress bar */}
                            <div className="h-1 sm:h-1.5 bg-[var(--fill-subtle)] rounded-full overflow-hidden ml-5 sm:ml-5">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: cat.color }}
                                initial={{ width: 0 }}
                                animate={{ width: `${fraction * 100}%` }}
                                transition={{ delay: index * 0.05 + 0.2, duration: 0.5, ease: 'easeOut' }}
                              />
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
