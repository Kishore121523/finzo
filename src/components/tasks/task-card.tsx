'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Task, TaskStatus } from '@/lib/types/task';
import { useCurrency } from '@/components/providers/currency-provider';
import { Edit, Trash2, AlertCircle, RefreshCw, Calendar, CalendarPlus, CreditCard, ChevronRight, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { haptic } from '@/lib/utils/haptics';

const statusFlow: TaskStatus[] = ['todo', 'in-progress', 'done'];
const statusLabels: Record<TaskStatus, string> = {
  'todo': 'To Pay',
  'in-progress': 'Processing',
  'done': 'Paid',
};

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onAddToCalendar?: (task: Task) => void;
  onMoveTask?: (taskId: string, newStatus: TaskStatus) => void;
  disableDrag?: boolean;
  index?: number;
  isDragOverlay?: boolean;
  viewedDate?: Date;
}

export const TaskCard = memo(function TaskCard({
  task,
  onEdit,
  onDelete,
  onAddToCalendar,
  onMoveTask,
  disableDrag = false,
  index = 0,
  isDragOverlay = false,
  viewedDate = new Date(),
}: TaskCardProps) {
  const { formatCurrency } = useCurrency();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: disableDrag });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  // Check if we're viewing the current (today's) month
  const isViewingCurrentMonth = useMemo(() => {
    const today = new Date();
    return viewedDate.getFullYear() === today.getFullYear() &&
           viewedDate.getMonth() === today.getMonth();
  }, [viewedDate]);

  // Calculate the due date for the viewed month (for recurring bills)
  const displayDueDate = useMemo(() => {
    if (!task.dueDate || !task.linkedTransactionId) return task.dueDate?.toDate();

    // Get the day of month from the original due date
    const originalDueDate = task.dueDate.toDate();
    const dayOfMonth = originalDueDate.getDate();

    // Calculate the due date for the viewed month
    const viewedYear = viewedDate.getFullYear();
    const viewedMonth = viewedDate.getMonth();
    const lastDayOfViewedMonth = new Date(viewedYear, viewedMonth + 1, 0).getDate();
    const adjustedDay = Math.min(dayOfMonth, lastDayOfViewedMonth);

    return new Date(viewedYear, viewedMonth, adjustedDay);
  }, [task.dueDate, task.linkedTransactionId, viewedDate]);

  // Check if bill is overdue (only when viewing current month)
  const isOverdue = useMemo(() => {
    if (!task.linkedTransactionId || !displayDueDate || task.status === 'done') return false;

    // Only show overdue when viewing the current month
    if (!isViewingCurrentMonth) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(displayDueDate);
    dueDate.setHours(0, 0, 0, 0);

    return dueDate < today;
  }, [task.linkedTransactionId, displayDueDate, task.status, isViewingCurrentMonth]);

  // Check if this is a one-time bill that can be added to calendar
  const canAddToCalendar = useMemo(() => {
    return !task.linkedTransactionId &&
           task.status === 'done' &&
           onAddToCalendar;
  }, [task.linkedTransactionId, task.status, onAddToCalendar]);

  if (isDragOverlay) {
    return (
      <div className={`p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-[var(--surface-hover)] shadow-2xl shadow-black/50 border ${task.linkedTransactionId ? 'border-[var(--teal-border)]' : 'border-[var(--purple-color)]/50'}`}>
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-xs sm:text-sm text-[var(--text-primary)] leading-tight">{task.title}</h4>
            {task.amount > 0 && (
              <p className="text-xs sm:text-sm font-semibold text-[var(--error-color)] mt-1">
                {formatCurrency(task.amount)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...(disableDrag ? {} : { ...attributes, ...listeners })}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{
        opacity: 0,
        x: -100,
        scale: 0.8,
        transition: { duration: 0.3, ease: 'easeIn' }
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`
        group p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl
        ${disableDrag ? '' : 'cursor-grab active:cursor-grabbing touch-none'}
        transition-colors duration-150
        ${isOverdue
          ? 'bg-[var(--error-color)]/10 border border-[var(--error-color)]/40 hover:bg-[var(--error-color)]/15'
          : `bg-[var(--surface-elevated)] border hover:bg-[var(--surface-hover)] ${
              task.status === 'in-progress' ? 'border-[var(--teal)]/25 hover:border-[var(--teal)]/40' : task.status === 'done' ? 'border-[var(--success-color)]/25 hover:border-[var(--success-color)]/40' : 'border-[var(--border-main)] hover:border-[var(--border-secondary)]'
            }`
        }
        ${isDragging ? 'opacity-40 shadow-lg shadow-black/30' : 'opacity-100'}
      `}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {isOverdue && (
              <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[var(--error-color)] shrink-0" />
            )}
            <h4 className="font-medium text-xs sm:text-sm text-[var(--text-primary)] leading-tight truncate">{task.title}</h4>
            {isOverdue && (
              <span className="shrink-0 px-1 sm:px-1.5 py-0.5 text-[7px] sm:text-[8px] font-bold uppercase tracking-wide bg-[var(--error-color)] text-[var(--text-inverse)] rounded">
                Overdue
              </span>
            )}
          </div>

          {/* Expense type subtitle */}
          {task.amount > 0 && (
            <p className="text-[11px] sm:text-sm text-[var(--text-muted)] mt-0.5 sm:mt-1">
              {task.linkedTransactionId ? (
                <>Recurring expense of <span className="text-[var(--text-secondary)]">{formatCurrency(task.amount)}</span></>
              ) : (
                <>One-time expense of <span className="text-[var(--error-color)]">{formatCurrency(task.amount)}</span></>
              )}
            </p>
          )}

          {/* Bill type indicator */}
          <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2">
            {task.linkedTransactionId ? (
              <>
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <RefreshCw className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[var(--teal)]" />
                  <span className="text-[9px] sm:text-[10px] text-[var(--teal)]">Recurring</span>
                </div>
                {displayDueDate && (
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[var(--text-muted)]" />
                    <span className={`text-[9px] sm:text-[10px] ${isOverdue ? 'text-[var(--error-color)]' : 'text-[var(--text-muted)]'}`}>
                      {format(displayDueDate, 'MMM d')}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-0.5 sm:gap-1">
                <CreditCard className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[var(--purple-color)]" />
                <span className="text-[9px] sm:text-[10px] text-[var(--purple-color)]">One-time</span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons - always visible on mobile, hover on desktop */}
        <div className="flex gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          {/* Add to Calendar button for one-time bills in Paid column */}
          {canAddToCalendar && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 sm:h-7 sm:w-7 rounded-md sm:rounded-lg text-[var(--teal)]/70 hover:text-[var(--teal)] hover:bg-[var(--teal-bg)]"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCalendar?.(task);
              }}
            >
              <CalendarPlus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 sm:h-7 sm:w-7 rounded-md sm:rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--fill-subtle-hover)]"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
          >
            <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Button>
          {/* Hide delete button for recurring bills */}
          {!task.linkedTransactionId && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 sm:h-7 sm:w-7 rounded-md sm:rounded-lg text-[var(--expense-color)]/70 hover:text-[var(--expense-color)] hover:bg-[var(--expense-color)]/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
            >
              <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Mobile: Quick status move buttons */}
      {onMoveTask && (() => {
        const currentIndex = statusFlow.indexOf(task.status);
        const prevStatus = currentIndex > 0 ? statusFlow[currentIndex - 1] : null;
        const nextStatus = currentIndex < statusFlow.length - 1 ? statusFlow[currentIndex + 1] : null;

        return (
          <div className="flex items-center gap-2 mt-2">
            {prevStatus && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveTask(task.id, prevStatus);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-[var(--text-muted)] bg-[var(--fill-subtle)] hover:bg-[var(--fill-subtle-hover)] transition-colors"
              >
                <ChevronLeft className="h-3 w-3" />
                <span>{statusLabels[prevStatus]}</span>
              </button>
            )}
            <div className="flex-1" />
            {nextStatus && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveTask(task.id, nextStatus);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-[var(--text-muted)] bg-[var(--fill-subtle)] hover:bg-[var(--fill-subtle-hover)] transition-colors"
              >
                <span>{statusLabels[nextStatus]}</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })()}
    </motion.div>
  );
});
