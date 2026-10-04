import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateHealthScore } from '@/lib/ai/healthScore';
import { isSupabaseConfigured } from '@/lib/supabase/configured';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      score: 75,
      breakdown: { savingsRate: 75, budgetAdherence: 80, spendingConsistency: 85 },
      summary: 'Configure Supabase to view live financial health score analysis.',
    });
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [profileRes, txRes, budgetRes, goalRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('transactions').select('*').eq('user_id', user.id),
      supabase.from('budgets').select('*').eq('user_id', user.id),
      supabase.from('goals').select('*').eq('user_id', user.id),
    ]);

    const result = await calculateHealthScore(
      user.id,
      profileRes.data || null,
      txRes.data || [],
      budgetRes.data || [],
      goalRes.data || []
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Health score GET route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to compute health score' },
      { status: 500 }
    );
  }
}
