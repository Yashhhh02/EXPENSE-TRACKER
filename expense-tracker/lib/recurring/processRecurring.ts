import { SupabaseClient } from '@supabase/supabase-js';

export function calculateNextDueDate(currentDateStr: string, frequency: 'monthly' | 'weekly' | 'yearly'): string {
  const d = new Date(currentDateStr);
  if (frequency === 'weekly') {
    d.setDate(d.getDate() + 7);
  } else if (frequency === 'monthly') {
    d.setMonth(d.getMonth() + 1);
  } else if (frequency === 'yearly') {
    d.setFullYear(d.getFullYear() + 1);
  }
  return d.toISOString().split('T')[0];
}

export async function processRecurringTransactions(supabase: SupabaseClient) {
  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date(todayStr);

  // Fetch active recurring items
  const { data: recurringList, error: recError } = await supabase
    .from('recurring_transactions')
    .select('*, category:categories(*)')
    .eq('is_active', true);

  if (recError || !recurringList) {
    return { success: false, error: recError?.message || 'Failed to fetch recurring items' };
  }

  let autoAddedCount = 0;
  let reminderCount = 0;

  for (const item of recurringList) {
    const dueDateStr = item.next_due_date;
    const dueDate = new Date(dueDateStr);

    if (dueDateStr <= todayStr) {
      if (item.auto_add) {
        // Auto-insert transaction
        const { error: txError } = await supabase.from('transactions').insert({
          user_id: item.user_id,
          category_id: item.category_id,
          amount: item.amount,
          type: item.type,
          payment_method: 'other',
          note: `[Auto-Recurring] ${item.name}`,
          transaction_date: dueDateStr,
          ai_categorized: false,
        });

        if (!txError) {
          autoAddedCount++;

          // Advance next_due_date
          const nextDateStr = calculateNextDueDate(dueDateStr, item.frequency);
          await supabase
            .from('recurring_transactions')
            .update({ next_due_date: nextDateStr })
            .eq('id', item.id);

          // Confirmation notification
          await supabase.from('notifications').insert({
            user_id: item.user_id,
            type: 'bill_due',
            message: `Auto-processed recurring ${item.type}: "${item.name}" of amount ${item.amount} was automatically added.`,
            related_id: item.id,
          });
        }
      }
    } else {
      // Check reminder window
      const diffMs = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= item.reminder_days_before && diffDays >= 0) {
        const { data: existingReminders } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', item.user_id)
          .eq('type', 'bill_due')
          .eq('related_id', item.id)
          .ilike('message', `%${dueDateStr}%`);

        if (!existingReminders || existingReminders.length === 0) {
          await supabase.from('notifications').insert({
            user_id: item.user_id,
            type: 'bill_due',
            message: `Upcoming Bill Reminder: "${item.name}" of amount ${item.amount} is due on ${dueDateStr}.`,
            related_id: item.id,
          });
          reminderCount++;
        }
      }
    }
  }

  return { success: true, autoAddedCount, reminderCount };
}
