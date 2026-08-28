-- Migration: 20260824100000_add_feedback_notification_preferences.sql
-- Description: Adds notify_feedback_status and notify_feedback_comments columns to notification_preferences.

ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS notify_feedback_status BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_feedback_comments BOOLEAN NOT NULL DEFAULT true;

-- Update the new user trigger function to initialize these columns
CREATE OR REPLACE FUNCTION public.handle_new_user_notification_prefs()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (
    profile_id,
    in_app_enabled,
    push_enabled,
    email_enabled,
    notify_critiques,
    notify_milestones,
    notify_insights,
    notify_feedback_status,
    notify_feedback_comments
  ) VALUES (
    NEW.id,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true
  ) ON CONFLICT (profile_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
