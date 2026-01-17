'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Task, TaskFormData, TaskStatus } from '@/lib/types/task';
import { taskSchema } from '@/lib/schemas/task.schema';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Circle, Clock, CheckCircle2 } from 'lucide-react';

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  task?: Task | null;
  defaultStatus?: TaskStatus;
}

export function TaskForm({
  open,
  onClose,
  onSubmit,
  task,
  defaultStatus = 'todo',
}: TaskFormProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: defaultStatus,
    },
  });

  const status = watch('status');

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        status: task.status,
      });
    } else {
      reset({
        title: '',
        description: '',
        status: defaultStatus,
      });
    }
  }, [task, defaultStatus, reset]);

  const handleFormSubmit = async (data: TaskFormData) => {
    try {
      setLoading(true);
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Error submitting task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1E1E1E] border-[#2C2C2C] text-white max-w-[95vw] sm:max-w-lg p-0 gap-0 overflow-hidden" showCloseButton={false}>
        <DialogHeader className="p-5 md:p-6 border-b border-[#2C2C2C]">
          <DialogTitle className="text-2xl font-bold text-white">
            {task ? 'Edit Task' : 'Add Task'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col">
          <div className="p-5 md:p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-white/70 text-sm">Title</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="What needs to be done?"
                className="bg-[#252525] border-[#363636] text-white placeholder:text-white/40 focus:ring-0 focus:border-[#4C4C4C] focus-visible:ring-0 focus-visible:ring-offset-0 h-12 rounded-xl"
              />
              {errors.title && (
                <p className="text-sm text-[#CF6679] mt-1">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-white/70 text-sm">Description (optional)</Label>
              <textarea
                id="description"
                {...register('description')}
                placeholder="Add more details..."
                rows={3}
                className="flex min-h-[100px] w-full rounded-xl border border-[#363636] bg-[#252525] px-4 py-3 text-sm text-white placeholder:text-white/40 focus:ring-0 focus:border-[#4C4C4C] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
              {errors.description && (
                <p className="text-sm text-[#CF6679] mt-1">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-white/70 text-sm">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setValue('status', value as TaskStatus)}
              >
                <SelectTrigger className="bg-[#252525] border-[#363636] text-white focus:ring-0 focus:ring-offset-0 h-12 rounded-xl">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-[#252525] border-[#363636] rounded-xl">
                  <SelectItem value="todo" className="text-white hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white rounded-lg">
                    <div className="flex items-center gap-2">
                      <Circle className="h-4 w-4 text-white/60" />
                      To Do
                    </div>
                  </SelectItem>
                  <SelectItem value="in-progress" className="text-white hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#03DAC6]" />
                      In Progress
                    </div>
                  </SelectItem>
                  <SelectItem value="done" className="text-white hover:bg-white/10 hover:text-white focus:bg-white/10 focus:text-white rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#4CAF50]" />
                      Done
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-sm text-[#CF6679] mt-1">{errors.status.message}</p>
              )}
            </div>
          </div>

          <DialogFooter className="p-5 md:p-6 border-t border-[#2C2C2C] flex gap-3">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1 bg-transparent border-[#3C3C3C] text-white hover:bg-white/5 hover:text-white h-12 rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-[#03DAC6] hover:bg-[#03DAC6]/90 text-black font-semibold h-12 rounded-xl">
              {loading ? 'Saving...' : task ? 'Update Task' : 'Add Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
