import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/configured';

export interface ExportTransaction {
  date: string;
  category: string;
  type: string;
  amount: number;
  paymentMethod: string;
  note: string;
}

export async function fetchPeriodExportData(
  reportType: 'monthly' | 'weekly' | 'yearly',
  period: string
) {
  const now = new Date();

  let startDate: string;
  let endDate: string;

  if (reportType === 'monthly') {
    const [yearStr, monthStr] = (period || `${now.getFullYear()}-${now.getMonth() + 1}`).split('-');
    const year = parseInt(yearStr, 10) || now.getFullYear();
    const month = parseInt(monthStr, 10) || now.getMonth() + 1;
    startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  } else if (reportType === 'weekly') {
    const targetDate = new Date(period || now.toISOString().split('T')[0]);
    const dayOfWeek = targetDate.getDay();
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const monday = new Date(targetDate);
    monday.setDate(targetDate.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    startDate = monday.toISOString().split('T')[0];
    endDate = sunday.toISOString().split('T')[0];
  } else {
    const year = parseInt(period, 10) || now.getFullYear();
    startDate = `${year}-01-01`;
    endDate = `${year}-12-31`;
  }

  if (!isSupabaseConfigured()) {
    const mockTxs: ExportTransaction[] = [
      { date: `${startDate}`, category: 'Salary', type: 'income', amount: 75000, paymentMethod: 'netbanking', note: 'Monthly Salary Credit' },
      { date: `${startDate}`, category: 'Rent', type: 'expense', amount: 15000, paymentMethod: 'upi', note: 'Apartment Rent' },
      { date: `${startDate}`, category: 'Food', type: 'expense', amount: 450, paymentMethod: 'card', note: 'Swiggy Dinner Order' },
      { date: `${startDate}`, category: 'Shopping', type: 'expense', amount: 3200, paymentMethod: 'card', note: 'Clothing Store' },
      { date: `${startDate}`, category: 'Bills', type: 'expense', amount: 1800, paymentMethod: 'upi', note: 'Electricity Bill' },
    ];
    return {
      period,
      startDate,
      endDate,
      transactions: mockTxs,
      income: 75000,
      expenses: 20450,
      savings: 54550,
    };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: rawTxs } = await supabase
    .from('transactions')
    .select('*, category:categories(*)')
    .eq('user_id', user.id)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .order('transaction_date', { ascending: false });

  const txs = rawTxs || [];

  let income = 0;
  let expenses = 0;

  const formattedTransactions: ExportTransaction[] = txs.map((tx) => {
    const amt = Number(tx.amount);
    if (tx.type === 'income') income += amt;
    if (tx.type === 'expense') expenses += amt;

    return {
      date: tx.transaction_date,
      category: tx.category?.name || 'Uncategorized',
      type: tx.type,
      amount: amt,
      paymentMethod: tx.payment_method || 'N/A',
      note: tx.note || '',
    };
  });

  return {
    period,
    startDate,
    endDate,
    transactions: formattedTransactions,
    income,
    expenses,
    savings: Math.max(0, income - expenses),
  };
}
