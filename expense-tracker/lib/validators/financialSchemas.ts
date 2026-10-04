import { z } from 'zod';

export const transactionSchema = z.object({
  amount: z
    .number({ message: 'Amount is required' })
    .positive('Amount must be greater than 0'),
  type: z.enum(['income', 'expense'], { message: 'Type is required' }),
  category_id: z.string().uuid('Invalid category').nullable().optional(),
  payment_method: z
    .enum(['cash', 'card', 'upi', 'netbanking', 'other'])
    .nullable()
    .optional(),
  note: z.string().max(500, 'Note must be under 500 characters').nullable().optional(),
  transaction_date: z.string().min(1, 'Date is required'),
  ai_categorized: z.boolean().optional(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

export const budgetSchema = z.object({
  category_id: z.string().uuid('Invalid category'),
  monthly_limit: z
    .number({ message: 'Monthly limit is required' })
    .nonnegative('Limit must be 0 or more'),
  month: z.string().min(1, 'Month is required'), // ISO date string of first day of month
});

export type BudgetInput = z.infer<typeof budgetSchema>;

export const goalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be under 100 characters'),
  target_amount: z
    .number({ message: 'Target amount is required' })
    .positive('Target must be greater than 0'),
  current_amount: z.number().nonnegative('Current amount cannot be negative').optional(),
  target_date: z.string().nullable().optional(),
  status: z.enum(['active', 'completed', 'abandoned']).optional(),
});

export type GoalInput = z.infer<typeof goalSchema>;

export const recurringSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be under 100 characters'),
  amount: z.number({ message: 'Amount is required' }).positive('Amount must be greater than 0'),
  type: z.enum(['income', 'expense'], { message: 'Type is required' }),
  category_id: z.string().uuid('Invalid category').nullable().optional(),
  frequency: z.enum(['monthly', 'weekly', 'yearly'], { message: 'Frequency is required' }),
  next_due_date: z.string().min(1, 'Next due date is required'),
  auto_add: z.boolean().optional(),
  reminder_days_before: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
});

export type RecurringInput = z.infer<typeof recurringSchema>;
