export interface FixedExpense {
  id?: string;
  name: string;
  amount: number;
  category_id?: string | null;
}

export interface FinancialHabits {
  tracks_budget?: boolean;
  impulsive_spender?: boolean;
  uses_credit_card?: boolean;
  has_emergency_fund?: boolean;
}

export interface Profile {
  id: string;
  full_name: string | null;
  monthly_income: number | null;
  salary_date: number | null;
  preferred_currency: string;
  savings_goal_monthly: number | null;
  fixed_expenses: FixedExpense[];
  financial_habits: FinancialHabits;
  onboarding_completed: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string | null;
  is_default: boolean;
  created_at: string;
}

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'netbanking' | 'other';

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  type: 'income' | 'expense';
  payment_method: PaymentMethod | null;
  note: string | null;
  ai_categorized: boolean;
  transaction_date: string;
  created_at: string;
  category?: Category | null;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  monthly_limit: number;
  month: string;
  created_at: string;
  category?: Category | null;
}

export type GoalStatus = 'active' | 'completed' | 'abandoned';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  status: GoalStatus;
  created_at: string;
}

export interface TransactionFilters {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: PaymentMethod;
  search?: string;
}

export type Frequency = 'monthly' | 'weekly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: string | null;
  frequency: Frequency;
  next_due_date: string;
  auto_add: boolean;
  reminder_days_before: number;
  is_active: boolean;
  created_at: string;
  category?: Category | null;
}

export type NotificationType = 'budget_alert' | 'bill_due' | 'goal_milestone';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  message: string;
  read: boolean;
  related_id?: string | null;
  created_at: string;
}
