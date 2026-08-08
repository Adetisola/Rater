import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    console.log("Testing getPost...");
    const id = "f074d209-775c-43c3-ba2c-db1f7484df77";
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/posts?select=*,profiles(id,username,name,avatar_url)&id=eq.${id}`;
    
    try {
        const res = await fetch(url, {
            headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
            }
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Data:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
