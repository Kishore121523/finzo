'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMode } from '@/components/providers/mode-provider';

export default function TasksPage() {
  const router = useRouter();
  const { setMode } = useMode();

  useEffect(() => {
    setMode('tasks');
    router.replace('/dashboard');
  }, [router, setMode]);

  return null;
}
