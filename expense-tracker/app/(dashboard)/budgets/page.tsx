'use client';

import { useCallback, useEffect, useState } from 'react';
import { Budget, Transaction } from '@/types/domain';
import { BudgetCard } from '@/components/budgets/BudgetCard';
import { BudgetFormModal } from '@/components/budgets/BudgetFormModal';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { EmptyState } from '@/components/ui/EmptyState';
import { Plus, Target } from 'lucide-react';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [currency, setCurrency] = useState('₹');

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const loadData = useCallback(async () => {
    setLoading(true);
    const [budgetsRes, txRes] = await Promise.all([
      fetch(`/api/budgets?month=${currentMonth}`),
      fetch(`/api/transactions?dateFrom=${currentMonth}`),
    ]);

    if (budgetsRes.ok) setBudgets(await budgetsRes.json());
    if (txRes.ok) setTransactions(await txRes.json());
    setLoading(false);
  }, [currentMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime synchronization for budgets & transactions
  useRealtimeSync(['budgets', 'transactions'], loadData);

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

  const handleSuccess = () => {
    setShowModal(false);
    setEditingBudget(null);
    loadData();
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Monthly Budgets</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {new Date(currentMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} budgets
          </p>
        </div>
        <button
          onClick={() => {
            setEditingBudget(null);
            setShowModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-semibold text-sm rounded-xl shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Set Budget</span>
        </button>
      </div>

      {loading ? (
        <div className="p-10 text-center text-zinc-400 text-sm">Loading budgets...</div>
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No budgets set yet"
          description="Set spending limits for your expense categories to track your usage and receive automated alerts."
          actionLabel="Create your first budget"
          onAction={() => {
            setEditingBudget(null);
            setShowModal(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              transactions={transactions}
              currency={currency}
              onEdit={(b) => {
                setEditingBudget(b);
                setShowModal(true);
              }}
            />
          ))}
        </div>
      )}

      {showModal && (
        <BudgetFormModal
          budget={editingBudget}
          onSuccess={handleSuccess}
          onClose={() => {
            setShowModal(false);
            setEditingBudget(null);
          }}
        />
      )}
    </div>
  );
}
