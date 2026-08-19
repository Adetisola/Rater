'use server';

/**
 * Server-Side Admin Domain Actions
 *
 * All privileged mutations and sensitive administrative operations live here.
 * Every administrative function strictly validates the caller's server session
 * and verifies `is_admin = true` against the database before executing with
 * the Supabase Service Role client.
 */

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type { 
  AdminDashboardStats, 
  Avatar, 
  Post, 
  Report, 
  PlatformSetting 
} from '@/types';
import { deleteAsset } from '@/lib/cloudinary/service';
import { extractPublicId } from '@/lib/cloudinary/transforms';

// ─── Infrastructure Helpers ───────────────────────────────────────────────────

/**
 * Creates an authenticated Supabase server client bound to the current request's cookies.
 */
async function createRequestSupabase() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Can happen in Server Components / Actions where response is already streaming
          }
        },
      },
    }
  );
}

/**
 * Creates an elevated Supabase client with the Service Role key.
 * Used ONLY after explicit admin session verification.
 */
function getAdminSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured.');
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

/**
 * Verifies that the current request is authenticated and belongs to an administrator.
 * Throws an Error if unauthorized.
 */
export async function verifyAdminSession(): Promise<{ user: any; profile: Avatar }> {
  const supabase = await createRequestSupabase();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized: Authentication required.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, email, show_email, name, role, avatar_url, bg_color, is_admin, bio, is_blocked, created_at, username_last_changed_at, previous_usernames, social_links, onboarding_completed')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.is_admin) {
    throw new Error('Forbidden: Administrator privileges required.');
  }

  return { user, profile: profile as unknown as Avatar };
}

/**
 * Helper to record actions in the immutable audit log table.
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details: Record<string, any> = {}
) {
  try {
    const adminSupabase = getAdminSupabase();
    await adminSupabase.from('admin_audit_logs').insert({
      admin_id: adminId,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
    });
  } catch (err) {
    console.error('Failed to write admin audit log:', err);
  }
}

// ─── Dashboard Overview Actions ───────────────────────────────────────────────

/**
 * Fetches aggregated stats and velocity metrics for the Admin Dashboard.
 */
export async function getDashboardStats(): Promise<AdminDashboardStats> {
  await verifyAdminSession();
  const adminSupabase = getAdminSupabase();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Run aggregation queries in parallel
  const [
    profilesCountRes,
    postsCountRes,
    reviewsCountRes,
    viewsCountRes,
    pendingReportsRes,
    activeFeedbackRes,
    profiles7dRes,
    posts7dRes,
    reviews7dRes,
    recentPostsRes,
    recentReportsRes,
    recentFeedbackRes,
  ] = await Promise.all([
    adminSupabase.from('profiles').select('*', { count: 'exact', head: true }),
    adminSupabase.from('posts').select('*', { count: 'exact', head: true }),
    adminSupabase.from('reviews').select('*', { count: 'exact', head: true }),
    adminSupabase.from('post_views').select('*', { count: 'exact', head: true }),
    adminSupabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    adminSupabase.from('feedback_requests').select('*', { count: 'exact', head: true }).neq('status', 'Completed'),
    adminSupabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    adminSupabase.from('posts').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    adminSupabase.from('reviews').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
    adminSupabase.from('posts').select('id, title, category, created_at, avatar_id').order('created_at', { ascending: false }).limit(5),
    adminSupabase.from('reports').select('id, reason, target_type, target_id, status, created_at').order('created_at', { ascending: false }).limit(5),
    adminSupabase.from('feedback_requests').select('id, title, status, category, created_at').order('created_at', { ascending: false }).limit(5),
  ]);

  // Merge recent activity items
  const recentActivity: AdminDashboardStats['recentActivity'] = [];

  recentPostsRes.data?.forEach(post => {
    recentActivity.push({
      id: post.id,
      type: 'post',
      title: post.title || 'Untitled Post',
      subtitle: `New ${post.category || 'design'} uploaded`,
      timestamp: post.created_at || new Date().toISOString(),
      link: `/post/${post.id}`,
    });
  });

  recentReportsRes.data?.forEach(report => {
    recentActivity.push({
      id: report.id,
      type: 'report',
      title: `Reported ${report.target_type}: ${report.reason}`,
      subtitle: `Status: ${report.status}`,
      timestamp: report.created_at,
      link: '/admin/reports',
      status: report.status,
    });
  });

  recentFeedbackRes.data?.forEach(fb => {
    recentActivity.push({
      id: fb.id,
      type: 'feedback',
      title: fb.title,
      subtitle: `Feedback (${fb.category})`,
      timestamp: fb.created_at,
      link: '/admin/feedback',
      status: fb.status,
    });
  });

  // Sort unified activity by newest first
  recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    totalProfiles: profilesCountRes.count || 0,
    totalPosts: postsCountRes.count || 0,
    totalReviews: reviewsCountRes.count || 0,
    totalViews: viewsCountRes.count || 0,
    pendingReports: pendingReportsRes.count || 0,
    activeFeedback: activeFeedbackRes.count || 0,
    profilesLast7Days: profiles7dRes.count || 0,
    postsLast7Days: posts7dRes.count || 0,
    reviewsLast7Days: reviews7dRes.count || 0,
    recentActivity: recentActivity.slice(0, 10),
  };
}

