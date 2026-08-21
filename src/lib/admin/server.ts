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
  PlatformSetting,
  Campaign,
  CampaignLink,
  CampaignStatus,
  TrendMetric,
  AnalyticsDateRange,
  AnalyticsPlatformOverview,
  ActivationMetrics,
  CoreLoopMetrics,
  RatingLiquidityMetrics,
  GrowthLoopCohortData,
  GrowthLoopCohortStage,
  AcquisitionBreakdownData,
  AcquisitionSourceRow,
  ReferralAcquisitionStats,
  RetentionMetrics,
  CampaignBreakdownRow,
  SharingMetrics
} from '@/types';
import { deleteAsset } from '@/lib/cloudinary/service';
import { extractPublicId } from '@/lib/cloudinary/transforms';
import { normalizeCampaignSlug, normalizeSourceDetail } from '@/utils/attributionNormalize';

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
    .select('id, username, email, show_email, name, role, avatar_url, bg_color, is_admin, bio, is_blocked, created_at, username_last_changed_at, previous_usernames, social_links, onboarding_completed, acquisition_source, acquisition_detail, campaign_tag, referred_by', { count: 'exact' });

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

// ─── Campaign Management Actions ──────────────────────────────────────────────

export async function getCampaigns(): Promise<Campaign[]> {
  await verifyAdminSession();
  const adminSupabase = getAdminSupabase();

  const { data: campaigns, error } = await adminSupabase
    .from('campaigns')
    .select(`
      id,
      name,
      slug,
      description,
      status,
      created_by,
      created_at,
      updated_at,
      creator:profiles!campaigns_created_by_fkey (
        id, username, name, avatar_url
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch campaigns: ${error.message}`);
  }

  // Get link counts per campaign
  const { data: links } = await adminSupabase
    .from('campaign_links')
    .select('campaign_id');

  const countMap: Record<string, number> = {};
  links?.forEach((l) => {
    countMap[l.campaign_id] = (countMap[l.campaign_id] || 0) + 1;
  });

  return (campaigns || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    status: c.status as CampaignStatus,
    created_by: c.created_by,
    created_at: c.created_at,
    updated_at: c.updated_at,
    links_count: countMap[c.id] || 0,
    creator: c.creator ? {
      id: c.creator.id,
      username: c.creator.username,
      name: c.creator.name,
      avatar_url: c.creator.avatar_url,
    } : null,
  }));
}

export async function getCampaign(id: string): Promise<{ campaign: Campaign; links: CampaignLink[] }> {
  await verifyAdminSession();
  const adminSupabase = getAdminSupabase();

  const { data: campaign, error } = await adminSupabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !campaign) {
    throw new Error(`Campaign not found: ${error?.message || 'Unknown id'}`);
  }

  const { data: links, error: linksError } = await adminSupabase
    .from('campaign_links')
    .select('*')
    .eq('campaign_id', id)
    .order('created_at', { ascending: false });

  if (linksError) {
    throw new Error(`Failed to fetch campaign links: ${linksError.message}`);
  }

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.raterapp.site';

  const formattedLinks: CampaignLink[] = (links || []).map((l) => ({
    id: l.id,
    campaign_id: l.campaign_id,
    source: l.source,
    detail: l.detail,
    created_at: l.created_at,
    tracking_url: `${appBaseUrl}/?source=${encodeURIComponent(l.source)}${l.detail ? `&detail=${encodeURIComponent(l.detail)}` : ''}&campaign=${encodeURIComponent(campaign.slug)}`,
  }));

  return {
    campaign: {
      id: campaign.id,
      name: campaign.name,
      slug: campaign.slug,
      description: campaign.description,
      status: campaign.status as CampaignStatus,
      created_by: campaign.created_by,
      created_at: campaign.created_at,
      updated_at: campaign.updated_at,
    },
    links: formattedLinks,
  };
}

export async function createCampaign(
  name: string,
  description?: string
): Promise<{ ok: boolean; campaign?: Campaign; error?: string }> {
  const { profile: adminProfile } = await verifyAdminSession();
  const adminSupabase = getAdminSupabase();

  const cleanName = name.trim();
  if (!cleanName) return { ok: false, error: 'Campaign name is required' };

  const slug = normalizeCampaignSlug(cleanName);
  if (!slug) return { ok: false, error: 'Could not generate a valid campaign slug' };

  // Check unique slug
  const { data: existing } = await adminSupabase
    .from('campaigns')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) {
    return { ok: false, error: `A campaign with slug "${slug}" already exists` };
  }

  const { data, error } = await adminSupabase
    .from('campaigns')
    .insert({
      name: cleanName,
      slug,
      description: description?.trim() || null,
      status: 'active',
      created_by: adminProfile.id,
    })
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  await logAdminAction(adminProfile.id, 'create_campaign', 'campaign', data.id, { name: cleanName, slug });

  return {
    ok: true,
    campaign: {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      status: data.status as CampaignStatus,
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at,
    },
  };
}

export async function updateCampaign(
  id: string,
  updates: { name?: string; description?: string; status?: CampaignStatus }
): Promise<{ ok: boolean; error?: string }> {
  const { profile: adminProfile } = await verifyAdminSession();
  const adminSupabase = getAdminSupabase();

  const payload: Database['public']['Tables']['campaigns']['Update'] = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) {
    payload.name = updates.name.trim();
    const newSlug = normalizeCampaignSlug(updates.name);
    if (newSlug) payload.slug = newSlug;
  }
  if (updates.description !== undefined) {
    payload.description = updates.description.trim() || null;
  }
  if (updates.status !== undefined) {
    payload.status = updates.status;
  }

  const { error } = await adminSupabase
    .from('campaigns')
    .update(payload)
    .eq('id', id);

  if (error) {
    return { ok: false, error: error.message };
  }

  await logAdminAction(adminProfile.id, 'update_campaign', 'campaign', id, updates);

  return { ok: true };
}

