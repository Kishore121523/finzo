'use client';

import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, PieChart } from 'lucide-react';

interface FinancialSummaryProps {
  balance: number;
  totalIncome: number;
  totalExpenses: number;
  budgetUtilization: number | null; // null = no budget set
  formatCurrency: (amount: number, options?: { compact?: boolean }) => string;
}

const cardItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export function FinancialSummary({
  balance,
  totalIncome,
  totalExpenses,
  budgetUtilization,
  formatCurrency,
}: FinancialSummaryProps) {
  const stats = [
    {
      label: 'Balance',
      value: formatCurrency(balance, { compact: true }),
      icon: Wallet,
      colorVar: '--teal',
      bgVar: '--teal-bg',
    },
    {
      label: 'Income',
      value: formatCurrency(totalIncome, { compact: true }),
      icon: TrendingUp,
      colorVar: '--teal',
      bgVar: '--teal-bg',
    },
    {
      label: 'Expenses',
      value: formatCurrency(totalExpenses, { compact: true }),
      icon: TrendingDown,
      colorVar: '--expense-color',
      bgVar: '--expense-bg',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              variants={cardItem}
              className="flex flex-col items-center gap-2 rounded-xl bg-[var(--surface-hover)] p-3 sm:p-4 border border-[var(--border-secondary)]"
            >
              <div
                className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: `var(${stat.bgVar})` }}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: `var(${stat.colorVar})` }} />
              </div>
              <span className="text-[10px] sm:text-xs text-[var(--text-secondary)]">{stat.label}</span>
              <span
                className="text-sm sm:text-lg font-bold tabular-nums"
                style={{ color: `var(${stat.colorVar})` }}
              >
                {stat.value}
              </span>
            </motion.div>
          );
        })}
      </div>

      {budgetUtilization !== null && (
        <motion.div variants={cardItem} className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <div className="flex items-center gap-1.5">
              <PieChart className="h-3.5 w-3.5" />
              <span>Budget used</span>
            </div>
            <span
              className="font-medium tabular-nums"
              style={{
                color: budgetUtilization > 100
                  ? 'var(--expense-color)'
                  : budgetUtilization > 80
                    ? '#FBBF24'
                    : 'var(--teal)',
              }}
            >
              {budgetUtilization.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-[var(--fill-subtle)] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                backgroundColor: budgetUtilization > 100
                  ? 'var(--expense-color)'
                  : budgetUtilization > 80
                    ? '#FBBF24'
                    : 'var(--teal)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(budgetUtilization, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
