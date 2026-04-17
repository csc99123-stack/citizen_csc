import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { GovtPost, SubscriptionPlan } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Sarkari Pariksha | Jobs, Results & Mock Tests',
  description: 'Browse the latest government jobs, exam results, and admit cards. Subscribe for premium mock tests for SSC, UPSC, Banking, and more.',
};

interface PageProps {
  params: Promise<{ shop_slug: string }>;
}

const govtJobs = [
  {
    id: 'sbi-clerk-2024',
    title: 'SBI Clerk Recruitment 2024',
    state: 'All India',
    deadline: '15 Nov 2024',
    deadlineUrgent: true,
    icon: 'account_balance',
    iconBg: 'bg-blue-100 text-blue-600',
    posts: '8,773',
    category: 'Banking',
  },
  {
    id: 'up-police-constable',
    title: 'UP Police Constable 60,244 Posts',
    state: 'Uttar Pradesh',
    deadline: '28 Dec 2024',
    deadlineUrgent: false,
    icon: 'security',
    iconBg: 'bg-orange-100 text-orange-600',
    posts: '60,244',
    category: 'Police',
  },
  {
    id: 'bpsc-teacher-3',
    title: 'BPSC Teacher Recruitment 3.0',
    state: 'Bihar',
    deadline: '10 Jan 2025',
    deadlineUrgent: false,
    icon: 'school',
    iconBg: 'bg-green-100 text-green-700',
    posts: '70,000+',
    category: 'Teaching',
  },
  {
    id: 'ssc-gd-constable',
    title: 'SSC GD Constable Recruitment',
    state: 'All India',
    deadline: '05 Feb 2025',
    deadlineUrgent: false,
    icon: 'military_tech',
    iconBg: 'bg-purple-100 text-purple-600',
    posts: '26,146',
    category: 'Defense',
  },
  {
    id: 'rrb-ntpc-2024',
    title: 'RRB NTPC Recruitment 2024',
    state: 'All India',
    deadline: '20 Feb 2025',
    deadlineUrgent: false,
    icon: 'train',
    iconBg: 'bg-red-100 text-red-600',
    posts: '11,558',
    category: 'Railway',
  },
];

const subscriptionPlans = [
  {
    id: 'upsc-pack',
    name: 'UPSC Pack',
    tagline: 'Complete coverage of Civil Services & Forest Services.',
    price: '4,999',
    badge: 'Most Prestigious',
    badgeColor: 'bg-slate-100 text-slate-700',
    icon: 'policy',
    iconBg: 'bg-blue-600/10 text-blue-600',
    features: ['200+ Full Length Prelims Tests', 'Mains Answer Writing Module', 'Daily Current Affairs Quiz', 'Nationwide Rank Dashboard'],
    highlight: false,
  },
  {
    id: 'ssc-premium',
    name: 'SSC Premium',
    tagline: 'All CGL, CHSL, MTS & GD Exams in one subscription.',
    price: '1,499',
    badge: '⚡ Popular Choice',
    badgeColor: 'bg-orange-500 text-white',
    icon: 'verified_user',
    iconBg: 'bg-white/20 text-white',
    features: ['1,500+ Sectional & Full Tests', 'Smart Performance Analytics', 'Bilingual Prep (English & Hindi)', 'Mock Interview Module'],
    highlight: true,
  },
  {
    id: 'banking-pro',
    name: 'Banking Pro',
    tagline: 'Speed & Accuracy focused tests for IBPS, SBI & RBI.',
    price: '2,499',
    badge: 'Bank Specialist',
    badgeColor: 'bg-slate-100 text-slate-700',
    icon: 'payments',
    iconBg: 'bg-blue-600/10 text-blue-600',
    features: ['800+ Speed Drill Tests', 'High-Level DI & Puzzle Special', 'Previous Year Solved Papers', 'Live Percentile Tracker'],
    highlight: false,
  },
];

