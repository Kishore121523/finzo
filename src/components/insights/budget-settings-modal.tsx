'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EXPENSE_CATEGORY_GROUPS } from '@/lib/constants/categories';
import { Budgets } from '@/lib/hooks/use-budgets';

interface BudgetSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgets: Budgets;
  onSave: (budgets: Budgets) => Promise<void>;
  focusCategoryId?: string | null;
  focusCategoryAmount?: number;
}

export function BudgetSettingsModal({ open, onOpenChange, budgets, onSave, focusCategoryId, focusCategoryAmount }: BudgetSettingsModalProps) {
  const [totalMonthly, setTotalMonthly] = useState<string>('');
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const focusInputRef = useRef<HTMLInputElement>(null);
  const categoryRowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (open) {
      setTotalMonthly(budgets.totalMonthly != null ? String(budgets.totalMonthly) : '');
      const catBudgets: Record<string, string> = {};
      for (const [key, val] of Object.entries(budgets.categories)) {
        catBudgets[key] = String(val);
      }
      // Pre-add the focused category if not already budgeted
      if (focusCategoryId && !(focusCategoryId in catBudgets)) {
        catBudgets[focusCategoryId] = focusCategoryAmount != null ? String(focusCategoryAmount) : '';
      }
      setCategoryBudgets(catBudgets);
    }
  }, [open, budgets, focusCategoryId, focusCategoryAmount]);

  // Scroll to and focus the target category input after modal opens
  useEffect(() => {
    if (open && focusCategoryId) {
      const timer = setTimeout(() => {
        const row = categoryRowRefs.current[focusCategoryId];
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (focusInputRef.current) {
          focusInputRef.current.focus();
          focusInputRef.current.select();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [open, focusCategoryId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const total = totalMonthly.trim() ? parseFloat(totalMonthly) : null;
      const cats: Record<string, number> = {};
      for (const [key, val] of Object.entries(categoryBudgets)) {
        const num = parseFloat(val);
        if (!isNaN(num) && num > 0) {
          cats[key] = num;
        }
      }
      await onSave({
        totalMonthly: total && !isNaN(total) && total > 0 ? total : null,
        categories: cats,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save budgets:', error);
    } finally {
      setSaving(false);
    }
  };

  const addCategory = (catId: string) => {
    setCategoryBudgets(prev => ({ ...prev, [catId]: '' }));
  };

  const removeCategory = (catId: string) => {
    setCategoryBudgets(prev => {
      const next = { ...prev };
      delete next[catId];
      return next;
    });
  };

  const updateCategoryBudget = (catId: string, value: string) => {
    setCategoryBudgets(prev => ({ ...prev, [catId]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] max-h-[85vh] flex flex-col p-0 gap-0 w-[calc(100%-2rem)] sm:max-w-md"
      >
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
          <DialogTitle className="text-lg sm:text-xl text-[var(--text-primary)]">Budget Settings</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-2 scrollbar-hide">
          {/* Total Monthly Budget */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Total Monthly Budget
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm">
                ₹
              </span>
              <input
                type="number"
                value={totalMonthly}
                onChange={e => setTotalMonthly(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full bg-[var(--fill-subtle)] text-[var(--text-primary)] rounded-lg px-3 py-2.5 pl-7 text-sm border border-transparent focus:border-[var(--teal)] focus:outline-none transition-colors placeholder:text-[var(--text-faint)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Per-Category Budgets */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
              Category Budgets
            </label>
            <div className="space-y-4">
              {EXPENSE_CATEGORY_GROUPS.map(group => (
                <div key={group.name}>
                  <div className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    {group.name}
                  </div>
                  <div className="space-y-1.5">
                    {group.categories.map(cat => {
                      const id = cat.id;
                      const hasBudget = id in categoryBudgets;
                      const isFocusTarget = id === focusCategoryId;

                      return (
                        <motion.div
                          key={id}
                          layout
                          ref={el => { categoryRowRefs.current[id] = el; }}
                          className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-[var(--fill-subtle)] transition-colors ${isFocusTarget ? 'bg-[var(--fill-subtle)]' : ''}`}
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="flex-1 text-sm text-[var(--text-primary)] truncate">
                            {cat.label}
                          </span>
                          {hasBudget ? (
                            <>
                              <div className="relative w-24">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs">
                                  ₹
                                </span>
                                <input
                                  ref={isFocusTarget ? focusInputRef : undefined}
                                  type="number"
                                  value={categoryBudgets[id]}
                                  onChange={e => updateCategoryBudget(id, e.target.value)}
                                  placeholder="0"
                                  className="w-full bg-[var(--fill-subtle)] text-[var(--text-primary)] rounded-md px-2 py-1 pl-5 text-xs border border-transparent focus:border-[var(--teal)] focus:outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>
                              <button
                                onClick={() => removeCategory(id)}
                                className="p-1 rounded hover:bg-[var(--fill-subtle-hover)] text-[var(--text-muted)] hover:text-[#CF6679] transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => addCategory(id)}
                              className="p-1 rounded hover:bg-[var(--fill-subtle-hover)] text-[var(--text-muted)] hover:text-[var(--teal)] transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
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
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--teal)] text-[var(--app-bg)] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
