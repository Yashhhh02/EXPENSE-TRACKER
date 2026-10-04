import { Transaction } from '@/types/domain';

export interface DateRange {
  from: Date | string;
  to: Date | string;
}

function isInRange(tx: Transaction, dateRange?: DateRange): boolean {
  if (!dateRange) return true;
  const d = new Date(tx.transaction_date);
  const from = new Date(dateRange.from);
  const to = new Date(dateRange.to);
  
  // If dateRange.to is a YYYY-MM-DD string or midnight Date, set end of day
  if (typeof dateRange.to === 'string' && dateRange.to.length === 10) {
    to.setHours(23, 59, 59, 999);
  } else if (dateRange.to instanceof Date && dateRange.to.getHours() === 0 && dateRange.to.getMinutes() === 0) {
    to.setHours(23, 59, 59, 999);
  }

  return d >= from && d <= to;
}

export function getTotalIncome(transactions: Transaction[], dateRange?: DateRange): number {
  return transactions
    .filter((tx) => tx.type === 'income' && isInRange(tx, dateRange))
    .reduce((sum, tx) => sum + tx.amount, 0);
}

export function getTotalExpenses(transactions: Transaction[], dateRange?: DateRange): number {
  return transactions
    .filter((tx) => tx.type === 'expense' && isInRange(tx, dateRange))
    .reduce((sum, tx) => sum + tx.amount, 0);
}

export function getBalance(income: number, expenses: number): number {
  return income - expenses;
}

export interface CategorySpending {
  category_id: string | null;
  total: number;
  count: number;
}

export function getCategoryWiseSpending(transactions: Transaction[]): CategorySpending[] {
  const map = new Map<string, CategorySpending>();
  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    const key = tx.category_id ?? '__uncategorized__';
    const existing = map.get(key);
    if (existing) {
      existing.total += tx.amount;
      existing.count += 1;
    } else {
      map.set(key, { category_id: tx.category_id, total: tx.amount, count: 1 });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export function getDailyAverageSpending(transactions: Transaction[], dateRange?: DateRange): number {
  const expenses = transactions.filter(
    (tx) => tx.type === 'expense' && isInRange(tx, dateRange)
  );
  if (expenses.length === 0) return 0;

  let days = 1;
  if (dateRange) {
    const from = new Date(dateRange.from);
    const to = new Date(dateRange.to);
    days = Math.max(1, Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  } else {
    // Determine from actual transaction dates
    const dates = expenses.map((tx) => new Date(tx.transaction_date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    days = Math.max(1, Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1);
  }

  const total = expenses.reduce((sum, tx) => sum + tx.amount, 0);
  return total / days;
}
