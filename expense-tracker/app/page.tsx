import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Wallet, Sparkles, TrendingUp, PiggyBank, Target, ArrowRight, ShieldCheck } from 'lucide-react';

export default async function HomePage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl && !supabaseUrl.includes('your-supabase-project')) {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        redirect('/dashboard');
      }
    } catch {}
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight">FinFlow AI</span>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-zinc-300 hover:text-white px-4 py-2 transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold text-slate-950 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl mx-auto px-6 py-20 relative overflow-hidden">
        {/* Glowing Ambient Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-amber-400 text-xs font-semibold shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>AI-Powered Personal Money Management</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Master Your Money with <span className="bg-gradient-to-r from-amber-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Smart Intelligence</span>
          </h1>

          <p className="text-zinc-400 text-lg sm:text-xl max-w-2xl mx-auto font-normal leading-relaxed">
            Real-time transaction tracking, automated category budgets, intelligent savings goal projections, and AI-driven financial advisory.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-base rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white font-semibold text-base rounded-2xl transition-all"
            >
              Sign In to Account
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 relative z-10">
          <div className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl backdrop-blur-sm hover:border-zinc-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Core Money Logic</h3>
            <p className="text-sm text-zinc-400">
              Track income & expenses with real-time balance calculations, payment methods, and instant custom date filtering.
            </p>
          </div>

          <div className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl backdrop-blur-sm hover:border-zinc-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-teal-500/20 text-amber-400 flex items-center justify-center mb-4">
              <PiggyBank className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Smart Category Budgets</h3>
            <p className="text-sm text-zinc-400">
              Set monthly spending limits for categories with dynamic color progress indicators alerting you near limits.
            </p>
          </div>

          <div className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl backdrop-blur-sm hover:border-zinc-700 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Goal Projections</h3>
            <p className="text-sm text-zinc-400">
              Define savings goals and get auto-calculated monthly contribution requirements based on target completion dates.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 py-8 bg-zinc-950 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Encrypted & Secured with Supabase RLS</span>
          </div>
          <p>© {new Date().getFullYear()} Expense Tracker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
