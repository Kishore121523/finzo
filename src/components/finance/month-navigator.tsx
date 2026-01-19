'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrency } from '@/components/providers/currency-provider';

interface MonthNavigatorProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  balance: number;
  income?: number;
  expense?: number;
}

export const MonthNavigator = memo(function MonthNavigator({
  currentDate,
  onPreviousMonth,
  onNextMonth,
  balance,
  income = 0,
  expense = 0,
}: MonthNavigatorProps) {
  const { formatCurrency } = useCurrency();

  return (
    <div className="bg-linear-to-b from-[#0a0a0a] to-[#121212]">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 py-3 sm:py-4 md:py-6">
        <div>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPreviousMonth}
              className="h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg sm:rounded-xl bg-[#2C2C2C] border border-[#3C3C3C] text-white hover:bg-[#3C3C3C] hover:text-white transition-all"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </Button>

            <motion.div
              key={format(currentDate, 'yyyy-MM')}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                {format(currentDate, 'MMMM')}
              </h2>
              <p className="text-xs sm:text-sm text-white/40">{format(currentDate, 'yyyy')}</p>
            </motion.div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onNextMonth}
              className="h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg sm:rounded-xl bg-[#2C2C2C] border border-[#3C3C3C] text-white hover:bg-[#3C3C3C] hover:text-white transition-all"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </Button>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#03DAC6]" />
                <span className="text-[10px] sm:text-xs text-white/60">Income</span>
              </div>
              <p className="text-sm sm:text-lg md:text-xl font-bold text-[#03DAC6]">
                {formatCurrency(income, { compact: true })}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#CF6679]" />
                <span className="text-[10px] sm:text-xs text-white/60">Expense</span>
              </div>
              <p className="text-sm sm:text-lg md:text-xl font-bold text-[#CF6679]">
                {formatCurrency(expense, { compact: true })}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                <Wallet className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${balance >= 0 ? 'text-[#03DAC6]' : 'text-[#CF6679]'}`} />
                <span className="text-[10px] sm:text-xs text-white/60">Balance</span>
              </div>
              <p className={`text-sm sm:text-lg md:text-xl font-bold ${balance >= 0 ? 'text-[#03DAC6]' : 'text-[#CF6679]'}`}>
                {formatCurrency(balance, { showSign: true, compact: true })}
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
});
