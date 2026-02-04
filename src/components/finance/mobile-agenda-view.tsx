'use client';

import { memo, useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Transaction } from '@/lib/types/transaction';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  eachWeekOfInterval,
  isToday,
  isSameDay,
  isSameMonth,
} from 'date-fns';
import { Plus, TrendingUp, TrendingDown, RefreshCw, Edit, Trash2, AlertCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/components/providers/currency-provider';
import { useTasks } from '@/lib/hooks/use-tasks';
import { getCategoryInfo } from '@/lib/constants/categories';

interface MobileAgendaViewProps {
  currentDate: Date;
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onDeleteAllRecurring: (id: string) => void;
  onAddForDate: (date: Date) => void;
  onBottomSheetChange?: (isOpen: boolean) => void;
}

interface DayData {
  date: Date;
  transactions: Transaction[];
  income: number;
  expense: number;
  hasOverdue: boolean;
  isCurrentMonth: boolean;
}

// Day List Item Component
function DayListItem({
  day,
  index,
  isToday: isTodayDate,
  formatCurrency,
  onClick,
}: {
  day: DayData;
  index: number;
  isToday: boolean;
  formatCurrency: (amount: number, options?: { compact?: boolean }) => string;
  onClick: () => void;
}) {
  const hasTransactions = day.transactions.length > 0;
  const netAmount = day.income - day.expense;

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      disabled={!day.isCurrentMonth}
      className={`
        flex items-center justify-between w-full px-3 py-3 rounded-xl
        transition-all duration-200 cursor-pointer
        ${!day.isCurrentMonth
          ? 'opacity-30 cursor-default'
          : isTodayDate
            ? 'bg-[#03DAC6]/10 border border-[#03DAC6]/50'
            : hasTransactions
              ? 'bg-[#1E1E1E] border border-[#2C2C2C] hover:border-[#03DAC6]/30'
              : 'bg-[#1E1E1E]/50 border border-[#2C2C2C]/50 hover:bg-[#1E1E1E]'
        }
      `}
    >
      {/* Left: Date */}
      <div className={`
        w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0
        ${isTodayDate ? 'bg-[#03DAC6]/20' : 'bg-[#2C2C2C]/50'}
      `}>
        <span className={`text-[10px] font-semibold uppercase tracking-wide leading-none ${
          isTodayDate ? 'text-[#03DAC6]' : 'text-white/40'
        }`}>
          {format(day.date, 'EEE')}
        </span>
        <span className={`text-xl font-bold leading-tight ${
          isTodayDate
            ? 'text-[#03DAC6]'
            : day.isCurrentMonth
              ? 'text-white'
              : 'text-white/30'
        }`}>
          {format(day.date, 'd')}
        </span>
      </div>

      {/* Right: Amount or empty state */}
      {hasTransactions && day.isCurrentMonth ? (
        <div className="flex items-center gap-3">
          {day.hasOverdue && (
            <span className="w-2 h-2 rounded-full bg-[#FF5252] animate-pulse" />
          )}
          <span className="text-xs text-white/40">
            {day.transactions.length} txn
          </span>
          <span className={`text-sm font-bold ${
            netAmount >= 0 ? 'text-[#03DAC6]' : 'text-[#CF6679]'
          }`}>
            {netAmount >= 0 ? '+' : ''}{formatCurrency(netAmount, { compact: true })}
          </span>
        </div>
      ) : day.isCurrentMonth ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/30">Add</span>
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
            <Plus className="w-4 h-4 text-white/30" />
          </div>
        </div>
      ) : null}
    </motion.button>
  );
}

