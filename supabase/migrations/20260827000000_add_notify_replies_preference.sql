-- Migration: 20260827000000_add_notify_replies_preference.sql
-- Description: Add dedicated notify_replies column to notification_preferences table

ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS notify_replies BOOLEAN NOT NULL DEFAULT true;