export default async function SarkariPariksha({ params }: PageProps) {
  const { shop_slug } = await params;
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  // ── Auth Check ───────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  let walletBalance = 0;
  if (user) {
    const { data: userData } = await supabase.from('users').select('wallet_balance').eq('id', user.id).single();
    walletBalance = userData?.wallet_balance ?? 0;
  }

  // ── Fetch Data ───────────────────────────────────────────────────────────
  // 1. Get tenant branding
  const { data: branding } = await supabaseAdmin.from('tenant_branding').select('shop_name, logo_url').eq('shop_slug', shop_slug).single();
  if (!branding) notFound();

  // 2. Get govt posts (recruitment)
  const { data: postsData } = await supabaseAdmin
    .from('govt_posts')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  // 3. Get subscription plans
  const { data: plansData } = await supabaseAdmin
    .from('subscription_plans')
    .select('*')
    .order('price', { ascending: true });

  const govtJobs: GovtPost[] = (postsData ?? []) as GovtPost[];
  const plans: SubscriptionPlan[] = (plansData ?? []) as SubscriptionPlan[];
  const shopName = branding.shop_name;

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen">
      {/* ─── Top Nav Bar ─── */}
      <header className="fixed top-0 w-full z-50 bg-slate-50/80 backdrop-blur-md shadow-sm shadow-blue-900/5 flex justify-between items-center px-8 py-3">
        <div className="flex items-center gap-8">
          <Link href={`/${shop_slug}`} className="flex items-center gap-2">
            {branding.logo_url ? (
              <img src={branding.logo_url} alt={shopName} className="h-8 w-auto" />
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
              </div>
            )}
            <span className="text-lg font-bold tracking-tight text-slate-900">{shopName}</span>
          </Link>
          <nav className="hidden md:flex gap-6 items-center">
            <Link className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors" href={`/${shop_slug}`}>Services</Link>
            <a className="text-sm font-semibold text-blue-600 border-b-2 border-blue-600 pb-0.5" href="#">Sarkari Jobs</a>
            <a className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors" href="#mock-tests">Mock Tests</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-full border border-orange-200/60">
                <span className="material-symbols-outlined text-orange-600 text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                <span className="text-xs font-bold text-orange-700">₹{walletBalance.toLocaleString('en-IN')}</span>
              </div>
              <Link
                href={`/${shop_slug}/dashboard`}
                className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-5 py-2 rounded-lg font-semibold text-sm shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
              >
                Dashboard
              </Link>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold text-sm"
            >
              Operator Login
            </Link>
          )}
        </div>
      </header>

      <main className="pt-20 pb-24">
        {/* ─── Hero Section ─── */}
        <section className="relative px-8 py-16 mb-4">
          <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase border border-blue-200/50">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                Official Partner Network
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight tracking-tighter">
                SmartForms &{' '}
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">Sarkari Exams</span>
                {' '}India
              </h1>
              <p className="text-slate-500 text-lg max-w-xl leading-relaxed">
                The ultimate destination for seamless government job applications and premium exam prep. 
                Trusted by over 5,000 Internet Centers across India.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <a
                  href="#mock-tests"
                  className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-transform flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">quiz</span>
                  Explore Mock Tests
                </a>
                <a
                  href="#jobs"
                  className="bg-white text-slate-700 px-8 py-4 rounded-xl font-bold hover:bg-slate-50 transition-colors border border-slate-200 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">work</span>
                  View All Jobs
                </a>
              </div>
            </div>
            {/* Stats floating card */}
            <div className="flex-shrink-0 flex flex-col gap-4">
              <div className="glass-card p-6 rounded-2xl shadow-xl flex gap-4 items-center border border-slate-200/50">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined">trending_up</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Users</p>
                  <p className="text-3xl font-black text-slate-900">2.4M+</p>
                </div>
              </div>
              <div className="glass-card p-6 rounded-2xl shadow-xl flex gap-4 items-center border border-slate-200/50">
                <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined">work</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Open Vacancies</p>
                  <p className="text-3xl font-black text-slate-900">1.8L+</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── State-wise Govt Jobs Section ─── */}
        <section id="jobs" className="scroll-mt-24 px-8 mb-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">State-wise Govt Jobs</h2>
                <p className="text-slate-500">Real-time updates from every state commission across India.</p>
              </div>
              <div className="flex gap-2">
                <button id="filter-jobs-btn" className="p-2 rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
                  <span className="material-symbols-outlined text-sm">filter_list</span>
                </button>
                <button id="search-jobs-btn" className="p-2 rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
                  <span className="material-symbols-outlined text-sm">search</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200/60">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Exam Name</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">State</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Posts</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Last Date</th>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {govtJobs.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">No active recruitment notices found.</td></tr>
                  ) : (
                    govtJobs.map((job, idx) => (
                      <tr key={job.id} className="hover:bg-slate-50/60 transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                              <span className="material-symbols-outlined text-lg">
                                {job.category === 'job' ? 'work' : job.category === 'result' ? 'analytics' : 'badge'}
                              </span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 text-sm">{job.title}</span>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">{job.organisation}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-slate-500 text-sm">{job.state}</td>
                        <td className="px-6 py-5 text-slate-700 text-sm font-bold">{job.total_posts?.toLocaleString('en-IN') ?? '—'}</td>
                        <td className="px-6 py-5">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500`}>
                            {job.last_date ? new Date(job.last_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Ongoing'}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <Link
                            href={`/${shop_slug}/mock-test`}
                            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-700"
                          >
                            Prepare CBT
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between">
                <p className="text-xs text-slate-400 font-medium">Showing 5 of 2,847 active openings</p>
                <button id="load-more-jobs-btn" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  Load More
                  <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Mock Test Subscriptions ─── */}
        <section id="mock-tests" className="scroll-mt-24 px-8 py-20 mx-4 bg-gradient-to-br from-blue-600/5 to-slate-100 rounded-[4rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-blue-600/10 text-blue-600 font-bold text-xs mb-4 uppercase tracking-widest">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                Live Mock Tests
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">Elite Prep Subscriptions</h2>
              <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Get unlimited access to thousands of actual exam pattern tests, detailed analytics, and nationwide ranking dashboards.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`glass-card p-8 rounded-3xl flex flex-col hover:-translate-y-2 transition-transform duration-300 border border-slate-200/60 ${plan.price > 2000 ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-2xl shadow-blue-500/30 ring-4 ring-white/10' : ''}`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${plan.price > 2000 ? 'bg-white/20' : 'bg-blue-50 text-blue-600'}`}>
                      <span className="material-symbols-outlined text-3xl">verified_user</span>
                    </div>
                    {plan.price > 2000 && (
                      <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest">⚡ Most Popular</span>
                    )}
                  </div>
                  <h3 className={`text-2xl font-black mb-1 ${plan.price > 2000 ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                  <p className={`text-sm mb-6 ${plan.price > 2000 ? 'text-blue-100' : 'text-slate-500'}`}>Premium exam access for {plan.validity_months} months.</p>
                  <div className="mb-8 font-black">
                    <span className="text-4xl italic">₹{plan.price.toLocaleString('en-IN')}</span>
                  </div>
                  <ul className="space-y-3 mb-10 flex-1">
                    {['Unlimited Mock Tests', 'Nationwide Ranking', 'Instant Answer Keys', 'Bilingual Support'].map((feat) => (
                      <li key={feat} className={`flex items-center gap-3 text-sm font-medium ${plan.price > 2000 ? 'text-blue-50' : 'text-slate-700'}`}>
                        <span className={`material-symbols-outlined text-sm ${plan.price > 2000 ? 'text-white' : 'text-green-600'}`} style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <button
                    id={`subscribe-${plan.id}-btn`}
                    className={`w-full py-4 rounded-xl font-bold transition-all ${plan.price > 2000 ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-slate-900 text-white hover:bg-blue-600'}`}
                  >
                    Subscribe Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer className="px-8 py-16 mt-20">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
            <div className="max-w-sm">
              <Link href={`/${shop_slug}`} className="text-2xl font-black tracking-tighter text-slate-900 mb-6 block">
                {shop_slug.toUpperCase()} SaaS
              </Link>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                India&apos;s leading platform for digital government services and exam preparation. 
                Empowering internet centers and students alike with cutting-edge technology.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-12">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">States</p>
                <ul className="space-y-3 text-sm font-bold text-slate-500">
                  <li><a className="hover:text-blue-600 transition-colors" href="#">Uttar Pradesh</a></li>
                  <li><a className="hover:text-blue-600 transition-colors" href="#">Bihar</a></li>
                  <li><a className="hover:text-blue-600 transition-colors" href="#">Rajasthan</a></li>
                  <li><a className="hover:text-blue-600 transition-colors" href="#">Telangana</a></li>
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Categories</p>
                <ul className="space-y-3 text-sm font-bold text-slate-500">
                  <li><a className="hover:text-blue-600 transition-colors" href="#">Teaching Jobs</a></li>
                  <li><a className="hover:text-blue-600 transition-colors" href="#">Defense Jobs</a></li>
                  <li><a className="hover:text-blue-600 transition-colors" href="#">Railway Jobs</a></li>
                  <li><a className="hover:text-blue-600 transition-colors" href="#">Bank Jobs</a></li>
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Portal</p>
                <ul className="space-y-3 text-sm font-bold text-slate-500">
                  <li><Link className="hover:text-blue-600 transition-colors" href={`/${shop_slug}/dashboard`}>Operator Dashboard</Link></li>
                  <li><a className="hover:text-blue-600 transition-colors" href="#">Affiliate Program</a></li>
                  <li><a className="hover:text-blue-600 transition-colors" href="#">Contact Support</a></li>
                  <li><a className="hover:text-blue-600 transition-colors" href="#">Privacy Policy</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-slate-200/60 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs font-medium text-slate-400">© 2024 SmartForms & Sarkari Exams India. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Designed for Bharat</span>
              <span className="material-symbols-outlined text-blue-600 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>flag</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
