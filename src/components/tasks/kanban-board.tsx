'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
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
import { Circle, Clock, CheckCircle2 } from 'lucide-react';
import { haptic } from '@/lib/utils/haptics';

interface KanbanBoardProps {
  viewedDate: Date;
  onAddTransaction?: (data: { description: string; amount: number; date: Date }) => Promise<void>;
}

const mobileTabConfig = [
  { status: 'todo' as TaskStatus, label: 'To Pay', icon: Circle, color: '#ffffff', activeBg: 'bg-[var(--fill-subtle)]', activeText: 'text-[var(--text-primary)]' },
  { status: 'in-progress' as TaskStatus, label: 'Processing', icon: Clock, color: 'var(--teal)', activeBg: 'bg-[var(--teal-bg)]', activeText: 'text-[var(--teal)]' },
  { status: 'done' as TaskStatus, label: 'Paid', icon: CheckCircle2, color: 'var(--success-color)', activeBg: 'bg-[var(--success-color)]/10', activeText: 'text-[var(--success-color)]' },
];

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
  const [activeTab, setActiveTab] = useState<TaskStatus>('todo');
  const [tabDirection, setTabDirection] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: isMobile ? 99999 : 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
      haptic('light');
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

  const handleMoveTask = useCallback((taskId: string, newStatus: TaskStatus) => {
    const tasksInNewStatus = getTasksByStatus(newStatus);
    reorderTasks(taskId, newStatus, tasksInNewStatus.length);
    haptic('medium');
  }, [getTasksByStatus, reorderTasks]);

  const handleTabChange = useCallback((newTab: TaskStatus) => {
    const oldIndex = mobileTabConfig.findIndex(t => t.status === activeTab);
    const newIndex = mobileTabConfig.findIndex(t => t.status === newTab);
    setTabDirection(newIndex > oldIndex ? 1 : -1);
    setActiveTab(newTab);
    haptic('light');
  }, [activeTab]);

  const handleTabSwipe = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    const tabIndex = mobileTabConfig.findIndex(t => t.status === activeTab);

    if (info.offset.x > threshold && tabIndex > 0) {
      setTabDirection(-1);
      setActiveTab(mobileTabConfig[tabIndex - 1].status);
      haptic('light');
    } else if (info.offset.x < -threshold && tabIndex < mobileTabConfig.length - 1) {
      setTabDirection(1);
      setActiveTab(mobileTabConfig[tabIndex + 1].status);
      haptic('light');
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="h-full bg-[var(--app-bg)]">
        {/* Mobile skeleton */}
        <div className="sm:hidden flex flex-col h-full px-4 pt-3 pb-5">
          <div className="flex gap-1 p-1 bg-[var(--surface)] rounded-xl border border-[var(--border-main)] mb-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex-1 skeleton h-9 rounded-lg" />
            ))}
          </div>
          <div className="flex-1 bg-[var(--surface)] rounded-xl border border-[var(--border-main)] p-3 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-[var(--surface-elevated)] rounded-lg border border-[var(--border-secondary)] p-3 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
                <div className="flex gap-2 mt-1">
                  <div className="skeleton h-3 w-16 rounded" />
                  <div className="skeleton h-3 w-14 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Desktop skeleton */}
        <div className="hidden sm:flex max-w-7xl mx-auto gap-5 px-4 py-6 h-full">
          {[0, 1, 2].map((col) => (
            <div key={col} className="flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-4 px-1">
                <div className="skeleton h-5 w-5 rounded-full" />
                <div className="skeleton h-4 w-20 rounded" />
                <div className="skeleton h-5 w-8 rounded-full" />
              </div>
              <div className="flex-1 bg-[var(--surface)] rounded-2xl border border-[var(--border-main)] p-4 space-y-3">
                {[0, 1, 2].map((card) => (
                  <div key={card} className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-secondary)] p-4 space-y-2">
                    <div className="skeleton h-4 w-3/4 rounded" />
                    <div className="skeleton h-3 w-1/2 rounded" />
                    <div className="flex gap-2 mt-1">
                      <div className="skeleton h-3 w-16 rounded" />
                      <div className="skeleton h-3 w-14 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[var(--app-bg)]">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {isMobile ? (
          /* Mobile: Tabbed View */
          <div className="flex flex-col h-full px-4 pt-3 pb-5">
            {/* Tab Bar */}
            <div className="flex gap-1 p-1 bg-[var(--surface)] rounded-xl border border-[var(--border-main)] mb-3 shrink-0">
              {mobileTabConfig.map((tab) => {
                const count = getTasksByStatus(tab.status).length;
                const isActive = activeTab === tab.status;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.status}
                    onClick={() => handleTabChange(tab.status)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? `${tab.activeBg} ${tab.activeText}`
                        : 'text-[var(--text-muted)]'
                    }`}
                  >
                    <Icon
                      className="h-3.5 w-3.5"
                      style={{ color: isActive ? tab.color : undefined }}
                    />
                    <span>{tab.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                        isActive ? 'bg-[var(--fill-subtle)] text-[var(--text-secondary)]' : 'text-[var(--text-faint)]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Column */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <AnimatePresence initial={false} custom={tabDirection} mode="wait">
                <motion.div
                  key={activeTab}
                  custom={tabDirection}
                  initial={{ opacity: 0, x: tabDirection * 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -tabDirection * 100 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleTabSwipe}
                  className="h-full min-h-0"
                >
                  <KanbanColumn
                    title={mobileTabConfig.find((t) => t.status === activeTab)!.label}
                    status={activeTab}
                    tasks={getTasksByStatus(activeTab)}
                    onAddTask={handleAddTask}
                    onEditTask={handleEditTask}
                    onDeleteTask={handleDeleteClick}
                    onAddToCalendar={handleAddToCalendarClick}
                    onMoveTask={handleMoveTask}
                    viewedDate={viewedDate}
                    isMobile
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        ) : (
          /* Desktop: Original Layout */
          <>
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
          </>
        )}
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
