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
import { CategoryPieChart } from '@/components/dashboard/CategoryPieChart';
import { MonthlyComparisonChart } from '@/components/dashboard/MonthlyComparisonChart';
import { ExportButton } from '@/components/reports/ExportButton';

export default function YearlyReportPage() {
  const now = new Date();
  const currentYearStr = String(now.getFullYear());
  const [selectedYear, setSelectedYear] = useState(currentYearStr);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const yearOptions = [
    currentYearStr,
    String(now.getFullYear() - 1),
    String(now.getFullYear() - 2),
  ];

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/yearly?year=${selectedYear}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedYear]);

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

  const monthComparisonData = (data?.monthlyComparison || []).map((m: any) => ({
    metric: m.month,
    thisMonth: m.income,
    lastMonth: m.expense,
  }));

  return (
    <div className="space-y-8">
      {/* Year Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-lg">
        <div className="flex items-center space-x-2 text-zinc-300">
          <Calendar className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-semibold">Select Report Year:</span>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {yearOptions.map((yr) => (
              <option key={yr} value={yr}>
                Year {yr}
              </option>
            ))}
          </select>
          <ExportButton reportType="yearly" period={selectedYear} />
        </div>
      </div>

      {/* AI NARRATIVE SUMMARY */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-900/80 border border-zinc-800/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Annual Executive Summary ({data?.period})</span>
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
            <span className="text-xs font-medium text-zinc-400">Total Annual Income</span>
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
            <span className="text-xs font-medium text-zinc-400">Total Annual Expenses</span>
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
            <span className="text-xs font-medium text-zinc-400">Net Annual Savings</span>
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
            <span>Annual Spending by Category</span>
          </h3>
          <CategoryPieChart data={categoryPieData} currencySymbol="₹" />
        </div>

        {/* Month-by-Month Comparison across Year */}
        <div className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-xl">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Month-by-Month Comparison (Income vs Expense)</span>
          </h3>
          <MonthlyComparisonChart data={monthComparisonData} currencySymbol="₹" />
        </div>
      </div>

      {/* HIGHEST SINGLE EXPENSES */}
      <div className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-zinc-800 pb-3">
          <Flame className="w-4 h-4 text-amber-400" />
          <span>Highest Individual Purchases This Year</span>
        </h3>

        {!data?.highestExpenses || data.highestExpenses.length === 0 ? (
          <p className="text-sm text-zinc-400 py-4">No major expenses recorded for this year.</p>
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
    </div>
  );
}
