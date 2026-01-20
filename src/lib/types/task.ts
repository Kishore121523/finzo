import { Timestamp } from 'firebase/firestore';
import { ExpenseCategory } from '@/lib/constants/categories';

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  amount: number; // Bill amount (always positive, stored as expense)
  category?: ExpenseCategory; // Category for the expense
  status: TaskStatus;
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // For bills auto-generated from recurring expenses
  linkedTransactionId?: string; // The recurring transaction template ID
  linkedMonth?: string; // The month this bill is for (e.g., "2025-02")
  dueDate?: Timestamp; // The due date from the transaction
  // Track if this one-time bill was added to calendar
  addedToCalendar?: boolean;
}

export interface TaskFormData {
  title: string;
  description?: string;
  amount: number;
  status: TaskStatus;
  category?: ExpenseCategory;
}
