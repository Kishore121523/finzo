// Category definitions for income and expenses

export type ExpenseCategory =
  // Daily Essentials
  | 'food'
  | 'groceries'
  | 'transport'
  | 'fuel'
  // Bills & Utilities
  | 'utilities'
  | 'rent'
  | 'emi'
  | 'insurance'
  | 'subscriptions'
  | 'phone'
  | 'internet'
  // Lifestyle
  | 'entertainment'
  | 'shopping'
  | 'travel'
  | 'dining'
  // Health & Education
  | 'health'
  | 'fitness'
  | 'education'
  // Investments
  | 'sip'
  | 'mutual_funds'
  | 'stocks'
  | 'fixed_deposit'
  | 'ppf'
  | 'nps'
  | 'gold'
  | 'crypto'
  | 'real_estate'
  // Personal
  | 'personal'
  | 'gifts'
  | 'charity'
  | 'family'
  // Other
  | 'taxes'
  | 'fees'
  | 'misc';

export type IncomeCategory =
  // Employment
  | 'salary'
  | 'bonus'
  | 'freelance'
  | 'business'
  | 'commission'
  // Investments
  | 'dividends'
  | 'interest'
  | 'capital_gains'
  | 'rental'
  | 'royalties'
  // Other
  | 'refund'
  | 'cashback'
  | 'gift'
  | 'lottery'
  | 'settlements'
  | 'misc';

export type Category = ExpenseCategory | IncomeCategory;

export interface CategoryInfo {
  id: Category;
  label: string;
  color: string;
}

export interface CategoryGroup {
  name: string;
  categories: CategoryInfo[];
}

// Expense categories grouped
export const EXPENSE_CATEGORY_GROUPS: CategoryGroup[] = [
  {
    name: 'Daily Essentials',
    categories: [
      { id: 'food', label: 'Food & Dining', color: '#FF6B6B' },
      { id: 'groceries', label: 'Groceries', color: '#4ECDC4' },
      { id: 'transport', label: 'Transport', color: '#45B7D1' },
      { id: 'fuel', label: 'Fuel', color: '#F97316' },
    ],
  },
  {
    name: 'Bills & Utilities',
    categories: [
      { id: 'utilities', label: 'Utilities', color: '#FFD93D' },
      { id: 'rent', label: 'Rent & Housing', color: '#FFEAA7' },
      { id: 'emi', label: 'EMI / Loan', color: '#EF4444' },
      { id: 'insurance', label: 'Insurance', color: '#A78BFA' },
      { id: 'subscriptions', label: 'Subscriptions', color: '#8B5CF6' },
      { id: 'phone', label: 'Phone & Mobile', color: '#06B6D4' },
      { id: 'internet', label: 'Internet', color: '#3B82F6' },
    ],
  },
  {
    name: 'Lifestyle',
    categories: [
      { id: 'entertainment', label: 'Entertainment', color: '#EC4899' },
      { id: 'shopping', label: 'Shopping', color: '#F472B6' },
      { id: 'travel', label: 'Travel', color: '#14B8A6' },
      { id: 'dining', label: 'Restaurants & Cafe', color: '#FB923C' },
    ],
  },
  {
    name: 'Health & Education',
    categories: [
      { id: 'health', label: 'Health & Medical', color: '#EF4444' },
      { id: 'fitness', label: 'Fitness & Gym', color: '#10B981' },
      { id: 'education', label: 'Education', color: '#6366F1' },
    ],
  },
  {
    name: 'Investments',
    categories: [
      { id: 'sip', label: 'SIP', color: '#A855F7' },
      { id: 'mutual_funds', label: 'Mutual Funds', color: '#06B6D4' },
      { id: 'stocks', label: 'Stocks & Equity', color: '#3B82F6' },
      { id: 'fixed_deposit', label: 'Fixed Deposit', color: '#14B8A6' },
      { id: 'ppf', label: 'PPF', color: '#8B5CF6' },
      { id: 'nps', label: 'NPS', color: '#0EA5E9' },
      { id: 'gold', label: 'Gold', color: '#FBBF24' },
      { id: 'crypto', label: 'Crypto', color: '#F97316' },
      { id: 'real_estate', label: 'Real Estate', color: '#22C55E' },
    ],
  },
  {
    name: 'Personal',
    categories: [
      { id: 'personal', label: 'Personal Care', color: '#D946EF' },
      { id: 'gifts', label: 'Gifts', color: '#F43F5E' },
      { id: 'charity', label: 'Charity & Donations', color: '#FB7185' },
      { id: 'family', label: 'Family & Kids', color: '#E879F9' },
    ],
  },
  {
    name: 'Other',
    categories: [
      { id: 'taxes', label: 'Taxes', color: '#78716C' },
      { id: 'fees', label: 'Bank Fees & Charges', color: '#A1A1AA' },
      { id: 'misc', label: 'Miscellaneous', color: '#6B7280' },
    ],
  },
];

// Income categories grouped
export const INCOME_CATEGORY_GROUPS: CategoryGroup[] = [
  {
    name: 'Employment',
    categories: [
      { id: 'salary', label: 'Salary', color: '#22C55E' },
      { id: 'bonus', label: 'Bonus', color: '#84CC16' },
      { id: 'freelance', label: 'Freelance', color: '#10B981' },
      { id: 'business', label: 'Business Income', color: '#14B8A6' },
      { id: 'commission', label: 'Commission', color: '#06B6D4' },
    ],
  },
  {
    name: 'Investment Returns',
    categories: [
      { id: 'dividends', label: 'Dividends', color: '#0EA5E9' },
      { id: 'interest', label: 'Interest', color: '#3B82F6' },
      { id: 'capital_gains', label: 'Capital Gains', color: '#6366F1' },
      { id: 'rental', label: 'Rental Income', color: '#8B5CF6' },
      { id: 'royalties', label: 'Royalties', color: '#A855F7' },
    ],
  },
  {
    name: 'Other',
    categories: [
      { id: 'refund', label: 'Refund', color: '#F59E0B' },
      { id: 'cashback', label: 'Cashback & Rewards', color: '#FBBF24' },
      { id: 'gift', label: 'Gift Received', color: '#F472B6' },
      { id: 'lottery', label: 'Lottery & Winnings', color: '#EC4899' },
      { id: 'settlements', label: 'Settlements from Friends', color: '#22D3EE' },
      { id: 'misc', label: 'Miscellaneous', color: '#6B7280' },
    ],
  },
];

// Flat arrays for backwards compatibility
export const EXPENSE_CATEGORIES: CategoryInfo[] = EXPENSE_CATEGORY_GROUPS.flatMap(g => g.categories);
export const INCOME_CATEGORIES: CategoryInfo[] = INCOME_CATEGORY_GROUPS.flatMap(g => g.categories);

export const DEFAULT_EXPENSE_CATEGORY: ExpenseCategory = 'misc';
export const DEFAULT_INCOME_CATEGORY: IncomeCategory = 'misc';

export function getCategoryInfo(category: Category, type: 'income' | 'expense'): CategoryInfo {
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return categories.find(c => c.id === category) || categories[categories.length - 1];
}

export function getCategoryColor(category: Category, type: 'income' | 'expense'): string {
  return getCategoryInfo(category, type).color;
}
