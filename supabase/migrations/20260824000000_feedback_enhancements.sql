-- Migration: 20260824000000_feedback_enhancements.sql
-- Description: Adds feedback_follows table, official response fields, comment soft deletion, and updated view.

-- 1. Create feedback_follows table
CREATE TABLE IF NOT EXISTS public.feedback_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.feedback_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT feedback_follows_request_user_unique UNIQUE(request_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_feedback_follows_request ON public.feedback_follows(request_id);
CREATE INDEX IF NOT EXISTS idx_feedback_follows_user ON public.feedback_follows(user_id);

-- Enable RLS on feedback_follows
ALTER TABLE public.feedback_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own follows" ON public.feedback_follows;
CREATE POLICY "Users can view own follows" ON public.feedback_follows
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Auth users can follow feedback" ON public.feedback_follows;
CREATE POLICY "Auth users can follow feedback" ON public.feedback_follows
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() = user_id) AND NOT is_current_user_blocked());

DROP POLICY IF EXISTS "Users can unfollow feedback" ON public.feedback_follows;
CREATE POLICY "Users can unfollow feedback" ON public.feedback_follows
  FOR DELETE
  TO public
  USING ((auth.uid() = user_id) AND NOT is_current_user_blocked());

-- 2. Add official response columns to feedback_requests
ALTER TABLE public.feedback_requests 
  ADD COLUMN IF NOT EXISTS official_response TEXT,
  ADD COLUMN IF NOT EXISTS official_response_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS official_response_at TIMESTAMPTZ;

-- 3. Add soft-delete columns to feedback_comments
ALTER TABLE public.feedback_comments 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 4. Update feedback_requests_with_stats View
CREATE OR REPLACE VIEW public.feedback_requests_with_stats AS
SELECT 
  fr.id,
  fr.title,
  fr.description,
  fr.type,
  fr.category,
  fr.status,
  fr.slug,
  fr.author_id,
  fr.is_pinned,
  fr.is_locked,
  fr.admin_notes,
  fr.official_response,
  fr.official_response_by,
  fr.official_response_at,
  fr.created_at,
  fr.updated_at,
  fr.deleted_at,
  fr.deleted_by,
  fr.fts,
  COALESCE(v.upvote_count, 0)::integer AS upvote_count,
  COALESCE(c.comment_count, 0)::integer AS comment_count,
  COALESCE(f.follow_count, 0)::integer AS follow_count
FROM public.feedback_requests fr
LEFT JOIN (
  SELECT request_id, COUNT(*)::integer AS upvote_count
  FROM public.feedback_votes
  GROUP BY request_id
) v ON v.request_id = fr.id
LEFT JOIN (
  SELECT request_id, COUNT(*)::integer AS comment_count
  FROM public.feedback_comments
  WHERE deleted_at IS NULL
  GROUP BY request_id
) c ON c.request_id = fr.id
LEFT JOIN (
  SELECT request_id, COUNT(*)::integer AS follow_count
  FROM public.feedback_follows
  GROUP BY request_id
) f ON f.request_id = fr.id
WHERE fr.deleted_at IS NULL;
