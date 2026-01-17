'use client';

import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Task } from '@/lib/types/task';
import { Edit, Trash2 } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  index?: number;
  isDragOverlay?: boolean;
}

export const TaskCard = memo(function TaskCard({
  task,
  onEdit,
  onDelete,
  index = 0,
  isDragOverlay = false
}: TaskCardProps) {
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

  if (isDragOverlay) {
    return (
      <div className="p-3 md:p-4 rounded-xl bg-[#2C2C2C] border border-[#03DAC6]/50 shadow-2xl shadow-black/50">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-white leading-tight">{task.title}</h4>
            {task.description && (
              <p className="text-xs text-white/50 mt-1.5 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        group p-3 md:p-4 rounded-xl cursor-grab active:cursor-grabbing touch-none
        bg-[#252525] border border-[#363636]
        hover:bg-[#2A2A2A] hover:border-[#03DAC6]/30
        transition-colors duration-150
        ${isDragging ? 'opacity-40 shadow-lg shadow-black/30' : 'opacity-100'}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-white leading-tight">{task.title}</h4>
          {task.description && (
            <p className="text-xs text-white/50 mt-1.5 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
        </div>
      </div>
    </div>
  );
});
