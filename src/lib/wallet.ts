import { createAdminClient } from '@/lib/supabase/admin';
import { TransactionType } from '@/lib/types';

/**
 * Shared wallet deduction utility.
 * Uses decrement_wallet RPC (atomic, row-locked) to safely debit the user's
 * wallet balance, then records a service_deduction transaction.
 *
 * Throws an error if balance is insufficient or RPC fails.
 */
export async function deductWallet(
  userId: string,
  amount: number,
  transactionType: TransactionType = 'service_deduction',
  referenceId: string
): Promise<{ newBalance: number }> {
  const supabase = createAdminClient();

  if (process.env.NEXT_PUBLIC_TEST_MODE === 'true') {
     console.log(`[MOCK_WALLET] Deducting ₹${amount} for ${userId}`);
     return { newBalance: 90 }; // Mock some balance after deduction
  }

  // 1. Atomic decrement via RPC (includes balance check + row lock)
  const { error: rpcError } = await supabase.rpc('decrement_wallet', {
    _user_id: userId,
    _amount: amount,
  });

  if (rpcError) {
    // Supabase RPC raises an exception whose message we surface
    throw new Error(rpcError.message || 'Wallet deduction failed');
  }

  // 2. Record the transaction
  const { error: txError } = await supabase.from('wallet_transactions').insert({
    user_id: userId,
    amount: -amount, // negative = debit
    transaction_type: transactionType,
    reference_id: referenceId,
  });

  if (txError) {
    // Non-fatal — balance was already deducted; log and continue
    console.error('[wallet] Transaction record failed:', txError.message);
  }

  // 3. Return the fresh balance
  const { data: user } = await supabase
    .from('users')
    .select('wallet_balance')
    .eq('id', userId)
    .single();

  return { newBalance: user?.wallet_balance ?? 0 };
}

/**
 * Credit a wallet (for commissions and recharges).
 */
export async function creditWallet(
  userId: string,
  amount: number,
  transactionType: TransactionType = 'affiliate_commission',
  referenceId: string
): Promise<void> {
  const supabase = createAdminClient();

  const { error: rpcError } = await supabase.rpc('increment_wallet', {
    _user_id: userId,
    _amount: amount,
  });

  if (rpcError) throw new Error(rpcError.message);

  await supabase.from('wallet_transactions').insert({
    user_id: userId,
    amount: amount, // positive = credit
    transaction_type: transactionType,
    reference_id: referenceId,
  });
}
