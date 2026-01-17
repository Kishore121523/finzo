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
      <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onPreviousMonth} 
            className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-[#2C2C2C] border border-[#3C3C3C] text-white hover:bg-[#3C3C3C] hover:text-white transition-all"
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
          
          <motion.div 
            key={format(currentDate, 'yyyy-MM')}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              {format(currentDate, 'MMMM')}
            </h2>
            <p className="text-sm text-white/40">{format(currentDate, 'yyyy')}</p>
          </motion.div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onNextMonth} 
            className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-[#2C2C2C] border border-[#3C3C3C] text-white hover:bg-[#3C3C3C] hover:text-white transition-all"
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {/* Income card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl p-3 md:p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-[#03DAC6]" />
              <span className="text-xs text-white/60">Income</span>
            </div>
            <p className="text-lg md:text-xl font-bold text-[#03DAC6]">
              {formatCurrency(income)}
            </p>
          </motion.div>

          {/* Expense card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl p-3 md:p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-[#CF6679]" />
              <span className="text-xs text-white/60">Expense</span>
            </div>
            <p className="text-lg md:text-xl font-bold text-[#CF6679]">
              {formatCurrency(expense)}
            </p>
          </motion.div>

          {/* Balance card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl p-3 md:p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <Wallet className={`w-4 h-4 ${balance >= 0 ? 'text-[#03DAC6]' : 'text-[#CF6679]'}`} />
              <span className="text-xs text-white/60">Balance</span>
            </div>
            <p className={`text-lg md:text-xl font-bold ${
              balance >= 0 ? 'text-[#03DAC6]' : 'text-[#CF6679]'
            }`}>
              {formatCurrency(balance, { showSign: true })}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
});
