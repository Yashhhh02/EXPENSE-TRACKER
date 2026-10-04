import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { suggestCategory } from '@/lib/ai/categorize';
import { isSupabaseConfigured } from '@/lib/supabase/configured';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { note, amount, type } = body;

    if (!note || typeof note !== 'string' || !type) {
      return NextResponse.json(
        { error: 'Note and type are required' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        categoryId: '',
        categoryName: 'Other',
        confidence: 'low',
      });
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's categories for the given transaction type (income or expense)
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', user.id)
      .eq('type', type);

    const availableCategories = (categories || []).map((c) => ({
      id: c.id,
      name: c.name,
    }));

    const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0;

    const result = await suggestCategory(
      note,
      parsedAmount,
      type as 'income' | 'expense',
      availableCategories
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Categorize API Route error:', error);
    return NextResponse.json({
      categoryId: '',
      categoryName: 'Other',
      confidence: 'low',
    });
  }
}
