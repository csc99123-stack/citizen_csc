import { createBrowserClient } from '@supabase/ssr';

/**
 * Singleton Supabase browser client for Client Components.
 * Uses the public anon key — respects Row Level Security.
 */
export function createClient() {
  // ── MOCK MODE for Testing ───────────────────────────────────────────────────
  if (process.env.NEXT_PUBLIC_TEST_MODE === 'true') {
     return {
       auth: {
         getUser: async () => ({ data: { user: { id: 'test-user-id', email: 'tester@example.com' } }, error: null }),
         getSession: async () => ({ data: { session: { user: { id: 'test-user-id' }, expires_at: 9999999999 } }, error: null }),
         onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
         signInWithPassword: async () => ({ data: { user: { id: 'test-user-id' } }, error: null }),
         signOut: async () => ({ error: null }),
       },
       from: (table: string) => ({
         select: (columns: string) => ({
           eq: (col: string, val: any) => ({
             single: async () => {
               if (table === 'users') return { data: { id: 'test-user-id', wallet_balance: 100, role: 'b2b_operator' }, error: null };
               if (table === 'tenant_branding') return { data: { shop_name: 'Test Shop', shop_slug: 'tester' }, error: null };
               return { data: null, error: null };
             }
           })
         })
       })
     } as any;
  }
  // ─────────────────────────────────────────────────────────────────────────────

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
