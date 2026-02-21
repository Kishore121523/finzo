'use client';

import { memo, useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction } from '@/lib/types/transaction';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  getDay,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { Plus, ArrowUp, ArrowDown, TrendingUp, TrendingDown, RefreshCw, Edit, Trash2, AlertCircle, PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/components/providers/currency-provider';
import { useTasks } from '@/lib/hooks/use-tasks';
import { getCategoryInfo } from '@/lib/constants/categories';

interface CalendarGridProps {
  currentDate: Date;
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onDeleteAllRecurring: (id: string) => void;
  onAddForDate: (date: Date) => void;
}

interface DayData {
  date: Date;
  transactions: Transaction[];
  income: number;
  expense: number;
  isCurrentMonth: boolean;
  hasOverdue: boolean;
  overdueTransactions: Transaction[];
}

export const CalendarGrid = memo(function CalendarGrid({
  currentDate,
  transactions,
  onEdit,
  onDelete,
  onDeleteAllRecurring,
  onAddForDate,
}: CalendarGridProps) {
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const { formatCurrency } = useCurrency();
  const { isTransactionOverdue } = useTasks();

  const handleDeleteClick = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async (deleteAll: boolean = false) => {
    if (transactionToDelete) {
      try {
        if (deleteAll && transactionToDelete.isRecurring) {
          await onDeleteAllRecurring(transactionToDelete.id);
        } else {
          await onDelete(transactionToDelete.id);
        }
      } catch (error) {
        console.error('Error deleting transaction:', error);
      } finally {
        // Close both modals and reset state
        setTransactionToDelete(null);
        setDeleteConfirmOpen(false);
        setSelectedDay(null); // Close the day detail modal too
      }
    }
  };

  // Generate calendar days including padding for previous/next month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    // Group transactions by date
    const transactionsByDate = transactions.reduce((acc, transaction) => {
      const dateKey = format(transaction.date.toDate(), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(transaction);
      return acc;
    }, {} as Record<string, Transaction[]>);

    return days.map(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const dayTransactions = transactionsByDate[dateKey] || [];

      const income = dayTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = dayTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      // Check for overdue recurring expenses
      const overdueTransactions = dayTransactions.filter(t => isTransactionOverdue(t));
      const hasOverdue = overdueTransactions.length > 0;

      return {
        date,
        transactions: dayTransactions,
        income,
        expense,
        isCurrentMonth: isSameMonth(date, currentDate),
        hasOverdue,
        overdueTransactions,
      };
    });
  }, [currentDate, transactions, isTransactionOverdue]);

  // Date Jump Shortcut: Shift + 1-31
  const inputBufferRef = useRef<string>('');
  const inputTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Check if it's a digit key with Shift pressed
      // Use e.code (e.g. "Digit1") because e.key returns shifted chars ("!" for Shift+1)
      const digitMatch = e.shiftKey && e.code ? e.code.match(/^Digit([0-9])$/) : null;
      if (digitMatch) {
        e.preventDefault();
        const digit = digitMatch[1];

        // Clear existing timeout
        if (inputTimeoutRef.current) {
          clearTimeout(inputTimeoutRef.current);
        }

        // Add to buffer
        inputBufferRef.current += digit;

        // Process buffer
        const processBuffer = () => {
          const dayNum = parseInt(inputBufferRef.current, 10);

          if (!isNaN(dayNum) && dayNum > 0 && dayNum <= 31) {
            // Find the day in the current month
            const targetDay = calendarDays.find(d =>
              d.isCurrentMonth && d.date.getDate() === dayNum
            );

            if (targetDay) {
              setSelectedDay(targetDay);
            }
          }

          // Reset buffer
          inputBufferRef.current = '';
        };

        // If buffer is 2 digits, process immediately. 
        // Or if > 3 (impossible for day), process immediately to clear.
        if (inputBufferRef.current.length >= 2) {
          processBuffer();
        } else {
          // Wait for potential second digit
          inputTimeoutRef.current = setTimeout(processBuffer, 250);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (inputTimeoutRef.current) {
        clearTimeout(inputTimeoutRef.current);
      }
    };
  }, [calendarDays]);

  // Keyboard navigation for selected day
  useEffect(() => {
    if (!selectedDay) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();

        const currentIndex = calendarDays.findIndex(d =>
          d.date.getTime() === selectedDay.date.getTime()
        );

        if (currentIndex > 0) {
          setSelectedDay(calendarDays[currentIndex - 1]);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();

        const currentIndex = calendarDays.findIndex(d =>
          d.date.getTime() === selectedDay.date.getTime()
        );

        if (currentIndex < calendarDays.length - 1) {
          setSelectedDay(calendarDays[currentIndex + 1]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedDay(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDay, calendarDays]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <div className="h-[65vh] sm:h-full flex flex-col p-3 sm:p-3 md:p-6 pb-6 sm:pb-8 md:pb-10 md:pt-3 bg-[var(--app-bg)]">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-1 md:gap-2 mb-1.5 sm:mb-2">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className="text-center text-[10px] sm:text-xs md:text-sm font-medium text-[var(--text-muted)] py-1 sm:py-2"
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-1 md:gap-2 flex-1 auto-rows-fr">
          {calendarDays.map((day, index) => {
            const realTransactions = day.transactions.filter(t => !t.goalId);
            const goalTransactions = day.transactions.filter(t => !!t.goalId);
            const hasActivity = day.transactions.length > 0;
            const hasRealActivity = realTransactions.length > 0;
            const hasOnlyGoals = goalTransactions.length > 0 && !hasRealActivity;
            const hasGoals = goalTransactions.length > 0;
            const netAmount = day.income - day.expense;
            const total = day.income + day.expense;
            const incomePercent = total > 0 ? (day.income / total) * 100 : 0;

            return (
              <motion.button
                key={day.date.toISOString()}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01, duration: 0.2 }}
                onClick={() => day.isCurrentMonth && setSelectedDay(day)}
                className={`
                  relative group rounded-lg sm:rounded-xl p-1.5 sm:p-2 md:p-3 min-h-[52px] sm:min-h-[80px] md:min-h-[100px]
                  flex flex-col items-center sm:items-start justify-between sm:justify-between overflow-hidden
                  transition-all duration-200 ease-out border
                  ${day.isCurrentMonth
                    ? hasRealActivity
                      ? netAmount >= 0
                        ? 'bg-[var(--surface)] cursor-pointer border-[var(--teal-border)]'
                        : 'bg-[var(--surface)] cursor-pointer border-[var(--expense-color)]/30'
                      : hasOnlyGoals
                        ? 'bg-[var(--surface)] cursor-pointer border-[var(--purple-color)]/25'
                        : 'bg-[var(--surface)] cursor-pointer border-[var(--border-main)]'
                    : 'bg-[var(--app-bg)]/50 cursor-default border-transparent'
                  }
                  ${''}
                  ${hasRealActivity && day.isCurrentMonth ? 'sm:hover:scale-[1.01] hover:shadow-sm' : ''}
                `}
              >
                {/* Mobile: Compact layout with date and net amount */}
                <div className="sm:hidden w-full h-full flex flex-col items-center justify-between py-0.5">
                  {/* Date at top */}
                  <div className="flex items-center gap-0.5">
                    <span className={`
                      text-[11px] font-bold
                      ${isToday(day.date) ? 'bg-[var(--teal)] text-[var(--text-inverse)] w-5 h-5 rounded-full flex items-center justify-center' : ''}
                      ${!isToday(day.date) && day.isCurrentMonth ? 'text-[var(--text-primary)]' : ''}
                      ${!isToday(day.date) && !day.isCurrentMonth ? 'text-[var(--text-faint)]' : ''}
                    `}>
                      {format(day.date, 'd')}
                    </span>
                    {hasGoals && day.isCurrentMonth && (
                      <span className="w-2 h-2 rounded-full bg-[var(--purple-color)] shrink-0" />
                    )}
                  </div>

                  {/* Net amount or goal indicator at bottom */}
                  {hasRealActivity && day.isCurrentMonth ? (
                    <div className="flex flex-col items-center">
                      {day.hasOverdue && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--error-color)] animate-pulse mb-0.5" />
                      )}
                      <span className={`text-[9px] font-bold ${netAmount >= 0 ? 'text-[var(--teal)]' : 'text-[var(--expense-color)]'}`}>
                        {netAmount >= 0 ? '+' : '-'}{formatCurrency(Math.abs(netAmount), { compact: true })}
                      </span>
                    </div>
                  ) : hasOnlyGoals && day.isCurrentMonth ? (
                    <PiggyBank className="w-3 h-3 text-[var(--purple-color)]" />
                  ) : (
                    <span className="text-[9px] text-transparent">-</span>
                  )}
                </div>

                {/* Desktop: Full layout */}
                <div className="hidden sm:flex w-full flex-col h-full">
                  {/* Top row: Date + TXN count */}
                  <div className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className={`
                        text-sm md:text-base font-bold
                        ${isToday(day.date) ? 'bg-[var(--teal)] text-[var(--text-inverse)] w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center' : ''}
                        ${!isToday(day.date) && day.isCurrentMonth ? 'text-[var(--text-primary)]' : ''}
                        ${!isToday(day.date) && !day.isCurrentMonth ? 'text-[var(--text-faint)]' : ''}
                      `}>
                        {format(day.date, 'd')}
                      </span>
                      {hasGoals && day.isCurrentMonth && (
                        <span className="w-2 h-2 rounded-full bg-[var(--purple-color)] shrink-0" />
                      )}
                      {day.hasOverdue && day.isCurrentMonth && (
                        <span className="w-2 h-2 rounded-full bg-[var(--error-color)] animate-pulse" />
                      )}
                    </div>
                    {hasActivity && day.isCurrentMonth && (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--fill-subtle)] text-[9px] md:text-[10px] text-[var(--text-secondary)] font-medium">
                        {day.transactions.length} txn
                      </span>
                    )}
                  </div>

                  {/* Net amount — pushed down */}
                  {hasRealActivity && day.isCurrentMonth ? (
                    <div className="flex-1 flex items-end justify-center">
                      <span className={`text-base md:text-lg font-bold ${netAmount >= 0 ? 'text-[var(--teal)]' : 'text-[var(--expense-color)]'}`}>
                        {netAmount >= 0 ? '+ ' : '- '}{formatCurrency(Math.abs(netAmount), { compact: true })}
                      </span>
                    </div>
                  ) : (
                    <div className="flex-1" />
                  )}
                </div>

                {/* Hover add button - only on non-touch devices */}
                {day.isCurrentMonth && (
                  <div className="absolute inset-0 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute inset-0 bg-[var(--surface-hover)]/65 rounded-xl" />
                    <Plus className="relative z-10 w-6 h-6 md:w-7 md:h-7 text-[var(--teal)]" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Day Detail Modal */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedDay(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              {/* Header */}
              <div className="p-5 md:p-6 border-b border-[var(--border-main)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                      {format(selectedDay.date, 'EEEE')}
                    </h3>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">
                      {format(selectedDay.date, 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>

                {/* Day summary */}
                <div className="flex gap-4 mt-5">
                  <div className="flex-1 border border-[var(--teal-border)] rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[var(--teal)]" />
                      <span className="text-xs text-[var(--text-secondary)]">Income</span>
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-[var(--teal)] mt-2">
                      {formatCurrency(selectedDay.income)}
                    </p>
                  </div>
                  <div className="flex-1 border border-[var(--expense-color)]/20 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-[var(--expense-color)]" />
                      <span className="text-xs text-[var(--text-secondary)]">Expense</span>
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-[var(--expense-color)] mt-2">
                      {formatCurrency(selectedDay.expense)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transactions list */}
              <div className="p-5 md:p-6 max-h-[350px] overflow-y-auto scrollbar-hide">
                {selectedDay.transactions.length === 0 ? (
                  <div className="text-center py-2">
                    <p className="text-[var(--text-muted)] mb-4">No transactions for this day</p>
                    <Button
                      onClick={() => {
                        onAddForDate(selectedDay.date);
                        setSelectedDay(null);
                      }}
                      className="bg-[var(--teal)] hover:bg-[var(--teal)]/80 text-[var(--text-inverse)]"
                    >
                      <Plus className="w-4 h-4 -mr-0.5" />
                      Add Transaction
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDay.transactions.map((transaction, index) => {
                      const isOverdue = isTransactionOverdue(transaction);
                      const isGoalFund = !!transaction.goalId;
                      return (
                        <motion.div
                          key={transaction.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={isGoalFund ? () => {
                            setSelectedDay(null);
                            window.dispatchEvent(new CustomEvent('open-goal-detail', { detail: { goalId: transaction.goalId } }));
                          } : undefined}
                          className={`
                          relative flex items-center justify-between p-4 rounded-xl
                          group hover:bg-[var(--surface-hover)] transition-colors overflow-hidden
                          ${isGoalFund ? 'cursor-pointer' : ''}
                          ${isOverdue
                              ? 'bg-[var(--error-color)]/10 border border-[var(--error-color)]/40'
                              : isGoalFund
                                ? 'border'
                                : 'bg-[var(--surface-hover)]/50 border border-[var(--border-secondary)]'
                            }
                        `}
                          style={isGoalFund ? {
                            backgroundColor: 'color-mix(in srgb, var(--purple-color) 6%, transparent)',
                            borderColor: 'color-mix(in srgb, var(--purple-color) 19%, transparent)',
                          } : undefined}
                        >
                          <div className="flex items-center gap-3 min-w-0 max-w-[65%]">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isGoalFund
                                  ? ''
                                  : isOverdue
                                    ? 'bg-[var(--error-color)]/20'
                                    : transaction.amount >= 0 ? 'bg-[var(--teal-bg)]' : 'bg-[var(--expense-color)]/10'
                              }`}
                              style={isGoalFund ? { backgroundColor: 'color-mix(in srgb, var(--purple-color) 13%, transparent)' } : undefined}
                            >
                              {isGoalFund ? (
                                <PiggyBank className="w-4 h-4 text-[var(--purple-color)]" />
                              ) : isOverdue ? (
                                <AlertCircle className="w-4 h-4 text-[var(--error-color)]" />
                              ) : transaction.isRecurring ? (
                                <RefreshCw className={`w-4 h-4 ${transaction.amount >= 0 ? 'text-[var(--teal)]' : 'text-[var(--expense-color)]'}`} />
                              ) : transaction.amount >= 0 ? (
                                <TrendingUp className="w-4 h-4 text-[var(--teal)]" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-[var(--expense-color)]" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                  {transaction.description}
                                </p>
                                {isOverdue && (
                                  <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-[var(--error-color)] text-[var(--text-primary)] rounded">
                                    Overdue
                                  </span>
                                )}
                              </div>
                              {isGoalFund ? (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <div
                                    className="w-2 h-2 rounded-full shrink-0 bg-[var(--purple-color)]"
                                  />
                                  <span className="text-xs text-[var(--text-secondary)] truncate">
                                    {transaction.goalName}
                                  </span>
                                </div>
                              ) : transaction.category ? (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <div
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: getCategoryInfo(transaction.category, transaction.amount >= 0 ? 'income' : 'expense').color }}
                                  />
                                  <span className="text-xs text-[var(--text-secondary)] truncate">
                                    {getCategoryInfo(transaction.category, transaction.amount >= 0 ? 'income' : 'expense').label}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex items-center gap-0 ml-auto">
                            {isGoalFund ? (
                              <span className="text-sm font-semibold whitespace-nowrap text-[var(--purple-color)]">
                                {formatCurrency(transaction.goalFundAmount!)}
                              </span>
                            ) : (
                              <>
                                <span className={`
                                text-sm font-semibold whitespace-nowrap transition-transform duration-200 ease-out
                                group-hover:-translate-x-16
                                ${transaction.amount >= 0 ? 'text-[var(--teal)]' : 'text-[var(--expense-color)]'}
                              `}>
                                  {transaction.amount >= 0 ? '+ ' : '- '}
                                  {formatCurrency(Math.abs(transaction.amount))}
                                </span>
                                <div className="flex gap-1 absolute right-4 translate-x-full opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-200 ease-out">
                                  <button
                                    onClick={() => {
                                      onEdit(transaction);
                                      setSelectedDay(null);
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-[var(--fill-subtle-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(transaction)}
                                    className="p-1.5 rounded-lg hover:bg-[var(--fill-subtle-hover)] text-[var(--expense-color)] hover:text-[var(--expense-color)]/80 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {selectedDay.transactions.length > 0 && (
                <div className="p-5 md:p-6 border-t border-[var(--border-main)]">
                  <Button
                    onClick={() => {
                      onAddForDate(selectedDay.date);
                      setSelectedDay(null);
                    }}
                    className="w-full bg-[var(--teal)] hover:bg-[var(--teal)]/80 text-[var(--text-inverse)] py-3"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Transaction
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmOpen && transactionToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setDeleteConfirmOpen(false);
              setTransactionToDelete(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 md:p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--expense-color)]/10 flex items-center justify-center shrink-0">
                    <Trash2 className="w-6 h-6 text-[var(--expense-color)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                      Delete Transaction
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {transactionToDelete.isRecurring
                        ? 'This is a recurring transaction. Do you want to delete just this month or all occurrences?'
                        : 'Are you sure you want to delete this transaction? This action cannot be undone.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 md:p-6 pt-0 flex flex-col gap-3">
                {transactionToDelete.isRecurring ? (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleConfirmDelete(false)}
                      className="flex-1 bg-[var(--surface-hover)] border border-[var(--border-secondary)] text-[var(--text-primary)]/90 hover:bg-[var(--border-secondary)] hover:text-[var(--text-primary)] h-12 rounded-xl transition-all duration-200"
                    >
                      This Month
                    </Button>
                    <Button
                      onClick={() => handleConfirmDelete(true)}
                      className="flex-1 bg-[var(--expense-color)] hover:bg-[var(--expense-color)]/80 text-(--text-primary) font-semibold h-12 rounded-xl transition-all duration-200"
                    >
                      All Occurrences
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleConfirmDelete(false)}
                    className="w-full bg-[var(--expense-color)] hover:bg-[var(--expense-color)]/80 text-[var(--text-primary)] font-semibold h-12 rounded-xl transition-all duration-200"
                  >
                    Delete
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                    setTransactionToDelete(null);
                  }}
                  className="w-full bg-[var(--surface-elevated)] border border-[var(--border-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] h-11 rounded-xl transition-all duration-200"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});