export async function createCampaignLink(
  campaignId: string,
  source: string,
  detail?: string
): Promise<{ ok: boolean; link?: CampaignLink; error?: string }> {
  const { profile: adminProfile } = await verifyAdminSession();
  const adminSupabase = getAdminSupabase();

  const cleanSource = normalizeSourceDetail(source);
  if (!cleanSource) return { ok: false, error: 'Source is required' };

  const cleanDetail = detail ? normalizeSourceDetail(detail) : null;

  const { data: campaign } = await adminSupabase
    .from('campaigns')
    .select('slug')
    .eq('id', campaignId)
    .single();

  if (!campaign) return { ok: false, error: 'Campaign not found' };

  const { data, error } = await adminSupabase
    .from('campaign_links')
    .insert({
      campaign_id: campaignId,
      source: cleanSource,
      detail: cleanDetail,
    })
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  await logAdminAction(adminProfile.id, 'create_campaign_link', 'campaign_link', data.id, {
    campaign_id: campaignId,
    source: cleanSource,
    detail: cleanDetail,
  });

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.raterapp.site';
  const trackingUrl = `${appBaseUrl}/?source=${encodeURIComponent(cleanSource)}${cleanDetail ? `&detail=${encodeURIComponent(cleanDetail)}` : ''}&campaign=${encodeURIComponent(campaign.slug)}`;

  return {
    ok: true,
    link: {
      id: data.id,
      campaign_id: data.campaign_id,
      source: data.source,
      detail: data.detail,
      created_at: data.created_at,
      tracking_url: trackingUrl,
    },
  };
}

export async function deleteCampaignLink(linkId: string): Promise<{ ok: boolean; error?: string }> {
  const { profile: adminProfile } = await verifyAdminSession();
  const adminSupabase = getAdminSupabase();

  const { error } = await adminSupabase
    .from('campaign_links')
    .delete()
    .eq('id', linkId);

  if (error) {
    return { ok: false, error: error.message };
  }

  await logAdminAction(adminProfile.id, 'delete_campaign_link', 'campaign_link', linkId);

  return { ok: true };
}

// ─── User Attribution Override Action ─────────────────────────────────────────

export async function updateUserAttribution(
  userId: string,
  updates: {
    acquisition_source?: string | null;
    acquisition_detail?: string | null;
    campaign_tag?: string | null;
    referred_by?: string | null;
  }
): Promise<{ ok: boolean; error?: string }> {
  const { profile: adminProfile } = await verifyAdminSession();
  const adminSupabase = getAdminSupabase();

  const payload: Database['public']['Tables']['profiles']['Update'] = {};

  if (updates.acquisition_source !== undefined) {
    payload.acquisition_source = updates.acquisition_source ? normalizeSourceDetail(updates.acquisition_source) : null;
  }
  if (updates.acquisition_detail !== undefined) {
    payload.acquisition_detail = updates.acquisition_detail ? normalizeSourceDetail(updates.acquisition_detail) : null;
  }
  if (updates.campaign_tag !== undefined) {
    payload.campaign_tag = updates.campaign_tag ? normalizeCampaignSlug(updates.campaign_tag) : null;
  }
  if (updates.referred_by !== undefined) {
    payload.referred_by = updates.referred_by?.trim() || null;
  }

  const { error } = await adminSupabase
    .from('profiles')
    .update(payload)
    .eq('id', userId);

  if (error) {
    return { ok: false, error: error.message };
  }

  await logAdminAction(adminProfile.id, 'override_user_attribution', 'profile', userId, updates);

  return { ok: true };
}

// ─── Analytics Helpers ────────────────────────────────────────────────────────

/**
 * Calculates current and previous comparison windows based on the requested date range.
 * Default is last 30 days vs previous 30 days.
 */
function computeComparisonWindows(range?: AnalyticsDateRange) {
  const now = new Date();
  const to = range?.to ? new Date(range.to) : now;
  const from = range?.from ? new Date(range.from) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const durationMs = Math.max(to.getTime() - from.getTime(), 1000 * 60 * 60 * 24);
  const prevTo = new Date(from.getTime());
  const prevFrom = new Date(from.getTime() - durationMs);

  return {
    current: { from: from.toISOString(), to: to.toISOString() },
    previous: { from: prevFrom.toISOString(), to: prevTo.toISOString() },
    isAllTime: !range?.from,
  };
}

function calculateTrend(current: number, previous: number): TrendMetric {
  let changePct: number | null = null;
  if (previous > 0) {
    changePct = Number((((current - previous) / previous) * 100).toFixed(1));
  } else if (current > 0 && previous === 0) {
    changePct = 100;
  }
  return { current, previous, changePct };
}

// ─── Analytics Server Actions ─────────────────────────────────────────────────

/**
 * Section 1: Platform Overview
 * Reuses the canonical getDashboardStats() query infrastructure to guarantee consistency.
 */
