'use client';

import { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, ChevronRight as ChevronRightSmall, X, RefreshCw } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { useCurrency } from '@/components/providers/currency-provider';
import { Transaction } from '@/lib/types/transaction';
import { getCategoryInfo } from '@/lib/constants/categories';

interface MonthNavigatorProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  balance: number;
  income?: number;
  expense?: number;
  transactions?: Transaction[];
}

type ModalType = 'income' | 'expense' | 'all' | null;

export const MonthNavigator = memo(function MonthNavigator({
  currentDate,
  onPreviousMonth,
  onNextMonth,
  balance,
  income = 0,
  expense = 0,
  transactions = [],
}: MonthNavigatorProps) {
  const { formatCurrency } = useCurrency();
  const [modalType, setModalType] = useState<ModalType>(null);

  // Filter and sort transactions based on modal type
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (modalType === 'income') {
      filtered = filtered.filter(t => t.amount > 0);
    } else if (modalType === 'expense') {
      filtered = filtered.filter(t => t.amount < 0);
    }

    // Sort by date (oldest first - first day of month at top)
    return filtered.sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime());
  }, [transactions, modalType]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { date: string; transactions: Transaction[] }[] = [];
    let currentDateStr = '';

    filteredTransactions.forEach(t => {
      const dateStr = format(t.date.toDate(), 'yyyy-MM-dd');
      if (dateStr !== currentDateStr) {
        currentDateStr = dateStr;
        groups.push({ date: dateStr, transactions: [t] });
      } else {
        groups[groups.length - 1].transactions.push(t);
      }
    });

    return groups;
  }, [filteredTransactions]);

  const getModalTitle = () => {
    switch (modalType) {
      case 'income': return 'Income';
      case 'expense': return 'Expenses';
      case 'all': return 'All Transactions';
      default: return '';
    }
  };

  const getModalColorVar = () => {
    switch (modalType) {
      case 'income': return '--teal';
      case 'expense': return '--expense-color';
      case 'all': return balance >= 0 ? '--teal' : '--expense-color';
      default: return '--teal';
    }
  };

  const getModalTotal = () => {
    switch (modalType) {
      case 'income': return income;
      case 'expense': return expense;
      case 'all': return balance;
      default: return 0;
    }
  };

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:block bg-linear-to-b from-[var(--app-bg)] to-[var(--app-bg)]">
        <div className="mx-auto max-w-7xl px-4 pt-6 pb-2">
          <div>
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={onPreviousMonth}
                className="h-12 w-12 rounded-xl bg-[var(--surface-hover)] border border-[var(--border-secondary)] text-[var(--text-primary)] hover:bg-[var(--border-secondary)] hover:text-[var(--text-primary)] transition-all"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              <motion.div
                key={format(currentDate, 'yyyy-MM')}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <h2 className="text-3xl font-bold text-[var(--text-primary)]">
                  {format(currentDate, 'MMMM')}
                </h2>
                <p className="text-sm text-[var(--text-muted)]">{format(currentDate, 'yyyy')}</p>
              </motion.div>

              <Button
                variant="ghost"
                size="icon"
                onClick={onNextMonth}
                className="h-12 w-12 rounded-xl bg-[var(--surface-hover)] border border-[var(--border-secondary)] text-[var(--text-primary)] hover:bg-[var(--border-secondary)] hover:text-[var(--text-primary)] transition-all"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>

            {/* Stats cards - Desktop */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-3"
            >
              <div className="grid grid-cols-3 gap-3">
                {/* Income */}
                <button
                  onClick={() => setModalType('income')}
                  className="flex items-center gap-3 bg-[var(--teal-bg)] hover:bg-[var(--teal-bg)] rounded-xl px-4 py-3 transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--teal-bg)] flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5 text-[var(--teal)]" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-xs text-[var(--text-muted)] leading-none">Income</p>
                    <p className="text-lg font-bold text-[var(--teal)] leading-tight truncate">
                      {formatCurrency(income, { compact: true })}
                    </p>
                  </div>
                  <ChevronRightSmall className="w-4 h-4 text-[var(--text-faint)] group-hover:text-[var(--teal)] transition-colors" />
                </button>

                {/* Expense */}
                <button
                  onClick={() => setModalType('expense')}
                  className="flex items-center gap-3 bg-[var(--expense-color)]/5 hover:bg-[var(--expense-color)]/10 rounded-xl px-4 py-3 transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[var(--expense-color)]/15 flex items-center justify-center shrink-0">
                    <TrendingDown className="w-5 h-5 text-[var(--expense-color)]" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-xs text-[var(--text-muted)] leading-none">Expense</p>
                    <p className="text-lg font-bold text-[var(--expense-color)] leading-tight truncate">
                      {formatCurrency(expense, { compact: true })}
                    </p>
                  </div>
                  <ChevronRightSmall className="w-4 h-4 text-[var(--text-faint)] group-hover:text-[var(--expense-color)] transition-colors" />
                </button>

                {/* Balance */}
                <button
                  onClick={() => setModalType('all')}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors cursor-pointer group ${balance >= 0 ? 'bg-[var(--teal-bg)] hover:bg-[var(--teal-bg)]' : 'bg-[var(--expense-color)]/5 hover:bg-[var(--expense-color)]/10'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${balance >= 0 ? 'bg-[var(--teal-bg)]' : 'bg-[var(--expense-color)]/15'}`}>
                    <Wallet className={`w-5 h-5 ${balance >= 0 ? 'text-[var(--teal)]' : 'text-[var(--expense-color)]'}`} />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-xs text-[var(--text-muted)] leading-none">Balance</p>
                    <p className={`text-lg font-bold leading-tight truncate ${balance >= 0 ? 'text-[var(--teal)]' : 'text-[var(--expense-color)]'}`}>
                      {formatCurrency(balance, { showSign: true, compact: true })}
                    </p>
                  </div>
                  <ChevronRightSmall className={`w-4 h-4 text-[var(--text-faint)] transition-colors ${balance >= 0 ? 'group-hover:text-[var(--teal)]' : 'group-hover:text-[var(--expense-color)]'}`} />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden bg-[var(--app-bg)]">
        <div className="px-3 py-3 space-y-3">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPreviousMonth}
              className="h-9 w-9 rounded-lg bg-[var(--surface-hover)] border border-[var(--border-secondary)] text-[var(--text-primary)] hover:bg-[var(--border-secondary)] hover:text-[var(--text-primary)] transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <motion.div
              key={format(currentDate, 'yyyy-MM')}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                {format(currentDate, 'MMMM')}
              </h2>
              <p className="text-[10px] text-[var(--text-muted)]">{format(currentDate, 'yyyy')}</p>
            </motion.div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onNextMonth}
              className="h-9 w-9 rounded-lg bg-[var(--surface-hover)] border border-[var(--border-secondary)] text-[var(--text-primary)] hover:bg-[var(--border-secondary)] hover:text-[var(--text-primary)] transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-2.5"
          >
            <div className="grid grid-cols-3 gap-1">
              {/* Income */}
              <button
                onClick={() => setModalType('income')}
                className="flex items-center gap-2 bg-[var(--teal-bg)] hover:bg-[var(--teal-bg)] rounded-xl px-2.5 py-2 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--teal-bg)] flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-[var(--teal)]" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-[10px] text-[var(--text-muted)] leading-none">Income</p>
                  <p className="text-xs font-bold text-[var(--teal)] leading-tight truncate">
                    {formatCurrency(income, { compact: true })}
                  </p>
                </div>
              </button>

              {/* Expense */}
              <button
                onClick={() => setModalType('expense')}
                className="flex items-center gap-2 bg-[var(--expense-color)]/5 hover:bg-[var(--expense-color)]/10 rounded-xl px-2.5 py-2 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--expense-color)]/15 flex items-center justify-center shrink-0">
                  <TrendingDown className="w-4 h-4 text-[var(--expense-color)]" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-[10px] text-[var(--text-muted)] leading-none">Expense</p>
                  <p className="text-xs font-bold text-[var(--expense-color)] leading-tight truncate">
                    {formatCurrency(expense, { compact: true })}
                  </p>
                </div>
              </button>

              {/* Balance */}
              <button
                onClick={() => setModalType('all')}
                className={`flex items-center gap-2 rounded-xl px-2.5 py-2 transition-colors cursor-pointer ${balance >= 0 ? 'bg-[var(--teal-bg)] hover:bg-[var(--teal-bg)]' : 'bg-[var(--expense-color)]/5 hover:bg-[var(--expense-color)]/10'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${balance >= 0 ? 'bg-[var(--teal-bg)]' : 'bg-[var(--expense-color)]/15'}`}>
                  <Wallet className={`w-4 h-4 ${balance >= 0 ? 'text-[var(--teal)]' : 'text-[var(--expense-color)]'}`} />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-[10px] text-[var(--text-muted)] leading-none">Balance</p>
                  <p className={`text-xs font-bold leading-tight truncate ${balance >= 0 ? 'text-[var(--teal)]' : 'text-[var(--expense-color)]'}`}>
                    {formatCurrency(balance, { showSign: true, compact: true })}
                  </p>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Transaction List Modal */}
      <AnimatePresence>
        {modalType && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalType(null)}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-6 top-28 bottom-36 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg md:max-h-[80vh] z-50 flex flex-col bg-[var(--surface)] rounded-xl md:rounded-2xl overflow-hidden border border-[var(--border-main)] shadow-2xl"
            >
              {/* Header */}
              <div className="p-3 md:p-4 border-b border-[var(--border-main)] shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div
                      className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `color-mix(in srgb, var(${getModalColorVar()}) 12%, transparent)` }}
                    >
                      {modalType === 'income' && <TrendingUp className="w-4 h-4 md:w-5 md:h-5" style={{ color: `var(${getModalColorVar()})` }} />}
                      {modalType === 'expense' && <TrendingDown className="w-4 h-4 md:w-5 md:h-5" style={{ color: `var(${getModalColorVar()})` }} />}
                      {modalType === 'all' && <Wallet className="w-4 h-4 md:w-5 md:h-5" style={{ color: `var(${getModalColorVar()})` }} />}
                    </div>
                    <div>
                      <h3 className="text-sm md:text-lg font-bold text-[var(--text-primary)]">{getModalTitle()}</h3>
                      <p className="text-[10px] md:text-xs text-[var(--text-muted)]">{format(currentDate, 'MMMM yyyy')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setModalType(null)}
                    className="p-1.5 md:p-2 rounded-lg md:rounded-xl hover:bg-[var(--fill-subtle-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>

                {/* Total */}
                <div
                  className="mt-3 md:mt-4 p-2.5 md:p-3 rounded-lg md:rounded-xl flex items-center justify-between"
                  style={{ backgroundColor: `color-mix(in srgb, var(${getModalColorVar()}) 8%, transparent)` }}
                >
                  <div>
                    <span className="text-xs md:text-sm text-[var(--text-secondary)]">
                      {modalType === 'all' ? 'Net Balance' : `Total ${getModalTitle()}`}
                    </span>
                    <p className="text-[10px] md:text-xs text-[var(--text-muted)] mt-0.5">
                      {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="text-base md:text-xl font-bold" style={{ color: `var(${getModalColorVar()})` }}>
                    {modalType === 'all'
                      ? formatCurrency(getModalTotal(), { showSign: true })
                      : formatCurrency(getModalTotal())
                    }
                  </span>
                </div>
              </div>

              {/* Transaction List */}
              <div
                className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 scrollbar-hide"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {groupedTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-[var(--fill-subtle)] flex items-center justify-center mb-3 md:mb-4">
                      {modalType === 'income' && <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-[var(--text-faint)]" />}
                      {modalType === 'expense' && <TrendingDown className="w-6 h-6 md:w-8 md:h-8 text-[var(--text-faint)]" />}
                      {modalType === 'all' && <Wallet className="w-6 h-6 md:w-8 md:h-8 text-[var(--text-faint)]" />}
                    </div>
                    <p className="text-xs md:text-sm text-[var(--text-muted)]">No transactions yet</p>
                  </div>
                ) : (
                  groupedTransactions.map((group, groupIndex) => {
                    const dateObj = new Date(group.date);
                    const isTodayDate = isToday(dateObj);

                    return (
                    <div key={group.date}>
                      {/* Date Header */}
                      <div className="flex items-center gap-2 mb-1.5 md:mb-2">
                        <span className={`text-[10px] md:text-xs font-medium ${isTodayDate ? 'text-[var(--teal)]' : 'text-[var(--text-muted)]'}`}>
                          {isTodayDate ? 'Today' : format(dateObj, 'EEE, MMM d')}
                        </span>
                        {isTodayDate && (
                          <span className="text-[9px] md:text-[10px] px-1 py-0.5 rounded" style={{ color: 'var(--teal)', backgroundColor: 'var(--teal-bg)' }}>
                            {format(dateObj, 'MMM d')}
                          </span>
                        )}
                        <div className={`flex-1 h-px ${isTodayDate ? 'bg-[var(--teal-border)]' : 'bg-[var(--border-main)]'}`} />
                      </div>

                      {/* Transactions for this date */}
                      <div className="space-y-1.5 md:space-y-2">
                        {group.transactions.map((transaction, index) => {
                          const categoryInfo = transaction.category
                            ? getCategoryInfo(transaction.category, transaction.amount >= 0 ? 'income' : 'expense')
                            : null;
                          const isIncome = transaction.amount > 0;

                          return (
                            <motion.div
                              key={transaction.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: (groupIndex * 0.05) + (index * 0.02) }}
                              className={`flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg md:rounded-xl bg-[var(--fill-subtle)] hover:bg-[var(--fill-subtle-hover)] transition-colors ${
                                isTodayDate
                                  ? isIncome
                                    ? 'border border-[var(--teal-border)]'
                                    : 'border border-[var(--expense-border)]'
                                  : ''
                              }`}
                            >
                              {/* Category/Type Icon */}
                              <div
                                className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0"
                                style={{
                                  backgroundColor: categoryInfo
                                    ? `${categoryInfo.color}20`
                                    : isIncome ? 'var(--teal-bg)' : 'var(--expense-bg)'
                                }}
                              >
                                {transaction.isRecurring ? (
                                  <RefreshCw
                                    className="w-3.5 h-3.5 md:w-4 md:h-4"
                                    style={{ color: categoryInfo?.color || (isIncome ? 'var(--teal)' : 'var(--expense-color)') }}
                                  />
                                ) : isIncome ? (
                                  <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--teal)]" />
                                ) : (
                                  <TrendingDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--expense-color)]" />
                                )}
                              </div>

                              {/* Description & Category */}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs md:text-sm font-medium text-[var(--text-primary)] truncate">
                                  {transaction.description}
                                </p>
                                {categoryInfo && (
                                  <div className="flex items-center gap-1 md:gap-1.5 mt-0.5">
                                    <div
                                      className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full"
                                      style={{ backgroundColor: categoryInfo.color }}
                                    />
                                    <span className="text-[9px] md:text-[11px] text-[var(--text-muted)] truncate">
                                      {categoryInfo.label}
                                    </span>
                                    {transaction.isRecurring && (
                                      <span className="text-[8px] md:text-[10px] text-[var(--text-muted)] bg-[var(--fill-subtle)] px-1 py-0.5 rounded">
                                        Recurring
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Amount */}
                              <span className={`text-xs md:text-sm font-bold shrink-0 ${isIncome ? 'text-[var(--teal)]' : 'text-[var(--expense-color)]'}`}>
                                {isIncome ? '+ ' : '- '}{formatCurrency(Math.abs(transaction.amount))}
                              </span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});
