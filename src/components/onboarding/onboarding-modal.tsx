'use client';

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Bell, PieChart, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

const steps: { icon: typeof Wallet; color: string; title: string; description: ReactNode }[] = [
  {
    icon: Wallet,
    color: '#03DAC6',
    title: 'Track Finances',
    description:
      'Track your income & expenses with a clean calendar view. Add transactions, set up recurring payments, and see your monthly balance at a glance.',
  },
  {
    icon: Bell,
    color: '#BB86FC',
    title: 'Bill Reminders',
    description: (
      <>
        Never miss a payment. Your recurring expenses automatically become tasks on a kanban board.
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className="px-3 py-1.5 rounded-lg bg-[var(--purple-color)]/15 text-[var(--purple-color)] text-xs font-semibold">To Pay</span>
          <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span className="px-3 py-1.5 rounded-lg bg-[var(--warning-color)]/15 text-[var(--warning-color)] text-xs font-semibold">Pending</span>
          <ArrowRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <span className="px-3 py-1.5 rounded-lg bg-[var(--teal-bg)] text-[var(--teal)] text-xs font-semibold">Paid</span>
        </div>
      </>
    ),
  },
  {
    icon: PieChart,
    color: '#CF6679',
    title: 'Smart Insights',
    description:
      'Visualize your spending with interactive charts. See category breakdowns, daily spending patterns, and track where your money goes.',
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
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-[320px] sm:max-w-md bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-7 pb-5 sm:px-8 sm:pt-12 sm:pb-10 flex flex-col items-center text-center">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  initial={{ x: direction * 60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: direction * -60, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="flex flex-col items-center h-[210px] sm:h-[270px] justify-center"
                >
                  <div
                    className="w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-4 sm:mb-6"
                    style={{
                      backgroundColor: `${current.color}15`,
                      boxShadow: `0 0 40px ${current.color}20`,
                    }}
                  >
                    <current.icon
                      className="w-7 h-7 sm:w-11 sm:h-11"
                      style={{ color: current.color }}
                    />
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold text-[var(--text-primary)] mb-2 sm:mb-3">
                    {current.title}
                  </h2>
                  <div className="text-[13px] sm:text-base text-[var(--text-muted)] leading-relaxed max-w-xs">
                    {current.description}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 pb-4 sm:pb-6">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full transition-colors duration-200"
                  style={{
                    backgroundColor: i === step ? 'var(--teal)' : 'var(--text-faint)',
                  }}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 sm:px-8 sm:pb-8 flex items-center justify-between">
              <button
                onClick={handlePrev}
                disabled={step === 0}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--border-secondary)] hover:text-[var(--text-primary)] cursor-pointer disabled:opacity-20 disabled:cursor-default disabled:hover:bg-[var(--surface-hover)] disabled:hover:text-[var(--text-secondary)]"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div />
              <button
                onClick={handleNext}
                disabled={step === steps.length - 1}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--border-secondary)] hover:text-[var(--text-primary)] cursor-pointer disabled:opacity-20 disabled:cursor-default disabled:hover:bg-[var(--surface-hover)] disabled:hover:text-[var(--text-secondary)]"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
