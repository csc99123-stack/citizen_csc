import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Admin client using the Service Role key.
 * BYPASSES Row Level Security — use ONLY in:
 *   - Trusted Server Actions after verifying user identity
 *   - API Route Handlers (webhook processing)
 *   - Admin-gated operations
 *
 * NEVER expose this on the client side.
 */
export function createAdminClient() {
  // ── MOCK MODE for Testing ───────────────────────────────────────────────────
  if (process.env.NEXT_PUBLIC_TEST_MODE?.trim() === 'true') {
    const mockChain = {
      select: () => mockChain,
      eq: () => mockChain,
      order: () => mockChain,
      single: async () => {
        return { data: { shop_name: 'Test Shop', shop_slug: 'tester', tenant_id: 'test-user-id', wallet_balance: 100, role: 'b2b_operator' }, error: null };
      },
      then: (fn: any) => Promise.resolve({ data: [], error: null }).then(fn),
      data: [],
      error: null
    };

    return {
      from: (table: string) => mockChain,
      auth: {
        getUser: async () => ({ data: { user: { id: 'test-user-id' } }, error: null })
      }
    } as any;
  }
  // ─────────────────────────────────────────────────────────────────────────────

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase admin credentials. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
