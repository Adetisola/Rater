# Rater

A design review platform where creatives submit their work and receive structured community feedback across clarity, purpose, and aesthetics.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| State (global) | React Context (Auth, Posts, Time) |
| State (ephemeral) | Zustand (navigation) |
| Animations | Framer Motion + Lottie |
| Search | Fuse.js (client-side fuzzy search) |
| Icons | Lucide React |
| PWA | Custom service worker (`public/sw.js`) |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (Turbopack)
npm run dev

# Production build
npm run build

# Start production server
npm start
```

The app runs at `http://localhost:3000`.

## Folder Structure

```
src/
├── app/                    # Next.js App Router pages & layouts
│   ├── (main)/             # Main route group (browse, submit, post, avatar)
│   │   ├── layout.tsx      # Keep-alive layout for scroll restoration
│   │   ├── browse/         # Browse feed page
│   │   ├── submit/         # Post submission page
│   │   ├── post/[id]/      # Post detail page
│   │   └── avatar/         # Redirect helper → /@username
│   ├── [alias]/            # Dynamic /@username profile pages
│   ├── layout.tsx          # Root layout (providers, global overlays)
│   └── not-found.tsx       # 404 page
│
├── components/             # All UI components (flat structure)
│   ├── ui/                 # Primitives: Button, Input, StarRating, Textarea
│   ├── Header.tsx          # App header with search, filters, navigation
│   ├── PostCard.tsx         # Card in masonry grid
│   ├── PostDetailContent.tsx # Full post view with reviews + gestures
│   ├── ProfileView.tsx     # User profile with edit mode
│   ├── BrowseContent.tsx   # Feed with sorting/filtering/search
│   ├── ReviewForm.tsx      # Structured review submission form
│   └── ...                 # ~45 components total
│
├── context/                # React Context providers
│   ├── AuthContext.tsx      # User session, login/signup, avatar management
│   ├── PostContext.tsx      # Post CRUD, soft-delete, localStorage persistence
│   └── TimeContext.tsx      # Shared "now" timestamp for relative times
│
├── hooks/                  # Custom React hooks
│   ├── useBadges.ts         # Badge computation (Top Rated, etc.)
│   ├── useHotPosts.ts       # Hot post detection
│   ├── usePostMetrics.ts    # Post rating calculations
│   ├── useMasonryColumns.ts # Responsive column count
│   ├── useDebounce.ts       # Input debouncing
│   └── ...                  # 12 hooks total
│
├── logic/                  # Business logic & mock database
│   ├── mockData.ts          # Mock DB: avatars, posts, reviews, metrics
│   ├── badgeUtils.ts        # Badge computation logic
│   ├── curatedSort.ts       # Curated feed sorting algorithm
│   ├── hotPostUtils.ts      # Hot post scoring
│   └── searchUtils.ts       # Fuse.js search index & query logic
│
├── types/                  # Centralized TypeScript types
│   └── index.ts             # Post, Avatar, Review, Category, Badge, etc.
│
├── utils/                  # Pure utility functions (no app state)
│   ├── dateUtils.ts         # Relative timestamp formatting
│   ├── passkeyValidation.ts # Password strength validation
│   ├── socialLinksUtils.ts  # Social link detection & formatting
│   ├── usernameUtils.ts     # Username generation
│   ├── draftManager.ts      # Review draft localStorage persistence
│   └── deviceTracking.ts    # Anonymous device ID management
│
├── store/                  # Zustand stores
│   └── navigationStore.ts   # Post navigation context (swipe between posts)
│
├── lib/                    # Shared utilities
│   ├── utils.ts             # cn() helper (shadcn/ui convention)
│   ├── constants.ts         # Reserved routes, app constants
│   └── postActions.ts       # Share & download actions
│
└── features/               # Feature-specific modules
    └── landing/             # Landing page components
```

## Routing

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/browse` | Main feed with masonry grid |
| `/submit` | Post submission form |
| `/post/[id]` | Post detail with reviews |
| `/@username` | User profile |
| `/avatar` | Redirects to `/@username` |

Legacy `/app/*` routes are permanently redirected via `next.config.ts`.

## State Management

**React Context** manages app-wide persistent state:
- `AuthContext` — Current user session, all avatars, login/signup/logout
- `PostContext` — Post list, CRUD operations, soft-delete
- `TimeContext` — Shared `Date.now()` updated every 30s for relative timestamps

**Zustand** manages ephemeral navigation state:
- `navigationStore` — Tracks post navigation context for swipe-between-posts gesture

All data currently persists to **localStorage** as the app uses mock data. Each persistence point is marked with `TODO(backend)` comments for the Supabase migration.

## Key Systems

### Scroll Restoration
The `(main)/layout.tsx` uses a visibility-based keep-alive pattern to preserve the browse feed's scroll position across navigations. `ScrollRestorationProvider` handles per-route restoration.

### Gesture Navigation
`PostDetailContent.tsx` supports swipe-to-navigate between posts using Framer Motion drag gestures, with keyboard arrow key support.

### Search
Client-side fuzzy search powered by Fuse.js with debounced input. Indexes posts, avatars, and categories. Desktop uses an inline dropdown; mobile uses a fullscreen overlay.

### PWA
Service worker at `public/sw.js` with offline support and install prompting via `useInstallPrompt` hook.

## Naming Conventions

- **Components**: PascalCase (`PostCard.tsx`, `ReviewForm.tsx`)
- **Hooks**: camelCase with `use` prefix (`useBadges.ts`, `useDebounce.ts`)
- **Utils**: camelCase (`dateUtils.ts`, `draftManager.ts`)
- **Types**: PascalCase interfaces/types in `src/types/index.ts`
- **Context**: `[Name]Context.tsx` exporting `use[Name]()` hook

## Backend Migration Notes

The codebase is prepared for Supabase integration. All mock data access points are marked with `TODO(backend)` comments. The migration strategy:

1. **Types are decoupled** — `src/types/index.ts` defines all domain types independently of mock data
2. **Mock data is isolated** — All mock DB operations live in `src/logic/mockData.ts`
3. **Contexts are the seam** — `AuthContext` and `PostContext` are the only consumers of mock data that components depend on
4. **localStorage markers** — Every localStorage usage has a `TODO(backend)` explaining what to replace it with

When migrating: replace `mockData.ts` exports with Supabase queries, update the two context files, and remove localStorage persistence. Components should not need changes.