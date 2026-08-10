# Rater

A design review platform where creatives submit their work and receive structured community feedback across clarity, purpose, and aesthetics.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Database & Auth | Supabase |
| Image Hosting | Cloudinary & Supabase Storage |
| Search | Algolia |
| State (global) | React Context (Auth, Posts, Time) |
| State (ephemeral) | Zustand (navigation) |
| Animations | Framer Motion + Lottie |
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
│   ├── (main)/             # Main route group (browse, submit, post, settings)
│   │   ├── layout.tsx      # Keep-alive layout for scroll restoration
│   │   ├── browse/         # Browse feed page
│   │   ├── submit/         # Post submission page
│   │   ├── post/[id]/      # Post detail page
│   │   └── avatar/         # Redirect helper → /@username
│   ├── [alias]/            # Dynamic /@username profile pages
│   ├── api/                # Next.js API routes (webhooks, insights, etc.)
│   ├── admin/              # Admin dashboard
│   ├── auth/               # Auth callbacks and profile completion
│   ├── layout.tsx          # Root layout (providers, global overlays)
│   └── not-found.tsx       # 404 page
│
├── components/             # All UI components (flat structure)
│   ├── ui/                 # Primitives: Button, Input, StarRating, Textarea
│   ├── Header.tsx          # App header with search, filters, navigation
│   ├── PostCard.tsx        # Card in masonry grid
│   ├── PostDetailContent.tsx # Full post view with reviews + gestures
│   ├── ProfileView.tsx     # User profile with edit mode
│   ├── BrowseContent.tsx   # Feed with sorting/filtering/search
│   ├── ReviewForm.tsx      # Structured review submission form
│   └── ...                 # ~45 components total
│
├── context/                # React Context providers
│   ├── AuthContext.tsx     # User session, login/signup, avatar management
│   ├── PostContext.tsx     # Post CRUD, soft-delete
│   └── TimeContext.tsx     # Shared "now" timestamp for relative times
│
├── hooks/                  # Custom React hooks
│   ├── useBadges.ts        # Badge computation (Top Rated, etc.)
│   ├── useHotPosts.ts      # Hot post detection
│   ├── usePostMetrics.ts   # Post rating calculations
│   └── ...                 # 12 hooks total
│
├── lib/                    # Shared utilities & services
│   ├── supabase/           # Supabase client and admin initialization
│   ├── algolia/            # Algolia search integration
│   ├── posts.ts            # Post domain service
│   ├── profiles.ts         # Profile domain service
│   └── utils.ts            # cn() helper (shadcn/ui convention)
│
├── types/                  # Centralized TypeScript types
│   └── index.ts            # Post, Avatar, Review, Category, Badge, etc.
│
├── store/                  # Zustand stores
│   └── navigationStore.ts  # Post navigation context (swipe between posts)
│
└── features/               # Feature-specific modules
    └── landing/            # Landing page components
```

## Routing

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/browse` | Main feed with masonry grid |
| `/submit` | Post submission form |
| `/post/[id]` | Post detail with reviews |
| `/@username` | User profile |
| `/admin` | Admin dashboard |
| `/settings` | User settings |

Legacy `/app/*` routes are permanently redirected via `next.config.ts`.

## Key Systems

### Scroll Restoration
The `(main)/layout.tsx` uses a visibility-based keep-alive pattern to preserve the browse feed's scroll position across navigations. `BrowseVisibilityController` handles per-route restoration.

### Gesture Navigation
`PostDetailContent.tsx` supports swipe-to-navigate between posts using Framer Motion drag gestures, with keyboard arrow key support.

### Database & Auth
The application is fully integrated with **Supabase**. Authentication is handled via Supabase Auth (with middleware checks for admin routes). Data is fetched directly from Postgres using the Supabase JS client. Server-side API routes handle secure operations.

### Search
Powered by **Algolia** on the server for full-text search across posts and profiles.

### PWA
Service worker at `public/sw.js` with offline support and install prompting via `useInstallPrompt` hook.

## Naming Conventions

- **Components**: PascalCase (`PostCard.tsx`, `ReviewForm.tsx`)
- **Hooks**: camelCase with `use` prefix (`useBadges.ts`, `useDebounce.ts`)
- **Types**: PascalCase interfaces/types in `src/types/index.ts`
- **Context**: `[Name]Context.tsx` exporting `use[Name]()` hook