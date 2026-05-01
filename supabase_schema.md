# Production Supabase Schema for Rater

This document provides a normalized, scalable PostgreSQL schema for Rater. It translates the current mock system into a production-ready Supabase architecture.

---

## 1. Table Relationships

- **profiles** (replaces Avatars)
  - Primary Key: `id` (UUID, links to `auth.users`)
- **posts**
  - Foreign Key: `avatar_id` → `profiles.id`
- **reviews**
  - Foreign Key: `post_id` → `posts.id`
  - Foreign Key: `reviewer_id` → `profiles.id` (nullable)
- **badges**
  - Foreign Key: `post_id` → `posts.id`

---

## 2. Core SQL Schema

### Extensions & Types
```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enum for Badge Types
create type badge_type as enum ('top_rated_active', 'top_rated_previous');
```

### Tables

#### Categories
```sql
create table categories (
  name text primary key
);

insert into categories (name) values 
  ('Web Design'), ('Mobile App Design'), ('Brand Identity Design'), 
  ('Logo Design'), ('Poster Design'), ('Flyer Design'), 
  ('Social Media Design'), ('AI Image'), ('3D Design');
```

#### Profiles
```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  name text not null,
  role text,
  avatar_url text,
  bg_color text default '#FEC312',
  bio text,
  is_blocked boolean default false,
  passkey text, -- TEMP DEV ONLY (REMOVE WHEN FULL AUTH IS IMPLEMENTED)
  social_links jsonb default '[]'::jsonb,
  username_last_changed_at timestamptz,
  previous_usernames text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  constraint username_length check (char_length(username) >= 3)
);
```

#### Posts
```sql
create table posts (
  id uuid default uuid_generate_v4() primary key,
  avatar_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  category text references categories(name) not null,
  image_url text not null,
  is_deleted boolean default false,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

#### Reviews
```sql
create table reviews (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references posts(id) on delete cascade not null,
  reviewer_id uuid references profiles(id) on delete set null,
  reviewer_name text, -- For guest reviews
  device_id text,     -- For anonymous rate limiting
  clarity integer check (clarity >= 1 and clarity <= 5),
  purpose integer check (purpose >= 1 and purpose <= 5),
  aesthetics integer check (aesthetics >= 1 and aesthetics <= 5),
  comment text,
  created_at timestamptz default now()
);
```

#### Badges
```sql
create table badges (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references posts(id) on delete cascade not null,
  badge_type badge_type not null,
  awarded_at timestamptz default now()
);
```

---

## 3. Computed Metrics (Views)

Using a view for metrics ensures that average ratings and review counts are always accurate without needing to "sync" state in the frontend.

```sql
create or replace view post_metrics as
select 
  p.id as post_id,
  count(r.id) as review_count,
  coalesce(round(avg((r.clarity + r.purpose + r.aesthetics) / 3.0), 1), 0) as average_score,
  (count(r.id) >= 5) as rating_unlocked
from posts p
left join reviews r on p.id = r.post_id
group by p.id;
```

---

## 4. Performance Indexes

```sql
-- Speed up feed loading (newest first)
create index idx_posts_created_at on posts(created_at desc);

-- Speed up profile page loading (author's posts)
create index idx_posts_avatar_id on posts(avatar_id);

-- Speed up rating calculation
create index idx_reviews_post_id on reviews(post_id);

-- Speed up URL/Slug lookups
create index idx_profiles_username on profiles(username);

-- Prevent multiple active 'top_rated_active' badges per post
create index if not exists unique_active_badge_per_post
on badges(post_id)
where badge_type = 'top_rated_active';

-- Speed up filtering of active posts
create index idx_posts_not_deleted on posts(is_deleted);
```

---

## 5. Security (Row Level Security)

```sql
-- Profiles: Everyone can see, owner can edit
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- Posts: Everyone can see, owner can edit
alter table posts enable row level security;
create policy "Posts are viewable by everyone." on posts for select using (true);
create policy "Owners can manage own posts." on posts for all using (auth.uid() = avatar_id);

-- Reviews: Everyone can see, anyone can add (for guest rating support)
alter table reviews enable row level security;
create policy "Reviews are viewable by everyone." on reviews for select using (true);
create policy "Anyone can insert reviews." on reviews for insert with check (true);
```

---

## 6. Tradeoffs & Improvements

| Feature | Design Choice | Reason |
| :--- | :--- | :--- |
| **Metrics** | View (Dynamic) | **Better Accuracy**: Avoids manual re-calculation or race conditions when multiple users rate at once. |
| **History** | `TEXT[]` Array | **Simplicity**: Your frontend logic for redirects is already designed for arrays; a separate table adds join overhead for a simple check. |
| **Social Links** | `JSONB` | **Flexibility**: No schema migrations needed when you add new social platforms (e.g., Threads, LinkedIn). |
| **ID System** | UUID | **Security**: UUIDs prevent "ID guessing" (scrapers can't just increment `post_1` to `post_2`). |
