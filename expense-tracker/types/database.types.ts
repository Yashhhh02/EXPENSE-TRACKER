export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          monthly_income: number | null;
          salary_date: number | null;
          preferred_currency: string;
          savings_goal_monthly: number | null;
          fixed_expenses: Json;
          financial_habits: Json;
          onboarding_completed: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          monthly_income?: number | null;
          salary_date?: number | null;
          preferred_currency?: string;
          savings_goal_monthly?: number | null;
          fixed_expenses?: Json;
          financial_habits?: Json;
          onboarding_completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          monthly_income?: number | null;
          salary_date?: number | null;
          preferred_currency?: string;
          savings_goal_monthly?: number | null;
          fixed_expenses?: Json;
          financial_habits?: Json;
          onboarding_completed?: boolean;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'income' | 'expense';
          icon: string | null;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: 'income' | 'expense';
          icon?: string | null;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: 'income' | 'expense';
          icon?: string | null;
          is_default?: boolean;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          amount: number;
          type: 'income' | 'expense';
          payment_method: 'cash' | 'card' | 'upi' | 'netbanking' | 'other' | null;
          note: string | null;
          ai_categorized: boolean;
          transaction_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          amount: number;
          type: 'income' | 'expense';
          payment_method?: 'cash' | 'card' | 'upi' | 'netbanking' | 'other' | null;
          note?: string | null;
          ai_categorized?: boolean;
          transaction_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          amount?: number;
          type?: 'income' | 'expense';
          payment_method?: 'cash' | 'card' | 'upi' | 'netbanking' | 'other' | null;
          note?: string | null;
          ai_categorized?: boolean;
          transaction_date?: string;
          created_at?: string;
        };
      };
      fixed_expenses: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          amount: number;
          category_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          amount: number;
          category_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          amount?: number;
          category_id?: string | null;
          created_at?: string;
        };
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          monthly_limit: number;
          month: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          monthly_limit: number;
          month: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          monthly_limit?: number;
          month?: string;
          created_at?: string;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          target_amount: number;
          current_amount: number;
          target_date: string | null;
          status: 'active' | 'completed' | 'abandoned';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          target_amount: number;
          current_amount?: number;
          target_date?: string | null;
          status?: 'active' | 'completed' | 'abandoned';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          target_amount?: number;
          current_amount?: number;
          target_date?: string | null;
          status?: 'active' | 'completed' | 'abandoned';
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