// ─── User / Profile Moderation Actions ────────────────────────────────────────

export interface GetAdminUsersParams {
  search?: string;
  status?: 'all' | 'active' | 'blocked' | 'admin';
  page?: number;
  limit?: number;
}

export async function getAdminUsers(params: GetAdminUsersParams = {}) {
  await verifyAdminSession();
  const adminSupabase = getAdminSupabase();

  const { search = '', status = 'all', page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  let query = adminSupabase
    .from('profiles')
    .select('id, username, email, show_email, name, role, avatar_url, bg_color, is_admin, bio, is_blocked, created_at, username_last_changed_at, previous_usernames, social_links, onboarding_completed', { count: 'exact' });

  if (search.trim()) {
    const s = search.trim();
    query = query.or(`username.ilike.%${s}%,name.ilike.%${s}%,email.ilike.%${s}%`);
  }

  if (status === 'blocked') {
    query = query.eq('is_blocked', true);
  } else if (status === 'active') {
    query = query.eq('is_blocked', false);
  } else if (status === 'admin') {
    query = query.eq('is_admin', true);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch profiles: ${error.message}`);
  }

  return {
    users: (data || []) as unknown as Avatar[],
    totalCount: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

export async function updateUserModeration(
  userId: string,
  updates: { is_blocked?: boolean; is_admin?: boolean; role?: string | null }
) {
  const { profile: adminProfile } = await verifyAdminSession();
  const adminSupabase = getAdminSupabase();

  // Safety protection: Admin cannot un-admin or block themselves directly
  if (userId === adminProfile.id) {
    if (updates.is_admin === false) {
      throw new Error('You cannot revoke your own administrator privileges.');
    }
    if (updates.is_blocked === true) {
      throw new Error('You cannot block your own account.');
    }
  }

  const { data, error } = await adminSupabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update profile moderation: ${error.message}`);
  }

  // If blocking, force-revoke all active sessions for the user immediately
  if (updates.is_blocked === true) {
    await adminSupabase.auth.admin.signOut(userId, 'global');
  }

  await logAdminAction(adminProfile.id, 'update_user_moderation', 'profile', userId, updates);

  return { ok: true, profile: data as unknown as Avatar };
}

// ─── Post Moderation Actions ──────────────────────────────────────────────────

export interface GetAdminPostsParams {
  search?: string;
  category?: string;
  status?: 'all' | 'active' | 'deleted';
  uses_ai?: boolean;
  page?: number;
  limit?: number;
}

