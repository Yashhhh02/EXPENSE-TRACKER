import { callOpenRouter, getModelForTask } from './router';
import { Transaction, Category, Budget, Goal, RecurringTransaction } from '@/types/domain';

export interface TopCategorySpending {
  name: string;
  amount: number;
}

export interface InsightsResult {
  tips: string[];
  flaggedSubscriptions: string[];
  topCategories: TopCategorySpending[];
}

export async function generateInsights(
  userId: string,
  transactions: Transaction[],
  categories: Category[],
  budgets: Budget[],
  goals: Goal[],
  recurring: RecurringTransaction[]
): Promise<InsightsResult> {
  // 1. Compute Top Categories (Expense only)
  const categoryMap = new Map<string, string>();
  categories.forEach((c) => categoryMap.set(c.id, c.name));

  const expenseTotals: { [catName: string]: number } = {};
  let totalExpenseAmount = 0;

  transactions
    .filter((tx) => tx.type === 'expense')
    .forEach((tx) => {
      const catName =
        tx.category?.name ||
        (tx.category_id ? categoryMap.get(tx.category_id) : null) ||
        'Other';
      const amt = Number(tx.amount);
      expenseTotals[catName] = (expenseTotals[catName] || 0) + amt;
      totalExpenseAmount += amt;
    });

  const topCategories: TopCategorySpending[] = Object.entries(expenseTotals)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  // 2. Compute Flagged Subscriptions (Recurring expenses)
  const flaggedSubscriptions: string[] = recurring
    .filter((r) => r.type === 'expense' && (r.is_active ?? true))
    .map((r) => `${r.name} (${r.frequency})`);

  // 3. AI Tips Generation
  let tips: string[] = [];

  try {
    const model = process.env.OPENROUTER_ADVISOR_MODEL || getModelForTask('advisor');
    const systemPrompt = `You are a personal AI financial advisor. Analyze the user's spending summary and output 3 to 5 concise, actionable, highly specific financial recommendations.
Return ONLY a raw JSON array of strings, for example: ["Tip 1 text", "Tip 2 text", "Tip 3 text"]. Do not include markdown codeblocks, numbers, or extra commentary.`;

    const summaryContext = {
      totalExpenseAmount,
      topSpendingCategories: topCategories,
      recurringExpenses: flaggedSubscriptions,
      budgetsConfigured: budgets.map((b) => ({
        category: categoryMap.get(b.category_id) || 'Category',
        limit: b.monthly_limit,
      })),
      goals: goals.map((g) => ({
        title: g.title,
        target: g.target_amount,
        saved: g.current_amount,
      })),
    };

    const userPrompt = `Financial Context:\n${JSON.stringify(summaryContext, null, 2)}\n\nProvide 3 to 5 financial tips as a JSON array of strings:`;

    const rawResponse = await callOpenRouter(model, systemPrompt, userPrompt, {
      maxTokens: 350,
      timeoutMs: 15000,
    });

    // Clean JSON response
    const cleaned = rawResponse
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        tips = parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // Fallback line splitter if JSON parsing fails
      tips = rawResponse
        .split('\n')
        .map((line) => line.replace(/^[-*•\d.\s]+/, '').trim())
        .filter((line) => line.length > 10)
        .slice(0, 5);
    }
  } catch (error) {
    console.warn('AI Advisor tips generation failed, returning deterministic data:', error);
    tips = [];
  }

  return {
    tips,
    flaggedSubscriptions,
    topCategories,
  };
}
