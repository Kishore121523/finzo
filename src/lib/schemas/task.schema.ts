import { z } from 'zod';
import { ExpenseCategory } from '@/lib/constants/categories';

export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  amount: z.number().positive('Amount must be greater than 0'),
  status: z.enum(['todo', 'in-progress', 'done']),
  category: z.custom<ExpenseCategory>().optional(),
});

export type TaskSchemaType = z.infer<typeof taskSchema>;
