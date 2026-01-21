import * as SQLite from 'expo-sqlite';
import { SCHEMA_SQL, DEFAULT_CATEGORIES, DEFAULT_INVESTMENT_TYPES } from './schema';

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
  const tableInfo = await database.getAllAsync<{ name: string }>(
    "PRAGMA table_info(expenses)"
  );
  const hasTitle = tableInfo.some(col => col.name === 'title');

  if (!hasTitle) {
    await database.execAsync('ALTER TABLE expenses ADD COLUMN title TEXT');
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
  // Check if categories exist
  const categoryCount = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories'
  );

  if (categoryCount?.count === 0) {
    // Insert default categories
    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      const cat = DEFAULT_CATEGORIES[i];
      await database.runAsync(
        `INSERT INTO categories (id, name, icon, color, is_custom, is_active, sort_order)
         VALUES (?, ?, ?, ?, 0, 1, ?)`,
        [generateId(), cat.name, cat.icon, cat.color, i]
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
