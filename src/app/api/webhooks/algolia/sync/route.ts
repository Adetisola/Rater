import { NextResponse } from 'next/server';
import crypto from 'crypto';

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
import { supabase } from '@/lib/supabase/client';

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '';
const adminKey = process.env.ALGOLIA_ADMIN_KEY || '';

// Truncate massive strings (like base64 images) to prevent Algolia 10KB limit errors
function sanitizeString(str: any, maxLength = 8000) {
  if (typeof str === 'string' && str.length > maxLength) {
    // If it's a data URI, it's useless if truncated, so just remove it to save space
    if (str.startsWith('data:')) return null;
    return str.substring(0, maxLength) + '...';
  }
  return str;
}

async function clearAlgoliaIndex(indexName: string) {
  const response = await fetch(`https://${appId}.algolia.net/1/indexes/${indexName}/clear`, {
    method: 'POST',
    headers: {
      'X-Algolia-Application-Id': appId,
      'X-Algolia-API-Key': adminKey,
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.warn(`Algolia clear failed for ${indexName}: ${response.status} - ${errorText}`);
  }
}

async function syncToAlgolia(indexName: string, objects: any[]) {
  if (objects.length === 0) return;
  
  const response = await fetch(`https://${appId}.algolia.net/1/indexes/${indexName}/batch`, {
    method: 'POST',
    headers: {
      'X-Algolia-Application-Id': appId,
      'X-Algolia-API-Key': adminKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: objects.map(obj => ({
        action: 'updateObject',
        body: obj,
      })),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Algolia batch failed for ${indexName}: ${response.status} - ${errorText}`);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');

    if (!secret || !safeCompare(secret, process.env.WEBHOOK_SECRET!)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!appId || !adminKey) {
      return NextResponse.json({ error: 'Algolia credentials not configured' }, { status: 500 });
    }

    // 1. Fetch and Sync Posts
    await clearAlgoliaIndex('posts');
    const { data: posts, error: postsError } = await supabase.from('posts')
      .select('id, title, description, category, avatar_id, image_url, created_at, review_count, average_score')
      .neq('is_deleted', true);
    if (postsError) throw new Error(`Failed to fetch posts: ${postsError.message}`);

    if (posts && posts.length > 0) {
      const algoliaPosts = posts.map(post => ({
        objectID: post.id,
        title: sanitizeString(post.title),
        description: sanitizeString(post.description),
        category: post.category,
        avatar_id: post.avatar_id,
        image_url: sanitizeString(post.image_url),
        created_at: post.created_at,
        review_count: post.review_count,
        average_score: post.average_score,
      }));
      await syncToAlgolia('posts', algoliaPosts);
    }

    // 2. Fetch and Sync Profiles
    await clearAlgoliaIndex('profiles');
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, username, name, bio, avatar_url, bg_color, role');
    if (profilesError) throw new Error(`Failed to fetch profiles: ${profilesError.message}`);

    if (profiles && profiles.length > 0) {
      const algoliaProfiles = profiles.map(profile => ({
        objectID: profile.id,
        username: sanitizeString(profile.username),
        name: sanitizeString(profile.name),
        bio: sanitizeString(profile.bio),
        avatar_url: sanitizeString(profile.avatar_url),
        bg_color: profile.bg_color,
        role: sanitizeString(profile.role),
      }));
      await syncToAlgolia('profiles', algoliaProfiles);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully synced ${posts?.length || 0} posts and ${profiles?.length || 0} profiles.` 
    });

  } catch (error: any) {
    console.error('[Algolia Sync Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
