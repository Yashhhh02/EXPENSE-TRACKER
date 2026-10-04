// Supabase Edge Function: process-recurring
// Schedule with pg_cron: "0 1 * * *" (runs daily at 01:00 UTC)
// Setup instruction in SQL:
// select cron.schedule('process-recurring-daily', '0 1 * * *', $$
//   select net.http_post(
//     url:='https://<project-ref>.supabase.co/functions/v1/process-recurring',
//     headers:='{"Content-Type": "application/json", "Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb,
//     body:='{}'::jsonb
//   ) as request_id;
// $$);

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const todayStr = new Date().toISOString().split('T')[0];

    const { data: recurringList, error: recError } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('is_active', true);

    if (recError) {
      return new Response(JSON.stringify({ error: recError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let autoAddedCount = 0;

    for (const item of recurringList || []) {
      const dueDateStr = item.next_due_date;

      if (dueDateStr <= todayStr && item.auto_add) {
        // Insert transaction
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
          const d = new Date(dueDateStr);
          if (item.frequency === 'weekly') d.setDate(d.getDate() + 7);
          else if (item.frequency === 'monthly') d.setMonth(d.getMonth() + 1);
          else if (item.frequency === 'yearly') d.setFullYear(d.getFullYear() + 1);

          const nextDateStr = d.toISOString().split('T')[0];

          await supabase
            .from('recurring_transactions')
            .update({ next_due_date: nextDateStr })
            .eq('id', item.id);

          await supabase.from('notifications').insert({
            user_id: item.user_id,
            type: 'bill_due',
            message: `Auto-processed recurring ${item.type}: "${item.name}" of amount ${item.amount} was added.`,
            related_id: item.id,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: autoAddedCount }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
