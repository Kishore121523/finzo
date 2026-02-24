'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate?: Date;
  status: string;
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

function formatDue(date: Date | undefined): string {
  if (!date) return '';
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
        <span className="text-sm">All caught up!</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {bills.map((bill) => (
        <motion.div
          key={bill.id}
          variants={item}
          className={`flex items-center justify-between rounded-lg p-2 sm:p-2.5 ${bill.isOverdue
            ? 'bg-[color-mix(in_srgb,var(--expense-color)_8%,transparent)]'
            : 'hover:bg-[var(--fill-subtle)]'
            } transition-colors`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {bill.isOverdue && (
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-[var(--expense-color)]" />
            )}
            <div className="min-w-0">
              <p className={`text-xs sm:text-sm truncate ${bill.isOverdue ? 'text-[var(--expense-color)]' : 'text-[var(--text-primary)] max-w-[230px]'
                }`}>
                {bill.title}
              </p>
              {bill.dueDate && (
                <p className={`text-[10px] sm:text-xs ${bill.isOverdue ? 'text-[var(--expense-color)] opacity-70' : 'text-[var(--text-muted)]'
                  }`}>
                  {formatDue(bill.dueDate)}
                </p>
              )}
            </div>
          </div>
          <span className={`text-xs sm:text-sm font-medium tabular-nums flex-shrink-0 ${bill.isOverdue ? 'text-[var(--expense-color)]' : 'text-[var(--text-primary)]'
            }`}>
            {formatCurrency(bill.amount, { compact: true })}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
