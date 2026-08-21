"use client";

import { useEffect } from 'react';
import { normalizeCampaignSlug, normalizeSourceDetail } from '@/utils/attributionNormalize';

export const SESSION_KEYS = {
  SOURCE: 'rater_source',
  DETAIL: 'rater_detail',
  CAMPAIGN: 'rater_campaign',
  REFERRER: 'rater_referrer',
} as const;

/**
 * Hook to capture URL parameters for marketing attribution (?source, ?detail, ?campaign)
 * and user referral (?referrer).
 *
 * Attribution is first-touch in sessionStorage: once a key is stored, it is not
 * overwritten by subsequent campaign or source links in the same session prior to signup.
 */
export function useReferralCapture() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const searchParams = new URLSearchParams(window.location.search);

      const rawSource = searchParams.get('source');
      const rawDetail = searchParams.get('detail');
      const rawCampaign = searchParams.get('campaign');
      const rawReferrer = searchParams.get('referrer');

      // 1. Marketing Source (first-touch)
      if (rawSource) {
        const normalized = normalizeSourceDetail(rawSource);
        if (normalized && !sessionStorage.getItem(SESSION_KEYS.SOURCE)) {
          sessionStorage.setItem(SESSION_KEYS.SOURCE, normalized);
        }
      }

      // 2. Marketing Detail (first-touch)
      if (rawDetail) {
        const normalized = normalizeSourceDetail(rawDetail);
        if (normalized && !sessionStorage.getItem(SESSION_KEYS.DETAIL)) {
          sessionStorage.setItem(SESSION_KEYS.DETAIL, normalized);
        }
      }

      // 3. Campaign Tag (first-touch)
      if (rawCampaign) {
        const normalized = normalizeCampaignSlug(rawCampaign);
        if (normalized && !sessionStorage.getItem(SESSION_KEYS.CAMPAIGN)) {
          sessionStorage.setItem(SESSION_KEYS.CAMPAIGN, normalized);
        }
      }

      // 4. Referral UUID (first-touch)
      if (rawReferrer) {
        const cleanReferrer = rawReferrer.trim();
        if (cleanReferrer && !sessionStorage.getItem(SESSION_KEYS.REFERRER)) {
          sessionStorage.setItem(SESSION_KEYS.REFERRER, cleanReferrer);
        }
      }
    } catch {
      // sessionStorage might be restricted in private/sandbox mode
    }
  }, []);
}