export async function getAdminPosts(params: GetAdminPostsParams = {}) {
  await verifyAdminSession();
  const adminSupabase = getAdminSupabase();

  const { search = '', category, status = 'all', uses_ai, page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  let query = adminSupabase
    .from('posts')
    .select('*, profiles(id, username, name, avatar_url, email)', { count: 'exact' });

  if (search.trim()) {
    const s = search.trim();
    query = query.or(`title.ilike.%${s}%,description.ilike.%${s}%`);
  }

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  if (status === 'deleted') {
    query = query.eq('is_deleted', true);
  } else if (status === 'active') {
    query = query.eq('is_deleted', false);
  }

  if (typeof uses_ai === 'boolean') {
    query = query.eq('uses_ai', uses_ai);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch posts: ${error.message}`);
  }

  const posts: Post[] = (data || []).map((row: any) => {
    const { profiles, ...postData } = row;
    return { ...postData, author: profiles } as unknown as Post;
  });

  return {
    posts,
    totalCount: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

export async function updatePostModeration(
  postId: string,
  updates: { is_deleted?: boolean; category?: string; title?: string }
) {
  const { profile: adminProfile } = await verifyAdminSession();
  const adminSupabase = getAdminSupabase();

  const patchData: any = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  if (updates.is_deleted === true) {
    patchData.deleted_at = new Date().toISOString();
  } else if (updates.is_deleted === false) {
    patchData.deleted_at = null;
  }

  const { data, error } = await adminSupabase
    .from('posts')
    .update(patchData)
    .eq('id', postId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update post: ${error.message}`);
  }

  await logAdminAction(adminProfile.id, 'update_post_moderation', 'post', postId, updates);

  return { ok: true, post: data as unknown as Post };
}

export async function hardDeletePostAdmin(postId: string) {
  const { profile: adminProfile } = await verifyAdminSession();
  const adminSupabase = getAdminSupabase();

  // 1. Fetch post to get image_url / media assets for Cloudinary cleanup
  const { data: post, error: fetchError } = await adminSupabase
    .from('posts')
    .select('id, image_url, media')
    .eq('id', postId)
    .single();

  if (fetchError || !post) {
    throw new Error('Post not found.');
  }

  // 2. Cloudinary Cleanup
  const publicIdsToDestroy = new Set<string>();

  if (post.image_url) {
    const pubId = extractPublicId(post.image_url);
    if (pubId) publicIdsToDestroy.add(pubId);
  }

  if (Array.isArray(post.media)) {
    post.media.forEach((item: any) => {
      if (item?.public_id) {
        publicIdsToDestroy.add(item.public_id);
      } else if (item?.url) {
        const pubId = extractPublicId(item.url);
        if (pubId) publicIdsToDestroy.add(pubId);
      }
    });
  }

  for (const publicId of publicIdsToDestroy) {
    try {
      await deleteAsset(publicId);
    } catch (err) {
      console.warn(`Failed to destroy Cloudinary asset ${publicId}:`, err);
    }
  }

  // 3. Delete dependent relational entries
  await adminSupabase.from('reviews').delete().eq('post_id', postId);
  await adminSupabase.from('post_views').delete().eq('post_id', postId);
  await adminSupabase.from('insight_cache').delete().eq('post_id', postId);
  await adminSupabase.from('badges').delete().eq('post_id', postId);
  await adminSupabase.from('notifications').delete().eq('post_id', postId);
  await adminSupabase.from('reports').delete().eq('target_id', postId);

  // 4. Delete the post row itself
  const { error: deleteError } = await adminSupabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (deleteError) {
    throw new Error(`Failed to hard-delete post: ${deleteError.message}`);
  }

  await logAdminAction(adminProfile.id, 'hard_delete_post', 'post', postId, {
    purgedAssetsCount: publicIdsToDestroy.size,
  });

  return { ok: true };
}

// ─── Reports & Safety Queue Actions ───────────────────────────────────────────

export interface GetReportsParams {
  status?: string;
  target_type?: string;
  page?: number;
  limit?: number;
}

