'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { ToolSidebar } from './ToolSidebar';

interface ToolLayoutProps {
  children: ReactNode;
  shopSlug: string;
  userEmail?: string;
  toolName: string;
  toolSubtext: string;
  walletBalance: number;
  costPerDoc: number;
}

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', active: false, href: 'dashboard' },
  { icon: 'build', label: 'Tools', active: true, href: '#' },
  { icon: 'account_balance_wallet', label: 'Wallet', active: false, href: 'wallet' },
  { icon: 'analytics', label: 'Analytics', active: false, href: '#' },
  { icon: 'settings', label: 'Settings', active: false, href: '#' },
];

export function ToolLayout({ 
  children, 
  shopSlug, 
  userEmail, 
  toolName, 
  toolSubtext, 
  walletBalance,
  costPerDoc
}: ToolLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <ToolSidebar 
        shopSlug={shopSlug} 
        userEmail={userEmail} 
        navItems={navItems}
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />

      <div 
        className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ease-in-out ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Top Header */}
        <header className="flex-shrink-0 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 flex justify-between items-center px-6 py-3 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <span className="material-symbols-outlined text-slate-500">
                {isCollapsed ? 'menu_open' : 'menu'}
              </span>
            </button>
            <Link href={`/${shopSlug}/dashboard`} className="group flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 transition-all">
              <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-600 transition-colors">arrow_back</span>
            </Link>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">{toolName}</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{toolSubtext}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Wallet Info Badge */}
            <div className="flex items-center gap-3 bg-slate-100/80 border border-slate-200/60 pl-2 pr-4 py-1.5 rounded-full shadow-sm">
              <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-900 leading-none">₹{walletBalance.toLocaleString('en-IN')}</span>
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Current Balance</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                Cost: ₹{costPerDoc} / doc
              </span>
            </div>

            {!userEmail && (
              <Link href="/auth/login" className="text-xs text-white font-bold bg-blue-600 px-4 py-2 rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
                Operator Login
              </Link>
            )}
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