export async function getAnalyticsPlatformOverview(): Promise<AnalyticsPlatformOverview> {
  const stats = await getDashboardStats();
  return {
    totalUsers: stats.totalProfiles,
    totalPosts: stats.totalPosts,
    totalViews: stats.totalViews,
    totalReviews: stats.totalReviews,
    users7dDelta: stats.profilesLast7Days,
    posts7dDelta: stats.postsLast7Days,
    reviews7dDelta: stats.reviewsLast7Days,
  };
}

/**
 * Section 2: Activation Metrics
 *
 * ACTIVATED USER DEFINITION:
 * A registered user who has:
 *  1. Uploaded >= 1 non-deleted post (posts.is_deleted IS NOT TRUE)
 *  AND
 *  2. Submitted >= 1 valid review on another user's post (reviewer_id != post.avatar_id AND reviewer_id IS NOT NULL)
 */
export async function getActivationMetrics(range?: AnalyticsDateRange): Promise<ActivationMetrics> {
  await verifyAdminSession();
  const adminSupabase = getAdminSupabase();
  const windows = computeComparisonWindows(range);

  async function getCohortStats(windowFrom: string, windowTo: string) {
    // 1. Get new registrations in window
    let profileQuery = adminSupabase.from('profiles').select('id');
    if (!windows.isAllTime || windowFrom) {
      profileQuery = profileQuery.gte('created_at', windowFrom).lte('created_at', windowTo);
    }
    const { data: profiles } = await profileQuery;
    const userIds = profiles?.map((p) => p.id) || [];
    const registrations = userIds.length;

    if (registrations === 0) {
      return { registrations: 0, raters: 0, uploaders: 0, activated: 0, rate: 0 };
    }

    // 2. Fetch non-deleted posts by these users
    const { data: posts } = await adminSupabase
      .from('posts')
      .select('avatar_id')
      .in('avatar_id', userIds)
      .neq('is_deleted', true);

    const uploaderSet = new Set(posts?.map((p) => p.avatar_id));
    const uploaders = uploaderSet.size;

    // 3. Fetch reviews given by these users on other users' posts
    const { data: reviews } = await adminSupabase
      .from('reviews')
      .select('reviewer_id, post_id, posts!inner(avatar_id, is_deleted)')
      .in('reviewer_id', userIds)
      .neq('posts.is_deleted', true);

    // Valid review = reviewer_id != post author
    const raterSet = new Set<string>();
    reviews?.forEach((r: any) => {
      if (r.reviewer_id && r.reviewer_id !== r.posts?.avatar_id) {
        raterSet.add(r.reviewer_id);
      }
    });
    const raters = raterSet.size;

    // 4. Activated = both uploaded >= 1 AND reviewed >= 1
    let activated = 0;
    userIds.forEach((uid) => {
      if (uploaderSet.has(uid) && raterSet.has(uid)) {
        activated++;
      }
    });

    const rate = registrations > 0 ? Number(((activated / registrations) * 100).toFixed(1)) : 0;

    return { registrations, raters, uploaders, activated, rate };
  }

  const [currentStats, prevStats] = await Promise.all([
    getCohortStats(windows.current.from, windows.current.to),
    getCohortStats(windows.previous.from, windows.previous.to),
  ]);

  return {
    newRegistrations: calculateTrend(currentStats.registrations, prevStats.registrations),
    ratersCount: calculateTrend(currentStats.raters, prevStats.raters),
    uploadersCount: calculateTrend(currentStats.uploaders, prevStats.uploaders),
    activatedUsers: calculateTrend(currentStats.activated, prevStats.activated),
    activationRate: calculateTrend(currentStats.rate, prevStats.rate),
  };
}

/**
 * Section 3: Core Loop Metrics
 */
export async function getCoreLoopMetrics(range?: AnalyticsDateRange): Promise<CoreLoopMetrics> {
  await verifyAdminSession();
  const adminSupabase = getAdminSupabase();
  const windows = computeComparisonWindows(range);

  async function getWindowCoreLoop(windowFrom: string, windowTo: string) {
    let postsQuery = adminSupabase.from('posts').select('id, review_count', { count: 'exact' }).neq('is_deleted', true);
    let reviewsQuery = adminSupabase.from('reviews').select('id, reviewer_id, post_id, posts!inner(avatar_id, is_deleted)', { count: 'exact' }).neq('posts.is_deleted', true);
    let sharesQuery = adminSupabase.from('share_events').select('user_id', { count: 'exact' });
    let referralsQuery = adminSupabase.from('profiles').select('id', { count: 'exact' }).not('referred_by', 'is', null);

    if (!windows.isAllTime || windowFrom) {
      postsQuery = postsQuery.gte('created_at', windowFrom).lte('created_at', windowTo);
      reviewsQuery = reviewsQuery.gte('created_at', windowFrom).lte('created_at', windowTo);
      sharesQuery = sharesQuery.gte('created_at', windowFrom).lte('created_at', windowTo);
      referralsQuery = referralsQuery.gte('created_at', windowFrom).lte('created_at', windowTo);
    }

    const [postsRes, reviewsRes, sharesRes, referralsRes] = await Promise.all([
      postsQuery,
      reviewsQuery,
      sharesQuery,
      referralsQuery,
    ]);

    const postsSubmitted = postsRes.count || 0;
    const postsData = postsRes.data || [];
    
    // Valid reviews given (exclude self-reviews)
    const validReviews = (reviewsRes.data || []).filter((r: any) => r.reviewer_id && r.reviewer_id !== r.posts?.avatar_id);
    const reviewsGiven = validReviews.length;
    const reviewsReceived = reviewsGiven; // within closed platform equals reviews given

    const avgReviewsPerPost = postsSubmitted > 0 ? Number((reviewsGiven / postsSubmitted).toFixed(1)) : 0;
    
    // Canonical unlock condition: review_count >= 3
    const postsUnlocked = postsData.filter((p) => (p.review_count || 0) >= 3).length;

    const shareActions = sharesRes.count || 0;
    const usersWhoShared = new Set((sharesRes.data || []).map((s) => s.user_id)).size;
    const referralSignups = referralsRes.count || 0;

    return {
      postsSubmitted,
      reviewsGiven,
      reviewsReceived,
      avgReviewsPerPost,
      postsUnlocked,
      shareActions,
      usersWhoShared,
      referralSignups,
    };
  }

  const [current, previous] = await Promise.all([
    getWindowCoreLoop(windows.current.from, windows.current.to),
    getWindowCoreLoop(windows.previous.from, windows.previous.to),
  ]);

  return {
    postsSubmitted: calculateTrend(current.postsSubmitted, previous.postsSubmitted),
    reviewsGiven: calculateTrend(current.reviewsGiven, previous.reviewsGiven),
    reviewsReceived: calculateTrend(current.reviewsReceived, previous.reviewsReceived),
    avgReviewsPerPost: calculateTrend(current.avgReviewsPerPost, previous.avgReviewsPerPost),
    postsUnlocked: calculateTrend(current.postsUnlocked, previous.postsUnlocked),
    shareActions: calculateTrend(current.shareActions, previous.shareActions),
    usersWhoShared: calculateTrend(current.usersWhoShared, previous.usersWhoShared),
    referralSignups: calculateTrend(current.referralSignups, previous.referralSignups),
  };
}

