# Changelog

All notable changes to Rater are documented here.

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
