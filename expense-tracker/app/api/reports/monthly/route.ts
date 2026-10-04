import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/configured';
import { generateReportNarrative } from '@/lib/ai/reportNarrative';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const now = new Date();
  const defaultMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthParam = searchParams.get('month') || defaultMonthStr;

  const [yearStr, monthNumStr] = monthParam.split('-');
  const year = parseInt(yearStr, 10) || now.getFullYear();
  const month = parseInt(monthNumStr, 10) || now.getMonth() + 1;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  if (!isSupabaseConfigured()) {
    const mockSummary = {
      income: 75000,
      expenses: 42000,
      savings: 33000,
      topCategories: [
        { name: 'Food', amount: 14000 },
        { name: 'Rent', amount: 15000 },
        { name: 'Shopping', amount: 8000 },
      ],
      highestExpenses: [
        { note: 'Monthly Apartment Rent', amount: 15000, date: `${monthParam}-01` },
        { note: 'Grocery Superstore Bulk', amount: 6500, date: `${monthParam}-05` },
        { note: 'Electronics Store Purchase', amount: 4200, date: `${monthParam}-12` },
      ],
    };

    const narrative = await generateReportNarrative('month', mockSummary);

    return NextResponse.json({
      period: monthParam,
      ...mockSummary,
      categoryBreakdown: mockSummary.topCategories,
      dailyTrend: Array.from({ length: 30 }, (_, i) => ({
        date: `${monthParam}-${String(i + 1).padStart(2, '0')}`,
        amount: Math.floor(Math.random() * 2000) + 200,
      })),
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

    // Days in month setup for trend
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      dailyMap.set(dayStr, 0);
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

    const narrative = await generateReportNarrative('month', summaryInput);

    return NextResponse.json({
      period: monthParam,
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
