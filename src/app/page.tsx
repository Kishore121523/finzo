'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Redirect authenticated users to dashboard
      router.replace('/dashboard');
    } else if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[#121212]">
      <div className="h-32 w-32 animate-spin rounded-full border-b-4 border-t-4 border-[#03DAC6]"></div>
    </div>
  );
}
