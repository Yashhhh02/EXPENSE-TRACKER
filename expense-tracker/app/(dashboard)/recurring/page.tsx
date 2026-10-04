'use client';

import { useCallback, useEffect, useState } from 'react';
import { RecurringTransaction } from '@/types/domain';
import { RecurringItemCard } from '@/components/recurring/RecurringItemCard';
import { RecurringFormModal } from '@/components/recurring/RecurringFormModal';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { EmptyState } from '@/components/ui/EmptyState';
import { Plus, Repeat, Zap } from 'lucide-react';

export default function RecurringPage() {
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processMsg, setProcessMsg] = useState<string | null>(null);
  const [currency, setCurrency] = useState('₹');

  const loadItems = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/recurring');
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Realtime subscription for recurring transactions
  useRealtimeSync(['recurring_transactions'], loadItems);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('your-supabase-project')) return;
    import('@/lib/supabase/client').then(({ createClient }) => {
      const sb = createClient();
      sb.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        sb.from('profiles').select('preferred_currency').eq('id', user.id).single().then(({ data }) => {
          if (data?.preferred_currency === 'USD') setCurrency('$');
          else if (data?.preferred_currency === 'EUR') setCurrency('€');
          else if (data?.preferred_currency === 'GBP') setCurrency('£');
          else setCurrency('₹');
        });
      });
    });
  }, []);

  const handleToggleActive = async (item: RecurringTransaction) => {
    const nextState = !item.is_active;
    await fetch(`/api/recurring/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: nextState }),
    });
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_active: nextState } : i))
    );
  };

  const handleToggleAutoAdd = async (item: RecurringTransaction) => {
    const nextState = !item.auto_add;
    await fetch(`/api/recurring/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auto_add: nextState }),
    });
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, auto_add: nextState } : i))
    );
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/recurring/${id}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleFormSuccess = () => {
    setShowModal(false);
    setEditingItem(null);
    loadItems();
  };

  const handleRunProcessNow = async () => {
    setProcessing(true);
    setProcessMsg(null);
    const res = await fetch('/api/cron/process-recurring', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setProcessMsg(`Done! Auto-added ${data.autoAddedCount} item(s), ${data.reminderCount} reminder(s).`);
      loadItems();
    } else {
      setProcessMsg('Failed to process recurring transactions.');
    }
    setProcessing(false);
  };

  const totalExpense = items
    .filter((i) => i.is_active && i.type === 'expense')
    .reduce((sum, i) => sum + i.amount, 0);

  const totalIncome = items
    .filter((i) => i.is_active && i.type === 'income')
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Recurring Schedules</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Automate subscriptions, rent, salaries, and recurring bill notifications.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunProcessNow}
            disabled={processing}
            className="flex items-center space-x-2 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 font-semibold text-sm rounded-xl transition-all disabled:opacity-50"
            title="Manually trigger due date check"
          >
            <Zap className={`w-4 h-4 text-amber-400 ${processing ? 'animate-spin' : ''}`} />
            <span>{processing ? 'Processing...' : 'Run Process'}</span>
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setShowModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-semibold text-sm rounded-xl shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Schedule</span>
          </button>
        </div>
      </div>

      {processMsg && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-center justify-between">
          <span>{processMsg}</span>
          <button onClick={() => setProcessMsg(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
          <p className="text-xs text-zinc-400">Active Monthly Recurring Expenses</p>
          <p className="text-2xl font-bold text-red-400 mt-1">
            {currency}
            {totalExpense.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
          <p className="text-xs text-zinc-400">Active Monthly Recurring Income</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">
            {currency}
            {totalIncome.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="p-10 text-center text-zinc-400 text-sm">Loading schedules...</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No recurring transactions"
          description="Automate your monthly subscriptions, rent, salary, or utility bills with recurring schedules."
          actionLabel="Add a recurring bill or income"
          onAction={() => {
            setEditingItem(null);
            setShowModal(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <RecurringItemCard
              key={item.id}
              item={item}
              currency={currency}
              onEdit={(i) => {
                setEditingItem(i);
                setShowModal(true);
              }}
              onToggleActive={handleToggleActive}
              onToggleAutoAdd={handleToggleAutoAdd}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showModal && (
        <RecurringFormModal
          item={editingItem}
          onSuccess={handleFormSuccess}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}
