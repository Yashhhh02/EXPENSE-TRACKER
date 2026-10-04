'use client';

import { useCallback, useEffect, useState } from 'react';
import { Goal } from '@/types/domain';
import { GoalProgressCard } from '@/components/goals/GoalProgressCard';
import { GoalFormModal } from '@/components/goals/GoalFormModal';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { EmptyState } from '@/components/ui/EmptyState';
import { Plus, Target } from 'lucide-react';

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'update_amount'>('create');
  const [currency, setCurrency] = useState('₹');

  const loadGoals = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/goals');
    if (res.ok) setGoals(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  // Realtime subscription for goals changes
  useRealtimeSync(['goals'], loadGoals);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('your-supabase-project')) return;
    import('@/lib/supabase/client').then(({ createClient }) => {
      const sb = createClient();
      sb.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        sb.from('profiles').select('preferred_currency').eq('id', user.id).single().then(({ data }) => {
          if (data?.preferred_currency === 'USD') setCurrency('$');
          else if (data?.preferred_currency === 'EUR') setCurrency('€');
          else if (data?.preferred_currency === 'GBP') setCurrency('£');
          else setCurrency('₹');
        });
      });
    });
  }, []);

  const handleAbandon = async (id: string) => {
    if (!confirm('Abandon this goal?')) return;
    await fetch(`/api/goals/${id}`, { method: 'DELETE' });
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleSuccess = () => {
    setShowModal(false);
    setEditingGoal(null);
    loadGoals();
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Savings Goals</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Track your financial targets and projected timelines.</p>
        </div>
        <button
          onClick={() => {
            setEditingGoal(null);
            setModalMode('create');
            setShowModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-semibold text-sm rounded-xl shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {loading ? (
        <div className="p-10 text-center text-zinc-400 text-sm">Loading goals...</div>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No savings goals set"
          description="Create a savings goal to track your financial targets and see projected monthly completion timelines."
          actionLabel="Set your first savings goal"
          onAction={() => {
            setEditingGoal(null);
            setModalMode('create');
            setShowModal(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {goals.map((goal) => (
            <GoalProgressCard
              key={goal.id}
              goal={goal}
              currency={currency}
              onUpdateAmount={(g) => {
                setEditingGoal(g);
                setModalMode('update_amount');
                setShowModal(true);
              }}
              onAbandon={handleAbandon}
            />
          ))}
        </div>
      )}

      {showModal && (
        <GoalFormModal
          goal={editingGoal}
          mode={modalMode}
          onSuccess={handleSuccess}
          onClose={() => {
            setShowModal(false);
            setEditingGoal(null);
          }}
        />
      )}
    </div>
  );
}
