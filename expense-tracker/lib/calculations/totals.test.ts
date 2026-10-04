import { describe, it, expect } from 'vitest';
import {
  getTotalIncome,
  getTotalExpenses,
  getBalance,
  getCategoryWiseSpending,
  getDailyAverageSpending,
} from './totals';
import { Transaction } from '@/types/domain';

const mockTransactions: Transaction[] = [
  {
    id: '1',
    user_id: 'user1',
    category_id: 'cat-salary',
    amount: 50000,
    type: 'income',
    payment_method: 'card',
    note: 'Monthly Salary',
    ai_categorized: false,
    transaction_date: '2026-08-01',
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: '2',
    user_id: 'user1',
    category_id: 'cat-food',
    amount: 1500,
    type: 'expense',
    payment_method: 'card',
    note: 'Groceries',
    ai_categorized: false,
    transaction_date: '2026-08-02',
    created_at: '2026-08-02T00:00:00Z',
  },
  {
    id: '3',
    user_id: 'user1',
    category_id: 'cat-food',
    amount: 500,
    type: 'expense',
    payment_method: 'upi',
    note: 'Lunch',
    ai_categorized: false,
    transaction_date: '2026-08-03',
    created_at: '2026-08-03T00:00:00Z',
  },
  {
    id: '4',
    user_id: 'user1',
    category_id: 'cat-transport',
    amount: 2000,
    type: 'expense',
    payment_method: 'upi',
    note: 'Fuel',
    ai_categorized: false,
    transaction_date: '2026-08-04',
    created_at: '2026-08-04T00:00:00Z',
  },
  {
    id: '5',
    user_id: 'user1',
    category_id: 'cat-freelance',
    amount: 10000,
    type: 'income',
    payment_method: 'netbanking',
    note: 'Project Alpha',
    ai_categorized: false,
    transaction_date: '2026-08-05',
    created_at: '2026-08-05T00:00:00Z',
  },
];

describe('Totals Calculations', () => {
  it('should calculate total income correctly', () => {
    const total = getTotalIncome(mockTransactions);
    expect(total).toBe(60000);
  });

  it('should calculate total income within a date range', () => {
    const dateRange = { from: '2026-08-01', to: '2026-08-02' };
    const total = getTotalIncome(mockTransactions, dateRange);
    expect(total).toBe(50000);
  });

  it('should calculate total expenses correctly', () => {
    const total = getTotalExpenses(mockTransactions);
    expect(total).toBe(4000);
  });

  it('should calculate balance (income - expenses)', () => {
    const income = getTotalIncome(mockTransactions);
    const expenses = getTotalExpenses(mockTransactions);
    const balance = getBalance(income, expenses);
    expect(balance).toBe(56000);
  });

  it('should calculate category-wise spending grouped and sorted', () => {
    const spending = getCategoryWiseSpending(mockTransactions);
    expect(spending).toEqual([
      { category_id: 'cat-food', total: 2000, count: 2 },
      { category_id: 'cat-transport', total: 2000, count: 1 },
    ]);
  });

  it('should calculate daily average spending correctly', () => {
    const avg = getDailyAverageSpending(mockTransactions, {
      from: '2026-08-01',
      to: '2026-08-04',
    });
    expect(avg).toBe(1000);
  });
});
