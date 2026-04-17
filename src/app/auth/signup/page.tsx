import type { Metadata } from 'next';
import { signupAction } from '@/app/auth/actions';

export const metadata: Metadata = {
  title: 'Create Account | SmartForms & Sarkari Exams India',
  description: 'Sign up to access government forms, mock tests, and sarkari job alerts.',
};

interface PageProps {
  searchParams: Promise<{ ref?: string }>;
}

export default async function SignupPage({ searchParams }: PageProps) {
  const { ref, success, error } = await searchParams;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-[500px] h-[400px] bg-orange-600/8 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/3 left-1/3 w-[400px] h-[300px] bg-blue-600/8 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl items-center justify-center shadow-xl shadow-blue-600/30 mb-4">
            <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Join SmartForms</h1>
          <p className="text-slate-400 text-sm mt-1.5">
            {ref ? (
              <span>You&apos;re signing up through <span className="text-blue-400 font-semibold">{ref.toUpperCase()}</span></span>
            ) : (
              'Access Sarkari Jobs, Mock Tests & Document Tools'
            )}
          </p>
        </div>

        {/* Feedback alerts */}
        {success && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Affiliate attribution badge */}
        {ref && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-green-500/8 border border-green-500/20 rounded-xl text-green-400 text-sm">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <span>Referral partner: <strong>{ref}</strong> will earn commission on your subscriptions.</span>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-slate-900 border border-slate-800/60 rounded-3xl p-8 space-y-5">
          <form action={signupAction} className="space-y-4">
            {/* Hidden ref field */}
            {ref && <input type="hidden" name="ref" value={ref} />}

            <div className="space-y-1.5">
              <label htmlFor="signup-name" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Full Name</label>
              <input
                id="signup-name"
                name="full_name"
                type="text"
                required
                autoComplete="name"
                className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all"
                placeholder="Ramesh Kumar"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="signup-email" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Email Address</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="signup-password" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Password</label>
              <input
                id="signup-password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all"
                placeholder="Minimum 8 characters"
              />
            </div>

            <button
              id="signup-submit-btn"
              type="submit"
              className="w-full bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/25 hover:scale-[1.01] active:scale-[0.99] transition-all mt-2"
            >
              Create Free Account
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <a href="/auth/login" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
              Sign In
            </a>
          </div>

          <p className="text-center text-xs text-slate-600 leading-relaxed">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
