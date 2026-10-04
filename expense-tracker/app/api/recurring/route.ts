import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/configured';
import { NextRequest, NextResponse } from 'next/server';
import { recurringSchema } from '@/lib/validators/financialSchemas';

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json([]);
  }

  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*, category:categories(*)')
      .order('is_active', { ascending: false })
      .order('next_due_date', { ascending: true });

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
  const parsed = recurringSchema.safeParse(body);

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
    .from('recurring_transactions')
    .insert({
      ...parsed.data,
      user_id: user.id,
    })
    .select('*, category:categories(*)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
