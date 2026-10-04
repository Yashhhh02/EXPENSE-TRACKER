'use client';

import { useState, useEffect } from 'react';
import { FinancialHabits, FixedExpense } from '@/types/domain';
import {
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Save,
  Loader2,
  HelpCircle,
  Receipt,
} from 'lucide-react';

export default function PreferencesSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingHabits, setSavingHabits] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [habits, setHabits] = useState<FinancialHabits>({
    tracks_budget: true,
    impulsive_spender: false,
    uses_credit_card: false,
    has_emergency_fund: false,
  });

  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [newExpName, setNewExpName] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');
  const [addingExp, setAddingExp] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [profileRes, fixedRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/fixed-expenses'),
        ]);

        if (profileRes.ok) {
          const profile = await profileRes.json();
          if (profile?.financial_habits) {
            setHabits(profile.financial_habits);
          }
        }

        if (fixedRes.ok) {
          const fixedData = await fixedRes.json();
          if (Array.isArray(fixedData)) {
            setFixedExpenses(fixedData);
          }
        }
      } catch (err) {
        setError('Failed to load preferences');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveHabits = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSavingHabits(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ financial_habits: habits }),
      });

      if (!res.ok) throw new Error('Failed to update habits');

      setSuccessMsg('Financial habits updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Error updating habits.');
    } finally {
      setSavingHabits(false);
    }
  };

  const handleAddFixedExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpName.trim()) return;
    const amt = parseFloat(newExpAmount);
    if (isNaN(amt) || amt <= 0) return;

    setAddingExp(true);
    try {
      const res = await fetch('/api/fixed-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newExpName.trim(), amount: amt }),
      });

      if (res.ok) {
        const created = await res.json();
        setFixedExpenses([created, ...fixedExpenses]);
        setNewExpName('');
        setNewExpAmount('');
      }
    } catch (err) {
      console.error('Failed to add fixed expense:', err);
    } finally {
      setAddingExp(false);
    }
  };

  const handleDeleteFixedExpense = async (id: string) => {
    try {
      const res = await fetch(`/api/fixed-expenses?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFixedExpenses(fixedExpenses.filter((item: any) => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete fixed expense:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-zinc-900/40 border border-zinc-800 rounded-2xl animate-pulse space-y-4">
        <div className="h-6 w-48 bg-zinc-800 rounded" />
        <div className="h-24 bg-zinc-800 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
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

      {/* SECTION 1: FINANCIAL HABITS QUIZ */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-xl space-y-6">
        <div>
          <div className="flex items-center space-x-2 text-white font-bold text-lg">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h2>Financial Habits & Preferences</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Configure habits to help our AI advisor tune your recommendations.
          </p>
        </div>

        <form onSubmit={handleSaveHabits} className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-all">
            <span className="text-sm text-zinc-200">Do you actively track your budget?</span>
            <input
              type="checkbox"
              checked={habits.tracks_budget}
              onChange={(e) => setHabits({ ...habits, tracks_budget: e.target.checked })}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-all">
            <span className="text-sm text-zinc-200">Do you tend to make impulsive purchases?</span>
            <input
              type="checkbox"
              checked={habits.impulsive_spender}
              onChange={(e) => setHabits({ ...habits, impulsive_spender: e.target.checked })}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-all">
            <span className="text-sm text-zinc-200">Do you regularly use credit cards for daily expenses?</span>
            <input
              type="checkbox"
              checked={habits.uses_credit_card}
              onChange={(e) => setHabits({ ...habits, uses_credit_card: e.target.checked })}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-all">
            <span className="text-sm text-zinc-200">Do you have an emergency fund saved?</span>
            <input
              type="checkbox"
              checked={habits.has_emergency_fund}
              onChange={(e) => setHabits({ ...habits, has_emergency_fund: e.target.checked })}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
            />
          </label>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingHabits}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all inline-flex items-center space-x-2"
            >
              {savingHabits ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Habits</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: FIXED EXPENSES MANAGEMENT */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-xl space-y-6">
        <div>
          <div className="flex items-center space-x-2 text-white font-bold text-lg">
            <Receipt className="w-5 h-5 text-amber-400" />
            <h2>Fixed Monthly Expenses</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your predictable monthly bills (e.g. Rent, EMI, Insurance, WiFi).
          </p>
        </div>

        {/* Add New Fixed Expense Form */}
        <form onSubmit={handleAddFixedExpense} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            placeholder="Expense Name (e.g. Rent)"
            value={newExpName}
            onChange={(e) => setNewExpName(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <input
            type="number"
            required
            min="1"
            placeholder="Amount"
            value={newExpAmount}
            onChange={(e) => setNewExpAmount(e.target.value)}
            className="w-full sm:w-36 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="submit"
            disabled={addingExp}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </form>

        {/* List of Fixed Expenses */}
        {fixedExpenses.length === 0 ? (
          <p className="text-sm text-zinc-500 py-4 text-center">No fixed expenses configured yet.</p>
        ) : (
          <div className="space-y-2.5">
            {fixedExpenses.map((exp: any) => (
              <div
                key={exp.id || exp.name}
                className="flex items-center justify-between p-3.5 bg-zinc-950/70 border border-zinc-800/80 rounded-xl"
              >
                <div>
                  <p className="text-sm font-semibold text-zinc-200">{exp.name}</p>
                  <p className="text-xs text-zinc-500">Monthly recurring</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-bold text-amber-400">
                    ₹{Number(exp.amount).toLocaleString()}
                  </span>
                  {exp.id && (
                    <button
                      onClick={() => handleDeleteFixedExpense(exp.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
