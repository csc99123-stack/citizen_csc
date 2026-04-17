# Deployment Guide: SmartForms & Sarkari Exams Platform

This guide provides step-by-step instructions to deploy the SmartForms SaaS platform to production using **Supabase**, **Vercel**, and **Razorpay**.

---

## 1. Supabase Setup (Database & Auth)

### 1.1 Create Project
- Create a new project at [database.new](https://database.new).
- Note down your **Project URL** and **Service Role Key** from `Project Settings > API`.

### 1.2 Run Migrations
1. Navigate to the **SQL Editor** in the Supabase Dashboard.
2. Execute the contents of the following files in order:
   - `supabase/migrations/00001_initial_schema.sql`
   - `supabase/migrations/00002_rpc_and_govtposts.sql`
3. Execute `supabase/seed.sql` to populate default templates and mock tests.

### 1.3 Authentication Configuration
- Enable **Email Auth** in `Authentication > Providers`.
- Disable "Confirm Email" for faster operator onboarding (optional, based on security needs).

---

## 2. Vercel Deployment (Frontend)

### 2.1 Import Project
- Connect your GitHub repository to Vercel.
- Select the `citizen-csc` project name (as specified).

### 2.2 Environment Variables
Add the following keys in Vercel `Project Settings > Environment Variables`:

| Key | Value | Description |
|-----|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-id.supabase.co` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` | Found in Supabase API settings |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key` | **CRITICAL:** Keep secret. Used for admin tasks. |
| `GEMINI_API_KEY` | `your-google-gemini-key` | Get from [Google AI Studio](https://aistudio.google.com/) |
| `RAZORPAY_KEY_ID` | `rzp_live_...` | From Razorpay Dashboard |
| `RAZORPAY_KEY_SECRET` | `...` | From Razorpay Dashboard |
| `NEXT_PUBLIC_TEST_MODE` | `false` | Must be `false` for production |

### 2.3 Deploy
- Click **Deploy**. Vercel will build the Next.js app using its Linux environment (bypassing local Windows quirks).

---

## 3. Razorpay Configuration

### 3.1 Webhook Setup
To enable wallet recharges and commission splitting, configure a webhook:
1. Go to `Razorpay Dashboard > Settings > Webhooks`.
2. Add New Webhook:
   - **URL**: `https://your-vercel-domain.com/api/webhooks/razorpay`
   - **Secret**: Use the same `RAZORPAY_KEY_SECRET` defined in Vercel.
   - **Active Events**: `payment.captured`, `payment.failed`.

### 3.2 Razorpay Route (Affiliate Splits)
- Ensure your Razorpay account has **Route** enabled to support the 20% / 80% commission logic described in the PRD.

---

## 4. Post-Deployment Verification

### 4.1 Create Admin User
After signing up via the UI, elevate your user to Admin in the Supabase SQL Editor:
```sql
UPDATE users SET role = 'admin' WHERE id = 'YOUR_USER_UUID';
```

### 4.2 Smoke Test Workflows
- **Auth**: Sign up as a new operator.
- **Branding**: Update shop logo and slug in the dashboard.
- **Tools**: Generate an AI MRO Letter (requires Gemini API).
- **Wallet**: Verify ₹10 deduction upon resume/affidavit generation.

---

> [!IMPORTANT]
> Always ensure `NEXT_PUBLIC_TEST_MODE` is `false` in production to prevent bypass of real Supabase Auth and Database logic.
