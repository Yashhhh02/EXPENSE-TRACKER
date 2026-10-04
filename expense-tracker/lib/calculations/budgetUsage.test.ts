import { describe, it, expect } from 'vitest';
import { getBudgetUsagePercent, getBudgetsNearLimit } from './budgetUsage';
import { Budget, Transaction } from '@/types/domain';

const mockBudgets: Budget[] = [
  {
    id: 'b1',
    user_id: 'user1',
    category_id: 'cat-food',
    monthly_limit: 10000,
    month: '2026-08-01',
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: 'b2',
    user_id: 'user1',
    category_id: 'cat-shopping',
    monthly_limit: 5000,
    month: '2026-08-01',
    created_at: '2026-08-01T00:00:00Z',
  },
];

const mockTransactions: Transaction[] = [
  {
    id: 't1',
    user_id: 'user1',
    category_id: 'cat-food',
    amount: 8500,
    type: 'expense',
    payment_method: 'card',
    note: 'Supermarket',
    ai_categorized: false,
    transaction_date: '2026-08-10',
    created_at: '2026-08-10T00:00:00Z',
  },
  {
    id: 't2',
    user_id: 'user1',
    category_id: 'cat-shopping',
    amount: 2000,
    type: 'expense',
    payment_method: 'card',
    note: 'Clothes',
    ai_categorized: false,
    transaction_date: '2026-08-15',
    created_at: '2026-08-15T00:00:00Z',
  },
];

describe('Budget Usage Calculations', () => {
  it('should calculate budget usage percentage correctly', () => {
    expect(getBudgetUsagePercent(5000, 10000)).toBe(50);
    expect(getBudgetUsagePercent(8500, 10000)).toBe(85);
    expect(getBudgetUsagePercent(0, 5000)).toBe(0);
    expect(getBudgetUsagePercent(500, 0)).toBe(0);
  });

  it('should identify budgets near or over limit threshold', () => {
    const nearLimit = getBudgetsNearLimit(mockBudgets, mockTransactions, 80);
    expect(nearLimit.length).toBe(1);
    expect(nearLimit[0].budget.category_id).toBe('cat-food');
    expect(nearLimit[0].spent).toBe(8500);
    expect(nearLimit[0].usagePercent).toBe(85);
  });
});
