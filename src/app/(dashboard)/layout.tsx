'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { ModeToggle } from '@/components/layout/mode-toggle';
import { ModeProvider } from '@/components/providers/mode-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { LogOut, Info } from 'lucide-react';
import { UserAvatar } from '@/components/layout/user-avatar';
import { NotificationToggle } from '@/components/layout/notification-toggle';
import { FinzoLogo } from '@/components/layout/logo';
import { OnboardingModal } from '@/components/onboarding/onboarding-modal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <ModeProvider>
        <div className="flex min-h-screen flex-col bg-[var(--app-bg)]">
          <DashboardNav />
          <main className="flex-1">{children}</main>
        </div>
      </ModeProvider>
    </ProtectedRoute>
  );
}

function DashboardNav() {
  const { user, logout, hasSeenOnboarding, markOnboardingSeen } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, [hasSeenOnboarding]);

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    if (!hasSeenOnboarding) {
      markOnboardingSeen();
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <nav className="border-b border-[var(--border-main)] bg-[var(--surface)] sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 md:py-4">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-8">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <FinzoLogo className="w-5 h-5 sm:w-6 sm:h-6" />
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--text-primary)]">Finzo</h1>
            </div>
            <ModeToggle />
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2 md:gap-3">
              {user && <UserAvatar user={user} size={28} className="sm:w-8 sm:h-8" />}
              <span className="hidden md:inline text-sm text-[var(--text-primary)]">{user?.displayName}</span>
            </div>
            <NotificationToggle />
            <div className="relative group">
              <button
                onClick={() => setShowOnboarding(true)}
                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[var(--teal-bg)] text-[var(--teal)] transition-colors hover:bg-[var(--teal)]/25 cursor-pointer"
              >
                <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-[var(--text-primary)] bg-[var(--surface-hover)] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                App guide
              </span>
            </div>
            <div className="relative group">
              <button
                onClick={handleSignOut}
                className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--border-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
              <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-[var(--text-primary)] bg-[var(--surface-hover)] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Sign out
              </span>
            </div>
          </div>
        </div>
      </nav>
      <OnboardingModal open={showOnboarding} onClose={handleOnboardingClose} />
    </>
  );
}
