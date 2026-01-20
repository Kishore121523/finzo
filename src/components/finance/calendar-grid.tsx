'use client';

import { memo, useState, useMemo } from 'react';
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
import { Plus, ArrowUp, ArrowDown, TrendingUp, TrendingDown, RefreshCw, Edit, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/components/providers/currency-provider';
import { useTasks } from '@/lib/hooks/use-tasks';
import { getCategoryInfo } from '@/lib/constants/categories';

interface CalendarGridProps {
  currentDate: Date;
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onDeleteAllRecurring: (description: string, amount: number) => void;
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
          await onDeleteAllRecurring(transactionToDelete.description, transactionToDelete.amount);
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

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <div className="h-full flex flex-col p-2 sm:p-3 md:p-6 pb-6 sm:pb-8 md:pb-10 md:pt-3 bg-[#121212]">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-1 md:gap-2 mb-1.5 sm:mb-2">
          {weekDays.map((day, index) => (
            <div
              key={day}
              className="text-center text-[10px] sm:text-xs md:text-sm font-medium text-white/40 py-1 sm:py-2"
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-1 md:gap-2 flex-1 auto-rows-fr">
          {calendarDays.map((day, index) => {
            const hasActivity = day.transactions.length > 0;
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
                    ? hasActivity
                      ? netAmount >= 0
                        ? 'bg-[#1E1E1E] cursor-pointer border-[#2C2C2C] sm:border-[#03DAC6]/30'
                        : 'bg-[#1E1E1E] cursor-pointer border-[#2C2C2C] sm:border-[#CF6679]/30'
                      : 'bg-[#1E1E1E] cursor-pointer border-[#2C2C2C]'
                    : 'bg-[#0a0a0a]/50 cursor-default border-transparent'
                  }
                  ${isToday(day.date) ? 'ring-1 sm:ring-2 ring-[#03DAC6] ring-offset-1 ring-offset-[#121212]' : ''}
                  ${hasActivity && day.isCurrentMonth ? 'sm:hover:scale-[1.02] hover:shadow-lg hover:shadow-black/30' : ''}
                `}
              >
                {/* Mobile: Compact layout with date and net amount */}
                <div className="sm:hidden w-full h-full flex flex-col items-center justify-between py-0.5">
                  {/* Date at top */}
                  <span className={`
                    text-[11px] font-bold
                    ${day.isCurrentMonth ? 'text-white' : 'text-white/20'}
                    ${isToday(day.date) ? 'text-[#03DAC6]' : ''}
                  `}>
                    {format(day.date, 'd')}
                  </span>

                  {/* Net amount at bottom */}
                  {hasActivity && day.isCurrentMonth ? (
                    <div className="flex flex-col items-center">
                      {day.hasOverdue && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF5252] animate-pulse mb-0.5" />
                      )}
                      <span className={`text-[9px] font-bold ${netAmount >= 0 ? 'text-[#03DAC6]' : 'text-[#CF6679]'}`}>
                        {netAmount >= 0 ? '+' : ''}{formatCurrency(netAmount, { compact: true })}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[9px] text-transparent">-</span>
                  )}
                </div>

                {/* Desktop: Full layout */}
                <div className="hidden sm:flex w-full flex-col h-full justify-between">
                  {/* Top section: Date and indicators */}
                  <div className="w-full flex items-start justify-between">
                    <div className="flex items-center gap-1">
                      <span className={`
                        text-sm md:text-base font-bold
                        ${day.isCurrentMonth ? 'text-white' : 'text-white/20'}
                        ${isToday(day.date) ? 'text-[#03DAC6]' : ''}
                      `}>
                        {format(day.date, 'd')}
                      </span>
                      {day.hasOverdue && day.isCurrentMonth && (
                        <span className="w-2 h-2 rounded-full bg-[#FF5252] animate-pulse" />
                      )}
                    </div>

                    {hasActivity && day.isCurrentMonth && (
                      <div className="flex items-center gap-1.5 pt-1">
                        {day.income > 0 && (
                          <div className="flex items-center gap-0">
                            <ArrowUp className="w-3 h-3 text-[#03DAC6]" />
                            <span className="text-[10px] md:text-xs text-[#03DAC6] font-medium">
                              {formatCurrency(day.income, { compact: true })}
                            </span>
                          </div>
                        )}
                        {day.expense > 0 && (
                          <div className="flex items-center gap-0">
                            <ArrowDown className="w-3 h-3 text-[#CF6679]" />
                            <span className="text-[10px] md:text-xs text-[#CF6679] font-medium">
                              {formatCurrency(day.expense, { compact: true })}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bottom section: Net total and transaction count */}
                  {hasActivity && day.isCurrentMonth && (
                    <div className="w-full flex items-end justify-between">
                      <div className={`text-sm md:text-base font-bold ${netAmount >= 0 ? 'text-[#03DAC6]' : 'text-[#CF6679]'}`}>
                        {formatCurrency(Math.abs(netAmount), { compact: true })}
                      </div>
                      <div className="px-2 py-0.5 rounded-full bg-white/10">
                        <span className="text-[9px] md:text-[10px] text-white/60 font-medium">
                          {day.transactions.length} TXN
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Hover add button - only on non-touch devices */}
                {day.isCurrentMonth && (
                  <div className="absolute inset-0 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute inset-0 bg-[#2C2C2C]/65 rounded-xl" />
                    <Plus className="relative z-10 w-6 h-6 md:w-7 md:h-7 text-[#03DAC6]" />
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
              className="w-full max-w-lg bg-[#1E1E1E] border border-[#2C2C2C] rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 md:p-6 border-b border-[#2C2C2C]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white">
                      {format(selectedDay.date, 'EEEE')}
                    </h3>
                    <p className="text-white/50 text-sm mt-1">
                      {format(selectedDay.date, 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>

                {/* Day summary */}
                <div className="flex gap-4 mt-5">
                  <div className="flex-1 border border-[#03DAC6]/20 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#03DAC6]" />
                      <span className="text-xs text-white/60">Income</span>
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-[#03DAC6] mt-2">
                      {formatCurrency(selectedDay.income)}
                    </p>
                  </div>
                  <div className="flex-1 border border-[#CF6679]/20 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-[#CF6679]" />
                      <span className="text-xs text-white/60">Expense</span>
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-[#CF6679] mt-2">
                      {formatCurrency(selectedDay.expense)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transactions list */}
              <div className="p-5 md:p-6 max-h-[350px] overflow-y-auto">
                {selectedDay.transactions.length === 0 ? (
                  <div className="text-center py-2">
                    <p className="text-white/40 mb-4">No transactions for this day</p>
                    <Button
                      onClick={() => {
                        onAddForDate(selectedDay.date);
                        setSelectedDay(null);
                      }}
                      className="bg-[#03DAC6] hover:bg-[#03DAC6]/80 text-black"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Transaction
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDay.transactions.map((transaction, index) => {
                      const isOverdue = isTransactionOverdue(transaction);
                      return (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`
                          relative flex items-center justify-between p-4 rounded-xl
                          group hover:bg-[#2C2C2C] transition-colors overflow-hidden
                          ${isOverdue
                            ? 'bg-[#FF5252]/10 border border-[#FF5252]/40'
                            : 'bg-[#2C2C2C]/50 border border-[#3C3C3C]'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3 min-w-0 max-w-[65%]">
                          <div className={`
                            w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                            ${isOverdue
                              ? 'bg-[#FF5252]/20'
                              : transaction.amount >= 0 ? 'bg-[#03DAC6]/10' : 'bg-[#CF6679]/10'
                            }
                          `}>
                            {isOverdue ? (
                              <AlertCircle className="w-4 h-4 text-[#FF5252]" />
                            ) : transaction.isRecurring ? (
                              <RefreshCw className={`w-4 h-4 ${transaction.amount >= 0 ? 'text-[#03DAC6]' : 'text-[#CF6679]'}`} />
                            ) : transaction.amount >= 0 ? (
                              <TrendingUp className="w-4 h-4 text-[#03DAC6]" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-[#CF6679]" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-white truncate">
                                {transaction.description}
                              </p>
                              {isOverdue && (
                                <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-[#FF5252] text-white rounded">
                                  Overdue
                                </span>
                              )}
                            </div>
                            {transaction.category && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <div
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: getCategoryInfo(transaction.category, transaction.amount >= 0 ? 'income' : 'expense').color }}
                                />
                                <span className="text-xs text-white/50 truncate">
                                  {getCategoryInfo(transaction.category, transaction.amount >= 0 ? 'income' : 'expense').label}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-0 ml-auto">
                          <span className={`
                            text-sm font-semibold whitespace-nowrap transition-transform duration-200 ease-out
                            group-hover:-translate-x-16
                            ${transaction.amount >= 0 ? 'text-[#03DAC6]' : 'text-[#CF6679]'}
                          `}>
                            {transaction.amount >= 0 ? '+' : '-'}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </span>
                          <div className="flex gap-1 absolute right-4 translate-x-full opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-200 ease-out">
                            <button
                              onClick={() => {
                                onEdit(transaction);
                                setSelectedDay(null);
                              }}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(transaction)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-[#CF6679] hover:text-[#CF6679]/80 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {selectedDay.transactions.length > 0 && (
                <div className="p-5 md:p-6 border-t border-[#2C2C2C]">
                  <Button
                    onClick={() => {
                      onAddForDate(selectedDay.date);
                      setSelectedDay(null);
                    }}
                    className="w-full bg-[#03DAC6] hover:bg-[#03DAC6]/80 text-black py-3"
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
              className="w-full max-w-md bg-[#1E1E1E] border border-[#2C2C2C] rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 md:p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#CF6679]/10 flex items-center justify-center shrink-0">
                    <Trash2 className="w-6 h-6 text-[#CF6679]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Delete Transaction
                    </h3>
                    <p className="text-sm text-white/50">
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
                      className="flex-1 bg-[#2C2C2C] border border-[#3C3C3C] text-white/90 hover:bg-[#3C3C3C] hover:text-white h-12 rounded-xl transition-all duration-200"
                    >
                      This Month
                    </Button>
                    <Button
                      onClick={() => handleConfirmDelete(true)}
                      className="flex-1 bg-[#CF6679] hover:bg-[#CF6679]/80 text-white font-semibold h-12 rounded-xl transition-all duration-200"
                    >
                      All Occurrences
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleConfirmDelete(false)}
                    className="w-full bg-[#CF6679] hover:bg-[#CF6679]/80 text-white font-semibold h-12 rounded-xl transition-all duration-200"
                  >
                    Delete
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                    setTransactionToDelete(null);
                  }}
                  className="w-full bg-[#252525] border border-[#3C3C3C] text-white/50 hover:text-white hover:bg-[#2C2C2C] h-11 rounded-xl transition-all duration-200"
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
