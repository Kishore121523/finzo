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

  return (
    <div className="flex flex-col gap-2 h-full">
      {categories.map((cat, i) => {
        const pct = maxAmount > 0 ? (cat.amount / maxAmount) * 100 : 0;

        return (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3"
          >
            {/* Color dot */}
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: cat.color }}
            />

            {/* Label */}
            <span className="w-[100px] sm:w-[120px] flex-shrink-0 text-xs sm:text-sm text-[var(--text-primary)] font-medium truncate">
              {cat.label}
            </span>

            {/* Inline bar */}
            <div className="flex-1 h-[6px] rounded-full bg-[var(--fill-subtle)] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: cat.color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>

            {/* Amount */}
            <span className="w-[60px] sm:w-[70px] text-right text-xs sm:text-sm text-[var(--text-secondary)] font-semibold tabular-nums flex-shrink-0">
              {formatCurrency(cat.amount, { compact: true })}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
