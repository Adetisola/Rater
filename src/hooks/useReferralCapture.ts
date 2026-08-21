"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { normalizeCampaignSlug, normalizeSourceDetail } from '@/utils/attributionNormalize';

export const SESSION_KEYS = {
  SOURCE: 'rater_source',
  DETAIL: 'rater_detail',
  CAMPAIGN: 'rater_campaign',
  REFERRER: 'rater_referrer',
} as const;

function setFirstTouchItem(key: string, value: string) {
  try {
    if (typeof window === 'undefined') return;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, value);
    }
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, value);
    }
  } catch {
    // Storage might be restricted in private/sandbox mode
  }
}

export function getAttributionItem(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(key) || localStorage.getItem(key) || null;
  } catch {
    return null;
  }
}

export function clearAttributionStorage() {
  try {
    if (typeof window === 'undefined') return;
    Object.values(SESSION_KEYS).forEach((k) => {
      sessionStorage.removeItem(k);
      localStorage.removeItem(k);
    });
  } catch {}
}

/**
 * Hook to capture URL parameters for marketing attribution (?source, ?detail, ?campaign)
 * and user referral (?referrer).
 *
 * Attribution is first-touch: once a key is stored, it is not
 * overwritten by subsequent campaign or source links in the same session prior to signup.
 */
export function useReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const rawSource = searchParams?.get('source') || new URLSearchParams(window.location.search).get('source');
      const rawDetail = searchParams?.get('detail') || new URLSearchParams(window.location.search).get('detail');
      const rawCampaign = searchParams?.get('campaign') || new URLSearchParams(window.location.search).get('campaign');
      const rawReferrer = searchParams?.get('referrer') || new URLSearchParams(window.location.search).get('referrer');

      // 1. Marketing Source (first-touch)
      if (rawSource) {
        const normalized = normalizeSourceDetail(rawSource);
        if (normalized) {
          setFirstTouchItem(SESSION_KEYS.SOURCE, normalized);
        }
      }

      // 2. Marketing Detail (first-touch)
      if (rawDetail) {
        const normalized = normalizeSourceDetail(rawDetail);
        if (normalized) {
          setFirstTouchItem(SESSION_KEYS.DETAIL, normalized);
        }
      }

      // 3. Campaign Tag (first-touch)
      if (rawCampaign) {
        const normalized = normalizeCampaignSlug(rawCampaign);
        if (normalized) {
          setFirstTouchItem(SESSION_KEYS.CAMPAIGN, normalized);
        }
      }

      // 4. Referral UUID (first-touch)
      if (rawReferrer) {
        const cleanReferrer = rawReferrer.trim();
        if (cleanReferrer) {
          setFirstTouchItem(SESSION_KEYS.REFERRER, cleanReferrer);
        }
      }
    } catch {
      // Storage might be restricted in private/sandbox mode
    }
  }, [searchParams]);
}