/**
 * Section 4: Rating Liquidity Metrics
 *
 * Scoped to posts created within the selected period.
 * Measures marketplace feedback availability and speed.
 */
export async function getRatingLiquidityMetrics(range?: AnalyticsDateRange): Promise<RatingLiquidityMetrics> {
  await verifyAdminSession();
  const adminSupabase = getAdminSupabase();
  const windows = computeComparisonWindows(range);

  let query = adminSupabase
    .from('posts')
    .select('id, review_count, created_at')
    .neq('is_deleted', true);

  if (!windows.isAllTime && windows.current.from) {
    query = query.gte('created_at', windows.current.from).lte('created_at', windows.current.to);
  }

  const { data: posts } = await query;
  const postList = posts || [];
  const totalPostsInPeriod = postList.length;

  if (totalPostsInPeriod === 0) {
    return {
      pctPostsWithReviews: 0,
      pctPostsUnlocked: 0,
      postsAwaitingFirstReview: 0,
      postsAwaitingUnlock: 0,
      medianTimeToFirstReviewMinutes: null,
      totalPostsInPeriod: 0,
    };
  }

  const withReviews = postList.filter((p) => (p.review_count || 0) >= 1).length;
  // Canonical unlock: review_count >= 3
  const unlocked = postList.filter((p) => (p.review_count || 0) >= 3).length;
  const postsAwaitingFirstReview = postList.filter((p) => (p.review_count || 0) === 0).length;
  const postsAwaitingUnlock = postList.filter((p) => (p.review_count || 0) >= 1 && (p.review_count || 0) < 3).length;

  const pctPostsWithReviews = Number(((withReviews / totalPostsInPeriod) * 100).toFixed(1));
  const pctPostsUnlocked = Number(((unlocked / totalPostsInPeriod) * 100).toFixed(1));

  // Compute median time to first review for qualifying posts in period
  const postIdsWithReviews = postList.filter((p) => (p.review_count || 0) >= 1).map((p) => p.id);
  let medianMinutes: number | null = null;

  if (postIdsWithReviews.length > 0) {
    const { data: reviews } = await adminSupabase
      .from('reviews')
      .select('post_id, created_at')
      .in('post_id', postIdsWithReviews)
      .order('created_at', { ascending: true });

    // Map each post to its earliest valid review timestamp
    const firstReviewMap: Record<string, string> = {};
    reviews?.forEach((r) => {
      if (r.created_at && (!firstReviewMap[r.post_id] || new Date(r.created_at) < new Date(firstReviewMap[r.post_id]))) {
        firstReviewMap[r.post_id] = r.created_at;
      }
    });

    const timeDeltasMinutes: number[] = [];
    postList.forEach((post) => {
      const firstReviewTime = firstReviewMap[post.id];
      if (firstReviewTime && post.created_at) {
        const postDate = new Date(post.created_at).getTime();
        const reviewDate = new Date(firstReviewTime).getTime();
        if (reviewDate >= postDate) {
          const deltaMin = Math.round((reviewDate - postDate) / (1000 * 60));
          timeDeltasMinutes.push(deltaMin);
        }
      }
    });

    if (timeDeltasMinutes.length > 0) {
      timeDeltasMinutes.sort((a, b) => a - b);
      const mid = Math.floor(timeDeltasMinutes.length / 2);
      medianMinutes = timeDeltasMinutes.length % 2 !== 0
        ? timeDeltasMinutes[mid]
        : Math.round((timeDeltasMinutes[mid - 1] + timeDeltasMinutes[mid]) / 2);
    }
  }

  return {
    pctPostsWithReviews,
    pctPostsUnlocked,
    postsAwaitingFirstReview,
    postsAwaitingUnlock,
    medianTimeToFirstReviewMinutes: medianMinutes,
    totalPostsInPeriod,
  };
}

