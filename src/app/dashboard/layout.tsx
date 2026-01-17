'use client';

import { ProtectedRoute } from '@/components/layout/protected-route';
import { ModeToggle } from '@/components/layout/mode-toggle';
import { CurrencySelector } from '@/components/layout/currency-selector';
import { ModeProvider } from '@/components/providers/mode-provider';
import { CurrencyProvider } from '@/components/providers/currency-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { UserAvatar } from '@/components/layout/user-avatar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <CurrencyProvider>
        <ModeProvider>
          <div className="flex min-h-screen flex-col bg-[#121212]">
            <DashboardNav />
            <main className="flex-1">{children}</main>
          </div>
        </ModeProvider>
      </CurrencyProvider>
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
    <nav className="border-b border-[#1F1F1F] bg-[#1E1E1E]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:py-4">
        <div className="flex items-center gap-3 md:gap-8">
          <h1 className="text-xl md:text-2xl font-bold text-white">Finzo</h1>
          <ModeToggle />
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <CurrencySelector />
          <div className="flex items-center gap-2 md:gap-3">
            {user && <UserAvatar user={user} size={32} />}
            <span className="hidden sm:inline text-sm text-white">{user?.displayName}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2C2C2C] text-white/70 transition-colors hover:bg-[#3C3C3C] hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
