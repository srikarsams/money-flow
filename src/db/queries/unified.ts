import { getDatabase } from '../index';
import {
  UnifiedTransaction,
  UnifiedTransactionType,
  MoneyFlowSummary,
  TransactionFilterType,
  Category,
  InvestmentTypeItem,
  TransactionType,
} from '@/src/types';

interface ExpenseRow {
  id: string;
  title: string | null;
  amount: number;
  category_id: string;
  type: TransactionType;
  notes: string | null;
  image_uri: string | null;
  date: string;
  created_at: string;
  updated_at: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  category_type?: TransactionType;
}

interface InvestmentRow {
  id: string;
  name: string;
  type_id: string;
  amount: number;
  notes: string | null;
  image_uri: string | null;
  date: string;
  created_at: string;
  updated_at: string;
  type_name?: string;
  type_icon?: string;
}

function mapExpenseToUnified(row: ExpenseRow): UnifiedTransaction {
  const transaction: UnifiedTransaction = {
    id: row.id,
    type: row.type as UnifiedTransactionType,
    amount: row.amount,
    date: row.date,
    title: row.title ?? undefined,
    categoryId: row.category_id,
    notes: row.notes ?? undefined,
    imageUri: row.image_uri ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (row.category_name) {
    transaction.category = {
      id: row.category_id,
      name: row.category_name,
      icon: row.category_icon || '',
      color: row.category_color || '',
      type: row.category_type || 'expense',
      isCustom: false,
      isActive: true,
      sortOrder: 0,
      createdAt: '',
      updatedAt: '',
    };
  }

  return transaction;
}

function mapInvestmentToUnified(row: InvestmentRow): UnifiedTransaction {
  const transaction: UnifiedTransaction = {
    id: row.id,
    type: 'investment',
    amount: row.amount,
    date: row.date,
    investmentName: row.name,
    notes: row.notes ?? undefined,
    imageUri: row.image_uri ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (row.type_name) {
    transaction.investmentType = {
      id: row.type_id,
      name: row.type_name,
      icon: row.type_icon || '',
      isCustom: false,
      isActive: true,
    };
  }

  return transaction;
}

export interface UnifiedQueryOptions {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  filterType?: TransactionFilterType;
}

// Get unified transactions from both expenses and investments tables
export async function getUnifiedTransactions(
  options?: UnifiedQueryOptions
): Promise<UnifiedTransaction[]> {
  const db = getDatabase();

  const filterType = options?.filterType || 'all';
  const shouldIncludeExpenses = filterType === 'all' || filterType === 'expense';
  const shouldIncludeIncome = filterType === 'all' || filterType === 'income';
  const shouldIncludeInvestments = filterType === 'all' || filterType === 'investment';

  const results: UnifiedTransaction[] = [];

  // Query expenses/income
  if (shouldIncludeExpenses || shouldIncludeIncome) {
    let expenseQuery = `
      SELECT e.*,
             c.name as category_name,
             c.icon as category_icon,
             c.color as category_color,
             c.type as category_type
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE 1=1
    `;
    const expenseParams: (string | number)[] = [];

    if (filterType === 'expense') {
      expenseQuery += " AND e.type = 'expense'";
    } else if (filterType === 'income') {
      expenseQuery += " AND e.type = 'income'";
    }

    if (options?.startDate) {
      expenseQuery += ' AND e.date >= ?';
      expenseParams.push(options.startDate);
    }

    if (options?.endDate) {
      expenseQuery += ' AND e.date <= ?';
      expenseParams.push(options.endDate);
    }

    expenseQuery += ' ORDER BY e.date DESC, e.created_at DESC';

    const expenseRows = await db.getAllAsync<ExpenseRow>(expenseQuery, expenseParams);
    results.push(...expenseRows.map(mapExpenseToUnified));
  }

  // Query investments
  if (shouldIncludeInvestments) {
    let investmentQuery = `
      SELECT i.*,
             t.name as type_name,
             t.icon as type_icon
      FROM investments i
      LEFT JOIN investment_types t ON i.type_id = t.id
      WHERE 1=1
    `;
    const investmentParams: (string | number)[] = [];

    if (options?.startDate) {
      investmentQuery += ' AND i.date >= ?';
      investmentParams.push(options.startDate);
    }

    if (options?.endDate) {
      investmentQuery += ' AND i.date <= ?';
      investmentParams.push(options.endDate);
    }

    investmentQuery += ' ORDER BY i.date DESC, i.created_at DESC';

    const investmentRows = await db.getAllAsync<InvestmentRow>(investmentQuery, investmentParams);
    results.push(...investmentRows.map(mapInvestmentToUnified));
  }

  // Sort all results by date (newest first)
  results.sort((a, b) => {
    const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Apply pagination after merge
  const offset = options?.offset || 0;
  const limit = options?.limit;

  if (limit) {
    return results.slice(offset, offset + limit);
  }

  return results.slice(offset);
}

// Get money flow summary for a date range
export async function getMoneyFlowSummary(
  startDate: string,
  endDate: string
): Promise<MoneyFlowSummary> {
  const db = getDatabase();

  // Query expenses and income totals
  const expenseResult = await db.getFirstAsync<{ total: number | null }>(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM expenses
     WHERE date >= ? AND date <= ? AND type = 'expense'`,
    [startDate, endDate]
  );

  const incomeResult = await db.getFirstAsync<{ total: number | null }>(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM expenses
     WHERE date >= ? AND date <= ? AND type = 'income'`,
    [startDate, endDate]
  );

  const investmentResult = await db.getFirstAsync<{ total: number | null }>(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM investments
     WHERE date >= ? AND date <= ?`,
    [startDate, endDate]
  );

  const totalIncome = incomeResult?.total ?? 0;
  const totalExpenses = expenseResult?.total ?? 0;
  const totalInvestments = investmentResult?.total ?? 0;
  const liquidSavings = totalIncome - totalExpenses - totalInvestments;

  // Calculate percentages (based on income)
  const expensePercentage = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
  const investmentPercentage = totalIncome > 0 ? (totalInvestments / totalIncome) * 100 : 0;
  const savingsPercentage = totalIncome > 0 ? (liquidSavings / totalIncome) * 100 : 0;

  return {
    totalIncome,
    totalExpenses,
    totalInvestments,
    liquidSavings,
    expensePercentage,
    investmentPercentage,
    savingsPercentage,
  };
}

// Get income allocation breakdown for pie chart
export interface IncomeAllocationItem {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export async function getIncomeAllocationBreakdown(
  startDate: string,
  endDate: string
): Promise<IncomeAllocationItem[]> {
  const summary = await getMoneyFlowSummary(startDate, endDate);

  const items: IncomeAllocationItem[] = [];

  if (summary.totalExpenses > 0) {
    items.push({
      name: 'Expenses',
      value: summary.totalExpenses,
      percentage: summary.expensePercentage,
      color: '#ef4444', // red
    });
  }

  if (summary.totalInvestments > 0) {
    items.push({
      name: 'Investments',
      value: summary.totalInvestments,
      percentage: summary.investmentPercentage,
      color: '#6366f1', // indigo
    });
  }

  if (summary.liquidSavings > 0) {
    items.push({
      name: 'Savings',
      value: summary.liquidSavings,
      percentage: summary.savingsPercentage,
      color: '#22c55e', // green
    });
  }

  return items;
}

// Get unified monthly statistics
export interface UnifiedMonthlyStat {
  month: string; // YYYY-MM format
  income: number;
  expenses: number;
  investments: number;
  savings: number;
}

export async function getUnifiedMonthlyStats(
  year: number,
  monthCount: number = 12
): Promise<UnifiedMonthlyStat[]> {
  const db = getDatabase();
  const stats: UnifiedMonthlyStat[] = [];

  for (let i = 0; i < monthCount; i++) {
    const date = new Date(year, i, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;

    const summary = await getMoneyFlowSummary(startDate, endDate);

    stats.push({
      month,
      income: summary.totalIncome,
      expenses: summary.totalExpenses,
      investments: summary.totalInvestments,
      savings: summary.liquidSavings,
    });
  }

  return stats;
}

// Get unified yearly statistics
export interface UnifiedYearlyStat {
  year: number;
  income: number;
  expenses: number;
  investments: number;
  savings: number;
}

export async function getUnifiedYearlyStats(
  startYear: number,
  endYear: number
): Promise<UnifiedYearlyStat[]> {
  const stats: UnifiedYearlyStat[] = [];

  for (let year = startYear; year <= endYear; year++) {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const summary = await getMoneyFlowSummary(startDate, endDate);

    stats.push({
      year,
      income: summary.totalIncome,
      expenses: summary.totalExpenses,
      investments: summary.totalInvestments,
      savings: summary.liquidSavings,
    });
  }

  return stats;
}

// Get category breakdown for expenses or income
export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  total: number;
  percentage: number;
  count: number;
}

export async function getCategoryBreakdown(
  startDate: string,
  endDate: string,
  type: 'expense' | 'income'
): Promise<CategoryBreakdownItem[]> {
  const db = getDatabase();

  const rows = await db.getAllAsync<{
    category_id: string;
    category_name: string;
    category_icon: string;
    category_color: string;
    total: number;
    count: number;
  }>(
    `SELECT
       e.category_id,
       c.name as category_name,
       c.icon as category_icon,
       c.color as category_color,
       SUM(e.amount) as total,
       COUNT(e.id) as count
     FROM expenses e
     LEFT JOIN categories c ON e.category_id = c.id
     WHERE e.date >= ? AND e.date <= ? AND e.type = ?
     GROUP BY e.category_id
     ORDER BY total DESC`,
    [startDate, endDate, type]
  );

  const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);

  return rows.map((row) => ({
    categoryId: row.category_id,
    categoryName: row.category_name,
    categoryIcon: row.category_icon,
    categoryColor: row.category_color,
    total: row.total,
    percentage: grandTotal > 0 ? (row.total / grandTotal) * 100 : 0,
    count: row.count,
  }));
}

// Get investment type breakdown
export interface InvestmentTypeBreakdownItem {
  typeId: string;
  typeName: string;
  typeIcon: string;
  total: number;
  percentage: number;
  count: number;
}

export async function getInvestmentTypeBreakdown(
  startDate: string,
  endDate: string
): Promise<InvestmentTypeBreakdownItem[]> {
  const db = getDatabase();

  const rows = await db.getAllAsync<{
    type_id: string;
    type_name: string;
    type_icon: string;
    total: number;
    count: number;
  }>(
    `SELECT
       i.type_id,
       t.name as type_name,
       t.icon as type_icon,
       SUM(i.amount) as total,
       COUNT(i.id) as count
     FROM investments i
     LEFT JOIN investment_types t ON i.type_id = t.id
     WHERE i.date >= ? AND i.date <= ?
     GROUP BY i.type_id
     ORDER BY total DESC`,
    [startDate, endDate]
  );

  const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);

  return rows.map((row) => ({
    typeId: row.type_id,
    typeName: row.type_name,
    typeIcon: row.type_icon,
    total: row.total,
    percentage: grandTotal > 0 ? (row.total / grandTotal) * 100 : 0,
    count: row.count,
  }));
}
