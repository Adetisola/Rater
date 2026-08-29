# Changelog

All notable changes to Rater are documented here.

---

## [1.2.2] — 2026-08-29

### Fixed
- **Mobile Browse feed single-column collapse** — corrected responsive breakpoint threshold in `useMasonryColumns.ts` so that standard mobile viewports (300px–640px, including 320px, 360px Samsung Galaxy, and 375px iPhone SE/11 Pro) consistently render the intended 2-column grid instead of collapsing to 1 column.
- **Post view tracking column schema alignment** — fixed column selection in `POST /api/posts/[id]/view` to correctly query `view_count` on post lookup and fallback updates.
- **Post deletion relationship cascades** — ensured hard-deleting a post via admin panel correctly purges associated critique replies and reply read tracking rows.

### Improved
- **Mobile WebView & PWA scaling reliability** — explicitly specified `width: "device-width", initialScale: 1` in Next.js root layout `viewport` metadata.
- **View tracking visibility sensitivity** — tuned intersection observer visibility threshold in `useViewTracker.ts` to `0.2` for smoother viewport engagement capture.
- **Conversational engagement analytics** — added `getEngagementMetrics` query in admin service to report discussion volume, participating critique ratios, and thread engagement without altering core review ratings.

---

## [1.2.1] — 2026-08-28

### Fixed
- **Push subscription registration schema mismatch** — resolved HTTP 500 error on `POST /api/notifications/push/subscribe` by ensuring the `expires_at` column is present and properly recognized in the database schema.
- **Serverless critique reply notification persistence** — transitioned notification dispatch from an unawaited, detached fire-and-forget IIFE to an awaited helper function in the reply route handler, preventing serverless runtime termination from interrupting notification creation.
- **Non-blocking notification error isolation** — ensured any notification delivery errors are logged with contextual telemetry without blocking or failing the HTTP 201 reply creation response.

### Improved
- **Notification observability** — added structured diagnostic logging across the critique reply notification pipeline.
- **Regression test coverage** — added an automated unit and regression test suite covering all critique reply notification priority, deduplication, and suppression flows.

---

## [1.2.0] — 2026-08-28

### Added
- **What's New splash** — version-specific first-open modal (`WhatsNewModal`) with animated preview, shown once per release and dismissible to the About tab.
- **Threaded critique replies** — creatives can reply directly to individual critiques with mention notifications and read tracking.
- **Deep-linked push notifications** — web push payloads now route to the specific post, review, or reply that triggered them.
- **New Work notifications** — push event fired when a creator publishes new work, delivered to followers.
- **Feedback follow pipeline** — push notifications for replies on community feedback posts.
- **Search Intelligence dashboard** — secure admin server action with a 3-column telemetry view for search analytics.
- **`notify_replies` preference** — per-user notification control for critique reply events.
- **Report flow for replies** — users can report inappropriate replies from the critique thread.

### Improved
- **Search relevance** — overhauled Algolia ranking, real-time index sync, dynamic autocomplete, and improved empty state suggestions.
- **Web push delivery** — parallelised batch dispatch; notifications now await serverless execution correctly.
- **Settings — About tab** — refined layout, removed logo crop artefact, and cleaner section hierarchy.
- **Critique reply card styling** — tightened spacing and visual hierarchy in the reply thread.
- **Quick actions on push notifications** — action buttons on delivered notifications for faster in-context responses.

### Fixed
- **Profile relationship ambiguity** — disambiguated `reviews → profiles` join in `getReviewsByPostId` to prevent Supabase query errors.
- **Null post description crash** — guarded against null descriptions in the post detail view to prevent render failures.
- **Feedback board mobile layout** — corrected column layout on small screens.
- **In-place auth on feedback** — auth state now hydrates instantly on the feedback page without a full reload.
