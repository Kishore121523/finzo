'use client';

import { useMemo, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction } from '@/lib/types/transaction';
import { useCurrency } from '@/components/providers/currency-provider';

interface SpendingTrendProps {
  transactions: Transaction[];
  currentDate: Date;
}

export function SpendingTrend({ transactions, currentDate }: SpendingTrendProps) {
  const { formatCurrency } = useCurrency();
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const { dailyTotals, maxDaily, total } = useMemo(() => {
    const totals = new Array(daysInMonth).fill(0);

    transactions.forEach((t) => {
      if (t.amount >= 0) return;
      const d = t.date.toDate();
      const day = d.getDate();
      if (day >= 1 && day <= daysInMonth && d.getFullYear() === year && d.getMonth() === month) {
        totals[day - 1] += Math.abs(t.amount);
      }
    });

    const max = Math.max(...totals, 1);
    const totalVal = totals.reduce((s, v) => s + v, 0);
    return { dailyTotals: totals, maxDaily: max, total: totalVal };
  }, [transactions, daysInMonth, month, year]);

  const handleBarHover = useCallback((idx: number | null) => {
    setHoveredDay(idx);
  }, []);

  if (total === 0) {
    return (
      <div className="flex h-full items-center justify-center py-8">
        <p className="text-sm text-[var(--text-muted)]">No expenses this month</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative" ref={containerRef}>
      {/* Header — toggles between total and hovered day */}
      <div className="mb-3 shrink-0 flex items-center justify-end min-h-[20px]">
        <AnimatePresence mode="wait">
          {hoveredDay !== null ? (
            <motion.div
              key="hover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="flex items-center gap-2"
            >
              <span className="text-[10px] sm:text-xs text-[var(--text-muted)] tracking-wider font-medium">
                {currentDate.toLocaleString('default', { month: 'short' })} {hoveredDay + 1}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-[var(--expense-color)] tabular-nums">
                {dailyTotals[hoveredDay] > 0 ? formatCurrency(dailyTotals[hoveredDay]) : 'No spend'}
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="total"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="flex items-center gap-2"
            >
              <span className="text-[10px] sm:text-xs text-[var(--text-muted)] font-medium">
                Total Expense
              </span>
              <span className="text-xs sm:text-sm font-semibold text-[var(--expense-color)] tabular-nums">
                {formatCurrency(total, { compact: true })}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bar chart */}
      <div className="flex-1 flex items-end gap-[1px] sm:gap-[2px] min-h-0">
        {dailyTotals.map((val, i) => {
          const heightPct = maxDaily > 0 ? (val / maxDaily) * 100 : 0;
          const isHovered = hoveredDay === i;
          const isToday = isCurrentMonth && i === today.getDate() - 1;
          const isPast = isCurrentMonth ? i + 1 <= today.getDate() : true;
          const isFuture = isCurrentMonth && i + 1 > today.getDate();

          // Past zero-days show a tiny blip, future days show a dashed placeholder
          const minPct = val === 0 && isPast ? 2 : 0;
          const finalPct = Math.max(heightPct, minPct);

          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end cursor-pointer group relative"
              style={{ height: '100%' }}
              onMouseEnter={() => handleBarHover(i)}
              onMouseLeave={() => handleBarHover(null)}
            >
              {/* Today dot */}
              {isToday && (
                <div className="w-1 h-1 rounded-full bg-white mb-1 flex-shrink-0" />
              )}

              {isFuture ? (
                /* Future day placeholder — subtle dashed bar */
                <div
                  className="w-full rounded-t-sm transition-opacity duration-150"
                  style={{
                    height: '15%',
                    border: '1px dashed var(--text-muted)',
                    borderBottom: 'none',
                    opacity: isHovered ? 0.5 : 0.15,
                    minWidth: '2px',
                  }}
                />
              ) : (
                /* Past/today bar — solid */
                <motion.div
                  className="w-full rounded-t-sm"
                  style={{
                    backgroundColor: isToday ? '#ffffff' : 'var(--expense-color)',
                    opacity: isHovered ? 1 : 0.55,
                    boxShadow: isHovered || isToday
                      ? '0 0 10px var(--expense-color)'
                      : 'none',
                    minWidth: '2px',
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${finalPct}%` }}
                  transition={{
                    duration: 0.7,
                    delay: i * 0.018,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
