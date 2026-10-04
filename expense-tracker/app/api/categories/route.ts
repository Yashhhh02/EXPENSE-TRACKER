import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/configured';
import { NextResponse } from 'next/server';

const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Food', type: 'expense', icon: 'Utensils', is_default: true },
  { id: 'cat-2', name: 'Shopping', type: 'expense', icon: 'ShoppingBag', is_default: true },
  { id: 'cat-3', name: 'Transport', type: 'expense', icon: 'Car', is_default: true },
  { id: 'cat-4', name: 'Bills', type: 'expense', icon: 'FileText', is_default: true },
  { id: 'cat-5', name: 'Entertainment', type: 'expense', icon: 'Tv', is_default: true },
  { id: 'cat-6', name: 'Health', type: 'expense', icon: 'Heart', is_default: true },
  { id: 'cat-7', name: 'Rent', type: 'expense', icon: 'Home', is_default: true },
  { id: 'cat-8', name: 'Other', type: 'expense', icon: 'MoreHorizontal', is_default: true },
  { id: 'cat-9', name: 'Salary', type: 'income', icon: 'Briefcase', is_default: true },
  { id: 'cat-10', name: 'Freelance', type: 'income', icon: 'Laptop', is_default: true },
  { id: 'cat-11', name: 'Other', type: 'income', icon: 'DollarSign', is_default: true },
];

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(DEFAULT_CATEGORIES);
  }

  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('type', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json(DEFAULT_CATEGORIES);
    }

    return NextResponse.json(data && data.length > 0 ? data : DEFAULT_CATEGORIES);
  } catch {
    return NextResponse.json(DEFAULT_CATEGORIES);
  }
}
