-- 1. Restrict RPC Access to service_role only
REVOKE EXECUTE ON FUNCTION record_post_view(UUID, UUID, TEXT, TEXT, TEXT) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION record_post_view(UUID, UUID, TEXT, TEXT, TEXT) TO service_role;

-- 2. Redefine the RPC with SECURITY DEFINER and strict search_path
CREATE OR REPLACE FUNCTION record_post_view(
    p_post_id UUID,
    p_viewer_id UUID,
    p_guest_session_hash TEXT,
    p_ip_hash TEXT,
    p_user_agent_hash TEXT,
    p_ip_threshold INT DEFAULT 10
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_recent_view_exists BOOLEAN;
    v_ip_abuse_count INT;
BEGIN
    -- 1. IP Rate Limiting (Abuse Prevention)
    -- If this IP has viewed this specific post more than the threshold in the last hour, reject.
    SELECT COUNT(*) INTO v_ip_abuse_count
    FROM post_views
    WHERE post_id = p_post_id 
      AND ip_hash = p_ip_hash 
      AND created_at > (NOW() - INTERVAL '1 hour');
      
    IF v_ip_abuse_count >= p_ip_threshold THEN
        RETURN FALSE;
    END IF;

    -- 2. Identity Deduplication (24-hour cooldown per viewer/post pair)
    -- Deduplicate purely based on viewer_id (if authenticated) OR guest_session_hash (if guest)
    SELECT EXISTS (
        SELECT 1 
        FROM post_views
        WHERE post_id = p_post_id
          AND (
              (p_viewer_id IS NOT NULL AND viewer_id = p_viewer_id)
              OR 
              (p_viewer_id IS NULL AND p_guest_session_hash IS NOT NULL AND guest_session_hash = p_guest_session_hash)
          )
          AND created_at > (NOW() - INTERVAL '24 hours')
    ) INTO v_recent_view_exists;

    -- If a recent view exists for this specific identity and post, return false
    IF v_recent_view_exists THEN
        RETURN FALSE;
    END IF;

    -- 3. Immutable Ledger Insert
    -- Insert a new view record. We do not attempt to UPDATE unique records.
    -- All valid views become append-only historical records.
    INSERT INTO post_views (post_id, viewer_id, guest_session_hash, ip_hash, user_agent_hash)
    VALUES (p_post_id, p_viewer_id, p_guest_session_hash, p_ip_hash, p_user_agent_hash);

    -- 4. Increment Count
    UPDATE posts 
    SET view_count = COALESCE(view_count, 0) + 1 
    WHERE id = p_post_id;

    RETURN TRUE;
END;
$$;
