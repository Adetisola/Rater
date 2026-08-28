/**
 * Normalization utilities for marketing attribution and campaigns.
 *
 * All incoming attribution values (source, detail, campaign) are normalized
 * before persistence to maintain clean groupings and avoid fragmentation.
 */

/**
 * Normalize a campaign slug.
 * "First 1,000 Designers" → "first-1000-designers"
 * Used for: campaign_tag, campaign.slug
 */
export function normalizeCampaignSlug(raw: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Normalize an acquisition source or detail value.
 * Trims and lowercases. Preserves meaningful punctuation like @ and .
 * "Instagram" → "instagram"
 * "@designwithme" → "@designwithme"
 * "AWS re:Invent" → "aws re:invent"
 * Used for: acquisition_source, acquisition_detail
 */
export function normalizeSourceDetail(raw: string): string {
  if (!raw) return '';
  return raw.trim().toLowerCase();
}
