import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/configured';
import { NextRequest, NextResponse } from 'next/server';
import { budgetSchema } from '@/lib/validators/financialSchemas';

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json([]);
  }

  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const month = searchParams.get('month') || defaultMonth;

    const { data, error } = await supabase
      .from('budgets')
      .select('*, category:categories(*)')
      .eq('month', month)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const body = await request.json();
  const parsed = budgetSchema.safeParse(body);

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
    .from('budgets')
    .upsert(
      { ...parsed.data, user_id: user.id },
      { onConflict: 'user_id,category_id,month' }
    )
    .select('*, category:categories(*)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
