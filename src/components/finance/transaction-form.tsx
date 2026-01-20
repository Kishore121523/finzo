'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Transaction, TransactionFormData } from '@/lib/types/transaction';
import { transactionSchema } from '@/lib/schemas/transaction.schema';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { CategorySelect } from '@/components/ui/category-select';
import {
  EXPENSE_CATEGORY_GROUPS,
  INCOME_CATEGORY_GROUPS,
  DEFAULT_EXPENSE_CATEGORY,
  DEFAULT_INCOME_CATEGORY,
  Category,
} from '@/lib/constants/categories';

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  transaction?: Transaction | null;
  defaultDate?: Date;
}

export function TransactionForm({
  open,
  onClose,
  onSubmit,
  transaction,
  defaultDate,
}: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [dateValue, setDateValue] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [category, setCategory] = useState<Category>(DEFAULT_EXPENSE_CATEGORY);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: '',
      amount: 0,
      date: defaultDate || new Date(),
      isRecurring: false,
      category: DEFAULT_EXPENSE_CATEGORY,
    },
  });

  useEffect(() => {
    if (open) {
      if (transaction) {
        // Editing existing transaction
        const absAmount = Math.abs(transaction.amount);
        const type = transaction.amount >= 0 ? 'income' : 'expense';
        const transactionDate = transaction.date.toDate();
        const dateString = format(transactionDate, 'yyyy-MM-dd');
        const existingCategory = transaction.category || (type === 'income' ? DEFAULT_INCOME_CATEGORY : DEFAULT_EXPENSE_CATEGORY);

        setTransactionType(type);
        setDateValue(dateString);
        setIsRecurring(transaction.isRecurring);
        setCategory(existingCategory);

        reset({
          description: transaction.description,
          amount: absAmount,
          date: transactionDate,
          isRecurring: transaction.isRecurring,
          category: existingCategory,
        });
      } else {
        // Adding new transaction - reset to defaults
        const newDate = defaultDate || new Date();
        const dateString = format(newDate, 'yyyy-MM-dd');

        setTransactionType('expense');
        setDateValue(dateString);
        setIsRecurring(false);
        setCategory(DEFAULT_EXPENSE_CATEGORY);

        reset({
          description: '',
          amount: 0,
          date: newDate,
          isRecurring: false,
          category: DEFAULT_EXPENSE_CATEGORY,
        });
      }
    }
  }, [open, transaction, defaultDate, reset]);

  const handleFormSubmit = async (data: TransactionFormData) => {
    try {
      setLoading(true);
      // Convert amount based on transaction type
      const finalAmount = transactionType === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount);
      await onSubmit({ ...data, amount: finalAmount, category });
      reset();
      setTransactionType('expense');
      setIsRecurring(false);
      setCategory(DEFAULT_EXPENSE_CATEGORY);
      onClose();
    } catch (error) {
      console.error('Error submitting transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setTransactionType('expense');
    setIsRecurring(false);
    setCategory(DEFAULT_EXPENSE_CATEGORY);
    onClose();
  };

  // Handle transaction type change - update category to appropriate default
  const handleTransactionTypeChange = (type: 'income' | 'expense') => {
    setTransactionType(type);
    // Reset to appropriate default category when switching types
    const newCategory = type === 'income' ? DEFAULT_INCOME_CATEGORY : DEFAULT_EXPENSE_CATEGORY;
    setCategory(newCategory);
    setValue('category', newCategory);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1E1E1E] border-[#2C2C2C] text-white max-w-[92vw] sm:max-w-lg p-0 gap-0 overflow-hidden rounded-xl sm:rounded-2xl" showCloseButton={false}>
        <DialogHeader className="p-4 sm:p-5 md:p-6 border-b border-[#2C2C2C]">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-white">
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col">
          <div className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
            {/* Transaction Type Tabs */}
            <Tabs value={transactionType} onValueChange={(value) => handleTransactionTypeChange(value as 'income' | 'expense')}>
              <TabsList className="grid w-full grid-cols-2 bg-[#252525] p-1 sm:p-1.5 rounded-lg sm:rounded-xl">
                <TabsTrigger value="income" className="text-xs sm:text-sm">Income</TabsTrigger>
                <TabsTrigger value="expense" className="text-xs sm:text-sm">Expense</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-1 sm:space-y-1.5">
              <Label htmlFor="description" className="text-white/70 text-xs sm:text-sm">Description</Label>
              <Input
                id="description"
                {...register('description')}
                placeholder={transactionType === 'income' ? 'e.g., Salary, Freelance work' : 'e.g., Grocery shopping'}
                className="bg-[#252525] border-[#363636] text-white placeholder:text-white/40 focus:ring-0 focus:border-[#4C4C4C] focus-visible:ring-0 focus-visible:ring-offset-0 h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base"
              />
              {errors.description && (
                <p className="text-xs sm:text-sm text-[#CF6679] mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <Label htmlFor="amount" className="text-white/70 text-xs sm:text-sm">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...register('amount', { valueAsNumber: true })}
                placeholder="Enter amount"
                className="bg-[#252525] border-[#363636] text-white placeholder:text-white/40 focus:ring-0 focus:border-[#4C4C4C] focus-visible:ring-0 focus-visible:ring-offset-0 h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              {errors.amount && (
                <p className="text-xs sm:text-sm text-[#CF6679] mt-1">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <Label htmlFor="date" className="text-white/70 text-xs sm:text-sm">Date</Label>
              <Input
                id="date"
                type="date"
                value={dateValue}
                onChange={(e) => {
                  setDateValue(e.target.value);
                  setValue('date', new Date(e.target.value));
                }}
                className="bg-[#252525] border-[#363636] text-white focus:ring-0 focus:border-[#4C4C4C] focus-visible:ring-0 focus-visible:ring-offset-0 h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base scheme-dark"
              />
              {errors.date && (
                <p className="text-xs sm:text-sm text-[#CF6679] mt-1">{errors.date.message}</p>
              )}
            </div>

            {/* Category Selector */}
            <div className="space-y-1 sm:space-y-1.5">
              <Label htmlFor="category" className="text-white/70 text-xs sm:text-sm">Category</Label>
              <CategorySelect
                value={category}
                onValueChange={(value) => {
                  setCategory(value);
                  setValue('category', value);
                }}
                categoryGroups={transactionType === 'income' ? INCOME_CATEGORY_GROUPS : EXPENSE_CATEGORY_GROUPS}
                placeholder="Select category"
              />
            </div>

            {/* Recurring Toggle */}
            <div
              onClick={() => {
                setIsRecurring(!isRecurring);
                setValue('isRecurring', !isRecurring);
              }}
              className={`
                relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl cursor-pointer
                transition-all duration-200 border sm:mt-5
                ${isRecurring
                  ? 'bg-[#03DAC6]/10 border-[#03DAC6]/40'
                  : 'bg-[#252525] border-[#363636] hover:border-[#4C4C4C]'
                }
              `}
            >
              <div className={`
                flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl
                transition-colors duration-200
                ${isRecurring ? 'bg-[#03DAC6]/20' : 'bg-[#1E1E1E]'}
              `}>
                <RefreshCw className={`
                  h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-200
                  ${isRecurring ? 'text-[#03DAC6]' : 'text-white/40'}
                `} />
              </div>
              <div className="flex-1">
                <p className={`font-medium text-xs sm:text-sm transition-colors duration-200 ${isRecurring ? 'text-white' : 'text-white/70'}`}>
                  Recurring Transaction
                </p>
                <p className="text-[10px] sm:text-xs text-white/40 mt-0.5">
                  Repeats on this day every month
                </p>
              </div>
              {/* Toggle Switch */}
              <div className={`
                relative w-10 h-6 sm:w-12 sm:h-7 rounded-full transition-colors duration-200
                ${isRecurring ? 'bg-[#03DAC6]' : 'bg-[#3C3C3C]'}
              `}>
                <div className={`
                  absolute top-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white shadow-md
                  transition-all duration-200 ease-out
                  ${isRecurring ? 'left-5 sm:left-6' : 'left-1'}
                `} />
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 sm:p-5 md:p-6 border-t border-[#2C2C2C] flex gap-2 sm:gap-3">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1 bg-transparent border-[#3C3C3C] text-white hover:bg-white/5 hover:text-white h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-[#03DAC6] hover:bg-[#03DAC6]/90 text-black font-semibold h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base">
              {loading ? 'Saving...' : transaction ? 'Update' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
