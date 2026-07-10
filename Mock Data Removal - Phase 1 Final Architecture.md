# Mock Data Removal — Phase 1: Final Architecture

> **Scope**: Remove all `mockData.ts` dependencies. Establish the permanent production file structure as stubs (no real Supabase, Cloudinary, or Algolia calls yet). Zero visual or behavioral changes.

---

## Final Target Architecture

```
src/lib/
├── supabase/
│   └── client.ts           ← infrastructure: placeholder Supabase client
├── cloudinary/
│   ├── client.ts           ← infrastructure: placeholder Cloudinary config
│   ├── uploads.ts          ← uploadImage(), deleteImage()
│   └── transforms.ts       ← generateResponsiveUrls(), generateBlurPlaceholder()
├── algolia/
│   ├── client.ts           ← infrastructure: placeholder Algolia client
│   ├── search.ts           ← searchPosts(), searchProfiles(), autocomplete()
│   └── indexing.ts         ← indexPost(), updatePost(), deletePost(), syncPosts()
├── posts.ts                ← domain: getFeedPosts, getPost, getProfilePosts, getTrendingPosts, getTopRatedPosts, updatePost, softDeletePost, hardDeletePost
├── reviews.ts              ← domain: getReviewsByPostId, submitReview, getReviewerName
├── metrics.ts              ← domain: getPostMetrics, getTrendingScore, getCuratedScore, getAverageRating, getReviewDistribution
├── profiles.ts             ← domain: getProfile, getCurrentProfile, updateProfile, checkUsernameAvailable
├── badges.ts               ← domain: getActiveBadges
├── insights.ts             ← domain: generateInsights, getCachedInsights, saveInsights, invalidateInsights
└── notifications.ts        ← domain: (typed stubs only for now)

src/constants/
├── categories.ts           ← CATEGORIES array (moved from mockData.ts)
└── badges.ts               ← MAX_TOP_RATED_BADGES, MIN_REVIEWS_FOR_BADGE, BADGE_WINDOW_DAYS

src/types/
└── index.ts                ← add PostMetrics (renamed), Notification, InsightOutput
```

### The Infrastructure / Domain Distinction

```
Infrastructure (knows vendor APIs)   Domain (knows Rater's data)
────────────────────────────────     ───────────────────────────
lib/supabase/client.ts               lib/posts.ts
lib/cloudinary/client.ts             lib/reviews.ts
lib/algolia/client.ts                lib/metrics.ts
                                     lib/profiles.ts
                                     lib/badges.ts
                                     lib/insights.ts
                                     lib/notifications.ts
```

Domain files call infrastructure. Components call domain files. Nothing outside infrastructure knows a vendor exists.

---

## Synchronization Flow (Documented — Not Yet Implemented)

When a post is created or updated, the full production flow will be:

```
createPost() / updatePost()
    │
    ├─→ [supabase] upsert post record
    │
    ├─→ [cloudinary/uploads] upload image → receive public_id + URLs
    │
    ├─→ [supabase] save Cloudinary URLs back to post record
    │
    ├─→ [algolia/indexing] indexPost() / updatePost()
    │
    └─→ [insights] invalidateInsights(postId)

deletePost()
    │
    ├─→ [supabase] soft delete post record
    │
    ├─→ [cloudinary/uploads] deleteImage(public_id)
    │
    ├─→ [algolia/indexing] deletePost(postId)
    │
    └─→ [insights] invalidateInsights(postId)
```

All orchestration happens inside the domain functions (`lib/posts.ts`). Callers (e.g. PostContext) never see the vendor steps.

---

## New Files — Skeletons

### `src/lib/supabase/client.ts`
```typescript
// TODO(milestone-1): Replace with real Supabase client
// import { createClient } from '@supabase/supabase-js';
// export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export const supabase = null; // placeholder — not used in Phase 1
```

---

### `src/lib/cloudinary/client.ts`
```typescript
// TODO(milestone-3): Configure Cloudinary SDK
// import { v2 as cloudinary } from 'cloudinary';
// cloudinary.config({ cloud_name, api_key, api_secret });

export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '',
}; // placeholder
```

