'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { TaskCard } from './task-card';
import { Task, TaskStatus } from '@/lib/types/task';
import { Plus, Circle, Clock, CheckCircle2 } from 'lucide-react';

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

const statusConfig = {
  'todo': {
    icon: Circle,
    color: 'text-white/60',
    accentColor: '#ffffff',
  },
  'in-progress': {
    icon: Clock,
    color: 'text-[#03DAC6]',
    accentColor: '#03DAC6',
  },
  'done': {
    icon: CheckCircle2,
    color: 'text-[#4CAF50]',
    accentColor: '#4CAF50',
  },
};

export const KanbanColumn = memo(function KanbanColumn({
  title,
  status,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: status === 'todo' ? 0 : status === 'in-progress' ? 0.1 : 0.2 }}
      className="flex-1 min-w-[280px] md:min-w-[320px] flex flex-col h-full"
    >
      {/* Column Header */}
      <div className="mb-3 md:mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 md:h-5 md:w-5 ${config.color}`} />
          <h3 className="text-sm md:text-base font-semibold text-white">
            {title}
          </h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/60">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAddTask(status)}
          className="h-8 w-8 p-0 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 p-3 md:p-4 rounded-2xl transition-all duration-200 overflow-y-auto
          bg-[#1E1E1E] border border-[#2C2C2C]
          ${isOver ? 'ring-2 ring-[#03DAC6] bg-[#03DAC6]/5' : ''}
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
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                <Icon className="h-6 w-6 text-white/20" />
              </div>
              <p className="text-sm text-white/40 mb-3">No tasks yet</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddTask(status)}
                className="text-[#03DAC6] hover:text-[#03DAC6] hover:bg-[#03DAC6]/20"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add task
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  index={index}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </div>
    </motion.div>
  );
});
