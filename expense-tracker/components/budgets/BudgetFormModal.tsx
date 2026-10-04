'use client';

import { useEffect, useState } from 'react';
import { Category, Budget } from '@/types/domain';
import { budgetSchema } from '@/lib/validators/financialSchemas';
import { X, AlertCircle } from 'lucide-react';

interface BudgetFormModalProps {
  budget?: Budget | null;
  onSuccess: () => void;
  onClose: () => void;
}

export function BudgetFormModal({ budget, onSuccess, onClose }: BudgetFormModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState(budget?.category_id || '');
  const [monthlyLimit, setMonthlyLimit] = useState(budget?.monthly_limit?.toString() || '');
  const [month, setMonth] = useState(() => {
    if (budget?.month) return budget.month.substring(0, 7);
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((all: Category[]) => setCategories(all.filter((c) => c.type === 'expense')))
      .catch(() => setError('Failed to load categories'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const rawLimit = parseFloat(monthlyLimit);
    const payload = {
      category_id: categoryId,
      monthly_limit: isNaN(rawLimit) ? -1 : rawLimit,
      month: `${month}-01`,
    };

    const parsed = budgetSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Invalid budget data.');
      return;
    }

    setLoading(true);

    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to save budget.');
      setLoading(false);
      return;
    }

    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">Set Monthly Budget</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center space-x-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={!!budget}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
            >
              <option value="">Select expense category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Month</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Monthly Limit</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-medium text-zinc-400 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-zinc-700">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 text-sm font-semibold text-slate-950 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
