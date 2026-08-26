-- ============================================================================
-- Migration: Add optional expires_at to push_subscriptions
-- Purpose: Store browser-reported PushSubscription.expirationTime as metadata.
-- NOTE: This is optional metadata only. Reactive 410/404 pruning remains the
--       authoritative mechanism for stale subscription detection.
-- ============================================================================

ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.push_subscriptions.expires_at IS
  'Optional: browser-reported PushSubscription.expirationTime. May be null. '
  'Not used for pruning. Reactive 410/404 detection is the authoritative mechanism.';
