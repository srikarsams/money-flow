import { getDatabase, generateId } from '../index';
import { Investment, InvestmentInput, InvestmentValue, InvestmentTypeItem } from '@/src/types';
import { deleteImage, persistImage } from '@/src/services/imageService';

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
  // Joined type fields
  type_name?: string;
  type_icon?: string;
}

function mapRowToInvestment(row: InvestmentRow): Investment {
  const investment: Investment = {
    id: row.id,
    name: row.name,
    typeId: row.type_id,
    amount: row.amount,
    notes: row.notes ?? undefined,
    imageUri: row.image_uri ?? undefined,
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (row.type_name) {
    investment.type = {
      id: row.type_id,
      name: row.type_name,
      icon: row.type_icon || '',
      isCustom: false,
      isActive: true,
    };
  }

  return investment;
}

// Get all investments with optional filters
export async function getAllInvestments(options?: {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  typeId?: string;
  name?: string;
}): Promise<Investment[]> {
  const db = getDatabase();

  let query = `
    SELECT i.*,
           t.name as type_name,
           t.icon as type_icon
    FROM investments i
    LEFT JOIN investment_types t ON i.type_id = t.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (options?.startDate) {
    query += ' AND i.date >= ?';
    params.push(options.startDate);
  }

  if (options?.endDate) {
    query += ' AND i.date <= ?';
    params.push(options.endDate);
  }

  if (options?.typeId) {
    query += ' AND i.type_id = ?';
    params.push(options.typeId);
  }

  if (options?.name) {
    query += ' AND i.name LIKE ?';
    params.push(`%${options.name}%`);
  }

  query += ' ORDER BY i.date DESC, i.created_at DESC';

  if (options?.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);

    if (options?.offset) {
      query += ' OFFSET ?';
      params.push(options.offset);
    }
  }

  const rows = await db.getAllAsync<InvestmentRow>(query, params);
  return rows.map(mapRowToInvestment);
}

export async function getInvestmentById(id: string): Promise<Investment | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<InvestmentRow>(
    `SELECT i.*,
            t.name as type_name,
            t.icon as type_icon
     FROM investments i
     LEFT JOIN investment_types t ON i.type_id = t.id
     WHERE i.id = ?`,
    [id]
  );
  return row ? mapRowToInvestment(row) : null;
}

export async function createInvestment(input: InvestmentInput): Promise<Investment> {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  // Persist image if provided
  let imageUri = input.imageUri ?? null;
  if (imageUri) {
    imageUri = await persistImage(imageUri);
  }

  await db.runAsync(
    `INSERT INTO investments (id, name, type_id, amount, notes, image_uri, date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.typeId,
      input.amount,
      input.notes ?? null,
      imageUri,
      input.date,
      now,
      now,
    ]
  );

  const investment = await getInvestmentById(id);
  return investment!;
}

export async function updateInvestment(
  id: string,
  input: Partial<InvestmentInput>
): Promise<Investment> {
  const db = getDatabase();
  const now = new Date().toISOString();

  // Get existing investment to check for image changes
  const existing = await getInvestmentById(id);

  const fields: string[] = ['updated_at = ?'];
  const values: (string | number | null)[] = [now];

  if (input.name !== undefined) {
    fields.push('name = ?');
    values.push(input.name);
  }
  if (input.typeId !== undefined) {
    fields.push('type_id = ?');
    values.push(input.typeId);
  }
  if (input.amount !== undefined) {
    fields.push('amount = ?');
    values.push(input.amount);
  }
  if (input.notes !== undefined) {
    fields.push('notes = ?');
    values.push(input.notes ?? null);
  }
  if (input.imageUri !== undefined) {
    // Delete old image if changing
    if (existing?.imageUri && existing.imageUri !== input.imageUri) {
      await deleteImage(existing.imageUri);
    }

    let newImageUri = input.imageUri ?? null;
    if (newImageUri && newImageUri !== existing?.imageUri) {
      newImageUri = await persistImage(newImageUri);
    }

    fields.push('image_uri = ?');
    values.push(newImageUri);
  }
  if (input.date !== undefined) {
    fields.push('date = ?');
    values.push(input.date);
  }

  values.push(id);

  await db.runAsync(
    `UPDATE investments SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  const investment = await getInvestmentById(id);
  return investment!;
}

export async function deleteInvestment(id: string): Promise<void> {
  const db = getDatabase();

  // Get investment to delete its image
  const investment = await getInvestmentById(id);
  if (investment?.imageUri) {
    await deleteImage(investment.imageUri);
  }

  await db.runAsync('DELETE FROM investments WHERE id = ?', [id]);
}

// Investment Values (for tracking current value over time)
export async function getLatestValue(investmentName: string): Promise<InvestmentValue | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    investment_name: string;
    current_value: number;
    recorded_at: string;
  }>(
    `SELECT * FROM investment_values
     WHERE investment_name = ?
     ORDER BY recorded_at DESC
     LIMIT 1`,
    [investmentName]
  );

  if (!row) return null;

  return {
    id: row.id,
    investmentName: row.investment_name,
    currentValue: row.current_value,
    recordedAt: row.recorded_at,
  };
}

export async function setCurrentValue(
  investmentName: string,
  currentValue: number
): Promise<InvestmentValue> {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO investment_values (id, investment_name, current_value, recorded_at)
     VALUES (?, ?, ?, ?)`,
    [id, investmentName, currentValue, now]
  );

  return {
    id,
    investmentName,
    currentValue,
    recordedAt: now,
  };
}

