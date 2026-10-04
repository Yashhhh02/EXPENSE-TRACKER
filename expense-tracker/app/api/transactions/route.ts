import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/configured';
import { NextRequest, NextResponse } from 'next/server';
import { transactionSchema } from '@/lib/validators/financialSchemas';
import { checkAndCreateBudgetAlerts } from '@/lib/notifications/budgetAlerts';

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json([]);
  }

  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const category = searchParams.get('category');
  const minAmount = searchParams.get('minAmount');
  const maxAmount = searchParams.get('maxAmount');
  const paymentMethod = searchParams.get('paymentMethod');
  const search = searchParams.get('search');

  let query = supabase
    .from('transactions')
    .select('*, category:categories(*)')
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (dateFrom) query = query.gte('transaction_date', dateFrom);
  if (dateTo) query = query.lte('transaction_date', dateTo);
  if (category) query = query.eq('category_id', category);
  if (minAmount) query = query.gte('amount', parseFloat(minAmount));
  if (maxAmount) query = query.lte('amount', parseFloat(maxAmount));
  if (paymentMethod) query = query.eq('payment_method', paymentMethod);
  if (search) query = query.ilike('note', `%${search}%`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json([]);
  }

  return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const body = await request.json();
  const parsed = transactionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      ...parsed.data,
      user_id: user.id,
    })
    .select('*, category:categories(*)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Check and trigger budget alerts for expense transactions
  if (data && data.type === 'expense' && data.category_id) {
    await checkAndCreateBudgetAlerts(
      supabase,
      user.id,
      data.category_id,
      data.transaction_date
    );
  }

  return NextResponse.json(data, { status: 201 });
}
