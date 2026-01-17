'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { firestoreHelpers } from '@/lib/firebase/firestore';
import { Task, TaskFormData, TaskStatus } from '@/lib/types/task';
import { useAuth } from '@/components/providers/auth-provider';

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

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    getTasksByStatus,
  };
}
