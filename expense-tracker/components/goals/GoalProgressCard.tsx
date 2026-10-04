'use client';

import { Goal } from '@/types/domain';
import { getGoalProgressPercent, getRequiredMonthlySavings } from '@/lib/calculations/goalProjection';
import { Target, Calendar, TrendingUp, MoreVertical } from 'lucide-react';
import { useState } from 'react';

interface GoalProgressCardProps {
  goal: Goal;
  currency: string;
  onUpdateAmount: (goal: Goal) => void;
  onAbandon: (id: string) => void;
}

export function GoalProgressCard({ goal, currency, onUpdateAmount, onAbandon }: GoalProgressCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const percent = getGoalProgressPercent(goal.current_amount, goal.target_amount);
  const projection = getRequiredMonthlySavings(
    goal.target_amount,
    goal.current_amount,
    goal.target_date
  );

  const remaining = Math.max(0, goal.target_amount - goal.current_amount);
  const isCompleted = goal.current_amount >= goal.target_amount;

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No deadline';

  const barColor = isCompleted
    ? 'bg-amber-500'
    : percent >= 75
    ? 'bg-teal-400'
    : percent >= 40
    ? 'bg-blue-400'
    : 'bg-slate-500';

  return (
    <div className="p-5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl hover:border-zinc-700/80 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{goal.title}</p>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <Calendar className="w-3 h-3 text-zinc-400" />
              <span className="text-xs text-zinc-400">{formatDate(goal.target_date)}</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-40 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-10 py-1">
              <button
                onClick={() => { setMenuOpen(false); onUpdateAmount(goal); }}
                className="w-full text-left px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                Update saved amount
              </button>
              <button
                onClick={() => { setMenuOpen(false); onAbandon(goal.id); }}
                className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Abandon goal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-zinc-400">Progress</span>
          <span className="font-semibold text-white">{percent}%</span>
        </div>
        <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-zinc-950/60 rounded-xl">
          <p className="text-xs text-zinc-400">Saved</p>
          <p className="text-sm font-bold text-white mt-0.5">{currency}{goal.current_amount.toLocaleString()}</p>
        </div>
        <div className="p-3 bg-zinc-950/60 rounded-xl">
          <p className="text-xs text-zinc-400">Remaining</p>
          <p className="text-sm font-bold text-white mt-0.5">{currency}{remaining.toLocaleString()}</p>
        </div>
      </div>

      {!isCompleted && goal.target_date && projection.monthsRemaining > 0 && (
        <div className="flex items-center space-x-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/15 rounded-xl">
          <TrendingUp className="w-4 h-4 text-amber-300 shrink-0" />
          <p className="text-xs text-zinc-300">
            Save <span className="font-semibold text-amber-300">{currency}{projection.requiredMonthlySavings.toLocaleString()}/month</span>{' '}
            for {projection.monthsRemaining} month{projection.monthsRemaining !== 1 ? 's' : ''} to reach your goal.
          </p>
        </div>
      )}

      {isCompleted && (
        <div className="flex items-center space-x-2 px-3 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
          <span className="text-xs font-semibold text-amber-400">🎉 Goal reached! Congratulations.</span>
        </div>
      )}
    </div>
  );
}
