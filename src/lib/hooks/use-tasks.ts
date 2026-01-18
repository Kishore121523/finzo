'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  doc,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { firestoreHelpers } from '@/lib/firebase/firestore';
import { Task, TaskFormData, TaskStatus } from '@/lib/types/task';
import { Transaction } from '@/lib/types/transaction';
import { useAuth } from '@/components/providers/auth-provider';

// Helper to format year-month as string (e.g., "2025-02")
function formatYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const taskData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Task[];

        setTasks(taskData);
        setLoading(false);
      },
      (error) => {
        // Suppress permission errors (expected when user signs out)
        // Only log unexpected errors
        if (error.code !== 'permission-denied') {
          console.error('Firestore listener error:', error);
        }
        setTasks([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addTask = async (data: TaskFormData) => {
    if (!user) throw new Error('User not authenticated');

    // Get the highest order number for the status
    const tasksInStatus = tasks.filter((t) => t.status === data.status);
    const maxOrder = tasksInStatus.length > 0
      ? Math.max(...tasksInStatus.map((t) => t.order))
      : -1;

    await firestoreHelpers.addDocument('tasks', {
      userId: user.uid,
      title: data.title,
      description: data.description || '',
      status: data.status,
      order: maxOrder + 1,
      createdAt: firestoreHelpers.now(),
    });
  };

  const updateTask = async (id: string, data: Partial<TaskFormData>) => {
    if (!user) throw new Error('User not authenticated');

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;

    await firestoreHelpers.updateDocument('tasks', id, updateData);
  };

  const deleteTask = async (id: string) => {
    if (!user) throw new Error('User not authenticated');
    await firestoreHelpers.deleteDocument('tasks', id);
  };

  const reorderTasks = async (
    taskId: string,
    newStatus: TaskStatus,
    newOrder: number
  ) => {
    if (!user) throw new Error('User not authenticated');

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const batch = writeBatch(db);

    // If moving to a different status
    if (task.status !== newStatus) {
      // Update the moved task
      const taskRef = doc(db, 'tasks', taskId);
      batch.update(taskRef, {
        status: newStatus,
        order: newOrder,
        updatedAt: firestoreHelpers.now(),
      });

      // Reorder tasks in the new status
      const tasksInNewStatus = tasks
        .filter((t) => t.status === newStatus)
        .sort((a, b) => a.order - b.order);

      tasksInNewStatus.forEach((t, index) => {
        const adjustedOrder = index >= newOrder ? index + 1 : index;
        if (t.order !== adjustedOrder) {
          const ref = doc(db, 'tasks', t.id);
          batch.update(ref, { order: adjustedOrder, updatedAt: firestoreHelpers.now() });
        }
      });

      // Reorder remaining tasks in the old status
      const tasksInOldStatus = tasks
        .filter((t) => t.status === task.status && t.id !== taskId)
        .sort((a, b) => a.order - b.order);

      tasksInOldStatus.forEach((t, index) => {
        if (t.order !== index) {
          const ref = doc(db, 'tasks', t.id);
          batch.update(ref, { order: index, updatedAt: firestoreHelpers.now() });
        }
      });
    } else {
      // Reordering within the same status
      const tasksInStatus = tasks
        .filter((t) => t.status === task.status)
        .sort((a, b) => a.order - b.order);

      const oldIndex = tasksInStatus.findIndex((t) => t.id === taskId);

      tasksInStatus.forEach((t, index) => {
        let newOrderValue = index;

        if (index === oldIndex) {
          newOrderValue = newOrder;
        } else if (oldIndex < newOrder) {
          if (index > oldIndex && index <= newOrder) {
            newOrderValue = index - 1;
          }
        } else {
          if (index >= newOrder && index < oldIndex) {
            newOrderValue = index + 1;
          }
        }

        if (t.order !== newOrderValue) {
          const ref = doc(db, 'tasks', t.id);
          batch.update(ref, { order: newOrderValue, updatedAt: firestoreHelpers.now() });
        }
      });
    }

    await batch.commit();
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((t) => t.status === status).sort((a, b) => a.order - b.order);
  };

  // Get task linked to a specific transaction for a specific month
  const getTaskForTransaction = useCallback((transactionId: string, month: string): Task | undefined => {
    // Handle virtual transaction IDs (e.g., "abc123-2025-02")
    const baseTransactionId = transactionId.includes('-202')
      ? transactionId.split('-202')[0]
      : transactionId;

    return tasks.find(
      (t) => t.linkedTransactionId === baseTransactionId && t.linkedMonth === month
    );
  }, [tasks]);

  // Check if a recurring expense transaction is overdue
  // Overdue = date has passed AND no task is marked as done
  const isTransactionOverdue = useCallback((transaction: Transaction): boolean => {
    // Only check recurring expenses (negative amounts)
    if (!transaction.isRecurring || transaction.amount >= 0) {
      return false;
    }

    const transactionDate = transaction.date.toDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // If date hasn't passed, not overdue
    if (transactionDate >= today) {
      return false;
    }

    // Get the month for this transaction
    const month = formatYearMonth(transactionDate);

    // Get the base transaction ID (handle virtual IDs)
    const baseTransactionId = transaction.id.includes('-202')
      ? transaction.id.split('-202')[0]
      : transaction.id;

    // Find linked task
    const linkedTask = tasks.find(
      (t) => t.linkedTransactionId === baseTransactionId && t.linkedMonth === month
    );

    // Overdue if no task exists or task is not done
    return !linkedTask || linkedTask.status !== 'done';
  }, [tasks]);

  // Sync tasks from recurring expenses - creates ONE task per recurring expense (not per month)
  // Also resets tasks to "To Do" at the start of each new month
  const syncTasksFromRecurringExpenses = useCallback(async (
    recurringExpenses: Transaction[],
    currentMonth: string
  ) => {
    if (!user) return;

    // Query all existing finance-linked tasks
    const existingTasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      where('linkedTransactionId', '!=', null)
    );
    const existingTasksSnapshot = await getDocs(existingTasksQuery);

    // Map of linkedTransactionId -> task doc
    const existingTasksMap = new Map<string, { id: string; data: any }>();
    existingTasksSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.linkedTransactionId) {
        existingTasksMap.set(data.linkedTransactionId, { id: doc.id, data });
      }
    });

    const batch = writeBatch(db);
    let changes = 0;

    // Get current max order for new tasks
    const todoTasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      where('status', '==', 'todo')
    );
    const todoTasksSnapshot = await getDocs(todoTasksQuery);
    let maxOrder = -1;
    todoTasksSnapshot.docs.forEach(doc => {
      const order = doc.data().order || 0;
      if (order > maxOrder) maxOrder = order;
    });

    for (const expense of recurringExpenses) {
      // Only process recurring expenses (negative amounts)
      if (!expense.isRecurring || expense.amount >= 0) {
        continue;
      }

      // Get base transaction ID
      const baseTransactionId = expense.id.includes('-202')
        ? expense.id.split('-202')[0]
        : expense.id;

      // Calculate due date for current month
      const expenseDate = expense.date.toDate();
      const [year, month] = currentMonth.split('-').map(Number);
      const lastDayOfMonth = new Date(year, month, 0).getDate();
      const dayOfMonth = Math.min(expenseDate.getDate(), lastDayOfMonth);
      const dueDate = new Date(year, month - 1, dayOfMonth);

      const existingTask = existingTasksMap.get(baseTransactionId);

      if (existingTask) {
        // Task exists - check if we need to reset for new month
        const taskMonth = existingTask.data.linkedMonth;

        if (taskMonth !== currentMonth) {
          // New month - reset task to "To Do" and update due date
          const taskRef = doc(db, 'tasks', existingTask.id);
          batch.update(taskRef, {
            status: 'todo',
            linkedMonth: currentMonth,
            dueDate: Timestamp.fromDate(dueDate),
            updatedAt: firestoreHelpers.now(),
          });
          changes++;
        }
      } else {
        // Create new task (first time for this recurring expense)
        const taskRef = doc(collection(db, 'tasks'));
        batch.set(taskRef, {
          userId: user.uid,
          title: `Pay: ${expense.description}`,
          description: `Recurring expense of ${Math.abs(expense.amount).toLocaleString()}`,
          status: 'todo',
          order: maxOrder + 1 + changes,
          linkedTransactionId: baseTransactionId,
          linkedMonth: currentMonth,
          dueDate: Timestamp.fromDate(dueDate),
          createdAt: firestoreHelpers.now(),
          updatedAt: firestoreHelpers.now(),
        });
        changes++;
      }
    }

    if (changes > 0) {
      await batch.commit();
    }

    return changes;
  }, [user]);

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    getTasksByStatus,
    getTaskForTransaction,
    isTransactionOverdue,
    syncTasksFromRecurringExpenses,
  };
}
