'use client';

import { useState, useEffect, useCallback } from 'react';
import { HealthScoreResult } from '@/lib/ai/healthScore';
import { InsightsResult } from '@/lib/ai/advisor';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Sparkles,
  Activity,
  Repeat,
  PieChart,
  RefreshCw,
  Lightbulb,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';

export default function InsightsPage() {
  const [healthScore, setHealthScore] = useState<HealthScoreResult | null>(null);
  const [insights, setInsights] = useState<InsightsResult | null>(null);
  const [txCount, setTxCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [scoreRes, insightsRes, txRes] = await Promise.all([
        fetch('/api/health-score'),
        fetch('/api/insights'),
        fetch('/api/transactions'),
      ]);

      if (scoreRes.ok) setHealthScore(await scoreRes.json());
      if (insightsRes.ok) setInsights(await insightsRes.json());
      if (txRes.ok) {
        const txs = await txRes.json();
        setTxCount(Array.isArray(txs) ? txs.length : 0);
      }
    } catch (err) {
      console.error('Failed to load insights data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime subscription for transactions, budgets, goals
  useRealtimeSync(['transactions', 'budgets', 'goals'], fetchData);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 bg-zinc-900/60 rounded-3xl border border-zinc-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-zinc-900/60 rounded-2xl border border-zinc-800" />
          <div className="h-48 bg-zinc-900/60 rounded-2xl border border-zinc-800" />
        </div>
      </div>
    );
  }

  const score = healthScore?.score || 0;
  const scoreColor =
    score >= 80 ? 'emerald' : score >= 60 ? 'amber' : 'red';

  return (
    <div className="space-y-8 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Advisor & Health Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Financial Health & AI Insights
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Real-time score calculation and personalized recommendations powered by OpenRouter LLMs.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-sm font-medium transition-all shadow-md disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {txCount < 5 ? (
        <EmptyState
          icon={Sparkles}
          title="More transactions needed for AI Insights"
          description="Add a few more transactions to unlock your personalized AI financial health score, budget analysis, and tailored savings tips."
          actionLabel="Add Transactions"
          onAction={() => (window.location.href = '/transactions')}
        />
      ) : (
        <>
          {/* HEALTH SCORE CARD */}
          <div className="relative overflow-hidden rounded-3xl bg-zinc-900/80 border border-zinc-800/80 p-8 shadow-2xl backdrop-blur-xl">
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Main Score Gauge */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-6 bg-zinc-950/60 rounded-2xl border border-zinc-800/60">
                <div className="relative flex items-center justify-center w-36 h-36 rounded-full border-4 border-zinc-800 mb-4 bg-zinc-900 shadow-inner">
                  <div
                    className={`text-5xl font-black tracking-tight ${
                      scoreColor === 'emerald'
                        ? 'text-amber-400'
                        : scoreColor === 'amber'
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    {score}
                  </div>
                  <span className="absolute bottom-4 text-xs font-semibold text-zinc-500">/ 100</span>
                </div>

                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {score >= 80 ? 'Excellent Health' : score >= 60 ? 'Moderate Health' : 'Needs Attention'}
                  </span>
                </div>
              </div>

              {/* Sub-score Breakdown & Summary */}
              <div className="lg:col-span-8 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">Financial Health Breakdown</h2>
                  <p className="text-sm text-zinc-400">{healthScore?.summary}</p>
                </div>

                {/* 3 Sub-scores */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Savings Rate */}
                  <div className="p-4 bg-zinc-950/60 border border-zinc-800/60 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400 font-medium">Savings Rate (40%)</span>
                      <span className="text-amber-400 font-bold">
                        {healthScore?.breakdown.savingsRate || 0}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${healthScore?.breakdown.savingsRate || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Budget Adherence */}
                  <div className="p-4 bg-zinc-950/60 border border-zinc-800/60 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400 font-medium">Budget Keeping (35%)</span>
                      <span className="text-amber-400 font-bold">
                        {healthScore?.breakdown.budgetAdherence || 0}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full transition-all"
                        style={{ width: `${healthScore?.breakdown.budgetAdherence || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Spending Consistency */}
                  <div className="p-4 bg-zinc-950/60 border border-zinc-800/60 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400 font-medium">Consistency (25%)</span>
                      <span className="text-amber-300 font-bold">
                        {healthScore?.breakdown.spendingConsistency || 0}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${healthScore?.breakdown.spendingConsistency || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI TIPS & RECOMMENDATIONS */}
          <div className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-xl space-y-5">
            <div className="flex items-center space-x-2 border-b border-zinc-800 pb-4">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Personalized AI Financial Tips</h2>
                <p className="text-xs text-zinc-400">Actionable advice generated specifically for your spending patterns</p>
              </div>
            </div>

            {!insights?.tips || insights.tips.length === 0 ? (
              <p className="text-sm text-zinc-400 py-4">No specific tips available yet. Add more transactions to unlock AI recommendations.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.tips.map((tip, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-xl">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-zinc-200 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BOTTOM GRID: RECURRING SUBSCRIPTIONS & TOP CATEGORIES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recurring Subscriptions */}
            <div className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center space-x-2 border-b border-zinc-800 pb-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <Repeat className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Flagged Subscriptions & Recurring Bills</h3>
              </div>

              {!insights?.flaggedSubscriptions || insights.flaggedSubscriptions.length === 0 ? (
                <p className="text-sm text-zinc-400 py-4">No active recurring subscription expenses detected.</p>
              ) : (
                <div className="space-y-2.5">
                  {insights.flaggedSubscriptions.map((sub, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-zinc-950/60 border border-zinc-800/60 rounded-xl">
                      <div className="flex items-center space-x-2.5">
                        <ShieldCheck className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-zinc-200">{sub}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">Active</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Spending Categories */}
            <div className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center space-x-2 border-b border-zinc-800 pb-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <PieChart className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Top Spending Categories</h3>
              </div>

              {!insights?.topCategories || insights.topCategories.length === 0 ? (
                <p className="text-sm text-zinc-400 py-4">No expense category data recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {insights.topCategories.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-zinc-950/60 border border-zinc-800/60 rounded-xl">
                      <div className="flex items-center space-x-2.5">
                        <TrendingUp className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-medium text-zinc-200">{cat.name}</span>
                      </div>
                      <span className="text-sm font-bold text-amber-400">
                        ₹{cat.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
