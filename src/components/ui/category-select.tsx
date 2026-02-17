'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Clock, Search } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CategoryGroup, CategoryInfo, Category } from '@/lib/constants/categories';
import { cn } from '@/lib/utils';

const RECENT_GROUP_NAME = 'Recent';

interface CategorySelectProps {
  value: Category;
  onValueChange: (value: Category) => void;
  categoryGroups: CategoryGroup[];
  recentCategoryIds?: string[];
  onCategoryUsed?: (categoryId: string) => void;
  placeholder?: string;
  className?: string;
}

export function CategorySelect({
  value,
  onValueChange,
  categoryGroups,
  recentCategoryIds = [],
  onCategoryUsed,
  placeholder = 'Select category',
  className,
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const allCategories = useMemo(() => categoryGroups.flatMap(g => g.categories), [categoryGroups]);

  const groupsWithRecent = useMemo(() => {
    const recentCategories = recentCategoryIds
      .map(id => allCategories.find(c => c.id === id))
      .filter((c): c is CategoryInfo => c !== undefined);

    if (recentCategories.length === 0) return categoryGroups;

    const recentGroup: CategoryGroup = { name: RECENT_GROUP_NAME, categories: recentCategories };
    return [recentGroup, ...categoryGroups];
  }, [categoryGroups, allCategories, recentCategoryIds]);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase().trim();
    return allCategories.filter(c => c.label.toLowerCase().includes(q));
  }, [search, allCategories]);

  // Handle wheel scroll manually
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      e.stopPropagation();
      scrollRef.current.scrollTop += e.deltaY;
    }
  };

  // Handle touch scroll on mobile
  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setSearch('');
      if (groupsWithRecent.length > 0) {
        setExpandedGroup(groupsWithRecent[0].name);
      }
      // Focus search input after popover opens
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  };

  // Find the selected category info
  const selectedCategory = allCategories.find(c => c.id === value);

  const handleGroupClick = (groupName: string) => {
    setExpandedGroup(expandedGroup === groupName ? null : groupName);
  };

  const handleCategorySelect = useCallback((category: CategoryInfo) => {
    onCategoryUsed?.(category.id as string);
    onValueChange(category.id);
    setOpen(false);
    setExpandedGroup(null);
    setSearch('');
  }, [onCategoryUsed, onValueChange]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between bg-[var(--surface-elevated)] border-[var(--border-secondary)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base font-normal',
            className
          )}
        >
          {selectedCategory ? (
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0"
                style={{ backgroundColor: selectedCategory.color }}
              />
              <span className="truncate">{selectedCategory.label}</span>
            </div>
          ) : (
            <span className="text-[var(--text-muted)]">{placeholder}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-[var(--teal)]" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[280px] sm:w-[300px] p-0 bg-[var(--surface-elevated)] border-[var(--border-secondary)] rounded-lg sm:rounded-xl"
        align="start"
        side="top"
        sideOffset={8}
        avoidCollisions={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement;
          if (scrollRef.current?.contains(target)) {
            e.preventDefault();
          }
        }}
      >
        {/* Search Input */}
        <div className="px-2.5 pt-2.5 pb-1.5 border-b border-[var(--border-secondary)]">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="w-full bg-[var(--surface)] border border-[var(--border-secondary)] rounded-lg pl-8 pr-3 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--teal)] transition-colors"
            />
          </div>
        </div>

        <div
          ref={scrollRef}
          onWheel={handleWheel}
          onTouchMove={handleTouchMove}
          className="max-h-[50vh] sm:max-h-[280px] overflow-y-auto overscroll-contain touch-pan-y [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Search results - flat list */}
          {filteredCategories !== null ? (
            filteredCategories.length > 0 ? (
              <div className="py-1">
                {filteredCategories.map((cat) => (
                  <button
                    key={`search-${cat.id}`}
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--fill-subtle-hover)] transition-colors text-left',
                      value === cat.id && 'bg-[var(--fill-subtle)]'
                    )}
                  >
                    <div
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="flex-1 text-sm sm:text-base text-[var(--text-primary)] truncate">
                      {cat.label}
                    </span>
                    {value === cat.id && (
                      <Check className="h-4 w-4 text-[var(--teal)] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">
                No categories found
              </div>
            )
          ) : (
            /* Normal grouped view */
            groupsWithRecent.map((group) => (
              <div key={group.name} className="border-b border-[var(--border-secondary)] last:border-b-0">
                {/* Group Header */}
                <button
                  type="button"
                  onClick={() => handleGroupClick(group.name)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[var(--fill-subtle)] transition-colors"
                >
                  <span className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                    {group.name === RECENT_GROUP_NAME && <Clock className="h-3 w-3 text-[var(--teal)]" />}
                    {group.name}
                  </span>
                  <motion.div
                    animate={{ rotate: expandedGroup === group.name ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4 text-[var(--teal)]" />
                  </motion.div>
                </button>

                {/* Group Categories */}
                <AnimatePresence initial={false}>
                  {expandedGroup === group.name && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pb-1">
                        {group.categories.map((cat) => (
                          <button
                            key={`${group.name}-${cat.id}`}
                            type="button"
                            onClick={() => handleCategorySelect(cat)}
                            className={cn(
                              'w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--fill-subtle-hover)] transition-colors text-left',
                              value === cat.id && 'bg-[var(--fill-subtle)]'
                            )}
                          >
                            <div
                              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="flex-1 text-sm sm:text-base text-[var(--text-primary)] truncate">
                              {cat.label}
                            </span>
                            {value === cat.id && (
                              <Check className="h-4 w-4 text-[var(--teal)] shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
