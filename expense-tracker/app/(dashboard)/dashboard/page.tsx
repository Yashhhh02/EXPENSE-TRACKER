'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, Transaction } from '@/types/domain';

import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { EmptyState } from '@/components/ui/EmptyState';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import {
  getTotalIncome,
  getTotalExpenses,
  getBalance,
} from '@/lib/calculations/totals';
import { CashFlowChart } from '@/components/dashboard/CashFlowChart';
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart';
import { MonthlyComparisonChart } from '@/components/dashboard/MonthlyComparisonChart';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowRight,

  BarChart3,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Plus,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [stats, setStats] = useState<{
    cashFlow: any[];
    categoryPie: any[];
    monthlyComparison: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [profileRes, txRes, statsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      fetch('/api/transactions'),
      fetch('/api/dashboard/stats'),
    ]);

    if (profileRes.data) setProfile(profileRes.data as Profile);
    if (txRes.ok) setTransactions(await txRes.json());
    if (statsRes.ok) setStats(await statsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime synchronization for transactions, budgets, goals
  useRealtimeSync(['transactions', 'budgets', 'goals'], loadData);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 bg-zinc-900/60 rounded-3xl border border-zinc-800" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-zinc-900/60 rounded-2xl border border-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  const currencySymbol =
    profile?.preferred_currency === 'USD'
      ? '$'
      : profile?.preferred_currency === 'EUR'
      ? '€'
      : profile?.preferred_currency === 'GBP'
      ? '£'
      : '₹';

  // Current month filter
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const dateRange = { from: monthStart, to: now };

  const totalIncome = getTotalIncome(transactions, dateRange);
  const totalExpenses = getTotalExpenses(transactions, dateRange);
  const balance = getBalance(totalIncome, totalExpenses);

  const recentTx = [...transactions]
    .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
    .slice(0, 5);



  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-800 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Monthly Overview</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="mt-1.5 text-sm text-zinc-400">
              Here&apos;s your financial summary for{' '}
              <span className="text-zinc-200 font-semibold">
                {now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </span>
            </p>
          </div>

          <div className="flex items-center space-x-3">

            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Entry</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-400">Total Income</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-400">
            {currencySymbol}
            {totalIncome.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500 mt-1">This month</p>
        </div>

        <div className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-400">Total Expenses</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-400">
            {currencySymbol}
            {totalExpenses.toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500 mt-1">This month</p>
        </div>

        <div className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-zinc-400">Net Balance</span>
            <div
              className={`p-2 rounded-xl ${
                balance >= 0 ? 'bg-amber-500/10 text-amber-300' : 'bg-red-500/10 text-red-400'
              }`}
            >
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-amber-300' : 'text-red-400'}`}>
            {balance < 0 ? '-' : ''}
            {currencySymbol}
            {Math.abs(balance).toLocaleString()}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {balance >= 0 ? 'Surplus' : 'Deficit'} this month
          </p>
        </div>
      </div>

      {/* DASHBOARD CONTENT OR EMPTY STATE */}
      {transactions.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No transactions recorded yet"
          description="Start managing your budget and AI-powered insights by adding your first financial transaction."
          actionLabel="Add your first transaction"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <>
          {/* RECHARTS DATA VISUALIZATION SECTION */}
          <div className="space-y-6">
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              <span>Financial Analytics & Trends</span>
            </h2>

            {/* Top Chart Row: Cash Flow Area Chart (Full Width) */}
            <div className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <LineIcon className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">6-Month Cash Flow (Income vs Expenses)</h3>
                </div>
              </div>
              <CashFlowChart data={stats?.cashFlow || []} currencySymbol={currencySymbol} />
            </div>

            {/* Bottom Chart Row: Category Pie & Monthly Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Pie / Donut */}
              <div className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-xl">
                <div className="flex items-center space-x-2 mb-4">
                  <PieIcon className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Current Month Spending by Category</h3>
                </div>
                <CategoryPieChart data={stats?.categoryPie || []} currencySymbol={currencySymbol} />
              </div>

              {/* Monthly Comparison Bar Chart */}
              <div className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-xl">
                <div className="flex items-center space-x-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">This Month vs Last Month Comparison</h3>
                </div>
                <MonthlyComparisonChart
                  data={stats?.monthlyComparison || []}
                  currencySymbol={currencySymbol}
                />
              </div>
            </div>
          </div>

          {/* Recent Transactions List */}
          <div className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
              <Link
                href="/transactions"
                className="flex items-center space-x-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentTx.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 border-b border-zinc-800/60 last:border-0"
                >
                  <div>
                    <p className="text-sm text-zinc-200 font-medium">
                      {tx.note || tx.category?.name || 'Transaction'}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {new Date(tx.transaction_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                      {tx.category && ` · ${tx.category.name}`}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      tx.type === 'income' ? 'text-amber-400' : 'text-red-400'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {currencySymbol}
                    {tx.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Transaction Modal */}
      {showForm && (
        <TransactionForm
          onSuccess={() => {
            setShowForm(false);
            loadData();
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
