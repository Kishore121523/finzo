'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, getDaysInMonth, startOfMonth, getDay } from 'date-fns';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [viewDate, setViewDate] = useState(value);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = useMemo(() => getDaysInMonth(viewDate), [viewDate]);
  const firstDayOfMonth = useMemo(() => getDay(startOfMonth(viewDate)), [viewDate]);

  const handlePrevMonth = useCallback(() => {
    setViewDate(new Date(year, month - 1, 1));
  }, [year, month]);

  const handleNextMonth = useCallback(() => {
    setViewDate(new Date(year, month + 1, 1));
  }, [year, month]);

  const handleSelectDay = useCallback((day: number) => {
    const newDate = new Date(year, month, day);
    onChange(newDate);
    setViewDate(newDate);
  }, [year, month, onChange]);

  const handleSelectMonth = useCallback((monthIndex: number) => {
    setViewDate(new Date(year, monthIndex, 1));
    setShowMonthSelector(false);
  }, [year]);

  const handleSelectYear = useCallback((selectedYear: number) => {
    setViewDate(new Date(selectedYear, month, 1));
    setShowYearSelector(false);
  }, [month]);

  // Generate year options (current year +/- 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = currentYear - 5; y <= currentYear + 5; y++) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  // Generate days grid
  const daysGrid = useMemo(() => {
    const days = [];
    // Add empty slots for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    // Add the days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  }, [daysInMonth, firstDayOfMonth]);

  const isSelected = useCallback((day: number) => {
    return value.getDate() === day &&
           value.getMonth() === month &&
           value.getFullYear() === year;
  }, [value, month, year]);

  const isToday = useCallback((day: number) => {
    const today = new Date();
    return today.getDate() === day &&
           today.getMonth() === month &&
           today.getFullYear() === year;
  }, [month, year]);

  return (
    <div className="w-full bg-[var(--surface-elevated)] rounded-2xl border border-[var(--border-secondary)] p-4">
      {/* Header with month/year selectors */}
      <div className="flex items-center justify-between mb-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handlePrevMonth}
          className="h-8 w-8 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--fill-subtle)]"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          {/* Month selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowMonthSelector(!showMonthSelector);
                setShowYearSelector(false);
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--fill-subtle)] transition-colors"
            >
              {MONTHS[month]}
            </button>
            <AnimatePresence>
              {showMonthSelector && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-1 bg-[var(--surface)] border border-[var(--border-secondary)] rounded-xl shadow-xl z-10 p-2 grid grid-cols-3 gap-1 w-[200px]"
                >
                  {MONTHS.map((m, i) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectMonth(i)}
                      className={`px-2 py-1.5 text-xs rounded-lg transition-colors ${
                        i === month
                          ? 'bg-[var(--teal)] text-[var(--text-inverse)] font-medium'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--fill-subtle)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {m.slice(0, 3)}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Year selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowYearSelector(!showYearSelector);
                setShowMonthSelector(false);
              }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--fill-subtle)] transition-colors"
            >
              {year}
            </button>
            <AnimatePresence>
              {showYearSelector && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-1 bg-[var(--surface)] border border-[var(--border-secondary)] rounded-xl shadow-xl z-10 p-2 max-h-[200px] overflow-y-auto scrollbar-hide"
                >
                  {yearOptions.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => handleSelectYear(y)}
                      className={`w-full px-4 py-1.5 text-sm rounded-lg transition-colors ${
                        y === year
                          ? 'bg-[var(--teal)] text-[var(--text-inverse)] font-medium'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--fill-subtle)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          className="h-8 w-8 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--fill-subtle)]"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-medium text-[var(--text-muted)] py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysGrid.map((day, index) => (
          <div key={index} className="aspect-square">
            {day && (
              <button
                type="button"
                onClick={() => handleSelectDay(day)}
                className={`w-full h-full flex items-center justify-center text-sm rounded-lg transition-all ${
                  isSelected(day)
                    ? 'bg-[var(--teal)] text-[var(--text-inverse)] font-semibold'
                    : isToday(day)
                    ? 'bg-[var(--fill-subtle)] text-[var(--teal)] font-medium ring-1 ring-[var(--teal)]/50'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--fill-subtle)] hover:text-[var(--text-primary)]'
                }`}
              >
                {day}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Quick select for today */}
      <div className="mt-3 pt-3 border-t border-[var(--border-secondary)]">
        <button
          type="button"
          onClick={() => {
            const today = new Date();
            onChange(today);
            setViewDate(today);
          }}
          className="w-full py-2 text-sm font-medium text-[var(--teal)] rounded-lg hover:bg-[var(--teal-bg)] transition-colors"
        >
          Today
        </button>
      </div>
    </div>
  );
}
