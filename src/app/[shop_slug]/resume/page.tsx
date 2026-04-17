import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import ResumeForm from './components/ResumeForm';
import { ToolLayout } from '@/components/ToolLayout';

interface PageProps {
  params: Promise<{ shop_slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { shop_slug } = await params;
  return {
    title: `Resume Builder | ${shop_slug.toUpperCase()}`,
    description: 'Build a professional resume tailored for Indian Sarkari Exam standards.',
  };
}

export default async function ResumeBuilder({ params }: PageProps) {
  const { shop_slug } = await params;
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  // 1. Auth Gate
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/auth/login');
  }

  // 2. Fetch User Data (Wallet Balance)
  const { data: userData } = await supabase
    .from('users')
    .select('wallet_balance')
    .eq('id', user.id)
    .single();

  // 3. Fetch Tenant Branding
  const { data: branding } = await supabaseAdmin
    .from('tenant_branding')
    .select('shop_name')
    .eq('shop_slug', shop_slug)
    .single();

  if (!branding) {
    notFound();
  }

  return (
    <ToolLayout
      shopSlug={shop_slug}
      userEmail={user?.email ?? undefined}
      toolName="Smart Resume Builder"
      toolSubtext="Sarkari Exam Standard"
      walletBalance={userData?.wallet_balance ?? 0}
      costPerDoc={10}
    >
      <ResumeForm shop_slug={shop_slug} initialBalance={userData?.wallet_balance ?? 0} />
    </ToolLayout>
  );
}
