'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/layout/protected-route';
import { ModeToggle } from '@/components/layout/mode-toggle';
import { CurrencySelector } from '@/components/layout/currency-selector';

import { BottomTabBar } from '@/components/layout/bottom-tab-bar';
import { UserMenu } from '@/components/layout/user-menu';
import { ModeProvider, useMode } from '@/components/providers/mode-provider';
import { CurrencyProvider } from '@/components/providers/currency-provider';
import { useAuth } from '@/components/providers/auth-provider';
import { Search, Target, LayoutDashboard, PieChart } from 'lucide-react';
import { FinzoLogo } from '@/components/layout/logo';
import { OnboardingModal } from '@/components/onboarding/onboarding-modal';
import { SavingsGoalsOverlay } from '@/components/goals/savings-goals-overlay';
import { DashboardOverviewOverlay } from '@/components/dashboard/dashboard-overview-overlay';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <CurrencyProvider>
        <ModeProvider>
          <div className="flex min-h-screen flex-col bg-[var(--app-bg)]">
            <DashboardNav />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
            <BottomTabBar />
            <DashboardOverviewOverlay />
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
  const { navigateTo } = useMode();

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
          <div className="flex items-center gap-3 md:gap-3">

            {/* Desktop: Search bar pill */}
            <div className="hidden md:block relative group">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-search'))}
                className="flex items-center gap-2.5 h-8 pl-3 pr-4 rounded-lg border border-[var(--border-secondary)] bg-[var(--surface-hover)] hover:bg-[var(--fill-subtle)] hover:border-[var(--teal-border)] transition-all cursor-pointer group"
              >
                <Search className="h-3.5 w-3.5 text-[var(--text-muted)] group-hover:text-[var(--teal)] transition-colors" />
                <span className="text-[13px] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">Search...</span>
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

            {/* Mobile: Search icon */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-search'))}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-full bg-[var(--teal-bg)] text-[var(--teal)] transition-colors hover:bg-[var(--teal-border)] cursor-pointer"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Overview CTA */}
            <div className="relative group">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-overview'))}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--teal-bg)] text-[var(--teal)] transition-colors hover:bg-[var(--teal-border)] cursor-pointer"
              >
                <LayoutDashboard className="h-4 w-4" />
              </button>
              <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 text-xs text-[var(--text-primary)] bg-[var(--surface-hover)] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:flex flex-col items-center gap-0.5">
                <span>Overview</span>
                <span className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-[var(--fill-subtle)] border border-[var(--border-secondary)] text-[9px] font-mono text-[var(--text-primary)]">Shift</kbd>
                  <span>+</span>
                  <kbd className="px-1 py-0.5 rounded bg-[var(--fill-subtle)] border border-[var(--border-secondary)] text-[9px] font-mono text-[var(--text-primary)]">O</kbd>
                </span>
              </span>
            </div>

            {/* Budgets CTA */}
            <div className="hidden md:block relative group">
              <button
                onClick={() => navigateTo('insights', 'budget')}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--teal-bg)] text-[var(--teal)] transition-colors hover:bg-[var(--teal-border)] cursor-pointer"
              >
                <PieChart className="h-4 w-4" />
              </button>
              <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 text-xs text-[var(--text-primary)] bg-[var(--surface-hover)] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:flex flex-col items-center gap-0.5">
                <span>Budgets</span>
                <span className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-[var(--fill-subtle)] border border-[var(--border-secondary)] text-[9px] font-mono text-[var(--text-primary)]">Shift</kbd>
                  <span>+</span>
                  <kbd className="px-1 py-0.5 rounded bg-[var(--fill-subtle)] border border-[var(--border-secondary)] text-[9px] font-mono text-[var(--text-primary)]">B</kbd>
                </span>
              </span>
            </div>

            {/* Goals CTA */}
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
              <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 text-xs text-[var(--text-primary)] bg-[var(--surface-hover)] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:flex flex-col items-center gap-0.5">
                <span>Goals</span>
                <span className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                  <kbd className="px-1 py-0.5 rounded bg-[var(--fill-subtle)] border border-[var(--border-secondary)] text-[9px] font-mono text-[var(--text-primary)]">Shift</kbd>
                  <span>+</span>
                  <kbd className="px-1 py-0.5 rounded bg-[var(--fill-subtle)] border border-[var(--border-secondary)] text-[9px] font-mono text-[var(--text-primary)]">G</kbd>
                </span>
              </span>
            </div>

            {/* User menu avatar */}
            <div className="md:hidden">
              {user && <UserMenu user={user} onLogout={handleSignOut} onOpenGuide={() => setShowOnboarding(true)} showCurrency onNavigateToBudgets={() => navigateTo('insights', 'budget')} onNavigateToGoals={() => window.dispatchEvent(new CustomEvent('open-goals'))} />}
            </div>
            <div className="hidden md:block">
              {user && <UserMenu user={user} onLogout={handleSignOut} onOpenGuide={() => setShowOnboarding(true)} showCurrency />}
            </div>
          </div>
        </div>
      </nav>
      <OnboardingModal open={showOnboarding} onClose={handleOnboardingClose} />
    </>
  );
}
