'use client';

import { ProtectedRoute } from '@/components/layout/protected-route';
import { ModeToggle } from '@/components/layout/mode-toggle';
import { CurrencySelector } from '@/components/layout/currency-selector';
import { ModeProvider } from '@/components/providers/mode-provider';
import { CurrencyProvider } from '@/components/providers/currency-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { LogOut } from 'lucide-react';

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
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2C2C2C] border border-[#3C3C3C]">
              {user && (
                <div className="w-5 h-5 rounded-full bg-[#03DAC6]/10 flex items-center justify-center">
                  <span className="text-xs font-semibold text-[#03DAC6]">
                    {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="hidden sm:inline text-[13px] text-white">{user?.displayName}</span>
            </div>
              <CurrencySelector />
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
