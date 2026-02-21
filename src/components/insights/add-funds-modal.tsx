'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCurrency } from '@/components/providers/currency-provider';
import { SavingsGoal } from '@/lib/hooks/use-savings-goals';

interface AddFundsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: SavingsGoal | null;
  onAddFunds: (goalId: string, amount: number) => Promise<void>;
}

export function AddFundsModal({ open, onOpenChange, goal, onAddFunds }: AddFundsModalProps) {
  const [amount, setAmount] = useState('');
  const { formatCurrency } = useCurrency();

  if (!goal) return null;

  const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);
  const fraction = goal.targetAmount > 0 ? Math.min(goal.savedAmount / goal.targetAmount, 1) : 0;

  const quickAmounts = [
    { label: '+1K', value: 1000 },
    { label: '+5K', value: 5000 },
    { label: '+10K', value: 10000 },
    { label: 'Fill', value: remaining },
  ];

  const handleSave = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;
    setAmount('');
    onOpenChange(false);
    onAddFunds(goal.id, num);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setAmount(''); }}>
      <DialogContent
        showCloseButton={false}
        className="bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] flex flex-col p-0 gap-0 w-[calc(100%-2rem)] sm:max-w-sm"
      >
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
          <DialogTitle className="text-lg sm:text-xl text-[var(--text-primary)]">Add Funds</DialogTitle>
        </DialogHeader>

        <div className="px-4 sm:px-6 pb-4 space-y-4">
          {/* Goal info */}
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-1">{goal.name}</p>
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <span>{formatCurrency(goal.savedAmount)}</span>
              <span>/</span>
              <span>{formatCurrency(goal.targetAmount)}</span>
            </div>
            {/* Mini progress bar */}
            <div className="h-1.5 bg-[var(--fill-subtle)] rounded-full overflow-hidden mt-2">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${fraction * 100}%`, backgroundColor: goal.color }}
              />
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] mt-1">
              {formatCurrency(remaining)} remaining
            </p>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Amount</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-[var(--fill-subtle)] text-[var(--text-primary)] rounded-lg px-3 py-2.5 pl-3 text-sm border border-transparent focus:border-[var(--purple-color)] focus:outline-none transition-colors placeholder:text-[var(--text-faint)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Quick amounts */}
          <div className="flex gap-2">
            {quickAmounts.map(qa => (
              <button
                key={qa.label}
                onClick={() => setAmount(String(qa.value))}
                disabled={qa.value <= 0}
                className="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-[var(--fill-subtle)] text-[var(--text-secondary)] hover:bg-[var(--fill-subtle-hover)] hover:text-[var(--purple-color)] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {qa.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 pt-3 sm:pt-4 border-t border-[var(--border)]">
          <button
            onClick={() => { onOpenChange(false); setAmount(''); }}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--fill-subtle-hover)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!amount || parseFloat(amount) <= 0}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--purple-color)] text-[var(--app-bg)] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
          >
            Add Funds
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
