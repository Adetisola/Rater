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

async function configureAlgoliaIndexSettings() {
  if (!appId || !adminKey) return;

  // 1. Profiles Settings (order matters: name > username > bio > role)
  const profilesSettings = {
    searchableAttributes: ['name', 'username', 'bio', 'role'],
    queryType: 'prefixLast',
    typoTolerance: true,
    minWordSizefor1Typo: 3,
    minWordSizefor2Typos: 6,
    ranking: [
      'typo',
      'geo',
      'words',
      'filters',
      'proximity',
      'attribute',
      'exact',
      'custom'
    ],
    attributesToRetrieve: ['objectID', 'name', 'username', 'bio', 'avatar_url', 'bg_color', 'role']
  };

  const profRes = await fetch(`https://${appId}.algolia.net/1/indexes/profiles/settings`, {
    method: 'PUT',
    headers: {
      'X-Algolia-Application-Id': appId,
      'X-Algolia-API-Key': adminKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profilesSettings),
  });

  if (!profRes.ok) {
    const err = await profRes.text();
    console.error('[Algolia] Failed to configure profiles settings:', err);
  }

  // 2. Posts Settings (title > category > description > creator_name > creator_username)
  const postsSettings = {
    searchableAttributes: ['title', 'category', 'description', 'creator_name', 'creator_username'],
    queryType: 'prefixLast',
    typoTolerance: true,
    minWordSizefor1Typo: 4,
    minWordSizefor2Typos: 7,
    customRanking: ['desc(review_count)', 'desc(average_score)'],
    attributesForFaceting: ['filterOnly(category)', 'filterOnly(avatar_id)', 'filterOnly(is_deleted)'],
  };

  const postRes = await fetch(`https://${appId}.algolia.net/1/indexes/posts/settings`, {
    method: 'PUT',
    headers: {
      'X-Algolia-Application-Id': appId,
      'X-Algolia-API-Key': adminKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postsSettings),
  });

  if (!postRes.ok) {
    const err = await postRes.text();
    console.error('[Algolia] Failed to configure posts settings:', err);
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

    // Configure Index Settings
    await configureAlgoliaIndexSettings();

    // 1. Fetch Profiles first to build denormalization lookup map
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, name, bio, avatar_url, bg_color, role, is_blocked');
    if (profilesError) throw new Error(`Failed to fetch profiles: ${profilesError.message}`);

    const profileMap: Record<string, { name: string; username: string }> = {};
    const eligibleProfiles = (profiles || []).filter(p => !p.is_blocked);

    if (eligibleProfiles.length > 0) {
      await clearAlgoliaIndex('profiles');
      const algoliaProfiles = eligibleProfiles.map(profile => {
        profileMap[profile.id] = {
          name: profile.name || '',
          username: profile.username || '',
        };
        return {
          objectID: profile.id,
          username: sanitizeString(profile.username),
          name: sanitizeString(profile.name),
          bio: sanitizeString(profile.bio),
          avatar_url: sanitizeString(profile.avatar_url),
          bg_color: profile.bg_color,
          role: sanitizeString(profile.role),
        };
      });
      await syncToAlgolia('profiles', algoliaProfiles);
    }

    // 2. Fetch and Sync Posts with creator denormalization
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, title, description, category, avatar_id, image_url, created_at, review_count, average_score')
      .neq('is_deleted', true);
    if (postsError) throw new Error(`Failed to fetch posts: ${postsError.message}`);

    if (posts && posts.length > 0) {
      await clearAlgoliaIndex('posts');
      const algoliaPosts = posts.map(post => {
        const creator = profileMap[post.avatar_id] || { name: '', username: '' };
        return {
          objectID: post.id,
          title: sanitizeString(post.title),
          description: sanitizeString(post.description),
          category: post.category,
          avatar_id: post.avatar_id,
          creator_name: sanitizeString(creator.name),
          creator_username: sanitizeString(creator.username),
          image_url: sanitizeString(post.image_url),
          created_at: post.created_at,
          review_count: post.review_count || 0,
          average_score: post.average_score || 0,
        };
      });
      await syncToAlgolia('posts', algoliaPosts);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully synced ${posts?.length || 0} posts and ${eligibleProfiles.length} profiles to Algolia.` 
    });

  } catch (error: any) {
    console.error('[Algolia Sync Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
