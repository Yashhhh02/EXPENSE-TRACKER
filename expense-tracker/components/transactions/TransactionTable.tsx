'use client';

import { useState } from 'react';
import { Transaction } from '@/types/domain';
import { Pencil, Trash2, ArrowUpCircle, ArrowDownCircle, ChevronLeft, ChevronRight, Calendar, CreditCard } from 'lucide-react';

const PAGE_SIZE = 10;

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  upi: 'UPI',
  netbanking: 'Net Banking',
  other: 'Other',
};

interface TransactionTableProps {
  transactions: Transaction[];
  currency: string;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export function TransactionTable({ transactions, currency, onEdit, onDelete }: TransactionTableProps) {
  const [page, setPage] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalPages = Math.ceil(transactions.length / PAGE_SIZE);
  const slice = transactions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  if (transactions.length === 0) {
    return (
      <div className="p-10 text-center bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl">
        <p className="text-zinc-400 text-sm">No transactions found. Try adjusting your filters or add a transaction.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Card Layout (Visible < md breakpoint) */}
      <div className="md:hidden space-y-3">
        {slice.map((tx) => (
          <div
            key={tx.id}
            className="p-4 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl shadow-md space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{tx.note || tx.category?.name || 'Transaction'}</p>
                <div className="flex items-center space-x-2 text-xs text-zinc-400 mt-1">
                  <Calendar className="w-3 h-3 text-zinc-500" />
                  <span>{formatDate(tx.transaction_date)}</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-base font-bold flex items-center justify-end space-x-1 ${tx.type === 'income' ? 'text-amber-400' : 'text-red-400'}`}>
                  {tx.type === 'income' ? (
                    <ArrowUpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  ) : (
                    <ArrowDownCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  )}
                  <span>{currency}{tx.amount.toLocaleString()}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-xs">
              <div className="flex items-center space-x-2">
                {tx.category && (
                  <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-medium">
                    {tx.category.name}
                  </span>
                )}
                {tx.payment_method && (
                  <span className="text-zinc-400 flex items-center space-x-1">
                    <CreditCard className="w-3 h-3 text-zinc-500" />
                    <span>{PAYMENT_LABELS[tx.payment_method]}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onEdit(tx)}
                  className="px-2.5 py-1 text-zinc-300 hover:text-amber-400 bg-zinc-800 rounded-lg transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(tx.id)}
                  disabled={deletingId === tx.id}
                  className="px-2.5 py-1 text-red-400 hover:text-red-300 bg-red-500/10 rounded-lg transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 border-b border-zinc-800">
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Note</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wide">Method</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">Amount</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {slice.map((tx) => (
              <tr key={tx.id} className="bg-zinc-950/40 hover:bg-zinc-900/60 transition-colors">
                <td className="px-4 py-3.5 text-zinc-300 whitespace-nowrap">{formatDate(tx.transaction_date)}</td>
                <td className="px-4 py-3.5">
                  {tx.category ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-200 text-xs font-medium">
                      {tx.category.name}
                    </span>
                  ) : (
                    <span className="text-zinc-500 text-xs">Uncategorized</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-zinc-400 max-w-xs truncate">{tx.note || '—'}</td>
                <td className="px-4 py-3.5">
                  {tx.payment_method ? (
                    <span className="text-xs text-zinc-400">{PAYMENT_LABELS[tx.payment_method]}</span>
                  ) : (
                    <span className="text-zinc-500 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end space-x-1.5">
                    {tx.type === 'income' ? (
                      <ArrowUpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <ArrowDownCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    )}
                    <span className={`font-semibold ${tx.type === 'income' ? 'text-amber-400' : 'text-red-400'}`}>
                      {currency}{tx.amount.toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <button
                      onClick={() => onEdit(tx)}
                      className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      disabled={deletingId === tx.id}
                      className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-zinc-400">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 disabled:opacity-40 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 disabled:opacity-40 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
