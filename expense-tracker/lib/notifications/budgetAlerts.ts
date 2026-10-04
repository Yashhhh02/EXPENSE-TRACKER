import { SupabaseClient } from '@supabase/supabase-js';
import { getBudgetUsagePercent } from '@/lib/calculations/budgetUsage';

export async function checkAndCreateBudgetAlerts(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string,
  transactionDate: string
) {
  if (!categoryId) return;

  const month = transactionDate.slice(0, 7) + '-01';

  // 1. Fetch budget for category and month
  const { data: budget } = await supabase
    .from('budgets')
    .select('*, category:categories(*)')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .eq('month', month)
    .single();

  if (!budget || !budget.monthly_limit || budget.monthly_limit <= 0) return;

  // 2. Fetch all expenses for this category & month
  const monthStart = month;
  const year = parseInt(month.slice(0, 4));
  const m = parseInt(month.slice(5, 7));
  const monthEnd = new Date(year, m, 0).toISOString().split('T')[0];

  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .eq('type', 'expense')
    .gte('transaction_date', monthStart)
    .lte('transaction_date', monthEnd);

  const spent = (transactions || []).reduce((sum, tx) => sum + Number(tx.amount), 0);
  const usagePercent = getBudgetUsagePercent(spent, budget.monthly_limit);

  if (usagePercent < 80) return;

  // 3. Fetch existing notifications for this budget
  const { data: existingNotifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('type', 'budget_alert')
    .eq('related_id', budget.id);

  const has80Alert = (existingNotifications || []).some((n) => n.message.includes('80%'));
  const has100Alert = (existingNotifications || []).some((n) => n.message.includes('100%'));

  const categoryName = budget.category?.name || 'Category';

  if (usagePercent >= 100 && !has100Alert) {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'budget_alert',
      message: `Budget Alert (100%): You have exceeded your monthly limit for ${categoryName}! Spent: ${spent}, Limit: ${budget.monthly_limit}.`,
      related_id: budget.id,
    });
  } else if (usagePercent >= 80 && usagePercent < 100 && !has80Alert) {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'budget_alert',
      message: `Budget Warning (80%): You have reached ${Math.round(usagePercent)}% of your monthly limit for ${categoryName}. Spent: ${spent}, Limit: ${budget.monthly_limit}.`,
      related_id: budget.id,
    });
  }
}
