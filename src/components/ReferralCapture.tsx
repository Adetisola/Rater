"use client";

import { useReferralCapture } from '@/hooks/useReferralCapture';

/**
 * Headless client component that mounts on root layout to capture
 * marketing attribution and referral query parameters into sessionStorage.
 */
export function ReferralCapture() {
  useReferralCapture();
  return null;
}
