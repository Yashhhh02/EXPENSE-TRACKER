import { NextRequest, NextResponse } from 'next/server';
import { fetchPeriodExportData } from '@/lib/export/periodHelper';
import { generateReportNarrative } from '@/lib/ai/reportNarrative';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = (searchParams.get('reportType') as 'monthly' | 'weekly' | 'yearly') || 'monthly';
    const period = searchParams.get('period') || 'current';

    const data = await fetchPeriodExportData(reportType, period);

    // Compute top categories
    const catMap = new Map<string, number>();
    data.transactions.forEach((tx) => {
      if (tx.type === 'expense') {
        catMap.set(tx.category, (catMap.get(tx.category) || 0) + tx.amount);
      }
    });

    const topCategories = Array.from(catMap.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const highestExpenses = data.transactions
      .filter((tx) => tx.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((tx) => ({
        note: tx.note || tx.category,
        amount: tx.amount,
        date: tx.date,
      }));

    const narrative = await generateReportNarrative(
      reportType === 'weekly' ? 'week' : reportType === 'yearly' ? 'year' : 'month',
      {
        income: data.income,
        expenses: data.expenses,
        savings: data.savings,
        topCategories,
        highestExpenses,
      }
    );

    let PDFDocument: any;
    try {
      PDFDocument = require('pdfkit');
    } catch {
      PDFDocument = null;
    }

    let pdfBuffer: Buffer;

    if (PDFDocument) {
      pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header Banner
        doc
          .fillColor('#0f172a')
          .rect(0, 0, doc.page.width, 80)
          .fill();

        doc
          .fillColor('#10b981')
          .fontSize(22)
          .font('Helvetica-Bold')
          .text('AI EXPENSE TRACKER', 40, 22);

        doc
          .fillColor('#94a3b8')
          .fontSize(12)
          .font('Helvetica')
          .text(`Financial Performance Report - ${reportType.toUpperCase()} (${data.period})`, 40, 48);

        doc.moveDown(3);

        // Executive Summary Cards
        const cardY = 105;
        doc
          .fillColor('#f8fafc')
          .rect(40, cardY, 160, 55)
          .fillAndStroke('#f1f5f9', '#e2e8f0');
        doc.fillColor('#64748b').fontSize(10).text('Total Income', 50, cardY + 10);
        doc.fillColor('#10b981').fontSize(16).font('Helvetica-Bold').text(`Rs. ${data.income.toLocaleString()}`, 50, cardY + 28);

        doc
          .fillColor('#f8fafc')
          .rect(215, cardY, 160, 55)
          .fillAndStroke('#f1f5f9', '#e2e8f0');
        doc.fillColor('#64748b').fontSize(10).font('Helvetica').text('Total Expenses', 225, cardY + 10);
        doc.fillColor('#ef4444').fontSize(16).font('Helvetica-Bold').text(`Rs. ${data.expenses.toLocaleString()}`, 225, cardY + 28);

        doc
          .fillColor('#f8fafc')
          .rect(390, cardY, 160, 55)
          .fillAndStroke('#f1f5f9', '#e2e8f0');
        doc.fillColor('#64748b').fontSize(10).font('Helvetica').text('Net Savings', 400, cardY + 10);
        doc.fillColor('#3b82f6').fontSize(16).font('Helvetica-Bold').text(`Rs. ${data.savings.toLocaleString()}`, 400, cardY + 28);

        // AI Executive Narrative Box
        const narrativeY = 180;
        doc
          .fillColor('#f0fdf4')
          .rect(40, narrativeY, 510, 85)
          .fillAndStroke('#f0fdf4', '#bbf7d0');

        doc.fillColor('#166534').fontSize(11).font('Helvetica-Bold').text('AI Executive Summary', 55, narrativeY + 12);
        doc.fillColor('#1e293b').fontSize(10).font('Helvetica').text(narrative, 55, narrativeY + 30, { width: 480 });

        // Category Breakdown Table
        const catY = 285;
        doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Top Spending Categories', 40, catY);

        let currentY = catY + 20;
        topCategories.forEach((cat) => {
          doc.fillColor('#475569').fontSize(10).font('Helvetica').text(cat.name, 40, currentY);
          doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text(`Rs. ${cat.amount.toLocaleString()}`, 350, currentY);
          currentY += 18;
        });

        // Highest Individual Expenses Table
        const expY = currentY + 15;
        doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Highest Individual Purchases', 40, expY);

        currentY = expY + 20;
        highestExpenses.forEach((exp) => {
          doc.fillColor('#475569').fontSize(10).font('Helvetica').text(`${exp.date} - ${exp.note}`, 40, currentY);
          doc.fillColor('#ef4444').fontSize(10).font('Helvetica-Bold').text(`Rs. ${exp.amount.toLocaleString()}`, 350, currentY);
          currentY += 18;
        });

        // Footer
        doc
          .fillColor('#94a3b8')
          .fontSize(9)
          .font('Helvetica')
          .text('Generated automatically by AI-Powered Expense Tracker.', 40, 780, { align: 'center' });

        doc.end();
      });
    } else {
      // Basic text PDF fallback if pdfkit is compiling
      const pdfText = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length 200 >> stream
BT
/F1 18 Tf
50 720 Td
(Financial Report - ${data.period}) Tj
/F1 12 Tf
0 -30 Td
(Total Income: Rs. ${data.income}) Tj
0 -20 Td
(Total Expenses: Rs. ${data.expenses}) Tj
0 -20 Td
(Net Savings: Rs. ${data.savings}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000244 00000 n
0000000313 00000 n
trailer << /Size 6 /Root 1 0 R >>
startxref
560
%%EOF`;
      pdfBuffer = Buffer.from(pdfText, 'utf-8');
    }

    const filename = `financial_report_${reportType}_${period}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('PDF Export Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to export PDF' }, { status: 500 });
  }
}
