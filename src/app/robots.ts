/**
 * Robots.txt — Next.js App Router convention
 *
 * Generates /robots.txt to guide compliant web crawlers.
 *
 * IMPORTANT: This file is crawler guidance only — it is NOT a security mechanism.
 * Authenticated routes are protected by middleware.ts and server-side auth checks
 * in each respective layout/page. This file simply tells well-behaved crawlers
 * which paths are worth indexing.
 *
 * Allowed (crawlable public content):
 *   /            — Homepage (landing page)
 *   /browse      — Public feed
 *   /post/*      — Public post pages
 *   /@*          — Public profile pages
 *   /legal/*     — Legal pages
 *
 * Disallowed (private/authenticated/utility):
 *   /settings    — Authenticated account settings
 *   /submit      — Authenticated post submission
 *   /feedback    — Internal product feedback (per user decision)
 *   /auth/*      — Auth callback/flow routes
 *   /admin/*     — Admin panel
 *   /api/*       — API endpoints
 *   /offline     — PWA offline fallback page
 */

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/browse", "/post/", "/@"],
        disallow: [
          "/settings",
          "/submit",
          "/feedback",
          "/auth/",
          "/admin/",
          "/api/",
          "/offline",
        ],
      },
    ],
    sitemap: "https://www.raterapp.site/sitemap.xml",
    host: "https://www.raterapp.site",
  };
}
