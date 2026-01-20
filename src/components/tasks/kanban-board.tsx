'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { KanbanColumn } from './kanban-column';
import { TaskCard } from './task-card';
import { TaskForm } from './task-form';
import { AddToCalendarModal } from './add-to-calendar-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Task, TaskStatus, TaskFormData } from '@/lib/types/task';
import { useTasks } from '@/lib/hooks/use-tasks';
import { useTransactions } from '@/lib/hooks/use-transactions';
import { ExpenseCategory } from '@/lib/constants/categories';

interface KanbanBoardProps {
  viewedDate: Date;
  onAddTransaction?: (data: { description: string; amount: number; date: Date }) => Promise<void>;
}

export function KanbanBoard({ viewedDate, onAddTransaction }: KanbanBoardProps) {
  const { tasks, loading, addTask, updateTask, deleteTask, reorderTasks, getTasksByStatus } =
    useTasks();
  const { addTransaction } = useTransactions(viewedDate);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [addToCalendarOpen, setAddToCalendarOpen] = useState(false);
  const [taskToAddToCalendar, setTaskToAddToCalendar] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      return;
    }

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) {
      setActiveTask(null);
      return;
    }

    // Check if dropped over a column (status)
    const overStatus = over.id as TaskStatus;
    if (['todo', 'in-progress', 'done'].includes(overStatus)) {
      const tasksInNewStatus = getTasksByStatus(overStatus);
      reorderTasks(activeTask.id, overStatus, tasksInNewStatus.length);
    } else {
      // Dropped over another task
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) {
        const tasksInStatus = getTasksByStatus(overTask.status);
        const overIndex = tasksInStatus.findIndex((t) => t.id === overTask.id);
        reorderTasks(activeTask.id, overTask.status, overIndex);
      }
    }

    setActiveTask(null);
  };

  const handleAddTask = useCallback((status: TaskStatus) => {
    setEditingTask(null);
    setDefaultStatus(status);
    setIsFormOpen(true);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  }, []);

  const handleSubmit = useCallback(async (data: TaskFormData) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await addTask(data);
    }
  }, [editingTask, updateTask, addTask]);

  const handleDeleteClick = useCallback((id: string) => {
    setTaskToDelete(id);
    setDeleteConfirmOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (taskToDelete) {
      try {
        await deleteTask(taskToDelete);
      } catch (error) {
        console.error('Error deleting bill:', error);
      } finally {
        setTaskToDelete(null);
        setDeleteConfirmOpen(false);
      }
    }
  }, [taskToDelete, deleteTask]);

  const handleAddToCalendarClick = useCallback((task: Task) => {
    setTaskToAddToCalendar(task);
    setAddToCalendarOpen(true);
  }, []);

  const handleConfirmAddToCalendar = useCallback(async (date: Date, category: ExpenseCategory) => {
    if (taskToAddToCalendar) {
      try {
        // Add transaction to calendar (as expense - negative amount)
        if (onAddTransaction) {
          await onAddTransaction({
            description: taskToAddToCalendar.title,
            amount: -(taskToAddToCalendar.amount || 0),
            date,
          });
        } else {
          await addTransaction({
            description: taskToAddToCalendar.title,
            amount: -(taskToAddToCalendar.amount || 0),
            date,
            isRecurring: false,
            category,
          });
        }
        // Delete the bill from kanban after adding to calendar
        await deleteTask(taskToAddToCalendar.id);
      } catch (error) {
        console.error('Error adding to calendar:', error);
      } finally {
        setTaskToAddToCalendar(null);
        setAddToCalendarOpen(false);
      }
    }
  }, [taskToAddToCalendar, addTransaction, deleteTask, onAddTransaction]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#121212]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-b-4 border-t-4 border-[#03DAC6]"></div>
          <p className="text-white/40 text-sm">Loading bills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#121212]">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mx-auto flex max-w-7xl gap-2 sm:gap-3 md:gap-5 px-2 sm:px-3 md:px-4 py-3 sm:py-4 md:py-6 overflow-x-auto h-full snap-x snap-mandatory sm:snap-none scrollbar-hide"
        >
          <KanbanColumn
            title="To Pay"
            status="todo"
            tasks={getTasksByStatus('todo')}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteClick}
            onAddToCalendar={handleAddToCalendarClick}
            viewedDate={viewedDate}
          />
          <KanbanColumn
            title="Processing"
            status="in-progress"
            tasks={getTasksByStatus('in-progress')}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteClick}
            onAddToCalendar={handleAddToCalendarClick}
            viewedDate={viewedDate}
          />
          <KanbanColumn
            title="Paid"
            status="done"
            tasks={getTasksByStatus('done')}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteClick}
            onAddToCalendar={handleAddToCalendarClick}
            viewedDate={viewedDate}
          />
        </motion.div>

        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="rotate-2 scale-105">
              <TaskCard
                task={activeTask}
                onEdit={() => {}}
                onDelete={() => {}}
                isDragOverlay
                viewedDate={viewedDate}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        task={editingTask}
        defaultStatus={defaultStatus}
      />

      <AddToCalendarModal
        open={addToCalendarOpen}
        onClose={() => {
          setAddToCalendarOpen(false);
          setTaskToAddToCalendar(null);
        }}
        onConfirm={handleConfirmAddToCalendar}
        task={taskToAddToCalendar}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Bill"
        description="Are you sure you want to delete this bill? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
