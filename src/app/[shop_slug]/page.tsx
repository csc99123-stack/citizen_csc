import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';

interface PageProps {
  params: Promise<{ shop_slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shop_slug } = await params;
  const supabase = createAdminClient();
  const { data: branding } = await supabase
    .from('tenant_branding')
    .select('shop_name')
    .eq('shop_slug', shop_slug)
    .single();

  const shopName = branding?.shop_name ?? shop_slug.toUpperCase();
  return {
    title: `${shopName} | SmartForms & Sarkari Exams India`,
    description: `Access government forms, legal documents, exam prep at ${shopName}. Your trusted Common Service Centre partner.`,
  };
}

export default async function PublicLandingPage({ params }: PageProps) {
  const { shop_slug } = await params;
  const supabase = createAdminClient();

  // Fetch live tenant branding
  const { data: branding } = await supabase
    .from('tenant_branding')
    .select('shop_name, logo_url, theme_colors')
    .eq('shop_slug', shop_slug)
    .single();

  // 404 for unknown shop slugs (strict tenant isolation)
  if (!branding) {
    notFound();
  }

  const shopName = branding.shop_name;

  return (
    <div className="bg-slate-50 font-sans text-slate-900 min-h-screen">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm shadow-blue-900/5 flex justify-between items-center px-8 py-3">
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
          <div className="hidden md:flex gap-6 items-center">
            <a className="text-sm font-semibold text-blue-600 border-b-2 border-blue-600 pb-0.5" href="#">Services</a>
            <Link className="text-sm text-slate-600 hover:text-blue-500 transition-colors" href={`/${shop_slug}/jobs`}>Sarkari Jobs</Link>
            <a className="text-sm text-slate-600 hover:text-blue-500 transition-colors" href="#">Resources</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/auth/signup?ref=${shop_slug}`} className="text-slate-600 hover:text-blue-600 font-medium text-sm transition-colors">
            Create Account
          </Link>
          <Link
            href={`/auth/login`}
            className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Operator Login
          </Link>
        </div>
      </nav>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[870px] flex items-center justify-center overflow-hidden bg-slate-50">
          <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-slate-500/5 rounded-full blur-3xl opacity-40"></div>
          <div className="container mx-auto px-6 relative z-10 text-center">
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-blue-600 font-medium text-xs tracking-wider uppercase">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              {shopName} — Verified Government Service Partner
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
              The Ultimate Platform for <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">Smart Forms &amp; Exam Prep</span>
            </h1>
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input
                  className="w-full pl-14 pr-32 py-5 bg-white border border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-blue-500/30 shadow-xl shadow-blue-900/5 text-slate-900 placeholder:text-slate-400 outline-none"
                  placeholder="Search for jobs, exam forms, or legal services..."
                  type="text"
                />
                <button className="absolute right-3 top-2.5 bottom-2.5 px-6 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors">
                  Find
                </button>
              </div>
              <p className="mt-4 text-slate-400 text-sm">Popular: UPSC Registration, Affidavit Drafts, SSC Calendar 2025</p>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href={`/${shop_slug}/jobs`} className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined">work</span>
                Browse Sarkari Jobs
              </Link>
              <Link href={`/auth/signup?ref=${shop_slug}`} className="bg-white text-slate-700 px-8 py-4 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-2">
                <span className="material-symbols-outlined">person_add</span>
                Create Free Account
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
