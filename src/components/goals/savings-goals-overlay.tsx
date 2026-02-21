'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { SavingsGoalsView } from '@/components/insights/savings-goals-view';
import { GoalFormModal } from '@/components/insights/goal-form-modal';
import { AddFundsModal } from '@/components/insights/add-funds-modal';
import { useSavingsGoals, SavingsGoal } from '@/lib/hooks/use-savings-goals';

export function SavingsGoalsOverlay() {
  const [open, setOpen] = useState(false);
  const { goals, addGoal, updateGoal, deleteGoal, addFunds, removeFunds, editFundEntry } = useSavingsGoals();

  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [addFundsGoal, setAddFundsGoal] = useState<SavingsGoal | null>(null);

  const [initialGoalId, setInitialGoalId] = useState<string | null>(null);

  const close = useCallback(() => { setOpen(false); setInitialGoalId(null); }, []);

  // Listen for custom event from navbar
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-goals', handler);
    return () => window.removeEventListener('open-goals', handler);
  }, []);

  // Listen for deep-link to a specific goal from calendar
  useEffect(() => {
    const handler = (e: Event) => {
      const goalId = (e as CustomEvent).detail?.goalId;
      if (goalId) {
        setInitialGoalId(goalId);
        setOpen(true);
      }
    };
    window.addEventListener('open-goal-detail', handler);
    return () => window.removeEventListener('open-goal-detail', handler);
  }, []);

  // ESC key + Shift+G hotkey
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ESC to close (only if no modal is open)
      if (e.key === 'Escape' && open && !goalFormOpen && !addFundsOpen) {
        e.preventDefault();
        close();
        return;
      }
      // Shift+G to toggle
      if (e.key === 'G' && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, goalFormOpen, addFundsOpen, close]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="goals-zen"
            className="fixed inset-0 z-[100] flex flex-col bg-[var(--app-bg)] overflow-hidden"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { duration: 0.4 } },
              exit: { opacity: 0, transition: { delay: 1.4, duration: 0.6 } }
            }}
          >
            {/* Ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-[0.06] blur-[100px] pointer-events-none bg-[var(--purple-color)]" />

            {/* Intro Text (The "Realm" transition) */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
              variants={{
                hidden: { opacity: 0, scale: 0.8, filter: 'blur(10px)' },
                visible: {
                  opacity: [0, 1, 1, 0],
                  scale: [0.8, 1, 1, 1.2],
                  filter: ['blur(10px)', 'blur(0px)', 'blur(0px)', 'blur(10px)'],
                  transition: { times: [0, 0.2, 0.8, 1], duration: 1.8, ease: "easeInOut" }
                },
                exit: {
                  opacity: [0, 1, 1, 0],
                  scale: [1.2, 1, 1, 0.8],
                  filter: ['blur(10px)', 'blur(0px)', 'blur(0px)', 'blur(10px)'],
                  transition: { times: [0, 0.2, 0.8, 1], duration: 1.6, ease: "easeInOut" }
                }
              }}
            >
              <h2 className="text-4xl sm:text-6xl font-bold tracking-[0.2em] text-[var(--purple-color)] uppercase">
                Goals
              </h2>
            </motion.div>

            {/* Content (Delayed) */}
            <motion.div
              className="flex flex-col flex-1 w-full h-full"
              variants={{
                hidden: { opacity: 0, scale: 0.95, filter: 'blur(10px)' },
                visible: {
                  opacity: 1, scale: 1, filter: 'blur(0px)',
                  transition: { delay: 1.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
                },
                exit: {
                  opacity: 0, scale: 0.95, filter: 'blur(10px)',
                  transition: { duration: 0.4, ease: "easeInOut" }
                }
              }}
            >
              {/* Minimal header */}
              <div className="flex items-center gap-3 px-4 sm:px-8 pt-5 sm:pt-8 pb-2">
                <button
                  onClick={close}
                  className="p-2 rounded-xl hover:bg-[var(--fill-subtle-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] -ml-2 sm:ml-0">Goals</h1>
              </div>

              {/* Content body */}
              <div
                className="flex-1 overflow-y-auto overflow-x-hidden px-2 sm:px-6 pb-8 lg:py-4 scrollbar-hide"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                <div className="flex flex-col items-center w-full lg:h-full lg:justify-evenly lg:px-4 lg:gap-8">
                  <div className="flex flex-col w-full lg:w-auto lg:flex-row items-center gap-3 sm:gap-12 lg:gap-32">
                    <SavingsGoalsView
                      goals={goals}
                      onCreateGoal={() => { setEditingGoal(null); setGoalFormOpen(true); }}
                      onEditGoal={(goal) => { setEditingGoal(goal); setGoalFormOpen(true); }}
                      onDeleteGoal={deleteGoal}
                      onAddFunds={(goal) => { setAddFundsGoal(goal); setAddFundsOpen(true); }}
                      onRemoveFunds={removeFunds}
                      onEditFundEntry={editFundEntry}
                      initialGoalId={initialGoalId}
                      onInitialGoalConsumed={() => setInitialGoalId(null)}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals — rendered outside the overlay; dialog z-[150] sits above zen z-[100] */}
      {open && (
        <>
          <GoalFormModal
            open={goalFormOpen}
            onOpenChange={(v) => { setGoalFormOpen(v); if (!v) setEditingGoal(null); }}
            editingGoal={editingGoal}
            onSave={async (data) => {
              if (editingGoal) {
                await updateGoal(editingGoal.id, data);
              } else {
                await addGoal(data);
              }
            }}
          />

          <AddFundsModal
            open={addFundsOpen}
            onOpenChange={(v) => { setAddFundsOpen(v); if (!v) setAddFundsGoal(null); }}
            goal={addFundsGoal}
            onAddFunds={addFunds}
          />
        </>
      )}
    </>
  );
}
