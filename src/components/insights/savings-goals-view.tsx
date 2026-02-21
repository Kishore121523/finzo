'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Pencil, Trash2, Wallet,
  PiggyBank, Home, Car, Plane, GraduationCap,
  Heart, Gift, Briefcase, Smartphone, Star,
  TrendingUp, Check,
  GoalIcon,
} from 'lucide-react';
import { useCurrency } from '@/components/providers/currency-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { SavingsGoal } from '@/lib/hooks/use-savings-goals';
import { collection, query, where, onSnapshot } from '@/lib/firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Timestamp } from 'firebase/firestore';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  PiggyBank, Home, Car, Plane, GraduationCap,
  Heart, Gift, Briefcase, Smartphone, Star,
};

interface SavingsGoalsViewProps {
  goals: SavingsGoal[];
  onCreateGoal: () => void;
  onEditGoal: (goal: SavingsGoal) => void;
  onDeleteGoal: (id: string) => void;
  onAddFunds: (goal: SavingsGoal) => void;
  onRemoveFunds: (goalId: string, transactionId: string, fundAmount: number) => void;
  onEditFundEntry: (goalId: string, transactionId: string, oldAmount: number, newAmount: number) => void;
  initialGoalId?: string | null;
  onInitialGoalConsumed?: () => void;
}

interface FundEntry {
  id: string;
  date: Date;
  amount: number;
}

