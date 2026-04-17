'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { PostCategory } from '@/lib/types';

// ── Verify the caller is an admin ─────────────────────────────────────────────
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: userData } = await supabase
    .from('users').select('role').eq('id', user.id).single();
  if (userData?.role !== 'admin') throw new Error('Forbidden: Admin only');

  return user;
}

// ── Create / Publish a govt_post ──────────────────────────────────────────────
export async function createPostAction(formData: FormData) {
  await requireAdmin();

  const title = formData.get('title') as string;
  const category = formData.get('category') as PostCategory;
  const content_html = formData.get('content_html') as string;
  const excerpt = formData.get('excerpt') as string;
  const organisation = formData.get('organisation') as string;
  const state = formData.get('state') as string;
  const total_posts = formData.get('total_posts') ? Number(formData.get('total_posts')) : null;
  const last_date = formData.get('last_date') as string | null;
  const is_published = formData.get('is_published') === 'true';
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);

  const supabase = createAdminClient();
  const { error } = await supabase.from('govt_posts').insert({
    title, category, content_html, excerpt, organisation, state,
    total_posts, last_date, is_published, slug,
    published_at: is_published ? new Date().toISOString() : null,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath('/admin');
  return { success: true };
}

// ── Toggle publish status ─────────────────────────────────────────────────────
export async function togglePublishAction(postId: string, currentStatus: boolean) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('govt_posts')
    .update({
      is_published: !currentStatus,
      published_at: !currentStatus ? new Date().toISOString() : null,
    })
    .eq('id', postId);

  if (error) return { success: false, error: error.message };
  revalidatePath('/admin');
  return { success: true };
}

// ── Delete a post ─────────────────────────────────────────────────────────────
export async function deletePostAction(postId: string) {
  await requireAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from('govt_posts').delete().eq('id', postId);
  if (error) return { success: false, error: error.message };
  revalidatePath('/admin');
  return { success: true };
}
