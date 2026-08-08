-- Migration: 20260806000000_secure_reviews_rls
-- Description: Enforce strict authenticated access control on reviews table and remove guest vulnerabilities.

-- 1. Drop the permissive public insert policy (which allowed spoofing device_id)
DROP POLICY IF EXISTS "Anyone can insert reviews." ON public.reviews;

-- 2. Drop the insecure guest update policy (if it exists, we manually dropped it earlier but this ensures idempotency)
DROP POLICY IF EXISTS "Guests can update their own reviews by device" ON public.reviews;

-- 3. Ensure "Authenticated users can insert reviews" is strict.
-- It currently has: ((auth.uid() = reviewer_id) AND (auth.uid() <> ( SELECT posts.avatar_id FROM posts WHERE (posts.id = reviews.post_id))))
-- We will recreate it to be safe and explicit.
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON public.reviews;
CREATE POLICY "Authenticated users can insert reviews" 
ON public.reviews FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = reviewer_id AND 
  auth.uid() <> (SELECT avatar_id FROM public.posts WHERE id = post_id)
);

-- 4. Ensure UPDATE and DELETE strictly require auth.uid() = reviewer_id
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews" 
ON public.reviews FOR UPDATE 
TO authenticated 
USING (auth.uid() = reviewer_id)
WITH CHECK (auth.uid() = reviewer_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews" 
ON public.reviews FOR DELETE 
TO authenticated 
USING (auth.uid() = reviewer_id);
