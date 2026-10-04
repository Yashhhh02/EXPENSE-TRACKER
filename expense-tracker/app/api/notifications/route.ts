import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/configured';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json([]);
  }

  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json([]);
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Handle mark all read
  if (body.markAllRead) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  // Handle bulk array of IDs
  if (Array.isArray(body.ids)) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', body.ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  // Handle single ID
  if (body.id) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', body.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
}
