'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { ModeToggle } from '@/components/layout/mode-toggle';
import { CurrencySelector } from '@/components/layout/currency-selector';
import { NotificationToggle } from '@/components/layout/notification-toggle';
import { BottomTabBar } from '@/components/layout/bottom-tab-bar';
import { UserMenu } from '@/components/layout/user-menu';
import { ModeProvider, useMode } from '@/components/providers/mode-provider';
import { CurrencyProvider } from '@/components/providers/currency-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { LogOut, Info, Sun, Moon, Search, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { FinzoLogo } from '@/components/layout/logo';
import { OnboardingModal } from '@/components/onboarding/onboarding-modal';
import { SavingsGoalsOverlay } from '@/components/goals/savings-goals-overlay';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <CurrencyProvider>
        <ModeProvider>
          <div className="flex min-h-screen flex-col bg-[var(--app-bg)]">
            <DashboardNav />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
            <BottomTabBar />
            <SavingsGoalsOverlay />
          </div>
        </ModeProvider>
      </CurrencyProvider>
    </ProtectedRoute>
  );
}

function DashboardNav() {
  const { user, logout, hasSeenOnboarding, markOnboardingSeen } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { theme, setTheme } = useTheme();
  const { navigateTo } = useMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <>
      <nav className="border-b border-[var(--border-main)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:py-4">
          {/* Left side - Logo + Mode Toggle (desktop only) */}
          <div className="flex items-center gap-3 md:gap-8">
            <div className="flex items-center gap-2">
              <FinzoLogo className="w-6 h-6 md:w-7 md:h-7" />
              <h1 className="text-xl md:text-[1.5rem] font-bold text-[var(--text-primary)]">Finzo</h1>
            </div>
            {/* Mode toggle - hidden on mobile, shown on md and up */}
            <div className="hidden md:block">
              <ModeToggle />
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Currency - visible on all sizes */}
            <CurrencySelector />
            {/* Desktop: Search icon */}
            <div className="hidden md:block relative group">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-search'))}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--teal-bg)] text-[var(--teal)] transition-colors hover:bg-[var(--teal-border)] cursor-pointer"
              >
                <Search className="h-4 w-4" />
              </button>
              <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 text-xs text-[var(--text-primary)] bg-[var(--surface-hover)] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex flex-col items-center gap-0.5">
                <span>Search transactions</span>
                <span className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-[var(--fill-subtle)] border border-[var(--border-secondary)] text-[9px] font-mono text-[var(--text-primary)]">Shift</kbd>
                  <span>+</span>
                  <kbd className="px-1 py-0.5 rounded bg-[var(--fill-subtle)] border border-[var(--border-secondary)] text-[9px] font-mono text-[var(--text-primary)]">Space</kbd>
                </span>
              </span>
            </div>
            {/* Notification & Info & Theme - desktop only */}
            <div className="hidden md:block">
              <NotificationToggle />
            </div>
            <div className="hidden md:block relative group">
              <button
                onClick={() => setShowOnboarding(true)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--teal-bg)] text-[var(--teal)] transition-colors hover:bg-[var(--teal-border)] cursor-pointer"
              >
                <Info className="h-4 w-4" />
              </button>
              <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-[var(--text-primary)] bg-[var(--surface-hover)] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                App guide
              </span>
            </div>

            {/* Desktop: Goals CTA */}
            <div className="hidden md:block relative group">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-goals'))}
                className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--purple-color)] transition-colors cursor-pointer"
                style={{ backgroundColor: 'color-mix(in srgb, var(--purple-color) 15%, transparent)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--purple-color) 25%, transparent)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--purple-color) 15%, transparent)'}
              >
                <Target className="h-4 w-4" />
              </button>
              <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 text-xs text-[var(--text-primary)] bg-[var(--surface-hover)] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex flex-col items-center gap-0.5">
                <span>Goals</span>
                <span className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-[var(--fill-subtle)] border border-[var(--border-secondary)] text-[9px] font-mono text-[var(--text-primary)]">Shift</kbd>
                  <span>+</span>
                  <kbd className="px-1 py-0.5 rounded bg-[var(--fill-subtle)] border border-[var(--border-secondary)] text-[9px] font-mono text-[var(--text-primary)]">G</kbd>
                </span>
              </span>
            </div>
            {/* Theme toggle - desktop only */}
            {mounted && (
              <div className="hidden md:block relative group">
                <button
                  onClick={toggleTheme}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--fill-subtle)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--fill-subtle-hover)] hover:text-[var(--text-primary)] cursor-pointer overflow-hidden"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={theme}
                      initial={{ y: -20, opacity: 0, rotate: -90 }}
                      animate={{ y: 0, opacity: 1, rotate: 0 }}
                      exit={{ y: 20, opacity: 0, rotate: 90 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="flex items-center justify-center"
                    >
                      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </motion.span>
                  </AnimatePresence>
                </button>
                <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-[var(--text-primary)] bg-[var(--surface-hover)] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </span>
              </div>
            )}



            {/* Mobile: Search icon */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-search'))}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-full bg-[var(--teal-bg)] text-[var(--teal)] transition-colors hover:bg-[var(--teal-border)] cursor-pointer"
            >
              <Search className="h-4 w-4" />
            </button>
            {/* Mobile: Goals CTA */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-goals'))}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-full text-[var(--purple-color)] transition-colors cursor-pointer"
              style={{ backgroundColor: 'color-mix(in srgb, var(--purple-color) 15%, transparent)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--purple-color) 25%, transparent)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--purple-color) 15%, transparent)'}
            >
              <Target className="h-4 w-4" />
            </button>

            {/* Mobile: User menu dropdown (includes notification toggle + app guide) */}
            <div className="md:hidden">
              {user && <UserMenu user={user} onLogout={handleSignOut} onOpenGuide={() => setShowOnboarding(true)} onNavigateBudget={() => navigateTo('insights', 'budget')} />}
            </div>

            {/* Desktop: User info + Logout */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border-secondary)]">
                {user && (
                  <div className="w-5 h-5 rounded-full bg-[var(--teal-bg)] flex items-center justify-center">
                    <span className="text-xs font-semibold text-[var(--teal)]">
                      {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-[13px] text-[var(--text-primary)]">{user?.displayName}</span>
              </div>
              <div className="relative group">
                <button
                  onClick={handleSignOut}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--border-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
                <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-[var(--text-primary)] bg-[var(--surface-hover)] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Sign out
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <OnboardingModal open={showOnboarding} onClose={handleOnboardingClose} />
    </>
  );
}
