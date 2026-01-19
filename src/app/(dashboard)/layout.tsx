'use client';

import { ProtectedRoute } from '@/components/layout/protected-route';
import { ModeToggle } from '@/components/layout/mode-toggle';
import { ModeProvider } from '@/components/providers/mode-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { UserAvatar } from '@/components/layout/user-avatar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <ModeProvider>
        <div className="flex min-h-screen flex-col bg-[#121212]">
          <DashboardNav />
          <main className="flex-1">{children}</main>
        </div>
      </ModeProvider>
    </ProtectedRoute>
  );
}

function DashboardNav() {
  const { user, logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="border-b border-[#1F1F1F] bg-[#1E1E1E] sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 md:py-4">
        <div className="flex items-center gap-2 sm:gap-3 md:gap-8">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Finzo</h1>
          <ModeToggle />
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-2 md:gap-3">
            {user && <UserAvatar user={user} size={28} className="sm:w-8 sm:h-8" />}
            <span className="hidden md:inline text-sm text-white">{user?.displayName}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[#2C2C2C] text-white/70 transition-colors hover:bg-[#3C3C3C] hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
