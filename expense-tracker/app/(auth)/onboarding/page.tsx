'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Wallet,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { FixedExpense, FinancialHabits } from '@/types/domain';

const CURRENCIES = [
  { code: 'INR', label: 'INR (₹) - Indian Rupee' },
  { code: 'USD', label: 'USD ($) - US Dollar' },
  { code: 'EUR', label: 'EUR (€) - Euro' },
  { code: 'GBP', label: 'GBP (£) - British Pound' },
  { code: 'AUD', label: 'AUD ($) - Australian Dollar' },
  { code: 'CAD', label: 'CAD ($) - Canadian Dollar' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [preferredCurrency, setPreferredCurrency] = useState('INR');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [salaryDate, setSalaryDate] = useState('1');
  const [savingsGoal, setSavingsGoal] = useState('');
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([
    { name: 'Rent / Home', amount: 0 },
  ]);
  const [financialHabits, setFinancialHabits] = useState<FinancialHabits>({
    tracks_budget: true,
    impulsive_spender: false,
    uses_credit_card: false,
    has_emergency_fund: false,
  });

  // Expense row handlers
  const addExpenseRow = () => {
    setFixedExpenses([...fixedExpenses, { name: '', amount: 0 }]);
  };

  const updateExpenseRow = (
    index: number,
    field: 'name' | 'amount',
    value: string | number
  ) => {
    const updated = [...fixedExpenses];
    if (field === 'name') {
      updated[index].name = value as string;
    } else {
      updated[index].amount = Number(value) || 0;
    }
    setFixedExpenses(updated);
  };

  const removeExpenseRow = (index: number) => {
    setFixedExpenses(fixedExpenses.filter((_, i) => i !== index));
  };

  // Step Validation
  const validateStep = () => {
    setError(null);
    if (step === 1) {
      if (!fullName.trim()) {
        setError('Please enter your full name.');
        return false;
      }
    }
    if (step === 2) {
      if (!monthlyIncome || Number(monthlyIncome) <= 0) {
        setError('Please enter a valid monthly income.');
        return false;
      }
    }
    if (step === 3) {
      if (!savingsGoal || Number(savingsGoal) < 0) {
        setError('Please enter a valid savings goal (0 or more).');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError('User session not found. Please log in again.');
        setLoading(false);
        return;
      }

      const cleanedExpenses = fixedExpenses.filter(
        (exp) => exp.name.trim() !== '' && exp.amount > 0
      );

      // Use upsert to guarantee profile exists even if auth trigger missed it
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName.trim(),
        preferred_currency: preferredCurrency,
        monthly_income: Number(monthlyIncome),
        salary_date: Number(salaryDate),
        savings_goal_monthly: Number(savingsGoal),
        fixed_expenses: cleanedExpenses,
        financial_habits: financialHabits,
        onboarding_completed: true,
      });

      if (profileError) {
        console.error('Profile update error:', profileError);
        setError(profileError.message || 'Failed to save profile.');
        setLoading(false);
        return;
      }

      // Check if categories exist for user, if not seed defaults
      const { data: existingCategories } = await supabase
        .from('categories')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (!existingCategories || existingCategories.length === 0) {
        // Seed default categories
        try {
          await supabase.rpc('seed_default_categories', { p_user_id: user.id });
        } catch {
          // Fallback if RPC fails
          const defaultCats = [
            { user_id: user.id, name: 'Food', type: 'expense', icon: 'Utensils', is_default: true },
            { user_id: user.id, name: 'Shopping', type: 'expense', icon: 'ShoppingBag', is_default: true },
            { user_id: user.id, name: 'Transport', type: 'expense', icon: 'Car', is_default: true },
            { user_id: user.id, name: 'Bills', type: 'expense', icon: 'FileText', is_default: true },
            { user_id: user.id, name: 'Entertainment', type: 'expense', icon: 'Tv', is_default: true },
            { user_id: user.id, name: 'Health', type: 'expense', icon: 'Heart', is_default: true },
            { user_id: user.id, name: 'Rent', type: 'expense', icon: 'Home', is_default: true },
            { user_id: user.id, name: 'Other', type: 'expense', icon: 'MoreHorizontal', is_default: true },
            { user_id: user.id, name: 'Salary', type: 'income', icon: 'Briefcase', is_default: true },
            { user_id: user.id, name: 'Freelance', type: 'income', icon: 'Laptop', is_default: true },
            { user_id: user.id, name: 'Other', type: 'income', icon: 'DollarSign', is_default: true },
          ];
          await supabase.from('categories').insert(defaultCats);
        }
      }

      // Sync fixed expenses to fixed_expenses table
      if (cleanedExpenses.length > 0) {
        const rows = cleanedExpenses.map((exp) => ({
          user_id: user.id,
          name: exp.name.trim(),
          amount: exp.amount,
        }));
        try {
          await supabase.from('fixed_expenses').insert(rows);
        } catch {
          // ignore duplicate/non-critical insert errors
        }
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      console.error('Onboarding submission error:', err);
      setError(err?.message || 'An unexpected error occurred while saving.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 mb-3 shadow-lg shadow-amber-500/20">
            <Wallet className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Financial Onboarding</h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            Let&apos;s customize your expense tracking & AI advisor
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 mb-2">
            <span>Step {step} of 5</span>
            <span>{Math.round((step / 5) * 100)}% Completed</span>
          </div>
          <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800/80 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start space-x-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Basic Information</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  How should we address you and display currency?
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="mt-1.5 w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  Preferred Currency
                </label>
                <select
                  value={preferredCurrency}
                  onChange={(e) => setPreferredCurrency(e.target.value)}
                  className="mt-1.5 w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: Income & Salary Date */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Income Details</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Enter your monthly income and the day your salary is credited.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  Estimated Monthly Income ({preferredCurrency})
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder="e.g. 75000"
                  className="mt-1.5 w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  Salary Date (Day of the month)
                </label>
                <select
                  value={salaryDate}
                  onChange={(e) => setSalaryDate(e.target.value)}
                  className="mt-1.5 w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      Day {day} of every month
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 3: Savings Goal */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Monthly Savings Goal</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  How much would you like to save or invest every month?
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300">
                  Monthly Savings Target ({preferredCurrency})
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={savingsGoal}
                  onChange={(e) => setSavingsGoal(e.target.value)}
                  placeholder="e.g. 20000"
                  className="mt-1.5 w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Fixed Expenses */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Fixed Monthly Expenses</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Add predictable recurring payments like rent, EMI, or subscriptions.
                </p>
              </div>

              <div className="space-y-3">
                {fixedExpenses.map((expense, idx) => (
                  <div key={idx} className="flex items-center space-x-3">
                    <input
                      type="text"
                      placeholder="Expense Name (e.g. Rent)"
                      value={expense.name}
                      onChange={(e) =>
                        updateExpenseRow(idx, 'name', e.target.value)
                      }
                      className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={expense.amount || ''}
                      onChange={(e) =>
                        updateExpenseRow(idx, 'amount', e.target.value)
                      }
                      className="w-32 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    {fixedExpenses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExpenseRow(idx)}
                        className="p-2.5 text-zinc-400 hover:text-red-400 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-red-500/30 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addExpenseRow}
                className="w-full py-2.5 border border-dashed border-zinc-700 hover:border-amber-500/50 text-zinc-300 hover:text-amber-400 rounded-xl text-sm font-medium transition-all flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Expense</span>
              </button>
            </div>
          )}

          {/* STEP 5: Financial Habits Quiz */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Financial Habits Quiz</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Help our AI tailor personalized financial insights for you.
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-all">
                  <span className="text-sm text-zinc-200">
                    Do you actively track your budget?
                  </span>
                  <input
                    type="checkbox"
                    checked={financialHabits.tracks_budget}
                    onChange={(e) =>
                      setFinancialHabits({
                        ...financialHabits,
                        tracks_budget: e.target.checked,
                      })
                    }
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-all">
                  <span className="text-sm text-zinc-200">
                    Do you tend to make impulsive purchases?
                  </span>
                  <input
                    type="checkbox"
                    checked={financialHabits.impulsive_spender}
                    onChange={(e) =>
                      setFinancialHabits({
                        ...financialHabits,
                        impulsive_spender: e.target.checked,
                      })
                    }
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-all">
                  <span className="text-sm text-zinc-200">
                    Do you regularly use credit cards for daily expenses?
                  </span>
                  <input
                    type="checkbox"
                    checked={financialHabits.uses_credit_card}
                    onChange={(e) =>
                      setFinancialHabits({
                        ...financialHabits,
                        uses_credit_card: e.target.checked,
                      })
                    }
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-all">
                  <span className="text-sm text-zinc-200">
                    Do you have an emergency fund saved?
                  </span>
                  <input
                    type="checkbox"
                    checked={financialHabits.has_emergency_fund}
                    onChange={(e) =>
                      setFinancialHabits({
                        ...financialHabits,
                        has_emergency_fund: e.target.checked,
                      })
                    }
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 flex items-center justify-between pt-6 border-t border-zinc-800/80">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-white bg-zinc-950 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 text-sm font-semibold text-slate-950 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 text-sm font-semibold text-slate-950 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center space-x-2"
              >
                {loading ? (
                  <span>Saving Profile...</span>
                ) : (
                  <>
                    <span>Complete Onboarding</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
