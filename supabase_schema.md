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
  ('Mockup Design'), ('Logo Design'), ('Poster Design'), 
  ('Flyer Design'), ('Social Media Design'), ('AI Image'), 
  ('3D Design'), ('Packaging Design'), ('Banner Design'), 
  ('Ad Creative Design'), ('Illustration'), ('Icon Design'), 
  ('Typography Design'), ('UI Design'), ('Landing Page Design'), 
  ('Dashboard Design');
```

#### Profiles
```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  email text unique not null,
  show_email boolean default false,
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
  usability integer check (usability >= 1 and usability <= 5),
  recognition integer check (recognition >= 1 and recognition <= 5),
  impact integer check (impact >= 1 and impact <= 5),
  attention integer check (attention >= 1 and attention <= 5),
  composition integer check (composition >= 1 and composition <= 5),
  detail integer check (detail >= 1 and detail <= 5),
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
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

## 3. Automation & Triggers

### Timestamp Auto-Updates
```sql
-- Function to automatically update modified timestamps
create or replace function public.update_modified_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_modtime 
  before update on profiles 
  for each row execute procedure public.update_modified_column();

create trigger update_posts_modtime 
  before update on posts 
  for each row execute procedure public.update_modified_column();

create trigger update_reviews_modtime 
  before update on reviews 
  for each row execute procedure public.update_modified_column();
```

### Supabase Auth User Profile Sync
```sql
-- Function to automatically create a profile when a new user signs up in auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, email, name, role, bg_color, is_blocked)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substring(new.id::text from 1 for 8)),
    new.email,
    coalesce(new.raw_user_meta_data->>'name', 'New Member'),
    new.raw_user_meta_data->>'role',
    coalesce(new.raw_user_meta_data->>'bg_color', '#FEC312'),
    false
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## 4. Computed Metrics (Views)

Using a view for metrics ensures that average ratings and review counts are always accurate without needing to "sync" state in the frontend.

```sql
create or replace view post_metrics as
select 
  p.id as post_id,
  count(r.id) as review_count,
  coalesce(round(avg((r.clarity + r.purpose + r.aesthetics) / 3.0), 1), 0) as average_score,
  (count(r.id) >= 3) as rating_unlocked
from posts p
left join reviews r on p.id = r.post_id
group by p.id;
```

---

## 5. Performance Indexes

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

## 6. Security (Row Level Security)

```sql
-- Categories: Everyone can see
alter table categories enable row level security;
create policy "Categories are viewable by everyone." on categories for select using (true);

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

-- Badges: Everyone can see
alter table badges enable row level security;
create policy "Badges are viewable by everyone." on badges for select using (true);
```

---

## 7. Tradeoffs & Improvements

| Feature | Design Choice | Reason |
| :--- | :--- | :--- |
| **Metrics** | View (Dynamic) | **Better Accuracy**: Avoids manual re-calculation or race conditions when multiple users rate at once. |
| **History** | `TEXT[]` Array | **Simplicity**: Your frontend logic for redirects is already designed for arrays; a separate table adds join overhead for a simple check. |
| **Social Links** | `JSONB` | **Flexibility**: No schema migrations needed when you add new social platforms (e.g., Threads, LinkedIn). |
| **ID System** | UUID | **Security**: UUIDs prevent "ID guessing" (scrapers can't just increment `post_1` to `post_2`). |

