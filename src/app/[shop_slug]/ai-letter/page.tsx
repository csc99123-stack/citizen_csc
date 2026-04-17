import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { LetterForm } from './components/LetterForm';
import { ToolLayout } from '@/components/ToolLayout';

export const metadata: Metadata = {
  title: 'AI Letter Assistant | Magistrate OS - SmartForms',
  description: 'Generate professional, legally compliant letters in seconds using our Gemini AI engine. Supports English, Telugu, and Hindi.',
};

interface PageProps {
  params: Promise<{ shop_slug: string }>;
}

export default async function AiLetterPage({ params }: PageProps) {
  const { shop_slug } = await params;
  const supabase = await createClient();

  // Fetch live wallet balance for logged-in operator
  const { data: { user } } = await supabase.auth.getUser();
  let walletBalance = 0;

  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', user.id)
      .single();
    walletBalance = userData?.wallet_balance ?? 0;
  }

  return (
    <ToolLayout
      shopSlug={shop_slug}
      userEmail={user?.email ?? undefined}
      toolName="AI Letter Assistant"
      toolSubtext="Gemini 2.0 Flash"
      walletBalance={walletBalance}
      costPerDoc={10}
    >
      <LetterForm shopSlug={shop_slug} walletBalance={walletBalance} />
    </ToolLayout>
  );
}
