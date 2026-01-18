'use client';

import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Transaction } from '@/lib/types/transaction';
import { format } from 'date-fns';
import { Trash2, Edit, RefreshCw } from 'lucide-react';
import { useCurrency } from '@/components/providers/currency-provider';

interface TransactionItemProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionItem = memo(function TransactionItem({ transaction, onEdit, onDelete }: TransactionItemProps) {
  const { formatCurrency } = useCurrency();
  const isIncome = transaction.amount >= 0;

  return (
    <Card className="flex items-center justify-between p-3 md:p-4 bg-[#1E1E1E] border-[#2C2C2C] hover:bg-[#2C2C2C] transition-colors">
      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
        {transaction.isRecurring && (
          <span title="Recurring transaction" className="shrink-0">
            <RefreshCw className="h-3 w-3 md:h-4 md:w-4 text-[#03DAC6]" />
          </span>
        )}
        <div className="min-w-0">
          <p className="font-medium text-sm md:text-base text-white truncate">{transaction.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <div className="text-right">
          <p
            className={`text-sm md:text-lg font-semibold ${
              isIncome ? 'text-[#03DAC6]' : 'text-[#CF6679]'
            }`}
          >
            {isIncome ? '+' : '-'}
            {formatCurrency(transaction.amount)}
          </p>
        </div>
        <div className="flex gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(transaction)}
            className="h-7 w-7 md:h-9 md:w-9 text-white/60 hover:text-white hover:bg-white/10"
          >
            <Edit className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(transaction.id)}
            className="h-7 w-7 md:h-9 md:w-9 text-[#CF6679] hover:text-[#CF6679]/80 hover:bg-white/10"
          >
            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
});
