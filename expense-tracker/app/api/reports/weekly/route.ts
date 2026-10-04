import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/configured';
import { generateReportNarrative } from '@/lib/ai/reportNarrative';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const now = new Date();
  const dateParam = searchParams.get('week') || now.toISOString().split('T')[0];

  const targetDate = new Date(dateParam);
  const dayOfWeek = targetDate.getDay();
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  const startDate = new Date(targetDate);
  startDate.setDate(targetDate.getDate() + diffToMonday);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  if (!isSupabaseConfigured()) {
    const mockSummary = {
      income: 18750,
      expenses: 10500,
      savings: 8250,
      topCategories: [
        { name: 'Food', amount: 3500 },
        { name: 'Transport', amount: 2200 },
        { name: 'Bills', amount: 3000 },
      ],
      highestExpenses: [
        { note: 'Weekly Supermarket Run', amount: 3500, date: dateParam },
        { note: 'Utility Bill Payment', amount: 3000, date: dateParam },
      ],
    };

    const narrative = await generateReportNarrative('week', mockSummary);

    return NextResponse.json({
      period: `Week of ${startDate.toISOString().split('T')[0]}`,
      ...mockSummary,
      categoryBreakdown: mockSummary.topCategories,
      dailyTrend: Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        return {
          date: d.toISOString().split('T')[0],
          amount: Math.floor(Math.random() * 1500) + 300,
        };
      }),
      narrative,
    });
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*, category:categories(*)')
      .eq('user_id', user.id)
      .gte('transaction_date', startDate.toISOString().split('T')[0])
      .lte('transaction_date', endDate.toISOString().split('T')[0]);

    const txs = transactions || [];

    let totalIncome = 0;
    let totalExpenses = 0;
    const catMap = new Map<string, number>();
    const dailyMap = new Map<string, number>();

    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      dailyMap.set(d.toISOString().split('T')[0], 0);
    }

    txs.forEach((tx) => {
      const amt = Number(tx.amount);
      if (tx.type === 'income') {
        totalIncome += amt;
      } else if (tx.type === 'expense') {
        totalExpenses += amt;
        const catName = tx.category?.name || 'Other';
        catMap.set(catName, (catMap.get(catName) || 0) + amt);

        const dStr = tx.transaction_date;
        if (dailyMap.has(dStr)) {
          dailyMap.set(dStr, (dailyMap.get(dStr) || 0) + amt);
        }
      }
    });

    const netSavings = Math.max(0, totalIncome - totalExpenses);

    const categoryBreakdown = Array.from(catMap.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    const highestExpenses = txs
      .filter((tx) => tx.type === 'expense')
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5)
      .map((tx) => ({
        note: tx.note || tx.category?.name || 'Expense',
        amount: Number(tx.amount),
        date: tx.transaction_date,
      }));

    const dailyTrend = Array.from(dailyMap.entries()).map(([date, amount]) => ({
      date,
      amount,
    }));

    const summaryInput = {
      income: totalIncome,
      expenses: totalExpenses,
      savings: netSavings,
      topCategories: categoryBreakdown.slice(0, 5),
      highestExpenses,
    };

    const narrative = await generateReportNarrative('week', summaryInput);

    return NextResponse.json({
      period: `Week of ${startDate.toISOString().split('T')[0]}`,
      income: totalIncome,
      expenses: totalExpenses,
      savings: netSavings,
      categoryBreakdown,
      dailyTrend,
      highestExpenses,
      narrative,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
