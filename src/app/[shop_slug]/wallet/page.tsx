import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { RechargeButton } from './components/RechargeButton';

export const metadata: Metadata = {
  title: 'Wallet & Recharge | Magistrate OS - SmartForms',
  description: 'Manage your operator wallet balance, view transaction history, and recharge via Razorpay.',
};

interface PageProps {
  params: Promise<{ shop_slug: string }>;
}

const transactions = [
  {
    date: 'Oct 24, 2023', time: '02:45 PM',
    service: 'Affidavit Generation', ref: '#AFF-99210',
    amount: -20, icon: 'description', iconBg: 'bg-slate-100 text-slate-500',
    status: 'success',
  },
  {
    date: 'Oct 24, 2023', time: '11:20 AM',
    service: 'Affiliate Commission', ref: '#COM-88219',
    amount: 100, icon: 'payments', iconBg: 'bg-blue-50 text-blue-600',
    status: 'success',
  },
  {
    date: 'Oct 23, 2023', time: '04:15 PM',
    service: 'AI Letter Assistant', ref: '#MRO-44102',
    amount: -10, icon: 'auto_awesome', iconBg: 'bg-orange-50 text-orange-600',
    status: 'success',
  },
  {
    date: 'Oct 22, 2023', time: '09:00 AM',
    service: 'Wallet Topup via Razorpay', ref: 'RAZORPAY: #pay_K923lx',
    amount: 1000, icon: 'add_circle', iconBg: 'bg-green-50 text-green-600',
    status: 'success',
  },
  {
    date: 'Oct 21, 2023', time: '03:30 PM',
    service: 'Resume Builder PDF', ref: '#RES-12401',
    amount: -15, icon: 'badge', iconBg: 'bg-slate-100 text-slate-500',
    status: 'success',
  },
];

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', active: false, href: 'dashboard' },
  { icon: 'build', label: 'Tools', active: false, href: 'dashboard' },
  { icon: 'account_balance_wallet', label: 'Wallet', active: true, href: 'wallet' },
  { icon: 'analytics', label: 'Analytics', active: false, href: '#' },
  { icon: 'settings', label: 'Settings', active: false, href: '#' },
];

