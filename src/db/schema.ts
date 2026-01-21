// Default expense categories
export const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', icon: 'restaurant', color: '#EF4444' },
  { name: 'Groceries', icon: 'cart', color: '#F97316' },
  { name: 'Transportation', icon: 'car', color: '#3B82F6' },
  { name: 'Utilities', icon: 'flash', color: '#FBBF24' },
  { name: 'Rent/Mortgage', icon: 'home', color: '#8B5CF6' },
  { name: 'Shopping', icon: 'bag', color: '#EC4899' },
  { name: 'Entertainment', icon: 'game-controller', color: '#06B6D4' },
  { name: 'Health & Fitness', icon: 'fitness', color: '#10B981' },
  { name: 'Personal Care', icon: 'body', color: '#F472B6' },
  { name: 'Bills & Subscriptions', icon: 'receipt', color: '#6366F1' },
  { name: 'Insurance', icon: 'shield-checkmark', color: '#14B8A6' },
  { name: 'Education', icon: 'school', color: '#A855F7' },
  { name: 'Travel', icon: 'airplane', color: '#0EA5E9' },
  { name: 'Gifts & Donations', icon: 'gift', color: '#F43F5E' },
  { name: 'Miscellaneous', icon: 'ellipsis-horizontal', color: '#6B7280' },
];

// Default investment types
export const DEFAULT_INVESTMENT_TYPES = [
  { name: 'Stocks', icon: 'trending-up' },
  { name: 'Mutual Funds', icon: 'pie-chart' },
  { name: 'Crypto', icon: 'logo-bitcoin' },
  { name: 'Gold', icon: 'diamond' },
  { name: 'Bonds', icon: 'document-text' },
  { name: 'Real Estate', icon: 'business' },
  { name: 'Other', icon: 'cube' },
];

// SQL Schema definitions
export const SCHEMA_SQL = `
-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  is_custom INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  title TEXT,
  amount REAL NOT NULL,
  category_id TEXT NOT NULL,
  notes TEXT,
  image_uri TEXT,
  date TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Investment types table
CREATE TABLE IF NOT EXISTS investment_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  is_custom INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1
);

-- Investments table
CREATE TABLE IF NOT EXISTS investments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type_id TEXT NOT NULL,
  amount REAL NOT NULL,
  notes TEXT,
  image_uri TEXT,
  date TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (type_id) REFERENCES investment_types(id)
);

-- Investment values table (tracks current value over time)
CREATE TABLE IF NOT EXISTS investment_values (
  id TEXT PRIMARY KEY,
  investment_name TEXT NOT NULL,
  current_value REAL NOT NULL,
  recorded_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Settings table (key-value store)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_investments_date ON investments(date);
CREATE INDEX IF NOT EXISTS idx_investments_name ON investments(name);
CREATE INDEX IF NOT EXISTS idx_investment_values_name ON investment_values(investment_name);
`;
