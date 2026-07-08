import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// We use the REST API of Algolia in edge functions to keep it lightweight, 
// or you can import algoliasearch if you have a build step for deno.

const ALGOLIA_APP_ID = Deno.env.get('NEXT_PUBLIC_ALGOLIA_APP_ID') || '';
const ALGOLIA_ADMIN_KEY = Deno.env.get('ALGOLIA_ADMIN_KEY') || '';

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  old_record: any;
}

serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();

    let indexName = '';
    if (payload.table === 'posts') {
      indexName = 'rater_posts';
    } else if (payload.table === 'avatars') {
      indexName = 'rater_avatars';
    } else {
      return new Response("Table not tracked for search", { status: 200 });
    }

    const algoliaUrl = `https://${ALGOLIA_APP_ID}.algolia.net/1/indexes/${indexName}/${payload.record?.id || payload.old_record?.id}`;
    
    const headers = {
      'X-Algolia-Application-Id': ALGOLIA_APP_ID,
      'X-Algolia-API-Key': ALGOLIA_ADMIN_KEY,
      'Content-Type': 'application/json'
    };

    if (payload.type === 'DELETE') {
      await fetch(algoliaUrl, { method: 'DELETE', headers });
    } else {
      // Create Algolia Object (add objectID)
      const algoliaObject = {
        ...payload.record,
        objectID: payload.record.id
      };
      
      await fetch(algoliaUrl, { 
        method: 'PUT', 
        headers, 
        body: JSON.stringify(algoliaObject) 
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
