'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Tag } from 'lucide-react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/components/providers/auth-provider';
import { useCurrency } from '@/components/providers/currency-provider';
import { Transaction } from '@/lib/types/transaction';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  getCategoryInfo,
  CategoryInfo,
} from '@/lib/constants/categories';
import { format } from 'date-fns';

interface TransactionSearchProps {
  open: boolean;
  onClose: () => void;
  onSelect: (transaction: Transaction) => void;
}

const ALL_CATEGORIES: CategoryInfo[] = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export function TransactionSearch({ open, onClose, onSelect }: TransactionSearchProps) {
  const { user } = useAuth();
  const { formatCurrency } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const isCatMode = searchQuery.toLowerCase().startsWith('cat:');
  const catInputValue = isCatMode ? searchQuery.slice(4) : searchQuery;

  // Fetch all transactions on open
  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;

    const fetchAll = async () => {
      setLoadingTx(true);
      try {
        const q = query(
          collection(db, 'transactions'),
          where('userId', '==', user.uid),
          orderBy('date', 'desc')
        );
        const snap = await getDocs(q);
        if (cancelled) return;
        const txs: Transaction[] = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Transaction[];
        setAllTransactions(txs);
      } catch (err) {
        console.error('Failed to fetch transactions for search:', err);
      } finally {
        if (!cancelled) setLoadingTx(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [open, user]);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-focus input on open
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setDebouncedQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey, { capture: true });
    return () => window.removeEventListener('keydown', handleKey, { capture: true });
  }, [open, onClose]);

  // Filter results
  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return [];

    const q = debouncedQuery.trim().toLowerCase();

    let filtered: Transaction[];

    if (q.startsWith('cat:')) {
      const catQuery = q.slice(4).trim();
      if (!catQuery) return [];
      // Match category IDs and labels
      const matchedCatIds = ALL_CATEGORIES
        .filter(
          (c) =>
            c.id.toLowerCase().includes(catQuery) ||
            c.label.toLowerCase().includes(catQuery)
        )
        .map((c) => c.id);

      filtered = allTransactions.filter(
        (t) => t.category && matchedCatIds.includes(t.category)
      );
    } else {
      filtered = allTransactions.filter((t) =>
        t.description.toLowerCase().includes(q)
      );
    }

    // Already sorted by date desc from Firestore, cap at 50
    return filtered.slice(0, 50);
  }, [debouncedQuery, allTransactions]);

  const handleSelect = useCallback(
    (tx: Transaction) => {
      onClose();
      onSelect(tx);
    },
    [onClose, onSelect]
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 backdrop-blur-md bg-black/40"
          onClick={handleBackdropClick}
        >
          <div ref={containerRef} className="w-full max-w-lg mx-auto mt-[30vh] px-4 flex flex-col" style={{ maxHeight: 'calc(100vh - 30vh - 6rem)' }}>
            {/* Search input */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col min-h-0"
            >
              <div className="flex items-center gap-3 bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl px-4 py-3 shadow-2xl shrink-0">
                <Search className="h-5 w-5 text-[var(--text-faint)] shrink-0" />
                {isCatMode && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--teal-bg)] border border-[var(--teal-border)] shrink-0">
                    <Tag className="h-3 w-3 text-[var(--teal)]" />
                    <span className="text-xs font-semibold text-[var(--teal)]">cat</span>
                  </span>
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={catInputValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(isCatMode ? 'cat:' + val : val);
                  }}
                  onKeyDown={(e) => {
                    // When in cat mode and input is empty, backspace removes the cat: prefix
                    if (isCatMode && e.key === 'Backspace' && catInputValue === '') {
                      e.preventDefault();
                      setSearchQuery('');
                    }
                  }}
                  placeholder={isCatMode ? 'Type a category...' : 'Search transactions...'}
                  className="flex-1 bg-transparent text-[var(--text-primary)] text-base placeholder:text-[var(--text-faint)] outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-[var(--text-faint)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Results */}
              {debouncedQuery.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.12 }}
                  className="mt-2 bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl overflow-hidden overflow-y-auto scrollbar-hide min-h-0 flex-1"
                >
                  {loadingTx ? (
                    <div className="px-4 py-8 text-center text-sm text-[var(--text-faint)]">
                      Loading transactions...
                    </div>
                  ) : results.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-[var(--text-faint)]">
                      No transactions found
                    </div>
                  ) : (
                    <div className="py-1">
                      {results.map((tx, i) => {
                        const isIncome = tx.amount > 0;
                        const catInfo = tx.category
                          ? getCategoryInfo(tx.category, isIncome ? 'income' : 'expense')
                          : null;
                        const dateStr = tx.date?.toDate
                          ? format(tx.date.toDate(), 'MMM d, yyyy')
                          : '';

                        return (
                          <motion.button
                            key={tx.id + '-' + i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: Math.min(i * 0.02, 0.3) }}
                            onClick={() => handleSelect(tx)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-hover)] transition-colors cursor-pointer text-left"
                          >
                            {/* Category dot */}
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: catInfo?.color || 'var(--text-faint)' }}
                            />

                            {/* Description + date */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                {tx.description}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-[var(--text-secondary)]">
                                  {dateStr}
                                </span>
                                {catInfo && (
                                  <span
                                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                                    style={{
                                      backgroundColor: `color-mix(in srgb, ${catInfo.color} 15%, transparent)`,
                                      color: catInfo.color,
                                    }}
                                  >
                                    {catInfo.label}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Amount */}
                            <span
                              className="text-sm font-semibold tabular-nums shrink-0"
                              style={{
                                color: isIncome ? 'var(--teal)' : 'var(--expense-color)',
                              }}
                            >
                              {isIncome ? '+' : '-'}
                              {formatCurrency(Math.abs(tx.amount))}
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Hint */}
              {!debouncedQuery.trim() && (
                <div className="mt-3 flex items-center justify-center gap-4 text-xs text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border-main)] text-[10px] font-mono text-[var(--text-primary)]">
                      esc
                    </kbd>
                    to close
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border-main)] text-[10px] font-mono text-[var(--text-primary)]">
                      cat:
                    </kbd>
                    filter by category
                  </span>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
