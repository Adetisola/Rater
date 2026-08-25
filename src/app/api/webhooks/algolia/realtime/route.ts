import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase/client';

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '';
const adminKey = process.env.ALGOLIA_ADMIN_KEY || '';
const webhookSecret = process.env.WEBHOOK_SECRET || '';

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function sanitizeString(str: any, maxLength = 8000) {
  if (typeof str === 'string' && str.length > maxLength) {
    if (str.startsWith('data:')) return null;
    return str.substring(0, maxLength) + '...';
  }
  return str;
}

/**
 * Execute Algolia REST operation with exponential backoff retry.
 */
async function executeAlgoliaWithRetry(
  url: string, 
  method: string, 
  body?: any, 
  maxRetries = 3
): Promise<Response> {
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const res = await fetch(url, {
        method,
        headers: {
          'X-Algolia-Application-Id': appId,
          'X-Algolia-API-Key': adminKey,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok || res.status === 404) {
        return res;
      }

      const errText = await res.text();
      throw new Error(`Algolia HTTP ${res.status}: ${errText}`);
    } catch (err: any) {
      lastError = err;
      console.warn(`[Algolia Realtime Webhook] Attempt ${attempt}/${maxRetries} failed:`, err.message);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 300 * Math.pow(2, attempt - 1)));
      }
    }
  }

  throw lastError;
}

/**
 * Upsert or delete record in Algolia
 */
async function saveAlgoliaObject(indexName: string, objectID: string, body: any) {
  const url = `https://${appId}.algolia.net/1/indexes/${indexName}/${encodeURIComponent(objectID)}`;
  await executeAlgoliaWithRetry(url, 'PUT', body);
}

async function deleteAlgoliaObject(indexName: string, objectID: string) {
  const url = `https://${appId}.algolia.net/1/indexes/${indexName}/${encodeURIComponent(objectID)}`;
  await executeAlgoliaWithRetry(url, 'DELETE');
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const headerSecret = req.headers.get('x-webhook-secret') || searchParams.get('secret');

    if (!headerSecret || !webhookSecret || !safeCompare(headerSecret, webhookSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!appId || !adminKey) {
      return NextResponse.json({ error: 'Algolia credentials missing' }, { status: 500 });
    }

    const payload = await req.json();
    const { type, table, record, old_record } = payload;

    if (!table || !type) {
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 1. PROFILES SYNCHRONIZATION
    // ──────────────────────────────────────────────────────────────────────────
    if (table === 'profiles') {
      const targetId = record?.id || old_record?.id;
      if (!targetId) {
        return NextResponse.json({ error: 'Missing profile id' }, { status: 400 });
      }

      if (type === 'DELETE' || record?.is_blocked) {
        await deleteAlgoliaObject('profiles', targetId);
        return NextResponse.json({ success: true, action: 'delete_profile', id: targetId });
      }

      // INSERT or UPDATE
      const algoliaProfile = {
        objectID: record.id,
        username: sanitizeString(record.username),
        name: sanitizeString(record.name),
        bio: sanitizeString(record.bio),
        avatar_url: sanitizeString(record.avatar_url),
        bg_color: record.bg_color,
        role: sanitizeString(record.role),
      };

      await saveAlgoliaObject('profiles', record.id, algoliaProfile);

      // Denormalize creator name updates across author's posts in Algolia
      if (type === 'UPDATE') {
        const { data: userPosts } = await supabase
          .from('posts')
          .select('id, title, description, category, avatar_id, image_url, created_at, review_count, average_score')
          .eq('avatar_id', record.id)
          .neq('is_deleted', true);

        if (userPosts && userPosts.length > 0) {
          const updatedPosts = userPosts.map(p => ({
            objectID: p.id,
            title: sanitizeString(p.title),
            description: sanitizeString(p.description),
            category: p.category,
            avatar_id: p.avatar_id,
            creator_name: sanitizeString(record.name),
            creator_username: sanitizeString(record.username),
            image_url: sanitizeString(p.image_url),
            created_at: p.created_at,
            review_count: p.review_count || 0,
            average_score: p.average_score || 0,
          }));

          const batchUrl = `https://${appId}.algolia.net/1/indexes/posts/batch`;
          await executeAlgoliaWithRetry(batchUrl, 'POST', {
            requests: updatedPosts.map(obj => ({ action: 'updateObject', body: obj }))
          });
        }
      }

      return NextResponse.json({ success: true, action: 'upsert_profile', id: record.id });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 2. POSTS SYNCHRONIZATION
    // ──────────────────────────────────────────────────────────────────────────
    if (table === 'posts') {
      const targetId = record?.id || old_record?.id;
      if (!targetId) {
        return NextResponse.json({ error: 'Missing post id' }, { status: 400 });
      }

      if (type === 'DELETE' || record?.is_deleted) {
        await deleteAlgoliaObject('posts', targetId);
        return NextResponse.json({ success: true, action: 'delete_post', id: targetId });
      }

      // Fetch creator metadata for denormalization
      let creatorName = '';
      let creatorUsername = '';

      if (record.avatar_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, username')
          .eq('id', record.avatar_id)
          .single();

        if (profile) {
          creatorName = profile.name || '';
          creatorUsername = profile.username || '';
        }
      }

      const algoliaPost = {
        objectID: record.id,
        title: sanitizeString(record.title),
        description: sanitizeString(record.description),
        category: record.category,
        avatar_id: record.avatar_id,
        creator_name: sanitizeString(creatorName),
        creator_username: sanitizeString(creatorUsername),
        image_url: sanitizeString(record.image_url),
        created_at: record.created_at,
        review_count: record.review_count || 0,
        average_score: record.average_score || 0,
      };

      await saveAlgoliaObject('posts', record.id, algoliaPost);
      return NextResponse.json({ success: true, action: 'upsert_post', id: record.id });
    }

    return NextResponse.json({ error: `Unhandled table: ${table}` }, { status: 400 });
  } catch (error: any) {
    console.error('[Algolia Realtime Webhook Error]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
