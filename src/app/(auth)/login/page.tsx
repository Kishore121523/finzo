'use client';

import { GoogleSignInButton } from '@/components/auth/google-signin-button';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  PieChart,
  TrendingUp,
  CreditCard,
  Bell,
  Target,
} from 'lucide-react';
import { FinzoLogo } from '@/components/layout/logo';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--app-bg)]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--surface-hover)] border-t-[var(--teal)]"></div>
      </div>
    );
  }

  const features = [
    { icon: Wallet, label: 'Track Expenses', color: 'var(--teal)' },
    { icon: PieChart, label: 'Smart Insights', color: 'var(--purple-color)' },
    { icon: Bell, label: 'Bill Reminders', color: 'var(--expense-color)' },
  ];

  // Floating icons configuration
  const floatingIcons = [
    { icon: TrendingUp, x: '15%', y: '20%', delay: 0, colorVar: '--teal', size: 32 },
    { icon: CreditCard, x: '75%', y: '15%', delay: 0.2, colorVar: '--purple-color', size: 28 },
    { icon: Target, x: '80%', y: '70%', delay: 0.4, colorVar: '--teal', size: 30 },
    { icon: PieChart, x: '20%', y: '75%', delay: 0.6, colorVar: '--expense-color', size: 26 },
    { icon: Wallet, x: '85%', y: '40%', delay: 0.8, colorVar: '--warning-color', size: 24 },
    { icon: Bell, x: '10%', y: '45%', delay: 1, colorVar: '--purple-color', size: 22 },
  ];

  return (
    <div className="relative flex min-h-screen bg-[var(--app-bg)] overflow-hidden">
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(var(--text-primary) 1px, transparent 1px), linear-gradient(90deg, var(--text-primary) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating icons */}
      {floatingIcons.map((item, index) => (
        <motion.div
          key={index}
          className="absolute hidden lg:block"
          style={{ left: item.x, top: item.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: 0.6,
            scale: 1,
            y: [0, -10, 0],
          }}
          transition={{
            opacity: { delay: item.delay, duration: 0.5 },
            scale: { delay: item.delay, duration: 0.5 },
            y: { delay: item.delay, duration: 3, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <div
            className="p-3 rounded-2xl backdrop-blur-sm"
            style={{
              backgroundColor: `color-mix(in srgb, var(${item.colorVar}) 8%, transparent)`,
              border: `1px solid color-mix(in srgb, var(${item.colorVar}) 12%, transparent)`,
            }}
          >
            <item.icon size={item.size} style={{ color: `var(${item.colorVar})` }} />
          </div>
        </motion.div>
      ))}

      {/* Main content */}
      <div className="relative z-10 w-full flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo and app name */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center mb-4"
          >
            <FinzoLogo className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-3" />
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--teal)] tracking-tight mb-1">
              Finzo
            </h1>
            <h2 className="text-[var(--text-muted)] text-base md:text-lg font-normal">
              Personal Finance Management Made Simple
            </h2>
          </motion.div>

          {/* Stats preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6 bg-[var(--surface)] border border-[var(--border-main)] w-[300px] lg:w-[400px] mx-auto rounded-2xl p-5"
          >
            {/* Balance */}
            <p className="text-xs text-center text-[var(--text-muted)] mb-1">Net Balance</p>
            <p className=" text-xl lg:text-2xl text-center font-bold text-[var(--text-primary)] tracking-tight">$2,070</p>

            {/* Proportion bar */}
            <div className="flex h-1.5 rounded-full overflow-hidden mt-4 mb-4 bg-[var(--fill-subtle)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '66%' }}
                transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                className="rounded-full"
                style={{ backgroundColor: 'var(--teal)' }}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '34%' }}
                transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
                className="rounded-full ml-0.5"
                style={{ backgroundColor: 'var(--expense-color)' }}
              />
            </div>

            {/* Labels */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 lg:gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--teal)' }} />
                <span className="text-[10px] lg:text-xs text-[var(--text-muted)]">Income</span>
                <span className="text-[10px] lg:text-sm font-semibold text-[var(--text-primary)]">$4,250</span>
              </div>
              <div className="flex items-center gap-1 lg:gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--expense-color)' }} />
                <span className="text-[10px] lg:text-xs text-[var(--text-muted)]">Expenses</span>
                <span className="text-[10px] lg:text-sm font-semibold text-[var(--text-primary)]">$2,180</span>
              </div>
            </div>
          </motion.div>

          {/* Google Sign In Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-6"
          >
            <GoogleSignInButton />
          </motion.div>

          {/* Feature chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--surface)] border border-[var(--border-main)]"
              >
                <feature.icon className="w-3.5 h-3.5" style={{ color: feature.color }} />
                <span className="text-xs text-[var(--text-secondary)]">{feature.label}</span>
              </motion.div>
            ))}
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}