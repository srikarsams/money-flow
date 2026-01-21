import { getDatabase } from '../index';

export interface CategoryTotal {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  total: number;
  count: number;
  percentage: number;
}

export interface DailyTotal {
  date: string;
  total: number;
  count: number;
}

export interface MonthlyTotal {
  year: number;
  month: number;
  total: number;
  count: number;
}

export async function getExpensesByCategory(options?: {
  startDate?: string;
  endDate?: string;
}): Promise<CategoryTotal[]> {
  const db = getDatabase();

  let query = `
    SELECT
      c.id as category_id,
      c.name as category_name,
      c.icon as category_icon,
      c.color as category_color,
      COALESCE(SUM(e.amount), 0) as total,
      COUNT(e.id) as count
    FROM categories c
    LEFT JOIN expenses e ON c.id = e.category_id
  `;

  const params: string[] = [];
  const conditions: string[] = [];

  if (options?.startDate) {
    conditions.push('(e.date >= ? OR e.id IS NULL)');
    params.push(options.startDate);
  }

  if (options?.endDate) {
    conditions.push('(e.date <= ? OR e.id IS NULL)');
    params.push(options.endDate);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += `
    GROUP BY c.id, c.name, c.icon, c.color
    HAVING total > 0
    ORDER BY total DESC
  `;

  const rows = await db.getAllAsync<{
    category_id: string;
    category_name: string;
    category_icon: string;
    category_color: string;
    total: number;
    count: number;
  }>(query, params);

  // Calculate total for percentages
  const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);

  return rows.map((row) => ({
    categoryId: row.category_id,
    categoryName: row.category_name,
    categoryIcon: row.category_icon,
    categoryColor: row.category_color,
    total: row.total,
    count: row.count,
    percentage: grandTotal > 0 ? (row.total / grandTotal) * 100 : 0,
  }));
}

export async function getDailyTotals(options?: {
  startDate?: string;
  endDate?: string;
  categoryIds?: string[];
  limit?: number;
}): Promise<DailyTotal[]> {
  const db = getDatabase();

  let query = `
    SELECT
      date,
      SUM(amount) as total,
      COUNT(id) as count
    FROM expenses
    WHERE 1=1
  `;

  const params: (string | number)[] = [];

  if (options?.startDate) {
    query += ' AND date >= ?';
    params.push(options.startDate);
  }

  if (options?.endDate) {
    query += ' AND date <= ?';
    params.push(options.endDate);
  }

  if (options?.categoryIds && options.categoryIds.length > 0) {
    const placeholders = options.categoryIds.map(() => '?').join(',');
    query += ` AND category_id IN (${placeholders})`;
    params.push(...options.categoryIds);
  }

  query += ' GROUP BY date ORDER BY date DESC';

  if (options?.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);
  }

  const rows = await db.getAllAsync<{
    date: string;
    total: number;
    count: number;
  }>(query, params);

  return rows.map((row) => ({
    date: row.date,
    total: row.total,
    count: row.count,
  }));
}

export async function getMonthlyTotals(options?: {
  startDate?: string;
  endDate?: string;
  categoryIds?: string[];
  limit?: number;
}): Promise<MonthlyTotal[]> {
  const db = getDatabase();

  let query = `
    SELECT
      CAST(strftime('%Y', date) AS INTEGER) as year,
      CAST(strftime('%m', date) AS INTEGER) as month,
      SUM(amount) as total,
      COUNT(id) as count
    FROM expenses
    WHERE 1=1
  `;

  const params: (string | number)[] = [];

  if (options?.startDate) {
    query += ' AND date >= ?';
    params.push(options.startDate);
  }

  if (options?.endDate) {
    query += ' AND date <= ?';
    params.push(options.endDate);
  }

  if (options?.categoryIds && options.categoryIds.length > 0) {
    const placeholders = options.categoryIds.map(() => '?').join(',');
    query += ` AND category_id IN (${placeholders})`;
    params.push(...options.categoryIds);
  }

  query += ' GROUP BY year, month ORDER BY year DESC, month DESC';

  if (options?.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);
  }

  const rows = await db.getAllAsync<{
    year: number;
    month: number;
    total: number;
    count: number;
  }>(query, params);

  return rows.map((row) => ({
    year: row.year,
    month: row.month,
    total: row.total,
    count: row.count,
  }));
}

export async function getTotalExpenses(options?: {
  startDate?: string;
  endDate?: string;
  categoryIds?: string[];
}): Promise<{ total: number; count: number }> {
  const db = getDatabase();

  let query = 'SELECT COALESCE(SUM(amount), 0) as total, COUNT(id) as count FROM expenses WHERE 1=1';
  const params: string[] = [];

  if (options?.startDate) {
    query += ' AND date >= ?';
    params.push(options.startDate);
  }

  if (options?.endDate) {
    query += ' AND date <= ?';
    params.push(options.endDate);
  }

  if (options?.categoryIds && options.categoryIds.length > 0) {
    const placeholders = options.categoryIds.map(() => '?').join(',');
    query += ` AND category_id IN (${placeholders})`;
    params.push(...options.categoryIds);
  }

  const result = await db.getFirstAsync<{ total: number; count: number }>(query, params);
  return { total: result?.total ?? 0, count: result?.count ?? 0 };
}

export async function getAverageDaily(options?: {
  startDate?: string;
  endDate?: string;
  categoryIds?: string[];
}): Promise<number> {
  const db = getDatabase();

  let query = `
    SELECT AVG(daily_total) as average
    FROM (
      SELECT date, SUM(amount) as daily_total
      FROM expenses
      WHERE 1=1
  `;

  const params: string[] = [];

  if (options?.startDate) {
    query += ' AND date >= ?';
    params.push(options.startDate);
  }

  if (options?.endDate) {
    query += ' AND date <= ?';
    params.push(options.endDate);
  }

  if (options?.categoryIds && options.categoryIds.length > 0) {
    const placeholders = options.categoryIds.map(() => '?').join(',');
    query += ` AND category_id IN (${placeholders})`;
    params.push(...options.categoryIds);
  }

  query += ' GROUP BY date)';

  const result = await db.getFirstAsync<{ average: number | null }>(query, params);
  return result?.average ?? 0;
}
