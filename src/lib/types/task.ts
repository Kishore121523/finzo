import { Timestamp } from 'firebase/firestore';

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // For tasks auto-generated from recurring expenses
  linkedTransactionId?: string; // The recurring transaction template ID
  linkedMonth?: string; // The month this task is for (e.g., "2025-02")
  dueDate?: Timestamp; // The due date from the transaction
}

export interface TaskFormData {
  title: string;
  description?: string;
  status: TaskStatus;
}
