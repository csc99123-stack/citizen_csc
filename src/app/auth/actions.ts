'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// ─── Login ────────────────────────────────────────────────────────────────────
export async function loginAction(formData: FormData) {
  console.log('[AUTH_ACTION] loginAction called');
  console.log('[AUTH_ACTION] NEXT_PUBLIC_TEST_MODE:', process.env.NEXT_PUBLIC_TEST_MODE);
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`);
  }

  // Get the operator's shop_slug for redirect
  const supabaseAdmin = createAdminClient();
  const { data: branding } = await supabaseAdmin
    .from('tenant_branding')
    .select('shop_slug')
    .eq('tenant_id', data.user.id)
    .single();

  revalidatePath('/');

  if (branding?.shop_slug) {
    redirect(`/${branding.shop_slug}/dashboard`);
  } else {
    // Fallback for B2C users or admins without branding
    redirect('/admin');
  }
}

// ─── Signup (B2C with optional affiliate attribution) ────────────────────────
export async function signupAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;
  const refShopSlug = formData.get('ref') as string | null;

  if (!email || !password || !fullName) {
    return { error: 'All fields are required.' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  // Resolve referred_by_tenant_id from the shop_slug ref param
  let referredByTenantId: string | null = null;
  if (refShopSlug) {
    const { data: branding } = await supabaseAdmin
      .from('tenant_branding')
      .select('tenant_id')
      .eq('shop_slug', refShopSlug)
      .single();

    referredByTenantId = branding?.tenant_id ?? null;
  }

  // 1. Create Supabase Auth user
  const { data: authData, error: signupError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `http://localhost:3000/auth/callback`,
      data: { full_name: fullName },
    },
  });

  if (signupError) {
    return { error: signupError.message };
  }

  if (!authData.user) {
    return { error: 'Signup failed. Please try again.' };
  }

  // 2. Insert into public users table with role + referred_by_tenant_id
  const { error: insertError } = await supabaseAdmin.from('users').insert({
    id: authData.user.id,
    role: 'b2c_user',
    wallet_balance: 0,
    referred_by_tenant_id: referredByTenantId,
  });

  if (insertError && !insertError.message.includes('duplicate')) {
    console.error('[signup] users insert error:', insertError.message);
  }

  return redirect('/auth/signup?success=' + encodeURIComponent('Account created! Please check your email to confirm your signup.'));
}

// ─── Operator Signup (B2B) ────────────────────────────────────────────────────
export async function operatorSignupAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const shopName = formData.get('shop_name') as string;
  const shopSlug = formData.get('shop_slug') as string;

  if (!email || !password || !shopName || !shopSlug) {
    return { error: 'All fields are required.' };
  }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(shopSlug)) {
    return { error: 'Shop slug may only contain lowercase letters, numbers, and hyphens.' };
  }

  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  // Check slug uniqueness
  const { data: existingSlug } = await supabaseAdmin
    .from('tenant_branding')
    .select('shop_slug')
    .eq('shop_slug', shopSlug)
    .single();

  if (existingSlug) {
    return { error: `The shop slug "${shopSlug}" is already taken. Please choose another.` };
  }

  // Create auth user
  const { data: authData, error: signupError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `http://localhost:3000/auth/callback`,
    },
  });

  if (signupError) return { error: signupError.message };
  if (!authData.user) return { error: 'Signup failed.' };

  const userId = authData.user.id;

  // Insert operator into users table
  await supabaseAdmin.from('users').insert({
    id: userId,
    role: 'b2b_operator',
    wallet_balance: 0,
    referred_by_tenant_id: null,
  });

  // Insert tenant branding
  await supabaseAdmin.from('tenant_branding').insert({
    tenant_id: userId,
    shop_slug: shopSlug,
    shop_name: shopName,
    logo_url: null,
    theme_colors: { primary: '#2563eb', secondary: '#1e3a8a' },
  });

  return redirect('/auth/signup?success=' + encodeURIComponent(`Operator account created for "${shopName}"! Check your email to confirm, then log in.`));
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/');
  redirect('/');
}
