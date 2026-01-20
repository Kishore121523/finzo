import { z } from 'zod';
import { Category } from '@/lib/constants/categories';

export const transactionSchema = z.object({
  description: z.string().min(1, 'Description is required').max(200, 'Description is too long'),
  amount: z.number()
    .refine((val) => !isNaN(val), 'Amount must be a valid number')
    .refine((val) => val !== 0, 'Amount cannot be zero')
    .refine((val) => Math.abs(val) <= 1000000000, 'Amount is too large'),
  date: z.date(),
  isRecurring: z.boolean().default(false),
  category: z.custom<Category>().optional(),
});

export type TransactionSchemaType = z.infer<typeof transactionSchema>;
