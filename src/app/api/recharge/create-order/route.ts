import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Lazily require Razorpay to avoid issues if the package isn't installed
let Razorpay: typeof import('razorpay') | null = null;
try {
  Razorpay = require('razorpay');
} catch {
  Razorpay = null;
}

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();

    // Validate amount (min ₹100, max ₹50,000)
    if (!amount || typeof amount !== 'number' || amount < 100 || amount > 50000) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be between ₹100 and ₹50,000.' },
        { status: 400 }
      );
    }

    // Require authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Razorpay order
    if (!Razorpay) {
      // Return a mock order for development when razorpay package isn't installed
      return NextResponse.json({
        order_id: `order_mock_${Date.now()}`,
        amount: amount * 100, // in paise
        currency: 'INR',
        key_id: process.env.RAZORPAY_KEY_ID,
        user_id: user.id,
        prefill: { email: user.email },
        notes: { user_id: user.id, purpose: 'wallet_recharge' },
      });
    }

    const razorpay = new (Razorpay as any)({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `recharge_${user.id}_${Date.now()}`,
      notes: {
        user_id: user.id,
        purpose: 'wallet_recharge',
      },
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
      user_id: user.id,
      prefill: { email: user.email },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create order';
    console.error('[recharge/create-order]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
