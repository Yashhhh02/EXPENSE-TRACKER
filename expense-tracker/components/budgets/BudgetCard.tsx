'use client';

import { Budget, Transaction } from '@/types/domain';
import { getBudgetUsagePercent } from '@/lib/calculations/budgetUsage';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface BudgetCardProps {
  budget: Budget;
  transactions: Transaction[];
  currency: string;
  onEdit: (budget: Budget) => void;
}

export function BudgetCard({ budget, transactions, currency, onEdit }: BudgetCardProps) {
  const monthStart = new Date(budget.month);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

  const spent = transactions
    .filter(
      (tx) =>
        tx.type === 'expense' &&
        tx.category_id === budget.category_id &&
        new Date(tx.transaction_date) >= monthStart &&
        new Date(tx.transaction_date) <= monthEnd
    )
    .reduce((sum, tx) => sum + tx.amount, 0);

  const usagePercent = getBudgetUsagePercent(spent, budget.monthly_limit);
  const remaining = Math.max(0, budget.monthly_limit - spent);
  const isOver = spent > budget.monthly_limit;
  const isNear = usagePercent >= 80 && !isOver;

  const barColor = isOver
    ? 'bg-red-500'
    : isNear
    ? 'bg-amber-400'
    : 'bg-amber-500';

  const badgeColor = isOver
    ? 'bg-red-500/10 text-red-400 border-red-500/20'
    : isNear
    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    : 'bg-amber-500/10 text-amber-400 border-amber-500/20';

  return (
    <div
      className="p-5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl hover:border-zinc-700/80 transition-all cursor-pointer group"
      onClick={() => onEdit(budget)}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold text-white text-sm group-hover:text-amber-400 transition-colors">
            {budget.category?.name || 'Category'}
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">
            Limit: {currency}{budget.monthly_limit.toLocaleString()}
          </p>
        </div>
        <div className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center space-x-1 ${badgeColor}`}>
          {isOver ? (
            <>
              <AlertTriangle className="w-3 h-3" />
              <span>Over Budget</span>
            </>
          ) : isNear ? (
            <>
              <AlertTriangle className="w-3 h-3" />
              <span>{Math.round(usagePercent)}%</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3" />
              <span>{Math.round(usagePercent)}%</span>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(100, usagePercent)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400">
          Spent: <span className={isOver ? 'text-red-400 font-semibold' : 'text-zinc-200'}>
            {currency}{spent.toLocaleString()}
          </span>
        </span>
        <span className="text-zinc-400">
          Remaining: <span className="text-zinc-200">{currency}{remaining.toLocaleString()}</span>
        </span>
      </div>
    </div>
  );
}
