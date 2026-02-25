'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, PieChart } from 'lucide-react';

interface FinancialSummaryProps {
  balance: number;
  totalIncome: number;
  totalExpenses: number;
  budgetUtilization: number | null;
  effectiveBudget: number | null;
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
  effectiveBudget,
  formatCurrency,
}: FinancialSummaryProps) {
  return (
    <motion.div variants={cardItem} className="flex flex-col gap-3">
      {/* Compact horizontal layout */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Balance */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] sm:text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium">Balance</span>
          <span className="text-lg sm:text-2xl font-bold text-[var(--teal)] tabular-nums">
            {formatCurrency(balance, { compact: true })}
          </span>
        </div>

        {/* Income + Expenses side by side */}
        <div className="flex items-center gap-5 sm:gap-8">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--teal-bg)]">
              <ArrowUpRight className="h-3 w-3 text-[var(--teal)]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] sm:text-[10px] text-[var(--text-muted)] uppercase tracking-wider leading-none">Income</span>
              <span className="text-sm sm:text-base font-semibold text-[var(--teal)] tabular-nums">
                {formatCurrency(totalIncome, { compact: true })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--expense-bg)]">
              <ArrowDownRight className="h-3 w-3 text-[var(--expense-color)]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] sm:text-[10px] text-[var(--text-muted)] uppercase tracking-wider leading-none">Expenses</span>
              <span className="text-sm sm:text-base font-semibold text-[var(--expense-color)] tabular-nums">
                {formatCurrency(totalExpenses, { compact: true })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Budget bar */}
      {budgetUtilization !== null && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-[var(--text-secondary)]">
            <div className="flex items-center gap-1.5">
              <PieChart className="h-3 w-3" />
              <span>Budget used</span>
            </div>
            <div className="flex items-center tabular-nums">
              <span className="font-medium text-[var(--text-primary)]">
                {formatCurrency(totalExpenses, { compact: true })}
              </span>
              <span className="text-[var(--text-muted)] px-[2px]">/</span>
              <span className="font-medium text-[var(--text-secondary)]">
                {effectiveBudget ? formatCurrency(effectiveBudget, { compact: true }) : '—'}
              </span>
              <span className="text-[var(--text-muted)] opacity-40 px-2">|</span>
              <span
                className="font-medium"
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
          </div>
          <div className="h-1.5 rounded-full bg-[var(--fill-subtle)] overflow-hidden">
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
        </div>
      )}
    </motion.div>
  );
}
