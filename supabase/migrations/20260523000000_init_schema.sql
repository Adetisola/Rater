-- =========================================================================
-- RATER PRODUCTION SCHEMA - PHASE 1 SQL MIGRATION
-- =========================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enum for Badge Types
create type badge_type as enum ('top_rated_active', 'top_rated_previous');

-- -------------------------------------------------------------------------
-- 1. Table Definitions
-- -------------------------------------------------------------------------

-- Categories Table
create table categories (
  name text primary key
);

-- Profiles Table (Linked 1:1 to Supabase auth.users)
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
  passkey text, -- TEMP DEV ONLY (REMOVE IN STAGE/PROD MIGRATION FLOW)
  social_links jsonb default '[]'::jsonb,
  username_last_changed_at timestamptz,
  previous_usernames text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  constraint username_length check (char_length(username) >= 3)
);

-- Posts Table
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

-- Reviews Table
create table reviews (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references posts(id) on delete cascade not null,
  reviewer_id uuid references profiles(id) on delete set null,
  reviewer_name text, -- For guest reviews
  device_id text,     -- For anonymous rate limiting tracking
  clarity integer check (clarity >= 1 and clarity <= 5),
  purpose integer check (purpose >= 1 and purpose <= 5),
  aesthetics integer check (aesthetics >= 1 and aesthetics <= 5),
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  constraint unique_member_rating_per_post unique (post_id, reviewer_id),
  constraint unique_guest_rating_per_post unique (post_id, device_id)
);

-- Badges Table
create table badges (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references posts(id) on delete cascade not null,
  badge_type badge_type not null,
  awarded_at timestamptz default now()
);

-- -------------------------------------------------------------------------
-- 2. Populate Static Seeds
-- -------------------------------------------------------------------------
insert into categories (name) values 
  ('Web Design'), ('Mobile App Design'), ('Brand Identity Design'), 
  ('Mockup Design'), ('Logo Design'), ('Poster Design'), 
  ('Flyer Design'), ('Social Media Design'), ('AI Image'), 
  ('3D Design'), ('Packaging Design'), ('Banner Design'), 
  ('Ad Creative Design'), ('Illustration'), ('Icon Design'), 
  ('Typography Design'), ('UI Design'), ('Landing Page Design'), 
  ('Dashboard Design')
on conflict (name) do nothing;

-- -------------------------------------------------------------------------
-- 3. Automatic Timestamps Automation
-- -------------------------------------------------------------------------
create or replace function public.update_modified_column()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_profiles_modtime 
  before update on profiles 
  for each row execute procedure public.update_modified_column();

create trigger update_posts_modtime 
  before update on posts 
  for each row execute procedure public.update_modified_column();

create trigger update_reviews_modtime 
  before update on reviews 
  for each row execute procedure public.update_modified_column();

-- -------------------------------------------------------------------------
-- 4. Auth Sync Triggers (auth.users -> profiles)
-- -------------------------------------------------------------------------
create schema if not exists internal;

create or replace function internal.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure internal.handle_new_user();

-- Revoke standard execute privileges on triggers from public to prevent RPC exploits
revoke execute on function internal.handle_new_user() from public;
revoke execute on function public.update_modified_column() from public;

-- -------------------------------------------------------------------------
-- 5. Views for Dynamic Rating Aggregates
-- -------------------------------------------------------------------------
create or replace view post_metrics with (security_invoker = true) as
select 
  p.id as post_id,
  count(r.id) as review_count,
  coalesce(round(avg((r.clarity + r.purpose + r.aesthetics) / 3.0), 1), 0) as average_score,
  (count(r.id) >= 3) as rating_unlocked
from posts p
left join reviews r on p.id = r.post_id
group by p.id;

-- -------------------------------------------------------------------------
-- 6. Performance Indices Setup
-- -------------------------------------------------------------------------
create index idx_posts_created_at on posts(created_at desc);
create index idx_posts_avatar_id on posts(avatar_id);
create index idx_reviews_post_id on reviews(post_id);
create index idx_profiles_username on profiles(username);
create index idx_posts_not_deleted on posts(is_deleted);

-- Composite index for fast chronological paginated listings of active posts
create index if not exists idx_posts_active_pagination 
on posts (is_deleted, created_at desc);

-- Covering index on reviews to permit index-only scans for post_metrics aggregates
create index if not exists idx_reviews_covering_aggregates
on reviews (post_id) 
include (clarity, purpose, aesthetics);

-- Prevent multiple active 'top_rated_active' badges on a single post
create index unique_active_badge_per_post
on badges(post_id)
where badge_type = 'top_rated_active';

-- -------------------------------------------------------------------------
-- 7. Row Level Security Policies Configurations
-- -------------------------------------------------------------------------

-- A. Categories: Viewable by anyone
alter table categories enable row level security;
create policy "Categories are viewable by everyone." on categories for select using (true);

-- B. Profiles: Viewable by anyone, editable only by profile owner
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- C. Posts: Viewable by anyone, manageable only by post owner
alter table posts enable row level security;
create policy "Posts are viewable by everyone." on posts for select using (true);
create policy "Owners can manage own posts." on posts for all using (auth.uid() = avatar_id);

-- D. Reviews: Viewable by anyone, creatable by anyone (supporting guest ratings)
alter table reviews enable row level security;
create policy "Reviews are viewable by everyone." on reviews for select using (true);
create policy "Anyone can insert reviews." on reviews for insert
with check (
  (reviewer_id is not null and auth.uid() = reviewer_id)
  or
  (reviewer_id is null and device_id is not null)
);

-- E. Badges: Viewable by anyone
alter table badges enable row level security;
create policy "Badges are viewable by everyone." on badges for select using (true);
