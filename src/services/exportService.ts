import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getAllExpenses } from '../db/queries/expenses';
import { getAllInvestments, getPortfolioSummary } from '../db/queries/investments';

export type ExportType = 'expenses' | 'investments' | 'both';

interface ExportOptions {
  type: ExportType;
  startDate?: string;
  endDate?: string;
}

// Convert expenses to CSV format
function expensesToCSV(expenses: any[]): string {
  const headers = ['Date', 'Title', 'Category', 'Amount', 'Notes'];
  const rows = expenses.map((e) => [
    e.date,
    escapeCSV(e.title || ''),
    escapeCSV(e.category?.name || 'Uncategorized'),
    e.amount.toFixed(2),
    escapeCSV(e.notes || ''),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

// Convert investments to CSV format
function investmentsToCSV(investments: any[]): string {
  const headers = ['Date', 'Name', 'Type', 'Amount Invested', 'Notes'];
  const rows = investments.map((i) => [
    i.date,
    escapeCSV(i.name),
    escapeCSV(i.type?.name || 'Other'),
    i.amount.toFixed(2),
    escapeCSV(i.notes || ''),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

// Convert portfolio summary to CSV format
function portfolioToCSV(portfolio: any): string {
  const headers = [
    'Name',
    'Type',
    'Total Invested',
    'Current Value',
    'Profit',
    'Profit %',
    'CAGR %',
    'Transactions',
  ];
  const rows = portfolio.items.map((i: any) => [
    escapeCSV(i.name),
    escapeCSV(i.typeName),
    i.totalInvested.toFixed(2),
    i.currentValue !== null ? i.currentValue.toFixed(2) : '',
    i.profit !== null ? i.profit.toFixed(2) : '',
    i.profitPercentage !== null ? i.profitPercentage.toFixed(2) : '',
    i.cagr !== null ? i.cagr.toFixed(2) : '',
    i.transactionCount.toString(),
  ]);

  return [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
}

// Escape CSV values
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Generate filename with timestamp
function generateFilename(type: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `moneyflow_${type}_${date}.csv`;
}

// Export data to CSV and share
export async function exportToCSV(options: ExportOptions): Promise<void> {
  const { type, startDate, endDate } = options;

  let csvContent = '';
  let filename = '';

  if (type === 'expenses' || type === 'both') {
    const expenses = await getAllExpenses({ startDate, endDate });
    csvContent += '=== EXPENSES ===\n\n';
    csvContent += expensesToCSV(expenses);
    filename = generateFilename('expenses');
  }

  if (type === 'investments' || type === 'both') {
    const investments = await getAllInvestments({ startDate, endDate });
    const portfolio = await getPortfolioSummary();

    if (type === 'both') {
      csvContent += '\n\n=== INVESTMENTS ===\n\n';
    }
    csvContent += 'Transactions:\n';
    csvContent += investmentsToCSV(investments);
    csvContent += '\n\nPortfolio Summary:\n';
    csvContent += portfolioToCSV(portfolio);
    filename = type === 'both' ? generateFilename('all') : generateFilename('investments');
  }

  // Write to file
  const fileUri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // Check if sharing is available
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device');
  }

  // Share the file
  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export Data',
    UTI: 'public.comma-separated-values-text',
  });
}

// Quick export functions
export async function exportExpenses(options?: {
  startDate?: string;
  endDate?: string;
}): Promise<void> {
  return exportToCSV({ type: 'expenses', ...options });
}

export async function exportInvestments(options?: {
  startDate?: string;
  endDate?: string;
}): Promise<void> {
  return exportToCSV({ type: 'investments', ...options });
}

export async function exportAll(options?: {
  startDate?: string;
  endDate?: string;
}): Promise<void> {
  return exportToCSV({ type: 'both', ...options });
}
