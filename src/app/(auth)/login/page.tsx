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
  ArrowUpRight,
  ArrowDownRight,
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
      <div className="flex h-screen items-center justify-center bg-[#0A0A0A]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#2C2C2C] border-t-[#03DAC6]"></div>
      </div>
    );
  }

  const features = [
    { icon: Wallet, label: 'Track Expenses', color: '#03DAC6' },
    { icon: PieChart, label: 'Smart Insights', color: '#BB86FC' },
    { icon: Bell, label: 'Bill Reminders', color: '#CF6679' },
  ];

  // Floating icons configuration
  const floatingIcons = [
    { icon: TrendingUp, x: '15%', y: '20%', delay: 0, color: '#03DAC6', size: 32 },
    { icon: CreditCard, x: '75%', y: '15%', delay: 0.2, color: '#BB86FC', size: 28 },
    { icon: Target, x: '80%', y: '70%', delay: 0.4, color: '#03DAC6', size: 30 },
    { icon: PieChart, x: '20%', y: '75%', delay: 0.6, color: '#CF6679', size: 26 },
    { icon: Wallet, x: '85%', y: '40%', delay: 0.8, color: '#FFB74D', size: 24 },
    { icon: Bell, x: '10%', y: '45%', delay: 1, color: '#BB86FC', size: 22 },
  ];

  return (
    <div className="relative flex min-h-screen bg-[#0A0A0A] overflow-hidden">
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
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
              backgroundColor: `${item.color}10`,
              border: `1px solid ${item.color}20`,
            }}
          >
            <item.icon size={item.size} style={{ color: item.color }} />
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
            <h1 className="text-4xl md:text-5xl font-bold text-[#03DAC6] tracking-tight mb-1">
              Finzo
            </h1>
            <h2 className="text-white/40 text-base md:text-lg font-normal">
              Personal Finance Management Made Simple
            </h2>
          </motion.div>

          {/* Stats preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-[#141414] border border-[#252525] rounded-2xl p-5 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/50 text-sm">Monthly Overview</span>
              <span className="text-white/30 text-xs">Preview</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1A1A1A] rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowUpRight className="w-4 h-4 text-[#03DAC6]" />
                  <span className="text-white/40 text-xs">Income</span>
                </div>
                <span className="text-white font-semibold">$4,250</span>
              </div>
              <div className="bg-[#1A1A1A] rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowDownRight className="w-4 h-4 text-[#CF6679]" />
                  <span className="text-white/40 text-xs">Expenses</span>
                </div>
                <span className="text-white font-semibold">$2,180</span>
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
                className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#141414] border border-[#252525]"
              >
                <feature.icon className="w-3.5 h-3.5" style={{ color: feature.color }} />
                <span className="text-xs text-white/60">{feature.label}</span>
              </motion.div>
            ))}
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
