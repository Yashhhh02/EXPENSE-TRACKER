'use client';

import { useEffect, useState } from 'react';
import { Category, Frequency, RecurringTransaction } from '@/types/domain';
import { recurringSchema } from '@/lib/validators/financialSchemas';
import { X, DollarSign, AlertCircle } from 'lucide-react';

interface RecurringFormModalProps {
  item?: RecurringTransaction | null;
  onSuccess: () => void;
  onClose: () => void;
}

export function RecurringFormModal({ item, onSuccess, onClose }: RecurringFormModalProps) {
  const [name, setName] = useState(item?.name || '');
  const [amount, setAmount] = useState(item?.amount?.toString() || '');
  const [type, setType] = useState<'income' | 'expense'>(item?.type || 'expense');
  const [categoryId, setCategoryId] = useState(item?.category_id || '');
  const [frequency, setFrequency] = useState<Frequency>(item?.frequency || 'monthly');
  const [nextDueDate, setNextDueDate] = useState(
    item?.next_due_date || new Date().toISOString().split('T')[0]
  );
  const [autoAdd, setAutoAdd] = useState(item?.auto_add ?? true);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(
    item?.reminder_days_before?.toString() || '3'
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => setError('Failed to load categories'));
  }, []);

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const rawAmount = parseFloat(amount);
    const rawReminderDays = parseInt(reminderDaysBefore);

    const payload = {
      name: name.trim(),
      amount: isNaN(rawAmount) ? 0 : rawAmount,
      type,
      category_id: categoryId || null,
      frequency,
      next_due_date: nextDueDate,
      auto_add: autoAdd,
      reminder_days_before: isNaN(rawReminderDays) ? 3 : rawReminderDays,
      is_active: item ? item.is_active : true,
    };

    const parsed = recurringSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Invalid form input.');
      return;
    }

    setLoading(true);

    const url = item ? `/api/recurring/${item.id}` : '/api/recurring';
    const method = item ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to save recurring item.');
      setLoading(false);
      return;
    }

    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800 shrink-0">
          <h2 className="text-lg font-bold text-white">
            {item ? 'Edit Recurring Schedule' : 'New Recurring Transaction'}
          </h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center space-x-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => { setType('expense'); setCategoryId(''); }}
              className={`py-2.5 text-sm font-semibold rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); setCategoryId(''); }}
              className={`py-2.5 text-sm font-semibold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Income
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Schedule Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Netflix, Rent, Salary"
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Amount</label>
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm"
            >
              <option value="">Select category</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Frequency & Next Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as Frequency)}
                className="w-full px-3 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Next Due Date</label>
              <input
                type="date"
                required
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full px-3 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* Reminder Days & Auto-Add */}
          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-200">Auto-add transaction</p>
                <p className="text-xs text-zinc-400">Automatically post transaction on due date</p>
              </div>
              <input
                type="checkbox"
                checked={autoAdd}
                onChange={(e) => setAutoAdd(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Reminder days before due date
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={reminderDaysBefore}
                onChange={(e) => setReminderDaysBefore(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-medium text-zinc-400 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 text-sm font-semibold text-slate-950 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
            >
              {loading ? 'Saving...' : item ? 'Update Schedule' : 'Add Recurring'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
