'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Task, TaskFormData, TaskStatus } from '@/lib/types/task';
import { taskSchema } from '@/lib/schemas/task.schema';
import { useCurrency } from '@/components/providers/currency-provider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategorySelect } from '@/components/ui/category-select';
import { Circle, Clock, CheckCircle2 } from 'lucide-react';
import {
  EXPENSE_CATEGORY_GROUPS,
  DEFAULT_EXPENSE_CATEGORY,
  ExpenseCategory,
} from '@/lib/constants/categories';

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  task?: Task | null;
  defaultStatus?: TaskStatus;
}

export function TaskForm({
  open,
  onClose,
  onSubmit,
  task,
  defaultStatus = 'todo',
}: TaskFormProps) {
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>(DEFAULT_EXPENSE_CATEGORY);
  const { currency } = useCurrency();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      amount: 0,
      status: defaultStatus,
      category: DEFAULT_EXPENSE_CATEGORY,
    },
  });

  const status = watch('status');

  useEffect(() => {
    if (task) {
      const existingCategory = task.category || DEFAULT_EXPENSE_CATEGORY;
      setCategory(existingCategory);
      reset({
        title: task.title,
        description: task.description || '',
        amount: task.amount || 0,
        status: task.status,
        category: existingCategory,
      });
    } else {
      setCategory(DEFAULT_EXPENSE_CATEGORY);
      reset({
        title: '',
        description: '',
        amount: 0,
        status: defaultStatus,
        category: DEFAULT_EXPENSE_CATEGORY,
      });
    }
  }, [task, defaultStatus, reset]);

  const handleFormSubmit = async (data: TaskFormData) => {
    try {
      setLoading(true);
      await onSubmit({ ...data, category });
      reset();
      setCategory(DEFAULT_EXPENSE_CATEGORY);
      onClose();
    } catch (error) {
      console.error('Error submitting Payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setCategory(DEFAULT_EXPENSE_CATEGORY);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1E1E1E] border-[#2C2C2C] text-white max-w-[92vw] sm:max-w-lg p-0 gap-0 overflow-hidden rounded-xl sm:rounded-2xl" showCloseButton={false}>
        <DialogHeader className="p-4 sm:p-5 md:p-6 border-b border-[#2C2C2C]">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-white">
            {task ? 'Edit Payment' : 'Add Payment'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col">
          <div className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
            <div className="space-y-1 sm:space-y-1.5">
              <Label htmlFor="title" className="text-white/70 text-xs sm:text-sm">Description</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="What is this Payment for?"
                className="bg-[#252525] border-[#363636] text-white placeholder:text-white/40 focus:ring-0 focus:border-[#4C4C4C] focus-visible:ring-0 focus-visible:ring-offset-0 h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base"
              />
              {errors.title && (
                <p className="text-xs sm:text-sm text-[#CF6679] mt-1">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <Label htmlFor="amount" className="text-white/70 text-xs sm:text-sm">Amount ({currency.symbol})</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                {...register('amount', { valueAsNumber: true })}
                placeholder="0.00"
                className="bg-[#252525] border-[#363636] text-white placeholder:text-white/40 focus:ring-0 focus:border-[#4C4C4C] focus-visible:ring-0 focus-visible:ring-offset-0 h-10 sm:h-12 rounded-lg sm:rounded-xl text-base sm:text-lg font-medium"
              />
              {errors.amount && (
                <p className="text-xs sm:text-sm text-[#CF6679] mt-1">{errors.amount.message}</p>
              )}
            </div>

            {/* Category Selector */}
            <div className="space-y-1 sm:space-y-1.5">
              <Label htmlFor="category" className="text-white/70 text-xs sm:text-sm">Category</Label>
              <CategorySelect
                value={category}
                onValueChange={(value) => {
                  setCategory(value as ExpenseCategory);
                  setValue('category', value as ExpenseCategory);
                }}
                categoryGroups={EXPENSE_CATEGORY_GROUPS}
                placeholder="Select category"
              />
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <Label htmlFor="status" className="text-white/70 text-xs sm:text-sm">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setValue('status', value as TaskStatus)}
              >
                <SelectTrigger className="bg-[#252525] border-[#363636] text-white focus:ring-0 focus:ring-offset-0 h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-[#252525] border-[#363636] rounded-lg sm:rounded-xl">
                  <SelectItem value="todo" className="text-white hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white rounded-md sm:rounded-lg text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <Circle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/60" />
                      To Pay
                    </div>
                  </SelectItem>
                  <SelectItem value="in-progress" className="text-white hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white rounded-md sm:rounded-lg text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#03DAC6]" />
                      Processing
                    </div>
                  </SelectItem>
                  <SelectItem value="done" className="text-white hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white rounded-md sm:rounded-lg text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#4CAF50]" />
                      Paid
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-xs sm:text-sm text-[#CF6679] mt-1">{errors.status.message}</p>
              )}
            </div>
          </div>

          <DialogFooter className="p-4 sm:p-5 md:p-6 border-t border-[#2C2C2C] flex gap-2 sm:gap-3">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1 bg-transparent border-[#3C3C3C] text-white hover:bg-white/5 hover:text-white h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-[#03DAC6] hover:bg-[#03DAC6]/90 text-black font-semibold h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base">
              {loading ? 'Saving...' : task ? 'Update Payment' : 'Add Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
