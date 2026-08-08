import fs from 'fs';

async function run() {
    console.log("Testing getPost via API...");
    const envData = fs.readFileSync('.env.local', 'utf8');
    const env = {};
    envData.split('\n').forEach(line => {
        const [key, ...vals] = line.split('=');
        if (key && vals.length > 0) {
            env[key.trim()] = vals.join('=').trim().replace(/"/g, '');
        }
    });
    
    const id = "435b6b6e-e6ad-4554-a4e7-4aa4b3a62cce";
    const url = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/posts?select=*,profiles(id,username,name,avatar_url)&id=eq.${id}`;
    
    try {
        const res = await fetch(url, {
            headers: {
                'apikey': env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
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
