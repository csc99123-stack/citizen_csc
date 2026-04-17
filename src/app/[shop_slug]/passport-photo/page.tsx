import type { Metadata } from 'next';
import Link from 'next/link';
import { PassportPhotoClient } from './components/PassportPhotoClient';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Passport Photo Maker | SmartForms',
  description: 'Create print-ready A4 passport photo sheets (16 photos) or 4x6 inch (8 photos). ₹10 per sheet download.',
};

interface PageProps {
  params: Promise<{ shop_slug: string }>;
}

export default async function PassportPhotoPage({ params }: PageProps) {
  const { shop_slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  let walletBalance = 0;

  if (user) {
    const { data } = await supabase.from('users').select('wallet_balance').eq('id', user.id).single();
    walletBalance = data?.wallet_balance ?? 0;
  }

  const navItems = [
    { icon: 'dashboard', label: 'Dashboard', href: 'dashboard' },
    { icon: 'build', label: 'Tools', href: 'dashboard', active: true },
    { icon: 'account_balance_wallet', label: 'Wallet', href: 'wallet' },
    { icon: 'settings', label: 'Settings', href: '#' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
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
            <Link key={item.label} href={item.href === '#' ? '#' : `/${shop_slug}/${item.href}`}
              className={`flex items-center gap-3 px-4 py-3 font-medium transition-colors duration-200 ${
                item.active ? 'bg-blue-600/10 text-blue-400 border-r-4 border-blue-600' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}>
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="px-6 pt-6 border-t border-slate-800/60">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs">
              {shop_slug.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-white truncate">{shop_slug.toUpperCase()}</p>
              <p className="text-[10px] text-slate-500">Senior Operator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64 flex-1 flex flex-col">
        <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 bg-slate-50/80 backdrop-blur-xl flex justify-between items-center px-8 z-40 border-b border-slate-200/50">
          <div className="flex items-center gap-3">
            <Link href={`/${shop_slug}/dashboard`}>
              <span className="material-symbols-outlined text-slate-400 text-sm">arrow_back</span>
            </Link>
            <div>
              <h2 className="text-base font-bold text-slate-900">Passport Photo Maker</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">A4 (16) or 4x6 (8) · Print Template</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200/60">
              <span className="material-symbols-outlined text-green-600 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
              <span className="text-sm font-bold text-green-700">₹{walletBalance.toLocaleString('en-IN')}</span>
            </div>
            <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full font-medium">Cost: −₹10/sheet</span>
          </div>
        </header>

        <div className="pt-24 px-8 pb-16">
          <PassportPhotoClient shopSlug={shop_slug} walletBalance={walletBalance} userId={user?.id ?? null} />
        </div>
      </div>
    </div>
  );
}
