'use client';

import Link from 'next/link';

interface NavItem {
  icon: string;
  label: string;
  href: string;
  active?: boolean;
}

interface ToolSidebarProps {
  shopSlug: string;
  userEmail?: string;
  navItems: NavItem[];
  isCollapsed: boolean;
  onToggle: () => void;
}

export function ToolSidebar({ 
  shopSlug, 
  userEmail, 
  navItems, 
  isCollapsed, 
  onToggle 
}: ToolSidebarProps) {
  return (
    <aside 
      className={`h-screen fixed left-0 top-0 sidebar-gradient shadow-2xl shadow-slate-950/50 flex flex-col py-6 z-50 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Toggle Button */}
      <button 
        onClick={onToggle}
        className="absolute -right-3 top-24 bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-500 hover:scale-110 active:scale-95 transition-all z-55 border-2 border-slate-900"
      >
        <span className="material-symbols-outlined text-[18px]">
          {isCollapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>

      {/* Brand */}
      <div className={`px-6 mb-10 flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center px-0' : ''}`}>
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex-shrink-0 flex items-center justify-center shadow-lg shadow-blue-600/30">
          <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
        </div>
        {!isCollapsed && (
          <div className="whitespace-nowrap transition-opacity duration-300 opacity-100">
            <h1 className="text-lg font-bold tracking-tight text-white">Magistrate OS</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Premium SaaS</p>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-1 overflow-hidden">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href === '#' ? '#' : `/${shopSlug}/${item.href}`}
            className={`flex items-center gap-3 px-4 py-3 font-medium transition-all duration-200 rounded-xl group ${
              item.active
                ? 'bg-blue-600/10 text-blue-400 border-r-4 border-blue-600 shadow-sm'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            } ${isCollapsed ? 'justify-center px-0 mx-1' : ''}`}
            title={isCollapsed ? item.label : ''}
          >
            <span className="material-symbols-outlined text-xl transition-transform group-hover:scale-110">{item.icon}</span>
            {!isCollapsed && <span className="text-sm whitespace-nowrap transition-opacity duration-300 opacity-100">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* User Session */}
      <div className={`px-4 pt-6 mt-auto border-t border-slate-800/60 transition-all`}>
        <div className={`flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 border border-slate-700/30 ${isCollapsed ? 'justify-center p-2' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-inner">
            {shopSlug.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{userEmail?.split('@')[0] ?? shopSlug.toUpperCase()}</p>
              <p className="text-[10px] text-slate-500 truncate">Senior Operator</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
