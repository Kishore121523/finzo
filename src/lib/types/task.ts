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
}

export interface TaskFormData {
  title: string;
  description?: string;
  status: TaskStatus;
}
