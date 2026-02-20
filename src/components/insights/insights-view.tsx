'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '@/components/providers/currency-provider';
import { useTransactions } from '@/lib/hooks/use-transactions';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  Category,
  DEFAULT_EXPENSE_CATEGORY,
  DEFAULT_INCOME_CATEGORY,
} from '@/lib/constants/categories';
import { TrendingDown, TrendingUp, ChevronLeft, ChevronRight, ArrowLeft, Check, LucideReceiptText } from 'lucide-react';

import { addMonths, subMonths, startOfMonth } from 'date-fns';
import { DailySpendingChart } from './daily-spending-chart';
import { BudgetView } from './budget-view';
import { BudgetSettingsModal } from './budget-settings-modal';
import { useMode } from '@/components/providers/mode-provider';
import { useBudgets } from '@/lib/hooks/use-budgets';

// Bright color palette for categories - matching categories.ts
const BRIGHT_EXPENSE_COLORS: Record<string, string> = {
  // Daily Essentials
  'food': '#FF6B6B',
  'groceries': '#4ECDC4',
  'transport': '#45B7D1',
  'fuel': '#F97316',
  // Bills & Utilities
  'utilities': '#FFD93D',
  'rent': '#FFEAA7',
  'emi': '#EF4444',
  'insurance': '#A78BFA',
  'subscriptions': '#8B5CF6',
  'phone': '#06B6D4',
  'internet': '#3B82F6',
  // Lifestyle
  'entertainment': '#EC4899',
  'shopping': '#F472B6',
  'travel': '#14B8A6',
  'dining': '#FB923C',
  // Health & Education
  'health': '#EF4444',
  'fitness': '#10B981',
  'education': '#6366F1',
  // Investments
  'sip': '#A855F7',
  'mutual_funds': '#06B6D4',
  'stocks': '#3B82F6',
  'fixed_deposit': '#14B8A6',
  'ppf': '#8B5CF6',
  'nps': '#0EA5E9',
  'gold': '#FBBF24',
  'crypto': '#F97316',
  'real_estate': '#22C55E',
  // Personal
  'personal': '#D946EF',
  'gifts': '#F43F5E',
  'charity': '#FB7185',
  'family': '#E879F9',
  // Other
  'taxes': '#78716C',
  'fees': '#A1A1AA',
  'misc': '#6B7280',
};

const BRIGHT_INCOME_COLORS: Record<string, string> = {
  // Employment
  'salary': '#22C55E',
  'bonus': '#84CC16',
  'freelance': '#10B981',
  'business': '#14B8A6',
  'commission': '#06B6D4',
  // Investment Returns
  'dividends': '#0EA5E9',
  'interest': '#3B82F6',
  'capital_gains': '#6366F1',
  'rental': '#8B5CF6',
  'royalties': '#A855F7',
  // Other
  'refund': '#F59E0B',
  'cashback': '#FBBF24',
  'gift': '#F472B6',
  'lottery': '#EC4899',
  'settlements': '#22D3EE',
  'misc': '#6B7280',
};

interface InsightsViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

interface CategoryData {
  id: Category;
  label: string;
  color: string;
  amount: number;
  percentage: number;
  count: number;
}

