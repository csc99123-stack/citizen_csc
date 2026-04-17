import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata: Metadata = {
  title: 'Operator Dashboard | Magistrate OS - SmartForms',
  description: 'Access all SmartForms and Sarkari exam tools from your central operator dashboard.',
};

interface PageProps {
  params: Promise<{ shop_slug: string }>;
}

const tools = [
  {
    title: 'Birth Affidavit',
    description: 'Automated legal drafting for birth declaration documents with regional magistrate templates.',
    icon: 'description',
    color: 'blue',
    href: 'affidavit',
  },
  {
    title: 'AI Letter Assistant',
    description: 'Smart generator for requests using Gemini AI to format formal administrative inquiries.',
    icon: 'psychology',
    color: 'orange',
    href: 'ai-letter',
  },
  {
    title: 'Resume Builder',
    description: 'Tailored specifically for Indian Sarkari Exam standards and public sector service applications.',
    icon: 'badge',
    color: 'blue',
    href: 'resume',
  },
  {
    title: 'Passport Photo',
    description: '8x passport photos on A4 layout with AI background removal — print-ready instantly.',
    icon: 'photo_camera',
    color: 'green',
    href: '#',
  },
  {
    title: 'Sarkari Jobs',
    description: 'Browse latest government vacancies, exam calendars, and apply directly to active notifications.',
    icon: 'work',
    color: 'purple',
    href: 'jobs',
  },
  {
    title: 'Mock Test Portal',
    description: 'CBT simulation for SSC, UPSC, and state exams with live countdown and negative marking.',
    icon: 'quiz',
    color: 'red',
    href: 'jobs#mock-tests',
  },
];

const recentDownloads = [
  { date: 'Apr 15, 2024', time: '14:20 PM', name: 'SSC_CGL_Mains_Form_Draft.pdf', type: 'pdf', status: 'complete' },
  { date: 'Apr 14, 2024', time: '09:45 AM', name: 'Affidavit_Birth_Correction_v2.docx', type: 'doc', status: 'pending' },
  { date: 'Apr 13, 2024', time: '18:12 PM', name: 'AI_Generated_MRO_Request_44.pdf', type: 'pdf', status: 'complete' },
  { date: 'Apr 12, 2024', time: '11:30 AM', name: 'Resume_Rajesh_Kumar_Sarkari.pdf', type: 'pdf', status: 'complete' },
];

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', active: true, href: 'dashboard' },
  { icon: 'work', label: 'Sarkari Jobs', active: false, href: 'jobs' },
  { icon: 'account_balance_wallet', label: 'Wallet', active: false, href: 'wallet' },
  { icon: 'analytics', label: 'Analytics', active: false, href: '#' },
  { icon: 'settings', label: 'Settings', active: false, href: '#' },
];

