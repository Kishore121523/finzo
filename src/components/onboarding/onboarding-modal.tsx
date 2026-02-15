'use client';

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Bell, PieChart, ChevronLeft, ChevronRight, ArrowRight, CalendarDays, TrendingDown, RefreshCw, CreditCard, Mail, Sun } from 'lucide-react';
import Image from 'next/image';

interface Step {
  icon: typeof Wallet;
  colorVar: string;
  title: string;
  description: ReactNode;
  image?: string;
}

const steps: Step[] = [
  {
    icon: CalendarDays,
    colorVar: '--teal',
    title: 'Calendar View',
    description:
      'Visualize your finances in a monthly calendar format. Each day displays color-coded income and expense totals, helping you quickly identify spending patterns and trends.',
    image: '/calendarPage.png',
  },
  {
    icon: PieChart,
    colorVar: '--purple-color',
    title: 'Category Breakdown',
    description:
      'Visualize your spending with interactive donut charts that display category-wise percentages, transaction counts, and totals. Select or deselect categories to dynamically update the view and analyze your expenses more clearly.',
    image: '/insightsPie.png',
  },
  {
    icon: TrendingDown,
    colorVar: '--expense-color',
    title: 'Spending Trends',
    description:
      'Monitor your daily spending with a smooth line chart that highlights peak expense days, monthly averages, and overall progress giving you a clear view of your financial patterns at a glance.',
    image: '/insightsDailySpending.png',
  },
  {
    icon: RefreshCw,
    colorVar: '--teal',
    title: 'Recurring Transactions',
    description:
      'Set up EMIs, SIPs, subscriptions, and utility bills once they automatically populate each month. Stay on top of recurring payments and never miss an important due date again.',
    image: '/recurring.png',
  },
  {
    icon: CreditCard,
    colorVar: '--purple-color',
    title: 'Payment Tracker',
    description: (
      <>
        Manage bills with a kanban-style board that allows you to move payments across stages to stay on top of your obligations.
        <div className="flex items-center justify-center lg:justify-start gap-2 mt-4">
          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'color-mix(in srgb, var(--expense-color) 15%, transparent)', color: 'var(--expense-color)' }}>To Pay</span>
          <ArrowRight className="w-3.5 h-3.5 text-[var(--text-faint)]" />
          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'color-mix(in srgb, var(--warning-color) 15%, transparent)', color: 'var(--warning-color)' }}>Processing</span>
          <ArrowRight className="w-3.5 h-3.5 text-[var(--text-faint)]" />
          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: 'color-mix(in srgb, var(--teal) 15%, transparent)', color: 'var(--teal)' }}>Paid</span>
        </div>
      </>
    ),
    image: '/paymentPage.png',
  },
  {
    icon: Mail,
    colorVar: '--warning-color',
    title: 'Email Reminders',
    description:
      'Receive timely email notifications before payments are due. Finzo keeps you informed about upcoming bills and subscription renewals so you never miss a deadline.',
    image: '/email.png',
  },
  {
    icon: Sun,
    colorVar: '--teal',
    title: 'Light & Dark Mode',
    description:
      'Switch between a warm light theme and a sleek dark theme for a comfortable viewing experience. Your preference is automatically saved and applied across the entire app.',
    image: '/LightDarkMode.png',
  },
];

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setDirection(1);
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const handleClose = () => {
    setStep(0);
    onClose();
  };

  const current = steps[step];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          {/* Mobile: compact card layout */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-[320px] sm:max-w-md lg:max-w-5xl xl:max-w-6xl bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col lg:flex-row lg:h-[480px]">
              {/* Image panel — desktop only */}
              {current.image && (
                <div className="hidden lg:block lg:w-[60%] relative bg-[var(--app-bg)]">
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={step}
                      custom={direction}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="absolute inset-0 flex items-center justify-center p-6"
                    >
                      <div className="relative w-full h-full rounded-xl overflow-hidden shadow-lg border border-[var(--border-main)]">
                        <Image
                          src={current.image}
                          alt={current.title}
                          fill
                          className="object-cover object-top"
                          sizes="(min-width: 1024px) 55vw, 0vw"
                        />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}

              {/* Content panel */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-5 pt-7 pb-5 sm:px-8 sm:pt-10 sm:pb-6 lg:px-8 lg:pt-12 lg:pb-8 flex flex-col items-center lg:items-start text-center lg:text-left flex-1 justify-center">
                  {/* Step counter — desktop */}
                  <div className="hidden lg:flex items-center gap-2 mb-6">
                    <span className="text-xs font-medium text-[var(--text-muted)]">
                      {step + 1} / {steps.length}
                    </span>
                  </div>

                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={step}
                      custom={direction}
                      initial={{ y: direction * 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: direction * -20, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="flex flex-col items-center lg:items-start h-[220px] sm:h-[260px] lg:h-[240px]"
                    >
                      {/* Icon */}
                      <div
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full lg:rounded-2xl flex items-center justify-center mb-4 sm:mb-5 shrink-0"
                        style={{
                          backgroundColor: `color-mix(in srgb, var(${current.colorVar}) 12%, transparent)`,
                        }}
                      >
                        <current.icon
                          className="w-6 h-6 sm:w-7 sm:h-7"
                          style={{ color: `var(${current.colorVar})` }}
                        />
                      </div>

                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[var(--text-primary)] mb-2 sm:mb-3">
                        {current.title}
                      </h2>
                      <div className="text-[13px] sm:text-sm lg:text-base text-[var(--text-muted)] leading-relaxed max-w-xs lg:max-w-sm">
                        {current.description}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Dots — desktop only (separate row) */}
                <div className="hidden lg:flex justify-start px-8 gap-1.5 pb-5">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setDirection(i > step ? 1 : -1);
                        setStep(i);
                      }}
                      className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                        i === step ? 'w-6' : 'w-1.5'
                      }`}
                      style={{
                        backgroundColor: i === step ? `var(${current.colorVar})` : 'var(--text-faint)',
                      }}
                    />
                  ))}
                </div>

                {/* Actions */}
                <div className="px-5 pb-5 sm:px-8 sm:pb-6 lg:pb-8 flex items-center justify-between">
                  <button
                    onClick={handlePrev}
                    disabled={step === 0}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--border-secondary)] hover:text-[var(--text-primary)] cursor-pointer disabled:opacity-20 disabled:cursor-default disabled:hover:bg-[var(--surface-hover)] disabled:hover:text-[var(--text-secondary)]"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  {/* Dots — mobile only (between arrows) */}
                  <div className="flex lg:hidden items-center gap-1.5">
                    {steps.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setDirection(i > step ? 1 : -1);
                          setStep(i);
                        }}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                          i === step ? 'w-5' : 'w-1.5'
                        }`}
                        style={{
                          backgroundColor: i === step ? `var(${current.colorVar})` : 'var(--text-faint)',
                        }}
                      />
                    ))}
                  </div>

                  {/* Spacer — desktop only */}
                  <div className="hidden lg:block" />

                  <button
                    onClick={handleNext}
                    disabled={step === steps.length - 1}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--border-secondary)] hover:text-[var(--text-primary)] cursor-pointer disabled:opacity-20 disabled:cursor-default disabled:hover:bg-[var(--surface-hover)] disabled:hover:text-[var(--text-secondary)]"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
