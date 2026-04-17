'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { deductWallet } from '@/lib/wallet';

const PASSPORT_SHEET_COST_RS = 10;

export async function deductForPassportAction(
  shop_slug: string,
  referenceId: string
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  // 1. Authenticate
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Authentication required.' };
  }

  // 2. Deduct wallet
  try {
    const result = await deductWallet(
      user.id,
      PASSPORT_SHEET_COST_RS,
      'service_deduction',
      `PASSPORT-${referenceId}`
    );

    // 3. Revalidate paths to update UI balance
    revalidatePath(`/${shop_slug}`);
    revalidatePath(`/${shop_slug}/dashboard`);

    return { 
      success: true, 
      newBalance: result.newBalance 
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Wallet deduction failed';
    return { 
      success: false, 
      error: errorMessage.includes('Insufficient') 
        ? `Insufficient balance (₹${PASSPORT_SHEET_COST_RS} required).` 
        : errorMessage 
    };
  }
}
