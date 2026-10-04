'use client';

import { useCallback, useEffect, useState } from 'react';
import { Transaction, TransactionFilters } from '@/types/domain';
import { FilterBar } from '@/components/transactions/FilterBar';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { EmptyState } from '@/components/ui/EmptyState';
import { Plus, Receipt, FilterX } from 'lucide-react';

function buildQueryString(filters: TransactionFilters): string {
  const params = new URLSearchParams();
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  if (filters.category) params.set('category', filters.category);
  if (filters.minAmount !== undefined) params.set('minAmount', String(filters.minAmount));
  if (filters.maxAmount !== undefined) params.set('maxAmount', String(filters.maxAmount));
  if (filters.paymentMethod) params.set('paymentMethod', filters.paymentMethod);
  if (filters.search) params.set('search', filters.search);
  return params.toString();
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [currency, setCurrency] = useState('₹');

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    const qs = buildQueryString(filters);
    const res = await fetch(`/api/transactions?${qs}`);
    if (res.ok) {
      const data = await res.json();
      setTransactions(data);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Supabase Realtime Subscription for instant sync across tabs
  useRealtimeSync(['transactions'], loadTransactions);

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

  const handleDelete = async (id: string) => {
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTx(null);
    loadTransactions();
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== '');

  const totalIncome = transactions.filter((tx) => tx.type === 'income').reduce((s, tx) => s + tx.amount, 0);
  const totalExpense = transactions.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Transactions</h1>
          <p className="text-sm text-zinc-400 mt-0.5">View, filter, and manage all your financial entries.</p>
        </div>
        <button
          onClick={() => {
            setEditingTx(null);
            setShowForm(true);
          }}
          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-semibold text-sm rounded-xl shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
          <p className="text-xs text-zinc-400">Income (filtered)</p>
          <p className="text-xl font-bold text-amber-400 mt-1">
            {currency}
            {totalIncome.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
          <p className="text-xs text-zinc-400">Expenses (filtered)</p>
          <p className="text-xl font-bold text-red-400 mt-1">
            {currency}
            {totalExpense.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl col-span-2 md:col-span-1">
          <p className="text-xs text-zinc-400">Net Balance (filtered)</p>
          <p className={`text-xl font-bold mt-1 ${totalIncome - totalExpense >= 0 ? 'text-white' : 'text-red-400'}`}>
            {currency}
            {(totalIncome - totalExpense).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Content area: Table or Empty State */}
      {loading ? (
        <div className="p-10 text-center text-zinc-400 text-sm">Loading transactions...</div>
      ) : transactions.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            icon={FilterX}
            title="No matching transactions"
            description="No transactions found matching your current filters. Try adjusting your search term, categories, or date range."
            actionLabel="Clear Filters"
            onAction={() => setFilters({})}
          />
        ) : (
          <EmptyState
            icon={Receipt}
            title="No transactions recorded"
            description="You haven't recorded any income or expense transactions yet."
            actionLabel="Add your first transaction"
            onAction={() => {
              setEditingTx(null);
              setShowForm(true);
            }}
          />
        )
      ) : (
        <TransactionTable
          transactions={transactions}
          currency={currency}
          onEdit={(tx) => {
            setEditingTx(tx);
            setShowForm(true);
          }}
          onDelete={handleDelete}
        />
      )}

      {/* Transaction Form Modal */}
      {showForm && (
        <TransactionForm
          transaction={editingTx}
          onSuccess={handleFormSuccess}
          onClose={() => {
            setShowForm(false);
            setEditingTx(null);
          }}
        />
      )}
    </div>
  );
}
