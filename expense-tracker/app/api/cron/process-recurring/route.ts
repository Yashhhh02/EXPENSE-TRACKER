import { createClient } from '@/lib/supabase/server';
import { processRecurringTransactions } from '@/lib/recurring/processRecurring';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = createClient();
  const result = await processRecurringTransactions(supabase);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    message: 'Recurring transactions processed successfully.',
    autoAddedCount: result.autoAddedCount,
    reminderCount: result.reminderCount,
  });
}

export async function GET() {
  const supabase = createClient();
  const result = await processRecurringTransactions(supabase);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    message: 'Recurring transactions processed successfully.',
    autoAddedCount: result.autoAddedCount,
    reminderCount: result.reminderCount,
  });
}