### `src/lib/cloudinary/uploads.ts`
```typescript
// TODO(milestone-3): Implement real Cloudinary uploads

export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  width: number;
  height: number;
}

/** Upload an image file. Returns a Cloudinary UploadResult. */
export async function uploadImage(file: File, folder = 'posts'): Promise<UploadResult> {
  // Phase 1 stub: return a mock result for dev continuity
  console.warn('[Storage] uploadImage is a stub. Integrate Cloudinary in Milestone 3.');
  return {
    publicId: `${folder}/placeholder_${Date.now()}`,
    url: URL.createObjectURL(file),
    secureUrl: URL.createObjectURL(file),
    width: 800,
    height: 600,
  };
}

/** Delete an image by its Cloudinary public_id. */
export async function deleteImage(publicId: string): Promise<void> {
  // TODO(milestone-3): cloudinary.uploader.destroy(publicId)
  console.warn(`[Storage] deleteImage stub called for: ${publicId}`);
}
```

### `src/lib/cloudinary/transforms.ts`
```typescript
// TODO(milestone-3): Implement Cloudinary transformations

export interface ResponsiveImageSet {
  src: string;
  srcSet: string;
  placeholder: string;
}

/** Generate responsive image URLs for a Cloudinary public_id. */
export function generateResponsiveUrls(publicId: string): ResponsiveImageSet {
  // TODO(milestone-3): Use Cloudinary URL builder
  return { src: publicId, srcSet: '', placeholder: '' };
}

/** Generate a base64 blur placeholder for a Cloudinary image. */
export function generateBlurPlaceholder(publicId: string): string {
  // TODO(milestone-3): Cloudinary e_blur transformation
  return '';
}
```

---

### `src/lib/algolia/client.ts`
```typescript
// TODO(milestone-6): Configure Algolia SearchClient
// import algoliasearch from 'algoliasearch';
// export const algoliaClient = algoliasearch(appId, apiKey);
// export const postsIndex = algoliaClient.initIndex('posts');

export const algoliaClient = null; // placeholder
```

### `src/lib/algolia/search.ts`
```typescript
// Search service — the rest of the app imports from here.
// Internally uses Fuse.js in Phase 1; will switch to Algolia in Milestone 6.
// Callers never know which engine is active.

import type { Post, Avatar, Category } from '@/types';
import {
  createSearchIndexes,
  searchAll as fuseSearchAll,
  searchPosts as fuseSearchPosts,
  type SearchIndexes,
  type SectionedSearchResults,
  type PostSearchResult,
} from '@/logic/searchUtils';

export type { SearchIndexes, SectionedSearchResults };

export function buildSearchIndexes(
  posts: Post[],
  avatars: Record<string, Avatar>,
  categories: Category[]
): SearchIndexes {
  // TODO(milestone-6): Replace with Algolia index references
  return createSearchIndexes(posts, avatars, categories);
}

export async function searchAll(
  indexes: SearchIndexes,
  query: string,
  limits?: { avatars?: number; posts?: number; categories?: number }
): Promise<SectionedSearchResults> {
  // TODO(milestone-6): algoliaClient.search([{ indexName: 'posts', query }, ...])
  return fuseSearchAll(indexes, query, limits);
}

export async function searchPosts(
  indexes: SearchIndexes,
  query: string,
  limit?: number
): Promise<PostSearchResult[]> {
  // TODO(milestone-6): postsIndex.search(query, { hitsPerPage: limit })
  return fuseSearchPosts(indexes, query, limit);
}

export async function autocomplete(query: string): Promise<string[]> {
  // TODO(milestone-6): Algolia autocomplete / query suggestions
  return [];
}
```

### `src/lib/algolia/indexing.ts`
```typescript
// Algolia indexing service — called when posts are created/updated/deleted.
// Phase 1: stubs (Algolia not yet integrated).

import type { Post } from '@/types';

export async function indexPost(post: Post): Promise<void> {
  // TODO(milestone-6): postsIndex.saveObject({ objectID: post.id, ...post })
  console.warn('[Algolia] indexPost stub:', post.id);
}

export async function updatePostIndex(postId: string, updates: Partial<Post>): Promise<void> {
  // TODO(milestone-6): postsIndex.partialUpdateObject({ objectID: postId, ...updates })
  console.warn('[Algolia] updatePostIndex stub:', postId);
}

export async function deletePostIndex(postId: string): Promise<void> {
  // TODO(milestone-6): postsIndex.deleteObject(postId)
  console.warn('[Algolia] deletePostIndex stub:', postId);
}

export async function syncPosts(posts: Post[]): Promise<void> {
  // TODO(milestone-6): postsIndex.replaceAllObjects(posts)
  console.warn('[Algolia] syncPosts stub: would sync', posts.length, 'posts');
}
```

