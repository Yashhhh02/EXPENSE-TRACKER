export interface GoalProjection {
  monthsRemaining: number;
  requiredMonthlySavings: number;
}

export function getRequiredMonthlySavings(
  targetAmount: number,
  currentAmount: number,
  targetDate: Date | string | null
): GoalProjection {
  const remaining = Math.max(0, targetAmount - currentAmount);

  if (!targetDate) {
    return { monthsRemaining: 0, requiredMonthlySavings: 0 };
  }

  const now = new Date();
  const end = new Date(targetDate);
  const diffMs = end.getTime() - now.getTime();
  const monthsRemaining = Math.max(0, diffMs / (1000 * 60 * 60 * 24 * 30.44));

  if (monthsRemaining <= 0) {
    return { monthsRemaining: 0, requiredMonthlySavings: remaining };
  }

  const requiredMonthlySavings = remaining / monthsRemaining;

  return {
    monthsRemaining: Math.floor(monthsRemaining),
    requiredMonthlySavings: Math.round(requiredMonthlySavings * 100) / 100,
  };
}

export function getGoalProgressPercent(currentAmount: number, targetAmount: number): number {
  if (targetAmount <= 0) return 0;
  return Math.min(100, Math.round((currentAmount / targetAmount) * 100 * 10) / 10);
}
