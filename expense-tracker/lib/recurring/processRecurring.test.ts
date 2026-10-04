import { describe, it, expect } from 'vitest';
import { calculateNextDueDate } from './processRecurring';

describe('Recurring Transactions Utilities', () => {
  it('should calculate next due date for weekly frequency correctly', () => {
    const next = calculateNextDueDate('2026-08-01', 'weekly');
    expect(next).toBe('2026-08-08');
  });

  it('should calculate next due date for monthly frequency correctly', () => {
    const next = calculateNextDueDate('2026-08-01', 'monthly');
    expect(next).toBe('2026-09-01');
  });

  it('should calculate next due date for yearly frequency correctly', () => {
    const next = calculateNextDueDate('2026-08-01', 'yearly');
    expect(next).toBe('2027-08-01');
  });
});
