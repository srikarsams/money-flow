// Category types
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isCustom: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Expense types
export interface Expense {
  id: string;
  title?: string;
  amount: number;
  categoryId: string;
  category?: Category;
  notes?: string;
  imageUri?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseInput {
  title?: string;
  amount: number;
  categoryId: string;
  notes?: string;
  imageUri?: string;
  date: string;
}

// Investment types
export type InvestmentType =
  | 'stocks'
  | 'mutual_funds'
  | 'crypto'
  | 'gold'
  | 'bonds'
  | 'real_estate'
  | 'other';

export interface InvestmentTypeItem {
  id: string;
  name: string;
  icon: string;
  isCustom: boolean;
  isActive: boolean;
}

export interface Investment {
  id: string;
  name: string;
  typeId: string;
  type?: InvestmentTypeItem;
  amount: number;
  notes?: string;
  imageUri?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentValue {
  id: string;
  investmentName: string;
  currentValue: number;
  recordedAt: string;
}

export interface InvestmentInput {
  name: string;
  typeId: string;
  amount: number;
  notes?: string;
  imageUri?: string;
  date: string;
}

// Settings types
export interface AppSettings {
  hasCompletedOnboarding: boolean;
  theme: 'light' | 'dark' | 'system';
  currency: string;
  currencySymbol: string;
  isPremium: boolean;
  notificationsEnabled: boolean;
  notificationTime: string;
}

// Analytics types
export interface CategoryStat {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  total: number;
  percentage: number;
  count: number;
}

export interface DailyStat {
  date: string;
  total: number;
}

export interface MonthlyStats {
  month: string;
  totalExpenses: number;
  totalInvestments: number;
  categoryBreakdown: CategoryStat[];
  dailyBreakdown: DailyStat[];
}
