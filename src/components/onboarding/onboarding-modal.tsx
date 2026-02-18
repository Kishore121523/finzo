'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Bell, PieChart, ChevronLeft, ChevronRight, ArrowRight, CalendarDays, TrendingDown, RefreshCw, CreditCard, Mail, Sun, X, Sparkles, Keyboard, Target } from 'lucide-react';
import Image from 'next/image';
import { on } from 'events';

interface Step {
  icon: typeof Wallet;
  colorVar: string;
  title: string;
  description: ReactNode;
  image?: string;
  component?: ReactNode;
}

const ShortcutsList = () => {
  const shortcuts = [
    { keys: ['Shift', 'N'], label: 'New Transaction' },
    { keys: ['Shift', 'C / P / I'], label: 'Switch Tabs' },
    { keys: ['Shift', 'B'], label: 'Budgets Tab' },
    { keys: ['Shift', 'D'], label: 'Toggle Theme' },
    { keys: ['Shift', '1-31'], label: 'Jump to Date' },
    { keys: ['Shift', '← / →'], label: 'Navigate Months' },
    { keys: ['← / →'], label: 'Navigate Days' },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-center px-8 md:px-12 py-8 bg-[var(--app-bg)]">
      <div className="space-y-4">
        {shortcuts.map((shortcut, i) => (
          <motion.div
            key={shortcut.label}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + (i * 0.1), duration: 0.4 }}
            className="flex items-center justify-between group"
          >
            <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
              {shortcut.label}
            </span>
            <div className="flex gap-1.5">
              {shortcut.keys.map((key, k) => (
                <span
                  key={k}
                  className="min-w-[28px] h-7 px-2 flex items-center justify-center rounded-md bg-[var(--surface)] border border-[var(--border-main)] shadow-sm text-xs font-bold text-[var(--text-primary)] font-mono"
                >
                  {key}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

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
    icon: Keyboard,
    colorVar: '--teal',
    title: 'Keyboard Shortcuts',
    description:
      'Navigate Finzo efficiently on desktop using keyboard shortcuts. Quickly add transactions, switch between months, and manage your view with greater speed and control.',
    component: <ShortcutsList />,
  },
  {
    icon: RefreshCw,
    colorVar: '--teal',
    title: 'Recurring Transactions',
    description:
      "Set up EMIs, SIPs, subscriptions, and utility bills once. They'll automatically populate each month, helping you stay on top of recurring payments and never miss a due date.",
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
    icon: PieChart,
    colorVar: '--purple-color',
    title: 'Category Breakdown',
    description:
      'Visualize your spending with interactive donut charts that display category-wise percentages, transaction counts, and totals. Select or deselect categories to dynamically update the view and analyze your expenses.',
    image: '/insightsPie.png',
  },
  {
    icon: Target,
    colorVar: '--expense-color',
    title: 'Budget Tracking',
    description:
      'Set monthly spending limits per category and track your progress with a visual bar chart. Instantly see which categories are over budget and how much you have left to spend.',
    image: '/budgetTab.png',
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

  const handleNext = useCallback(() => {
    if (step < steps.length - 1) {
      setDirection(1);
      setStep(step + 1);
    }
  }, [step]);

  const handlePrev = useCallback(() => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  }, [step]);

  const handleClose = useCallback(() => {
    setStep(0);
    onClose();
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        handlePrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [open, handleNext, handlePrev, handleClose]);

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const progress = ((step + 1) / steps.length) * 100;

  const contentVariants = {
    enter: (d: number) => ({ y: d * 30, opacity: 0 }),
    center: { y: 0, opacity: 1 },
    exit: (d: number) => ({ y: d * -30, opacity: 0 }),
  };

  // Shared sub-components to avoid duplication
  const progressBar = (
    <div className="h-1 w-full bg-[var(--fill-subtle)] shrink-0">
      <motion.div
        className="h-full rounded-r-full"
        style={{
          background: `linear-gradient(90deg, var(${current.colorVar}), color-mix(in srgb, var(${current.colorVar}) 70%, var(--teal)))`,
        }}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
  );

  const dots = (
    <div className="flex items-center gap-1.5">
      {steps.map((_, i) => (
        <button
          key={i}
          onClick={() => {
            setDirection(i > step ? 1 : -1);
            setStep(i);
          }}
          className="cursor-pointer p-0.5"
        >
          <motion.div
            className="rounded-full"
            animate={{
              width: i === step ? 24 : 8,
              height: 8,
              backgroundColor: i === step ? `var(${current.colorVar})` : 'var(--text-faint)',
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </button>
      ))}
    </div>
  );

  const backButton = (
    <button
      onClick={handlePrev}
      disabled={step === 0}
      className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-medium text-[var(--text-secondary)] bg-[var(--fill-subtle)] hover:bg-[var(--fill-subtle-hover)] transition-all cursor-pointer disabled:opacity-0 disabled:pointer-events-none"
    >
      <ChevronLeft className="w-4 h-4" />
      Back
    </button>
  );

  const nextButton = (
    <button
      onClick={isLast ? handleClose : handleNext}
      className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold transition-all cursor-pointer hover:opacity-90 active:scale-[0.97]"
      style={{
        backgroundColor: `var(${current.colorVar})`,
        color: 'var(--text-inverse)',
      }}
    >
      {isLast ? (
        <>
          Get Started
        </>
      ) : (
        <>
          Continue
          <ChevronRight className="w-4 h-4" />
        </>
      )}
    </button>
  );

  const imageVariants = {
    enter: (d: number) => ({ opacity: 0, y: d * 40 }),
    center: { opacity: 1, y: 0 },
    exit: (d: number) => ({ opacity: 0, y: d * -40 }),
  };

  const imagePanel = (
    <AnimatePresence mode="wait" custom={direction}>
      {current.component ? (
        <motion.div
          key={step}
          custom={direction}
          variants={imageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0"
        >
          {current.component}
        </motion.div>
      ) : current.image && (
        <motion.div
          key={step}
          custom={direction}
          variants={imageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-0"
        >
          <Image
            src={current.image}
            alt={current.title}
            fill
            className="object-cover object-top"
            sizes="(min-width: 1024px) 60vw, 0vw"
            priority
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  const contentBlock = (align: 'center' | 'left') => (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={step}
        custom={direction}
        variants={contentVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`flex flex-col ${align === 'center' ? 'items-center text-center' : 'items-start text-left'
          }`}
      >
        {/* Icon badge */}
        <div
          className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center mb-3 lg:mb-5 shrink-0"
          style={{
            backgroundColor: `color-mix(in srgb, var(${current.colorVar}) 14%, transparent)`,
            border: `1px solid color-mix(in srgb, var(${current.colorVar}) 20%, transparent)`,
          }}
        >
          <current.icon
            className="w-5 h-5 lg:w-6 lg:h-6"
            style={{ color: `var(${current.colorVar})` }}
          />
        </div>

        {/* Title */}
        <h2 className="text-lg lg:text-[1.7rem] font-bold text-[var(--text-primary)] mb-1.5 lg:mb-3 leading-tight">
          {current.title}
        </h2>

        {/* Description */}
        <div className="text-sm lg:text-[16px] text-[var(--text-secondary)] leading-relaxed lg:leading-[1.5] max-w-sm">
          {current.description}
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
        >
          {/* ============================== */}
          {/* DESKTOP LAYOUT (lg and above)  */}
          {/* ============================== */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="hidden lg:flex relative w-[92vw] max-w-5xl h-[90vh] max-h-[500px] bg-[var(--surface)] rounded-2xl rounded-t-none shadow-2xl overflow-hidden flex-col"
            style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.3), 0 0 0 1px var(--border-main)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {progressBar}

            {/* Two-column content */}
            <div className="flex-1 flex flex-row overflow-hidden min-h-0">
              {/* Content panel — 36% */}
              <div className="w-[40%] flex flex-col justify-center ml-2 px-8 -mt-4">
                {contentBlock('left')}
              </div>

              {/* Image panel — 64% */}
              <div className="flex-1 flex items-center justify-center pt-3 pr-8 pb-0 pl-3 min-h-0">
                <div
                  className="relative w-[95%] h-[85%] rounded-2xl overflow-hidden bg-[var(--app-bg)] border border-[var(--border-main)] pointer-events-none"
                  style={{ boxShadow: 'var(--shadow-lg)' }}
                >
                  {imagePanel}
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="shrink-0 px-10 pb-7 pt-2">
              <div className="flex items-center justify-between gap-4">
                {backButton}
                {dots}
                {nextButton}
              </div>
            </div>
          </motion.div>

          {/* ============================== */}
          {/* MOBILE LAYOUT (below lg)       */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="flex lg:hidden relative w-[85vw] max-w-[380px] h-[340px] bg-[var(--surface)] rounded-2xl shadow-2xl rounded-t-none overflow-hidden flex-col"
            style={{
              boxShadow: '0 25px 60px rgba(0,0,0,0.3), 0 0 0 1px var(--border-main)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {progressBar}



            {/* Text-only content — vertically centered */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 mt-6 overflow-hidden">
              {contentBlock('center')}
            </div>

            {/* Bottom bar — arrow ← dots → arrow */}
            <div className="shrink-0 px-5 pb-5 pt-3">
              <div className="flex items-center justify-between gap-3">
                {/* Back arrow */}
                <button
                  onClick={handlePrev}
                  disabled={step === 0}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--fill-subtle)] hover:bg-[var(--fill-subtle-hover)] text-[var(--text-secondary)] transition-all cursor-pointer disabled:opacity-0 disabled:pointer-events-none shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {dots}

                {/* Next arrow / Get Started */}
                {isLast ? (
                  <button
                    onClick={handleClose}
                    className="flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-semibold transition-all cursor-pointer hover:opacity-90 active:scale-[0.97] shrink-0"
                    style={{
                      backgroundColor: `var(${current.colorVar})`,
                      color: 'var(--text-inverse)',
                    }}
                  >
                    Start
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="flex items-center justify-center w-9 h-9 rounded-full transition-all cursor-pointer hover:opacity-90 active:scale-[0.97] shrink-0"
                    style={{
                      backgroundColor: `var(${current.colorVar})`,
                      color: 'var(--text-inverse)',
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
