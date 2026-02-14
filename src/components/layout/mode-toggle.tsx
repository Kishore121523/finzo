'use client';

import { useMode } from '@/components/providers/mode-provider';
import { Button } from '@/components/ui/button';
import { Calendar, CreditCard, PieChart } from 'lucide-react';

export function ModeToggle() {
  const { mode, setMode } = useMode();

  return (
    <div className="flex items-center gap-0.5 sm:gap-1 rounded-lg sm:rounded-xl bg-[var(--surface-elevated)] p-0.5 sm:p-1">
      <Button
        variant={mode === 'finance' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setMode('finance')}
        className={`text-[11px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg transition-all duration-200 ${
          mode === 'finance'
            ? 'bg-[var(--teal)] text-[var(--text-inverse)] hover:bg-[var(--teal-hover)] font-semibold'
            : 'text-[var(--text-muted)] hover:bg-[var(--fill-subtle-hover)] hover:text-[var(--text-primary)]'
        }`}
      >
        <Calendar className="w-4 h-4 sm:mr-0" />
        <span className="hidden sm:inline">Calendar</span>
      </Button>
      <Button
        variant={mode === 'tasks' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setMode('tasks')}
        className={`text-[11px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg transition-all duration-200 ${
          mode === 'tasks'
            ? 'bg-[var(--teal)] text-[var(--text-inverse)] hover:bg-[var(--teal-hover)] font-semibold'
            : 'text-[var(--text-muted)] hover:bg-[var(--fill-subtle-hover)] hover:text-[var(--text-primary)]'
        }`}
      >
        <CreditCard className="w-4 h-4 sm:mr-0" />
        <span className="hidden sm:inline">Payments</span>
      </Button>
      <Button
        variant={mode === 'insights' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setMode('insights')}
        className={`text-[11px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg transition-all duration-200 ${
          mode === 'insights'
            ? 'bg-[var(--teal)] text-[var(--text-inverse)] hover:bg-[var(--teal-hover)] font-semibold'
            : 'text-[var(--text-muted)] hover:bg-[var(--fill-subtle-hover)] hover:text-[var(--text-primary)]'
        }`}
      >
        <PieChart className="w-4 h-4 sm:mr-0" />
        <span className="hidden sm:inline">Insights</span>
      </Button>
    </div>
  );
}
