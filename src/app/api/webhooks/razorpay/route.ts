import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { creditWallet } from '@/lib/wallet';

// Verify Razorpay webhook HMAC signature
function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('x-razorpay-signature') ?? '';
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    console.error('[webhook] RAZORPAY_KEY_SECRET not set');
    return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
  }

  // ── Step 1: Verify signature ──────────────────────────────────────────────
  if (!verifySignature(body, signature, secret)) {
    console.warn('[webhook] Invalid Razorpay signature — rejecting request');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const payload = JSON.parse(body);
  const event: string = payload.event;
  const paymentEntity = payload?.payload?.payment?.entity;

  console.log(`[webhook] Received event: ${event}`);

  const supabase = createAdminClient();

  try {
    // ── Step 2: Handle payment.captured ─────────────────────────────────────
    if (event === 'payment.captured' && paymentEntity) {
      const razorpayPaymentId: string = paymentEntity.id;
      const amountRs: number = paymentEntity.amount / 100; // Razorpay sends paise
      const notes = paymentEntity.notes ?? {};
      const userId: string | undefined = notes.user_id;
      const purpose: string = notes.purpose ?? 'wallet_recharge';

      if (!userId) {
        console.warn('[webhook] payment.captured missing user_id in notes — skipping');
        return NextResponse.json({ status: 'skipped', reason: 'no user_id in notes' });
      }

      if (purpose === 'wallet_recharge') {
        // ── Direct wallet top-up for the paying operator ───────────────────
        await creditWallet(userId, amountRs, 'recharge', razorpayPaymentId);
        console.log(`[webhook] ✅ Wallet recharged for user ${userId}: +₹${amountRs} (payment: ${razorpayPaymentId})`);

      } else if (purpose === 'subscription') {
        // ── Subscription purchase flow ─────────────────────────────────────
        const planId: string | undefined = notes.plan_id;

        // Fetch plan for validity
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('validity_months, price')
          .eq('id', planId)
          .single();

        if (plan) {
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + plan.validity_months);

          await supabase.from('user_subscriptions').insert({
            user_id: userId,
            plan_id: planId,
            expires_at: expiresAt.toISOString(),
            is_active: true,
            razorpay_payment_id: razorpayPaymentId,
          });

          // ── Affiliate commission split ─────────────────────────────────
          const { data: user } = await supabase
            .from('users')
            .select('referred_by_tenant_id')
            .eq('id', userId)
            .single();

          if (user?.referred_by_tenant_id) {
            const commissionAmount = plan.price * 0.20; // 20% commission
            await creditWallet(
              user.referred_by_tenant_id,
              commissionAmount,
              'affiliate_commission',
              razorpayPaymentId
            );
            console.log(`[webhook] 💰 Commission ₹${commissionAmount} credited to tenant ${user.referred_by_tenant_id}`);
          }
        }
        console.log(`[webhook] ✅ Subscription activated for user ${userId}`);
      }
    }

    // ── Step 3: Handle payment.failed ────────────────────────────────────────
    if (event === 'payment.failed' && paymentEntity) {
      console.warn(`[webhook] ⚠️ Payment failed: ${paymentEntity.id} — error: ${paymentEntity.error_description}`);
      // No action needed; wallet was never credited
    }

    return NextResponse.json({ status: 'success', event });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[webhook] Processing error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
