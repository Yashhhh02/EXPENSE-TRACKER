import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/configured';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    // Demo fallback chart data
    const mockCashFlow = [
      { month: 'Mar', income: 65000, expense: 42000 },
      { month: 'Apr', income: 70000, expense: 45000 },
      { month: 'May', income: 75000, expense: 48000 },
      { month: 'Jun', income: 75000, expense: 50000 },
      { month: 'Jul', income: 80000, expense: 52000 },
      { month: 'Aug', income: 75000, expense: 41000 },
    ];
    const mockCategoryPie = [
      { name: 'Food', value: 12500, color: '#10b981' },
      { name: 'Shopping', value: 8400, color: '#3b82f6' },
      { name: 'Bills', value: 9200, color: '#f59e0b' },
      { name: 'Rent', value: 15000, color: '#8b5cf6' },
    ];
    const mockComparison = [
      { metric: 'Income', thisMonth: 75000, lastMonth: 80000 },
      { metric: 'Expenses', thisMonth: 45100, lastMonth: 52000 },
      { metric: 'Net Savings', thisMonth: 29900, lastMonth: 28000 },
    ];
    return NextResponse.json({ cashFlow: mockCashFlow, categoryPie: mockCategoryPie, monthlyComparison: mockComparison });
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
      .eq('user_id', user.id);

    const txs = transactions || [];
    const now = new Date();

    // 1. CashFlow Chart Data (Last 6 months)
    const cashFlowMap = new Map<string, { income: number; expense: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short' });
      cashFlowMap.set(monthLabel, { income: 0, expense: 0 });
    }

    // 2. Monthly Comparison (This Month vs Last Month)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    let thisMonthIncome = 0;
    let thisMonthExpense = 0;
    let lastMonthIncome = 0;
    let lastMonthExpense = 0;

    // 3. Category Pie (Current Month)
    const categoryPieMap = new Map<string, number>();

    txs.forEach((tx) => {
      const txDate = new Date(tx.transaction_date);
      const amount = Number(tx.amount);
      const monthLabel = txDate.toLocaleDateString('en-US', { month: 'short' });

      // Cash flow grouping
      if (cashFlowMap.has(monthLabel)) {
        const curr = cashFlowMap.get(monthLabel)!;
        if (tx.type === 'income') curr.income += amount;
        if (tx.type === 'expense') curr.expense += amount;
      }

      // Current month calculations
      if (txDate >= thisMonthStart && txDate <= now) {
        if (tx.type === 'income') thisMonthIncome += amount;
        if (tx.type === 'expense') {
          thisMonthExpense += amount;
          const catName = tx.category?.name || 'Other';
          categoryPieMap.set(catName, (categoryPieMap.get(catName) || 0) + amount);
        }
      }

      // Last month calculations
      if (txDate >= lastMonthStart && txDate <= lastMonthEnd) {
        if (tx.type === 'income') lastMonthIncome += amount;
        if (tx.type === 'expense') lastMonthExpense += amount;
      }
    });

    const cashFlow = Array.from(cashFlowMap.entries()).map(([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense,
    }));

    const categoryPie = Array.from(categoryPieMap.entries())
      .map(([name, value], idx) => ({
        name,
        value,
        color: COLORS[idx % COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);

    const monthlyComparison = [
      { metric: 'Income', thisMonth: thisMonthIncome, lastMonth: lastMonthIncome },
      { metric: 'Expenses', thisMonth: thisMonthExpense, lastMonth: lastMonthExpense },
      {
        metric: 'Net Savings',
        thisMonth: Math.max(0, thisMonthIncome - thisMonthExpense),
        lastMonth: Math.max(0, lastMonthIncome - lastMonthExpense),
      },
    ];

    return NextResponse.json({
      cashFlow,
      categoryPie,
      monthlyComparison,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
