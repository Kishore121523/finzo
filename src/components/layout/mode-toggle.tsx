'use client';

import { useMode } from '@/components/providers/mode-provider';
import { Button } from '@/components/ui/button';
import { Wallet, ListTodo } from 'lucide-react';

export function ModeToggle() {
  const { mode, setMode } = useMode();

  return (
    <div className="flex items-center gap-1 rounded-xl bg-[#252525] p-1">
      <Button
        variant={mode === 'finance' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setMode('finance')}
        className={`text-xs md:text-sm px-3 md:px-4 py-2 rounded-lg transition-all duration-200 ${
          mode === 'finance'
            ? 'bg-[#03DAC6] text-black hover:bg-[#03DAC6]/90 font-semibold'
            : 'text-white/50 hover:bg-white/10 hover:text-white'
        }`}
      >
        <Wallet className="h-3.5 w-3.5 mr-1.5" />
        Finance
      </Button>
      <Button
        variant={mode === 'tasks' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setMode('tasks')}
        className={`text-xs md:text-sm px-3 md:px-4 py-2 rounded-lg transition-all duration-200 ${
          mode === 'tasks'
            ? 'bg-[#03DAC6] text-black hover:bg-[#03DAC6]/90 font-semibold'
            : 'text-white/50 hover:bg-white/10 hover:text-white'
        }`}
      >
        <ListTodo className="h-3.5 w-3.5 mr-1.5" />
        Tasks
      </Button>
    </div>
  );
}
