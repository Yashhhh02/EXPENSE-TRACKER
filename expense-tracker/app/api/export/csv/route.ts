import { NextRequest, NextResponse } from 'next/server';
import { fetchPeriodExportData } from '@/lib/export/periodHelper';

export const dynamic = 'force-dynamic';

function escapeCsvField(field: string | number): string {
  const str = String(field ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = (searchParams.get('reportType') as 'monthly' | 'weekly' | 'yearly') || 'monthly';
    const period = searchParams.get('period') || 'current';

    const data = await fetchPeriodExportData(reportType, period);

    const headers = ['Date', 'Category', 'Type', 'Amount', 'Payment Method', 'Note'];
    const rows = data.transactions.map((tx) => [
      escapeCsvField(tx.date),
      escapeCsvField(tx.category),
      escapeCsvField(tx.type),
      escapeCsvField(tx.amount),
      escapeCsvField(tx.paymentMethod),
      escapeCsvField(tx.note),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const filename = `financial_report_${reportType}_${period}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('CSV Export Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to export CSV' }, { status: 500 });
  }
}
