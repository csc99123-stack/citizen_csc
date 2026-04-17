import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  const email = 'tester@example.com';
  const password = 'Password123!';
  const shopSlug = 'tester';
  const shopName = 'Test Shop';

  console.log(`[seed] Creating confirmed user: ${email}...`);

  // 1. Create Auth User
  const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Test Operator' }
  });

  if (authError && !authError.message.includes('already registered')) {
    console.error('[seed] Auth error:', authError.message);
    return;
  }

  const userId = user?.id || (await supabase.from('users').select('id').eq('email', email).single()).data?.id;

  if (!userId) {
     const { data: existingUser } = await supabase.auth.admin.listUsers();
     const foundUser = existingUser.users.find(u => u.email === email);
     if (!foundUser) {
        console.error('[seed] User not found after creation attempt.');
        return;
     }
     // userId = foundUser.id; // Let's simplify
  }

  const targetUserId = userId; // Handle re-run case

  console.log(`[seed] User ID: ${targetUserId}. Setting up DB records...`);

  // 2. Ensure users record exists
  const { error: userError } = await supabase.from('users').upsert({
    id: targetUserId,
    role: 'b2b_operator',
    wallet_balance: 100, // Pre-funded for testing
  });
  if (userError) console.error('[seed] Users error:', userError.message);

  // 3. Ensure branding exists
  const { error: brandingError } = await supabase.from('tenant_branding').upsert({
    tenant_id: targetUserId,
    shop_slug: shopSlug,
    shop_name: shopName,
    theme_colors: { primary: '#2562eb', secondary: '#1e3a8a' }
  });
  if (brandingError) console.error('[seed] Branding error:', brandingError.message);

  console.log('[seed] Done! You can now login with tester@example.com / Password123!');
}

main();