/**
 * Section 5: Growth Loop Cohort
 *
 * NON-CHRONOLOGICAL cohort analysis of users who registered within the selected period.
 * Shows what percentage of registered users have ever completed each behavior.
 */
export async function getGrowthLoopCohort(range?: AnalyticsDateRange): Promise<GrowthLoopCohortData> {
  await verifyAdminSession();
  const adminSupabase = getAdminSupabase();
  const windows = computeComparisonWindows(range);

  let query = adminSupabase.from('profiles').select('id');
  if (!windows.isAllTime && windows.current.from) {
    query = query.gte('created_at', windows.current.from).lte('created_at', windows.current.to);
  }

  const { data: profiles } = await query;
  const userIds = profiles?.map((p) => p.id) || [];
  const registeredCount = userIds.length;

  if (registeredCount === 0) {
    return {
      registeredCount: 0,
      stages: [
        { id: 'registered', name: 'Registered', count: 0, conversionRate: 100, description: 'Signed up on Rater' },
        { id: 'rated', name: 'Reviewed ≥1 Design', count: 0, conversionRate: 0, description: 'Submitted valid critique on another designer\'s work' },
        { id: 'uploaded', name: 'Uploaded ≥1 Design', count: 0, conversionRate: 0, description: 'Published a design to the community' },
        { id: 'unlocked', name: 'Received Rating Unlock', count: 0, conversionRate: 0, description: 'Own post reached canonical unlock (≥3 reviews)' },
        { id: 'shared_or_invited', name: 'Shared or Invited', count: 0, conversionRate: 0, description: 'Shared a design or generated an invite referral' },
      ],
      stage5Details: { sharedCount: 0, invitedCount: 0, sharedOrInvitedCount: 0 },
    };
  }

  // 1. Uploaded >= 1 post (ever)
  const { data: posts } = await adminSupabase
    .from('posts')
    .select('avatar_id, review_count')
    .in('avatar_id', userIds)
    .neq('is_deleted', true);

  const uploaderSet = new Set(posts?.map((p) => p.avatar_id));
  const unlockedAuthorSet = new Set(
    posts?.filter((p) => (p.review_count || 0) >= 3).map((p) => p.avatar_id)
  );

  // 2. Reviewed >= 1 post (ever, on another user's post)
  const { data: reviews } = await adminSupabase
    .from('reviews')
    .select('reviewer_id, posts!inner(avatar_id, is_deleted)')
    .in('reviewer_id', userIds)
    .neq('posts.is_deleted', true);

  const reviewerSet = new Set<string>();
  reviews?.forEach((r: any) => {
    if (r.reviewer_id && r.reviewer_id !== r.posts?.avatar_id) {
      reviewerSet.add(r.reviewer_id);
    }
  });

  // 3. Shared >= 1 post (ever)
  const { data: shareEvents } = await adminSupabase
    .from('share_events')
    .select('user_id')
    .in('user_id', userIds);

  const sharedSet = new Set(shareEvents?.map((s) => s.user_id));

  // 4. Invited >= 1 user (ever)
  const { data: referrals } = await adminSupabase
    .from('profiles')
    .select('referred_by')
    .in('referred_by', userIds);

  const inviterSet = new Set(referrals?.map((r) => r.referred_by));

  // 5. Shared OR Invited
  const sharedOrInvitedSet = new Set<string>();
  userIds.forEach((uid) => {
    if (sharedSet.has(uid) || inviterSet.has(uid)) {
      sharedOrInvitedSet.add(uid);
    }
  });

  const ratedCount = userIds.filter((uid) => reviewerSet.has(uid)).length;
  const uploadedCount = userIds.filter((uid) => uploaderSet.has(uid)).length;
  const unlockedCount = userIds.filter((uid) => unlockedAuthorSet.has(uid)).length;
  const sharedCount = userIds.filter((uid) => sharedSet.has(uid)).length;
  const invitedCount = userIds.filter((uid) => inviterSet.has(uid)).length;
  const sharedOrInvitedCount = sharedOrInvitedSet.size;

  const stages: GrowthLoopCohortStage[] = [
    {
      id: 'registered',
      name: 'Registered',
      count: registeredCount,
      conversionRate: 100,
      description: 'Signed up on Rater during the selected period',
    },
    {
      id: 'rated',
      name: 'Reviewed ≥1 Design',
      count: ratedCount,
      conversionRate: Number(((ratedCount / registeredCount) * 100).toFixed(1)),
      description: 'Submitted valid critique on another designer\'s work',
    },
    {
      id: 'uploaded',
      name: 'Uploaded ≥1 Design',
      count: uploadedCount,
      conversionRate: Number(((uploadedCount / registeredCount) * 100).toFixed(1)),
      description: 'Published a design to the community',
    },
    {
      id: 'unlocked',
      name: 'Received Rating Unlock',
      count: unlockedCount,
      conversionRate: Number(((unlockedCount / registeredCount) * 100).toFixed(1)),
      description: 'Own design reached community threshold (≥3 reviews)',
    },
    {
      id: 'shared_or_invited',
      name: 'Shared or Invited',
      count: sharedOrInvitedCount,
      conversionRate: Number(((sharedOrInvitedCount / registeredCount) * 100).toFixed(1)),
      description: 'Shared a work or brought a new designer to the community',
    },
  ];

  return {
    registeredCount,
    stages,
    stage5Details: {
      sharedCount,
      invitedCount,
      sharedOrInvitedCount,
    },
  };
}

