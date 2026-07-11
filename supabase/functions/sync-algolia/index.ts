import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { algoliasearch } from 'npm:algoliasearch@5.55.1';

// Edge function to sync Supabase database events to Algolia
// Called via Database Webhooks

const cleanEnv = (val: string | undefined) => (val || '').replace(/^"|"$/g, '');

const appId = cleanEnv(Deno.env.get('ALGOLIA_APP_ID'));
const writeKey = cleanEnv(Deno.env.get('ALGOLIA_WRITE_KEY'));
const webhookSecret = cleanEnv(Deno.env.get('WEBHOOK_SECRET'));

const client = (appId && writeKey) ? algoliasearch(appId, writeKey) : null;

serve(async (req) => {
  if (!client) {
    return new Response(JSON.stringify({ error: 'Algolia keys not configured' }), { status: 500 });
  }

  try {
    const payload = await req.json();
    const { type, table, record, old_record } = payload;
    
    // Authorization: Verify webhook secret manually because we deployed with --no-verify-jwt
    const authHeader = req.headers.get('Authorization');
    
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      console.error(`Auth mismatch. Received: ${authHeader}, Expected: Bearer ${webhookSecret}`);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    if (table === 'posts') {
      const indexName = 'posts';
      
      if (type === 'INSERT' || type === 'UPDATE') {
        if (record.is_deleted) {
          await client.deleteObject({
            indexName,
            objectID: record.id
          });
          return new Response(JSON.stringify({ message: 'Post removed (soft deleted)' }), { status: 200 });
        }
        
        const algoliaObject = {
          objectID: record.id,
          title: record.title,
          description: record.description,
          category: record.category,
          avatar_id: record.avatar_id,
          image_url: record.image_url,
          created_at: record.created_at,
          review_count: record.review_count,
          average_score: record.average_score,
        };
        
        await client.saveObject({
          indexName,
          body: algoliaObject
        });
        
        return new Response(JSON.stringify({ message: 'Post synced successfully' }), { status: 200 });
      } else if (type === 'DELETE') {
        await client.deleteObject({
          indexName,
          objectID: old_record.id
        });
        return new Response(JSON.stringify({ message: 'Post deleted successfully' }), { status: 200 });
      }
    }

    if (table === 'profiles') {
      const indexName = 'profiles';
      
      if (type === 'INSERT' || type === 'UPDATE') {
        const algoliaObject = {
          objectID: record.id,
          username: record.username,
          name: record.name,
          bio: record.bio,
          avatar_url: record.avatar_url,
          bg_color: record.bg_color,
          role: record.role
        };
        
        await client.saveObject({
          indexName,
          body: algoliaObject
        });
        return new Response(JSON.stringify({ message: 'Profile synced successfully' }), { status: 200 });
      } else if (type === 'DELETE') {
        await client.deleteObject({
          indexName,
          objectID: old_record.id
        });
        return new Response(JSON.stringify({ message: 'Profile deleted successfully' }), { status: 200 });
      }
    }

    return new Response(JSON.stringify({ message: 'Ignored unsupported table or event type' }), { status: 200 });
  } catch (error) {
    console.error('Error syncing to Algolia:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
