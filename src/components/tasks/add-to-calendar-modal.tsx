'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Task } from '@/lib/types/task';
import { useCurrency } from '@/components/providers/currency-provider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CompactDatePicker } from '@/components/ui/compact-date-picker';
import { Label } from '@/components/ui/label';
import { CategorySelect } from '@/components/ui/category-select';
import { CalendarPlus, Receipt } from 'lucide-react';
import {
  EXPENSE_CATEGORY_GROUPS,
  DEFAULT_EXPENSE_CATEGORY,
  ExpenseCategory,
} from '@/lib/constants/categories';

interface AddToCalendarModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (date: Date, category: ExpenseCategory) => Promise<void>;
  task: Task | null;
}

export function AddToCalendarModal({
  open,
  onClose,
  onConfirm,
  task,
}: AddToCalendarModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>(DEFAULT_EXPENSE_CATEGORY);
  const { formatCurrency } = useCurrency();

  // Initialize category from task when modal opens
  useEffect(() => {
    if (task) {
      setCategory(task.category || DEFAULT_EXPENSE_CATEGORY);
    }
  }, [task]);

  const handleConfirm = async () => {
    if (!task) return;

    try {
      setLoading(true);
      await onConfirm(selectedDate, category);
      onClose();
    } catch (error) {
      console.error('Error adding to calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedDate(new Date());
    setCategory(DEFAULT_EXPENSE_CATEGORY);
    onClose();
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1E1E1E] border-[#2C2C2C] text-white max-w-[92vw] sm:max-w-md p-0 gap-0 rounded-xl sm:rounded-2xl overflow-hidden" showCloseButton={false}>
        <DialogHeader className="p-4 sm:p-5 md:p-6 border-b border-[#2C2C2C]">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#03DAC6]/20 flex items-center justify-center">
              <CalendarPlus className="h-4 w-4 sm:h-5 sm:w-5 text-[#03DAC6]" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold text-white">
                Add to Calendar
              </DialogTitle>
              <p className="text-xs sm:text-sm text-white/50 mt-0.5">
                Record this expense in your calendar
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
          {/* Bill Summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-[#252525] border border-[#363636]"
          >
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-md sm:rounded-lg bg-[#FF5252]/20 flex items-center justify-center shrink-0">
                <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-[#FF5252]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base text-white truncate">{task.title}</p>
                {task.description && (
                  <p className="text-[10px] sm:text-xs text-white/50 truncate">{task.description}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-sm sm:text-base text-[#FF5252]">
                  -{formatCurrency(task.amount || 0)}
                </p>
                <p className="text-[9px] sm:text-[10px] text-white/40 uppercase">Expense</p>
              </div>
            </div>
          </motion.div>

          {/* Date Picker */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm font-medium text-white/70">
              Select Date
            </Label>
            <CompactDatePicker
              value={selectedDate}
              onChange={setSelectedDate}
            />
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm font-medium text-white/70">
              Category
            </Label>
            <CategorySelect
              value={category}
              onValueChange={(value) => setCategory(value as ExpenseCategory)}
              categoryGroups={EXPENSE_CATEGORY_GROUPS}
              placeholder="Select category"
            />
          </div>
        </div>

        <DialogFooter className="p-4 sm:p-5 md:p-6 border-t border-[#2C2C2C] flex gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1 bg-transparent border-[#3C3C3C] text-white hover:bg-white/5 hover:text-white h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-[#03DAC6] hover:bg-[#03DAC6]/90 text-black font-semibold h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base"
          >
            {loading ? 'Adding...' : 'Add to Calendar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
