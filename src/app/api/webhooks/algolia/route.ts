import { NextResponse } from 'next/server';
import crypto from 'crypto';

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '';
const adminKey = process.env.ALGOLIA_ADMIN_KEY || '';

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');

    // Verify webhook secret
    if (!secret || !safeCompare(secret, process.env.WEBHOOK_SECRET!)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!appId || !adminKey) {
      return NextResponse.json({ error: 'Algolia credentials not configured' }, { status: 500 });
    }

    const payload = await req.json();
    const { type, table, record, old_record } = payload;

    // Validate table
    if (table !== 'posts' && table !== 'profiles') {
      return NextResponse.json({ error: 'Unsupported table' }, { status: 400 });
    }

    const indexName = table; // 'posts' or 'profiles'

    if (type === 'INSERT' || type === 'UPDATE') {
      
      const sanitizeString = (str: any, maxLength = 8000) => {
        if (typeof str === 'string' && str.length > maxLength) {
          if (str.startsWith('data:')) return null;
          return str.substring(0, maxLength) + '...';
        }
        return str;
      };

      let algoliaRecord: any = { objectID: record.id };
      
      if (table === 'posts') {
        if (record.is_deleted) {
          // It's a soft delete, so remove it from Algolia
          const deleteRes = await fetch(`https://${appId}.algolia.net/1/indexes/${indexName}/${record.id}`, {
            method: 'DELETE',
            headers: {
              'X-Algolia-Application-Id': appId,
              'X-Algolia-API-Key': adminKey,
            },
          });
          if (!deleteRes.ok) throw new Error(`Algolia soft-delete failed`);
          return NextResponse.json({ success: true, message: `Record ${record.id} soft-deleted from ${indexName}` });
        }

        algoliaRecord = {
          objectID: record.id,
          title: sanitizeString(record.title),
          description: sanitizeString(record.description),
          category: record.category,
          avatar_id: record.avatar_id,
          image_url: sanitizeString(record.image_url),
          created_at: record.created_at,
          review_count: record.review_count,
          average_score: record.average_score,
        };
      } else if (table === 'profiles') {
        algoliaRecord = {
          objectID: record.id,
          username: sanitizeString(record.username),
          name: sanitizeString(record.name),
          bio: sanitizeString(record.bio),
          avatar_url: sanitizeString(record.avatar_url),
          bg_color: record.bg_color,
          role: sanitizeString(record.role),
        };
      }

      const response = await fetch(`https://${appId}.algolia.net/1/indexes/${indexName}/${record.id}`, {
        method: 'PUT',
        headers: {
          'X-Algolia-Application-Id': appId,
          'X-Algolia-API-Key': adminKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(algoliaRecord),
      });

      if (!response.ok) {
        throw new Error(`Algolia update failed: ${response.status} - ${await response.text()}`);
      }

      return NextResponse.json({ success: true, message: `Record ${record.id} synced to ${indexName}` });
    } 
    
    if (type === 'DELETE') {
      const id = old_record?.id;
      if (!id) {
        return NextResponse.json({ error: 'No ID provided for deletion' }, { status: 400 });
      }

      const response = await fetch(`https://${appId}.algolia.net/1/indexes/${indexName}/${id}`, {
        method: 'DELETE',
        headers: {
          'X-Algolia-Application-Id': appId,
          'X-Algolia-API-Key': adminKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Algolia delete failed: ${response.status} - ${await response.text()}`);
      }

      return NextResponse.json({ success: true, message: `Record ${id} deleted from ${indexName}` });
    }

    return NextResponse.json({ error: 'Unsupported event type' }, { status: 400 });

  } catch (error: any) {
    console.error('[Algolia Webhook Error]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
