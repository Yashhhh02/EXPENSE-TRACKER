'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  BarChart3,
  Flame,
} from 'lucide-react';
import { CashFlowChart } from '@/components/dashboard/CashFlowChart';
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart';
import { ExportButton } from '@/components/reports/ExportButton';
import { EmptyState } from '@/components/ui/EmptyState';

export default function MonthlyReportPage() {
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Generate options for last 12 months
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return { value, label };
  });

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/monthly?month=${selectedMonth}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedMonth]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-zinc-900/60 rounded-2xl border border-zinc-800" />
        <div className="h-44 bg-zinc-900/60 rounded-3xl border border-zinc-800" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-24 bg-zinc-900/60 rounded-2xl border border-zinc-800" />
          <div className="h-24 bg-zinc-900/60 rounded-2xl border border-zinc-800" />
          <div className="h-24 bg-zinc-900/60 rounded-2xl border border-zinc-800" />
        </div>
      </div>
    );
  }

  const categoryPieData = (data?.categoryBreakdown || []).map((c: any, idx: number) => ({
    name: c.name,
    value: c.amount,
    color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][idx % 6],
  }));

  const trendData = (data?.dailyTrend || []).map((d: any) => ({
    month: d.date.slice(8), // day number
    expense: d.amount,
    income: 0,
  }));

  const hasActivity = (data?.income || 0) > 0 || (data?.expenses || 0) > 0;

  return (
    <div className="space-y-8 pb-10">
      {/* Month Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-lg">
        <div className="flex items-center space-x-2 text-zinc-300">
          <Calendar className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-semibold">Select Report Period:</span>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ExportButton reportType="monthly" period={selectedMonth} />
        </div>
      </div>

      {!hasActivity ? (
        <EmptyState
          icon={Calendar}
          title="No activity in this period"
          description="There were no income or expense transactions recorded for the selected month."
        />
      ) : (
        <>
          {/* AI NARRATIVE SUMMARY */}
          <div className="relative overflow-hidden rounded-3xl bg-zinc-900/80 border border-zinc-800/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Monthly Executive Summary</span>
              </div>
              <p className="text-zinc-200 text-base leading-relaxed font-medium">
                {data?.narrative}
              </p>
            </div>
          </div>

          {/* SUMMARY METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-400">Total Income</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-400">
                ₹{Number(data?.income || 0).toLocaleString()}
              </p>
            </div>

            <div className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-400">Total Expenses</span>
                <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-red-400">
                ₹{Number(data?.expenses || 0).toLocaleString()}
              </p>
            </div>

            <div className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-zinc-400">Net Savings</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-300">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-300">
                ₹{Number(data?.savings || 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* CHARTS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-xl">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span>Category Breakdown</span>
              </h3>
              <CategoryPieChart data={categoryPieData} currencySymbol="₹" />
            </div>

            {/* Daily Spending Trend */}
            <div className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-xl">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Daily Expense Trend (Day of Month)</span>
              </h3>
              <CashFlowChart data={trendData} currencySymbol="₹" />
            </div>
          </div>

          {/* HIGHEST SINGLE EXPENSES */}
          <div className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-zinc-800 pb-3">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Highest Individual Purchases (Top 5)</span>
            </h3>

            {!data?.highestExpenses || data.highestExpenses.length === 0 ? (
              <p className="text-sm text-zinc-400 py-4">No major expenses recorded for this month.</p>
            ) : (
              <div className="space-y-3">
                {data.highestExpenses.map((exp: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 bg-zinc-950/70 border border-zinc-800/80 rounded-xl"
                  >
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">{exp.note}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{exp.date}</p>
                    </div>
                    <span className="text-sm font-bold text-red-400">
                      ₹{Number(exp.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
