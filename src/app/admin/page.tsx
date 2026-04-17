import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPostAction, togglePublishAction, deletePostAction } from './actions';
import type { GovtPost, TenantStats } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Super Admin Panel | SmartForms & Sarkari Exams India',
  description: 'Admin CMS for managing government job posts, results, admit cards, and platform operators.',
};

export default async function AdminPage() {
  // ── Auth Gate ────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
  if (userData?.role !== 'admin') redirect('/auth/login');

  // ── Fetch data ───────────────────────────────────────────────────────────
  const supabaseAdmin = createAdminClient();
  const [
    { data: posts }, 
    { data: tenants },
    { data: rechargeSumData }
  ] = await Promise.all([
    supabaseAdmin.from('govt_posts').select('*').order('created_at', { ascending: false }).limit(50),
    supabaseAdmin.rpc('get_tenant_stats'),
    supabaseAdmin.from('wallet_transactions').select('amount').eq('transaction_type', 'recharge'),
  ]);

  const govtPosts: GovtPost[] = (posts ?? []) as GovtPost[];
  const tenantStats: TenantStats[] = (tenants ?? []) as TenantStats[];
  
  const totalRecharged = (rechargeSumData ?? []).reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalCommissionPaid = tenantStats.reduce((s, t) => s + (t.total_commissions ?? 0), 0);
  const totalNetRevenue = totalRecharged - totalCommissionPaid;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top Bar */}
      <header className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/60 flex justify-between items-center px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Super Admin Panel</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">SmartForms Platform CMS</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-1.5 rounded-full uppercase tracking-widest">
            ⚡ Admin Mode
          </span>
          <p className="text-xs text-slate-400">{user.email}</p>
        </div>
      </header>

      <main className="pt-24 px-8 pb-16 space-y-10 max-w-7xl mx-auto">

        {/* ── Platform Stats Row ─────────────────────────────────────────── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Platform Net Revenue', value: `₹${totalNetRevenue.toLocaleString('en-IN')}`, icon: 'payments', color: 'text-blue-400' },
            { label: 'Total Operators', value: tenantStats.length, icon: 'storefront', color: 'text-cyan-400' },
            { label: 'Published Posts', value: govtPosts.filter(p => p.is_published).length, icon: 'newspaper', color: 'text-green-400' },
            { label: 'Operator Commissions', value: `₹${totalCommissionPaid.toLocaleString('en-IN')}`, icon: 'account_balance_wallet', color: 'text-orange-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <span className={`material-symbols-outlined text-2xl ${stat.color} mb-3 block`}>{stat.icon}</span>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          ))}
        </section>

        {/* ── Create New Post ────────────────────────────────────────────── */}
        <section className="bg-slate-900 rounded-3xl p-8 border border-slate-800">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-green-400">add_circle</span>
            Publish New Govt Post
          </h2>
          <form action={createPostAction} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="admin-title" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Post Title *</label>
                <input id="admin-title" name="title" required className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-600/50" placeholder="SBI Clerk Recruitment 2025" />
              </div>
              <div>
                <label htmlFor="admin-category" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Category *</label>
                <select id="admin-category" name="category" className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-600/50">
                  <option value="job">Job / Recruitment</option>
                  <option value="result">Result</option>
                  <option value="admit_card">Admit Card</option>
                </select>
              </div>
              <div>
                <label htmlFor="admin-org" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Organisation</label>
                <input id="admin-org" name="organisation" className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-600/50" placeholder="Staff Selection Commission" />
              </div>
              <div>
                <label htmlFor="admin-state" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">State</label>
                <input id="admin-state" name="state" className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-600/50" placeholder="All India" />
              </div>
              <div>
                <label htmlFor="admin-posts" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Total Posts</label>
                <input id="admin-posts" name="total_posts" type="number" className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-600/50" placeholder="8773" />
              </div>
              <div>
                <label htmlFor="admin-last-date" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Last Date</label>
                <input id="admin-last-date" name="last_date" type="date" className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-600/50" />
              </div>
            </div>
            <div>
              <label htmlFor="admin-excerpt" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Short Excerpt (for listing cards)</label>
              <input id="admin-excerpt" name="excerpt" className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-600/50" placeholder="Brief description shown in job listings..." />
            </div>
            <div>
              <label htmlFor="admin-content" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Full Content (HTML or plain text) *</label>
              <textarea id="admin-content" name="content_html" required rows={6} className="w-full bg-slate-800 border border-slate-700/60 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-600/50 resize-none" placeholder="<h2>Important Dates</h2><p>Last Date: ...</p><h2>Eligibility</h2>..." />
            </div>
            <div className="flex items-center gap-3">
              <input type="hidden" name="is_published" value="true" />
              <button id="admin-publish-btn" type="submit" className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">publish</span>
                Publish Immediately
              </button>
            </div>
          </form>
        </section>

        {/* ── Posts Table ────────────────────────────────────────────────── */}
        <section className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800">
          <div className="px-8 py-5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">All Government Posts</h2>
            <span className="text-xs text-slate-400">{govtPosts.length} posts total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-800">
                  <th className="px-8 py-4">Title</th>
                  <th className="px-8 py-4">Category</th>
                  <th className="px-8 py-4">Posts</th>
                  <th className="px-8 py-4">Last Date</th>
                  <th className="px-8 py-4 text-center">Status</th>
                  <th className="px-8 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {govtPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="px-8 py-4">
                      <p className="text-sm font-semibold text-white line-clamp-1">{post.title}</p>
                      <p className="text-[10px] text-slate-500">{post.organisation}</p>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        post.category === 'job' ? 'bg-blue-500/10 text-blue-400' :
                        post.category === 'result' ? 'bg-green-500/10 text-green-400' :
                        'bg-orange-500/10 text-orange-400'
                      }`}>{post.category.replace('_', ' ')}</span>
                    </td>
                    <td className="px-8 py-4 text-sm text-slate-300">{post.total_posts?.toLocaleString('en-IN') ?? '—'}</td>
                    <td className="px-8 py-4 text-sm text-slate-400">{post.last_date ? new Date(post.last_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="px-8 py-4 text-center">
                      <form action={togglePublishAction.bind(null, post.id, post.is_published)}>
                        <button type="submit" id={`toggle-${post.id}-btn`} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border transition-colors ${
                          post.is_published
                            ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                            : 'bg-slate-700 text-slate-400 border-slate-600 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/20'
                        }`}>
                          {post.is_published ? 'Published' : 'Draft'}
                        </button>
                      </form>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <form action={deletePostAction.bind(null, post.id)} onSubmit={(e) => { if (!confirm('Delete this post permanently?')) e.preventDefault(); }}>
                        <button type="submit" id={`delete-${post.id}-btn`} className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Operator Management ────────────────────────────────────────── */}
        <section className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800">
          <div className="px-8 py-5 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white">Operator Management</h2>
            <p className="text-xs text-slate-400 mt-0.5">All B2B operators with wallet balances and commission earnings</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-800">
                  <th className="px-8 py-4">Shop</th>
                  <th className="px-8 py-4 text-right">Wallet Balance</th>
                  <th className="px-8 py-4 text-right">Total Commissions</th>
                  <th className="px-8 py-4 text-right">B2C Users</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {tenantStats.length === 0 ? (
                  <tr><td colSpan={4} className="px-8 py-8 text-center text-slate-500 text-sm">No operators registered yet.</td></tr>
                ) : (
                  tenantStats.map((tenant) => (
                    <tr key={tenant.tenant_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-8 py-4">
                        <p className="text-sm font-semibold text-white">{tenant.shop_name}</p>
                        <p className="text-[10px] text-slate-500">/{tenant.shop_slug}</p>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <p className="text-sm font-bold text-white">₹{tenant.wallet_balance.toLocaleString('en-IN')}</p>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <p className="text-sm font-bold text-green-400">₹{(tenant.total_commissions ?? 0).toLocaleString('en-IN')}</p>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <p className="text-sm text-slate-300">{tenant.user_count?.toLocaleString('en-IN') ?? 0}</p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
