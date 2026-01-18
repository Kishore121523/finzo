'use client';

import { useState } from 'react';
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
import { DatePicker } from '@/components/ui/date-picker';
import { CalendarPlus, Receipt } from 'lucide-react';

interface AddToCalendarModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => Promise<void>;
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
  const { formatCurrency } = useCurrency();

  const handleConfirm = async () => {
    if (!task) return;

    try {
      setLoading(true);
      await onConfirm(selectedDate);
      onClose();
    } catch (error) {
      console.error('Error adding to calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedDate(new Date());
    onClose();
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1E1E1E] border-[#2C2C2C] text-white max-w-[95vw] sm:max-w-md p-0 gap-0 overflow-hidden" showCloseButton={false}>
        <DialogHeader className="p-5 md:p-6 border-b border-[#2C2C2C]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#03DAC6]/20 flex items-center justify-center">
              <CalendarPlus className="h-5 w-5 text-[#03DAC6]" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">
                Add to Calendar
              </DialogTitle>
              <p className="text-sm text-white/50 mt-0.5">
                Record this expense in your calendar
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 md:p-6 space-y-4">
          {/* Bill Summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-[#252525] border border-[#363636]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FF5252]/20 flex items-center justify-center shrink-0">
                <Receipt className="h-5 w-5 text-[#FF5252]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{task.title}</p>
                {task.description && (
                  <p className="text-xs text-white/50 truncate">{task.description}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-[#FF5252]">
                  -{formatCurrency(task.amount || 0)}
                </p>
                <p className="text-[10px] text-white/40 uppercase">Expense</p>
              </div>
            </div>
          </motion.div>

          {/* Date Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">
              Select Date
            </label>
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
            />
          </div>
        </div>

        <DialogFooter className="p-5 md:p-6 border-t border-[#2C2C2C] flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1 bg-transparent border-[#3C3C3C] text-white hover:bg-white/5 hover:text-white h-12 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-[#03DAC6] hover:bg-[#03DAC6]/90 text-black font-semibold h-12 rounded-xl"
          >
            {loading ? 'Adding...' : 'Add to Calendar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
