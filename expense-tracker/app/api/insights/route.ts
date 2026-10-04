import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateInsights } from '@/lib/ai/advisor';
import { isSupabaseConfigured } from '@/lib/supabase/configured';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      tips: [
        'Set up custom budgets for food and entertainment to keep monthly spending on target.',
        'Review recurring subscriptions to cut down on unused services.',
      ],
      flaggedSubscriptions: ['Netflix Subscription ($15/mo)', 'Gym Membership ($40/mo)'],
      topCategories: [
        { name: 'Food', amount: 450 },
        { name: 'Shopping', amount: 300 },
        { name: 'Bills', amount: 200 },
      ],
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

    const [txRes, catRes, budgetRes, goalRes, recurringRes] = await Promise.all([
      supabase.from('transactions').select('*, category:categories(*)').eq('user_id', user.id),
      supabase.from('categories').select('*').eq('user_id', user.id),
      supabase.from('budgets').select('*').eq('user_id', user.id),
      supabase.from('goals').select('*').eq('user_id', user.id),
      supabase.from('recurring_transactions').select('*').eq('user_id', user.id),
    ]);

    const result = await generateInsights(
      user.id,
      txRes.data || [],
      catRes.data || [],
      budgetRes.data || [],
      goalRes.data || [],
      recurringRes.data || []
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Insights GET route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate financial insights' },
      { status: 500 }
    );
  }
}