export default async function WalletPage({ params }: PageProps) {
  const { shop_slug } = await params;
  const supabase = await createClient();

  // ── Auth Gate ────────────────────────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  // ── Fetch Data ───────────────────────────────────────────────────────────
  // 1. Get user profile (wallet balance)
  const { data: userData } = await supabase
    .from('users')
    .select('wallet_balance')
    .eq('id', user.id)
    .single();

  // 2. Get transactions
  const { data: txs } = await supabase
    .from('wallet_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  const walletBalance = userData?.wallet_balance ?? 0;
  const transactions = txs ?? [];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* ─── SideNavBar ─── */}
      <aside className="h-screen w-64 fixed left-0 top-0 sidebar-gradient shadow-2xl shadow-slate-950/50 flex flex-col py-6 z-50">
        <div className="px-6 mb-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/30">
            <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">Magistrate OS</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Premium SaaS</p>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={`/${shop_slug}/${item.href}`}
              className={`flex items-center gap-3 px-4 py-3 font-medium transition-colors duration-200 ${
                item.active
                  ? 'bg-blue-600/10 text-blue-400 border-r-4 border-blue-600'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <span className="material-symbols-outlined text-xl" style={item.active ? { fontVariationSettings: "'FILL' 1" } : {}}>{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="px-6 pt-6 border-t border-slate-800/60">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {shop_slug.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{shop_slug.toUpperCase()}</p>
              <p className="text-[10px] text-slate-500 truncate">Senior Operator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="ml-64 flex-1 min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 bg-slate-50/70 backdrop-blur-xl flex justify-between items-center px-8 z-40 border-b border-slate-200/50">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800">Wallet & Recharge</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-600/10 rounded-full border border-blue-600/20">
              <span className="material-symbols-outlined text-blue-600 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              <span className="text-sm font-bold text-blue-600">₹{walletBalance.toLocaleString('en-IN')}</span>
            </div>
            <button id="wallet-notifications-btn" className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-600/5 rounded-full transition-all relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-50"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs border-2 border-white shadow-sm">
              {shop_slug.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="pt-24 px-8 pb-16 space-y-8">

          {/* ─── Hero Balance Card ─── */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Balance Card */}
            <div className="lg:col-span-2 glass-card rounded-3xl p-10 relative overflow-hidden shadow-sm border border-slate-200/60">
              <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-48 h-48 bg-slate-500/5 rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-blue-600/60">Current Liquidity</span>
                    <h3 className="text-5xl font-black text-slate-900 mt-2 tracking-tight">₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                    <p className="text-slate-500 mt-3 max-w-sm leading-relaxed text-sm">
                      Your balance is used to pay for service applications and legal documents instantly.
                    </p>
                  </div>
                  <div className="p-4 bg-blue-600/10 rounded-2xl flex-shrink-0">
                    <span className="material-symbols-outlined text-4xl text-blue-600" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mt-8">
                  <RechargeButton shopSlug={shop_slug} />
                  <button
                    id="statement-btn"
                    className="bg-slate-100 text-slate-700 font-bold px-8 py-4 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-3"
                  >
                    <span className="material-symbols-outlined">file_download</span>
                    Download Statement
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats Column */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                    <span className="material-symbols-outlined">trending_up</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today&apos;s Commissions</p>
                    <p className="text-2xl font-black text-slate-900">+₹420.00</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/60">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                    <span className="material-symbols-outlined">history</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Debits</p>
                    <p className="text-2xl font-black text-slate-900">-₹2,140.00</p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-600/5 rounded-2xl p-6 border border-blue-600/10">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Auto-Recharge</p>
                    <p className="text-sm font-medium text-slate-500 mt-1">Status: Disabled</p>
                  </div>
                  <button
                    id="auto-recharge-toggle"
                    className="h-6 w-10 bg-slate-300 rounded-full relative p-1 cursor-pointer transition-colors"
                  >
                    <div className="h-4 w-4 bg-white rounded-full shadow-sm"></div>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ─── Transaction History ─── */}
          <section className="bg-slate-100/50 rounded-3xl p-1 overflow-hidden">
            <div className="bg-white rounded-[1.4rem] shadow-sm">
              <div className="px-8 py-6 flex items-center justify-between border-b border-slate-50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Transaction History</h3>
                  <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-0.5">All debits and commission credits</p>
                </div>
                <div className="flex gap-2">
                  <button id="filter-all-btn" className="px-4 py-2 rounded-full bg-slate-100 text-xs font-bold text-slate-700">ALL</button>
                  <button id="filter-credits-btn" className="px-4 py-2 rounded-full bg-white text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors">CREDITS</button>
                  <button id="filter-debits-btn" className="px-4 py-2 rounded-full bg-white text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors">DEBITS</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-slate-400 font-bold border-b border-slate-50">
                      <th className="px-8 py-4">Date & Time</th>
                      <th className="px-8 py-4">Service / Action</th>
                      <th className="px-8 py-4 text-right">Amount</th>
                      <th className="px-8 py-4 text-center">Status</th>
                      <th className="px-8 py-4 text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-10 text-center text-slate-400 text-sm italic">
                          No transactions found.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx, idx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors group">
                          <td className="px-8 py-5">
                            <p className="text-sm font-semibold text-slate-900">
                              {new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {new Date(tx.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                                tx.transaction_type === 'recharge' ? 'bg-green-50 text-green-600' :
                                tx.transaction_type === 'affiliate_commission' ? 'bg-blue-50 text-blue-600' :
                                'bg-slate-100 text-slate-500'
                              }`}>
                                <span className="material-symbols-outlined text-sm">
                                  {tx.transaction_type === 'recharge' ? 'add_circle' :
                                   tx.transaction_type === 'affiliate_commission' ? 'payments' : 'description'}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900 capitalize">{tx.transaction_type.replace(/_/g, ' ')}</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-tight">REF: {tx.reference_id?.slice(-12).toUpperCase() ?? 'N/A'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <p className={`text-sm font-black ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex justify-center">
                              <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-black uppercase">Success</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <button
                              id={`invoice-${idx}-btn`}
                              className="text-slate-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <span className="material-symbols-outlined text-base">download</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
               <div className="px-8 py-6 border-t border-slate-50 flex items-center justify-between">
                <p className="text-xs text-slate-400 font-medium">Showing {transactions.length} transactions</p>
                <div className="flex gap-3">
                  <button id="prev-page-btn" className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50">
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <button id="next-page-btn" className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50">
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
