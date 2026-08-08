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
    -- Check if a view exists within the last 12 hours for this specific user/guest
    SELECT EXISTS (
        SELECT 1 
        FROM post_views
        WHERE post_id = p_post_id
          AND (
              (p_viewer_id IS NOT NULL AND viewer_id = p_viewer_id)
              OR 
              (p_guest_session_hash IS NOT NULL AND guest_session_hash = p_guest_session_hash)
          )
          AND created_at > (NOW() - INTERVAL '12 hours')
    ) INTO v_recent_view_exists;

    -- If a recent view exists, return false (did not increment)
    IF v_recent_view_exists THEN
        RETURN FALSE;
    END IF;

    -- Otherwise, insert the new view
    INSERT INTO post_views (post_id, viewer_id, guest_session_hash, ip_hash, user_agent_hash)
    VALUES (p_post_id, p_viewer_id, p_guest_session_hash, p_ip_hash, p_user_agent_hash);

    RETURN TRUE;
END;
$$;