export function SavingsGoalsView({ goals, onCreateGoal, onEditGoal, onDeleteGoal, onAddFunds, onRemoveFunds, onEditFundEntry, initialGoalId, onInitialGoalConsumed }: SavingsGoalsViewProps) {
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const selectedGoal = useMemo(() => goals.find(g => g.id === selectedGoalId) ?? null, [goals, selectedGoalId]);

  // Deep-link: auto-select goal when opened from calendar
  useEffect(() => {
    if (initialGoalId && goals.length > 0) {
      setSelectedGoalId(initialGoalId);
      onInitialGoalConsumed?.();
    }
  }, [initialGoalId, goals, onInitialGoalConsumed]);

  // Fund history for selected goal
  const [fundHistory, setFundHistory] = useState<FundEntry[]>([]);

  // Edit fund modal state
  const [editModalEntry, setEditModalEntry] = useState<FundEntry | null>(null);
  const [editModalAmount, setEditModalAmount] = useState('');
  const [editModalSaving, setEditModalSaving] = useState(false);

  // Delete fund confirmation state
  const [deleteEntry, setDeleteEntry] = useState<FundEntry | null>(null);

  // Delete goal confirmation state
  const [deleteGoalConfirm, setDeleteGoalConfirm] = useState<SavingsGoal | null>(null);

  useEffect(() => {
    if (!selectedGoalId || !user) {
      setFundHistory([]);
      return;
    }

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      where('goalId', '==', selectedGoalId)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const entries: FundEntry[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
          amount: data.goalFundAmount ?? 0,
        };
      });
      entries.sort((a, b) => b.date.getTime() - a.date.getTime());
      setFundHistory(entries);
    });

    return unsub;
  }, [selectedGoalId, user]);

  const totalSaved = useMemo(() => goals.reduce((s, g) => s + g.savedAmount, 0), [goals]);
  const totalTarget = useMemo(() => goals.reduce((s, g) => s + g.targetAmount, 0), [goals]);
  const overallFraction = totalTarget > 0 ? Math.min(totalSaved / totalTarget, 1) : 0;

  const isGoalCompleted = (goal: SavingsGoal) => goal.targetAmount > 0 && goal.savedAmount >= goal.targetAmount;

  // Active goals sorted by progress (closest to completion first)
  const activeGoals = useMemo(() =>
    [...goals]
      .filter(g => !isGoalCompleted(g))
      .sort((a, b) => {
        const fracA = a.targetAmount > 0 ? a.savedAmount / a.targetAmount : 0;
        const fracB = b.targetAmount > 0 ? b.savedAmount / b.targetAmount : 0;
        return fracB - fracA;
      }),
    [goals]);

  // Completed goals
  const completedGoals = useMemo(() => goals.filter(g => isGoalCompleted(g)), [goals]);

  const getGoalDetails = (goal: SavingsGoal) => {
    const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);
    const fraction = goal.targetAmount > 0 ? Math.min(goal.savedAmount / goal.targetAmount, 1) : 0;
    const deadlineDate = new Date(goal.deadline + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysLeft = Math.max(Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)), 0);
    const monthsLeftExact = daysLeft / 30.44;
    const monthsLeft = Math.max(Math.ceil(monthsLeftExact), 1);
    const monthlyNeeded = remaining > 0 ? remaining / monthsLeft : 0;
    return { remaining, fraction, daysLeft, monthsLeft, monthlyNeeded };
  };

  const openEditModal = useCallback((entry: FundEntry) => {
    setEditModalEntry(entry);
    setEditModalAmount(entry.amount.toString());
  }, []);

  const closeEditModal = useCallback(() => {
    setEditModalEntry(null);
    setEditModalAmount('');
    setEditModalSaving(false);
  }, []);

  const confirmEditModal = useCallback(async () => {
    if (!editModalEntry || !selectedGoalId) return;
    const newAmount = parseFloat(editModalAmount);
    if (isNaN(newAmount) || newAmount <= 0) return;
    const { id, amount: oldAmount } = editModalEntry;
    const goalId = selectedGoalId;
    closeEditModal();
    onEditFundEntry(goalId, id, oldAmount, newAmount);
  }, [editModalEntry, editModalAmount, selectedGoalId, onEditFundEntry, closeEditModal]);

  const confirmDelete = useCallback(() => {
    if (!deleteEntry || !selectedGoalId) return;
    const { id, amount } = deleteEntry;
    const goalId = selectedGoalId;
    setDeleteEntry(null);
    onRemoveFunds(goalId, id, amount);
  }, [deleteEntry, selectedGoalId, onRemoveFunds]);

  const confirmDeleteGoal = useCallback(() => {
    if (!deleteGoalConfirm) return;
    const goalId = deleteGoalConfirm.id;
    setDeleteGoalConfirm(null);
    setSelectedGoalId(null);
    onDeleteGoal(goalId);
  }, [deleteGoalConfirm, onDeleteGoal]);

  return (
    <>
      {/* Summary Panel — Vertical bar chart */}
      <div className="w-80 sm:w-[420px] lg:w-[500px] shrink-0 flex flex-col items-center mt-8 md:mt-0">
        {goals.length > 0 ? (
          <div className="w-full h-full flex flex-col justify-center px-2">
            {/* Overall summary header */}
            <div className="flex items-center justify-between w-full mb-3 px-0 sm:px-2">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center bg-[#BB86FC1A]">
                  <TrendingUp className="w-3 h-3 sm:w-6 sm:h-6 text-[#BB86FC]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] sm:text-xs text-[var(--text-secondary)] uppercase tracking-[0.10em] font-semibold mb-0.5">Total Saved</span>
                  <div className="flex items-baseline gap-0.5 leading-none">
                    <span className="text-md sm:text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                      {formatCurrency(totalSaved)}
                    </span>
                    {totalTarget > 0 && (
                      <span className="text-[10px] sm:text-base font-medium text-[var(--text-secondary)] tabular-nums">
                        /{formatCurrency(totalTarget, { compact: true })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {totalTarget > 0 && (
                <span className="text-lg sm:text-2xl font-bold text-[#BB86FC] tabular-nums">
                  {Math.round(overallFraction * 100)}%
                </span>
              )}
            </div>

            {/* Vertical bar chart */}
            <div className="w-full flex items-end justify-center gap-6 sm:gap-10 h-[300px] sm:h-[320px] mb-5 sm:mb-0">
              {activeGoals.slice(0, 4).map((goal, index) => {
                const { fraction, remaining, daysLeft, monthlyNeeded } = getGoalDetails(goal);
                const GoalIcon = ICON_MAP[goal.icon] || PiggyBank;
                const pct = Math.round(fraction * 100);
                const BAR_HEIGHT = 180;
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
                    className="flex flex-col items-center cursor-pointer group relative"
                    onClick={() => setSelectedGoalId(goal.id)}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-[calc(100%-1.5rem)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-36 sm:w-40 bg-[#1e1e1e] backdrop-blur-md border border-[var(--border-main)] rounded-2xl p-3 shadow-2xl flex flex-col items-center">
                      <span className="text-[9px] sm:text-[10px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold mb-0.5">Remaining</span>
                      <span className="text-sm sm:text-base font-bold text-[var(--text-primary)] tabular-nums mb-2.5">
                        {formatCurrency(remaining)}
                      </span>

                      <div className="flex w-full justify-between border-t border-white/5 pt-2.5 px-1">
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] sm:text-[9px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Days</span>
                          <span className="text-xs font-semibold text-[var(--text-primary)] mt-0.5">{daysLeft}</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] sm:text-[9px] text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Monthly</span>
                          <span className="text-xs font-semibold text-[#BB86FC] mt-0.5">
                            {formatCurrency(monthlyNeeded, { compact: true })}
                          </span>
                        </div>
                      </div>

                      {/* Tooltip caret / arrow */}
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1e1e1e]/95 border-b border-r border-[var(--border-main)] rotate-45" />
                    </div>

                    {/* Percentage */}
                    <span className="text-sm sm:text-base font-bold tabular-nums mb-3" style={{ color: goal.color }}>
                      {pct}%
                    </span>

                    {/* Bar track */}
                    <div
                      className="w-16 sm:w-20 rounded-2xl overflow-hidden bg-[var(--surface-hover)] relative flex flex-col justify-end transition-transform group-hover:-translate-y-1 duration-300"
                      style={{ height: `${BAR_HEIGHT}px` }}
                    >
                      {/* Filled portion */}
                      <motion.div
                        className="w-full rounded-2xl relative"
                        style={{ backgroundColor: goal.color }}
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(fraction * 100, pct > 0 ? 6 : 0)}%` }}
                        transition={{ delay: index * 0.1 + 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>

                    {/* Label + Amounts */}
                    <div className="flex flex-col items-center mt-2.5 sm:mt-3 gap-1 w-full">
                      <span className="text-[10px] sm:text-xs text-[var(--text-primary)] font-semibold text-center leading-tight max-w-[80px] truncate">
                        {goal.name}
                      </span>
                      <span className="text-[6px] sm:text-[10px] text-[var(--text-primary)] tabular-nums text-center leading-tight">
                        {formatCurrency(goal.savedAmount, { compact: true })}<span className="text-[var(--text-secondary)]"> / {formatCurrency(goal.targetAmount, { compact: true })}</span>
                      </span>
                      <div
                        className="w-8 h-8 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300"
                        style={{ backgroundColor: `${goal.color}1A` }}
                      >
                        <GoalIcon className="w-4 h-4" style={{ color: goal.color }} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <button
            onClick={onCreateGoal}
            className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity py-12"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-[var(--text-faint)] flex items-center justify-center">
              <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--text-faint)]" />
            </div>
            <span className="text-xs sm:text-sm text-[var(--text-muted)]">No goals yet</span>
            <span className="text-xs sm:text-sm font-medium text-[var(--purple-color)]">Create your first goal</span>
          </button>
        )}
      </div>

      {/* Goals List Card */}
      <div
        className="w-[calc(100%-2rem)] max-w-full max-h-[40vh] sm:max-h-none sm:w-[480px] lg:w-[560px] sm:min-h-[440px] sm:h-[440px] lg:h-[560px] rounded-xl sm:rounded-2xl bg-[var(--surface)] p-3 sm:p-5 lg:p-6 flex flex-col relative overflow-hidden"
        style={{
          border: selectedGoal
            ? `1px solid ${selectedGoal.color}20`
            : `1px solid color-mix(in srgb, var(--purple-color) 12%, transparent)`,
          boxShadow: selectedGoal
            ? `0 0 40px ${selectedGoal.color}10, inset 0 1px 0 ${selectedGoal.color}10`
            : `0 0 40px color-mix(in srgb, var(--purple-color) 6%, transparent), inset 0 1px 0 color-mix(in srgb, var(--purple-color) 6%, transparent)`,
        }}
      >
        {/* Subtle gradient overlay */}
        <div
          className="absolute top-0 right-0 w-32 h-32 opacity-10 blur-3xl pointer-events-none transition-colors duration-300"
          style={{ background: selectedGoal ? selectedGoal.color : 'var(--purple-color)' }}
        />

        <AnimatePresence mode="wait">
          {selectedGoal ? (
            /* Goal Detail View */
            <motion.div
              key="goal-detail"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex flex-col flex-1 min-h-0 w-full min-w-0 overflow-hidden"
            >
              {(() => {
                const { remaining, fraction, daysLeft, monthsLeft, monthlyNeeded } = getGoalDetails(selectedGoal);
                const GoalIcon = ICON_MAP[selectedGoal.icon] || PiggyBank;
                const pct = Math.round(fraction * 100);
                return (
                  <>
                    {/* Header row: back + name + actions */}
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 min-w-0">
                      <button
                        onClick={() => setSelectedGoalId(null)}
                        className="p-1.5 sm:p-2 rounded-lg hover:bg-[var(--fill-subtle-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
                      >
                        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${selectedGoal.color}20` }}
                      >
                        <GoalIcon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: selectedGoal.color }} />
                      </div>
                      <h3 className="text-base sm:text-xl font-semibold text-[var(--text-primary)] flex-1 min-w-0 truncate">
                        {selectedGoal.name}
                      </h3>
                      {/* Mobile: edit/delete in header */}
                      <div className="flex gap-1.5 sm:hidden shrink-0">
                        <button
                          onClick={() => onEditGoal(selectedGoal)}
                          className="p-1.5 rounded-lg bg-[var(--fill-subtle)] text-[var(--text-secondary)] cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteGoalConfirm(selectedGoal)}
                          className="p-1.5 rounded-lg bg-[var(--fill-subtle)] text-[#CF6679] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress section — same on mobile and desktop, just sized differently */}
                    <div className="mb-3 sm:mb-4">
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-base sm:text-lg font-bold" style={{ color: selectedGoal.color }}>
                          {formatCurrency(selectedGoal.savedAmount)}
                        </span>
                        <span className="text-xs sm:text-sm text-[var(--text-muted)]">
                          of {formatCurrency(selectedGoal.targetAmount)}
                        </span>
                      </div>
                      <div className="h-2.5 sm:h-3 bg-[var(--fill-subtle)] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: selectedGoal.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${fraction * 100}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                      <div className="hidden sm:blocktext-right mt-1">
                        <span className="text-[10px] sm:text-xs text-[var(--text-muted)]">{pct}%</span>
                      </div>
                    </div>

                    {/* Stats — desktop: grid */}
                    <div className="hidden sm:grid grid-cols-6 gap-2 mb-4">
                      <div className="rounded-lg bg-[var(--fill-subtle)] p-2 col-span-2 ">
                        <span className="text-[10px] text-[var(--text-muted)] block">Remaining</span>
                        <span className="text-sm font-bold" style={{ color: selectedGoal.color }}>{formatCurrency(remaining)}</span>
                      </div>
                      <div className="rounded-lg bg-[var(--fill-subtle)] p-2 flex flex-col items-center">
                        <span className="text-[10px] text-[var(--text-muted)] mb-0.75">Days</span>
                        <span className="text-sm font-bold text-[var(--text-primary)]">{daysLeft}</span>
                      </div>
                      <div className="rounded-lg bg-[var(--fill-subtle)] p-2 flex flex-col items-center">
                        <span className="text-[10px] text-[var(--text-muted)] mb-0.75">Months</span>
                        <span className="text-sm font-bold text-[var(--text-primary)]">{monthsLeft}</span>
                      </div>
                      <div className="rounded-lg bg-[var(--fill-subtle)] p-2 col-span-2">
                        <span className="text-[10px] text-[var(--text-muted)] block">Save</span>
                        <span className="text-sm font-bold text-[var(--purple-color)]">{formatCurrency(monthlyNeeded)}<span className="text-[10px] text-[var(--text-muted)]">/mo</span></span>
                      </div>
                    </div>

                    {/* Stats — mobile: compact pill row */}
                    <div className="flex sm:hidden gap-1.5 mb-3">
                      <div className="shrink-0 rounded-lg bg-[var(--fill-subtle)] px-2.5 py-1.5 flex items-center gap-1.5">
                        <span className="text-[8px] text-[var(--text-muted)] uppercase tracking-wider">Left</span>
                        <span className="text-[11px] font-bold text-[var(--text-primary)] tabular-nums">{formatCurrency(remaining, { compact: true })}</span>
                      </div>
                      <div className="shrink-0 rounded-lg bg-[var(--fill-subtle)] px-2.5 py-1.5 flex items-center gap-1.5">
                        <span className="text-[8px] text-[var(--text-muted)] uppercase tracking-wider">{daysLeft}d</span>
                        <span className="text-[9px] text-[var(--text-faint)]">/</span>
                        <span className="text-[8px] text-[var(--text-muted)] uppercase tracking-wider">{monthsLeft}mo</span>
                      </div>
                      <div className="shrink-0 rounded-lg bg-[var(--fill-subtle)] px-2.5 py-1.5 flex items-center gap-1.5">
                        <span className="text-[8px] text-[var(--text-muted)] uppercase tracking-wider">Save</span>
                        <span className="text-[11px] font-bold text-[var(--purple-color)] tabular-nums">{formatCurrency(monthlyNeeded, { compact: true })} <span className="text-[8px] text-[var(--text-muted)]">/mo</span></span>
                      </div>
                    </div>

                    {/* Fund History */}
                    {fundHistory.length > 0 && (
                      <div className="flex-1 min-h-0 mb-4 sm:mb-4 flex flex-col">
                        <h4 className="text-[9px] sm:text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 sm:mb-3">
                          Fund History
                        </h4>
                        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-0.5 sm:space-y-1.5">
                          <AnimatePresence mode="popLayout">
                            {fundHistory.map((entry) => (
                              <motion.div
                                key={entry.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                                transition={{ duration: 0.2 }}
                                className="relative flex items-center gap-2 sm:gap-3 px-2 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl bg-[var(--fill-subtle)]/50 hover:bg-[var(--fill-subtle)] group/entry transition-colors overflow-hidden"
                              >
                                {/* Date */}
                                <div className="shrink-0">
                                  <span className="text-[10px] sm:text-xs text-[var(--text-muted)] tabular-nums">
                                    {entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>

                                {/* Amount */}
                                <span
                                  className="text-xs sm:text-base font-semibold tabular-nums whitespace-nowrap ml-auto sm:transition-transform sm:duration-200 sm:ease-out sm:group-hover/entry:-translate-x-16"
                                  style={{ color: selectedGoal.color }}
                                >
                                  {formatCurrency(entry.amount)}
                                </span>

                                {/* Mobile: always-visible actions */}
                                <div className="flex gap-1 sm:hidden shrink-0">
                                  <button
                                    onClick={() => openEditModal(entry)}
                                    className="p-1 rounded-md bg-[var(--fill-subtle)] text-[var(--text-secondary)] cursor-pointer"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteEntry(entry)}
                                    className="p-1 rounded-md bg-[var(--fill-subtle)] text-[#CF6679] cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>

                                {/* Desktop: slide-in actions on hover */}
                                <div className="hidden sm:flex gap-1 absolute right-4 translate-x-full opacity-0 group-hover/entry:translate-x-0 group-hover/entry:opacity-100 transition-all duration-200 ease-out">
                                  <button
                                    onClick={() => openEditModal(entry)}
                                    className="p-1.5 rounded-lg hover:bg-[var(--fill-subtle-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteEntry(entry)}
                                    className="p-1.5 rounded-lg hover:bg-[#CF6679]/10 text-[#CF6679] hover:text-[#CF6679]/80 cursor-pointer transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}

                    {/* Actions — mobile: just Add Funds full-width, desktop: full set */}
                    <div className="flex gap-2 mt-auto">
                      <button
                        onClick={() => onAddFunds(selectedGoal)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-medium bg-[var(--purple-color)] text-[var(--app-bg)] hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Add Funds
                      </button>
                      {/* Desktop: edit/delete buttons (mobile ones are in header) */}
                      <button
                        onClick={() => onEditGoal(selectedGoal)}
                        className="hidden sm:block px-3 py-3 rounded-xl text-sm font-medium bg-[var(--fill-subtle)] text-[var(--text-secondary)] hover:bg-[var(--fill-subtle-hover)] transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteGoalConfirm(selectedGoal)}
                        className="hidden sm:block px-3 py-3 rounded-xl text-sm font-medium bg-[var(--fill-subtle)] text-[#CF6679] hover:bg-[#CF6679]/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          ) : (
            /* Goals List */
            <motion.div
              key="goals-list"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex flex-col flex-1 min-h-0"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2.5 sm:mb-5">
                <h3 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">Goals</h3>
                <button
                  onClick={onCreateGoal}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-[var(--fill-subtle-hover)] text-[var(--purple-color)] transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Goal list */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-hide">
                {goals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-dashed border-[var(--text-faint)] flex items-center justify-center mb-3">
                      <PiggyBank className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--text-faint)]" />
                    </div>
                    <p className="text-sm text-[var(--text-muted)] mb-2">No goals yet</p>
                    <button
                      onClick={onCreateGoal}
                      className="text-sm font-medium text-[var(--purple-color)] hover:opacity-80 transition-opacity cursor-pointer"
                    >
                      Create your first goal
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1 sm:space-y-2">
                    {/* Active goals first */}
                    {activeGoals.map((goal, index) => {
                      const { fraction, daysLeft } = getGoalDetails(goal);
                      const GoalIcon = ICON_MAP[goal.icon] || PiggyBank;
                      return (
                        <motion.div
                          key={goal.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03, duration: 0.2 }}
                          className="rounded-lg sm:rounded-xl p-2 sm:p-4 hover:bg-[var(--fill-subtle)] transition-colors cursor-pointer"
                          onClick={() => setSelectedGoalId(goal.id)}
                        >
                          <div className="flex items-center gap-2 mb-1 sm:mb-2">
                            <div
                              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${goal.color}20` }}
                            >
                              <GoalIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: goal.color }} />
                            </div>
                            <span className="flex-1 text-[13px] sm:text-base text-[var(--text-primary)] truncate">
                              {goal.name}
                            </span>
                            <span className="text-[10px] sm:text-xs text-[var(--text-muted)] tabular-nums shrink-0">
                              {daysLeft}d left
                            </span>
                            <span className="hidden sm:inline text-sm tabular-nums font-medium text-[var(--text-secondary)]">
                              {formatCurrency(goal.savedAmount)}
                              <span className="text-[var(--text-faint)]"> / {formatCurrency(goal.targetAmount)}</span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between ml-8 mb-1 sm:hidden">
                            <span className="text-[11px] tabular-nums font-medium text-[var(--text-secondary)]">
                              {formatCurrency(goal.savedAmount)}
                              <span className="text-[var(--text-faint)]"> / {formatCurrency(goal.targetAmount)}</span>
                            </span>
                          </div>
                          <div className="h-1 sm:h-1.5 bg-[var(--fill-subtle)] rounded-full overflow-hidden ml-8 sm:ml-9">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: goal.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${fraction * 100}%` }}
                              transition={{ delay: index * 0.05 + 0.2, duration: 0.5, ease: 'easeOut' }}
                            />
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Completed goals */}
                    {completedGoals.length > 0 && (
                      <>
                        {activeGoals.length > 0 && (
                          <div className="flex items-center gap-2 pt-2 sm:pt-3 pb-1">
                            <div className="h-px flex-1 bg-[var(--border-main)]" />
                            <span className="text-[9px] sm:text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Completed</span>
                            <div className="h-px flex-1 bg-[var(--border-main)]" />
                          </div>
                        )}
                        {completedGoals.map((goal, index) => {
                          const GoalIcon = ICON_MAP[goal.icon] || PiggyBank;
                          return (
                            <motion.div
                              key={goal.id}
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: (activeGoals.length + index) * 0.03, duration: 0.2 }}
                              className="rounded-lg sm:rounded-xl p-2 sm:p-4 hover:bg-[var(--fill-subtle)] transition-colors cursor-pointer opacity-70"
                              onClick={() => setSelectedGoalId(goal.id)}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 relative"
                                  style={{ backgroundColor: `${goal.color}20` }}
                                >
                                  <GoalIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: goal.color }} />
                                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[var(--teal)] flex items-center justify-center">
                                    <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-[var(--app-bg)]" strokeWidth={3} />
                                  </div>
                                </div>
                                <span className="flex-1 text-[13px] sm:text-base text-[var(--text-primary)] truncate">
                                  {goal.name}
                                </span>
                                <span className="text-[10px] sm:text-xs font-semibold text-[var(--teal)] shrink-0 flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  Done
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Fund Amount Modal */}
      <AnimatePresence>
        {editModalEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={closeEditModal}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 12 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="w-full max-w-xs sm:max-w-sm bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-1">
                  Edit Amount
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] mb-4 sm:mb-5">
                  {editModalEntry.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>

                <div className="relative mb-4 sm:mb-5">
                  <label className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1.5">Amount</label>
                  <input
                    type="number"
                    value={editModalAmount}
                    onChange={(e) => setEditModalAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmEditModal();
                      if (e.key === 'Escape') closeEditModal();
                    }}
                    autoFocus
                    className="w-full bg-[var(--fill-subtle)] text-[var(--text-primary)] rounded-xl px-4 py-3 text-base sm:text-lg font-semibold border border-transparent focus:border-[var(--purple-color)] focus:outline-none transition-colors placeholder:text-[var(--text-faint)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    min="0.01"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="flex gap-3 p-5 sm:p-6 pt-0">
                <button
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl text-sm font-medium bg-[var(--fill-subtle)] text-[var(--text-secondary)] hover:bg-[var(--fill-subtle-hover)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmEditModal}
                  disabled={editModalSaving || !editModalAmount || parseFloat(editModalAmount) <= 0}
                  className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl text-sm font-medium bg-[var(--purple-color)] text-[var(--app-bg)] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                >
                  {editModalSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Fund Confirmation Modal */}
      <AnimatePresence>
        {deleteEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteEntry(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 12 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="w-full max-w-xs sm:max-w-sm bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#CF6679]/10 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#CF6679]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-1">
                      Remove Fund Entry
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                      Remove {formatCurrency(deleteEntry.amount)} saved on {deleteEntry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}? This will reduce the goal&apos;s saved amount.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-5 sm:p-6 pt-0">
                <button
                  onClick={() => setDeleteEntry(null)}
                  className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl text-sm font-medium bg-[var(--fill-subtle)] text-[var(--text-secondary)] hover:bg-[var(--fill-subtle-hover)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl text-sm font-medium bg-[#CF6679] text-[var(--text-primary)] hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Goal Confirmation Modal */}
      <AnimatePresence>
        {deleteGoalConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteGoalConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 12 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              className="w-full max-w-xs sm:max-w-sm bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#CF6679]/10 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#CF6679]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-1">
                      Delete Goal
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                      Delete <span className="font-medium text-[var(--text-primary)]">{deleteGoalConfirm.name}</span>? This will also remove all fund history linked to this goal. This cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-5 pt-0 sm:p-6 sm:pt-0">
                <button
                  onClick={() => setDeleteGoalConfirm(null)}
                  className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl text-sm font-medium bg-[var(--fill-subtle)] text-[var(--text-secondary)] hover:bg-[var(--fill-subtle-hover)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteGoal}
                  className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl text-sm font-medium bg-[#CF6679] text-[var(--text-primary)] hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
