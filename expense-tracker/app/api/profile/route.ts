import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/configured';

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      id: 'demo-user',
      full_name: 'Demo User',
      preferred_currency: 'INR',
      monthly_income: 75000,
      salary_date: 1,
      savings_goal_monthly: 20000,
      financial_habits: {
        tracks_budget: true,
        impulsive_spender: false,
        uses_credit_card: false,
        has_emergency_fund: true,
      },
      onboarding_completed: true,
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

    let { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!profile) {
      // Auto-create default profile if missing
      const newProfile = {
        id: user.id,
        full_name: user.user_metadata?.full_name || 'User',
        preferred_currency: 'INR',
        monthly_income: 50000,
        salary_date: 1,
        savings_goal_monthly: 10000,
        onboarding_completed: false,
      };

      const { data: created, error: createErr } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (createErr) {
        return NextResponse.json({ error: createErr.message }, { status: 500 });
      }
      profile = created;
    }

    return NextResponse.json(profile);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    const body = await request.json();
    return NextResponse.json({ ...body, updated_at: new Date().toISOString() });
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updateData: Record<string, any> = {};

    if (typeof body.full_name === 'string') updateData.full_name = body.full_name.trim();
    if (typeof body.preferred_currency === 'string') updateData.preferred_currency = body.preferred_currency;
    if (typeof body.monthly_income === 'number' || typeof body.monthly_income === 'string') {
      updateData.monthly_income = Number(body.monthly_income);
    }
    if (typeof body.salary_date === 'number' || typeof body.salary_date === 'string') {
      updateData.salary_date = Number(body.salary_date);
    }
    if (typeof body.savings_goal_monthly === 'number' || typeof body.savings_goal_monthly === 'string') {
      updateData.savings_goal_monthly = Number(body.savings_goal_monthly);
    }
    if (body.financial_habits && typeof body.financial_habits === 'object') {
      updateData.financial_habits = body.financial_habits;
    }
    if (Array.isArray(body.fixed_expenses)) {
      updateData.fixed_expenses = body.fixed_expenses;
    }

    const { data: updated, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...updateData,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update profile' }, { status: 500 });
  }
}
