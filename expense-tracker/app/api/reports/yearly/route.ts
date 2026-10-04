import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/configured';
import { generateReportNarrative } from '@/lib/ai/reportNarrative';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const now = new Date();
  const yearParam = searchParams.get('year') || String(now.getFullYear());
  const year = parseInt(yearParam, 10) || now.getFullYear();

  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  if (!isSupabaseConfigured()) {
    const mockSummary = {
      income: 900000,
      expenses: 540000,
      savings: 360000,
      topCategories: [
        { name: 'Rent', amount: 180000 },
        { name: 'Food', amount: 120000 },
        { name: 'Shopping', amount: 90000 },
        { name: 'Bills', amount: 80000 },
      ],
      highestExpenses: [
        { note: 'Annual Insurance Premium', amount: 45000, date: `${year}-03-15` },
        { note: 'Laptop Purchase', amount: 85000, date: `${year}-06-20` },
      ],
    };

    const narrative = await generateReportNarrative('year', mockSummary);

    const monthlyComparison = MONTH_NAMES.map((name) => ({
      month: name,
      income: 75000,
      expense: 45000,
      savings: 30000,
    }));

    return NextResponse.json({
      period: `Year ${year}`,
      ...mockSummary,
      categoryBreakdown: mockSummary.topCategories,
      monthlyComparison,
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
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);

    const txs = transactions || [];

    let totalIncome = 0;
    let totalExpenses = 0;
    const catMap = new Map<string, number>();
    const monthStats = MONTH_NAMES.map((m) => ({ month: m, income: 0, expense: 0, savings: 0 }));

    txs.forEach((tx) => {
      const amt = Number(tx.amount);
      const d = new Date(tx.transaction_date);
      const mIdx = d.getMonth();

      if (tx.type === 'income') {
        totalIncome += amt;
        if (mIdx >= 0 && mIdx < 12) monthStats[mIdx].income += amt;
      } else if (tx.type === 'expense') {
        totalExpenses += amt;
        if (mIdx >= 0 && mIdx < 12) monthStats[mIdx].expense += amt;

        const catName = tx.category?.name || 'Other';
        catMap.set(catName, (catMap.get(catName) || 0) + amt);
      }
    });

    monthStats.forEach((m) => {
      m.savings = Math.max(0, m.income - m.expense);
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

    const summaryInput = {
      income: totalIncome,
      expenses: totalExpenses,
      savings: netSavings,
      topCategories: categoryBreakdown.slice(0, 5),
      highestExpenses,
    };

    const narrative = await generateReportNarrative('year', summaryInput);

    return NextResponse.json({
      period: `Year ${year}`,
      income: totalIncome,
      expenses: totalExpenses,
      savings: netSavings,
      categoryBreakdown,
      monthlyComparison: monthStats,
      highestExpenses,
      narrative,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