export function InsightsView({ currentDate, onDateChange }: InsightsViewProps) {
  const [viewType, setViewType] = useState<'expense' | 'income'>('expense');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);
  const [enabledCategories, setEnabledCategories] = useState<Set<string>>(new Set());
  const [insightsPage, setInsightsPage] = useState(0);
  const [budgetSettingsOpen, setBudgetSettingsOpen] = useState(false);
  const [focusCategoryId, setFocusCategoryId] = useState<string | null>(null);
  const [focusCategoryAmount, setFocusCategoryAmount] = useState<number | undefined>(undefined);
  const { formatCurrency } = useCurrency();
  const { budgets, saveBudgets } = useBudgets();
  const { pendingSubPage, consumePendingSubPage } = useMode();

  // Navigate to budget tab if requested from layout
  useEffect(() => {
    if (pendingSubPage === 'budget') {
      consumePendingSubPage();
      setViewType('expense');
      setInsightsPage(1);
    }
  }, [pendingSubPage, consumePendingSubPage]);

  // Ensure we are working with the start of the month for consistent logic
  const insightsDate = useMemo(() => startOfMonth(currentDate), [currentDate]);

  // Fetch transactions for the insights month
  const { transactions } = useTransactions(insightsDate);

  // Fetch previous month's transactions for MoM comparison
  const prevMonthDate = useMemo(() => subMonths(insightsDate, 1), [insightsDate]);
  const { transactions: prevTransactions } = useTransactions(prevMonthDate);

  // Compute previous month spending by category
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

  const handlePreviousMonth = () => {
    onDateChange(subMonths(insightsDate, 1));
  };

  const handleNextMonth = () => {
    onDateChange(addMonths(insightsDate, 1));
  };

  // Key for animating content when month changes
  const monthKey = `${insightsDate.getFullYear()}-${insightsDate.getMonth()}`;

  // Calculate category totals
  const categoryData = useMemo(() => {
    const isExpense = viewType === 'expense';
    const filteredTransactions = transactions.filter(t =>
      isExpense ? t.amount < 0 : t.amount > 0
    );

    const categories = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const colorMap = isExpense ? BRIGHT_EXPENSE_COLORS : BRIGHT_INCOME_COLORS;
    const defaultCategory = isExpense ? DEFAULT_EXPENSE_CATEGORY : DEFAULT_INCOME_CATEGORY;

    // Sum amounts and count by category
    const categoryTotals: Record<string, { amount: number; count: number }> = {};
    filteredTransactions.forEach(t => {
      const cat = t.category || defaultCategory;
      const amount = Math.abs(t.amount);
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { amount: 0, count: 0 };
      }
      categoryTotals[cat].amount += amount;
      categoryTotals[cat].count += 1;
    });

    // Calculate total
    const total = Object.values(categoryTotals).reduce((sum, val) => sum + val.amount, 0);
    const totalCount = filteredTransactions.length;

    // Build category data with percentages
    const data: CategoryData[] = categories
      .filter(cat => categoryTotals[cat.id]?.amount > 0)
      .map(cat => ({
        id: cat.id,
        label: cat.label,
        color: colorMap[cat.id] || cat.color,
        amount: categoryTotals[cat.id].amount,
        percentage: total > 0 ? (categoryTotals[cat.id].amount / total) * 100 : 0,
        count: categoryTotals[cat.id].count,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { data, total, totalCount };
  }, [transactions, viewType]);

  // Reset enabled categories when data changes (month/viewType)
  useEffect(() => {
    setEnabledCategories(new Set(categoryData.data.map(c => c.id)));
  }, [categoryData.data]);

  // Filtered category data based on enabled checkboxes
  const filteredCategoryData = useMemo(() => {
    const filtered = categoryData.data.filter(c => enabledCategories.has(c.id));
    const filteredTotal = filtered.reduce((sum, c) => sum + c.amount, 0);
    const filteredCount = filtered.reduce((sum, c) => sum + c.count, 0);

    // Recalculate percentages based on filtered total
    const recalculated = filtered.map(c => ({
      ...c,
      percentage: filteredTotal > 0 ? (c.amount / filteredTotal) * 100 : 0,
    }));

    return { data: recalculated, total: filteredTotal, totalCount: filteredCount };
  }, [categoryData.data, enabledCategories]);

  const toggleCategory = useCallback((catId: string) => {
    setEnabledCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  }, []);

  const selectAllCategories = useCallback(() => {
    setEnabledCategories(new Set(categoryData.data.map(c => c.id)));
  }, [categoryData.data]);

  const deselectAllCategories = useCallback(() => {
    setEnabledCategories(new Set());
  }, []);

  const allSelected = enabledCategories.size === categoryData.data.length;
  const noneSelected = enabledCategories.size === 0;

  // Donut chart: each segment is a circle with stroke-dasharray
  const DONUT_RADIUS = 35;
  const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
  const DONUT_STROKE = 19; // gives outer ~44.5, inner ~25.5

  const donutSegments = useMemo(() => {
    const segments: { offset: number; length: number; color: string; category: CategoryData }[] = [];
    let accumulated = 0;

    // Compute for ALL categories — enabled get their share, disabled get 0
    const enabledMap = new Map(filteredCategoryData.data.map(c => [c.id, c]));

    categoryData.data.forEach(cat => {
      const filtered = enabledMap.get(cat.id);
      const fraction = filtered ? filtered.percentage / 100 : 0;
      const length = fraction * DONUT_CIRCUMFERENCE;

      segments.push({
        offset: accumulated,
        length,
        color: cat.color,
        category: cat,
      });

      accumulated += length;
    });

    return segments;
  }, [categoryData.data, filteredCategoryData.data, DONUT_CIRCUMFERENCE]);

  // Get transactions for selected category
  const selectedCategoryTransactions = useMemo(() => {
    if (!selectedCategory) return [];

    const isExpense = viewType === 'expense';
    const defaultCategory = isExpense ? DEFAULT_EXPENSE_CATEGORY : DEFAULT_INCOME_CATEGORY;

    return transactions
      .filter(t => {
        const matchesType = isExpense ? t.amount < 0 : t.amount > 0;
        const cat = t.category || defaultCategory;
        return matchesType && cat === selectedCategory.id;
      })
      .sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime());
  }, [selectedCategory, transactions, viewType]);

  // Clear selected category when view type changes
  const handleViewTypeChange = (value: string) => {
    setSelectedCategory(null);
    setViewType(value as 'expense' | 'income');
    if (value === 'income') setInsightsPage(0);
  };

  // Handle category click
  const handleCategoryClick = (cat: CategoryData) => {
    setSelectedCategory(cat);
    setHoveredCategory(null);
  };

  const monthName = insightsDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // CSS var name for the current view type — matches calendar tab:
  // income = --teal, expense = --expense-color (no hardcoded hex values)
  const containerRef = useRef<HTMLDivElement>(null);
  const themeColorVar = viewType === 'expense' ? '--expense-color' : '--teal';


  return (
    <div ref={containerRef} className="flex flex-col h-full bg-[var(--app-bg)] overflow-hidden">
      {/* Type Toggle - Top */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
        <Tabs value={viewType} onValueChange={handleViewTypeChange}>
          <TabsList className="grid w-full grid-cols-2 bg-[var(--surface)] p-1 sm:p-1.5 rounded-lg sm:rounded-xl">
            <TabsTrigger value="expense" className="text-xs sm:text-sm gap-1.5">
              Expenses
            </TabsTrigger>
            <TabsTrigger value="income" className="text-xs sm:text-sm gap-1.5">
              Income
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content - Scrollable on mobile, overflow-hidden on desktop */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-6 pb-8 md:pb-6 lg:py-8 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
        {categoryData.total === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-[var(--fill-subtle)] flex items-center justify-center mb-4">
              {viewType === 'expense' ? (
                <TrendingDown className="h-10 w-10 text-[var(--text-faint)]" />
              ) : (
                <TrendingUp className="h-10 w-10 text-[var(--text-faint)]" />
              )}
            </div>
            <p className="text-base text-[var(--text-muted)] mb-1">No {viewType === 'expense' ? 'expenses' : 'income'} yet</p>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handlePreviousMonth}
                className="p-1.5 rounded-lg hover:bg-[var(--fill-subtle-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-[var(--text-muted)]">{monthName}</span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-[var(--fill-subtle-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full lg:h-full lg:justify-evenly lg:px-4 lg:gap-8">
            {/* View Switcher Tabs — mobile: above content, desktop: hidden here */}
            {viewType === 'expense' && (
              <div className="flex sm:hidden items-center justify-center py-2">
                <div className="inline-flex items-center rounded-lg bg-[var(--surface)] p-1">
                  {[
                    { key: 0, label: 'Categories' },
                    { key: 1, label: 'Budgets' },
                  ].map(tab => {
                    const isActive = insightsPage === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setInsightsPage(tab.key)}
                        className="relative px-3 py-1.5 text-[11px] font-medium cursor-pointer transition-colors rounded-md"
                        style={{ color: isActive ? 'var(--expense-color)' : 'var(--text-muted)' }}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="insights-subtab-mobile"
                            className="absolute inset-0 rounded-md"
                            style={{
                              backgroundColor: 'var(--expense-bg)',
                              border: '1px solid var(--expense-border)',
                            }}
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                          />
                        )}
                        <span className="relative z-10">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mobile: Column layout scrollable | Desktop: Row layout centered */}
            <AnimatePresence mode="wait">
              {insightsPage === 0 ? (
                <motion.div
                  key="categories-page"
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="flex flex-col w-full lg:w-auto lg:flex-row items-center gap-6 sm:gap-12 lg:gap-32"
                >
                  {/* Pie Chart */}
                  <div className="relative w-80 h-80 sm:w-[420px] sm:h-[420px] lg:w-[500px] lg:h-[500px] shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 overflow-hidden">
                      {/* Donut segments — circles with animated stroke-dasharray */}
                      <g transform="rotate(-90 50 50)">
                        {donutSegments.map((segment) => {
                          const isHighlighted = selectedCategory === null
                            ? (hoveredCategory === null || hoveredCategory === segment.category.id)
                            : selectedCategory.id === segment.category.id;

                          return (
                            <motion.circle
                              key={segment.category.id}
                              cx="50"
                              cy="50"
                              r={DONUT_RADIUS}
                              fill="none"
                              stroke={segment.color}
                              strokeWidth={DONUT_STROKE}
                              initial={{
                                strokeDasharray: `${segment.length} ${DONUT_CIRCUMFERENCE}`,
                                strokeDashoffset: -segment.offset,
                                opacity: segment.length < 0.01 ? 0 : (isHighlighted ? 1 : 0.3),
                              }}
                              animate={{
                                strokeDasharray: `${segment.length} ${DONUT_CIRCUMFERENCE}`,
                                strokeDashoffset: -segment.offset,
                                opacity: segment.length < 0.01 ? 0 : (isHighlighted ? 1 : 0.3),
                              }}
                              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredCategory(segment.category.id)}
                              onMouseLeave={() => setHoveredCategory(null)}
                              onClick={() => handleCategoryClick(segment.category)}
                            />
                          );
                        })}
                      </g>

                      {/* Center fill */}
                      <circle cx="50" cy="50" r="25.5" fill="var(--app-bg)" />
                    </svg>

                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                      <span className="text-[10px] sm:text-base text-[var(--text-muted)] uppercase tracking-wider mb-0.5 sm:mb-1">
                        Total
                      </span>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={`total-${monthKey}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="text-lg sm:text-4xl font-bold"
                          style={{ color: `var(${themeColorVar})` }}
                        >
                          {formatCurrency(filteredCategoryData.total)}
                        </motion.span>
                      </AnimatePresence>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={`count-${monthKey}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="text-[10px] sm:text-base text-[var(--text-muted)] mt-0.5 sm:mt-2 flex items-center gap-1"
                        >
                          <LucideReceiptText className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                          {filteredCategoryData.totalCount} TXN
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Categories Card */}
                  <div
                    className="w-[calc(100%-2rem)] max-w-full h-[360px] sm:w-[480px] lg:w-[560px] sm:h-[400px] lg:h-[540px] rounded-xl sm:rounded-2xl bg-[var(--surface)] p-3 sm:p-6 lg:p-8 flex flex-col relative overflow-hidden"
                    style={{
                      border: selectedCategory
                        ? `1px solid ${selectedCategory.color}20`
                        : `1px solid color-mix(in srgb, var(${themeColorVar}) 12%, transparent)`,
                      boxShadow: selectedCategory
                        ? `0 0 40px ${selectedCategory.color}10, inset 0 1px 0 ${selectedCategory.color}10`
                        : `0 0 40px color-mix(in srgb, var(${themeColorVar}) 6%, transparent), inset 0 1px 0 color-mix(in srgb, var(${themeColorVar}) 6%, transparent)`
                    }}
                  >
                    {/* Subtle gradient overlay */}
                    <div
                      className="absolute top-0 right-0 w-32 h-32 opacity-10 blur-3xl pointer-events-none transition-colors duration-300"
                      style={{ background: selectedCategory ? selectedCategory.color : `var(${themeColorVar})` }}
                    />

                    <AnimatePresence mode="wait">
                      {selectedCategory ? (
                        /* Transaction Details View */
                        <motion.div
                          key="transactions"
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
                            <h3 className="text-base sm:text-xl font-semibold text-[var(--text-primary)] flex-1 min-w-0 truncate">{selectedCategory.label}</h3>
                            <div className="text-right shrink-0">
                              <div className="text-sm sm:text-lg font-bold" style={{ color: selectedCategory.color }}>
                                {formatCurrency(selectedCategory.amount)}
                              </div>
                              <div className="text-[10px] sm:text-xs text-[var(--text-muted)]">{selectedCategory.count} txn</div>
                            </div>
                          </div>

                          {/* Transaction List */}
                          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide space-y-2 sm:space-y-3">
                            {selectedCategoryTransactions.map((txn, index) => (
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
                                    {viewType === 'expense' ? '-' : '+'}{formatCurrency(Math.abs(txn.amount))}
                                  </span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      ) : (
                        /* Categories List View */
                        <motion.div
                          key="categories"
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 30 }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                          className="flex flex-col h-full"
                        >
                          <div className="flex items-center justify-between mb-2 sm:mb-5">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <h3 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">Categories</h3>
                              <div className="flex items-center justify-center gap-1 mt-1">
                                <button
                                  onClick={selectAllCategories}
                                  className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium transition-colors cursor-pointer ${allSelected ? 'bg-[var(--fill-subtle)] text-[var(--text-secondary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--fill-subtle-hover)]'}`}
                                >
                                  All
                                </button>
                                <button
                                  onClick={deselectAllCategories}
                                  className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium transition-colors cursor-pointer ${noneSelected ? 'bg-[var(--fill-subtle)] text-[var(--text-secondary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--fill-subtle-hover)]'}`}
                                >
                                  None
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
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

                          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={`categories-${monthKey}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-1 sm:space-y-2"
                              >
                                {categoryData.data.map((cat, index) => (
                                  <motion.div
                                    key={cat.id}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{
                                      opacity: 1,
                                      x: 0,
                                      backgroundColor: hoveredCategory === cat.id ? 'var(--fill-subtle)' : 'transparent'
                                    }}
                                    transition={{ delay: index * 0.03, duration: 0.2 }}
                                    className="rounded-lg sm:rounded-xl p-2 sm:p-4 cursor-pointer transition-colors"
                                    onMouseEnter={() => setHoveredCategory(cat.id)}
                                    onMouseLeave={() => setHoveredCategory(null)}
                                    onClick={() => handleCategoryClick(cat)}
                                  >
                                    <div className="flex items-center gap-2 sm:gap-4 mb-1 sm:mb-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleCategory(cat.id);
                                        }}
                                        className="w-4 h-4 sm:w-5 sm:h-5 rounded sm:rounded-md border flex items-center justify-center shrink-0 transition-all cursor-pointer"
                                        style={{
                                          borderColor: enabledCategories.has(cat.id) ? cat.color : 'var(--text-faint)',
                                          backgroundColor: enabledCategories.has(cat.id) ? cat.color : 'transparent',
                                        }}
                                      >
                                        {enabledCategories.has(cat.id) && (
                                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[var(--text-inverse)]" strokeWidth={3} />
                                        )}
                                      </button>
                                      <span className="flex-1 text-[14px] sm:text-base text-[var(--text-primary)] truncate">{cat.label}</span>
                                      <span className="px-1 sm:px-2 py-0.5 rounded-full bg-[var(--fill-subtle)] text-[8px] sm:text-[10px] text-[var(--text-primary)]/50 font-medium tabular-nums">
                                        {cat.count} TXN
                                      </span>
                                      <span className="text-[10px] sm:text-base text-[var(--text-muted)] tabular-nums">{cat.percentage.toFixed(0)}%</span>
                                      <span className={`text-[10px] sm:text-base font-semibold tabular-nums`} style={{ color: `var(${themeColorVar})` }}>
                                        {formatCurrency(cat.amount)}
                                      </span>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="h-1 sm:h-1.5 bg-[var(--fill-subtle)] rounded-full overflow-hidden ml-6 sm:ml-8">
                                      <motion.div
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: cat.color }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${cat.percentage}%` }}
                                        transition={{ delay: index * 0.05 + 0.2, duration: 0.5, ease: 'easeOut' }}
                                      />
                                    </div>
                                  </motion.div>
                                ))}
                              </motion.div>
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="budget-page"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="flex flex-col w-full lg:w-auto lg:flex-row items-center gap-6 sm:gap-12 lg:gap-32"
                >
                  <BudgetView
                    categoryData={categoryData}
                    currentDate={insightsDate}
                    onDateChange={onDateChange}
                    onOpenSettings={(catId, catAmount) => {
                      setFocusCategoryId(catId ?? null);
                      setFocusCategoryAmount(catAmount);
                      setBudgetSettingsOpen(true);
                    }}
                    budgets={budgets}
                    transactions={transactions}
                    prevSpending={prevSpendingMap}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* View Switcher Tabs — desktop only (mobile version is above) */}
            {viewType === 'expense' && (
              <div className="hidden sm:flex items-center justify-center py-3">
                <div className="inline-flex items-center rounded-lg bg-[var(--surface)] p-1">
                  {[
                    { key: 0, label: 'Categories' },
                    { key: 1, label: 'Budgets' },
                  ].map(tab => {
                    const isActive = insightsPage === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setInsightsPage(tab.key)}
                        className="relative px-4 py-1.5 text-xs font-medium cursor-pointer transition-colors rounded-md"
                        style={{ color: isActive ? 'var(--expense-color)' : 'var(--text-muted)' }}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="insights-subtab"
                            className="absolute inset-0 rounded-md"
                            style={{
                              backgroundColor: 'var(--expense-bg)',
                              border: '1px solid var(--expense-border)',
                            }}
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                          />
                        )}
                        <span className="relative z-10">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Daily Spending Chart */}
            <div className="flex flex-col w-full lg:w-auto lg:flex-row items-center gap-6 sm:gap-12 lg:gap-32 mt-6 lg:mt-0 shrink-0 pb-0 sm:pb-8">
              <DailySpendingChart
                transactions={transactions.filter(t => {
                  const isExpense = viewType === 'expense';
                  const defaultCat = isExpense ? DEFAULT_EXPENSE_CATEGORY : DEFAULT_INCOME_CATEGORY;
                  const cat = t.category || defaultCat;
                  return enabledCategories.has(cat);
                })}
                currentDate={insightsDate}
                viewType={viewType}
              />
            </div>
          </div>
        )}
      </div>

      <BudgetSettingsModal
        open={budgetSettingsOpen}
        onOpenChange={(open) => {
          setBudgetSettingsOpen(open);
          if (!open) {
            setFocusCategoryId(null);
            setFocusCategoryAmount(undefined);
          }
        }}
        budgets={budgets}
        onSave={saveBudgets}
        focusCategoryId={focusCategoryId}
        focusCategoryAmount={focusCategoryAmount}
      />
    </div>
  );
}