export const MobileAgendaView = memo(function MobileAgendaView({
  currentDate,
  transactions,
  onEdit,
  onDelete,
  onDeleteAllRecurring,
  onAddForDate,
  onBottomSheetChange,
}: MobileAgendaViewProps) {
  const { formatCurrency } = useCurrency();
  const { isTransactionOverdue } = useTasks();
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [dragDirection, setDragDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Notify parent when bottom sheet opens/closes
  useEffect(() => {
    onBottomSheetChange?.(selectedDay !== null);
  }, [selectedDay, onBottomSheetChange]);

  // Lock body scroll when bottom sheet is open
  useEffect(() => {
    if (selectedDay) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [selectedDay]);

  // Generate weeks for the month
  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    // Get all weeks that overlap with this month
    const weekStarts = eachWeekOfInterval(
      { start: monthStart, end: monthEnd },
      { weekStartsOn: 0 }
    );

    // Group transactions by date
    const transactionsByDate = transactions.reduce((acc, transaction) => {
      const dateKey = format(transaction.date.toDate(), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(transaction);
      return acc;
    }, {} as Record<string, Transaction[]>);

    return weekStarts.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

      return days.map(date => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const dayTransactions = transactionsByDate[dateKey] || [];

        const income = dayTransactions
          .filter(t => t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0);

        const expense = dayTransactions
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const hasOverdue = dayTransactions.some(t => isTransactionOverdue(t));

        return {
          date,
          transactions: dayTransactions,
          income,
          expense,
          hasOverdue,
          isCurrentMonth: isSameMonth(date, currentDate),
        };
      });
    });
  }, [currentDate, transactions, isTransactionOverdue]);

  // Find the week containing today or the 1st of the month
  useMemo(() => {
    const today = new Date();
    const targetDate = isSameMonth(today, currentDate) ? today : startOfMonth(currentDate);

    const weekIndex = weeks.findIndex(week =>
      week.some(day => isSameDay(day.date, targetDate))
    );

    if (weekIndex !== -1 && weekIndex !== currentWeekIndex) {
      setCurrentWeekIndex(weekIndex);
    }
  }, [currentDate]);

  const currentWeek = weeks[currentWeekIndex] || [];

  const handlePrevWeek = () => {
    if (currentWeekIndex > 0) {
      setDragDirection(-1);
      setCurrentWeekIndex(prev => prev - 1);
    }
  };

  const handleNextWeek = () => {
    if (currentWeekIndex < weeks.length - 1) {
      setDragDirection(1);
      setCurrentWeekIndex(prev => prev + 1);
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold && currentWeekIndex > 0) {
      setDragDirection(-1);
      setCurrentWeekIndex(prev => prev - 1);
    } else if (info.offset.x < -threshold && currentWeekIndex < weeks.length - 1) {
      setDragDirection(1);
      setCurrentWeekIndex(prev => prev + 1);
    }
  };

  const handleDayClick = (day: DayData) => {
    if (day.isCurrentMonth) {
      setSelectedDay(day);
    }
  };

  const handleDeleteClick = (transaction: Transaction, e: React.MouseEvent) => {
    e.stopPropagation();
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
        setTransactionToDelete(null);
        setDeleteConfirmOpen(false);
        // Update selected day transactions
        if (selectedDay) {
          const updatedTransactions = selectedDay.transactions.filter(t => t.id !== transactionToDelete.id);
          if (updatedTransactions.length === 0) {
            setSelectedDay(null);
          } else {
            setSelectedDay({
              ...selectedDay,
              transactions: updatedTransactions,
            });
          }
        }
      }
    }
  };

  // Get week range text
  const weekRangeText = useMemo(() => {
    if (currentWeek.length === 0) return '';
    const firstDay = currentWeek[0].date;
    const lastDay = currentWeek[6].date;

    if (format(firstDay, 'MMM') === format(lastDay, 'MMM')) {
      return `${format(firstDay, 'MMM d')} - ${format(lastDay, 'd')}`;
    }
    return `${format(firstDay, 'MMM d')} - ${format(lastDay, 'MMM d')}`;
  }, [currentWeek]);

  return (
    <>
      <div className="h-full flex flex-col bg-[#121212]" ref={containerRef}>
        {/* Week Navigation Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-[#2C2C2C]">
          <button
            onClick={handlePrevWeek}
            disabled={currentWeekIndex === 0}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              currentWeekIndex === 0
                ? 'text-white/20'
                : 'text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <p className="text-sm font-medium text-white">{weekRangeText}</p>
            <p className="text-[10px] text-white/40">Week {currentWeekIndex + 1} of {weeks.length}</p>
          </div>

          <button
            onClick={handleNextWeek}
            disabled={currentWeekIndex === weeks.length - 1}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              currentWeekIndex === weeks.length - 1
                ? 'text-white/20'
                : 'text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Week Carousel - Single column list layout */}
        <div className="flex-1 overflow-hidden px-4 py-2">
          <AnimatePresence mode="wait" custom={dragDirection}>
            <motion.div
              key={currentWeekIndex}
              custom={dragDirection}
              initial={{ opacity: 0, x: dragDirection * 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -dragDirection * 100 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="h-full flex flex-col gap-2 overflow-y-auto scrollbar-hide pb-8"
            >
              {currentWeek.map((day, index) => (
                <DayListItem
                  key={day.date.toISOString()}
                  day={day}
                  index={index}
                  isToday={isToday(day.date)}
                  formatCurrency={formatCurrency}
                  onClick={() => handleDayClick(day)}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Sheet for Day Details */}
      <AnimatePresence>
        {selectedDay && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDay(null)}
              className="fixed inset-0 z-50 bg-black/60"
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 right-0 z-50 bg-[#1E1E1E] rounded-t-3xl overflow-hidden"
              style={{ bottom: '70px', height: '60vh', maxHeight: '500px' }}
            >
              <div className="h-full flex flex-col">
                {/* Handle - draggable area */}
                <div
                  className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
                  onPointerDown={(e) => {
                    const startY = e.clientY;
                    const onMove = (moveEvent: PointerEvent) => {
                      const deltaY = moveEvent.clientY - startY;
                      if (deltaY > 100) {
                        setSelectedDay(null);
                        document.removeEventListener('pointermove', onMove);
                        document.removeEventListener('pointerup', onUp);
                      }
                    };
                    const onUp = () => {
                      document.removeEventListener('pointermove', onMove);
                      document.removeEventListener('pointerup', onUp);
                    };
                    document.addEventListener('pointermove', onMove);
                    document.addEventListener('pointerup', onUp);
                  }}
                >
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Header */}
                <div className="px-5 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {isToday(selectedDay.date) ? 'Today' : format(selectedDay.date, 'EEEE')}
                      </h3>
                      <p className="text-sm text-white/50">{format(selectedDay.date, 'MMMM d, yyyy')}</p>
                    </div>
                    <button
                      onClick={() => setSelectedDay(null)}
                      className="p-2 rounded-full hover:bg-white/10 text-white/60 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Add Transaction Button - Always at top as CTA */}
                  <Button
                    onClick={() => {
                      onAddForDate(selectedDay.date);
                      setSelectedDay(null);
                    }}
                    className="w-full bg-[#03DAC6] hover:bg-[#03DAC6]/80 text-black h-12 rounded-xl mt-4 font-semibold"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Transaction
                  </Button>
                </div>

                {/* Day summary - only if has transactions */}
                {selectedDay.transactions.length > 0 && (
                  <div className="px-5 pb-3 flex gap-3">
                    <div className="flex-1 bg-[#03DAC6]/10 rounded-xl p-3">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-[#03DAC6]" />
                        <span className="text-[10px] text-white/50">Income</span>
                      </div>
                      <p className="text-lg font-bold text-[#03DAC6] mt-1">
                        {formatCurrency(selectedDay.income)}
                      </p>
                    </div>
                    <div className="flex-1 bg-[#CF6679]/10 rounded-xl p-3">
                      <div className="flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5 text-[#CF6679]" />
                        <span className="text-[10px] text-white/50">Expense</span>
                      </div>
                      <p className="text-lg font-bold text-[#CF6679] mt-1">
                        {formatCurrency(selectedDay.expense)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Transactions List - Scrollable */}
                <div 
                  className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4 scrollbar-hide"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                {selectedDay.transactions.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-white/40">No transactions yet for this day</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-white/40 uppercase tracking-wide mb-2">
                      {selectedDay.transactions.length} Transaction{selectedDay.transactions.length > 1 ? 's' : ''}
                    </p>
                    {selectedDay.transactions.map((transaction, index) => {
                      const isOverdue = isTransactionOverdue(transaction);
                      const categoryInfo = transaction.category
                        ? getCategoryInfo(transaction.category, transaction.amount >= 0 ? 'income' : 'expense')
                        : null;

                      return (
                        <motion.div
                          key={transaction.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={`
                            flex items-center justify-between p-3 rounded-xl
                            ${isOverdue
                              ? 'bg-[#FF5252]/10 border border-[#FF5252]/30'
                              : 'bg-[#2C2C2C]/50'
                            }
                          `}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`
                              w-9 h-9 rounded-lg flex items-center justify-center shrink-0
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
                              <p className="text-sm font-medium text-white truncate">
                                {transaction.description}
                              </p>
                              {categoryInfo && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <div
                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                    style={{ backgroundColor: categoryInfo.color }}
                                  />
                                  <span className="text-[11px] text-white/40 truncate">
                                    {categoryInfo.label}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <span className={`text-sm font-semibold ${transaction.amount >= 0 ? 'text-[#03DAC6]' : 'text-[#CF6679]'}`}>
                              {transaction.amount >= 0 ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(transaction);
                                setSelectedDay(null);
                              }}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteClick(transaction, e)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-[#CF6679] cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmOpen && transactionToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-100 flex items-end justify-center p-4 bg-black/70"
            onClick={() => {
              setDeleteConfirmOpen(false);
              setTransactionToDelete(null);
            }}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm bg-[#1E1E1E] border border-[#2C2C2C] rounded-2xl shadow-2xl overflow-hidden mb-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#CF6679]/10 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5 text-[#CF6679]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-white mb-1">
                      Delete Transaction
                    </h3>
                    <p className="text-sm text-white/50">
                      {transactionToDelete.isRecurring
                        ? 'Delete just this month or all occurrences?'
                        : 'This action cannot be undone.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 flex flex-col gap-2">
                {transactionToDelete.isRecurring ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleConfirmDelete(false)}
                      className="flex-1 bg-[#2C2C2C] text-white/90 hover:bg-[#3C3C3C] h-11 rounded-xl"
                    >
                      This Month
                    </Button>
                    <Button
                      onClick={() => handleConfirmDelete(true)}
                      className="flex-1 bg-[#CF6679] hover:bg-[#CF6679]/80 text-white h-11 rounded-xl"
                    >
                      All
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleConfirmDelete(false)}
                    className="w-full bg-[#CF6679] hover:bg-[#CF6679]/80 text-white h-11 rounded-xl"
                  >
                    Delete
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                    setTransactionToDelete(null);
                  }}
                  className="w-full bg-[#252525] text-white/50 hover:text-white hover:bg-[#2C2C2C] h-10 rounded-xl"
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
