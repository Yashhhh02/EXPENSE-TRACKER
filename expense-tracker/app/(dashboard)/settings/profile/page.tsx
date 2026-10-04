'use client';

import { useState, useEffect } from 'react';
import { Profile } from '@/types/domain';
import { CheckCircle2, AlertCircle, Save, Loader2 } from 'lucide-react';

const CURRENCIES = [
  { code: 'INR', label: 'INR (₹) - Indian Rupee' },
  { code: 'USD', label: 'USD ($) - US Dollar' },
  { code: 'EUR', label: 'EUR (€) - Euro' },
  { code: 'GBP', label: 'GBP (£) - British Pound' },
  { code: 'AUD', label: 'AUD ($) - Australian Dollar' },
  { code: 'CAD', label: 'CAD ($) - Canadian Dollar' },
];

export default function ProfileSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [preferredCurrency, setPreferredCurrency] = useState('INR');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [salaryDate, setSalaryDate] = useState('1');
  const [savingsGoal, setSavingsGoal] = useState('');

  useEffect(() => {
    fetch('/api/profile')
      .then((res) => res.json())
      .then((data: Profile) => {
        if (data) {
          setFullName(data.full_name || '');
          setPreferredCurrency(data.preferred_currency || 'INR');
          setMonthlyIncome(data.monthly_income?.toString() || '');
          setSalaryDate(data.salary_date?.toString() || '1');
          setSavingsGoal(data.savings_goal_monthly?.toString() || '');
        }
      })
      .catch((err) => setError('Failed to load profile parameters'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setError('Full Name is required.');
      return;
    }
    const incomeNum = parseFloat(monthlyIncome);
    if (isNaN(incomeNum) || incomeNum < 0) {
      setError('Please enter a valid monthly income.');
      return;
    }
    const savingsNum = parseFloat(savingsGoal);
    if (isNaN(savingsNum) || savingsNum < 0) {
      setError('Please enter a valid savings goal.');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          preferred_currency: preferredCurrency,
          monthly_income: incomeNum,
          salary_date: Number(salaryDate),
          savings_goal_monthly: savingsNum,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccessMsg('Profile parameters updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'An error occurred while saving profile settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-zinc-900/40 border border-zinc-800 rounded-2xl animate-pulse space-y-4">
        <div className="h-6 w-48 bg-zinc-800 rounded" />
        <div className="h-10 bg-zinc-800 rounded" />
        <div className="h-10 bg-zinc-800 rounded" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Personal Profile & Parameters</h2>
        <p className="text-xs text-zinc-400 mt-1">
          Update your default currency, salary credit date, and monthly targets.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center space-x-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center space-x-3 text-amber-400 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Full Name</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Alex Morgan"
            className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          />
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Preferred Currency</label>
          <select
            value={preferredCurrency}
            onChange={(e) => setPreferredCurrency(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Monthly Income & Salary Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Monthly Income ({preferredCurrency})
            </label>
            <input
              type="number"
              required
              min="0"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              placeholder="75000"
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Salary Date</label>
            <select
              value={salaryDate}
              onChange={(e) => setSalaryDate(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  Day {day} of month
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Savings Goal */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Monthly Savings Target ({preferredCurrency})
          </label>
          <input
            type="number"
            required
            min="0"
            value={savingsGoal}
            onChange={(e) => setSavingsGoal(e.target.value)}
            placeholder="20000"
            className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all inline-flex items-center space-x-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
