import type { Metadata } from 'next';
import { loginAction } from '@/app/auth/actions';

export const metadata: Metadata = {
  title: 'Operator Login | Magistrate OS - SmartForms',
  description: 'Login to your SmartForms operator dashboard.',
};

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex w-14 h-14 bg-blue-600 rounded-2xl items-center justify-center shadow-xl shadow-blue-600/40 mb-5">
            <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Magistrate OS</h1>
          <p className="text-slate-400 text-sm mt-1.5">Sign in to your operator dashboard</p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{error === 'auth_callback_failed' ? 'Authentication failed. Please try again.' : error}</span>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-slate-900 border border-slate-800/60 rounded-3xl p-8">
          <form action={loginAction} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Email Address
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600/50 outline-none transition-all"
                placeholder="operator@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-password" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Password
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600/50 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              className="w-full bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/25 hover:scale-[1.01] active:scale-[0.99] transition-all mt-2 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>
              Sign In to Dashboard
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center text-sm text-slate-500">
            New operator?{' '}
            <a href="/auth/signup" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
              Register your CSC
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Secured by Supabase Auth · SmartForms & Sarkari Exams India
        </p>
      </div>
    </div>
  );
}