export async function getValueHistory(
  investmentName: string,
  limit?: number
): Promise<InvestmentValue[]> {
  const db = getDatabase();

  let query = `
    SELECT * FROM investment_values
    WHERE investment_name = ?
    ORDER BY recorded_at DESC
  `;
  const params: (string | number)[] = [investmentName];

  if (limit) {
    query += ' LIMIT ?';
    params.push(limit);
  }

  const rows = await db.getAllAsync<{
    id: string;
    investment_name: string;
    current_value: number;
    recorded_at: string;
  }>(query, params);

  return rows.map((row) => ({
    id: row.id,
    investmentName: row.investment_name,
    currentValue: row.current_value,
    recordedAt: row.recorded_at,
  }));
}

// Portfolio Summary types
export interface PortfolioItem {
  name: string;
  typeId: string;
  typeName: string;
  typeIcon: string;
  totalInvested: number;
  currentValue: number | null;
  profit: number | null;
  profitPercentage: number | null;
  cagr: number | null;
  transactionCount: number;
  firstInvestmentDate: string;
  lastInvestmentDate: string;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalProfit: number;
  totalProfitPercentage: number;
  items: PortfolioItem[];
}

// Get portfolio summary grouped by investment name
export async function getPortfolioSummary(options?: {
  typeId?: string;
  name?: string;
}): Promise<PortfolioSummary> {
  const db = getDatabase();

  // Get all unique investment names with their totals
  let query = `
    SELECT
      i.name,
      i.type_id,
      t.name as type_name,
      t.icon as type_icon,
      SUM(i.amount) as total_invested,
      COUNT(i.id) as transaction_count,
      MIN(i.date) as first_date,
      MAX(i.date) as last_date
    FROM investments i
    LEFT JOIN investment_types t ON i.type_id = t.id
    WHERE 1=1
  `;
  const params: string[] = [];

  if (options?.typeId) {
    query += ' AND i.type_id = ?';
    params.push(options.typeId);
  }

  if (options?.name) {
    query += ' AND i.name LIKE ?';
    params.push(`%${options.name}%`);
  }

  query += ' GROUP BY i.name, i.type_id ORDER BY total_invested DESC';

  const rows = await db.getAllAsync<{
    name: string;
    type_id: string;
    type_name: string;
    type_icon: string;
    total_invested: number;
    transaction_count: number;
    first_date: string;
    last_date: string;
  }>(query, params);

  // For each investment, get the latest value
  const items: PortfolioItem[] = await Promise.all(
    rows.map(async (row) => {
      const latestValue = await getLatestValue(row.name);
      const currentValue = latestValue?.currentValue ?? null;

      let profit: number | null = null;
      let profitPercentage: number | null = null;
      let cagr: number | null = null;

      if (currentValue !== null && row.total_invested > 0) {
        profit = currentValue - row.total_invested;
        profitPercentage = (profit / row.total_invested) * 100;

        // Calculate CAGR
        const firstDate = new Date(row.first_date);
        const now = new Date();
        const years = (now.getTime() - firstDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

        if (years >= 0.1) {
          // At least ~36 days
          cagr = (Math.pow(currentValue / row.total_invested, 1 / years) - 1) * 100;
        }
      }

      return {
        name: row.name,
        typeId: row.type_id,
        typeName: row.type_name,
        typeIcon: row.type_icon,
        totalInvested: row.total_invested,
        currentValue,
        profit,
        profitPercentage,
        cagr,
        transactionCount: row.transaction_count,
        firstInvestmentDate: row.first_date,
        lastInvestmentDate: row.last_date,
      };
    })
  );

  // Calculate totals
  const totalInvested = items.reduce((sum, item) => sum + item.totalInvested, 0);
  const itemsWithValue = items.filter((item) => item.currentValue !== null);
  const totalCurrentValue = itemsWithValue.reduce((sum, item) => sum + (item.currentValue ?? 0), 0);
  const totalProfit = totalCurrentValue - itemsWithValue.reduce((sum, item) => sum + item.totalInvested, 0);
  const investedWithValue = itemsWithValue.reduce((sum, item) => sum + item.totalInvested, 0);
  const totalProfitPercentage = investedWithValue > 0 ? (totalProfit / investedWithValue) * 100 : 0;

  return {
    totalInvested,
    totalCurrentValue,
    totalProfit,
    totalProfitPercentage,
    items,
  };
}

// Get total invested amount
export async function getTotalInvested(options?: {
  startDate?: string;
  endDate?: string;
  typeId?: string;
}): Promise<number> {
  const db = getDatabase();

  let query = 'SELECT COALESCE(SUM(amount), 0) as total FROM investments WHERE 1=1';
  const params: string[] = [];

  if (options?.startDate) {
    query += ' AND date >= ?';
    params.push(options.startDate);
  }

  if (options?.endDate) {
    query += ' AND date <= ?';
    params.push(options.endDate);
  }

  if (options?.typeId) {
    query += ' AND type_id = ?';
    params.push(options.typeId);
  }

  const result = await db.getFirstAsync<{ total: number }>(query, params);
  return result?.total ?? 0;
}

// Get investments grouped by type
export async function getInvestmentsByType(): Promise<
  { typeId: string; typeName: string; typeIcon: string; total: number; count: number }[]
> {
  const db = getDatabase();

  const rows = await db.getAllAsync<{
    type_id: string;
    type_name: string;
    type_icon: string;
    total: number;
    count: number;
  }>(`
    SELECT
      i.type_id,
      t.name as type_name,
      t.icon as type_icon,
      SUM(i.amount) as total,
      COUNT(i.id) as count
    FROM investments i
    LEFT JOIN investment_types t ON i.type_id = t.id
    GROUP BY i.type_id
    ORDER BY total DESC
  `);

  return rows.map((row) => ({
    typeId: row.type_id,
    typeName: row.type_name,
    typeIcon: row.type_icon,
    total: row.total,
    count: row.count,
  }));
}
