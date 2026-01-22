import * as SQLite from 'expo-sqlite';
import { SCHEMA_SQL, DEFAULT_CATEGORIES, DEFAULT_INCOME_CATEGORIES, DEFAULT_INVESTMENT_TYPES } from './schema';

const DB_NAME = 'moneyflow.db';

let db: SQLite.SQLiteDatabase | null = null;

// Generate a simple unique ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Initialize the database
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  db = await SQLite.openDatabaseAsync(DB_NAME);

  // Create tables
  await db.execAsync(SCHEMA_SQL);

  // Run migrations
  await runMigrations(db);

  // Seed default data if needed
  await seedDefaultData(db);

  return db;
}

// Run database migrations for schema changes
async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  // Check if title column exists in expenses table
  const expenseTableInfo = await database.getAllAsync<{ name: string }>(
    "PRAGMA table_info(expenses)"
  );
  const hasTitle = expenseTableInfo.some(col => col.name === 'title');
  const hasExpenseType = expenseTableInfo.some(col => col.name === 'type');

  if (!hasTitle) {
    await database.execAsync('ALTER TABLE expenses ADD COLUMN title TEXT');
  }

  // Add type column to expenses table
  if (!hasExpenseType) {
    await database.execAsync("ALTER TABLE expenses ADD COLUMN type TEXT NOT NULL DEFAULT 'expense'");
    await database.execAsync('CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(type)');
  }

  // Check if type column exists in categories table
  const categoryTableInfo = await database.getAllAsync<{ name: string }>(
    "PRAGMA table_info(categories)"
  );
  const hasCategoryType = categoryTableInfo.some(col => col.name === 'type');

  // Add type column to categories table
  if (!hasCategoryType) {
    await database.execAsync("ALTER TABLE categories ADD COLUMN type TEXT NOT NULL DEFAULT 'expense'");
    await database.execAsync('CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type)');
  }
}

// Get the database instance
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// Seed default categories and investment types
async function seedDefaultData(database: SQLite.SQLiteDatabase): Promise<void> {
  // Check if expense categories exist
  const expenseCategoryCount = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM categories WHERE type = 'expense'"
  );

  if (expenseCategoryCount?.count === 0) {
    // Insert default expense categories
    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      const cat = DEFAULT_CATEGORIES[i];
      await database.runAsync(
        `INSERT INTO categories (id, name, icon, color, type, is_custom, is_active, sort_order)
         VALUES (?, ?, ?, ?, ?, 0, 1, ?)`,
        [generateId(), cat.name, cat.icon, cat.color, cat.type, i]
      );
    }
  }

  // Check if income categories exist
  const incomeCategoryCount = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM categories WHERE type = 'income'"
  );

  if (incomeCategoryCount?.count === 0) {
    // Insert default income categories
    const startOrder = DEFAULT_CATEGORIES.length;
    for (let i = 0; i < DEFAULT_INCOME_CATEGORIES.length; i++) {
      const cat = DEFAULT_INCOME_CATEGORIES[i];
      await database.runAsync(
        `INSERT INTO categories (id, name, icon, color, type, is_custom, is_active, sort_order)
         VALUES (?, ?, ?, ?, ?, 0, 1, ?)`,
        [generateId(), cat.name, cat.icon, cat.color, cat.type, startOrder + i]
      );
    }
  }

  // Check if investment types exist
  const typeCount = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM investment_types'
  );

  if (typeCount?.count === 0) {
    // Insert default investment types
    for (const type of DEFAULT_INVESTMENT_TYPES) {
      await database.runAsync(
        `INSERT INTO investment_types (id, name, icon, is_custom, is_active)
         VALUES (?, ?, ?, 0, 1)`,
        [generateId(), type.name, type.icon]
      );
    }
  }

  // Set default settings if not exist
  const settings = [
    ['hasCompletedOnboarding', 'false'],
    ['theme', 'system'],
    ['currency', 'USD'],
    ['currencySymbol', '$'],
    ['isPremium', 'false'],
    ['notificationsEnabled', 'false'],
    ['notificationTime', '20:00'],
  ];

  for (const [key, value] of settings) {
    await database.runAsync(
      `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
      [key, value]
    );
  }
}

// Helper to get a setting
export async function getSetting(key: string): Promise<string | null> {
  const database = getDatabase();
  const result = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return result?.value ?? null;
}

// Helper to set a setting
export async function setSetting(key: string, value: string): Promise<void> {
  const database = getDatabase();
  await database.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value]
  );
}
