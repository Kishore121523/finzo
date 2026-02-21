'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  PiggyBank, Home, Car, Plane, GraduationCap,
  Heart, Gift, Briefcase, Smartphone, Star,
} from 'lucide-react';
import { SavingsGoal } from '@/lib/hooks/use-savings-goals';

const PRESET_COLORS = [
  { name: 'teal', hex: '#03DAC6' },
  { name: 'purple', hex: 'var(--purple-color)' },
  { name: 'coral', hex: '#FF6B6B' },
  { name: 'mint', hex: '#4ECDC4' },
  { name: 'gold', hex: '#FBBF24' },
  { name: 'sky', hex: '#38BDF8' },
  { name: 'pink', hex: '#F472B6' },
  { name: 'emerald', hex: '#34D399' },
  { name: 'orange', hex: '#FB923C' },
  { name: 'indigo', hex: '#818CF8' },
];

const PRESET_ICONS = [
  { key: 'PiggyBank', Icon: PiggyBank },
  { key: 'Home', Icon: Home },
  { key: 'Car', Icon: Car },
  { key: 'Plane', Icon: Plane },
  { key: 'GraduationCap', Icon: GraduationCap },
  { key: 'Heart', Icon: Heart },
  { key: 'Gift', Icon: Gift },
  { key: 'Briefcase', Icon: Briefcase },
  { key: 'Smartphone', Icon: Smartphone },
  { key: 'Star', Icon: Star },
];

interface GoalFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (goal: { name: string; targetAmount: number; deadline: string; color: string; icon: string }) => Promise<void>;
  editingGoal?: SavingsGoal | null;
}

export function GoalFormModal({ open, onOpenChange, onSave, editingGoal }: GoalFormModalProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0].hex);
  const [icon, setIcon] = useState(PRESET_ICONS[0].key);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (editingGoal) {
        setName(editingGoal.name);
        setTargetAmount(String(editingGoal.targetAmount));
        setDeadline(editingGoal.deadline);
        setColor(editingGoal.color);
        setIcon(editingGoal.icon);
      } else {
        setName('');
        setTargetAmount('');
        setDeadline('');
        setColor(PRESET_COLORS[0].hex);
        setIcon(PRESET_ICONS[0].key);
      }
      setErrors({});
    }
  }, [open, editingGoal]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    const amt = parseFloat(targetAmount);
    if (!targetAmount.trim() || isNaN(amt) || amt <= 0) errs.targetAmount = 'Enter a valid amount';
    if (!deadline) errs.deadline = 'Deadline is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const data = {
      name: name.trim(),
      targetAmount: parseFloat(targetAmount),
      deadline,
      color,
      icon,
    };
    onOpenChange(false);
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] max-h-[85vh] flex flex-col p-0 gap-0 w-[calc(100%-4rem)] sm:max-w-md"
      >
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
          <DialogTitle className="text-lg sm:text-xl text-[var(--text-primary)]">
            {editingGoal ? 'Edit Goal' : 'New Savings Goal'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-2 scrollbar-hide space-y-3">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Goal Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Trip to Japan"
              className="w-full bg-[var(--fill-subtle)] text-[var(--text-primary)] rounded-lg px-3 py-2.5 text-sm border border-transparent focus:border-[var(--purple-color)] focus:outline-none transition-colors placeholder:text-[var(--text-faint)]"
            />
            {errors.name && <p className="text-[11px] text-[#CF6679] mt-1">{errors.name}</p>}
          </div>

          {/* Target Amount */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Target Amount</label>
            <div className="relative">
              <input
                type="number"
                value={targetAmount}
                onChange={e => setTargetAmount(e.target.value)}
                placeholder="e.g. 200000"
                className="w-full bg-[var(--fill-subtle)] text-[var(--text-primary)] rounded-lg px-3 py-2.5 text-sm border border-transparent focus:border-[var(--purple-color)] focus:outline-none transition-colors placeholder:text-[var(--text-faint)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            {errors.targetAmount && <p className="text-[11px] text-[#CF6679] mt-1">{errors.targetAmount}</p>}
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-[var(--fill-subtle)] text-[var(--text-primary)] rounded-lg px-3 py-2.5 text-sm border border-transparent focus:border-[var(--purple-color)] focus:outline-none transition-colors [color-scheme:dark]"
            />
            {errors.deadline && <p className="text-[11px] text-[#CF6679] mt-1">{errors.deadline}</p>}
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c.hex}
                  onClick={() => setColor(c.hex)}
                  className="w-7 h-7 rounded-full transition-all cursor-pointer"
                  style={{
                    backgroundColor: c.hex,
                    boxShadow: color === c.hex ? `0 0 0 2px var(--surface), 0 0 0 4px ${c.hex}` : 'none',
                    opacity: color === c.hex ? 1 : 0.6,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_ICONS.map(({ key, Icon }) => (
                <button
                  key={key}
                  onClick={() => setIcon(key)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                  style={{
                    backgroundColor: icon === key ? `${color}20` : 'var(--fill-subtle)',
                    border: icon === key ? `1.5px solid ${color}` : '1.5px solid transparent',
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: icon === key ? color : 'var(--text-muted)' }} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 sm:p-6 pt-3 sm:pt-4 border-t border-[var(--border)]">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--fill-subtle-hover)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--purple-color)] text-[var(--app-bg)] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
          >
            {editingGoal ? 'Update' : 'Create'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
