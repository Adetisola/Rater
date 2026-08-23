# Rater

A design critique platform where creatives submit their work and receive structured peer feedback across visual hierarchy, typography, usability, and execution craft.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js (App Router, Turbopack) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4 |
| **Database & Auth** | Supabase (PostgreSQL, Row-Level Security, Auth) |
| **Image CDN & Storage** | Cloudinary (dynamic WebP/AVIF transformation) & Supabase Storage |
| **Push Notifications** | Web Push API + Service Worker (`public/sw.js`) |
| **Search Engine** | Algolia |
| **Global State** | React Context (Auth, Posts, Time) |
| **Ephemeral State** | Zustand (post navigation & gestures) |
| **Motion & Micro-interactions** | Framer Motion + GSAP |
| **Icons** | Lucide React |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (Turbopack)
npm run dev

# Run production build & typecheck
npm run build

# Start production server
npm start
```

The app runs locally at `http://localhost:3000`.

---

## Routing Architecture

| Route | Description |
|---|---|
| `/` | Landing page featuring product philosophy and interactive demo |
| `/browse` | Main critique feed with filter bar, sorting, and category pills |
| `/submit` | Multi-step post submission workflow |
| `/post/[id]` | Full post inspection canvas, peer reviews, pulse reactions, and AI insights |
| `/@username` | Public creator profile, portfolio grid, and stats |
| `/feedback` | Community feedback and bug reporting page |
| `/legal` | Root redirect → `/legal/community-guidelines` |
| `/legal/community-guidelines` | Critique code of conduct, rating standards, and rules |
| `/legal/ai-insights` | AI synthesis policy and non-generative training guarantee |
| `/legal/terms` | Terms of service and creator copyright protections |
| `/legal/privacy` | Privacy policy, data handling, and deletion rights |
| `/admin` | Admin moderation and campaign dashboard |

---

## Project Structure

```
src/
├── app/                        # Next.js App Router pages & layouts
│   ├── (main)/                 # Main authenticated/browse route group
│   │   ├── layout.tsx          # Keep-alive layout & global footer
│   │   ├── browse/             # Feed exploration
│   │   ├── submit/             # Post submission
│   │   ├── post/[id]/          # Post detail & review thread
│   │   ├── feedback/           # Feedback submission page
│   │   └── legal/              # Legal & Resources Hub (2-column layout)
│   │       ├── layout.tsx      # Sidebar + reader container
│   │       ├── community-guidelines/
│   │       ├── ai-insights/
│   │       ├── terms/
│   │       └── privacy/
│   ├── [alias]/                # Dynamic /@username profile routes
│   ├── api/                    # Serverless API routes (insights, webhooks, push)
│   ├── admin/                  # Admin management dashboard
│   ├── auth/                   # Auth callbacks & profile completion
│   ├── layout.tsx              # Root HTML layout & global providers
│   └── not-found.tsx           # 404 error page
│
├── components/                 # UI components
│   ├── legal/                  # LegalNav sidebar & mobile tabs
│   ├── notifications/          # Notification sheet, popovers, and badges
│   ├── admin/                  # Admin management panels & sidebar
│   ├── ui/                     # Primitives: Button, Input, Modal, Tooltip
│   ├── Header.tsx              # Universal app header
│   ├── UserMenu.tsx            # Multi-tier user profile & resource menu
│   ├── SettingsOverlay.tsx     # Modernized row-based settings modal
│   ├── PostThumbnail.tsx       # Cloudinary-optimized self-dimensioning thumbnail
│   ├── PostCard.tsx            # Masonry card in feed
│   ├── PostDetailContent.tsx   # Detailed post view with gesture navigation
│   └── Footer.tsx              # Main application link hub footer
│
├── context/                    # React Context providers
│   ├── AuthContext.tsx         # User authentication & profile state
│   ├── PostContext.tsx         # Feed data & post mutations
│   └── TimeContext.tsx         # Synced relative timestamps
│
├── hooks/                      # Custom hooks
│   ├── useBadges.ts            # Top Rated badge calculations
│   ├── usePostMetrics.ts       # Review score aggregation
│   ├── usePWAInstall.ts        # PWA installation prompting
│   └── ...
│
├── lib/                        # Domain logic & third-party clients
│   ├── supabase/               # Supabase browser & admin clients
│   ├── cloudinary.ts           # Centralized image transformation engine
│   ├── notifications/          # Web Push client & subscriptions
│   ├── account/                # Self-serve account deletion & profile management
│   └── algolia/                # Algolia search index synchronization
│
├── types/                      # Centralized TypeScript declarations
│   └── index.ts                # Post, Profile, Review, Category, Campaign types
│
└── features/                   # Standalone feature modules
    └── landing/                # Landing page sections & status footer
```

---

## Key Platform Systems

### 1. Unified Legal & Resources Hub
- 2-column desktop layout with sticky navigation sidebar ([LegalNav.tsx](file:///c:/Users/TImilehin/Documents/Learn/Website%20Learn/Web%20Project/Vibe%20Coding/Rater%20Web%20App%20V1%20-%20Experimental/src/components/legal/LegalNav.tsx)) and horizontal mobile pill navigation.
- Dedicated routes for Community Guidelines, AI & Insights Policy, Terms of Service, and Privacy Policy.
- 100% creator copyright ownership policy and strict non-generative model training safeguards.

### 2. Universal Image Optimization Pipeline
- Centralized through [src/lib/cloudinary.ts](file:///c:/Users/TImilehin/Documents/Learn/Website%20Learn/Web%20Project/Vibe%20Coding/Rater%20Web%20App%20V1%20-%20Experimental/src/lib/cloudinary.ts) and `<PostThumbnail />`.
- Automatic format negotiation (`f_auto`, WebP/AVIF), progressive quality compression (`q_auto:good`), and aspect-ratio preservation without layout shift.

### 3. Modern Settings Architecture
- Row-based settings architecture ([SettingsOverlay.tsx](file:///c:/Users/TImilehin/Documents/Learn/Website%20Learn/Web%20Project/Vibe%20Coding/Rater%20Web%20App%20V1%20-%20Experimental/src/components/SettingsOverlay.tsx)) with clean hairline dividers, brand yellow active toggles, notification channel switches, and self-serve account deletion.

### 4. User Navigation & Hierarchy
- Multi-tier [UserMenu.tsx](file:///c:/Users/TImilehin/Documents/Learn/Website%20Learn/Web%20Project/Vibe%20Coding/Rater%20Web%20App%20V1%20-%20Experimental/src/components/UserMenu.tsx) featuring an interactive Profile Header card, Creative Actions, and side-flyout Help & Resources submenu.

### 5. Web Push & Notifications
- Browser push notification subscriptions via standard Web Push API and background service worker.
- In-app notification sheets and granular user preference controls (Critiques, Milestones, Insights).

### 6. Acquisition & Campaign Attribution
- Automatic tracking of campaign referral links (`?ref=`, `?campaign=`) captured at onboarding and stored on creator profiles.

---

## Naming & Style Conventions

- **Components**: PascalCase (`PostCard.tsx`, `SettingsOverlay.tsx`)
- **Hooks**: camelCase with `use` prefix (`usePostMetrics.ts`, `usePWAInstall.ts`)
- **Types**: PascalCase interfaces and types declared in `src/types/index.ts`
- **Context**: `[Name]Context.tsx` exporting a typed `use[Name]()` hook
- **Terminology**: Always use **Profile** (never "Avatar") in user-facing copy, **Creatives**, **Work**, and **Insights**.