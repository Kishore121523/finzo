'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Button } from './button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    if (!loading) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-sm bg-[#1E1E1E] border border-[#2C2C2C] rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 md:p-6">
              <div className="flex items-start gap-4">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center shrink-0
                  ${variant === 'danger' ? 'bg-[#CF6679]/10' : 'bg-[#FFB74D]/10'}
                `}>
                  <AlertTriangle className={`w-6 h-6 ${variant === 'danger' ? 'text-[#CF6679]' : 'text-[#FFB74D]'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {title}
                  </h3>
                  <p className="text-sm text-white/50">
                    {description}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 md:p-6 md:pt-0 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1 bg-transparent border-[#3C3C3C] text-white hover:bg-white/5 hover:text-white h-11 rounded-xl"
              >
                {cancelText}
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className={`flex-1 font-semibold h-11 rounded-xl ${
                  variant === 'danger'
                    ? 'bg-[#CF6679] hover:bg-[#CF6679]/90 text-white'
                    : 'bg-[#FFB74D] hover:bg-[#FFB74D]/90 text-black'
                }`}
              >
                {loading ? 'Deleting...' : confirmText}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
