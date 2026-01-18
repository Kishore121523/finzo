'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Task } from '@/lib/types/task';
import { useCurrency } from '@/components/providers/currency-provider';
import { Edit, Trash2, AlertCircle, RefreshCw, Calendar, CalendarPlus, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onAddToCalendar?: (task: Task) => void;
  index?: number;
  isDragOverlay?: boolean;
  viewedDate?: Date;
}

export const TaskCard = memo(function TaskCard({
  task,
  onEdit,
  onDelete,
  onAddToCalendar,
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
  } = useSortable({ id: task.id });

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
      <div className="p-3 md:p-4 rounded-xl bg-[#2C2C2C] border border-[#03DAC6]/50 shadow-2xl shadow-black/50">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-white leading-tight">{task.title}</h4>
            {task.amount > 0 && (
              <p className="text-sm font-semibold text-[#FF5252] mt-1">
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
      {...attributes}
      {...listeners}
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
        group p-3 md:p-4 rounded-xl cursor-grab active:cursor-grabbing touch-none
        transition-colors duration-150
        ${isOverdue
          ? 'bg-[#FF5252]/10 border border-[#FF5252]/40 hover:bg-[#FF5252]/15'
          : 'bg-[#252525] border border-[#363636] hover:bg-[#2A2A2A] hover:border-[#03DAC6]/30'
        }
        ${isDragging ? 'opacity-40 shadow-lg shadow-black/30' : 'opacity-100'}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isOverdue && (
              <AlertCircle className="h-3.5 w-3.5 text-[#FF5252] shrink-0" />
            )}
            <h4 className="font-medium text-sm text-white leading-tight truncate">{task.title}</h4>
            {isOverdue && (
              <span className="shrink-0 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide bg-[#FF5252] text-white rounded">
                Overdue
              </span>
            )}
          </div>

          {/* Expense type subtitle */}
          {task.amount > 0 && (
            <p className="text-sm text-white/50 mt-1">
              {task.linkedTransactionId ? (
                <>Recurring expense of <span className="text-white/70">{formatCurrency(task.amount)}</span></>
              ) : (
                <>One-time expense of <span className="text-[#FF5252]">{formatCurrency(task.amount)}</span></>
              )}
            </p>
          )}

          {/* Bill type indicator */}
          <div className="flex items-center gap-3 mt-2">
            {task.linkedTransactionId ? (
              <>
                <div className="flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 text-[#03DAC6]" />
                  <span className="text-[10px] text-[#03DAC6]">Recurring</span>
                </div>
                {displayDueDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-white/40" />
                    <span className={`text-[10px] ${isOverdue ? 'text-[#FF5252]' : 'text-white/50'}`}>
                      {format(displayDueDate, 'MMM d')}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1">
                <CreditCard className="h-3 w-3 text-[#BB86FC]" />
                <span className="text-[10px] text-[#BB86FC]">One-time</span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons - shown on hover */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Add to Calendar button for one-time bills in Paid column */}
          {canAddToCalendar && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-[#03DAC6]/70 hover:text-[#03DAC6] hover:bg-[#03DAC6]/10"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCalendar?.(task);
              }}
            >
              <CalendarPlus className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          {/* Hide delete button for recurring bills */}
          {!task.linkedTransactionId && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-[#CF6679]/70 hover:text-[#CF6679] hover:bg-[#CF6679]/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
});
