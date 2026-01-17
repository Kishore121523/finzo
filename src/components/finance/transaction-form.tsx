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
      status: '',
      isRecurring: false,
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
        
        setTransactionType(type);
        setDateValue(dateString);
        
        reset({
          description: transaction.description,
          amount: absAmount,
          date: transactionDate,
          status: transaction.status || '',
          isRecurring: transaction.isRecurring,
        });
      } else {
        // Adding new transaction - reset to defaults
        const newDate = defaultDate || new Date();
        const dateString = format(newDate, 'yyyy-MM-dd');
        
        setTransactionType('expense');
        setDateValue(dateString);
        
        reset({
          description: '',
          amount: 0,
          date: newDate,
          status: '',
          isRecurring: false,
        });
      }
    }
  }, [open, transaction, defaultDate, reset]);

  const handleFormSubmit = async (data: TransactionFormData) => {
    try {
      setLoading(true);
      // Convert amount based on transaction type
      const finalAmount = transactionType === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount);
      await onSubmit({ ...data, amount: finalAmount });
      reset();
      setTransactionType('expense'); // Reset to default
      onClose();
    } catch (error) {
      console.error('Error submitting transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setTransactionType('expense'); // Reset to default
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1E1E1E] border-[#2C2C2C] text-white max-w-[95vw] sm:max-w-lg p-0 gap-0 overflow-hidden" showCloseButton={false}>
        <DialogHeader className="p-5 md:p-6 border-b border-[#2C2C2C]">
          <DialogTitle className="text-2xl font-bold text-white">
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col">
          <div className="p-5 md:p-6 space-y-4">
            {/* Transaction Type Tabs */}
            <Tabs value={transactionType} onValueChange={(value) => setTransactionType(value as 'income' | 'expense')}>
              <TabsList className="grid w-full grid-cols-2 bg-[#252525] p-1.5 rounded-xl">
                <TabsTrigger value="income">Income</TabsTrigger>
                <TabsTrigger value="expense">Expense</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-white/70 text-sm">Description</Label>
              <Input
                id="description"
                {...register('description')}
                placeholder={transactionType === 'income' ? 'e.g., Salary, Freelance work' : 'e.g., Grocery shopping'}
                className="bg-[#252525] border-[#363636] text-white placeholder:text-white/40 focus:ring-0 focus:border-[#4C4C4C] focus-visible:ring-0 focus-visible:ring-offset-0 h-12 rounded-xl"
              />
              {errors.description && (
                <p className="text-sm text-[#CF6679] mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-white/70 text-sm">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...register('amount', { valueAsNumber: true })}
                placeholder="Enter amount"
                className="bg-[#252525] border-[#363636] text-white placeholder:text-white/40 focus:ring-0 focus:border-[#4C4C4C] focus-visible:ring-0 focus-visible:ring-offset-0 h-12 rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              {errors.amount && (
                <p className="text-sm text-[#CF6679] mt-1">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="date" className="text-white/70 text-sm">Date</Label>
              <Input
                id="date"
                type="date"
                value={dateValue}
                onChange={(e) => {
                  setDateValue(e.target.value);
                  setValue('date', new Date(e.target.value));
                }}
                className="bg-[#252525] border-[#363636] text-white focus:ring-0 focus:border-[#4C4C4C] focus-visible:ring-0 focus-visible:ring-offset-0 h-12 rounded-xl scheme-dark"
              />
              {errors.date && (
                <p className="text-sm text-[#CF6679] mt-1">{errors.date.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-white/70 text-sm">Status (optional)</Label>
              <Input
                id="status"
                {...register('status')}
                placeholder="e.g., Pending, Completed"
                className="bg-[#252525] border-[#363636] text-white placeholder:text-white/40 focus:ring-0 focus:border-[#4C4C4C] focus-visible:ring-0 focus-visible:ring-offset-0 h-12 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="isRecurring"
                type="checkbox"
                {...register('isRecurring')}
                className="h-5 w-5 rounded-md border-[#3C3C3C] bg-[#2C2C2C] text-[#03DAC6] focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <Label htmlFor="isRecurring" className="cursor-pointer text-white/70">
                Recurring transaction (repeats monthly)
              </Label>
            </div>
          </div>

          <DialogFooter className="p-5 md:p-6 border-t border-[#2C2C2C] flex gap-3">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1 bg-transparent border-[#3C3C3C] text-white hover:bg-white/5 hover:text-white h-12 rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-[#03DAC6] hover:bg-[#03DAC6]/90 text-black font-semibold h-12 rounded-xl">
              {loading ? 'Saving...' : transaction ? 'Update' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
