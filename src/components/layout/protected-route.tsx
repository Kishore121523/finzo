'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

function FinanceSkeleton() {
  return (
    <>
      {/* Month navigator skeleton */}
      <div className="mx-auto w-full max-w-7xl px-3 md:px-4 pt-3 md:pt-6 pb-2 space-y-3 md:space-y-6">
        <div className="flex items-center justify-between">
          <div className="skeleton h-9 w-9 md:h-12 md:w-12 rounded-lg md:rounded-xl" />
          <div className="flex flex-col items-center gap-1">
            <div className="skeleton h-6 md:h-8 w-28 md:w-36 rounded" />
            <div className="skeleton h-3 w-10 rounded" />
          </div>
          <div className="skeleton h-9 w-9 md:h-12 md:w-12 rounded-lg md:rounded-xl" />
        </div>
        <div className="bg-[#1A1A1A] border border-[#2C2C2C] rounded-2xl p-2.5 md:p-3">
          <div className="grid grid-cols-3 gap-1 md:gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2 md:gap-3 rounded-xl bg-white/[0.03] px-2.5 py-2 md:px-4 md:py-3">
                <div className="skeleton h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl shrink-0" />
                <div className="space-y-1.5">
                  <div className="skeleton h-2.5 md:h-3 w-10 md:w-12 rounded" />
                  <div className="skeleton h-3.5 md:h-5 w-14 md:w-20 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 px-4">
        <div className="md:hidden space-y-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#1E1E1E] border border-[#2C2C2C]">
              <div className="flex flex-col items-center gap-1 w-10">
                <div className="skeleton h-3 w-7 rounded" />
                <div className="skeleton h-5 w-8 rounded" />
              </div>
              <div className="flex-1">
                <div className="skeleton h-3.5 w-24 rounded" />
              </div>
              <div className="skeleton h-4 w-16 rounded" />
            </div>
          ))}
        </div>
        <div className="hidden md:block">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="text-center text-xs text-white/30 py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function TasksSkeleton() {
  return (
    <div className="flex-1">
      {/* Mobile: tabs + cards */}
      <div className="sm:hidden flex flex-col h-full px-4 pt-3 pb-5">
        <div className="flex gap-1 p-1 bg-[#1E1E1E] rounded-xl border border-[#2C2C2C] mb-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 skeleton h-9 rounded-lg" />
          ))}
        </div>
        <div className="flex-1 bg-[#1E1E1E] rounded-xl border border-[#2C2C2C] p-3 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-[#252525] rounded-lg border border-[#363636] p-3 space-y-2">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
              <div className="flex gap-2 mt-1">
                <div className="skeleton h-3 w-16 rounded" />
                <div className="skeleton h-3 w-14 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Desktop: 3 columns */}
      <div className="hidden sm:flex max-w-7xl mx-auto gap-5 px-4 py-6 h-full">
        {[0, 1, 2].map((col) => (
          <div key={col} className="flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-4 px-1">
              <div className="skeleton h-5 w-5 rounded-full" />
              <div className="skeleton h-4 w-20 rounded" />
              <div className="skeleton h-5 w-8 rounded-full" />
            </div>
            <div className="flex-1 bg-[#1E1E1E] rounded-2xl border border-[#2C2C2C] p-4 space-y-3">
              {[0, 1, 2].map((card) => (
                <div key={card} className="bg-[#252525] rounded-xl border border-[#363636] p-4 space-y-2">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                  <div className="flex gap-2 mt-1">
                    <div className="skeleton h-3 w-16 rounded" />
                    <div className="skeleton h-3 w-14 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightsSkeleton() {
  return (
    <div className="flex-1 px-4 pt-4 space-y-4">
      {/* Toggle skeleton */}
      <div className="flex justify-center">
        <div className="skeleton h-10 w-52 rounded-xl" />
      </div>
      {/* Summary skeleton */}
      <div className="skeleton h-20 w-full rounded-xl" />
      {/* Category breakdown */}
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#1E1E1E] border border-[#2C2C2C]">
            <div className="skeleton h-10 w-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-3.5 w-24 rounded" />
              <div className="skeleton h-2 w-full rounded-full" />
            </div>
            <div className="skeleton h-4 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [savedMode, setSavedMode] = useState('finance');

  useEffect(() => {
    const mode = localStorage.getItem('finzo-mode');
    if (mode === 'finance' || mode === 'tasks' || mode === 'insights') {
      setSavedMode(mode);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {

    return (
      <div className="flex min-h-screen flex-col bg-[#121212]">
        {/* Nav skeleton */}
        <div className="border-b border-[#1F1F1F] bg-[#1E1E1E]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:py-4">
            <div className="skeleton h-7 w-16 rounded-lg" />
            <div className="flex items-center gap-3">
              <div className="skeleton h-8 w-8 rounded-full" />
              <div className="skeleton h-8 w-8 rounded-full" />
              <div className="skeleton h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>

        {savedMode === 'tasks' ? (
          <TasksSkeleton />
        ) : savedMode === 'insights' ? (
          <InsightsSkeleton />
        ) : (
          <FinanceSkeleton />
        )}

        {/* Bottom tab bar skeleton (mobile) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1E1E1E] border-t border-[#1F1F1F] px-6 py-3">
          <div className="flex items-center justify-around">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="skeleton h-6 w-6 rounded" />
                <div className="skeleton h-2.5 w-10 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
