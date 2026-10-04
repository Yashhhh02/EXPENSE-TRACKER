import { Budget, Transaction } from '@/types/domain';

export function getBudgetUsagePercent(spent: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min((spent / limit) * 100, 999); // cap at 999 for display purposes
}

export interface BudgetWithUsage {
  budget: Budget;
  spent: number;
  usagePercent: number;
}

export function getBudgetsNearLimit(
  budgets: Budget[],
  transactions: Transaction[],
  thresholdPercent: number = 80
): BudgetWithUsage[] {
  const results: BudgetWithUsage[] = [];

  for (const budget of budgets) {
    const budgetMonth = budget.month.slice(0, 7);

    const spent = transactions
      .filter(
        (tx) =>
          tx.type === 'expense' &&
          tx.category_id === budget.category_id &&
          tx.transaction_date.slice(0, 7) === budgetMonth
      )
      .reduce((sum, tx) => sum + tx.amount, 0);

    const usagePercent = getBudgetUsagePercent(spent, budget.monthly_limit);

    if (usagePercent >= thresholdPercent) {
      results.push({ budget, spent, usagePercent });
    }
  }

  return results.sort((a, b) => b.usagePercent - a.usagePercent);
}