---

### `src/lib/posts.ts`
Use-case functions for the Posts domain. Phase 1: internally reads from `mockData.ts`.

**Exports**: `getFeedPosts`, `getPost`, `getProfilePosts`, `getTrendingPosts`, `getTopRatedPosts`, `updatePost`, `softDeletePost`, `hardDeletePost`

Mutations now return a result type and accept `actorId` (enforced by RLS in production):
```typescript
export async function updatePost(
  postId: string,
  updates: Partial<Post>,
  actorId: string
): Promise<{ ok: true; post: Post } | { ok: false; error: string }>
```

---

### `src/lib/reviews.ts`
**Exports**: `getReviewsByPostId`, `submitReview`, `getReviewerName`

`calculatePostMetrics` is NOT here — metrics live in `lib/metrics.ts`.

---

### `src/lib/metrics.ts`
**Exports**: `getPostMetrics`, `getTrendingScore`, `getCuratedScore`, `getAverageRating`, `getReviewDistribution`

Phase 1: `getPostMetrics` runs the same calculation as the old `calculatePostMetrics`. Signature is permanent:
```typescript
export async function getPostMetrics(
  postId: string,
  additionalReviews?: Review[]
): Promise<PostMetrics>
```

`getTrendingScore` and `getCuratedScore` replace the ad-hoc scoring inside `curatedSort.ts` and `hotPostUtils.ts`.

---

### `src/lib/profiles.ts`
**Exports**: `getProfile`, `getAllProfiles`, `updateProfile`, `checkUsernameAvailable`, `searchProfiles`

Phase 1: reads from `MOCK_AVATARS` internally. `AuthContext` calls these instead of importing mock data directly.

---

### `src/lib/badges.ts`
**Exports**: `getActiveBadges(posts: Post[]): Promise<Record<string, BadgeType>>`

Phase 1: wraps `badgeUtils.computeBadges`. Avatar blocked-status check removed from badge logic — add `// TODO(supabase): enforce via RLS`.

---

### `src/lib/insights.ts`
**Exports**: `generateInsights`, `getCachedInsights`, `saveInsights`, `invalidateInsights`

Phase 1: wraps existing `insightEngine.ts` and `insightCache.ts` utilities. These already exist in `utils/` — this file gives them a proper service boundary:
```typescript
// Phase 1: thin wrappers around existing utils
export { generateInsights } from '@/utils/insightEngine';
export { getCachedInsights, saveInsights, invalidateInsights } from '@/utils/insightCache';
```

---

### `src/lib/notifications.ts`
```typescript
// Notifications service — stub for future implementation.
// TODO(milestone-5): Implement with Supabase Realtime subscriptions.

import type { Notification } from '@/types';

export async function getNotifications(avatarId: string): Promise<Notification[]> {
  return [];
}

export async function markAsRead(notificationId: string): Promise<void> {
  // TODO(milestone-5)
}

export async function markAllAsRead(avatarId: string): Promise<void> {
  // TODO(milestone-5)
}
```

---

### `src/constants/categories.ts`
```typescript
import type { Category } from '@/types';

/** Product-defined design categories. Not user data — lives here permanently. */
export const CATEGORIES: Category[] = [
  'Web Design', 'Mobile App Design', 'Brand Identity Design',
  'Mockup Design', 'Logo Design', 'Poster Design', 'Flyer Design',
  'Social Media Design', 'AI Image', '3D Design', 'Packaging Design',
  'Banner Design', 'Ad Creative Design', 'Illustration', 'Icon Design',
  'Typography Design', 'UI Design', 'Landing Page Design', 'Dashboard Design',
];
```

### `src/constants/badges.ts`
```typescript
/** Badge eligibility constants — product definitions, not database values. */
export const MAX_TOP_RATED_BADGES = 3;
export const MIN_REVIEWS_FOR_BADGE = 5;
export const BADGE_WINDOW_DAYS = 7;
```

---

### `src/types/index.ts` — Additions

