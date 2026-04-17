// Shared TypeScript types matching the Supabase PostgreSQL schema

export type UserRole = 'admin' | 'b2b_operator' | 'b2c_user';
export type TransactionType = 'recharge' | 'service_deduction' | 'affiliate_commission';
export type PostCategory = 'job' | 'result' | 'admit_card';

export interface User {
  id: string;
  role: UserRole;
  wallet_balance: number;
  referred_by_tenant_id: string | null;
  created_at: string;
}

export interface TenantBranding {
  tenant_id: string;
  shop_slug: string;
  logo_url: string | null;
  theme_colors: { primary?: string; secondary?: string } | null;
  shop_name: string;
  created_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: TransactionType;
  reference_id: string | null;
  created_at: string;
}

export interface GovtPost {
  id: string;
  title: string;
  category: PostCategory;
  content_html: string;
  excerpt: string | null;
  organisation: string | null;
  state: string | null;
  total_posts: number | null;
  last_date: string | null;
  is_published: boolean;
  slug: string | null;
  published_at: string | null;
  created_at: string;
}

export interface MockTest {
  id: string;
  title: string;
  duration_minutes: number;
  negative_marking_ratio: number;
  questions_payload: { questions: MockTestQuestion[] } | null;
  created_at: string;
}

export interface MockTestQuestion {
  id: number;
  subject: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  validity_months: number;
  price: number;
  features: string[] | null;
  is_active: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  started_at: string;
  expires_at: string | null;
  is_active: boolean;
  razorpay_payment_id: string | null;
}

export interface TenantStats {
  tenant_id: string;
  shop_name: string;
  shop_slug: string;
  wallet_balance: number;
  total_commissions: number;
  user_count: number;
}

// Server Action result types
export interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface GenerateLetterResult {
  success: boolean;
  letter?: string;
  newBalance?: number;
  error?: string;
}

export interface RefineLetterResult {
  success: boolean;
  letter?: string;
  error?: string;
}
