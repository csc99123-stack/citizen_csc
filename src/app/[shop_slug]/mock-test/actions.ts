'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { deductWallet } from '@/lib/wallet';

const TEST_UNLOCK_COST = 10;

export async function purchaseMockTestAction(
  shop_slug: string,
  test_id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Auth required.' };

  try {
    // 1. Deduct wallet
    await deductWallet(
      user.id,
      TEST_UNLOCK_COST,
      'service_deduction',
      `MOCKTEST-${test_id}`
    );

    // 2. Track access in a custom metadata or transaction history
    // For this MVP, if the deduction succeeded with this reference, we grant access.
    // In a real app, you'd insert into a 'user_unlocked_tests' table.
    
    revalidatePath(`/${shop_slug}/mock-test`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Purchase failed.' };
  }
}
