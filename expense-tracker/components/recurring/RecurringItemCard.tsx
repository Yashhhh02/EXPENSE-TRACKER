'use client';

import { useState } from 'react';
import { RecurringTransaction } from '@/types/domain';
import { Repeat, Calendar, Pencil, Trash2, Pause, Play, CheckCircle2, AlertCircle } from 'lucide-react';

interface RecurringItemCardProps {
  item: RecurringTransaction;
  currency: string;
  onEdit: (item: RecurringTransaction) => void;
  onToggleActive: (item: RecurringTransaction) => void;
  onToggleAutoAdd: (item: RecurringTransaction) => void;
  onDelete: (id: string) => void;
}

export function RecurringItemCard({
  item,
  currency,
  onEdit,
  onToggleActive,
  onToggleAutoAdd,
  onDelete,
}: RecurringItemCardProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete recurring schedule "${item.name}"?`)) return;
    setDeleting(true);
    await onDelete(item.id);
    setDeleting(false);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const frequencyLabel =
    item.frequency === 'monthly' ? 'Monthly' : item.frequency === 'weekly' ? 'Weekly' : 'Yearly';

  return (
    <div
      className={`p-5 rounded-2xl border transition-all ${
        item.is_active
          ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
          : 'bg-zinc-950/40 border-zinc-900 opacity-65 hover:opacity-100'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className={`p-2.5 rounded-xl border ${
              item.type === 'income'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}
          >
            <Repeat className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm flex items-center space-x-2">
              <span>{item.name}</span>
              {!item.is_active && (
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Paused
                </span>
              )}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {item.category?.name || 'Uncategorized'} · {frequencyLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onToggleActive(item)}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
            title={item.is_active ? 'Pause' : 'Resume'}
          >
            {item.is_active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between py-3 border-y border-zinc-800/60 mb-4">
        <div>
          <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Amount</p>
          <p className={`text-lg font-bold mt-0.5 ${item.type === 'income' ? 'text-amber-400' : 'text-red-400'}`}>
            {currency}{item.amount.toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">Next Due</p>
          <div className="flex items-center justify-end space-x-1 mt-0.5 text-xs font-semibold text-zinc-200">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>{formatDate(item.next_due_date)}</span>
          </div>
        </div>
      </div>

      {/* Auto-Add Toggle */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400 flex items-center space-x-1.5">
          {item.auto_add ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span>{item.auto_add ? 'Auto-add transaction' : 'Reminder only'}</span>
        </span>
        <button
          onClick={() => onToggleAutoAdd(item)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            item.auto_add ? 'bg-amber-500' : 'bg-zinc-800'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-zinc-950 shadow ring-0 transition duration-200 ease-in-out ${
              item.auto_add ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
