import { callOpenRouter, getModelForTask } from './router';
import { Profile, Transaction, Budget, Goal } from '@/types/domain';

export interface HealthScoreBreakdown {
  savingsRate: number;
  budgetAdherence: number;
  spendingConsistency: number;
}

export interface HealthScoreResult {
  score: number;
  breakdown: HealthScoreBreakdown;
  summary: string;
}

export async function calculateHealthScore(
  userId: string,
  profile: Profile | null,
  transactions: Transaction[],
  budgets: Budget[],
  goals: Goal[]
): Promise<HealthScoreResult> {
  // Filter transactions for recent 30 days / current month
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const recentTx = transactions.filter(
    (tx) => new Date(tx.transaction_date) >= thirtyDaysAgo
  );

  const txIncome = recentTx
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const totalIncome = txIncome > 0 ? txIncome : Number(profile?.monthly_income || 0);

  const totalExpenses = recentTx
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  // 1. Savings Rate Sub-score (40% weight)
  let savingsRateScore = 75; // default fallback if no income data
  if (totalIncome > 0) {
    const netSavings = totalIncome - totalExpenses;
    const savingsRatio = netSavings / totalIncome; // e.g. 0.20 = 20%
    // 20% savings rate gives full 100 points, 0% gives 0 points
    savingsRateScore = Math.min(100, Math.max(0, Math.round((savingsRatio / 0.20) * 100)));
  }

  // 2. Budget Adherence Sub-score (35% weight)
  let budgetAdherenceScore = 80; // default if no budgets exist
  if (budgets.length > 0) {
    const budgetScores = budgets.map((b) => {
      const categorySpent = recentTx
        .filter((tx) => tx.type === 'expense' && tx.category_id === b.category_id)
        .reduce((sum, tx) => sum + Number(tx.amount), 0);
      const limit = Number(b.monthly_limit);
      if (limit <= 0) return 100;
      if (categorySpent <= limit) return 100;
      const overpct = (categorySpent - limit) / limit;
      return Math.max(0, Math.round(100 - overpct * 100));
    });
    budgetAdherenceScore = Math.round(
      budgetScores.reduce((a, b) => a + b, 0) / budgetScores.length
    );
  }

  // 3. Spending Consistency Sub-score (25% weight)
  let spendingConsistencyScore = 85; // default
  if (transactions.length > 5) {
    // Group expenses by weekly buckets to compute variance
    const weeklySums: { [weekKey: string]: number } = {};
    transactions
      .filter((tx) => tx.type === 'expense')
      .forEach((tx) => {
        const d = new Date(tx.transaction_date);
        const weekKey = `${d.getFullYear()}-W${Math.floor(d.getDate() / 7)}`;
        weeklySums[weekKey] = (weeklySums[weekKey] || 0) + Number(tx.amount);
      });

    const values = Object.values(weeklySums);
    if (values.length > 1) {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      if (mean > 0) {
        const variance =
          values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        const cv = stdDev / mean; // Coefficient of variation
        spendingConsistencyScore = Math.min(100, Math.max(0, Math.round(100 - cv * 50)));
      }
    }
  }

  // Deterministic Overall Score calculation (40% + 35% + 25%)
  const overallScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        0.4 * savingsRateScore + 0.35 * budgetAdherenceScore + 0.25 * spendingConsistencyScore
      )
    )
  );

  const breakdown: HealthScoreBreakdown = {
    savingsRate: savingsRateScore,
    budgetAdherence: budgetAdherenceScore,
    spendingConsistency: spendingConsistencyScore,
  };

  // Generate short AI summary using OpenRouter Advisor model
  const defaultSummary = `Your financial health score is ${overallScore}/100. Your savings rate score is ${savingsRateScore}%, budget adherence is ${budgetAdherenceScore}%, and spending consistency is ${spendingConsistencyScore}%.`;

  let aiSummary = defaultSummary;
  try {
    const model = process.env.OPENROUTER_ADVISOR_MODEL || getModelForTask('advisor');
    const systemPrompt = `You are an expert AI financial health advisor. Given a user's calculated financial health score (out of 100) and its 3 component sub-scores, provide a warm, encouraging, 2-3 sentence personalized summary explaining what they are doing well and where they can improve. Keep it plain-text, clear, and actionable. Do not mention exact formula weights.`;

    const userPrompt = `Financial Health Data:
- Overall Score: ${overallScore}/100
- Savings Rate Score: ${savingsRateScore}/100
- Budget Adherence Score: ${budgetAdherenceScore}/100
- Spending Consistency Score: ${spendingConsistencyScore}/100
- Total Monthly Income: ${totalIncome}
- Total Monthly Expenses: ${totalExpenses}

Write the 2-3 sentence summary:`;

    aiSummary = await callOpenRouter(model, systemPrompt, userPrompt, {
      maxTokens: 180,
      timeoutMs: 12000,
    });
  } catch (err) {
    console.warn('AI health score summary generation failed, using fallback:', err);
  }

  return {
    score: overallScore,
    breakdown,
    summary: aiSummary,
  };
}
