'use client';

import { memo } from 'react';
import { Transaction } from '@/lib/types/transaction';
import { TransactionItem } from './transaction-item';
import { format, isSameDay } from 'date-fns';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onAddForDate: (date: Date) => void;
}

export const TransactionList = memo(function TransactionList({
  transactions,
  onEdit,
  onDelete,
  onAddForDate,
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg text-white/60">No transactions for this month</p>
          <p className="text-sm text-white/40 mt-1">Click the + button to add one</p>
        </div>
      </div>
    );
  }

  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = transaction.date.toDate();
    const dateKey = format(date, 'yyyy-MM-dd');

    if (!groups[dateKey]) {
      groups[dateKey] = {
        date,
        transactions: [],
      };
    }

    groups[dateKey].transactions.push(transaction);
    return groups;
  }, {} as Record<string, { date: Date; transactions: Transaction[] }>);

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });

  return (
    <div className="mx-auto max-w-7xl space-y-4 md:space-y-6 px-4 py-3 md:py-4">
      {sortedDates.map((dateKey) => {
        const group = groupedTransactions[dateKey];
        return (
          <div key={dateKey} className="space-y-2">
            <button
              onClick={() => onAddForDate(group.date)}
              className="flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white transition-colors"
            >
              <span>{format(group.date, 'EEEE, MMMM d')}</span>
            </button>
            <div className="space-y-2">
              {group.transactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
});
