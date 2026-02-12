'use client';

import { useMemo, useState } from 'react';
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
import { TrendingDown, TrendingUp, Receipt, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { Transaction } from '@/lib/types/transaction';
import { addMonths, subMonths, startOfMonth } from 'date-fns';
import { DailySpendingChart } from './daily-spending-chart';

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
}

interface CategoryData {
  id: Category;
  label: string;
  color: string;
  amount: number;
  percentage: number;
  count: number;
}

export function InsightsView({ currentDate }: InsightsViewProps) {
  const [viewType, setViewType] = useState<'expense' | 'income'>('expense');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);
  const [insightsDate, setInsightsDate] = useState<Date>(() => startOfMonth(currentDate));
  const { formatCurrency } = useCurrency();

  // Fetch transactions for the insights month
  const { transactions } = useTransactions(insightsDate);

  const handlePreviousMonth = () => {
    setInsightsDate(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setInsightsDate(prev => addMonths(prev, 1));
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

  // Generate pie chart segments
  const pieSegments = useMemo(() => {
    const segments: { path: string; color: string; category: CategoryData }[] = [];
    let currentAngle = -90;

    categoryData.data.forEach(cat => {
      const angle = (cat.percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = 50 + 45 * Math.cos(startRad);
      const y1 = 50 + 45 * Math.sin(startRad);
      const x2 = 50 + 45 * Math.cos(endRad);
      const y2 = 50 + 45 * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;
      const path = `M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArc} 1 ${x2} ${y2} Z`;

      segments.push({ path, color: cat.color, category: cat });
      currentAngle = endAngle;
    });

    return segments;
  }, [categoryData.data]);

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
  };

  // Handle category click
  const handleCategoryClick = (cat: CategoryData) => {
    setSelectedCategory(cat);
    setHoveredCategory(null);
  };

  const monthName = insightsDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const themeColor = viewType === 'expense' ? '#FF6B6B' : '#10B981';

  return (
    <div className="flex flex-col h-full bg-[#121212] overflow-hidden">
      {/* Type Toggle - Top */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
        <Tabs value={viewType} onValueChange={handleViewTypeChange}>
          <TabsList className="grid w-full grid-cols-2 bg-[#252525] p-1 sm:p-1.5 rounded-lg sm:rounded-xl">
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
      <div className="flex-1 overflow-y-auto px-2 sm:px-6 pb-15 md:pb-6 scrollbar-hide " style={{ WebkitOverflowScrolling: 'touch' }}>
        {categoryData.total === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
              {viewType === 'expense' ? (
                <TrendingDown className="h-10 w-10 text-white/20" />
              ) : (
                <TrendingUp className="h-10 w-10 text-white/20" />
              )}
            </div>
            <p className="text-base text-white/40 mb-1">No {viewType === 'expense' ? 'expenses' : 'income'} yet</p>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handlePreviousMonth}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-white/30">{monthName}</span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full">
            {/* Centering wrapper — gives the original vertical space on desktop */}
            <div className="flex flex-col items-center w-full lg:min-h-[calc(100vh-250px)] lg:justify-center lg:px-4">
              {/* Mobile: Column layout scrollable | Desktop: Row layout centered */}
              <div className="flex flex-col w-full lg:w-auto lg:flex-row items-center gap-6 sm:gap-12 lg:gap-32">
              {/* Pie Chart */}
              <div className="relative w-80 h-80 sm:w-[420px] sm:h-[420px] lg:w-[500px] lg:h-[500px] shrink-0">
                {/* Outer glow ring */}
                <div
                  className="absolute inset-0 rounded-full opacity-20 blur-xl"
                  style={{ background: `radial-gradient(circle, ${themeColor} 0%, transparent 70%)` }}
                />

                <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
                  <defs>
                    <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#1a1a1a" />
                      <stop offset="100%" stopColor="#121212" />
                    </radialGradient>
                  </defs>

                  {/* Animated pie segments */}
                  <AnimatePresence mode="wait">
                    <motion.g
                      key={monthKey}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      {pieSegments.map((segment) => {
                        const isActive = selectedCategory?.id === segment.category.id || hoveredCategory === segment.category.id;
                        const isHighlighted = selectedCategory === null
                          ? (hoveredCategory === null || hoveredCategory === segment.category.id)
                          : selectedCategory.id === segment.category.id;

                        return (
                          <motion.path
                            key={segment.category.id}
                            d={segment.path}
                            fill={segment.color}
                            initial={{ opacity: 0 }}
                            animate={{
                              opacity: isHighlighted ? 1 : 0.3,
                              scale: isActive ? 1.02 : 1,
                            }}
                            transition={{ duration: 0.2 }}
                            className="cursor-pointer"
                            style={{
                              filter: isActive
                                ? `drop-shadow(0 0 8px ${segment.color})`
                                : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                              transformOrigin: 'center',
                            }}
                            onMouseEnter={() => setHoveredCategory(segment.category.id)}
                            onMouseLeave={() => setHoveredCategory(null)}
                            onClick={() => handleCategoryClick(segment.category)}
                          />
                        );
                      })}
                    </motion.g>
                  </AnimatePresence>

                  {/* Center hole - rendered last to be on top */}
                  <circle cx="50" cy="50" r="26" fill="url(#centerGradient)" />
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                  <span className="text-[10px] sm:text-base text-white/40 uppercase tracking-wider mb-0.5 sm:mb-1">
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
                      style={{ color: themeColor }}
                    >
                      {formatCurrency(categoryData.total)}
                    </motion.span>
                  </AnimatePresence>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`count-${monthKey}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-[10px] sm:text-base text-white/30 mt-0.5 sm:mt-2 flex items-center gap-1"
                    >
                      <Receipt className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                      {categoryData.totalCount} TXN
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>

              {/* Categories Card */}
              <div
                className="w-[calc(100%-2rem)] max-w-full min-h-[280px] sm:w-[480px] lg:w-[560px] sm:h-[400px] lg:h-[540px] rounded-xl sm:rounded-2xl bg-[#1E1E1E] p-3 sm:p-6 lg:p-8 flex flex-col relative overflow-hidden"
                style={{
                  border: `1px solid ${selectedCategory ? selectedCategory.color : themeColor}20`,
                  boxShadow: `0 0 40px ${selectedCategory ? selectedCategory.color : themeColor}10, inset 0 1px 0 ${selectedCategory ? selectedCategory.color : themeColor}10`
                }}
              >
                {/* Subtle gradient overlay */}
                <div
                  className="absolute top-0 right-0 w-32 h-32 opacity-10 blur-3xl pointer-events-none transition-colors duration-300"
                  style={{ background: selectedCategory ? selectedCategory.color : themeColor }}
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
                          className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer shrink-0"
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
                        <h3 className="text-base sm:text-xl font-semibold text-white flex-1 min-w-0 truncate">{selectedCategory.label}</h3>
                        <div className="text-right shrink-0">
                          <div className="text-sm sm:text-lg font-bold" style={{ color: selectedCategory.color }}>
                            {formatCurrency(selectedCategory.amount)}
                          </div>
                          <div className="text-[10px] sm:text-xs text-white/40">{selectedCategory.count} txn</div>
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
                            className="rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/8 p-3 sm:p-4 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2 sm:gap-3">
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <p className="text-sm sm:text-base text-white truncate">{txn.description}</p>
                                <p className="text-[10px] sm:text-xs text-white/40 mt-0.5">
                                  {txn.date.toDate().toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                  {txn.isRecurring && (
                                    <span className="ml-1.5 px-1.5 py-0.5 rounded bg-white/10 text-white/50 text-[8px] sm:text-[10px]">
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
                        <h3 className="text-lg sm:text-xl font-semibold text-white">Categories</h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handlePreviousMonth}
                            className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <span className="text-[10px] sm:text-base text-white/40">
                            {monthName}
                          </span>
                          <button
                            onClick={handleNextMonth}
                            className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer"
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
                                  backgroundColor: hoveredCategory === cat.id ? 'rgba(255,255,255,0.05)' : 'transparent'
                                }}
                                transition={{ delay: index * 0.03, duration: 0.2 }}
                                className="rounded-lg sm:rounded-xl p-2 sm:p-4 cursor-pointer transition-colors"
                                onMouseEnter={() => setHoveredCategory(cat.id)}
                                onMouseLeave={() => setHoveredCategory(null)}
                                onClick={() => handleCategoryClick(cat)}
                              >
                                <div className="flex items-center gap-2 sm:gap-4 mb-1 sm:mb-2">
                                  <div
                                    className="w-2.5 h-2.5 sm:w-4 sm:h-4 rounded-full shrink-0 transition-shadow"
                                    style={{
                                      backgroundColor: cat.color,
                                      boxShadow: hoveredCategory === cat.id
                                        ? `0 0 16px ${cat.color}`
                                        : `0 0 8px ${cat.color}40`
                                    }}
                                  />
                                  <span className="flex-1 text-[14px] sm:text-base text-white truncate">{cat.label}</span>
                                  <span className="px-1 sm:px-2 py-0.5 rounded-full bg-white/10 text-[8px] sm:text-[10px] text-white/50 font-medium tabular-nums">
                                    {cat.count} TXN
                                  </span>
                                  <span className="text-[10px] sm:text-base text-white/40 tabular-nums">{cat.percentage.toFixed(0)}%</span>
                                  <span className={`text-[10px] sm:text-base font-semibold tabular-nums`} style={{ color: themeColor }}>
                                    {formatCurrency(cat.amount)}
                                  </span>
                                </div>
                                {/* Progress bar */}
                                <div className="h-1 sm:h-1.5 bg-white/5 rounded-full overflow-hidden ml-4.5 sm:ml-8">
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
              </div>
            </div>

            {/* Daily Spending Chart - below pie + categories, scrollable */}
            <div className="flex flex-col w-full lg:w-auto lg:flex-row items-center gap-6 sm:gap-12 lg:gap-32 mt-6 m-auto sm:mt-0 shrink-0 pb-0 sm:pb-4">
              <DailySpendingChart transactions={transactions} currentDate={insightsDate} viewType={viewType} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
