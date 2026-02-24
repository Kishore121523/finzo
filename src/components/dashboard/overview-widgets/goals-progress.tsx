'use client';

import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import {
  PiggyBank, Home, Car, Plane, GraduationCap,
  Heart, Gift, Briefcase, Smartphone, Star,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  PiggyBank, Home, Car, Plane, GraduationCap, Heart, Gift, Briefcase, Smartphone, Star,
};

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  color: string;
  icon: string;
}

interface GoalsProgressProps {
  goals: Goal[];
  formatCurrency: (amount: number, options?: { compact?: boolean }) => string;
}

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

function daysUntil(deadline: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(deadline);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function GoalsProgress({ goals, formatCurrency }: GoalsProgressProps) {
  if (goals.length === 0) {
    return (
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('open-goals'))}
        className="flex h-full w-full flex-col items-center justify-center gap-2 py-8 text-[var(--text-muted)] hover:text-[var(--teal)] transition-colors cursor-pointer"
      >
        <Target className="h-8 w-8 opacity-40" />
        <span className="text-sm">Set up savings goals</span>
      </button>
    );
  }

  return (
    <div className="space-y-3">
      {goals.map((goal) => {
        const pct = goal.targetAmount > 0 ? (goal.savedAmount / goal.targetAmount) * 100 : 0;
        const days = daysUntil(goal.deadline);
        const Icon = ICON_MAP[goal.icon] || PiggyBank;

        return (
          <motion.button
            key={goal.id}
            variants={item}
            onClick={() => window.dispatchEvent(new CustomEvent('open-goals'))}
            className="flex w-full items-center gap-3 rounded-lg p-2 sm:p-2.5 hover:bg-[var(--fill-subtle)] transition-colors text-left cursor-pointer"
          >
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${goal.color}20` }}
            >
              <Icon className="h-4 w-4" style={{ color: goal.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm text-[var(--text-primary)] truncate">{goal.name}</span>
                <span className="text-[10px] sm:text-xs text-[var(--text-muted)] tabular-nums flex-shrink-0">
                  {days > 0 ? `${days}d left` : 'Overdue'}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-[var(--fill-subtle)] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: goal.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(pct, 100)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                  />
                </div>
                <span className="text-[10px] text-[var(--text-muted)] tabular-nums flex-shrink-0">
                  {pct.toFixed(0)}%
                </span>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
