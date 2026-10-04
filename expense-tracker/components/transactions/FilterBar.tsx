'use client';

import { useEffect, useState } from 'react';
import { Category, PaymentMethod, TransactionFilters } from '@/types/domain';
import { Search, X, SlidersHorizontal } from 'lucide-react';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'netbanking', label: 'Net Banking' },
  { value: 'other', label: 'Other' },
];

interface FilterBarProps {
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  const update = (key: keyof TransactionFilters, value: string | number | undefined) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  const clearAll = () => onChange({});

  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== '');

  return (
    <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm font-semibold text-zinc-300">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
        </div>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center space-x-1 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-3 h-3" />
            <span>Clear all</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Search */}
        <div className="relative xl:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={filters.search || ''}
            onChange={(e) => update('search', e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          />
        </div>

        {/* Date From */}
        <input
          type="date"
          value={filters.dateFrom || ''}
          onChange={(e) => update('dateFrom', e.target.value)}
          className="px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          title="Date from"
        />

        {/* Date To */}
        <input
          type="date"
          value={filters.dateTo || ''}
          onChange={(e) => update('dateTo', e.target.value)}
          className="px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          title="Date to"
        />

        {/* Category */}
        <select
          value={filters.category || ''}
          onChange={(e) => update('category', e.target.value)}
          className="px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Payment Method */}
        <select
          value={filters.paymentMethod || ''}
          onChange={(e) => update('paymentMethod', e.target.value as PaymentMethod)}
          className="px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
        >
          <option value="">All Methods</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Amount Range */}
      <div className="flex items-center space-x-3">
        <input
          type="number"
          min="0"
          placeholder="Min amount"
          value={filters.minAmount || ''}
          onChange={(e) => update('minAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
          className="w-36 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
        />
        <span className="text-zinc-500 text-sm">to</span>
        <input
          type="number"
          min="0"
          placeholder="Max amount"
          value={filters.maxAmount || ''}
          onChange={(e) => update('maxAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
          className="w-36 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
        />
      </div>
    </div>
  );
}
