'use client';

import { useMode } from '@/components/providers/mode-provider';
import { Calendar, CreditCard, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';

export function BottomTabBar() {
  const { mode, setMode } = useMode();

  const tabs = [
    { id: 'finance' as const, label: 'Calendar', icon: Calendar },
    { id: 'tasks' as const, label: 'Payments', icon: CreditCard },
    { id: 'insights' as const, label: 'Insights', icon: PieChart },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Gradient fade effect at top */}
      <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-[var(--app-bg)] to-transparent pointer-events-none" />

      <div className="bg-[var(--surface)] border-t border-[var(--border-main)] px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = mode === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setMode(tab.id)}
                className="relative flex flex-col items-center gap-1 px-4 py-2 cursor-pointer"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-[var(--teal-bg)] rounded-xl"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 relative z-10 transition-colors ${
                    isActive ? 'text-[var(--teal)]' : 'text-[var(--text-muted)]'
                  }`}
                />
                <span
                  className={`text-[10px] font-medium relative z-10 transition-colors ${
                    isActive ? 'text-[var(--teal)]' : 'text-[var(--text-muted)]'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
