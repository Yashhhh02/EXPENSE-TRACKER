import { NextRequest, NextResponse } from 'next/server';
import { fetchPeriodExportData } from '@/lib/export/periodHelper';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = (searchParams.get('reportType') as 'monthly' | 'weekly' | 'yearly') || 'monthly';
    const period = searchParams.get('period') || 'current';

    const data = await fetchPeriodExportData(reportType, period);

    // Try requiring xlsx dynamically
    let XLSX: any;
    try {
      XLSX = require('xlsx');
    } catch {
      XLSX = null;
    }

    let buffer: Buffer;

    if (XLSX) {
      const summaryRows = [
        { Metric: 'Report Period', Value: data.period },
        { Metric: 'Total Income', Value: data.income },
        { Metric: 'Total Expenses', Value: data.expenses },
        { Metric: 'Net Savings', Value: data.savings },
        { Metric: '', Value: '' }, // empty row spacer
      ];

      const txRows = data.transactions.map((tx) => ({
        Date: tx.date,
        Category: tx.category,
        Type: tx.type,
        Amount: tx.amount,
        'Payment Method': tx.paymentMethod,
        Note: tx.note,
      }));

      const wb = XLSX.utils.book_new();
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      const wsTx = XLSX.utils.json_to_sheet(txRows);

      XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');
      XLSX.utils.book_append_sheet(wb, wsTx, 'Transactions List');

      buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    } else {
      // Fallback CSV content formatted with Excel MIME type if xlsx package not present
      const headers = ['Date', 'Category', 'Type', 'Amount', 'Payment Method', 'Note'];
      const rows = data.transactions.map((tx) =>
        [tx.date, `"${tx.category}"`, tx.type, tx.amount, tx.paymentMethod, `"${tx.note}"`].join(',')
      );
      buffer = Buffer.from([headers.join(','), ...rows].join('\n'), 'utf-8');
    }

    const filename = `financial_report_${reportType}_${period}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Excel Export Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to export Excel' }, { status: 500 });
  }
}