export async function getReports(params: GetReportsParams = {}) {
  await verifyAdminSession();
  const adminSupabase = getAdminSupabase();

  const { status = 'all', target_type = 'all', page = 1, limit = 20 } = params;
  const offset = (page - 1) * limit;

  let query = adminSupabase
    .from('reports')
    .select('*, reporter:profiles!reports_reporter_id_fkey(id, username, name, avatar_url, email)', { count: 'exact' });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (target_type && target_type !== 'all') {
    query = query.eq('target_type', target_type);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch reports: ${error.message}`);
  }

  const reports: Report[] = (data || []).map((row: any) => ({
    ...row,
    reporter: row.reporter || null,
  }));

  // Populate target preview information (posts or user profiles)
  const postIds = reports.filter(r => r.target_type === 'post').map(r => r.target_id);
  const profileIds = reports.filter(r => r.target_type === 'profile').map(r => r.target_id);

  const [postsRes, profilesRes] = await Promise.all([
    postIds.length > 0 
      ? adminSupabase.from('posts').select('*, profiles(id, username, name, avatar_url)').in('id', postIds)
      : Promise.resolve({ data: [] }),
    profileIds.length > 0 
      ? adminSupabase.from('profiles').select('id, username, name, avatar_url, email, is_blocked').in('id', profileIds)
      : Promise.resolve({ data: [] }),
  ]);

  const postMap = new Map((postsRes.data || []).map((p: any) => [
    p.id, 
    { ...p, author: p.profiles } as Post
  ]));
  const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p as Avatar]));

  const enrichedReports: Report[] = reports.map(r => ({
    ...r,
    target_post: r.target_type === 'post' ? postMap.get(r.target_id) || null : null,
    target_profile: r.target_type === 'profile' ? profileMap.get(r.target_id) || null : null,
  }));

  return {
    reports: enrichedReports,
    totalCount: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

export async function updateReportStatus(
  reportId: string,
  updates: {
    status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
    action_taken?: string;
    admin_notes?: string;
  }
) {
  const { profile: adminProfile } = await verifyAdminSession();
  const adminSupabase = getAdminSupabase();

  const { data, error } = await adminSupabase
    .from('reports')
    .update({
      ...updates,
      resolved_by: updates.status === 'resolved' || updates.status === 'dismissed' ? adminProfile.id : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update report: ${error.message}`);
  }

  await logAdminAction(adminProfile.id, 'update_report_status', 'report', reportId, updates);

  return { ok: true, report: data as Report };
}

/**
 * Public action: Creates a safety report for a post or profile.
 * Callable by any authenticated user or anonymous visitor.
 */
export async function createReport(data: {
  target_type: 'post' | 'profile';
  target_id: string;
  reason: string;
  details?: string;
  reporter_id?: string | null;
}) {
  const supabase = await createRequestSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const finalReporterId = user?.id || data.reporter_id || null;

  const adminSupabase = getAdminSupabase();
  const { data: report, error } = await adminSupabase
    .from('reports')
    .insert({
      target_type: data.target_type,
      target_id: data.target_id,
      reason: data.reason,
      details: data.details || null,
      reporter_id: finalReporterId,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to submit report: ${error.message}`);
  }

  return { ok: true, reportId: report.id };
}

// ─── Feedback Management Actions ──────────────────────────────────────────────

export async function updateFeedbackRequest(
  requestId: string,
  updates: {
    status?: string;
    category?: string;
    admin_notes?: string;
    is_pinned?: boolean;
    is_locked?: boolean;
  }
) {
  const { profile: adminProfile } = await verifyAdminSession();
  const adminSupabase = getAdminSupabase();

  const { data, error } = await adminSupabase
    .from('feedback_requests')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update feedback request: ${error.message}`);
  }

  await logAdminAction(adminProfile.id, 'update_feedback', 'feedback', requestId, updates);

  return { ok: true, data };
}

// ─── Platform Settings Actions ────────────────────────────────────────────────

export async function getPlatformSettings(): Promise<PlatformSetting[]> {
  await verifyAdminSession();
  const adminSupabase = getAdminSupabase();

  const { data, error } = await adminSupabase
    .from('platform_settings')
    .select('*')
    .order('key');

  if (error) {
    throw new Error(`Failed to fetch platform settings: ${error.message}`);
  }

  return (data || []).map(row => ({
    key: row.key,
    value: (row.value as Record<string, any>) || {},
    updated_at: row.updated_at,
    updated_by: row.updated_by,
  }));
}

export async function updatePlatformSetting(key: string, value: Record<string, any>) {
  const { profile: adminProfile } = await verifyAdminSession();
  const adminSupabase = getAdminSupabase();

  const { data, error } = await adminSupabase
    .from('platform_settings')
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
      updated_by: adminProfile.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update setting: ${error.message}`);
  }

  await logAdminAction(adminProfile.id, 'update_setting', 'setting', key, { value });

  return { ok: true, setting: data };
}

/**
 * Public action: Read a single platform setting without requiring admin privileges.
 */
export async function getPlatformSettingPublic(key: string): Promise<Record<string, any> | null> {
  try {
    const adminSupabase = getAdminSupabase();
    const { data } = await adminSupabase
      .from('platform_settings')
      .select('value')
      .eq('key', key)
      .single();

    return (data?.value as Record<string, any>) || null;
  } catch {
    return null;
  }
}
