CREATE OR REPLACE FUNCTION record_post_view(
    p_post_id UUID,
    p_viewer_id UUID,
    p_guest_session_hash TEXT,
    p_ip_hash TEXT,
    p_user_agent_hash TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_recent_view_exists BOOLEAN;
BEGIN
    -- Check if a view exists within the last hour for this specific user/guest
    SELECT EXISTS (
        SELECT 1 
        FROM post_views
        WHERE post_id = p_post_id
          AND (
              (p_viewer_id IS NOT NULL AND viewer_id = p_viewer_id)
              OR 
              (p_guest_session_hash IS NOT NULL AND guest_session_hash = p_guest_session_hash)
              OR
              (p_ip_hash IS NOT NULL AND ip_hash = p_ip_hash)
          )
          AND created_at > (NOW() - INTERVAL '1 hour')
    ) INTO v_recent_view_exists;

    -- If a recent view exists, return false (did not increment)
    IF v_recent_view_exists THEN
        RETURN FALSE;
    END IF;

    -- Try to insert a new view record. 
    -- If it violates a unique constraint (e.g. the user viewed this post in the past), 
    -- we catch the error and update the existing row's timestamp instead.
    BEGIN
        INSERT INTO post_views (post_id, viewer_id, guest_session_hash, ip_hash, user_agent_hash)
        VALUES (p_post_id, p_viewer_id, p_guest_session_hash, p_ip_hash, p_user_agent_hash);
    EXCEPTION WHEN unique_violation THEN
        UPDATE post_views 
        SET created_at = NOW() 
        WHERE post_id = p_post_id
          AND (
              (p_viewer_id IS NOT NULL AND viewer_id = p_viewer_id)
              OR 
              (p_guest_session_hash IS NOT NULL AND guest_session_hash = p_guest_session_hash)
              OR
              (p_ip_hash IS NOT NULL AND ip_hash = p_ip_hash)
          );
    END;

    -- Increment the view count on the posts table
    UPDATE posts 
    SET view_count = COALESCE(view_count, 0) + 1 
    WHERE id = p_post_id;

    RETURN TRUE;
END;
$$;
