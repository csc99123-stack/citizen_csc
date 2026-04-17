import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MockTestClient } from './components/MockTestClient';
import type { MockTest } from '@/lib/types';
import { purchaseMockTestAction } from './actions';

export const metadata: Metadata = {
  title: 'SSC CGL Mock Test | Live CBT Simulator',
  description: 'Attempt full-length SSC CGL mock tests with live countdown timer.',
};

interface PageProps {
  params: Promise<{ shop_slug: string }>;
}

export default async function MockTestPage({ params }: PageProps) {
  const { shop_slug } = await params;
  const supabase = await createClient();

  // 1. Auth Gate
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // 2. Fetch the mock test
  const { data: mockTest } = await supabase
    .from('mock_tests')
    .select('*')
    .limit(1)
    .single();

  if (!mockTest || !mockTest.questions_payload) notFound();
  const test = mockTest as MockTest;

  // 3. Access Check (Subscription or Single Purchase)
  const { data: sub } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  const { data: purchase } = await supabase
    .from('wallet_transactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('reference_id', `MOCKTEST-${test.id}`)
    .single();

  const hasAccess = !!sub || !!purchase;

  if (!hasAccess) {
    // Render Locked State
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-20 h-20 bg-blue-600/20 text-blue-500 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
        </div>
        <h2 className="text-3xl font-black mb-2">Premium Content Locked</h2>
        <p className="text-slate-400 mb-8 max-w-md mx-auto">
          This full-length {test.title} requires an active subscription or a one-time unlock fee.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl flex flex-col items-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">One-Time Access</p>
            <p className="text-4xl font-black text-white mb-6">₹10</p>
            <form action={purchaseMockTestAction.bind(null, shop_slug, test.id)}>
              <button 
                type="submit"
                className="px-8 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-all"
              >
                Unlock This Test
              </button>
            </form>
          </div>
          <div className="bg-gradient-to-br from-blue-700 to-blue-900 p-8 rounded-3xl flex flex-col items-center">
            <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">All-Exams Pass</p>
            <p className="text-4xl font-black text-white mb-2">₹199</p>
            <p className="text-[10px] text-blue-200 mb-6 italic">Valid for 30 days</p>
            <Link 
              href={`/${shop_slug}/dashboard`}
              className="px-8 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-400 transition-all shadow-lg"
            >
              Get Premium Plan
            </Link>
          </div>
        </div>
        <Link href={`/${shop_slug}/dashboard`} className="mt-8 text-sm font-semibold text-slate-500 hover:text-white transition-colors">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      <header className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href={`/${shop_slug}/dashboard`} className="text-slate-400 hover:text-white transition-colors">
             <span className="material-symbols-outlined text-sm">close</span>
          </Link>
          <div>
            <h1 className="text-sm font-bold text-white">{test.title}</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">
              {test.questions_payload.questions.length} Qs · {test.duration_minutes} Mins
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-[10px] font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full uppercase">Authenticated ✓</span>
        </div>
      </header>

      <div className="pt-16">
        <MockTestClient test={test} shopSlug={shop_slug} />
      </div>
    </div>
  );
}
