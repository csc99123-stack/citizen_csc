# Skill: Razorpay Commission Expert

## Purpose
Instructs the agent on how to correctly and robustly implement a Razorpay webhook route that computes an affiliate commission dynamically, calculates split percentages, and updates Supabase wallet balances securely.

## Guidelines & Architecture Walkthrough

### 1. Webhook Setup
- **Endpoint:** Expose a Next.js App Router POST route (e.g., `/api/webhooks/razorpay`).
- **Verification:** Import `crypto` to create an HMAC SHA256 signature using the `RAZORPAY_WEBHOOK_SECRET`. Compare this explicitly with the `x-razorpay-signature` header to validate incoming authenticity. If failed, violently reject with `401 Unauthorized`.

### 2. Event Processing
- Target specific events such as `payment.captured` or `order.paid`.
- Acknowledge Razorpay immediately (`res.status(200)`) to prevent webhook retry timeouts while handling logic asynchronously, OR ensure your processing handles it within a 2-second limit.

### 3. Business Logic: 20% Commission Rule
- **Payload Extraction:** Retrieve the `metadata.referred_by_tenant_id` or similar reference IDs mapped during order creation. Extract the `amount` (remember, Razorpay amounts are historically mapped in passing paise, strictly cast it to INR integers or floats safely).
- **Calculation:** Compute `commission = amount * 0.20`. 

### 4. Supabase Secure Write (Critical)
- **Service Role Bypass:** Because this runs server-side on a public/webhook endpoint, you must instantiate the Supabase client using the `SUPABASE_SERVICE_ROLE_KEY` to securely bypass RLS and alter user wallets directly.
- **Transaction Flow:** 
  1. Add `commission` amount to the `users` table's `wallet_balance` where `id == referred_by_tenant_id`.
  2. Instantiate a `wallet_transactions` record for transparency, logging `transaction_type: 'affiliate_commission'`, the user's ID, payment's unique ID, and the exact timestamp.
- **Error Handling:** If any DB step crashes, ensure comprehensive logging for manual reconciliation.
