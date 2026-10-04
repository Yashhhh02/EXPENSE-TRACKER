import { callOpenRouter, getModelForTask } from './router';

export interface ReportSummaryInput {
  income: number;
  expenses: number;
  savings: number;
  topCategories: { name: string; amount: number }[];
  highestExpenses: { note: string; amount: number; date: string }[];
}

export async function generateReportNarrative(
  period: 'week' | 'month' | 'year',
  summary: ReportSummaryInput
): Promise<string> {
  const fallbackNarrative = `In this ${period}, your total income was ₹${summary.income.toLocaleString()}, total expenses were ₹${summary.expenses.toLocaleString()}, resulting in a net savings of ₹${summary.savings.toLocaleString()}.`;

  try {
    const model = process.env.OPENROUTER_REPORT_MODEL || getModelForTask('report');
    const systemPrompt = `You are a professional financial analyst AI writing periodic financial reports for a user. Based on the provided financial summary data for the specified period (${period}), write a concise 3 to 5 sentence plain-language narrative summarizing their financial performance, key spending categories, notable purchases, and savings. Speak directly to the user in a clear, encouraging, and insightful tone.`;

    const userPrompt = `Financial Data (${period}):
- Total Income: ₹${summary.income.toLocaleString()}
- Total Expenses: ₹${summary.expenses.toLocaleString()}
- Net Savings: ₹${summary.savings.toLocaleString()}
- Top Categories: ${summary.topCategories.map((c) => `${c.name}: ₹${c.amount}`).join(', ')}
- Highest Individual Purchases: ${summary.highestExpenses.map((h) => `${h.note} (₹${h.amount})`).join(', ')}

Write 3 to 5 sentence narrative report summary:`;

    const narrative = await callOpenRouter(model, systemPrompt, userPrompt, {
      maxTokens: 250,
      timeoutMs: 15000,
    });

    return narrative || fallbackNarrative;
  } catch (error) {
    console.warn(`AI ${period} report narrative failed, using fallback:`, error);
    return fallbackNarrative;
  }
}
