import { getDatabase, generateId } from '../index';
import { InvestmentTypeItem } from '@/src/types';

interface InvestmentTypeRow {
  id: string;
  name: string;
  icon: string;
  is_custom: number;
  is_active: number;
}

function mapRowToInvestmentType(row: InvestmentTypeRow): InvestmentTypeItem {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    isCustom: row.is_custom === 1,
    isActive: row.is_active === 1,
  };
}

export async function getAllInvestmentTypes(): Promise<InvestmentTypeItem[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<InvestmentTypeRow>(
    'SELECT * FROM investment_types WHERE is_active = 1 ORDER BY is_custom ASC, name ASC'
  );
  return rows.map(mapRowToInvestmentType);
}

export async function getInvestmentTypeById(id: string): Promise<InvestmentTypeItem | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<InvestmentTypeRow>(
    'SELECT * FROM investment_types WHERE id = ?',
    [id]
  );
  return row ? mapRowToInvestmentType(row) : null;
}

export async function createInvestmentType(
  name: string,
  icon: string
): Promise<InvestmentTypeItem> {
  const db = getDatabase();
  const id = generateId();

  await db.runAsync(
    `INSERT INTO investment_types (id, name, icon, is_custom, is_active)
     VALUES (?, ?, ?, 1, 1)`,
    [id, name, icon]
  );

  return {
    id,
    name,
    icon,
    isCustom: true,
    isActive: true,
  };
}

export async function updateInvestmentType(
  id: string,
  updates: { name?: string; icon?: string }
): Promise<void> {
  const db = getDatabase();

  const fields: string[] = [];
  const values: string[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.icon !== undefined) {
    fields.push('icon = ?');
    values.push(updates.icon);
  }

  if (fields.length === 0) return;

  values.push(id);

  await db.runAsync(
    `UPDATE investment_types SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function deleteInvestmentType(id: string): Promise<void> {
  const db = getDatabase();
  // Soft delete - mark as inactive
  await db.runAsync(
    'UPDATE investment_types SET is_active = 0 WHERE id = ?',
    [id]
  );
}
