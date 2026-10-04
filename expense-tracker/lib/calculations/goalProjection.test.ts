import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getRequiredMonthlySavings, getGoalProgressPercent } from './goalProjection';

describe('Goal Projection Calculations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should calculate goal progress percentage correctly', () => {
    expect(getGoalProgressPercent(50000, 100000)).toBe(50);
    expect(getGoalProgressPercent(0, 100000)).toBe(0);
    expect(getGoalProgressPercent(100000, 100000)).toBe(100);
    expect(getGoalProgressPercent(120000, 100000)).toBe(100);
  });

  it('should calculate required monthly savings when target date is set', () => {
    // Current date is 2026-08-01. Target date is 2026-12-01 (approx 4 months).
    // Target: 100,000, Current: 20,000, Remaining: 80,000.
    const result = getRequiredMonthlySavings(100000, 20000, '2026-12-01');
    expect(result.monthsRemaining).toBeGreaterThanOrEqual(3);
    expect(result.requiredMonthlySavings).toBeGreaterThan(0);
  });

  it('should return 0 required monthly savings if target date is null', () => {
    const result = getRequiredMonthlySavings(100000, 20000, null);
    expect(result.monthsRemaining).toBe(0);
    expect(result.requiredMonthlySavings).toBe(0);
  });

  it('should return required amount immediately if target date has passed', () => {
    const result = getRequiredMonthlySavings(100000, 20000, '2026-07-01');
    expect(result.monthsRemaining).toBe(0);
    expect(result.requiredMonthlySavings).toBe(80000);
  });
});