export default async function OperatorDashboard({ params }: PageProps) {
  const { shop_slug } = await params;
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  // ── Auth Gate ────────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  // ── Fetch Data ───────────────────────────────────────────────────────────
  // 1. Get user profile (wallet balance)
  const { data: userData } = await supabase
    .from('users')
    .select('wallet_balance, role')
    .eq('id', user.id)
    .single();

  // 2. Get tenant branding
  const { data: branding } = await supabaseAdmin
    .from('tenant_branding')
    .select('shop_name, logo_url')
    .eq('shop_slug', shop_slug)
    .single();

  if (!branding) {
    notFound();
  }

  // 3. Get recent transactions
  const { data: transactions } = await supabase
    .from('wallet_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  const walletBalance = userData?.wallet_balance ?? 0;
  const shopName = branding.shop_name;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* ─── SideNavBar ─── */}
      <aside className="h-screen w-64 fixed left-0 top-0 sidebar-gradient shadow-2xl shadow-slate-950/50 flex flex-col py-6 z-50">
        {/* Brand */}
        <div className="px-6 mb-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/30">
            <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">Magistrate OS</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Premium SaaS</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href === '#' ? '#' : `/${shop_slug}/${item.href}`}
              className={`flex items-center gap-3 px-4 py-3 font-medium transition-colors duration-200 ${
                item.active
                  ? 'bg-blue-600/10 text-blue-400 border-r-4 border-blue-600'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Profile */}
        <div className="px-6 pt-6 border-t border-slate-800/60">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40">
            {branding.logo_url ? (
              <img src={branding.logo_url} alt={shopName} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {shopName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{shopName}</p>
              <p className="text-[10px] text-slate-500 truncate">{userData?.role === 'admin' ? 'Super Admin' : 'Senior Operator'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <main className="ml-64 flex-1 min-h-screen flex flex-col">
        {/* Top Nav Bar */}
        <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 bg-slate-50/70 backdrop-blur-xl flex justify-between items-center px-8 z-40 border-b border-slate-200/50">
          <div className="flex items-center gap-6 flex-1">
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                id="dashboard-search"
                className="w-full bg-slate-100/80 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400 outline-none"
                placeholder="Search forms, exams, or documents..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Wallet Badge */}
            <Link href={`/${shop_slug}/wallet`} className="flex items-center gap-2 px-4 py-1.5 bg-blue-600/10 rounded-full border border-blue-600/20 hover:bg-blue-600/20 transition-all">
              <span className="material-symbols-outlined text-blue-600 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              <span className="text-sm font-bold text-blue-600">₹{walletBalance.toLocaleString('en-IN')}</span>
            </Link>
            <div className="flex items-center gap-1">
              <button id="notifications-btn" className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-600/5 rounded-full transition-all relative">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-50"></span>
              </button>
              <button id="help-btn" className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-600/5 rounded-full transition-all">
                <span className="material-symbols-outlined">help</span>
              </button>
            </div>
            <div className="h-8 w-px bg-slate-200 mx-1"></div>
            <button id="profile-menu-btn" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              {branding.logo_url ? (
                <img src={branding.logo_url} alt={shopName} className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs border-2 border-white shadow-sm">
                  {shopName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="material-symbols-outlined text-slate-400 text-sm">expand_more</span>
            </button>
          </div>
        </header>

        {/* Content Canvas */}
        <div className="pt-24 px-8 pb-16 flex-1">
          {/* Hero Header */}
          <div className="mb-10">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">Service Hub: {shopName}</h2>
            <p className="text-slate-500 max-w-2xl">
              Access all SmartForms and Sarkari exam tools from your central dashboard. Premium automation at your fingertips.
            </p>
          </div>

          {/* Bento Grid of Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {tools.map((tool, idx) => {
              const colorMap: Record<string, string> = {
                blue: 'bg-blue-600/10 text-blue-600',
                orange: 'bg-orange-500/10 text-orange-600',
                green: 'bg-emerald-500/10 text-emerald-600',
                purple: 'bg-purple-500/10 text-purple-600',
                red: 'bg-red-500/10 text-red-600',
              };
              const btnMap: Record<string, string> = {
                blue: 'bg-blue-600 shadow-blue-600/20 hover:bg-blue-700',
                orange: 'bg-slate-700 shadow-slate-700/20 hover:bg-slate-800',
                green: 'bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700',
                purple: 'bg-purple-600 shadow-purple-600/20 hover:bg-purple-700',
                red: 'bg-red-600 shadow-red-600/20 hover:bg-red-700',
              };
              return (
                <div
                  key={idx}
                  className="glass-card p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 ${colorMap[tool.color].split(' ')[0]} rounded-bl-full -mr-10 -mt-10 transition-all duration-300 group-hover:scale-125`}></div>
                  <div className={`w-12 h-12 ${colorMap[tool.color]} rounded-xl flex items-center justify-center mb-4`}>
                    <span className="material-symbols-outlined text-2xl">{tool.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{tool.title}</h3>
                  <p className="text-sm text-slate-500 mb-6 leading-relaxed">{tool.description}</p>
                  <Link
                    href={tool.href === '#' ? '#' : `/${shop_slug}/${tool.href}`}
                    id={`tool-${idx}-btn`}
                    className={`w-full block text-center py-2.5 text-white rounded-lg font-semibold text-sm shadow-lg transition-colors ${btnMap[tool.color]}`}
                  >
                    Launch Tool
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Recent Downloads Table */}
          <div className="bg-slate-100/50 rounded-3xl p-1 overflow-hidden">
            <div className="bg-white rounded-[1.4rem] shadow-sm">
              <div className="px-8 py-6 flex items-center justify-between border-b border-slate-50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Recent Downloads</h3>
                  <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-0.5">Latest 15 Transactions</p>
                </div>
                <button id="view-all-history-btn" className="px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                  View All History
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-50">
                      <th className="px-8 py-4">Date</th>
                      <th className="px-8 py-4">Service / Action</th>
                      <th className="px-8 py-4 text-right">Amount</th>
                      <th className="px-8 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(!transactions || transactions.length === 0) ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-10 text-center text-slate-400 text-sm italic">
                          No transactions found yet.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx, idx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-slate-700">
                                {new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(tx.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded flex items-center justify-center ${tx.amount < 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                                <span className="material-symbols-outlined text-lg">
                                  {tx.transaction_type === 'recharge' ? 'account_balance_wallet' : 'description'}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-900 capitalize">{tx.transaction_type.replace(/_/g, ' ')}</span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-tighter">REF: {tx.reference_id?.slice(-8).toUpperCase() ?? 'N/A'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <span className={`text-sm font-bold ${tx.amount < 0 ? 'text-red-500' : 'text-green-600'}`}>
                              {tx.amount < 0 ? '-' : '+'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-600">
                              Success
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-8 py-4 border-t border-slate-50 flex items-center justify-center">
                <Link href={`/${shop_slug}/wallet`} id="load-more-btn" className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-all">
                  VIEW ALL HISTORY
                  <span className="material-symbols-outlined text-sm">keyboard_arrow_right</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FAB */}
      <button
        id="new-task-fab"
        className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-blue-600/40 hover:scale-110 active:scale-95 transition-all z-50"
      >
        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
      </button>
    </div>
  );
}
