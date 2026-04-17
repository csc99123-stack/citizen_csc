import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for use in Server Components, Server Actions,
 * and Route Handlers. Uses cookie-based session management via @supabase/ssr.
 * This client respects Row Level Security — it acts as the logged-in user.
 */
export async function createClient() {
  const cookieStore = await cookies();

  console.log('[SUPABASE_SERVER] NEXT_PUBLIC_TEST_MODE:', process.env.NEXT_PUBLIC_TEST_MODE);
  if (process.env.NEXT_PUBLIC_TEST_MODE?.trim() === 'true') {
    console.log('[SUPABASE_SERVER] Mock Mode Active');
     return {
       auth: {
         getUser: async () => ({ data: { user: { id: 'test-user-id', email: 'tester@example.com' } }, error: null }),
         getSession: async () => ({ data: { session: { user: { id: 'test-user-id' } } }, error: null }),
         signInWithPassword: async () => ({ data: { user: { id: 'test-user-id' } }, error: null }),
         signUp: async () => ({ data: { user: { id: 'test-user-id' } }, error: null }),
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
           }),
           order: (col: string, opts: any) => ({
             limit: (val: number) => ({
               then: (fn: any) => Promise.resolve({ data: [], error: null }).then(fn),
               data: [],
               error: null
             }),
             data: [],
             error: null
           }),
           limit: (val: number) => ({
             data: [],
             error: null
           })
         })
       })
     } as any;
  }
  // ─────────────────────────────────────────────────────────────────────────────

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — safe to ignore.
            // Middleware handles refreshing the session cookie.
          }
        },
      },
    }
  );
}
