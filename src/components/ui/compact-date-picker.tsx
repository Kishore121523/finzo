'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface CompactDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function CompactDatePicker({ value, onChange }: CompactDatePickerProps) {
  const [day, setDay] = useState(value.getDate());
  const [month, setMonth] = useState(value.getMonth());
  const [year, setYear] = useState(value.getFullYear());

  // Track animation keys - only increment when value actually changes
  const [dayKey, setDayKey] = useState(0);
  const [monthKey, setMonthKey] = useState(0);
  const [yearKey, setYearKey] = useState(0);

  // Track direction for animation
  const [dayDirection, setDayDirection] = useState<'up' | 'down'>('up');
  const [monthDirection, setMonthDirection] = useState<'up' | 'down'>('up');
  const [yearDirection, setYearDirection] = useState<'up' | 'down'>('up');

  const isInitialMount = useRef(true);

  // Update parent when values change (skip on initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const validDay = Math.min(day, daysInMonth);
    if (validDay !== day) {
      setDay(validDay);
      setDayKey(k => k + 1);
    }
    onChange(new Date(year, month, validDay));
  }, [day, month, year]);

  // Sync with external value changes
  useEffect(() => {
    const newDay = value.getDate();
    const newMonth = value.getMonth();
    const newYear = value.getFullYear();

    if (newDay !== day) {
      setDay(newDay);
      setDayKey(k => k + 1);
    }
    if (newMonth !== month) {
      setMonth(newMonth);
      setMonthKey(k => k + 1);
    }
    if (newYear !== year) {
      setYear(newYear);
      setYearKey(k => k + 1);
    }
  }, [value]);

  const getDaysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();

  const incrementDay = () => {
    const maxDays = getDaysInMonth(month, year);
    setDayDirection('up');
    if (day >= maxDays) {
      setDay(1);
      setDayKey(k => k + 1);
      // Roll over to next month
      setMonthDirection('up');
      if (month >= 11) {
        setMonth(0);
        setMonthKey(k => k + 1);
        setYearDirection('up');
        setYear(y => y + 1);
        setYearKey(k => k + 1);
      } else {
        setMonth(m => m + 1);
        setMonthKey(k => k + 1);
      }
    } else {
      setDay(d => d + 1);
      setDayKey(k => k + 1);
    }
  };

  const decrementDay = () => {
    setDayDirection('down');
    if (day <= 1) {
      // Roll over to previous month
      setMonthDirection('down');
      if (month <= 0) {
        const newYear = year - 1;
        const newMonth = 11;
        const maxDays = getDaysInMonth(newMonth, newYear);
        setDay(maxDays);
        setDayKey(k => k + 1);
        setMonth(newMonth);
        setMonthKey(k => k + 1);
        setYearDirection('down');
        setYear(newYear);
        setYearKey(k => k + 1);
      } else {
        const newMonth = month - 1;
        const maxDays = getDaysInMonth(newMonth, year);
        setDay(maxDays);
        setDayKey(k => k + 1);
        setMonth(newMonth);
        setMonthKey(k => k + 1);
      }
    } else {
      setDay(d => d - 1);
      setDayKey(k => k + 1);
    }
  };

  const incrementMonth = () => {
    setMonthDirection('up');
    if (month >= 11) {
      setMonth(0);
      setMonthKey(k => k + 1);
      setYearDirection('up');
      setYear(y => y + 1);
      setYearKey(k => k + 1);
    } else {
      setMonth(m => m + 1);
      setMonthKey(k => k + 1);
    }
  };

  const decrementMonth = () => {
    setMonthDirection('down');
    if (month <= 0) {
      setMonth(11);
      setMonthKey(k => k + 1);
      setYearDirection('down');
      setYear(y => y - 1);
      setYearKey(k => k + 1);
    } else {
      setMonth(m => m - 1);
      setMonthKey(k => k + 1);
    }
  };

  const incrementYear = () => {
    setYearDirection('up');
    setYear(y => y + 1);
    setYearKey(k => k + 1);
  };

  const decrementYear = () => {
    setYearDirection('down');
    setYear(y => y - 1);
    setYearKey(k => k + 1);
  };

  const DateColumn = ({
    value,
    animKey,
    direction,
    onIncrement,
    onDecrement,
    width = 'w-16'
  }: {
    value: string | number;
    animKey: number;
    direction: 'up' | 'down';
    onIncrement: () => void;
    onDecrement: () => void;
    width?: string;
  }) => (
    <div className={`flex flex-col items-center ${width}`}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={onIncrement}
        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-[#03DAC6]"
      >
        <ChevronUp className="w-5 h-5" />
      </motion.button>

      <div className="h-10 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={animKey}
            initial={{ opacity: 0, y: direction === 'up' ? 20 : -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: direction === 'up' ? -20 : 20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="text-2xl font-semibold text-white tabular-nums"
          >
            {value}
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={onDecrement}
        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-[#03DAC6]"
      >
        <ChevronDown className="w-5 h-5" />
      </motion.button>
    </div>
  );

  return (
    <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-[#252525] border border-[#363636]">
      {/* Day */}
      <DateColumn
        value={day.toString().padStart(2, '0')}
        animKey={dayKey}
        direction={dayDirection}
        onIncrement={incrementDay}
        onDecrement={decrementDay}
        width="w-14"
      />

      <span className="text-white/30 text-2xl font-light">/</span>

      {/* Month */}
      <DateColumn
        value={MONTHS[month]}
        animKey={monthKey}
        direction={monthDirection}
        onIncrement={incrementMonth}
        onDecrement={decrementMonth}
        width="w-16"
      />

      <span className="text-white/30 text-2xl font-light">/</span>

      {/* Year */}
      <DateColumn
        value={year}
        animKey={yearKey}
        direction={yearDirection}
        onIncrement={incrementYear}
        onDecrement={decrementYear}
        width="w-20"
      />
    </div>
  );
}
