'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMode } from '@/components/providers/mode-provider';

export default function FinancePage() {
  const router = useRouter();
  const { setMode } = useMode();

  useEffect(() => {
    setMode('finance');
    router.replace('/dashboard');
  }, [router, setMode]);

  return null;
}