```typescript
// ─── Post Metrics ──────────────────────────────────────────────────────────────
// Renamed from PostMetricsSummary. This is the shape the frontend always receives.
// In production: computed by a Supabase SQL view or RPC, never on the client.
export interface PostMetrics {
  post_id: string;
  average_score: number;
  review_count: number;
  rating_unlocked: boolean;
  criteria_scores?: Record<string, number>; // future: per-criterion averages from view
}

// ─── Notifications ─────────────────────────────────────────────────────────────
export interface Notification {
  id: string;
  avatar_id: string;
  type: 'new_review' | 'badge_awarded' | 'pulse_vote' | 'system';
  post_id?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ─── Insight Output ────────────────────────────────────────────────────────────
export interface InsightOutput {
  summary: string | null;
  strengths: string[];
  areasToImprove: string[];
  meetsThreshold: boolean;
}
```

---

## Modified Files

| File | Change |
|------|--------|
| `context/AuthContext.tsx` | Remove `MOCK_AVATARS` import → use `getAllProfiles()` from `lib/profiles.ts` |
| `context/PostContext.tsx` | Remove `MOCK_POSTS` → use `getFeedPosts()` from `lib/posts.ts` |
| `context/PostContext.tsx` | Remove `updatePost/hardDeletePost` from mockData → from `lib/posts.ts` |
| `components/BrowseContent.tsx` | `MOCK_AVATARS` → `allAvatars` from context; `CATEGORIES` → `constants/categories`; `calculatePostMetrics` → `lib/metrics` |
| `components/BrowseContent.tsx` | `searchPosts` from `logic/searchUtils` → `lib/algolia/search` |
| `components/PostDetailContent.tsx` | `getReviewsByPostId` → `lib/reviews`; `calculatePostMetrics` → `lib/metrics`; `getReviewerDisplayName` → `lib/reviews` |
| `components/ProfileView.tsx` | `calculatePostMetrics` → `lib/metrics.getPostMetrics` |
| `components/PostForm.tsx` | `CATEGORIES` → `constants/categories` |
| `components/FilterDropdown.tsx` | `CATEGORIES` → `constants/categories` |
| `components/MobileFilterPanel.tsx` | `CATEGORIES` → `constants/categories` |
| `components/MobileSearchOverlay.tsx` | Delete dead `MOCK_POSTS` import; `searchAll` → `lib/algolia/search` |
| `logic/badgeUtils.ts` | All mockData imports → `lib/reviews` + `lib/metrics`; remove `isAvatarNotBlocked` |
| `logic/curatedSort.ts` | `calculatePostMetrics` → `lib/metrics.getCuratedScore` |
| `logic/hotPostUtils.ts` | `calculatePostMetrics` → `lib/metrics.getTrendingScore` |
| `hooks/usePostMetrics.ts` | `calculatePostMetrics` → `lib/metrics.getPostMetrics` |

### `mockData.ts` after Phase 1
- No consumer imports it directly
- Gets header: `// INTERNAL — used only by lib/ stubs. Deleted in Milestone 7.`
- Type re-exports removed (types now come from `@/types` directly)

---

## Full Supabase Migration Milestones

Per the agreed staged approach — these are FUTURE phases, not part of Phase 1:

| Milestone | Scope |
|-----------|-------|
| **1 (now)** | Remove mock data. Create infrastructure skeleton. Establish file structure. |
| **2** | Authentication & Profiles. Supabase Auth, `profiles` table, real `getCurrentProfile()`. |
| **3** | Posts & Media. Real `getFeedPosts()`, Cloudinary upload flow, image storage. |
| **4** | Reviews & Metrics. Real `getReviewsByPostId()`, Supabase SQL view for `getPostMetrics()`. |
| **5** | Insights & AI pipeline. Supabase cache table, real `generateInsights()`, notifications foundation. |
| **6** | Search. Algolia index sync, real `searchPosts()`, autocomplete, `indexPost()` on write. |
| **7** | Final cleanup. Delete `mockData.ts`. Remove stubs. RLS policies. Production hardening. |

---

## Verification Plan

```powershell
# 1. TypeScript compile — zero errors
npx tsc --noEmit

# 2. Confirm zero direct mockData imports outside lib/ internals
Select-String -Path "src\**\*.ts","src\**\*.tsx" -Pattern "from.*mockData" -Recurse |
  Where-Object { $_.Path -notmatch "src\\lib\\" }

# 3. Dev server starts clean
npm run dev
```

**Manual smoke test (per page):**
- `/browse` — loads, sorts (all 4 modes), category filter, avatar filter, search
- `/post/[id]` — reviews display, metrics show, review submission works
- `/@username` — profile loads, post grid shows, stats display
- `/submit` — PostForm: category dropdown, image upload, submission
- Auth — login, signup, profile edit, logout
