import { Timestamp } from 'firebase/firestore';

export interface Transaction {
  id: string;
  userId: string;
  date: Timestamp;
  description: string;
  amount: number; // positive = income, negative = expense
  isRecurring: boolean;
  // For recurring transactions: stores the original month/year when recurring started (e.g., "2025-02")
  recurringStartMonth?: string;
  // For recurring transactions: months where this transaction is skipped/excluded (e.g., ["2025-03", "2025-05"])
  excludedMonths?: string[];
  createdAt: Timestamp;
  // Flag to indicate this is a virtual transaction (not saved in DB, computed for display)
  isVirtual?: boolean;
}

export interface TransactionFormData {
  description: string;
  amount: number;
  date: Date;
  isRecurring?: boolean;
}
