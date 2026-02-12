'use client';

import { ProtectedRoute } from '@/components/layout/protected-route';
import { ModeToggle } from '@/components/layout/mode-toggle';
import { CurrencySelector } from '@/components/layout/currency-selector';
import { NotificationToggle } from '@/components/layout/notification-toggle';
import { BottomTabBar } from '@/components/layout/bottom-tab-bar';
import { UserMenu } from '@/components/layout/user-menu';
import { ModeProvider } from '@/components/providers/mode-provider';
import { CurrencyProvider } from '@/components/providers/currency-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { LogOut } from 'lucide-react';
import { FinzoLogo } from '@/components/layout/logo';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <CurrencyProvider>
        <ModeProvider>
          <div className="flex min-h-screen flex-col bg-[#121212]">
            <DashboardNav />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
            <BottomTabBar />
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
        {/* Left side - Logo + Mode Toggle (desktop only) */}
        <div className="flex items-center gap-3 md:gap-8">
          <div className="flex items-center gap-2">
            <FinzoLogo className="w-6 h-6 md:w-7 md:h-7" />
            <h1 className="text-xl md:text-[1.5rem] font-bold text-white">Finzo</h1>
          </div>
          {/* Mode toggle - hidden on mobile, shown on md and up */}
          <div className="hidden md:block">
            <ModeToggle />
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Currency & Notifications - visible on all sizes */}
          <CurrencySelector />
          <NotificationToggle />

          {/* Mobile: User menu dropdown */}
          <div className="md:hidden">
            {user && <UserMenu user={user} onLogout={handleSignOut} />}
          </div>

          {/* Desktop: User info + Logout */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2C2C2C] border border-[#3C3C3C]">
              {user && (
                <div className="w-5 h-5 rounded-full bg-[#03DAC6]/10 flex items-center justify-center">
                  <span className="text-xs font-semibold text-[#03DAC6]">
                    {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-[13px] text-white">{user?.displayName}</span>
            </div>
            <div className="relative group">
              <button
                onClick={handleSignOut}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2C2C2C] text-white/70 transition-colors hover:bg-[#3C3C3C] hover:text-white cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
              <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-white bg-[#2C2C2C] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Sign out
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
