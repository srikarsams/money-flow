import { getDatabase, generateId } from '../index';
import { Category } from '@/src/types';

interface CategoryRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_custom: number;
  is_active: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function mapRowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    isCustom: row.is_custom === 1,
    isActive: row.is_active === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllCategories(): Promise<Category[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<CategoryRow>(
    'SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC'
  );
  return rows.map(mapRowToCategory);
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<CategoryRow>(
    'SELECT * FROM categories WHERE id = ?',
    [id]
  );
  return row ? mapRowToCategory(row) : null;
}

export async function createCategory(
  name: string,
  icon: string,
  color: string
): Promise<Category> {
  const db = getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  // Get the highest sort order
  const maxOrder = await db.getFirstAsync<{ max_order: number | null }>(
    'SELECT MAX(sort_order) as max_order FROM categories'
  );
  const sortOrder = (maxOrder?.max_order ?? -1) + 1;

  await db.runAsync(
    `INSERT INTO categories (id, name, icon, color, is_custom, is_active, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, 1, ?, ?, ?)`,
    [id, name, icon, color, sortOrder, now, now]
  );

  return {
    id,
    name,
    icon,
    color,
    isCustom: true,
    isActive: true,
    sortOrder,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateCategory(
  id: string,
  updates: { name?: string; icon?: string; color?: string }
): Promise<void> {
  const db = getDatabase();
  const now = new Date().toISOString();

  const fields: string[] = ['updated_at = ?'];
  const values: (string | number)[] = [now];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.icon !== undefined) {
    fields.push('icon = ?');
    values.push(updates.icon);
  }
  if (updates.color !== undefined) {
    fields.push('color = ?');
    values.push(updates.color);
  }

  values.push(id);

  await db.runAsync(
    `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteCategory(id: string): Promise<void> {
  const db = getDatabase();
  // Soft delete - just mark as inactive
  await db.runAsync(
    'UPDATE categories SET is_active = 0, updated_at = ? WHERE id = ?',
    [new Date().toISOString(), id]
  );
}

export async function reorderCategories(
  categoryIds: string[]
): Promise<void> {
  const db = getDatabase();
  const now = new Date().toISOString();

  for (let i = 0; i < categoryIds.length; i++) {
    await db.runAsync(
      'UPDATE categories SET sort_order = ?, updated_at = ? WHERE id = ?',
      [i, now, categoryIds[i]]
    );
  }
}
