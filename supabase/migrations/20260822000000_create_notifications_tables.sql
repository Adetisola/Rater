-- Migration: Create Notifications, Notification Preferences, and Push Subscriptions Tables
-- Enables multi-channel notifications, Supabase Realtime synchronization, and idempotency guarantees.

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop legacy stub table if it exists
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.push_subscriptions CASCADE;

-- ============================================================================
-- 1. NOTIFICATIONS TABLE (Immutable Historical Records)
-- ============================================================================
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('activity', 'milestones', 'insights', 'community', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_label TEXT NOT NULL DEFAULT 'View',
    action_url TEXT NOT NULL,
    -- Preserve historical notifications even if post or feedback item is deleted
    post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
    feedback_request_id UUID REFERENCES public.feedback_requests(id) ON DELETE SET NULL,
    idempotency_key TEXT UNIQUE NOT NULL,
    group_key TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup indexes
CREATE INDEX idx_notifications_profile_unread ON public.notifications(profile_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_profile_feed ON public.notifications(profile_id, created_at DESC);
CREATE INDEX idx_notifications_group_key ON public.notifications(group_key) WHERE group_key IS NOT NULL;
CREATE INDEX idx_notifications_idempotency ON public.notifications(idempotency_key);

-- Enable Supabase Realtime for notifications table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- ============================================================================
-- 2. NOTIFICATION PREFERENCES TABLE
-- ============================================================================
CREATE TABLE public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    notify_critiques BOOLEAN NOT NULL DEFAULT TRUE,
    notify_milestones BOOLEAN NOT NULL DEFAULT TRUE,
    notify_insights BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_preferences_profile ON public.notification_preferences(profile_id);

-- Auto-provision preferences on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_notification_prefs()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notification_preferences (profile_id)
    VALUES (NEW.id)
    ON CONFLICT (profile_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_init_notification_prefs ON public.profiles;
CREATE TRIGGER on_profile_created_init_notification_prefs
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_notification_prefs();

-- Backfill preferences for existing profiles
INSERT INTO public.notification_preferences (profile_id)
SELECT id FROM public.profiles
ON CONFLICT (profile_id) DO NOTHING;

-- ============================================================================
-- 3. PUSH SUBSCRIPTIONS TABLE (Multi-Device Support)
-- ============================================================================
CREATE TABLE public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_push_subscriptions_profile ON public.push_subscriptions(profile_id);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = profile_id);

CREATE POLICY "Users can update read status of their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own notifications"
    ON public.notifications FOR DELETE
    USING (auth.uid() = profile_id);

-- Preferences Policies
CREATE POLICY "Users can view own notification preferences"
    ON public.notification_preferences FOR SELECT
    USING (auth.uid() = profile_id);

CREATE POLICY "Users can update own notification preferences"
    ON public.notification_preferences FOR UPDATE
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

-- Push Subscriptions Policies
CREATE POLICY "Users can manage own push subscriptions"
    ON public.push_subscriptions FOR ALL
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);
