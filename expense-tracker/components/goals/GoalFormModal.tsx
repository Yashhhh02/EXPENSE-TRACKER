'use client';

import { useState } from 'react';
import { Goal } from '@/types/domain';
import { goalSchema } from '@/lib/validators/financialSchemas';
import { X, AlertCircle } from 'lucide-react';

interface GoalFormModalProps {
  goal?: Goal | null;
  mode?: 'create' | 'update_amount';
  onSuccess: () => void;
  onClose: () => void;
}

export function GoalFormModal({ goal, mode = 'create', onSuccess, onClose }: GoalFormModalProps) {
  const [title, setTitle] = useState(goal?.title || '');
  const [targetAmount, setTargetAmount] = useState(goal?.target_amount?.toString() || '');
  const [currentAmount, setCurrentAmount] = useState(goal?.current_amount?.toString() || '0');
  const [targetDate, setTargetDate] = useState(goal?.target_date || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUpdateMode = mode === 'update_amount';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let res: Response;

    if (isUpdateMode && goal) {
      const rawCurrent = parseFloat(currentAmount);
      const parsed = goalSchema.partial().safeParse({
        current_amount: isNaN(rawCurrent) ? 0 : rawCurrent,
      });

      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message || 'Invalid amount.');
        return;
      }

      setLoading(true);

      res = await fetch(`/api/goals/${goal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
    } else {
      const rawTarget = parseFloat(targetAmount);
      const rawCurrent = parseFloat(currentAmount);
      const payload = {
        title: title.trim(),
        target_amount: isNaN(rawTarget) ? 0 : rawTarget,
        current_amount: isNaN(rawCurrent) ? 0 : rawCurrent,
        target_date: targetDate || null,
      };

      const parsed = goalSchema.safeParse(payload);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message || 'Invalid goal data.');
        return;
      }

      setLoading(true);

      res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
    }

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to save goal.');
      setLoading(false);
      return;
    }

    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">
            {isUpdateMode ? 'Update Saved Amount' : goal ? 'Edit Goal' : 'New Savings Goal'}
          </h2>
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

          {!isUpdateMode && (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Goal Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Emergency Fund, New Laptop"
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Target Amount</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="e.g. 100000"
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">Target Date <span className="text-zinc-500">(optional)</span></label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              {isUpdateMode ? 'Current Saved Amount' : 'Already Saved (optional)'}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-sm font-medium text-zinc-400 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-zinc-700">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-3 text-sm font-semibold text-slate-950 bg-gradient-to-r from-amber-500 to-yellow-400 rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50">
              {loading ? 'Saving...' : isUpdateMode ? 'Update Amount' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
