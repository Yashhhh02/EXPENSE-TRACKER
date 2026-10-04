'use client';

import { useState, useEffect, useRef } from 'react';
import { Category, Transaction, PaymentMethod } from '@/types/domain';
import { transactionSchema } from '@/lib/validators/financialSchemas';
import { X, DollarSign, AlertCircle, Sparkles, Loader2 } from 'lucide-react';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'netbanking', label: 'Net Banking' },
  { value: 'other', label: 'Other' },
];

interface TransactionFormProps {
  transaction?: Transaction | null;
  onSuccess: () => void;
  onClose: () => void;
}

export function TransactionForm({ transaction, onSuccess, onClose }: TransactionFormProps) {
  const [type, setType] = useState<'income' | 'expense'>(transaction?.type || 'expense');
  const [amount, setAmount] = useState(transaction?.amount?.toString() || '');
  const [categoryId, setCategoryId] = useState(transaction?.category_id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>(
    transaction?.payment_method || ''
  );
  const [note, setNote] = useState(transaction?.note || '');
  const [date, setDate] = useState(
    transaction?.transaction_date || new Date().toISOString().split('T')[0]
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI Categorization states
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiSuggestedCategoryId, setAiSuggestedCategoryId] = useState<string | null>(null);
  const [isAiAccepted, setIsAiAccepted] = useState(false);
  const [userManuallySelected, setUserManuallySelected] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => setError('Failed to load categories'));
  }, []);

  const filteredCategories = categories.filter((c) => c.type === type);

  // Trigger AI Categorization when Note & Amount change (Debounced ~600ms)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmedNote = note.trim();
    const parsedAmount = parseFloat(amount);

    if (!trimmedNote || trimmedNote.length < 2 || isNaN(parsedAmount) || parsedAmount <= 0) {
      setAiSuggesting(false);
      return;
    }

    // Skip AI suggestion if user already manually selected a category or editing an existing transaction
    if (userManuallySelected || transaction) {
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      setAiSuggesting(true);
      try {
        const res = await fetch('/api/categorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            note: trimmedNote,
            amount: parsedAmount,
            type,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.categoryId && filteredCategories.some((c) => c.id === data.categoryId)) {
            setAiSuggestedCategoryId(data.categoryId);
            setCategoryId(data.categoryId);
            setIsAiAccepted(true);
          }
        }
      } catch (err) {
        // Fail silently - never block user form
        console.warn('AI categorization check failed:', err);
      } finally {
        setAiSuggesting(false);
      }
    }, 600);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [note, amount, type, userManuallySelected, transaction, filteredCategories]);

  const handleCategoryChange = (selectedId: string) => {
    setCategoryId(selectedId);
    setUserManuallySelected(true);

    if (selectedId === aiSuggestedCategoryId) {
      setIsAiAccepted(true);
    } else {
      setIsAiAccepted(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const rawAmount = parseFloat(amount);
    const isAiCategorized = isAiAccepted && categoryId === aiSuggestedCategoryId;

    const payload = {
      amount: isNaN(rawAmount) ? 0 : rawAmount,
      type,
      category_id: categoryId || null,
      payment_method: paymentMethod || null,
      note: note.trim() || null,
      transaction_date: date,
      ai_categorized: isAiCategorized,
    };

    const parsed = transactionSchema.safeParse(payload);
    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message || 'Invalid form input.';
      setError(issue);
      return;
    }

    setLoading(true);

    const url = transaction ? `/api/transactions/${transaction.id}` : '/api/transactions';
    const method = transaction ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to save transaction.');
      setLoading(false);
      return;
    }

    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">
            {transaction ? 'Edit Transaction' : 'New Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
          >
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

          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategoryId('');
                setUserManuallySelected(false);
                setAiSuggestedCategoryId(null);
              }}
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
              onClick={() => {
                setType('income');
                setCategoryId('');
                setUserManuallySelected(false);
                setAiSuggestedCategoryId(null);
              }}
              className={`py-2.5 text-sm font-semibold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Income
            </button>
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
                className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Note <span className="text-zinc-500">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="e.g. Swiggy order, Uber ride, Salary"
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-zinc-300">Category</label>
              {aiSuggesting && (
                <div className="flex items-center space-x-1.5 text-xs text-amber-400 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>AI suggesting...</span>
                </div>
              )}
              {!aiSuggesting && categoryId && categoryId === aiSuggestedCategoryId && isAiAccepted && (
                <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-400">
                  <Sparkles className="w-3 h-3" />
                  <span>AI Suggested</span>
                </div>
              )}
            </div>

            <select
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className={`w-full px-4 py-3 bg-zinc-950 border rounded-xl text-zinc-100 focus:outline-none focus:ring-2 transition-all ${
                categoryId === aiSuggestedCategoryId && isAiAccepted
                  ? 'border-amber-500/40 ring-1 ring-amber-500/30'
                  : 'border-zinc-800 focus:ring-amber-500'
              }`}
            >
              <option value="">Select category</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.id === aiSuggestedCategoryId ? '✨ (AI Suggested)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod | '')}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            >
              <option value="">Select method</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            />
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
              {loading ? 'Saving...' : transaction ? 'Update' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
