-- Migration: 20260825000000_add_notify_new_work_preference.sql
-- Description: Adds notify_new_work column to notification_preferences and updates default trigger.

ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS notify_new_work BOOLEAN NOT NULL DEFAULT true;

-- Update the new user trigger function to initialize notify_new_work
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
    notify_feedback_comments,
    notify_new_work
  ) VALUES (
    NEW.id,
    true,
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
