import { getDatabase, generateId } from '../index';
import { Expense, ExpenseInput, Category } from '@/src/types';
import { deleteImage, persistImage } from '@/src/services/imageService';

interface ExpenseRow {
  id: string;
  title: string | null;
  amount: number;
  category_id: string;
  notes: string | null;
  image_uri: string | null;
  date: string;
  created_at: string;
  updated_at: string;
  // Joined category fields
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}

function mapRowToExpense(row: ExpenseRow): Expense {
  const expense: Expense = {
    id: row.id,
    title: row.title ?? undefined,
    amount: row.amount,
    categoryId: row.category_id,
    notes: row.notes ?? undefined,
    imageUri: row.image_uri ?? undefined,
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (row.category_name) {
    expense.category = {
      id: row.category_id,
      name: row.category_name,
      icon: row.category_icon || '',
      color: row.category_color || '',
      isCustom: false,
      isActive: true,
      sortOrder: 0,
      createdAt: '',
      updatedAt: '',
    };
  }

  return expense;
}

export async function getAllExpenses(options?: {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
}): Promise<Expense[]> {
  const db = getDatabase();

  let query = `
    SELECT e.*,
           c.name as category_name,
           c.icon as category_icon,
           c.color as category_color
    FROM expenses e
    LEFT JOIN categories c ON e.category_id = c.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (options?.startDate) {
    query += ' AND e.date >= ?';
    params.push(options.startDate);
  }

  if (options?.endDate) {
    query += ' AND e.date <= ?';
    params.push(options.endDate);
  }

  if (options?.categoryId) {
    query += ' AND e.category_id = ?';
    params.push(options.categoryId);
  }

  query += ' ORDER BY e.date DESC, e.created_at DESC';

  if (options?.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);

    if (options?.offset) {
      query += ' OFFSET ?';
      params.push(options.offset);
    }
  }

  const rows = await db.getAllAsync<ExpenseRow>(query, params);
  return rows.map(mapRowToExpense);
}

export async function getExpenseById(id: string): Promise<Expense | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<ExpenseRow>(
    `SELECT e.*,
            c.name as category_name,
            c.icon as category_icon,
            c.color as category_color
     FROM expenses e
     LEFT JOIN categories c ON e.category_id = c.id
     WHERE e.id = ?`,
    [id]
  );
  return row ? mapRowToExpense(row) : null;
}

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  // Persist image to app's document directory if provided
  let imageUri = input.imageUri ?? null;
  if (imageUri) {
    imageUri = await persistImage(imageUri);
  }

  await db.runAsync(
    `INSERT INTO expenses (id, title, amount, category_id, notes, image_uri, date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.title ?? null,
      input.amount,
      input.categoryId,
      input.notes ?? null,
      imageUri,
      input.date,
      now,
      now,
    ]
  );

  // Fetch the created expense with category info
  const expense = await getExpenseById(id);
  return expense!;
}

export async function updateExpense(
  id: string,
  input: Partial<ExpenseInput>
): Promise<Expense> {
  const db = getDatabase();
  const now = new Date().toISOString();

  // Get existing expense to check for image changes
  const existing = await getExpenseById(id);

  const fields: string[] = ['updated_at = ?'];
  const values: (string | number | null)[] = [now];

  if (input.title !== undefined) {
    fields.push('title = ?');
    values.push(input.title ?? null);
  }
  if (input.amount !== undefined) {
    fields.push('amount = ?');
    values.push(input.amount);
  }
  if (input.categoryId !== undefined) {
    fields.push('category_id = ?');
    values.push(input.categoryId);
  }
  if (input.notes !== undefined) {
    fields.push('notes = ?');
    values.push(input.notes ?? null);
  }
  if (input.imageUri !== undefined) {
    // Delete old image if it's being changed or removed
    if (existing?.imageUri && existing.imageUri !== input.imageUri) {
      await deleteImage(existing.imageUri);
    }

    // Persist new image if provided
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
    `UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  const expense = await getExpenseById(id);
  return expense!;
}

export async function deleteExpense(id: string): Promise<void> {
  const db = getDatabase();

  // Get expense to delete its image
  const expense = await getExpenseById(id);
  if (expense?.imageUri) {
    await deleteImage(expense.imageUri);
  }

  await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
}

export async function getTodayTotal(): Promise<number> {
  const db = getDatabase();
  const today = new Date().toISOString().split('T')[0];

  const result = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(amount) as total FROM expenses WHERE date = ?',
    [today]
  );

  return result?.total ?? 0;
}

export async function getMonthTotal(year: number, month: number): Promise<number> {
  const db = getDatabase();
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

  const result = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(amount) as total FROM expenses WHERE date >= ? AND date <= ?',
    [startDate, endDate]
  );

  return result?.total ?? 0;
}

export async function getExpensesByDateRange(
  startDate: string,
  endDate: string
): Promise<Expense[]> {
  return getAllExpenses({ startDate, endDate });
}

export async function getRecentExpenses(limit: number = 10): Promise<Expense[]> {
  return getAllExpenses({ limit });
}
