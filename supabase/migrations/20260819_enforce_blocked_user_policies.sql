-- Migration: 20260819_enforce_blocked_user_policies.sql
-- Enforce blocked user policies across all write paths and enable realtime for profiles table

-- 1. Create central security helper function
CREATE OR REPLACE FUNCTION public.is_current_user_blocked()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(
    (SELECT is_blocked FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_current_user_blocked() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_user_blocked() TO authenticated, anon;

-- 2. Update posts policies
DROP POLICY IF EXISTS "Owners can manage own posts." ON public.posts;
CREATE POLICY "Owners can manage own posts." ON public.posts
  FOR ALL
  TO authenticated
  USING ((auth.uid() = avatar_id) AND NOT is_current_user_blocked())
  WITH CHECK ((auth.uid() = avatar_id) AND NOT is_current_user_blocked());

-- 3. Update reviews policies
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON public.reviews;
CREATE POLICY "Authenticated users can insert reviews" ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = reviewer_id) 
    AND (auth.uid() <> (SELECT posts.avatar_id FROM public.posts WHERE posts.id = reviews.post_id))
    AND NOT is_current_user_blocked()
  );

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews" ON public.reviews
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = reviewer_id) AND NOT is_current_user_blocked())
  WITH CHECK ((auth.uid() = reviewer_id) AND NOT is_current_user_blocked());

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews" ON public.reviews
  FOR DELETE
  TO authenticated
  USING ((auth.uid() = reviewer_id) AND NOT is_current_user_blocked());

-- 4. Update reports policies
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (((reporter_id IS NULL) OR (reporter_id = auth.uid())) AND NOT is_current_user_blocked());

-- 5. Update profiles update policy
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = id) AND NOT is_current_user_blocked())
  WITH CHECK (
    (auth.uid() = id) 
    AND NOT is_current_user_blocked()
    AND (NOT (is_admin IS DISTINCT FROM (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid())))
    AND (NOT (is_blocked IS DISTINCT FROM (SELECT p.is_blocked FROM public.profiles p WHERE p.id = auth.uid())))
  );

-- 6. Update feedback_requests policies
DROP POLICY IF EXISTS "Auth can insert feedback requests" ON public.feedback_requests;
CREATE POLICY "Auth can insert feedback requests" ON public.feedback_requests
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() = author_id) AND NOT is_current_user_blocked());

DROP POLICY IF EXISTS "Owners can update own feedback requests" ON public.feedback_requests;
CREATE POLICY "Owners can update own feedback requests" ON public.feedback_requests
  FOR UPDATE
  TO public
  USING ((auth.uid() = author_id) AND (deleted_at IS NULL) AND NOT is_current_user_blocked());

-- 7. Update feedback_comments policies
DROP POLICY IF EXISTS "Auth can insert comments" ON public.feedback_comments;
CREATE POLICY "Auth can insert comments" ON public.feedback_comments
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() = author_id) AND NOT is_current_user_blocked());

DROP POLICY IF EXISTS "Owners can update own comments" ON public.feedback_comments;
CREATE POLICY "Owners can update own comments" ON public.feedback_comments
  FOR UPDATE
  TO public
  USING ((auth.uid() = author_id) AND NOT is_current_user_blocked());

DROP POLICY IF EXISTS "Owners can delete own comments" ON public.feedback_comments;
CREATE POLICY "Owners can delete own comments" ON public.feedback_comments
  FOR DELETE
  TO public
  USING ((auth.uid() = author_id) AND NOT is_current_user_blocked());

-- 8. Update feedback_votes policies
DROP POLICY IF EXISTS "Auth can insert votes" ON public.feedback_votes;
CREATE POLICY "Auth can insert votes" ON public.feedback_votes
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() = user_id) AND NOT is_current_user_blocked());

DROP POLICY IF EXISTS "Auth can delete own votes" ON public.feedback_votes;
CREATE POLICY "Auth can delete own votes" ON public.feedback_votes
  FOR DELETE
  TO public
  USING ((auth.uid() = user_id) AND NOT is_current_user_blocked());

-- 9. Update insight_cache policies
DROP POLICY IF EXISTS "Post owners can manage their insight cache" ON public.insight_cache;
CREATE POLICY "Post owners can manage their insight cache" ON public.insight_cache
  FOR ALL
  TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM public.posts WHERE posts.id = insight_cache.post_id AND posts.avatar_id = auth.uid()))
    AND NOT is_current_user_blocked()
  )
  WITH CHECK (
    (EXISTS (SELECT 1 FROM public.posts WHERE posts.id = insight_cache.post_id AND posts.avatar_id = auth.uid()))
    AND NOT is_current_user_blocked()
  );

-- 10. Enable Realtime on profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;
