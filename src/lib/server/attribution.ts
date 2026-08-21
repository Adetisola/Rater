'use server';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { normalizeCampaignSlug, normalizeSourceDetail } from '@/utils/attributionNormalize';

function getAdminSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured.');
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

/**
 * Server Action: Persist attribution for a newly registered user.
 * 
 * Guarantees:
 * - Immutable first-touch: If the user already has attribution recorded, automated calls will NOT overwrite it.
 * - Elevated service-role execution: Bypasses RLS issues during initial unconfirmed signup state.
 */
export async function recordSignupAttribution(
  userId: string,
  attribution: {
    source?: string | null;
    detail?: string | null;
    campaign?: string | null;
    referrer?: string | null;
  }
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!userId) return { ok: false, error: 'User ID is required' };

    const adminSupabase = getAdminSupabase();

    // Check existing profile attribution (first-touch immutability)
    const { data: existing, error: fetchError } = await adminSupabase
      .from('profiles')
      .select('id, acquisition_source, acquisition_detail, campaign_tag, referred_by')
      .eq('id', userId)
      .single();

    if (fetchError || !existing) {
      return { ok: false, error: 'User profile not found' };
    }

    const updates: Database['public']['Tables']['profiles']['Update'] = {};

    if (!existing.acquisition_source && attribution.source) {
      const cleanSource = normalizeSourceDetail(attribution.source);
      if (cleanSource) updates.acquisition_source = cleanSource;
    }

    if (!existing.acquisition_detail && attribution.detail) {
      const cleanDetail = normalizeSourceDetail(attribution.detail);
      if (cleanDetail) updates.acquisition_detail = cleanDetail;
    }

    if (!existing.campaign_tag && attribution.campaign) {
      const cleanCampaign = normalizeCampaignSlug(attribution.campaign);
      if (cleanCampaign) updates.campaign_tag = cleanCampaign;
    }

    if (!existing.referred_by && attribution.referrer && attribution.referrer !== userId) {
      const cleanReferrer = attribution.referrer.trim();
      // Ensure referrer is a valid UUID
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanReferrer)) {
        updates.referred_by = cleanReferrer;
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await adminSupabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (updateError) {
        console.error('Failed to record signup attribution:', updateError);
        return { ok: false, error: updateError.message };
      }
    }

    return { ok: true };
  } catch (err: any) {
    console.error('Error in recordSignupAttribution:', err);
    return { ok: false, error: err?.message || 'Failed to record attribution' };
  }
}
