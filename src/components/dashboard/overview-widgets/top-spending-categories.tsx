'use client';

import { motion } from 'framer-motion';

interface CategoryData {
  id: string;
  label: string;
  color: string;
  amount: number;
}

interface TopSpendingCategoriesProps {
  categories: CategoryData[];
  formatCurrency: (amount: number, options?: { compact?: boolean }) => string;
}

export function TopSpendingCategories({
  categories,
  formatCurrency,
}: TopSpendingCategoriesProps) {
  if (categories.length === 0) {
    return (
      <div className="flex h-full items-center justify-center py-8">
        <p className="text-sm text-[var(--text-muted)]">No expenses this month</p>
      </div>
    );
  }

  const maxAmount = Math.max(...categories.map(c => c.amount));
  const totalAmount = categories.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="flex flex-col gap-3.5 h-full">
      {categories.map((cat, i) => {
        const pct = maxAmount > 0 ? (cat.amount / maxAmount) * 100 : 0;
        const share = totalAmount > 0 ? (cat.amount / totalAmount) * 100 : 0;

        return (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="group"
          >
            {/* Label row */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-xs sm:text-sm text-[var(--text-primary)] font-medium truncate">
                  {cat.label}
                </span>
                <span className="text-[10px] sm:text-xs text-[var(--text-muted)] tabular-nums flex-shrink-0">
                  {share.toFixed(0)}%
                </span>
              </div>
              <span className="text-xs sm:text-sm text-[var(--text-secondary)] font-semibold tabular-nums flex-shrink-0 ml-3">
                {formatCurrency(cat.amount, { compact: true })}
              </span>
            </div>

            {/* Proportional bar */}
            <div className="h-2 rounded-full bg-[var(--fill-subtle)] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: cat.color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
