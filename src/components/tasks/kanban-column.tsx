'use client';

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { TaskCard } from './task-card';
import { Task, TaskStatus } from '@/lib/types/task';
import { Plus, Circle, Clock, CheckCircle2, RefreshCw, CreditCard } from 'lucide-react';

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onAddToCalendar: (task: Task) => void;
  onMoveTask?: (taskId: string, newStatus: TaskStatus) => void;
  viewedDate: Date;
  isMobile?: boolean;
}

const statusConfig = {
  'todo': {
    icon: Circle,
    color: 'text-[var(--text-secondary)]',
    accentColor: '#ffffff',
  },
  'in-progress': {
    icon: Clock,
    color: 'text-[var(--teal)]',
    accentColor: 'var(--teal)',
  },
  'done': {
    icon: CheckCircle2,
    color: 'text-[var(--success-color)]',
    accentColor: 'var(--success-color)',
  },
};

export const KanbanColumn = memo(function KanbanColumn({
  title,
  status,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onAddToCalendar,
  onMoveTask,
  viewedDate,
  isMobile,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = statusConfig[status];
  const Icon = config.icon;

  // Split tasks into finance-linked and regular tasks
  const { linkedTasks, regularTasks } = useMemo(() => {
    const linked = tasks.filter(t => t.linkedTransactionId);
    const regular = tasks.filter(t => !t.linkedTransactionId);
    return { linkedTasks: linked, regularTasks: regular };
  }, [tasks]);

  return (
    <motion.div
      initial={{ opacity: 0, y: isMobile ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: isMobile ? 0 : (status === 'todo' ? 0 : status === 'in-progress' ? 0.1 : 0.2) }}
      className={
        isMobile
          ? 'flex flex-col w-full h-full min-h-0'
          : 'shrink-0 w-[75vw] sm:w-auto sm:flex-1 min-w-[240px] sm:min-w-[280px] md:min-w-[320px] flex flex-col h-[calc(100%-1rem)] max-h-[75vh] sm:max-h-none sm:h-full snap-center sm:snap-align-none'
      }
    >
      {/* Column Header */}
      <div className="mb-2 sm:mb-3 md:mb-4 flex items-center justify-between px-0.5 sm:px-1">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 ${config.color}`} />
          <h3 className="text-xs sm:text-sm md:text-base font-semibold text-[var(--text-primary)]">
            {title}
          </h3>
          <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-[var(--fill-subtle)] text-[var(--text-secondary)]">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAddTask(status)}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--fill-subtle-hover)] transition-colors"
        >
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 min-h-0 ${isMobile ? 'p-3' : 'p-2 sm:p-3 md:p-4'} rounded-xl sm:rounded-2xl transition-all duration-200 overflow-y-auto scrollbar-hide
          bg-[var(--surface)] border border-[var(--border-main)]
          ${isOver ? 'ring-2 ring-[var(--teal)] bg-[var(--teal-bg)]' : ''}
        `}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-8 sm:py-12 text-center"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--fill-subtle)] flex items-center justify-center mb-2 sm:mb-3">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--text-faint)]" />
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mb-2 sm:mb-3">No bills yet</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddTask(status)}
                className="text-[var(--teal)] hover:text-[var(--teal)] hover:bg-[var(--teal-bg)] text-xs sm:text-sm"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                Add payment
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {/* Finance-linked tasks section */}

              {/* One-time bills section (manually added) */}
              {regularTasks.length > 0 && (
                <div>
                  {linkedTasks.length > 0 && (
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 px-0.5 sm:px-1">
                      <CreditCard className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[var(--purple-color)]/70" />
                      <span className="text-[9px] sm:text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                        One-time
                      </span>
                      <div className="flex-1 h-px bg-[var(--fill-subtle)]" />
                    </div>
                  )}
                  <div className="space-y-2 sm:space-y-3">
                    <AnimatePresence>
                      {regularTasks.map((task, index) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onEdit={onEditTask}
                          onDelete={onDeleteTask}
                          onAddToCalendar={onAddToCalendar}
                          onMoveTask={onMoveTask}
                          disableDrag={isMobile}
                          index={index + linkedTasks.length}
                          viewedDate={viewedDate}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Recurring bills section (auto-generated from calendar) */}
              {linkedTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 px-0.5 sm:px-1">
                    <RefreshCw className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[var(--teal)]/70" />
                    <span className="text-[9px] sm:text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                      Recurring
                    </span>
                    <div className="flex-1 h-px bg-[var(--fill-subtle)]" />
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <AnimatePresence>
                      {linkedTasks.map((task, index) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onEdit={onEditTask}
                          onDelete={onDeleteTask}
                          onAddToCalendar={onAddToCalendar}
                          onMoveTask={onMoveTask}
                          disableDrag={isMobile}
                          index={index}
                          viewedDate={viewedDate}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              

             
            </div>
          )}
        </SortableContext>
      </div>
    </motion.div>
  );
});
