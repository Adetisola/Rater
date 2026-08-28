"use client";

import { Suspense } from 'react';
import { useReferralCapture } from '@/hooks/useReferralCapture';

function ReferralCaptureInner() {
  useReferralCapture();
  return null;
}

/**
 * Headless client component that mounts on root layout to capture
 * marketing attribution and referral query parameters into storage.
 */
export function ReferralCapture() {
  return (
    <Suspense fallback={null}>
      <ReferralCaptureInner />
    </Suspense>
  );
}
