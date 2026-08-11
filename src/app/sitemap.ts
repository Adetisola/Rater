/**
 * Dynamic Sitemap — Next.js App Router convention
 *
 * Generates a sitemap.xml at https://raterapp.site/sitemap.xml
 *
 * Included:
 *   - Static public routes: /, /browse
 *   - Public post pages: /post/[id]  (not deleted, valid ID)
 *   - Public profile pages: /@[username] (not blocked, valid username)
 *
 * Excluded:
 *   - Authenticated routes (/settings, /submit, /auth/*)
 *   - Admin routes (/admin/*)
 *   - API routes (/api/*)
 *   - Internal utility routes
 *   - Deleted posts (is_deleted = true)
 *   - Blocked profiles (is_blocked = true)
 *
 * Revalidates hourly (ISR) so new posts/profiles are reflected without a redeploy.
 * lastModified is taken from real DB timestamps where available.
 */

import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase/client";

const PRODUCTION_URL = "https://raterapp.site";

// Hourly revalidation — new content appears in the sitemap within ~1 hour
// without requiring a full redeploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Static routes ──────────────────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: PRODUCTION_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${PRODUCTION_URL}/browse`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
  ];

  // ── Dynamic post pages ─────────────────────────────────────────────────────
  // Strict quality filters: only non-deleted posts with a valid UUID.
  let postRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: posts, error } = await supabase
      .from("posts")
      .select("id, updated_at, created_at")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(5000); // Safety ceiling — revisit if post volume grows

    if (!error && posts) {
      postRoutes = posts
        .filter((post) => typeof post.id === "string" && post.id.length > 0)
        .map((post) => ({
          url: `${PRODUCTION_URL}/post/${post.id}`,
          // Prefer updated_at (reflects content edits); fall back to created_at
          lastModified: post.updated_at
            ? new Date(post.updated_at)
            : new Date(post.created_at),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }));
    }
  } catch (err) {
    // Gracefully degrade — sitemap still renders static routes if DB is unreachable
    console.error("[sitemap] Failed to fetch posts:", err);
  }

  // ── Dynamic profile pages ──────────────────────────────────────────────────
  // Strict quality filters: only non-blocked profiles with a valid username.
  let profileRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("username, updated_at, created_at")
      .eq("is_blocked", false)
      .not("username", "is", null)
      .order("created_at", { ascending: false })
      .limit(5000); // Safety ceiling

    if (!error && profiles) {
      profileRoutes = profiles
        .filter(
          (profile) =>
            typeof profile.username === "string" &&
            profile.username.trim().length > 0
        )
        .map((profile) => ({
          url: `${PRODUCTION_URL}/@${profile.username}`,
          lastModified: profile.updated_at
            ? new Date(profile.updated_at)
            : new Date(profile.created_at),
          changeFrequency: "weekly" as const,
          priority: 0.6,
        }));
    }
  } catch (err) {
    console.error("[sitemap] Failed to fetch profiles:", err);
  }

  return [...staticRoutes, ...postRoutes, ...profileRoutes];
}
