'use client';

import { useState } from 'react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RechargeButtonProps {
  shopSlug: string;
}

export function RechargeButton({ shopSlug }: RechargeButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecharge = async () => {
    setIsPending(true);
    setError(null);

    try {
      // 1. Create order on our backend
      const res = await fetch('/api/recharge/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 500 }), // Default recharge amount ₹500
      });

      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error || 'Failed to initialize payment');

      // 2. Open Razorpay Checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Magistrate OS - SmartForms',
        description: 'Wallet Top-up',
        order_id: orderData.order_id,
        prefill: orderData.prefill,
        theme: { color: '#2563eb' },
        handler: function (response: any) {
          // In a real app, you'd verify the payment on the server here too,
          // but our webhook will handle the wallet credit asynchronously.
          window.location.reload(); // Refresh to see new balance
        },
        modal: {
          ondismiss: function () {
            setIsPending(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setError(err.message);
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        id="recharge-btn"
        onClick={handleRecharge}
        disabled={isPending}
        className="bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            Initializing...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined">bolt</span>
            Recharge via Razorpay (₹500)
          </>
        )}
      </button>
      {error && <p className="text-xs text-red-500 font-medium px-2">{error}</p>}
    </div>
  );
}
