'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Circle, CircleCheck } from 'lucide-react';

interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate?: Date;
  status: string;
  isPaid: boolean;
  isOverdue: boolean;
}

interface UpcomingBillsProps {
  bills: Bill[];
  formatCurrency: (amount: number, options?: { compact?: boolean }) => string;
}

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

function formatDue(date: Date | undefined, isPaid: boolean): string {
  if (!date) return '';
  if (isPaid) return 'Paid';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(date);
  due.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Tomorrow';
  return `In ${diff}d`;
}

export function UpcomingBills({ bills, formatCurrency }: UpcomingBillsProps) {
  if (bills.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 py-8 text-[var(--text-muted)]">
        <CheckCircle2 className="h-8 w-8 opacity-40" />
        <span className="text-sm">No payments this month</span>
      </div>
    );
  }

  const paidCount = bills.filter((b) => b.isPaid).length;
  const totalCount = bills.length;
  const pendingTotal = bills.filter((b) => !b.isPaid).reduce((s, b) => s + b.amount, 0);
  const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] sm:text-xs">
          <span className="text-[var(--text-muted)]">
            {paidCount}/{totalCount} paid
          </span>
          {pendingTotal > 0 && (
            <span className="text-[var(--text-muted)]">
              {formatCurrency(pendingTotal, { compact: true })} remaining
            </span>
          )}
        </div>
        <div className="h-1.5 rounded-full bg-[var(--fill-subtle)] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[var(--teal)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      {/* Bill list */}
      <div className="space-y-0.5">
        {bills.map((bill) => {
          const dueLabel = formatDue(bill.dueDate, bill.isPaid);

          return (
            <motion.div
              key={bill.id}
              variants={item}
              className={`flex items-center gap-2 rounded-lg px-1.5 py-1.5 sm:py-2 transition-colors ${
                bill.isOverdue
                  ? 'bg-[color-mix(in_srgb,var(--expense-color)_6%,transparent)]'
                  : ''
              }`}
            >
              {/* Status icon */}
              {bill.isPaid ? (
                <CircleCheck className="h-3.5 w-3.5 flex-shrink-0 text-[var(--teal)] opacity-70" />
              ) : bill.isOverdue ? (
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-[var(--expense-color)]" />
              ) : (
                <Circle className="h-3.5 w-3.5 flex-shrink-0 text-[var(--text-muted)] opacity-40" />
              )}

              {/* Title + due */}
              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs sm:text-sm truncate max-w-[180px] ${
                    bill.isPaid
                      ? 'text-[var(--text-muted)] line-through'
                      : bill.isOverdue
                        ? 'text-[var(--expense-color)]'
                        : 'text-[var(--text-primary)]'
                  }`}
                >
                  {bill.title}
                </p>
              </div>

              {/* Due label */}
              {dueLabel && (
                <span
                  className={`text-[10px] flex-shrink-0 ${
                    bill.isPaid
                      ? 'text-[var(--teal)] opacity-60'
                      : bill.isOverdue
                        ? 'text-[var(--expense-color)] opacity-80'
                        : 'text-[var(--text-muted)]'
                  }`}
                >
                  {dueLabel}
                </span>
              )}

              {/* Amount */}
              <span
                className={`text-xs sm:text-sm font-medium tabular-nums flex-shrink-0 ${
                  bill.isPaid
                    ? 'text-[var(--text-muted)] line-through'
                    : bill.isOverdue
                      ? 'text-[var(--expense-color)]'
                      : 'text-[var(--text-primary)]'
                }`}
              >
                {formatCurrency(bill.amount, { compact: true })}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