/**
 * Section 6: Acquisition Analytics
 *
 * Compares Marketing Attribution (acquisition_source), User Referral Attribution (referred_by),
 * and Direct/Organic traffic.
 */
export async function getAcquisitionBreakdown(range?: AnalyticsDateRange): Promise<AcquisitionBreakdownData> {
  await verifyAdminSession();
  const adminSupabase = getAdminSupabase();
  const windows = computeComparisonWindows(range);

  let query = adminSupabase
    .from('profiles')
    .select('id, acquisition_source, referred_by, created_at');

  if (!windows.isAllTime && windows.current.from) {
    query = query.gte('created_at', windows.current.from).lte('created_at', windows.current.to);
  }

  const { data: profiles } = await query;
  const profileList = profiles || [];
  const userIds = profileList.map((p) => p.id);

  // Determine activation status for all users in this cohort
  const [postsRes, reviewsRes] = await Promise.all([
    adminSupabase.from('posts').select('avatar_id').in('avatar_id', userIds).neq('is_deleted', true),
    adminSupabase.from('reviews').select('reviewer_id, posts!inner(avatar_id, is_deleted)').in('reviewer_id', userIds).neq('posts.is_deleted', true),
  ]);

  const uploaderSet = new Set(postsRes.data?.map((p) => p.avatar_id));
  const reviewerSet = new Set<string>();
  reviewsRes.data?.forEach((r: any) => {
    if (r.reviewer_id && r.reviewer_id !== r.posts?.avatar_id) {
      reviewerSet.add(r.reviewer_id);
    }
  });

  const isActivated = (uid: string) => uploaderSet.has(uid) && reviewerSet.has(uid);

  // Group marketing sources
  const sourceMap: Record<string, { total: number; activated: number }> = {};
  let marketingCount = 0;
  let marketingActivated = 0;
  let referralCount = 0;
  let referralActivated = 0;
  let directCount = 0;
  let directActivated = 0;

  const referrerCountMap: Record<string, number> = {};

  profileList.forEach((profile) => {
    const activated = isActivated(profile.id);

    // Marketing source attribution
    if (profile.acquisition_source) {
      const src = profile.acquisition_source;
      if (!sourceMap[src]) sourceMap[src] = { total: 0, activated: 0 };
      sourceMap[src].total++;
      if (activated) sourceMap[src].activated++;
      marketingCount++;
      if (activated) marketingActivated++;
    } else if (profile.referred_by) {
      // User referral without marketing source
      referralCount++;
      if (activated) referralActivated++;
    } else {
      // Direct / organic
      directCount++;
      if (activated) directActivated++;
    }

    // Referral tracking
    if (profile.referred_by) {
      referrerCountMap[profile.referred_by] = (referrerCountMap[profile.referred_by] || 0) + 1;
    }
  });

  const sources: AcquisitionSourceRow[] = Object.entries(sourceMap).map(([source, stats]) => ({
    source,
    usersCount: stats.total,
    activatedCount: stats.activated,
    activationRate: stats.total > 0 ? Number(((stats.activated / stats.total) * 100).toFixed(1)) : 0,
  })).sort((a, b) => b.usersCount - a.usersCount);

  // Fetch top referrers
  const topReferrerIds = Object.entries(referrerCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  let topReferrers: ReferralAcquisitionStats['topReferrers'] = [];
  if (topReferrerIds.length > 0) {
    const { data: referrerProfiles } = await adminSupabase
      .from('profiles')
      .select('id, username, name, avatar_url')
      .in('id', topReferrerIds);

    const refMap: Record<string, any> = {};
    referrerProfiles?.forEach((p) => { refMap[p.id] = p; });

    topReferrers = topReferrerIds.map((id) => ({
      referrerId: id,
      username: refMap[id]?.username || 'unknown',
      name: refMap[id]?.name || 'Unknown User',
      avatar_url: refMap[id]?.avatar_url || null,
      referralCount: referrerCountMap[id] || 0,
    }));
  }

  const totalReferredUsers = profileList.filter((p) => p.referred_by).length;
  const activatedReferredUsers = profileList.filter((p) => p.referred_by && isActivated(p.id)).length;
  const referralActivationRate = totalReferredUsers > 0
    ? Number(((activatedReferredUsers / totalReferredUsers) * 100).toFixed(1))
    : 0;

  return {
    sources,
    referralStats: {
      totalReferredUsers,
      activatedReferredUsers,
      referralActivationRate,
      topReferrers,
    },
    comparison: {
      marketingCount,
      marketingActivated,
      marketingRate: marketingCount > 0 ? Number(((marketingActivated / marketingCount) * 100).toFixed(1)) : 0,
      referralCount: totalReferredUsers,
      referralActivated: activatedReferredUsers,
      referralRate: referralActivationRate,
      directOrUnknownCount: directCount,
      directOrUnknownActivated: directActivated,
      directOrUnknownRate: directCount > 0 ? Number(((directActivated / directCount) * 100).toFixed(1)) : 0,
    },
  };
}

/**
 * Section 7: Retention Metrics
 *
 * CALENDAR-DAY (UTC) RETENTION:
 * Retained = performed at least one meaningful action (upload post OR submit valid review)
 * on a calendar day following signup date.
 * Always computed over all-time historical data.
 */
export async function getRetentionMetrics(): Promise<RetentionMetrics> {
  await verifyAdminSession();
  const adminSupabase = getAdminSupabase();

  const [profilesRes, postsRes, reviewsRes] = await Promise.all([
    adminSupabase.from('profiles').select('id, created_at'),
    adminSupabase.from('posts').select('avatar_id, created_at').neq('is_deleted', true),
    adminSupabase.from('reviews').select('reviewer_id, created_at, posts!inner(avatar_id, is_deleted)').neq('posts.is_deleted', true),
  ]);

  const profiles = profilesRes.data || [];
  const totalCohortUsers = profiles.length;

  if (totalCohortUsers === 0) {
    return {
      d1RetentionRate: 0,
      d7RetentionRate: 0,
      d30RetentionRate: 0,
      repeatUploadRate: 0,
      repeatReviewRate: 0,
      totalCohortUsers: 0,
    };
  }

  // Map user ID -> signup UTC date string 'YYYY-MM-DD'
  const signupDateMap: Record<string, string> = {};
  profiles.forEach((p) => {
    if (p.created_at) {
      signupDateMap[p.id] = new Date(p.created_at).toISOString().split('T')[0];
    }
  });

  // Map user ID -> Set of action UTC date strings 'YYYY-MM-DD'
  const actionDatesByUser: Record<string, Set<string>> = {};
  const addAction = (userId: string, createdAt: string | null) => {
    if (!userId || !createdAt) return;
    const dateStr = new Date(createdAt).toISOString().split('T')[0];
    if (!actionDatesByUser[userId]) actionDatesByUser[userId] = new Set();
    actionDatesByUser[userId].add(dateStr);
  };

  // Posts by user
  const postsCountByUser: Record<string, number> = {};
  postsRes.data?.forEach((p) => {
    if (p.avatar_id && p.created_at) {
      addAction(p.avatar_id, p.created_at);
      postsCountByUser[p.avatar_id] = (postsCountByUser[p.avatar_id] || 0) + 1;
    }
  });

  // Valid reviews by user
  const reviewsCountByUser: Record<string, number> = {};
  reviewsRes.data?.forEach((r: any) => {
    if (r.reviewer_id && r.reviewer_id !== r.posts?.avatar_id && r.created_at) {
      addAction(r.reviewer_id, r.created_at);
      reviewsCountByUser[r.reviewer_id] = (reviewsCountByUser[r.reviewer_id] || 0) + 1;
    }
  });

  const nowUTC = new Date().toISOString().split('T')[0];
  const nowMs = new Date(nowUTC).getTime();

  let d1Eligible = 0;
  let d1Retained = 0;
  let d7Eligible = 0;
  let d7Retained = 0;
  let d30Eligible = 0;
  let d30Retained = 0;

  profiles.forEach((p) => {
    const signupStr = signupDateMap[p.id];
    if (!signupStr) return;

    const signupMs = new Date(signupStr).getTime();
    const ageInDays = Math.floor((nowMs - signupMs) / (1000 * 60 * 60 * 24));
    const userActions = actionDatesByUser[p.id] || new Set();

    // D1: User signed up >= 2 days ago, check if action happened on signup + 1 day
    if (ageInDays >= 2) {
      d1Eligible++;
      const d1Date = new Date(signupMs + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      if (userActions.has(d1Date)) {
        d1Retained++;
      }
    }

    // D7: User signed up >= 8 days ago, check if action happened between day 1 and day 7
    if (ageInDays >= 8) {
      d7Eligible++;
      let hasD7 = false;
      for (let i = 1; i <= 7; i++) {
        const dDate = new Date(signupMs + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        if (userActions.has(dDate)) {
          hasD7 = true;
          break;
        }
      }
      if (hasD7) d7Retained++;
    }

    // D30: User signed up >= 31 days ago, check if action happened between day 1 and day 30
    if (ageInDays >= 31) {
      d30Eligible++;
      let hasD30 = false;
      for (let i = 1; i <= 30; i++) {
        const dDate = new Date(signupMs + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        if (userActions.has(dDate)) {
          hasD30 = true;
          break;
        }
      }
      if (hasD30) d30Retained++;
    }
  });

  const d1RetentionRate = d1Eligible > 0 ? Number(((d1Retained / d1Eligible) * 100).toFixed(1)) : 0;
  const d7RetentionRate = d7Eligible > 0 ? Number(((d7Retained / d7Eligible) * 100).toFixed(1)) : 0;
  const d30RetentionRate = d30Eligible > 0 ? Number(((d30Retained / d30Eligible) * 100).toFixed(1)) : 0;

  // Repeat rates
  const uploadersCount = Object.keys(postsCountByUser).length;
  const repeatUploadersCount = Object.values(postsCountByUser).filter((c) => c >= 2).length;
  const repeatUploadRate = uploadersCount > 0 ? Number(((repeatUploadersCount / uploadersCount) * 100).toFixed(1)) : 0;

  const reviewersCount = Object.keys(reviewsCountByUser).length;
  const repeatReviewersCount = Object.values(reviewsCountByUser).filter((c) => c >= 2).length;
  const repeatReviewRate = reviewersCount > 0 ? Number(((repeatReviewersCount / reviewersCount) * 100).toFixed(1)) : 0;

  return {
    d1RetentionRate,
    d7RetentionRate,
    d30RetentionRate,
    repeatUploadRate,
    repeatReviewRate,
    totalCohortUsers,
  };
}

/**
 * Section 8: Campaign Analytics
 */
export async function getCampaignBreakdown(range?: AnalyticsDateRange): Promise<CampaignBreakdownRow[]> {
  await verifyAdminSession();
  const adminSupabase = getAdminSupabase();
  const windows = computeComparisonWindows(range);

  const [campaignsRes, profilesRes] = await Promise.all([
    adminSupabase.from('campaigns').select('id, name, slug, status'),
    adminSupabase.from('profiles').select('id, campaign_tag, referred_by, created_at'),
  ]);

  const campaigns = campaignsRes.data || [];
  let profiles = profilesRes.data || [];

  if (!windows.isAllTime && windows.current.from) {
    profiles = profiles.filter((p) => {
      if (!p.created_at) return false;
      const created = new Date(p.created_at).getTime();
      return created >= new Date(windows.current.from).getTime() && created <= new Date(windows.current.to).getTime();
    });
  }

  const userIds = profiles.map((p) => p.id);

  // Check activation
  const [postsRes, reviewsRes] = await Promise.all([
    adminSupabase.from('posts').select('avatar_id').in('avatar_id', userIds).neq('is_deleted', true),
    adminSupabase.from('reviews').select('reviewer_id, posts!inner(avatar_id, is_deleted)').in('reviewer_id', userIds).neq('posts.is_deleted', true),
  ]);

  const uploaderSet = new Set(postsRes.data?.map((p) => p.avatar_id));
  const reviewerSet = new Set<string>();
  reviewsRes.data?.forEach((r: any) => {
    if (r.reviewer_id && r.reviewer_id !== r.posts?.avatar_id) {
      reviewerSet.add(r.reviewer_id);
    }
  });

  const isActivated = (uid: string) => uploaderSet.has(uid) && reviewerSet.has(uid);

  // Group by campaign tag
  const campaignDataMap: Record<string, { total: number; activated: number; referrals: number }> = {};
  const userCampaignMap: Record<string, string> = {};

  profiles.forEach((p) => {
    if (p.campaign_tag) {
      userCampaignMap[p.id] = p.campaign_tag;
      if (!campaignDataMap[p.campaign_tag]) {
        campaignDataMap[p.campaign_tag] = { total: 0, activated: 0, referrals: 0 };
      }
      campaignDataMap[p.campaign_tag].total++;
      if (isActivated(p.id)) {
        campaignDataMap[p.campaign_tag].activated++;
      }
    }
  });

  // Calculate referrals generated per campaign
  profiles.forEach((p) => {
    if (p.referred_by && userCampaignMap[p.referred_by]) {
      const parentCampaign = userCampaignMap[p.referred_by];
      if (campaignDataMap[parentCampaign]) {
        campaignDataMap[parentCampaign].referrals++;
      }
    }
  });

  // Merge with registered campaigns table
  const campaignSlugToDb = new Map(campaigns.map((c) => [c.slug, c]));

  const rows: CampaignBreakdownRow[] = [];

  // Add all DB campaigns
  campaigns.forEach((c) => {
    const stats = campaignDataMap[c.slug] || { total: 0, activated: 0, referrals: 0 };
    rows.push({
      campaignId: c.id,
      campaignSlug: c.slug,
      campaignName: c.name,
      status: c.status,
      usersCount: stats.total,
      activatedCount: stats.activated,
      activationRate: stats.total > 0 ? Number(((stats.activated / stats.total) * 100).toFixed(1)) : 0,
      referralsGenerated: stats.referrals,
    });
  });

  // Add any campaign tags found in profiles that aren't yet in campaigns table
  Object.entries(campaignDataMap).forEach(([slug, stats]) => {
    if (!campaignSlugToDb.has(slug)) {
      rows.push({
        campaignId: null,
        campaignSlug: slug,
        campaignName: slug,
        status: 'active',
        usersCount: stats.total,
        activatedCount: stats.activated,
        activationRate: stats.total > 0 ? Number(((stats.activated / stats.total) * 100).toFixed(1)) : 0,
        referralsGenerated: stats.referrals,
      });
    }
  });

  return rows.sort((a, b) => b.usersCount - a.usersCount);
}

/**
 * Section 9: Sharing Analytics
 */
export async function getSharingMetrics(range?: AnalyticsDateRange): Promise<SharingMetrics> {
  await verifyAdminSession();
  const adminSupabase = getAdminSupabase();
  const windows = computeComparisonWindows(range);

  async function getWindowSharing(windowFrom: string, windowTo: string) {
    let query = adminSupabase.from('share_events').select('id, post_id, share_method');
    if (!windows.isAllTime || windowFrom) {
      query = query.gte('created_at', windowFrom).lte('created_at', windowTo);
    }
    const { data: events } = await query;
    const list = events || [];

    const totalActions = list.length;
    const uniquePosts = new Set(list.map((e) => e.post_id)).size;

    const methodMap: Record<string, number> = {};
    list.forEach((e) => {
      const method = e.share_method || 'native';
      methodMap[method] = (methodMap[method] || 0) + 1;
    });

    const sharesByMethod = Object.entries(methodMap).map(([method, count]) => ({
      method,
      count,
    })).sort((a, b) => b.count - a.count);

    return { totalActions, uniquePosts, sharesByMethod };
  }

  const [current, previous] = await Promise.all([
    getWindowSharing(windows.current.from, windows.current.to),
    getWindowSharing(windows.previous.from, windows.previous.to),
  ]);

  return {
    totalShareActions: calculateTrend(current.totalActions, previous.totalActions),
    uniquePostsShared: calculateTrend(current.uniquePosts, previous.uniquePosts),
    sharesByMethod: current.sharesByMethod,
  };
}

