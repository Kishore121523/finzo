'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CategoryGroup, CategoryInfo, Category } from '@/lib/constants/categories';
import { cn } from '@/lib/utils';

interface CategorySelectProps {
  value: Category;
  onValueChange: (value: Category) => void;
  categoryGroups: CategoryGroup[];
  placeholder?: string;
  className?: string;
}

export function CategorySelect({
  value,
  onValueChange,
  categoryGroups,
  placeholder = 'Select category',
  className,
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Open first group by default when popover opens
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && categoryGroups.length > 0) {
      setExpandedGroup(categoryGroups[0].name);
    }
  };

  // Find the selected category info
  const selectedCategory = categoryGroups
    .flatMap(g => g.categories)
    .find(c => c.id === value);

  const handleGroupClick = (groupName: string) => {
    setExpandedGroup(expandedGroup === groupName ? null : groupName);
  };

  const handleCategorySelect = (category: CategoryInfo) => {
    onValueChange(category.id);
    setOpen(false);
    setExpandedGroup(null);
  };

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
          // Allow scrolling inside the popover on touch devices
          const target = e.target as HTMLElement;
          if (scrollRef.current?.contains(target)) {
            e.preventDefault();
          }
        }}
      >
        <div
          ref={scrollRef}
          onWheel={handleWheel}
          onTouchMove={handleTouchMove}
          className="max-h-[50vh] sm:max-h-[320px] overflow-y-auto overscroll-contain touch-pan-y [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {categoryGroups.map((group) => (
            <div key={group.name} className="border-b border-[var(--border-secondary)] last:border-b-0">
              {/* Group Header */}
              <button
                type="button"
                onClick={() => handleGroupClick(group.name)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[var(--fill-subtle)] transition-colors"
              >
                <span className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">
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
                          key={cat.id}
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
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
