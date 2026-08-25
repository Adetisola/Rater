-- Migration: 20260826000000_create_critique_replies.sql
-- Description: Create critique_replies and critique_reply_reads tables with RLS and updated reports constraints.

-- 1. Create critique_replies table
CREATE TABLE IF NOT EXISTS public.critique_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  critique_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_reply_id UUID REFERENCES public.critique_replies(id) ON DELETE SET NULL,
  content TEXT NOT NULL CHECK (char_length(trim(content)) > 0 AND char_length(content) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Indexes for efficient querying and thread hierarchy
CREATE INDEX IF NOT EXISTS idx_critique_replies_critique_created 
  ON public.critique_replies(critique_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_critique_replies_parent 
  ON public.critique_replies(parent_reply_id) WHERE parent_reply_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_critique_replies_author 
  ON public.critique_replies(author_id);

-- 2. Create critique_reply_reads table (Unread activity tracking per user & critique)
CREATE TABLE IF NOT EXISTS public.critique_reply_reads (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  critique_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  last_read_reply_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, critique_id)
);

CREATE INDEX IF NOT EXISTS idx_critique_reply_reads_user 
  ON public.critique_reply_reads(user_id);

-- 3. Update reports table constraint to support 'reply' and 'review'
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_target_type_check;
ALTER TABLE public.reports ADD CONSTRAINT reports_target_type_check 
  CHECK (target_type IN ('post', 'profile', 'reply', 'review'));

-- 4. Enable Row Level Security
ALTER TABLE public.critique_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.critique_reply_reads ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for critique_replies
DROP POLICY IF EXISTS "Public can view active or tombstoned replies" ON public.critique_replies;
CREATE POLICY "Public can view active or tombstoned replies" ON public.critique_replies
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS "Auth users can insert replies" ON public.critique_replies;
CREATE POLICY "Auth users can insert replies" ON public.critique_replies
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = author_id) AND NOT is_current_user_blocked());

DROP POLICY IF EXISTS "Authors can update own replies" ON public.critique_replies;
CREATE POLICY "Authors can update own replies" ON public.critique_replies
  FOR UPDATE TO authenticated
  USING ((auth.uid() = author_id) AND NOT is_current_user_blocked())
  WITH CHECK ((auth.uid() = author_id) AND NOT is_current_user_blocked());

DROP POLICY IF EXISTS "Authors and admins can delete replies" ON public.critique_replies;
CREATE POLICY "Authors and admins can delete replies" ON public.critique_replies
  FOR UPDATE TO authenticated
  USING (
    (auth.uid() = author_id OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
    )) 
    AND NOT is_current_user_blocked()
  );

-- 6. RLS Policies for critique_reply_reads
DROP POLICY IF EXISTS "Users manage own read state" ON public.critique_reply_reads;
CREATE POLICY "Users manage own read state" ON public.critique_reply_reads
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
