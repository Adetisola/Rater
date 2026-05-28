// Re-export domain types from centralized location
// Consumers can import from '@/types' directly, but these re-exports
// maintain backward compatibility for existing imports.
export type {
  Category,
  Avatar,
  Review,
  Post,
  PostMetrics,
  BadgeType,
  Badge,
} from '../types';

// Local import needed for type-checking the mock data below
import type { Category, Avatar, Review, Post, PostMetrics, Badge } from '../types';
import { getReviewMode } from '../config/reviewModes';


// TODO(backend): This entire file is the mock database layer.
// When integrating Supabase, replace each export below with a real
// database query or RPC call. The consumers (AuthContext, PostContext,
// badgeUtils, searchUtils, etc.) import data/functions from here — they
// should NOT need to change when the backend is swapped in.
// Key replacements:
//   - MOCK_AVATARS      → supabase.from('avatars').select()
//   - MOCK_POSTS        → supabase.from('posts').select()
//   - MOCK_REVIEWS      → supabase.from('reviews').select()
//   - addReview()       → supabase.from('reviews').insert()
//   - updatePost()      → supabase.from('posts').update()
//   - calculatePostMetrics() → supabase.rpc('calculate_metrics')

// --- MOCK DATABASE ---

export const CATEGORIES: Category[] = [
  'Web Design',
  'Mobile App Design',
  'Brand Identity Design',
  'Mockup Design',
  'Logo Design',
  'Poster Design',
  'Flyer Design',
  'Social Media Design',
  'AI Image',
  '3D Design',
  'Packaging Design',
  'Banner Design',
  'Ad Creative Design',
  'Illustration',
  'Icon Design',
  'Typography Design',
  'UI Design',
  'Landing Page Design',
  'Dashboard Design'
];

/**
 * PRODUCTION NOTE: In a real Supabase/PostgreSQL environment:
 * - Passkeys MUST be hashed using bcrypt or similar.
 * - This Avatar table would likely be an 'avatars' table linked to 'auth.users'.
 */
export const MOCK_AVATARS: Record<string, Avatar> = {
  'user_1': {
    id: 'user_1',
    username: 'timi',
    email: 'timi@rater.com',
    name: 'Timi',
    role: 'Product Designer',
    avatar_url: 'https://i.ibb.co/4nPVJ9kP/8f726ed71fc83469a1c54aa4cf114282.jpg',
    bg_color: '#FEC312',
    bio: 'Product designer obsessed with minimalist interfaces and intuitive user flows.',
    is_blocked: false,
    passkey: '1234',
    created_at: '2026-01-01T00:00:00Z',
    social_links: [
      {
        type: 'instagram',
        url: 'https://www.instagram.com/timi.adetisola',
        username: 'timi.adetisola'
      }
    ]
  },
  'user_2': {
    id: 'user_2',
    username: 'sarah_chen',
    email: 'sarah@rater.com',
    name: 'Sarah Chen',
    role: 'UI/UX Designer',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    bg_color: '#7C3BED',
    bio: 'Mobile-first designer specializing in visual systems and interaction design.',
    is_blocked: false,
    passkey: '1111',
    created_at: '2026-01-05T00:00:00Z'
  },
  'user_3': {
    id: 'user_3',
    username: 'marcus_j',
    email: 'marcus@rater.com',
    name: 'Marcus Johnson',
    role: 'Creative Director',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    bg_color: '#3B82F6',
    bio: 'Multidisciplinary creative director focused on branding and digital experiences.',
    is_blocked: false,
    passkey: '2222',
    created_at: '2026-01-10T00:00:00Z'
  },
  'user_4': {
    id: 'user_4',
    username: 'elena_r',
    email: 'elena@rater.com',
    name: 'Elena Rodriguez',
    role: 'Visual Designer',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    bg_color: '#10B981',
    bio: 'Exploring the intersection of artificial intelligence and human-centered design.',
    is_blocked: false,
    passkey: '3333',
    created_at: '2026-01-15T00:00:00Z'
  },
  'user_5': {
    id: 'user_5',
    username: 'james_park',
    email: 'james@rater.com',
    name: 'James Park',
    role: 'Branding Specialist',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    bg_color: '#F59E0B',
    bio: 'Branding specialist with a passion for typography and bold visual identities.',
    is_blocked: false,
    passkey: '4444',
    created_at: '2026-01-20T00:00:00Z'
  },
  'user_blocked': {
    id: 'user_blocked',
    username: 'spammer',
    email: 'spammer@rater.com',
    name: 'Spammer',
    role: 'Designer',
    bg_color: '#999999',
    bio: 'Blocked for violating community standards.',
    is_blocked: true,
    passkey: '0000',
    created_at: '2024-01-25T00:00:00Z'
  }
};

export const MOCK_POSTS: Post[] = [
  {
    "id": "post_stress_massive_brand",
    "title": "Neo-Vintage Artisanal Coffee Shop Branding",
    "description": "A complete brand identity for 'The Rusty Bean', blending 1920s industrial typography with modern, minimalist layouts. The goal was to create a memorable, nostalgic feel that still looks premium on modern packaging.",
    "category": "Brand Identity Design",
    "image_url": "https://images.unsplash.com/photo-1647551270770-b8ccdab49519?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzB8fE5lby1WaW50YWdlJTIwQXJ0aXNhbmFsJTIwQ29mZmVlJTIwU2hvcCUyMEJyYW5kaW5nfGVufDB8fDB8fHww",
    "avatar_id": "user_2",
    "created_at": "2026-05-27T04:39:00.221Z"
  },
  {
    id: 'post_stress_low_signal',
    title: 'Stress Test: Low Signal',
    description: 'A test post where reviewers leave very shallow, brief comments (e.g. "nice layout", "clean"). This should trigger the "low_signal" analysis mode in the Insights Engine.',
    category: 'Web Design',
    image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
  },
  {
    id: 'post_stress_ratings_only',
    title: 'Stress Test: Ratings Only',
    description: 'A test post where the written comments are completely off-topic spam, but the ratings show a clear trend (very positive). This should trigger the "ratings_only" mode.',
    category: 'UI Design',
    image_url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'post_stress_insufficient',
    title: 'Stress Test: Insufficient Signal (Short-Circuit)',
    description: 'A test post where comments are pure spam AND the ratings are flat/neutral (all 3s). This should trigger the deterministic short-circuit and avoid calling the LLM entirely.',
    category: 'Typography Design',
    image_url: 'https://images.unsplash.com/photo-1777973320887-3012937be88c?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw0OHx8fGVufDB8fHx8fA%3D%3D',
    avatar_id: 'user_3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: 'post_1',
    title: 'Minimalist Furniture E-commerce',
    description: 'A clean, typography-driven web interface for a modern furniture brand, focusing on large product imagery and whitespace.',
    category: 'Web Design',
    image_url: 'https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'post_8',
    title: 'Creative Agency Portfolio',
    description: 'Bold typography and masonry grid layout for a creative agency portfolio website.',
    category: 'Web Design',
    image_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_5',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    id: 'post_11',
    title: 'Dark Mode Analytics Dashboard',
    description: 'High-contrast dark mode dashboard featuring neon data visualizations and modular widgets.',
    category: 'Web Design',
    image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 'post_12',
    title: 'Gourmet Cafe Landing Page',
    description: 'Warm, inviting web design for a gourmet cafe featuring full-width culinary photography.',
    category: 'Web Design',
    image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
  {
    id: 'post_4',
    title: 'Fintech Wallet App',
    description: 'Sleek mobile app interface for cryptocurrency tracking and personal finance management.',
    category: 'Mobile App Design',
    image_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: 'post_10',
    title: 'Mindfulness & Sleep App',
    description: 'Calming mobile interface utilizing soft gradients and organic shapes for a meditation tracker.',
    category: 'Mobile App Design',
    image_url: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
  },
  {
    id: 'post_13',
    title: 'Performance Tracker App',
    description: 'High-energy mobile UI with bold neon accents for tracking gym workouts and running metrics.',
    category: 'Mobile App Design',
    image_url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: 'post_14',
    title: 'Urban Delivery App',
    description: 'Vibrant, easy-to-use mobile interface for local urban food delivery and discovery.',
    category: 'Mobile App Design',
    image_url: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_4',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: 'post_2',
    title: 'Artisan Coffee Roasters Identity',
    description: 'Complete brand identity featuring kraft paper textures and minimalist typography for an indie coffee roaster.',
    category: 'Brand Identity Design',
    image_url: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'post_9',
    title: 'Organic Juice Packaging',
    description: 'Sustainable glass bottle packaging design with vibrant, fruit-inspired color palettes.',
    category: 'Brand Identity Design',
    image_url: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
  {
    id: 'post_15',
    title: 'Heritage Watchmaker Branding',
    description: 'Premium brand identity for a luxury watchmaker, featuring foil stamping and serif typography.',
    category: 'Brand Identity Design',
    image_url: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 'post_16',
    title: 'Sourdough Bakery Identity',
    description: 'Warm, rustic branding for a local sourdough bakery combining modern illustration with classic typography.',
    category: 'Brand Identity Design',
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
  },
  {
    id: 'post_6',
    title: 'Cloud Tech Logo',
    description: 'Abstract, geometric logo design representing cloud infrastructure and seamless connectivity.',
    category: 'Logo Design',
    image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 'post_17',
    title: 'Studio Monogram Logo',
    description: 'A striking, interlocking monogram logo designed for a boutique creative agency.',
    category: 'Logo Design',
    image_url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'post_18',
    title: 'Green Earth Logo',
    description: 'Minimalist leaf motif logo designed for an environmental conservation non-profit.',
    category: 'Logo Design',
    image_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: 'post_19',
    title: 'Audio Wave Logo',
    description: 'Dynamic logo using overlapping sound waves for a modern podcast production network.',
    category: 'Logo Design',
    image_url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString(),
  },
  {
    id: 'post_3',
    title: 'Synthwave Night Poster',
    description: 'Retro-futuristic poster design utilizing intense neon pinks and blues over dark cityscapes.',
    category: 'Poster Design',
    image_url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 'post_20',
    title: 'Blue Note Jazz Poster',
    description: 'Classic Swiss-style typography combined with duotone photography for an upcoming jazz festival.',
    category: 'Poster Design',
    image_url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'post_21',
    title: 'Sci-Fi Thriller Poster',
    description: 'High-tension movie poster design featuring dramatic lighting and bold, condensed typography.',
    category: 'Poster Design',
    image_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
  },
  {
    id: 'post_22',
    title: 'Modern Art Gallery Poster',
    description: 'Abstract, brutalist poster design promoting a contemporary art gallery exhibition.',
    category: 'Poster Design',
    image_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13).toISOString(),
  },
  {
    id: 'post_5',
    title: 'Tropical Beach Flyer',
    description: 'Vibrant illustration and expressive typography for a summer beach party promotional flyer.',
    category: 'Illustration',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'post_23',
    title: 'Elegant Gala Invitation',
    description: 'Sophisticated flyer design utilizing gold foil accents and deep navy backgrounds for a charity event.',
    category: 'Flyer Design',
    image_url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: 'post_24',
    title: 'Crossfit Gym Flyer',
    description: 'High-contrast, gritty flyer design to promote a local crossfit gym membership drive.',
    category: 'Flyer Design',
    image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: 'post_25',
    title: 'Street Taco Flyer',
    description: 'Fun, illustrative flyer serving as a hand-out menu for a new street taco food truck.',
    category: 'Flyer Design',
    image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  },
  {
    id: 'post_7',
    title: 'Lifestyle Instagram Templates',
    description: 'Cohesive pack of 15 Instagram post templates designed for lifestyle influencers and bloggers.',
    category: 'Social Media Design',
    image_url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: 'post_26',
    title: 'Corporate LinkedIn Banners',
    description: 'Professional, sleek LinkedIn banner templates optimized for B2B executives and consultants.',
    category: 'Social Media Design',
    image_url: 'https://images.unsplash.com/photo-1611926653458-09294b3142bf?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    id: 'post_27',
    title: 'Tech Review Thumbnails',
    description: 'High-impact YouTube thumbnail templates featuring bold text and dynamic cut-out layouts.',
    category: 'Social Media Design',
    image_url: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
  },
  {
    id: 'post_28',
    title: 'Twitter Growth Graphics',
    description: 'Minimalist graphic templates specifically sized and designed for engaging Twitter threads.',
    category: 'Social Media Design',
    image_url: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
  },
  {
    id: 'post_29',
    title: 'Neon Rain Cyberpunk City',
    description: 'AI generated concept art depicting a rain-soaked futuristic metropolis illuminated by neon.',
    category: 'AI Image',
    image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'post_30',
    title: 'Dreamscape Portrait',
    description: 'Surreal digital art blending classical portraiture with floating geometric anomalies.',
    category: 'AI Image',
    image_url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: 'post_31',
    title: 'Bioluminescent Forest',
    description: 'Lush, imaginative rendering of a glowing forest ecosystem blending nature and magic.',
    category: 'AI Image',
    image_url: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'post_32',
    title: 'Vaporwave Grid Render',
    description: 'Nostalgic 80s inspired 3D render featuring pastel grids, statues, and palm trees.',
    category: 'AI Image',
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 'post_33',
    title: 'Surreal 3D Landscape',
    description: 'Beautifully rendered 3D landscape featuring abstract geometry and dream-like lighting.',
    category: '3D Design',
    image_url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  },
  {
    id: 'post_34',
    title: 'Photorealistic Watch Render',
    description: 'Extremely detailed, photorealistic 3D rendering of a mechanical skeleton watch interior.',
    category: '3D Design',
    image_url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
  },
  {
    id: 'post_35',
    title: 'Stylized 3D Character',
    description: 'High-fidelity 3D character model showcasing expressive texturing and dynamic lighting.',
    category: '3D Design',
    image_url: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'post_36',
    title: 'Glass Dispersion Sculpture',
    description: 'Abstract 3D sculpture exploring light dispersion through complex glass geometry.',
    category: '3D Design',
    image_url: 'https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?auto=format&fit=crop&w=800&q=80',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
  },
];

// --- MOCK REVIEWS ---
const RAW_MOCK_REVIEWS: Review[] = [
  {
    "id": "rev_massive_brand_0",
    "post_id": "post_stress_massive_brand",
    "reviewer_id": "user_1",
    "created_at": "2026-05-27T04:49:06.744Z",
    "comment": "The typography is stunning and perfectly captures the 1920s vibe, but honestly, if you didn't tell me this was for a coffee shop, I would have guessed it was a men's barber shop. The purpose gets a bit lost in the styling.",
    "aesthetics": 5,
    "purpose": 4,
    "recognition": 5
  },
  {
    "id": "rev_massive_brand_1",
    "post_id": "post_stress_massive_brand",
    "reviewer_id": "user_2",
    "created_at": "2026-05-27T03:49:06.744Z",
    "comment": "Absolutely beautiful execution. The textures and color palette are extremely polished. However, the logo feels a bit overly complex for modern packaging scales.",
    "aesthetics": 5,
    "purpose": 5,
    "recognition": 5
  },
  {
    "id": "rev_massive_brand_2",
    "post_id": "post_stress_massive_brand",
    "reviewer_id": "user_3",
    "created_at": "2026-05-27T02:49:06.744Z",
    "comment": "I love the vintage industrial feel! The aesthetic is flawless. But the brand recognition might suffer because it lacks a clear, singular icon that stands out from a distance.",
    "aesthetics": 5,
    "purpose": 1,
    "recognition": 1
  },
  {
    "id": "rev_massive_brand_3",
    "post_id": "post_stress_massive_brand",
    "reviewer_id": "user_4",
    "created_at": "2026-05-27T01:49:06.744Z",
    "comment": "Gorgeous visual work. The aesthetic is incredibly strong. But it feels a little too generic 'vintage' rather than specifically tailored to coffee.",
    "aesthetics": 4,
    "purpose": 1,
    "recognition": 4
  },
  {
    "id": "rev_massive_brand_4",
    "post_id": "post_stress_massive_brand",
    "reviewer_id": "user_5",
    "created_at": "2026-05-27T00:49:06.744Z",
    "comment": "The craftsmanship here is undeniable. Great use of negative space and typography. It feels very premium.",
    "aesthetics": 5,
    "purpose": 1,
    "recognition": 2
  },
  {
    "id": "rev_massive_brand_5",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "UI Designer",
    "created_at": "2026-05-26T23:49:06.744Z",
    "comment": "Visually striking, but the messaging is confusing. The industrial look makes it feel heavy and unapproachable for a daily coffee spot.",
    "aesthetics": 5,
    "purpose": 5,
    "recognition": 1
  },
  {
    "id": "rev_massive_brand_6",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Brand Strategist",
    "created_at": "2026-05-26T22:49:06.744Z",
    "comment": "The aesthetic is a solid 5/5, but I'm giving purpose a lower score because the identity doesn't clearly communicate what the product actually is.",
    "aesthetics": 5,
    "purpose": 4,
    "recognition": 1
  },
  {
    "id": "rev_massive_brand_7",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Art Director",
    "created_at": "2026-05-26T21:49:06.744Z",
    "comment": "Really memorable design. The blend of 1920s type with modern layouts creates a very distinct, recognizable brand presence.",
    "aesthetics": 5,
    "purpose": 5,
    "recognition": 2
  },
  {
    "id": "rev_massive_brand_8",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "UX Researcher",
    "created_at": "2026-05-26T20:49:06.744Z",
    "comment": "It looks cool, but it's completely illegible at smaller sizes. The intricate details get muddy. Not very practical for physical packaging.",
    "aesthetics": 5,
    "purpose": 3,
    "recognition": 5
  },
  {
    "id": "rev_massive_brand_9",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Product Designer",
    "created_at": "2026-05-26T19:49:06.744Z",
    "comment": "Stunning color palette and typography choices. It feels very cohesive and well thought out.",
    "aesthetics": 5,
    "purpose": 5,
    "recognition": 3
  },
  {
    "id": "rev_massive_brand_10",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Creative Director",
    "created_at": "2026-05-26T18:49:06.744Z",
    "comment": "The identity feels very distinct and memorable. I would definitely recognize this brand on a shelf.",
    "aesthetics": 5,
    "purpose": 1,
    "recognition": 1
  },
  {
    "id": "rev_massive_brand_11",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Motion Designer",
    "created_at": "2026-05-26T17:49:06.744Z",
    "comment": "It's aesthetically pleasing but lacks a clear connection to coffee. The purpose isn't communicated well.",
    "aesthetics": 5,
    "purpose": 3,
    "recognition": 4
  },
  {
    "id": "rev_massive_brand_12",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Visual Designer",
    "created_at": "2026-05-26T16:49:06.744Z",
    "comment": "Very high quality rendering and presentation. The visual craft is top tier.",
    "aesthetics": 5,
    "purpose": 5,
    "recognition": 4
  },
  {
    "id": "rev_massive_brand_13",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Graphic Designer",
    "created_at": "2026-05-26T15:49:06.744Z",
    "comment": "The typography is gorgeous, but the overall vibe feels a bit too harsh for a cozy artisanal coffee shop.",
    "aesthetics": 5,
    "purpose": 3,
    "recognition": 1
  },
  {
    "id": "rev_massive_brand_14",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Frontend Engineer",
    "created_at": "2026-05-26T14:49:06.744Z",
    "comment": "I think the industrial vibe works perfectly for a modern, edgy roastery. It stands out from the typical minimalist coffee brands.",
    "aesthetics": 5,
    "purpose": 5,
    "recognition": 1
  },
  {
    "id": "rev_massive_brand_15",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Typography Expert",
    "created_at": "2026-05-26T13:49:06.744Z",
    "comment": "Beautiful work, but the recognition factor relies too heavily on the complex typography. It needs a simpler logo mark.",
    "aesthetics": 5,
    "purpose": 1,
    "recognition": 1
  },
  {
    "id": "rev_massive_brand_16",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Design Lead",
    "created_at": "2026-05-26T12:49:06.744Z",
    "comment": "The design is incredibly polished and the vintage aesthetic is nailed perfectly.",
    "aesthetics": 4,
    "purpose": 3,
    "recognition": 4
  },
  {
    "id": "rev_massive_brand_17",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "UI Designer",
    "created_at": "2026-05-26T11:49:06.744Z",
    "comment": "It looks amazing, but I'm not sure it aligns with the target audience of a local coffee shop. Feels a bit unapproachable.",
    "aesthetics": 5,
    "purpose": 4,
    "recognition": 3
  },
  {
    "id": "rev_massive_brand_18",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Brand Strategist",
    "created_at": "2026-05-26T10:49:06.744Z",
    "comment": "The branding is very strong and distinctive. It definitely leaves a lasting impression.",
    "aesthetics": 5,
    "purpose": 5,
    "recognition": 2
  },
  {
    "id": "rev_massive_brand_19",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Art Director",
    "created_at": "2026-05-26T09:49:06.744Z",
    "comment": "Visually flawless, but the core message gets buried under the heavy stylization.",
    "aesthetics": 5,
    "purpose": 1,
    "recognition": 3
  },
  {
    "id": "rev_massive_brand_20",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "UX Researcher",
    "created_at": "2026-05-26T08:49:06.744Z",
    "comment": "looks cool",
    "aesthetics": 5,
    "purpose": 5,
    "recognition": 5
  },
  {
    "id": "rev_massive_brand_21",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Product Designer",
    "created_at": "2026-05-26T07:49:06.744Z",
    "comment": "nice work",
    "aesthetics": 5,
    "purpose": 5,
    "recognition": 5
  },
  {
    "id": "rev_massive_brand_22",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Creative Director",
    "created_at": "2026-05-26T06:49:06.744Z",
    "comment": "🔥🔥🔥",
    "aesthetics": 3,
    "purpose": 3,
    "recognition": 3
  },
  {
    "id": "rev_massive_brand_23",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Motion Designer",
    "created_at": "2026-05-26T05:49:06.744Z",
    "comment": "first!",
    "aesthetics": 4,
    "purpose": 4,
    "recognition": 4
  },
  {
    "id": "rev_massive_brand_24",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Visual Designer",
    "created_at": "2026-05-26T04:49:06.744Z",
    "comment": "I like tea better anyway",
    "aesthetics": 3,
    "purpose": 3,
    "recognition": 3
  },
  {
    "id": "rev_massive_brand_25",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Graphic Designer",
    "created_at": "2026-05-26T03:49:06.744Z",
    "comment": "follow my instagram @design_guru_99",
    "aesthetics": 5,
    "purpose": 5,
    "recognition": 5
  },
  {
    "id": "rev_massive_brand_26",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Frontend Engineer",
    "created_at": "2026-05-26T02:49:06.744Z",
    "comment": "clean",
    "aesthetics": 5,
    "purpose": 5,
    "recognition": 5
  },
  {
    "id": "rev_massive_brand_27",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Typography Expert",
    "created_at": "2026-05-26T01:49:06.744Z",
    "comment": "wow",
    "aesthetics": 5,
    "purpose": 5,
    "recognition": 5
  },
  {
    "id": "rev_massive_brand_28",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Design Lead",
    "created_at": "2026-05-26T00:49:06.744Z",
    "comment": "great job",
    "aesthetics": 3,
    "purpose": 3,
    "recognition": 3
  },
  {
    "id": "rev_massive_brand_29",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "UI Designer",
    "created_at": "2026-05-25T23:49:06.744Z",
    "comment": "love it",
    "aesthetics": 4,
    "purpose": 4,
    "recognition": 4
  },
  {
    "id": "rev_massive_brand_30",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Brand Strategist",
    "created_at": "2026-05-25T22:49:06.744Z",
    "comment": "can you review my portfolio?",
    "aesthetics": 4,
    "purpose": 4,
    "recognition": 4
  },
  {
    "id": "rev_massive_brand_31",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Art Director",
    "created_at": "2026-05-25T21:49:06.744Z",
    "comment": "amazing",
    "aesthetics": 5,
    "purpose": 5,
    "recognition": 5
  },
  {
    "id": "rev_massive_brand_32",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "UX Researcher",
    "created_at": "2026-05-25T20:49:06.744Z",
    "comment": "dope",
    "aesthetics": 5,
    "purpose": 5,
    "recognition": 5
  },
  {
    "id": "rev_massive_brand_33",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Product Designer",
    "created_at": "2026-05-25T19:49:06.744Z",
    "comment": "sick",
    "aesthetics": 3,
    "purpose": 3,
    "recognition": 3
  },
  {
    "id": "rev_massive_brand_34",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Creative Director",
    "created_at": "2026-05-25T18:49:06.744Z",
    "comment": "what font is this?",
    "aesthetics": 5,
    "purpose": 5,
    "recognition": 5
  },
  {
    "id": "rev_massive_brand_35",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Motion Designer",
    "created_at": "2026-05-25T17:49:06.744Z",
    "comment": "cool beans",
    "aesthetics": 3,
    "purpose": 3,
    "recognition": 3
  },
  {
    "id": "rev_massive_brand_36",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Visual Designer",
    "created_at": "2026-05-25T16:49:06.744Z",
    "comment": "nice colors",
    "aesthetics": 5,
    "purpose": 5,
    "recognition": 5
  },
  {
    "id": "rev_massive_brand_37",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Graphic Designer",
    "created_at": "2026-05-25T15:49:06.744Z",
    "comment": "good",
    "aesthetics": 5,
    "purpose": 5,
    "recognition": 5
  },
  {
    "id": "rev_massive_brand_38",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Frontend Engineer",
    "created_at": "2026-05-25T14:49:06.744Z",
    "comment": "very nice",
    "aesthetics": 5,
    "purpose": 5,
    "recognition": 5
  },
  {
    "id": "rev_massive_brand_39",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Typography Expert",
    "created_at": "2026-05-25T13:49:06.744Z",
    "comment": "awesome design bro",
    "aesthetics": 5,
    "purpose": 5,
    "recognition": 5
  },
  {
    "id": "rev_massive_brand_40",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Design Lead",
    "created_at": "2026-05-25T12:49:06.744Z",
    "comment": "looks cool",
    "aesthetics": 5,
    "purpose": 5,
    "recognition": 5
  },
  {
    "id": "rev_massive_brand_41",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "UI Designer",
    "created_at": "2026-05-25T11:49:06.744Z",
    "comment": "nice work",
    "aesthetics": 5,
    "purpose": 5,
    "recognition": 5
  },
  {
    "id": "rev_massive_brand_42",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Brand Strategist",
    "created_at": "2026-05-25T10:49:06.744Z",
    "comment": "🔥🔥🔥",
    "aesthetics": 5,
    "purpose": 5,
    "recognition": 5
  },
  {
    "id": "rev_massive_brand_43",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "Art Director",
    "created_at": "2026-05-25T09:49:06.744Z",
    "comment": "first!",
    "aesthetics": 5,
    "purpose": 5,
    "recognition": 5
  },
  {
    "id": "rev_massive_brand_44",
    "post_id": "post_stress_massive_brand",
    "reviewer_name": "UX Researcher",
    "created_at": "2026-05-25T08:49:06.744Z",
    "comment": "I like tea better anyway",
    "aesthetics": 5,
    "purpose": 5,
    "recognition": 5
  },
  // --- Low Signal Test Reviews ---
  ...Array.from({ length: 6 }).map((_, i) => ({
    id: `review_low_signal_${i}`,
    post_id: 'post_stress_low_signal',
    reviewer_id: `user_${(i % 5) + 1}`,
    created_at: new Date(Date.now() - 1000 * 60 * (i * 10)).toISOString(),
    usability: 4,
    clarity: 4.5,
    aesthetics: 4,
    comment: ['Looks clean', 'nice layout', 'wow', 'fire', 'good job bro', 'clean design'][i]
  })),

  // --- Ratings Only Test Reviews ---
  ...Array.from({ length: 6 }).map((_, i) => ({
    id: `review_ratings_only_${i}`,
    post_id: 'post_stress_ratings_only',
    reviewer_id: `user_${(i % 5) + 1}`,
    created_at: new Date(Date.now() - 1000 * 60 * (i * 10)).toISOString(),
    usability: 4.8,
    clarity: 4.9,
    aesthetics: 4.5,
    comment: ['I love pizza', 'Follow my instagram @spam', 'hello world', 'buy crypto now', 'anyone here from brazil?', 'first comment!'][i]
  })),

  // --- Insufficient Signal Test Reviews ---
  ...Array.from({ length: 6 }).map((_, i) => ({
    id: `review_insufficient_${i}`,
    post_id: 'post_stress_insufficient',
    reviewer_id: `user_${(i % 5) + 1}`,
    created_at: new Date(Date.now() - 1000 * 60 * (i * 10)).toISOString(),
    // Flat/Neutral ratings (average around 3.0)
    recognition: 3,
    purpose: 3,
    aesthetics: 3,
    comment: ['spam 1', 'spam 2', 'spam 3', 'spam 4', 'spam 5', 'spam 6'][i]
  })),

  {
    "id": "rev_post_10_0",
    "post_id": "post_10",
    "reviewer_id": "user_1",
    "created_at": "2026-05-18T20:02:05.256Z",
    "comment": "Great use of negative space. It lets the content breathe nicely. The onboarding flow seems very frictionless. Good job reducing cognitive load. Love the subtle hover states on the cards. Makes the interface feel very responsive.",
    "usability": 4,
    "clarity": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_10_1",
    "post_id": "post_10",
    "reviewer_id": "user_2",
    "created_at": "2026-05-01T16:41:12.652Z",
    "comment": "Great use of negative space. It lets the content breathe nicely. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. The onboarding flow seems very frictionless. Good job reducing cognitive load.",
    "usability": 4,
    "clarity": 4,
    "aesthetics": 3
  },
  {
    "id": "rev_post_10_2",
    "post_id": "post_10",
    "reviewer_id": "user_5",
    "created_at": "2026-04-27T19:00:02.735Z",
    "comment": "Love the subtle hover states on the cards. Makes the interface feel very responsive. The contrast ratios are spot on. Very accessible and easy to read. The contrast ratios are spot on. Very accessible and easy to read.",
    "usability": 5,
    "clarity": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_10_3",
    "post_id": "post_10",
    "reviewer_id": "user_3",
    "created_at": "2026-05-04T18:02:07.805Z",
    "comment": "Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. The form fields lack clear focus states, making it hard to tell what's active. Navigation is completely hidden behind the hamburger menu on desktop. It adds unnecessary friction.",
    "usability": 5,
    "clarity": 3,
    "aesthetics": 3
  },
  {
    "id": "rev_post_10_4",
    "post_id": "post_10",
    "reviewer_id": "user_4",
    "created_at": "2026-05-18T19:24:38.825Z",
    "comment": "Hierarchy is a bit flat. It's hard to tell what I'm supposed to look at first. Navigation is completely hidden behind the hamburger menu on desktop. It adds unnecessary friction. Those drop shadows are a bit heavy-handed. Softening them would make it feel more modern.",
    "usability": 2,
    "clarity": 1,
    "aesthetics": 2
  },
  {
    "id": "rev_post_10_5",
    "post_id": "post_10",
    "reviewer_name": "Creative Craftsman",
    "device_id": "dff7844c-dc5f-45b3-be35-476e29ca447d",
    "created_at": "2026-05-01T19:15:23.398Z",
    "comment": "The onboarding flow seems very frictionless. Good job reducing cognitive load. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. Great use of negative space. It lets the content breathe nicely.",
    "usability": 4,
    "clarity": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_10_6",
    "post_id": "post_10",
    "reviewer_name": "Abstract Seeker",
    "device_id": "078a0ee9-20e0-4fd9-ae0e-0e5e07238000",
    "created_at": "2026-05-15T05:53:08.569Z",
    "comment": "The onboarding flow seems very frictionless. Good job reducing cognitive load. Great use of negative space. It lets the content breathe nicely. Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch.",
    "usability": 5,
    "clarity": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_10_7",
    "post_id": "post_10",
    "reviewer_name": "Dynamic Enthusiast",
    "device_id": "4a1cc2ac-cf4a-4ffb-8b2c-a87dbd176d09",
    "created_at": "2026-05-05T11:48:07.807Z",
    "comment": "Hierarchy is a bit flat. It's hard to tell what I'm supposed to look at first. The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets. The form fields lack clear focus states, making it hard to tell what's active.",
    "usability": 1,
    "clarity": 2,
    "aesthetics": 2
  },
  {
    "id": "rev_post_10_8",
    "post_id": "post_10",
    "reviewer_name": "Subtle Nomad",
    "device_id": "40b6f709-2548-42a8-b761-7c4a2c480dbd",
    "created_at": "2026-04-28T12:23:42.327Z",
    "comment": "Not a fan of the bright blue primary button, it clashes with the muted pastel palette. The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 1,
    "clarity": 2,
    "aesthetics": 4
  },
  {
    "id": "rev_post_10_9",
    "post_id": "post_10",
    "reviewer_name": "Lucid Seeker",
    "device_id": "280211bc-117e-43c1-affd-db90dc9a7307",
    "created_at": "2026-05-17T19:53:45.252Z",
    "comment": "The contrast ratios are spot on. Very accessible and easy to read. Great use of negative space. It lets the content breathe nicely. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 3,
    "clarity": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_10_10",
    "post_id": "post_10",
    "reviewer_name": "Organic Thinker",
    "device_id": "33e46f77-308a-4cc2-abea-a5b0cb878a80",
    "created_at": "2026-05-16T22:05:25.884Z",
    "comment": "The onboarding flow seems very frictionless. Good job reducing cognitive load. The typography scale is solid, and the cool gray background feels perfect for the warm imagery. Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch.",
    "usability": 4,
    "clarity": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_10_11",
    "post_id": "post_10",
    "reviewer_name": "Harmonic Ninja",
    "device_id": "468499e1-1903-4847-8838-03dfa1d1a1fe",
    "created_at": "2026-05-24T14:20:42.625Z",
    "comment": "The contrast ratios are spot on. Very accessible and easy to read. The onboarding flow seems very frictionless. Good job reducing cognitive load. Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch.",
    "usability": 5,
    "clarity": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_10_12",
    "post_id": "post_10",
    "reviewer_name": "Sleek Ninja",
    "device_id": "894c33b4-99b9-4a6d-9347-b4bec0973084",
    "created_at": "2026-04-29T17:48:22.371Z",
    "comment": "Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. The onboarding flow seems very frictionless. Good job reducing cognitive load. The form fields lack clear focus states, making it hard to tell what's active.",
    "usability": 5,
    "clarity": 4,
    "aesthetics": 3
  },
  {
    "id": "rev_post_10_13",
    "post_id": "post_10",
    "reviewer_name": "Subtle Wizard",
    "device_id": "b07e331f-c56d-496d-8a58-c040dbe6aa3d",
    "created_at": "2026-05-09T20:08:23.192Z",
    "comment": "Love the subtle hover states on the cards. Makes the interface feel very responsive. The contrast ratios are spot on. Very accessible and easy to read. The onboarding flow seems very frictionless. Good job reducing cognitive load.",
    "usability": 5,
    "clarity": 4,
    "aesthetics": 3
  },
  {
    "id": "rev_post_10_14",
    "post_id": "post_10",
    "reviewer_name": "Lucid Observer",
    "device_id": "da809d1e-bb63-4d25-bdf6-79a11f1d10e7",
    "created_at": "2026-05-08T21:37:57.979Z",
    "comment": "The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. Great use of negative space. It lets the content breathe nicely.",
    "usability": 2,
    "clarity": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_10_15",
    "post_id": "post_10",
    "reviewer_name": "Harmonic Wizard",
    "device_id": "cb98f036-225f-414c-9db3-9dac7081d209",
    "created_at": "2026-05-19T09:10:08.452Z",
    "comment": "The form fields lack clear focus states, making it hard to tell what's active. The form fields lack clear focus states, making it hard to tell what's active. Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch.",
    "usability": 1,
    "clarity": 1,
    "aesthetics": 4
  },
  {
    "id": "rev_post_10_16",
    "post_id": "post_10",
    "reviewer_name": "Harmonic Fox",
    "device_id": "4fd88548-c7da-4397-8bf3-74fb0e4a43bb",
    "created_at": "2026-04-27T21:38:13.154Z",
    "comment": "Not a fan of the bright blue primary button, it clashes with the muted pastel palette. Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch. The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability.",
    "usability": 1,
    "clarity": 5,
    "aesthetics": 2
  },
  {
    "id": "rev_post_10_17",
    "post_id": "post_10",
    "reviewer_name": "Digital Enthusiast",
    "device_id": "d0aeb3b2-4ef0-456d-a291-a449eaa8eac2",
    "created_at": "2026-05-21T10:16:46.490Z",
    "comment": "Navigation is completely hidden behind the hamburger menu on desktop. It adds unnecessary friction. Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 2,
    "clarity": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_10_18",
    "post_id": "post_10",
    "reviewer_name": "Subtle Craftsman",
    "device_id": "73653a73-558b-48c6-8691-a57b175b459c",
    "created_at": "2026-05-15T06:03:35.572Z",
    "comment": "Love the subtle hover states on the cards. Makes the interface feel very responsive. The typography scale is solid, and the cool gray background feels perfect for the warm imagery. The onboarding flow seems very frictionless. Good job reducing cognitive load.",
    "usability": 4,
    "clarity": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_10_19",
    "post_id": "post_10",
    "reviewer_name": "Lucid Explorer",
    "device_id": "367eb6bf-369d-4875-9699-a3a5c355e34d",
    "created_at": "2026-04-30T05:11:15.497Z",
    "comment": "Hierarchy is a bit flat. It's hard to tell what I'm supposed to look at first. Great use of negative space. It lets the content breathe nicely. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious.",
    "usability": 3,
    "clarity": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_10_20",
    "post_id": "post_10",
    "reviewer_name": "Bold Guru",
    "device_id": "0a965cf0-e645-40f9-b7b8-4e41704f79bb",
    "created_at": "2026-05-03T07:00:25.231Z",
    "comment": "Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. The contrast ratios are spot on. Very accessible and easy to read. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 5,
    "clarity": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_10_21",
    "post_id": "post_10",
    "reviewer_name": "Lucid Architect",
    "device_id": "0ebb47a3-5a83-4ef8-a5af-7d5080e685b5",
    "created_at": "2026-05-19T19:52:03.778Z",
    "comment": "The contrast ratios are spot on. Very accessible and easy to read. The contrast ratios are spot on. Very accessible and easy to read. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 3,
    "clarity": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_10_22",
    "post_id": "post_10",
    "reviewer_name": "Prismatic Ninja",
    "device_id": "a3282634-b36a-442a-86b5-f04dd4f82edd",
    "created_at": "2026-05-04T09:06:55.851Z",
    "comment": "Those drop shadows are a bit heavy-handed. Softening them would make it feel more modern. Those drop shadows are a bit heavy-handed. Softening them would make it feel more modern. The form fields lack clear focus states, making it hard to tell what's active.",
    "usability": 2,
    "clarity": 1,
    "aesthetics": 2
  },
  {
    "id": "rev_post_10_23",
    "post_id": "post_10",
    "reviewer_name": "Digital Craftsman",
    "device_id": "abef4674-0859-4ece-994c-3812e8bc228a",
    "created_at": "2026-05-07T02:55:59.206Z",
    "comment": "The contrast ratios are spot on. Very accessible and easy to read. The onboarding flow seems very frictionless. Good job reducing cognitive load. Love the subtle hover states on the cards. Makes the interface feel very responsive.",
    "usability": 5,
    "clarity": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_10_24",
    "post_id": "post_10",
    "reviewer_name": "Digital Nomad",
    "device_id": "574e3694-5f2a-464d-a3ff-661dd2cad55b",
    "created_at": "2026-05-07T07:15:02.348Z",
    "comment": "The form fields lack clear focus states, making it hard to tell what's active. The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets. The contrast ratios are spot on. Very accessible and easy to read.",
    "usability": 1,
    "clarity": 2,
    "aesthetics": 5
  },
  {
    "id": "rev_post_10_25",
    "post_id": "post_10",
    "reviewer_name": "Dynamic Fox",
    "device_id": "68b02138-9f30-4cfd-8ac9-9888b34b1b8b",
    "created_at": "2026-05-26T09:38:05.515Z",
    "comment": "The typography scale is solid, and the cool gray background feels perfect for the warm imagery. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 4,
    "clarity": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_10_26",
    "post_id": "post_10",
    "reviewer_name": "Creative Ninja",
    "device_id": "ce204515-d498-4773-8ed4-5308bb47beb0",
    "created_at": "2026-05-11T20:58:31.133Z",
    "comment": "The contrast ratios are spot on. Very accessible and easy to read. The form fields lack clear focus states, making it hard to tell what's active. The form fields lack clear focus states, making it hard to tell what's active.",
    "usability": 4,
    "clarity": 1,
    "aesthetics": 1
  },
  {
    "id": "rev_post_10_27",
    "post_id": "post_10",
    "reviewer_name": "Digital Fox",
    "device_id": "d40e2cde-c03f-4ffd-8293-39753beed560",
    "created_at": "2026-05-16T17:31:03.930Z",
    "comment": "The typography scale is solid, and the cool gray background feels perfect for the warm imagery. The typography scale is solid, and the cool gray background feels perfect for the warm imagery. The contrast ratios are spot on. Very accessible and easy to read.",
    "usability": 5,
    "clarity": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_10_28",
    "post_id": "post_10",
    "reviewer_name": "Fluid Pioneer",
    "device_id": "c0c61ef4-c6db-443f-a2b8-c91e8ecd3192",
    "created_at": "2026-05-07T19:42:11.114Z",
    "comment": "Those drop shadows are a bit heavy-handed. Softening them would make it feel more modern. Not a fan of the bright blue primary button, it clashes with the muted pastel palette. The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets.",
    "usability": 2,
    "clarity": 1,
    "aesthetics": 1
  },
  {
    "id": "rev_post_10_29",
    "post_id": "post_10",
    "reviewer_name": "Bold Observer",
    "device_id": "e2b2e66a-0114-4c11-91e5-f4a87f84b167",
    "created_at": "2026-05-07T19:00:46.580Z",
    "comment": "The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability.",
    "usability": 1,
    "clarity": 4,
    "aesthetics": 2
  },
  {
    "id": "rev_post_10_30",
    "post_id": "post_10",
    "reviewer_name": "Vector Enthusiast",
    "device_id": "5a63901e-c887-4473-bdd5-4414f1b90f49",
    "created_at": "2026-05-02T18:22:33.548Z",
    "comment": "Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch. The typography scale is solid, and the cool gray background feels perfect for the warm imagery. Great use of negative space. It lets the content breathe nicely.",
    "usability": 4,
    "clarity": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_10_31",
    "post_id": "post_10",
    "reviewer_name": "Prismatic Observer",
    "device_id": "55f327dd-b8dd-4300-b93e-1e6adafb21eb",
    "created_at": "2026-05-07T09:11:35.693Z",
    "comment": "The onboarding flow seems very frictionless. Good job reducing cognitive load. The onboarding flow seems very frictionless. Good job reducing cognitive load. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 4,
    "clarity": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_10_32",
    "post_id": "post_10",
    "reviewer_name": "Digital Architect",
    "device_id": "e66e05e7-17f6-4941-9421-b6e5d792612d",
    "created_at": "2026-05-26T00:59:04.629Z",
    "comment": "The onboarding flow seems very frictionless. Good job reducing cognitive load. Hierarchy is a bit flat. It's hard to tell what I'm supposed to look at first. The onboarding flow seems very frictionless. Good job reducing cognitive load.",
    "usability": 4,
    "clarity": 3,
    "aesthetics": 3
  },
  {
    "id": "rev_post_10_33",
    "post_id": "post_10",
    "reviewer_name": "Dynamic Craftsman",
    "device_id": "d96b254c-1e66-4bc4-b067-e2c29119611b",
    "created_at": "2026-05-24T18:21:37.713Z",
    "comment": "The contrast ratios are spot on. Very accessible and easy to read. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 5,
    "clarity": 5,
    "aesthetics": 3
  },
  {
    "id": "rev_post_10_34",
    "post_id": "post_10",
    "reviewer_name": "Creative Dreamer",
    "device_id": "489cf9f5-ecfa-492c-8f23-6d07cc7cdb3d",
    "created_at": "2026-05-24T02:48:33.937Z",
    "comment": "Hierarchy is a bit flat. It's hard to tell what I'm supposed to look at first. The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets. The onboarding flow seems very frictionless. Good job reducing cognitive load.",
    "usability": 1,
    "clarity": 2,
    "aesthetics": 4
  },
  {
    "id": "rev_post_10_35",
    "post_id": "post_10",
    "reviewer_name": "Lucid Pioneer",
    "device_id": "aade6714-701a-45c1-ad07-81ac8957df01",
    "created_at": "2026-05-09T00:41:53.474Z",
    "comment": "The onboarding flow seems very frictionless. Good job reducing cognitive load. Love the subtle hover states on the cards. Makes the interface feel very responsive. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 4,
    "clarity": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_10_36",
    "post_id": "post_10",
    "reviewer_name": "Digital Explorer",
    "device_id": "6fc89178-2ea3-427e-a1fa-8937e606372c",
    "created_at": "2026-05-23T12:50:44.886Z",
    "comment": "Hierarchy is a bit flat. It's hard to tell what I'm supposed to look at first. The contrast ratios are spot on. Very accessible and easy to read. The onboarding flow seems very frictionless. Good job reducing cognitive load.",
    "usability": 2,
    "clarity": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_10_37",
    "post_id": "post_10",
    "reviewer_name": "Creative Visionary",
    "device_id": "22db9925-94e9-4ef3-b5e1-f64c873efd3f",
    "created_at": "2026-05-23T16:31:22.924Z",
    "comment": "Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch. The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability. Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch.",
    "usability": 5,
    "clarity": 2,
    "aesthetics": 4
  },
  {
    "id": "rev_post_10_38",
    "post_id": "post_10",
    "reviewer_name": "Subtle Ninja",
    "device_id": "0432de8f-736a-4cb1-a1e5-d398523f1820",
    "created_at": "2026-05-12T19:40:44.284Z",
    "comment": "The contrast ratios are spot on. Very accessible and easy to read. The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability. Great use of negative space. It lets the content breathe nicely.",
    "usability": 3,
    "clarity": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_10_39",
    "post_id": "post_10",
    "reviewer_name": "Digital Wizard",
    "device_id": "73afc839-de52-45a2-ab25-a520d000e314",
    "created_at": "2026-05-25T05:07:47.624Z",
    "comment": "Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch. Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch. Love the subtle hover states on the cards. Makes the interface feel very responsive.",
    "usability": 4,
    "clarity": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_10_40",
    "post_id": "post_10",
    "reviewer_name": "Vector Panda",
    "device_id": "7017f283-f9e0-4127-aacd-48012f305002",
    "created_at": "2026-05-23T16:07:48.100Z",
    "comment": "The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets. Love the subtle hover states on the cards. Makes the interface feel very responsive. The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability.",
    "usability": 2,
    "clarity": 5,
    "aesthetics": 2
  },
  {
    "id": "rev_post_10_41",
    "post_id": "post_10",
    "reviewer_name": "Fluid Enthusiast",
    "device_id": "933795f3-b7e4-4658-8feb-c97c015090a6",
    "created_at": "2026-05-22T20:18:40.358Z",
    "comment": "The onboarding flow seems very frictionless. Good job reducing cognitive load. Those drop shadows are a bit heavy-handed. Softening them would make it feel more modern. Hierarchy is a bit flat. It's hard to tell what I'm supposed to look at first.",
    "usability": 5,
    "clarity": 3,
    "aesthetics": 3
  },
  {
    "id": "rev_post_10_42",
    "post_id": "post_10",
    "reviewer_name": "Tactile Architect",
    "device_id": "7a9c0707-ba64-40f8-99ae-377ea0dffe81",
    "created_at": "2026-05-10T17:11:34.878Z",
    "comment": "The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets. Great use of negative space. It lets the content breathe nicely. Love the subtle hover states on the cards. Makes the interface feel very responsive.",
    "usability": 3,
    "clarity": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_10_43",
    "post_id": "post_10",
    "reviewer_name": "Pixel Dreamer",
    "device_id": "15dbcf70-21f4-4b14-8023-49dc23bda673",
    "created_at": "2026-05-14T14:25:29.917Z",
    "comment": "Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. Navigation is completely hidden behind the hamburger menu on desktop. It adds unnecessary friction. The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets.",
    "usability": 5,
    "clarity": 1,
    "aesthetics": 1
  },
  {
    "id": "rev_post_10_44",
    "post_id": "post_10",
    "reviewer_name": "Fluid Craftsman",
    "device_id": "3a131afd-f7c3-4e2d-8dfd-c8620d605424",
    "created_at": "2026-05-05T03:01:33.819Z",
    "comment": "The onboarding flow seems very frictionless. Good job reducing cognitive load. Love the subtle hover states on the cards. Makes the interface feel very responsive. Great use of negative space. It lets the content breathe nicely.",
    "usability": 4,
    "clarity": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_10_45",
    "post_id": "post_10",
    "reviewer_name": "Geometric Artisan",
    "device_id": "127b1c80-a409-4f13-b55f-1d29be28f6b5",
    "created_at": "2026-05-03T20:30:38.407Z",
    "comment": "The typography scale is solid, and the cool gray background feels perfect for the warm imagery. The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets. The onboarding flow seems very frictionless. Good job reducing cognitive load.",
    "usability": 4,
    "clarity": 2,
    "aesthetics": 4
  },
  {
    "id": "rev_post_10_46",
    "post_id": "post_10",
    "reviewer_name": "Lucid Thinker",
    "device_id": "79b98556-fdd8-46c7-9d68-5622372aabbe",
    "created_at": "2026-05-22T16:50:05.583Z",
    "comment": "The typography scale is solid, and the cool gray background feels perfect for the warm imagery. The contrast ratios are spot on. Very accessible and easy to read. The contrast ratios are spot on. Very accessible and easy to read.",
    "usability": 3,
    "clarity": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_10_47",
    "post_id": "post_10",
    "reviewer_name": "Subtle Fox",
    "device_id": "104cb524-916c-4734-9ed4-acf94513eb29",
    "created_at": "2026-05-01T18:47:43.651Z",
    "comment": "Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch. The typography scale is solid, and the cool gray background feels perfect for the warm imagery. Hierarchy is a bit flat. It's hard to tell what I'm supposed to look at first.",
    "usability": 5,
    "clarity": 3,
    "aesthetics": 3
  },
  {
    "id": "rev_post_10_48",
    "post_id": "post_10",
    "reviewer_name": "Lucid Nomad",
    "device_id": "8583b149-1c7b-438d-9736-9e039f7eb0fa",
    "created_at": "2026-05-09T21:57:55.267Z",
    "comment": "The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability. The typography scale is solid, and the cool gray background feels perfect for the warm imagery. The onboarding flow seems very frictionless. Good job reducing cognitive load.",
    "usability": 3,
    "clarity": 5,
    "aesthetics": 3
  },
  {
    "id": "rev_post_10_49",
    "post_id": "post_10",
    "reviewer_name": "Vibrant Enthusiast",
    "device_id": "7d895e47-2509-494e-85e0-99703da6e6f5",
    "created_at": "2026-05-25T09:22:28.654Z",
    "comment": "Great use of negative space. It lets the content breathe nicely. Those drop shadows are a bit heavy-handed. Softening them would make it feel more modern. Hierarchy is a bit flat. It's hard to tell what I'm supposed to look at first.",
    "usability": 4,
    "clarity": 2,
    "aesthetics": 2
  },
  {
    "id": "rev_post_10_50",
    "post_id": "post_10",
    "reviewer_name": "Vibrant Maker",
    "device_id": "9838d4e4-cb3a-4c3b-ba3f-45167058d1b6",
    "created_at": "2026-05-01T01:26:39.514Z",
    "comment": "Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. Great use of negative space. It lets the content breathe nicely. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious.",
    "usability": 3,
    "clarity": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_10_51",
    "post_id": "post_10",
    "reviewer_name": "Bold Explorer",
    "device_id": "a977b0d8-9dfb-4642-9c5f-bf3d64288dc8",
    "created_at": "2026-05-01T01:21:52.513Z",
    "comment": "The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets. The onboarding flow seems very frictionless. Good job reducing cognitive load. Love the subtle hover states on the cards. Makes the interface feel very responsive.",
    "usability": 1,
    "clarity": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_10_52",
    "post_id": "post_10",
    "reviewer_name": "Bold Thinker",
    "device_id": "2b4d5a66-4af9-445d-beef-0af6e12539e1",
    "created_at": "2026-05-02T15:20:40.918Z",
    "comment": "The typography scale is solid, and the cool gray background feels perfect for the warm imagery. The typography scale is solid, and the cool gray background feels perfect for the warm imagery. Hierarchy is a bit flat. It's hard to tell what I'm supposed to look at first.",
    "usability": 5,
    "clarity": 5,
    "aesthetics": 2
  },
  {
    "id": "rev_post_10_53",
    "post_id": "post_10",
    "reviewer_name": "Digital Maverick",
    "device_id": "0803a154-01c1-47a0-8ad9-692622c0b9e9",
    "created_at": "2026-05-10T04:51:03.360Z",
    "comment": "Great use of negative space. It lets the content breathe nicely. The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability. Great use of negative space. It lets the content breathe nicely.",
    "usability": 5,
    "clarity": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_10_54",
    "post_id": "post_10",
    "reviewer_name": "Fluid Maverick",
    "device_id": "cf7a1511-db5c-4d5f-825a-98d1093c6005",
    "created_at": "2026-04-29T14:44:39.172Z",
    "comment": "Great use of negative space. It lets the content breathe nicely. The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability. Love the subtle hover states on the cards. Makes the interface feel very responsive.",
    "usability": 5,
    "clarity": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_10_55",
    "post_id": "post_10",
    "reviewer_name": "Subtle Thinker",
    "device_id": "cf245817-8ab9-44ba-9e72-94958894ecb1",
    "created_at": "2026-05-26T16:22:54.906Z",
    "comment": "The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability. Great use of negative space. It lets the content breathe nicely. The contrast ratios are spot on. Very accessible and easy to read.",
    "usability": 1,
    "clarity": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_10_56",
    "post_id": "post_10",
    "reviewer_name": "Prismatic Artisan",
    "device_id": "d40c8865-a60e-494a-8026-c4e72d7cb5eb",
    "created_at": "2026-05-12T10:29:02.359Z",
    "comment": "Not a fan of the bright blue primary button, it clashes with the muted pastel palette. Love the subtle hover states on the cards. Makes the interface feel very responsive. The contrast ratios are spot on. Very accessible and easy to read.",
    "usability": 3,
    "clarity": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_10_57",
    "post_id": "post_10",
    "reviewer_name": "Prismatic Architect",
    "device_id": "bf562212-46de-4c66-be9c-425f0966fe31",
    "created_at": "2026-05-05T08:37:28.481Z",
    "comment": "The contrast ratios are spot on. Very accessible and easy to read. The contrast ratios are spot on. Very accessible and easy to read. The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets.",
    "usability": 5,
    "clarity": 5,
    "aesthetics": 2
  },
  {
    "id": "rev_post_10_58",
    "post_id": "post_10",
    "reviewer_name": "Pixel Maverick",
    "device_id": "6112279c-b45a-4353-ae52-3be05bbf16e2",
    "created_at": "2026-05-04T05:41:23.735Z",
    "comment": "The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability. The typography scale is solid, and the cool gray background feels perfect for the warm imagery. Love the subtle hover states on the cards. Makes the interface feel very responsive.",
    "usability": 3,
    "clarity": 5,
    "aesthetics": 3
  },
  {
    "id": "rev_post_10_59",
    "post_id": "post_10",
    "reviewer_name": "Harmonic Nomad",
    "device_id": "80d6464f-8c26-45e4-a95a-4b45fe924f4c",
    "created_at": "2026-05-16T23:26:35.503Z",
    "comment": "Love the subtle hover states on the cards. Makes the interface feel very responsive. Great use of negative space. It lets the content breathe nicely. Great use of negative space. It lets the content breathe nicely.",
    "usability": 4,
    "clarity": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_10_60",
    "post_id": "post_10",
    "reviewer_name": "Tactile Panda",
    "device_id": "5dbc769e-d067-42a6-8c6e-b378c8770ed0",
    "created_at": "2026-05-23T05:27:50.151Z",
    "comment": "Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. Love the subtle hover states on the cards. Makes the interface feel very responsive. The onboarding flow seems very frictionless. Good job reducing cognitive load.",
    "usability": 3,
    "clarity": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_10_61",
    "post_id": "post_10",
    "reviewer_name": "Geometric Visionary",
    "device_id": "646d290d-e9e1-44a1-92a9-0f238803bb02",
    "created_at": "2026-05-15T08:09:44.358Z",
    "comment": "Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch. Great use of negative space. It lets the content breathe nicely. The onboarding flow seems very frictionless. Good job reducing cognitive load.",
    "usability": 5,
    "clarity": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_1_0",
    "post_id": "post_1",
    "reviewer_id": "user_1",
    "created_at": "2026-05-06T17:48:01.128Z",
    "comment": "Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch. Great use of negative space. It lets the content breathe nicely. Love the subtle hover states on the cards. Makes the interface feel very responsive.",
    "usability": 4,
    "clarity": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_1",
    "post_id": "post_1",
    "reviewer_id": "user_2",
    "created_at": "2026-05-18T15:58:44.560Z",
    "comment": "Great use of negative space. It lets the content breathe nicely. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. Love the subtle hover states on the cards. Makes the interface feel very responsive.",
    "usability": 5,
    "clarity": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_1_2",
    "post_id": "post_1",
    "reviewer_id": "user_3",
    "created_at": "2026-05-21T23:15:44.502Z",
    "comment": "The onboarding flow seems very frictionless. Good job reducing cognitive load. The contrast ratios are spot on. Very accessible and easy to read. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious.",
    "usability": 4,
    "clarity": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_1_3",
    "post_id": "post_1",
    "reviewer_id": "user_4",
    "created_at": "2026-05-16T22:41:40.166Z",
    "comment": "The onboarding flow seems very frictionless. Good job reducing cognitive load. The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets. Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch.",
    "usability": 4,
    "clarity": 1,
    "aesthetics": 4
  },
  {
    "id": "rev_post_1_4",
    "post_id": "post_1",
    "reviewer_id": "user_5",
    "created_at": "2026-05-25T12:35:01.393Z",
    "comment": "Love the subtle hover states on the cards. Makes the interface feel very responsive. Great use of negative space. It lets the content breathe nicely. The form fields lack clear focus states, making it hard to tell what's active.",
    "usability": 5,
    "clarity": 5,
    "aesthetics": 3
  },
  {
    "id": "rev_post_1_5",
    "post_id": "post_1",
    "reviewer_name": "Vector Observer",
    "device_id": "6a41a53f-a2bb-40c2-a8ae-abfb761dbc0f",
    "created_at": "2026-05-10T18:30:56.813Z",
    "comment": "The typography scale is solid, and the cool gray background feels perfect for the warm imagery. The contrast ratios are spot on. Very accessible and easy to read. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious.",
    "usability": 4,
    "clarity": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_6",
    "post_id": "post_1",
    "reviewer_name": "Abstract Enthusiast",
    "device_id": "deade402-fb1a-4ee1-9bfa-fb8b26edd14b",
    "created_at": "2026-05-08T23:56:07.358Z",
    "comment": "Great use of negative space. It lets the content breathe nicely. The onboarding flow seems very frictionless. Good job reducing cognitive load. Great use of negative space. It lets the content breathe nicely.",
    "usability": 4,
    "clarity": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_7",
    "post_id": "post_1",
    "reviewer_name": "Digital Ninja",
    "device_id": "a901613a-6f42-4546-9a91-cbe96bea21c5",
    "created_at": "2026-04-27T15:21:44.955Z",
    "comment": "Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch. Hierarchy is a bit flat. It's hard to tell what I'm supposed to look at first. Great use of negative space. It lets the content breathe nicely.",
    "usability": 5,
    "clarity": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_1_8",
    "post_id": "post_1",
    "reviewer_name": "Monochrome Wizard",
    "device_id": "59e7dd51-6462-4379-95c6-34a96e906abd",
    "created_at": "2026-04-30T00:08:23.332Z",
    "comment": "Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. The form fields lack clear focus states, making it hard to tell what's active. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious.",
    "usability": 5,
    "clarity": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_9",
    "post_id": "post_1",
    "reviewer_name": "Vibrant Pioneer",
    "device_id": "0ee849c7-1801-4ee3-b139-8efcb9ce1798",
    "created_at": "2026-05-08T06:13:47.690Z",
    "comment": "The contrast ratios are spot on. Very accessible and easy to read. The contrast ratios are spot on. Very accessible and easy to read. Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch.",
    "usability": 4,
    "clarity": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_1_10",
    "post_id": "post_1",
    "reviewer_name": "Tactile Observer",
    "device_id": "312b4630-d099-45d5-9a23-d3a697b55750",
    "created_at": "2026-05-26T15:00:10.657Z",
    "comment": "The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability. Navigation is completely hidden behind the hamburger menu on desktop. It adds unnecessary friction. Hierarchy is a bit flat. It's hard to tell what I'm supposed to look at first.",
    "usability": 1,
    "clarity": 1,
    "aesthetics": 1
  },
  {
    "id": "rev_post_1_11",
    "post_id": "post_1",
    "reviewer_name": "Monochrome Artisan",
    "device_id": "bdea48e4-35e3-4b2c-802d-e0c939c43d26",
    "created_at": "2026-05-02T02:26:09.547Z",
    "comment": "The contrast ratios are spot on. Very accessible and easy to read. Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch. Great use of negative space. It lets the content breathe nicely.",
    "usability": 3,
    "clarity": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_1_12",
    "post_id": "post_1",
    "reviewer_name": "Lucid Maker",
    "device_id": "3494c922-0270-44f5-8fc0-05341f7eca28",
    "created_at": "2026-05-06T09:56:12.090Z",
    "comment": "Navigation is completely hidden behind the hamburger menu on desktop. It adds unnecessary friction. Navigation is completely hidden behind the hamburger menu on desktop. It adds unnecessary friction. The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets.",
    "usability": 1,
    "clarity": 2,
    "aesthetics": 2
  },
  {
    "id": "rev_post_1_13",
    "post_id": "post_1",
    "reviewer_name": "Tactile Pioneer",
    "device_id": "01642f72-3d31-45cb-8f45-d676507dd3ef",
    "created_at": "2026-05-21T13:25:29.686Z",
    "comment": "The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability. Navigation is completely hidden behind the hamburger menu on desktop. It adds unnecessary friction. Those drop shadows are a bit heavy-handed. Softening them would make it feel more modern.",
    "usability": 1,
    "clarity": 2,
    "aesthetics": 1
  },
  {
    "id": "rev_post_1_14",
    "post_id": "post_1",
    "reviewer_name": "Tactile Guru",
    "device_id": "ecfa5922-c729-4de7-b550-bcc4a25fb114",
    "created_at": "2026-05-26T12:13:47.569Z",
    "comment": "The contrast ratios are spot on. Very accessible and easy to read. The onboarding flow seems very frictionless. Good job reducing cognitive load. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious.",
    "usability": 5,
    "clarity": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_15",
    "post_id": "post_1",
    "reviewer_name": "Kinetic Thinker",
    "device_id": "a2c6bec7-aa53-47e0-8de8-8ea36406b59b",
    "created_at": "2026-05-11T10:46:29.691Z",
    "comment": "The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets. The contrast ratios are spot on. Very accessible and easy to read. Those drop shadows are a bit heavy-handed. Softening them would make it feel more modern.",
    "usability": 2,
    "clarity": 4,
    "aesthetics": 2
  },
  {
    "id": "rev_post_1_16",
    "post_id": "post_1",
    "reviewer_name": "Tactile Nomad",
    "device_id": "049de0d3-1948-496d-a4c9-51b89a018f43",
    "created_at": "2026-05-19T11:58:05.226Z",
    "comment": "The contrast ratios are spot on. Very accessible and easy to read. Great use of negative space. It lets the content breathe nicely. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 4,
    "clarity": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_17",
    "post_id": "post_1",
    "reviewer_name": "Sleek Pioneer",
    "device_id": "dbeab52d-b6ad-42af-b793-a2b694b521b1",
    "created_at": "2026-04-28T02:41:32.065Z",
    "comment": "The typography scale is solid, and the cool gray background feels perfect for the warm imagery. The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets. Hierarchy is a bit flat. It's hard to tell what I'm supposed to look at first.",
    "usability": 4,
    "clarity": 1,
    "aesthetics": 2
  },
  {
    "id": "rev_post_1_18",
    "post_id": "post_1",
    "reviewer_name": "Bold Nomad",
    "device_id": "900d046d-44ba-490d-92a3-9847510d81e7",
    "created_at": "2026-05-02T18:07:02.644Z",
    "comment": "The form fields lack clear focus states, making it hard to tell what's active. The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability. Not a fan of the bright blue primary button, it clashes with the muted pastel palette.",
    "usability": 2,
    "clarity": 1,
    "aesthetics": 1
  },
  {
    "id": "rev_post_1_19",
    "post_id": "post_1",
    "reviewer_name": "Abstract Maker",
    "device_id": "73d21a70-2c91-4014-813b-917ec5666355",
    "created_at": "2026-05-21T20:20:54.507Z",
    "comment": "Hierarchy is a bit flat. It's hard to tell what I'm supposed to look at first. The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious.",
    "usability": 2,
    "clarity": 2,
    "aesthetics": 4
  },
  {
    "id": "rev_post_1_20",
    "post_id": "post_1",
    "reviewer_name": "Vibrant Guru",
    "device_id": "8ef68e06-6ca3-4de2-92e1-5cc71be7626e",
    "created_at": "2026-05-25T16:01:41.208Z",
    "comment": "Love the subtle hover states on the cards. Makes the interface feel very responsive. The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability. Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch.",
    "usability": 4,
    "clarity": 1,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_21",
    "post_id": "post_1",
    "reviewer_name": "Creative Dreamer",
    "device_id": "1cf5c92c-1dda-4819-be0e-a5e3941b533c",
    "created_at": "2026-05-15T06:41:09.526Z",
    "comment": "The contrast ratios are spot on. Very accessible and easy to read. The typography scale is solid, and the cool gray background feels perfect for the warm imagery. Love the subtle hover states on the cards. Makes the interface feel very responsive.",
    "usability": 3,
    "clarity": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_22",
    "post_id": "post_1",
    "reviewer_name": "Prismatic Architect",
    "device_id": "d21db876-aa11-46c5-9305-7e45175c0b77",
    "created_at": "2026-04-29T06:59:18.350Z",
    "comment": "The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability. Hierarchy is a bit flat. It's hard to tell what I'm supposed to look at first. The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets.",
    "usability": 1,
    "clarity": 1,
    "aesthetics": 2
  },
  {
    "id": "rev_post_1_23",
    "post_id": "post_1",
    "reviewer_name": "Monochrome Nomad",
    "device_id": "130bbe47-c98a-452a-ba50-2e7b1376bf22",
    "created_at": "2026-05-08T23:36:33.928Z",
    "comment": "The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability. Those drop shadows are a bit heavy-handed. Softening them would make it feel more modern. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 1,
    "clarity": 1,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_24",
    "post_id": "post_1",
    "reviewer_name": "Subtle Seeker",
    "device_id": "4ebc5031-2801-4609-854f-6513457dbde0",
    "created_at": "2026-05-06T13:54:51.623Z",
    "comment": "Great use of negative space. It lets the content breathe nicely. Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 4,
    "clarity": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_25",
    "post_id": "post_1",
    "reviewer_name": "Harmonic Maker",
    "device_id": "628429aa-9c01-4ff6-ad7f-ccddef6e157a",
    "created_at": "2026-05-20T19:58:16.909Z",
    "comment": "Great use of negative space. It lets the content breathe nicely. Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch. The onboarding flow seems very frictionless. Good job reducing cognitive load.",
    "usability": 5,
    "clarity": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_1_26",
    "post_id": "post_1",
    "reviewer_name": "Lucid Craftsman",
    "device_id": "c7472430-4188-470f-a788-d419a7073b66",
    "created_at": "2026-04-28T17:25:35.934Z",
    "comment": "Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch. The contrast ratios are spot on. Very accessible and easy to read. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 5,
    "clarity": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_27",
    "post_id": "post_1",
    "reviewer_name": "Sleek Panda",
    "device_id": "575b3664-92cc-4239-9517-040750c919d0",
    "created_at": "2026-04-28T03:22:21.563Z",
    "comment": "The contrast ratios are spot on. Very accessible and easy to read. The contrast ratios are spot on. Very accessible and easy to read. Great use of negative space. It lets the content breathe nicely.",
    "usability": 3,
    "clarity": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_1_28",
    "post_id": "post_1",
    "reviewer_name": "Creative Explorer",
    "device_id": "151a21ec-a53a-4d90-b338-a1df548e85a3",
    "created_at": "2026-04-28T13:26:20.076Z",
    "comment": "The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability. Love the subtle hover states on the cards. Makes the interface feel very responsive. The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets.",
    "usability": 2,
    "clarity": 5,
    "aesthetics": 1
  },
  {
    "id": "rev_post_1_29",
    "post_id": "post_1",
    "reviewer_name": "Lucid Critic",
    "device_id": "49941cfe-1908-487a-b2c5-001f17e66ca0",
    "created_at": "2026-04-27T21:58:48.382Z",
    "comment": "Great use of negative space. It lets the content breathe nicely. Love the subtle hover states on the cards. Makes the interface feel very responsive. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 4,
    "clarity": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_30",
    "post_id": "post_1",
    "reviewer_name": "Prismatic Craftsman",
    "device_id": "2c69d42e-c250-4fd4-8a63-eff2615d7524",
    "created_at": "2026-04-30T10:59:22.501Z",
    "comment": "The form fields lack clear focus states, making it hard to tell what's active. The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability. The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability.",
    "usability": 1,
    "clarity": 2,
    "aesthetics": 2
  },
  {
    "id": "rev_post_1_31",
    "post_id": "post_1",
    "reviewer_name": "Digital Enthusiast",
    "device_id": "94fce632-4457-4c74-a2e7-02697ef85c90",
    "created_at": "2026-05-06T18:56:29.719Z",
    "comment": "Hierarchy is a bit flat. It's hard to tell what I'm supposed to look at first. The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets. The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets.",
    "usability": 1,
    "clarity": 1,
    "aesthetics": 2
  },
  {
    "id": "rev_post_1_32",
    "post_id": "post_1",
    "reviewer_name": "Lucid Guru",
    "device_id": "0daa4762-c312-4c96-871d-80dace6366e2",
    "created_at": "2026-05-21T14:34:01.610Z",
    "comment": "Love the subtle hover states on the cards. Makes the interface feel very responsive. The typography scale is solid, and the cool gray background feels perfect for the warm imagery. The form fields lack clear focus states, making it hard to tell what's active.",
    "usability": 3,
    "clarity": 5,
    "aesthetics": 3
  },
  {
    "id": "rev_post_1_33",
    "post_id": "post_1",
    "reviewer_name": "Lucid Artisan",
    "device_id": "1994998b-a5da-491b-9b7c-c66037b959dc",
    "created_at": "2026-05-21T08:06:30.935Z",
    "comment": "Not a fan of the bright blue primary button, it clashes with the muted pastel palette. Hierarchy is a bit flat. It's hard to tell what I'm supposed to look at first. The form fields lack clear focus states, making it hard to tell what's active.",
    "usability": 2,
    "clarity": 1,
    "aesthetics": 2
  },
  {
    "id": "rev_post_1_34",
    "post_id": "post_1",
    "reviewer_name": "Bold Seeker",
    "device_id": "8bf6f02a-ac28-4b65-9abb-2682162fae9f",
    "created_at": "2026-05-18T09:20:11.766Z",
    "comment": "The onboarding flow seems very frictionless. Good job reducing cognitive load. Great use of negative space. It lets the content breathe nicely. Hierarchy is a bit flat. It's hard to tell what I'm supposed to look at first.",
    "usability": 3,
    "clarity": 3,
    "aesthetics": 3
  },
  {
    "id": "rev_post_1_35",
    "post_id": "post_1",
    "reviewer_name": "Sleek Guru",
    "device_id": "e38b1a7d-748e-4f8e-9373-b6c1c8250701",
    "created_at": "2026-05-26T10:06:57.299Z",
    "comment": "Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. Great use of negative space. It lets the content breathe nicely. The onboarding flow seems very frictionless. Good job reducing cognitive load.",
    "usability": 4,
    "clarity": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_36",
    "post_id": "post_1",
    "reviewer_name": "Creative Craftsman",
    "device_id": "0032197c-4f60-49b9-8f7d-1dbc1deed293",
    "created_at": "2026-05-07T15:09:49.531Z",
    "comment": "The typography scale is solid, and the cool gray background feels perfect for the warm imagery. The contrast ratios are spot on. Very accessible and easy to read. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious.",
    "usability": 4,
    "clarity": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_37",
    "post_id": "post_1",
    "reviewer_name": "Minimalist Pioneer",
    "device_id": "4e9aae9c-558c-483e-badf-82aa0e31ee40",
    "created_at": "2026-05-15T20:45:03.408Z",
    "comment": "Love the subtle hover states on the cards. Makes the interface feel very responsive. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. Love the subtle hover states on the cards. Makes the interface feel very responsive.",
    "usability": 4,
    "clarity": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_38",
    "post_id": "post_1",
    "reviewer_name": "Creative Panda",
    "device_id": "c34060a3-a408-47c3-896b-fa79968e4d8b",
    "created_at": "2026-05-10T05:45:24.371Z",
    "comment": "Hierarchy is a bit flat. It's hard to tell what I'm supposed to look at first. The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability. The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability.",
    "usability": 1,
    "clarity": 2,
    "aesthetics": 2
  },
  {
    "id": "rev_post_1_39",
    "post_id": "post_1",
    "reviewer_name": "Harmonic Guru",
    "device_id": "a57d80e1-06a8-414a-90d8-069a0f89d2fb",
    "created_at": "2026-04-27T12:22:27.592Z",
    "comment": "The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability. Those drop shadows are a bit heavy-handed. Softening them would make it feel more modern. The contrast ratios are spot on. Very accessible and easy to read.",
    "usability": 1,
    "clarity": 2,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_40",
    "post_id": "post_1",
    "reviewer_name": "Vibrant Craftsman",
    "device_id": "b324a509-1f0d-41e4-86d5-006ab95004da",
    "created_at": "2026-05-01T10:37:59.845Z",
    "comment": "The typography scale is solid, and the cool gray background feels perfect for the warm imagery. The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability. The onboarding flow seems very frictionless. Good job reducing cognitive load.",
    "usability": 5,
    "clarity": 1,
    "aesthetics": 4
  },
  {
    "id": "rev_post_1_41",
    "post_id": "post_1",
    "reviewer_name": "Tactile Enthusiast",
    "device_id": "3b6cf101-3817-4d62-bfc8-3c5f6769856d",
    "created_at": "2026-05-25T17:54:20.046Z",
    "comment": "Great use of negative space. It lets the content breathe nicely. Hierarchy is a bit flat. It's hard to tell what I'm supposed to look at first. Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch.",
    "usability": 4,
    "clarity": 3,
    "aesthetics": 3
  },
  {
    "id": "rev_post_1_42",
    "post_id": "post_1",
    "reviewer_name": "Bold Thinker",
    "device_id": "932fcbcc-a19f-4ba6-b4bf-20fb07513d12",
    "created_at": "2026-05-06T01:02:55.809Z",
    "comment": "Great use of negative space. It lets the content breathe nicely. The onboarding flow seems very frictionless. Good job reducing cognitive load. The onboarding flow seems very frictionless. Good job reducing cognitive load.",
    "usability": 3,
    "clarity": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_1_43",
    "post_id": "post_1",
    "reviewer_name": "Harmonic Architect",
    "device_id": "d1fb86ef-e101-4e7d-b1a3-c37b5168651f",
    "created_at": "2026-04-30T11:27:33.775Z",
    "comment": "The contrast ratios are spot on. Very accessible and easy to read. The contrast ratios are spot on. Very accessible and easy to read. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 3,
    "clarity": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_44",
    "post_id": "post_1",
    "reviewer_name": "Vibrant Observer",
    "device_id": "0d72ac94-f5d7-46dc-ade0-9580e645205a",
    "created_at": "2026-05-21T19:34:49.076Z",
    "comment": "Love the subtle hover states on the cards. Makes the interface feel very responsive. The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability. The contrast ratios are spot on. Very accessible and easy to read.",
    "usability": 4,
    "clarity": 1,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_45",
    "post_id": "post_1",
    "reviewer_name": "Abstract Maverick",
    "device_id": "520d015d-299a-425d-a795-3b2b742519f3",
    "created_at": "2026-05-01T14:24:15.466Z",
    "comment": "The typography scale is solid, and the cool gray background feels perfect for the warm imagery. The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability. Great use of negative space. It lets the content breathe nicely.",
    "usability": 4,
    "clarity": 3,
    "aesthetics": 3
  },
  {
    "id": "rev_post_1_46",
    "post_id": "post_1",
    "reviewer_name": "Tactile Seeker",
    "device_id": "d353a34b-08c1-4e5c-a014-c809265684e1",
    "created_at": "2026-05-05T18:40:02.460Z",
    "comment": "Love the subtle hover states on the cards. Makes the interface feel very responsive. The onboarding flow seems very frictionless. Good job reducing cognitive load. Hierarchy is a bit flat. It's hard to tell what I'm supposed to look at first.",
    "usability": 5,
    "clarity": 5,
    "aesthetics": 3
  },
  {
    "id": "rev_post_1_47",
    "post_id": "post_1",
    "reviewer_name": "Vibrant Seeker",
    "device_id": "b3496f57-771a-4139-a06e-d653a08fae93",
    "created_at": "2026-04-28T11:00:25.668Z",
    "comment": "Great use of negative space. It lets the content breathe nicely. The contrast ratios are spot on. Very accessible and easy to read. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 3,
    "clarity": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_48",
    "post_id": "post_1",
    "reviewer_name": "Vibrant Thinker",
    "device_id": "78902a60-e82f-478e-ab36-b562a658e9ba",
    "created_at": "2026-05-08T00:30:28.576Z",
    "comment": "The typography scale is solid, and the cool gray background feels perfect for the warm imagery. Great use of negative space. It lets the content breathe nicely. Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch.",
    "usability": 5,
    "clarity": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_1_49",
    "post_id": "post_1",
    "reviewer_name": "Digital Thinker",
    "device_id": "3b63f2ff-cc47-40a6-9055-4dd202057b69",
    "created_at": "2026-05-06T15:50:11.750Z",
    "comment": "The onboarding flow seems very frictionless. Good job reducing cognitive load. The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets. The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability.",
    "usability": 4,
    "clarity": 1,
    "aesthetics": 2
  },
  {
    "id": "rev_post_1_50",
    "post_id": "post_1",
    "reviewer_name": "Creative Critic",
    "device_id": "c4e81ad7-67c4-4b0c-af85-67ad4b7a2601",
    "created_at": "2026-05-17T20:21:46.829Z",
    "comment": "Great use of negative space. It lets the content breathe nicely. The typography scale is solid, and the cool gray background feels perfect for the warm imagery. Great use of negative space. It lets the content breathe nicely.",
    "usability": 4,
    "clarity": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_51",
    "post_id": "post_1",
    "reviewer_name": "Minimalist Ninja",
    "device_id": "2e201cfe-9582-491b-9582-e0c449f5be5d",
    "created_at": "2026-05-06T22:47:56.007Z",
    "comment": "Hierarchy is a bit flat. It's hard to tell what I'm supposed to look at first. Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch. Not a fan of the bright blue primary button, it clashes with the muted pastel palette.",
    "usability": 1,
    "clarity": 4,
    "aesthetics": 1
  },
  {
    "id": "rev_post_1_52",
    "post_id": "post_1",
    "reviewer_name": "Vibrant Architect",
    "device_id": "cee309db-2feb-4358-971c-fac7360362b1",
    "created_at": "2026-05-08T21:18:25.368Z",
    "comment": "Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. The contrast ratios are spot on. Very accessible and easy to read. Great use of negative space. It lets the content breathe nicely.",
    "usability": 3,
    "clarity": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_1_53",
    "post_id": "post_1",
    "reviewer_name": "Subtle Pioneer",
    "device_id": "5a1d2284-75a5-4b4a-b927-89ad02c60487",
    "created_at": "2026-05-15T05:41:51.879Z",
    "comment": "Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. The contrast ratios are spot on. Very accessible and easy to read. Love the subtle hover states on the cards. Makes the interface feel very responsive.",
    "usability": 5,
    "clarity": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_1_54",
    "post_id": "post_1",
    "reviewer_name": "Dynamic Explorer",
    "device_id": "233408f7-b868-448c-ba77-59d8f68455e9",
    "created_at": "2026-05-17T15:38:42.023Z",
    "comment": "The typography scale is solid, and the cool gray background feels perfect for the warm imagery. The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability. Great use of negative space. It lets the content breathe nicely.",
    "usability": 5,
    "clarity": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_55",
    "post_id": "post_1",
    "reviewer_name": "Tactile Artisan",
    "device_id": "a4d66a1f-2336-4858-b452-41bd08f7a200",
    "created_at": "2026-05-25T01:50:46.203Z",
    "comment": "Love the subtle hover states on the cards. Makes the interface feel very responsive. Love the subtle hover states on the cards. Makes the interface feel very responsive. Not a fan of the bright blue primary button, it clashes with the muted pastel palette.",
    "usability": 4,
    "clarity": 4,
    "aesthetics": 1
  },
  {
    "id": "rev_post_1_56",
    "post_id": "post_1",
    "reviewer_name": "Fluid Seeker",
    "device_id": "adeac4c1-ec8d-4784-8914-c8f1536a30f5",
    "created_at": "2026-05-26T10:24:05.026Z",
    "comment": "The contrast ratios are spot on. Very accessible and easy to read. The form fields lack clear focus states, making it hard to tell what's active. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 5,
    "clarity": 1,
    "aesthetics": 4
  },
  {
    "id": "rev_post_1_57",
    "post_id": "post_1",
    "reviewer_name": "Prismatic Fox",
    "device_id": "927ea233-3c3b-4951-95ae-2a3dd5b1afb6",
    "created_at": "2026-05-24T01:14:34.850Z",
    "comment": "Those drop shadows are a bit heavy-handed. Softening them would make it feel more modern. Navigation is completely hidden behind the hamburger menu on desktop. It adds unnecessary friction. The onboarding flow seems very frictionless. Good job reducing cognitive load.",
    "usability": 2,
    "clarity": 2,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_58",
    "post_id": "post_1",
    "reviewer_name": "Geometric Architect",
    "device_id": "2d7f2615-cf9d-488d-9c6f-a1aff4912978",
    "created_at": "2026-05-03T05:51:06.060Z",
    "comment": "The onboarding flow seems very frictionless. Good job reducing cognitive load. The contrast ratios are spot on. Very accessible and easy to read. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 5,
    "clarity": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_59",
    "post_id": "post_1",
    "reviewer_name": "Fluid Visionary",
    "device_id": "dee790bd-d291-4920-9b76-5d689f20a173",
    "created_at": "2026-05-09T08:34:02.379Z",
    "comment": "The onboarding flow seems very frictionless. Good job reducing cognitive load. Love the subtle hover states on the cards. Makes the interface feel very responsive. Great use of negative space. It lets the content breathe nicely.",
    "usability": 5,
    "clarity": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_1_60",
    "post_id": "post_1",
    "reviewer_name": "Sleek Visionary",
    "device_id": "3aa787d4-74bb-4237-a9c0-7e79fe587b42",
    "created_at": "2026-05-23T03:09:31.866Z",
    "comment": "The onboarding flow seems very frictionless. Good job reducing cognitive load. Love the subtle hover states on the cards. Makes the interface feel very responsive. Those drop shadows are a bit heavy-handed. Softening them would make it feel more modern.",
    "usability": 4,
    "clarity": 4,
    "aesthetics": 1
  },
  {
    "id": "rev_post_1_61",
    "post_id": "post_1",
    "reviewer_name": "Kinetic Visionary",
    "device_id": "0b78069f-9384-49c2-917c-69499c8c1cd2",
    "created_at": "2026-05-20T13:58:49.345Z",
    "comment": "The contrast ratios are spot on. Very accessible and easy to read. Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch. The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets.",
    "usability": 5,
    "clarity": 5,
    "aesthetics": 3
  },
  {
    "id": "rev_post_1_62",
    "post_id": "post_1",
    "reviewer_name": "Geometric Ninja",
    "device_id": "c417b802-ec72-4868-8850-0aac1ae68b2f",
    "created_at": "2026-05-05T08:10:35.423Z",
    "comment": "Navigation is completely hidden behind the hamburger menu on desktop. It adds unnecessary friction. The form fields lack clear focus states, making it hard to tell what's active. The form fields lack clear focus states, making it hard to tell what's active.",
    "usability": 1,
    "clarity": 2,
    "aesthetics": 2
  },
  {
    "id": "rev_post_1_63",
    "post_id": "post_1",
    "reviewer_name": "Bold Enthusiast",
    "device_id": "ad27f97e-afb7-460f-83c5-1eae2fe244e2",
    "created_at": "2026-05-17T20:48:51.877Z",
    "comment": "The form fields lack clear focus states, making it hard to tell what's active. Love the subtle hover states on the cards. Makes the interface feel very responsive. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious.",
    "usability": 3,
    "clarity": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_64",
    "post_id": "post_1",
    "reviewer_name": "Sleek Fox",
    "device_id": "6ec62922-ee6b-4611-b941-8a059245cf0b",
    "created_at": "2026-04-27T03:11:26.675Z",
    "comment": "Love the subtle hover states on the cards. Makes the interface feel very responsive. Not a fan of the bright blue primary button, it clashes with the muted pastel palette. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious.",
    "usability": 5,
    "clarity": 1,
    "aesthetics": 4
  },
  {
    "id": "rev_post_1_65",
    "post_id": "post_1",
    "reviewer_name": "Kinetic Fox",
    "device_id": "06611e1a-2c4c-4521-9e7e-8cf09a202bad",
    "created_at": "2026-05-13T08:14:31.640Z",
    "comment": "Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. The contrast ratios are spot on. Very accessible and easy to read. Great use of negative space. It lets the content breathe nicely.",
    "usability": 5,
    "clarity": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_66",
    "post_id": "post_1",
    "reviewer_name": "Kinetic Maker",
    "device_id": "3bebfadc-c780-4d18-a1ed-054b2a117590",
    "created_at": "2026-05-14T01:34:56.044Z",
    "comment": "Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets. Great use of negative space. It lets the content breathe nicely.",
    "usability": 4,
    "clarity": 1,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_67",
    "post_id": "post_1",
    "reviewer_name": "Organic Explorer",
    "device_id": "362c2213-60cb-4069-82e7-d7b3c25e3b2a",
    "created_at": "2026-05-16T19:08:26.496Z",
    "comment": "The typography scale is solid, and the cool gray background feels perfect for the warm imagery. Those drop shadows are a bit heavy-handed. Softening them would make it feel more modern. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 5,
    "clarity": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_1_68",
    "post_id": "post_1",
    "reviewer_name": "Fluid Dreamer",
    "device_id": "14f5e3cc-15d8-4c87-83bf-7423786c5218",
    "created_at": "2026-05-17T20:37:09.669Z",
    "comment": "The onboarding flow seems very frictionless. Good job reducing cognitive load. Great use of negative space. It lets the content breathe nicely. Those drop shadows are a bit heavy-handed. Softening them would make it feel more modern.",
    "usability": 4,
    "clarity": 4,
    "aesthetics": 3
  },
  {
    "id": "rev_post_1_69",
    "post_id": "post_1",
    "reviewer_name": "Dynamic Craftsman",
    "device_id": "cb1e9058-2543-4eda-83fe-e248918f1bbe",
    "created_at": "2026-05-19T23:01:54.151Z",
    "comment": "The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets. The contrast ratios are spot on. Very accessible and easy to read. Great use of negative space. It lets the content breathe nicely.",
    "usability": 1,
    "clarity": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_1_70",
    "post_id": "post_1",
    "reviewer_name": "Bold Craftsman",
    "device_id": "c775c391-b259-4a22-bef6-e07f5e913070",
    "created_at": "2026-05-19T13:00:13.141Z",
    "comment": "Love the subtle hover states on the cards. Makes the interface feel very responsive. The onboarding flow seems very frictionless. Good job reducing cognitive load. Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch.",
    "usability": 5,
    "clarity": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_1_71",
    "post_id": "post_1",
    "reviewer_name": "Prismatic Guru",
    "device_id": "c295bed6-7be1-4f78-bccc-0e8c8b4a12a1",
    "created_at": "2026-05-24T19:48:52.273Z",
    "comment": "Love the subtle hover states on the cards. Makes the interface feel very responsive. Navigation is completely hidden behind the hamburger menu on desktop. It adds unnecessary friction. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 3,
    "clarity": 3,
    "aesthetics": 3
  },
  {
    "id": "rev_post_1_72",
    "post_id": "post_1",
    "reviewer_name": "Monochrome Observer",
    "device_id": "735259e6-9a86-4882-acaf-0ea45019bbad",
    "created_at": "2026-05-18T21:10:08.563Z",
    "comment": "The contrast ratios are spot on. Very accessible and easy to read. The contrast ratios are spot on. Very accessible and easy to read. The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability.",
    "usability": 4,
    "clarity": 5,
    "aesthetics": 2
  },
  {
    "id": "rev_post_25_0",
    "post_id": "post_25",
    "reviewer_id": "user_2",
    "created_at": "2026-05-22T12:18:01.436Z",
    "comment": "The use of human faces makes it feel very relatable and trustworthy. It feels a bit text-heavy for a social media ad. People will just scroll past. The composition is a bit static and boring. It doesn't really pop.",
    "impact": 5,
    "clarity": 2,
    "engagement": 2
  },
  {
    "id": "rev_post_25_1",
    "post_id": "post_25",
    "reviewer_id": "user_1",
    "created_at": "2026-05-16T09:41:10.992Z",
    "comment": "The composition is a bit static and boring. It doesn't really pop. The imagery feels a bit like stock photos. It lacks authenticity. The use of human faces makes it feel very relatable and trustworthy.",
    "impact": 2,
    "clarity": 2,
    "engagement": 5
  },
  {
    "id": "rev_post_3_0",
    "post_id": "post_3",
    "reviewer_id": "user_2",
    "created_at": "2026-05-22T12:14:56.996Z",
    "comment": "Clear, punchy copy that pairs perfectly with the bold imagery. The visual hierarchy guides the eye straight to the value proposition. The headline typography is a bit hard to read against that busy background.",
    "impact": 4,
    "clarity": 4,
    "engagement": 1
  },
  {
    "id": "rev_post_3_1",
    "post_id": "post_3",
    "reviewer_id": "user_4",
    "created_at": "2026-05-26T07:43:38.430Z",
    "comment": "Really dynamic composition. The angled lines give it a lot of energy. Excellent use of the brand colors to create a cohesive campaign feel. The call to action is impossible to miss. Great use of contrasting colors.",
    "impact": 5,
    "clarity": 5,
    "engagement": 3
  },
  {
    "id": "rev_post_30_0",
    "post_id": "post_30",
    "reviewer_id": "user_4",
    "created_at": "2026-05-20T17:58:48.702Z",
    "comment": "Love the stylized approach. The limited color palette works incredibly well. The anatomy feels a bit off, particularly around the shoulders and neck. Really expressive character design. You can feel the emotion.",
    "composition": 4,
    "detail": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_30_1",
    "post_id": "post_30",
    "reviewer_id": "user_5",
    "created_at": "2026-05-03T06:17:57.040Z",
    "comment": "Really expressive character design. You can feel the emotion. It feels a bit over-rendered. Sometimes less is more. The rendering quality is top-notch. Very clean and noise-free.",
    "composition": 5,
    "detail": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_30_2",
    "post_id": "post_30",
    "reviewer_id": "user_3",
    "created_at": "2026-05-21T18:30:28.486Z",
    "comment": "The rendering quality is top-notch. Very clean and noise-free. It feels a bit over-rendered. Sometimes less is more. The textures look a bit tiling/repetitive in the background.",
    "composition": 5,
    "detail": 1,
    "aesthetics": 2
  },
  {
    "id": "rev_post_30_3",
    "post_id": "post_30",
    "reviewer_id": "user_2",
    "created_at": "2026-05-05T06:03:09.786Z",
    "comment": "The shadows are too completely black. Adding some ambient bounce light would make it richer. The rendering quality is top-notch. Very clean and noise-free. The lighting here is phenomenal. The soft rim light really separates the subject from the background.",
    "composition": 1,
    "detail": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_30_4",
    "post_id": "post_30",
    "reviewer_id": "user_1",
    "created_at": "2026-05-19T19:03:53.238Z",
    "comment": "The rendering quality is top-notch. Very clean and noise-free. Really expressive character design. You can feel the emotion. The perspective on the background buildings doesn't quite align with the foreground.",
    "composition": 4,
    "detail": 5,
    "aesthetics": 3
  },
  {
    "id": "rev_post_30_5",
    "post_id": "post_30",
    "reviewer_name": "Subtle Explorer",
    "device_id": "57382b1d-8597-4e8a-a7e4-cbe92b30686a",
    "created_at": "2026-05-05T05:05:13.624Z",
    "comment": "Love the stylized approach. The limited color palette works incredibly well. The lighting here is phenomenal. The soft rim light really separates the subject from the background. Love the stylized approach. The limited color palette works incredibly well.",
    "composition": 5,
    "detail": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_30_6",
    "post_id": "post_30",
    "reviewer_name": "Tactile Visionary",
    "device_id": "3c778a83-d98e-4aa6-80b1-f97396235fde",
    "created_at": "2026-04-29T22:03:01.413Z",
    "comment": "Love the stylized approach. The limited color palette works incredibly well. The rendering quality is top-notch. Very clean and noise-free. The anatomy feels a bit off, particularly around the shoulders and neck.",
    "composition": 5,
    "detail": 4,
    "aesthetics": 2
  },
  {
    "id": "rev_post_30_7",
    "post_id": "post_30",
    "reviewer_name": "Vibrant Dreamer",
    "device_id": "7704c9c1-80d3-4f1b-b9d5-2766fd1756c0",
    "created_at": "2026-05-21T21:30:04.102Z",
    "comment": "The sense of depth and perspective is masterful. The composition feels a bit unbalanced, heavily weighted to the left side. The rendering quality is top-notch. Very clean and noise-free.",
    "composition": 5,
    "detail": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_30_8",
    "post_id": "post_30",
    "reviewer_name": "Monochrome Dreamer",
    "device_id": "55b39b24-21df-461b-9b87-c770b06d42a8",
    "created_at": "2026-04-28T04:46:46.692Z",
    "comment": "The lighting here is phenomenal. The soft rim light really separates the subject from the background. The composition rule of thirds is executed perfectly here. It feels a bit over-rendered. Sometimes less is more.",
    "composition": 3,
    "detail": 5,
    "aesthetics": 3
  },
  {
    "id": "rev_post_30_9",
    "post_id": "post_30",
    "reviewer_name": "Minimalist Craftsman",
    "device_id": "ed20037d-7f5a-4c04-9799-390d46fcd9d7",
    "created_at": "2026-05-06T06:14:55.143Z",
    "comment": "The colors feel a bit muddy and desaturated. It lacks pop. The perspective on the background buildings doesn't quite align with the foreground. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic.",
    "composition": 2,
    "detail": 2,
    "aesthetics": 5
  },
  {
    "id": "rev_post_30_10",
    "post_id": "post_30",
    "reviewer_name": "Vector Panda",
    "device_id": "3057aa80-46eb-461d-9f19-88a326146e93",
    "created_at": "2026-05-20T17:15:09.629Z",
    "comment": "The composition rule of thirds is executed perfectly here. The composition feels a bit unbalanced, heavily weighted to the left side. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic.",
    "composition": 4,
    "detail": 2,
    "aesthetics": 4
  },
  {
    "id": "rev_post_27_0",
    "post_id": "post_27",
    "reviewer_id": "user_1",
    "created_at": "2026-05-26T08:51:56.782Z",
    "comment": "The composition is a bit static and boring. It doesn't really pop. Excellent use of the brand colors to create a cohesive campaign feel. The visual hook is immediate. It grabs attention right away.",
    "impact": 3,
    "clarity": 3,
    "engagement": 4
  },
  {
    "id": "rev_post_27_1",
    "post_id": "post_27",
    "reviewer_id": "user_2",
    "created_at": "2026-05-12T07:39:52.462Z",
    "comment": "The composition is a bit static and boring. It doesn't really pop. Really dynamic composition. The angled lines give it a lot of energy. The call to action is buried at the bottom. It should be much more prominent.",
    "impact": 2,
    "clarity": 4,
    "engagement": 1
  },
  {
    "id": "rev_post_27_2",
    "post_id": "post_27",
    "reviewer_id": "user_5",
    "created_at": "2026-05-05T00:35:36.056Z",
    "comment": "The use of human faces makes it feel very relatable and trustworthy. The call to action is impossible to miss. Great use of contrasting colors. The headline typography is a bit hard to read against that busy background.",
    "impact": 3,
    "clarity": 4,
    "engagement": 3
  },
  {
    "id": "rev_post_27_3",
    "post_id": "post_27",
    "reviewer_id": "user_3",
    "created_at": "2026-05-17T17:24:19.332Z",
    "comment": "The headline typography is a bit hard to read against that busy background. Clear, punchy copy that pairs perfectly with the bold imagery. The call to action is buried at the bottom. It should be much more prominent.",
    "impact": 2,
    "clarity": 5,
    "engagement": 2
  },
  {
    "id": "rev_post_27_4",
    "post_id": "post_27",
    "reviewer_id": "user_4",
    "created_at": "2026-04-28T14:37:43.478Z",
    "comment": "The tone is a bit too aggressive. It feels more like a hard sell than an invitation. There's too much competing information. The main message gets lost in the noise. The imagery feels a bit like stock photos. It lacks authenticity.",
    "impact": 1,
    "clarity": 1,
    "engagement": 2
  },
  {
    "id": "rev_post_8_0",
    "post_id": "post_8",
    "reviewer_id": "user_1",
    "created_at": "2026-05-14T16:03:36.521Z",
    "comment": "The onboarding flow seems very frictionless. Good job reducing cognitive load. The contrast ratios are spot on. Very accessible and easy to read. Not a fan of the bright blue primary button, it clashes with the muted pastel palette.",
    "usability": 4,
    "clarity": 5,
    "aesthetics": 1
  },
  {
    "id": "rev_post_8_1",
    "post_id": "post_8",
    "reviewer_id": "user_5",
    "created_at": "2026-05-25T08:38:12.804Z",
    "comment": "Navigation is completely hidden behind the hamburger menu on desktop. It adds unnecessary friction. Those drop shadows are a bit heavy-handed. Softening them would make it feel more modern. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious.",
    "usability": 3,
    "clarity": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_8_2",
    "post_id": "post_8",
    "reviewer_id": "user_2",
    "created_at": "2026-04-27T20:22:01.154Z",
    "comment": "The contrast ratios are spot on. Very accessible and easy to read. Love the subtle hover states on the cards. Makes the interface feel very responsive. The contrast ratios are spot on. Very accessible and easy to read.",
    "usability": 5,
    "clarity": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_8_3",
    "post_id": "post_8",
    "reviewer_id": "user_4",
    "created_at": "2026-05-12T06:34:26.694Z",
    "comment": "The onboarding flow seems very frictionless. Good job reducing cognitive load. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. Great use of negative space. It lets the content breathe nicely.",
    "usability": 5,
    "clarity": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_8_4",
    "post_id": "post_8",
    "reviewer_id": "user_3",
    "created_at": "2026-05-03T15:18:33.904Z",
    "comment": "Love the subtle hover states on the cards. Makes the interface feel very responsive. The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets. Love the subtle hover states on the cards. Makes the interface feel very responsive.",
    "usability": 3,
    "clarity": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_8_5",
    "post_id": "post_8",
    "reviewer_name": "Lucid Architect",
    "device_id": "636cb675-c214-4b40-89d1-ac3edfb4597f",
    "created_at": "2026-05-18T15:17:26.273Z",
    "comment": "Great use of negative space. It lets the content breathe nicely. Not a fan of the bright blue primary button, it clashes with the muted pastel palette. Love the subtle hover states on the cards. Makes the interface feel very responsive.",
    "usability": 5,
    "clarity": 2,
    "aesthetics": 4
  },
  {
    "id": "rev_post_8_6",
    "post_id": "post_8",
    "reviewer_name": "Sleek Observer",
    "device_id": "b1d5f47a-8d37-4be0-8c36-8e4f0729bd2a",
    "created_at": "2026-05-22T21:04:57.558Z",
    "comment": "The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious.",
    "usability": 3,
    "clarity": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_8_7",
    "post_id": "post_8",
    "reviewer_name": "Abstract Artisan",
    "device_id": "a6bcec6d-25b8-43fa-815b-1c7e83c59a3e",
    "created_at": "2026-05-22T05:30:12.247Z",
    "comment": "The typography scale is solid, and the cool gray background feels perfect for the warm imagery. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. The form fields lack clear focus states, making it hard to tell what's active.",
    "usability": 3,
    "clarity": 5,
    "aesthetics": 3
  },
  {
    "id": "rev_post_8_8",
    "post_id": "post_8",
    "reviewer_name": "Prismatic Seeker",
    "device_id": "a620bb03-4343-4108-badf-da0639de9412",
    "created_at": "2026-05-13T10:40:41.526Z",
    "comment": "Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch. The onboarding flow seems very frictionless. Good job reducing cognitive load. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 4,
    "clarity": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_8_9",
    "post_id": "post_8",
    "reviewer_name": "Monochrome Nomad",
    "device_id": "54425f43-5b68-43d0-b938-9510073ec087",
    "created_at": "2026-05-21T13:07:50.367Z",
    "comment": "Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch. Love the subtle hover states on the cards. Makes the interface feel very responsive. Not a fan of the bright blue primary button, it clashes with the muted pastel palette.",
    "usability": 5,
    "clarity": 4,
    "aesthetics": 1
  },
  {
    "id": "rev_post_8_10",
    "post_id": "post_8",
    "reviewer_name": "Minimalist Guru",
    "device_id": "f51ce51d-e000-439e-9d61-b8c4bff20fef",
    "created_at": "2026-05-02T14:56:55.923Z",
    "comment": "The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability. Great use of negative space. It lets the content breathe nicely. The onboarding flow seems very frictionless. Good job reducing cognitive load.",
    "usability": 3,
    "clarity": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_8_11",
    "post_id": "post_8",
    "reviewer_name": "Creative Observer",
    "device_id": "832310d0-2ad5-4870-989e-8e7b5fccb3b1",
    "created_at": "2026-05-26T05:47:17.715Z",
    "comment": "Not a fan of the bright blue primary button, it clashes with the muted pastel palette. The form fields lack clear focus states, making it hard to tell what's active. The contrast ratios are spot on. Very accessible and easy to read.",
    "usability": 1,
    "clarity": 1,
    "aesthetics": 4
  },
  {
    "id": "rev_post_17_0",
    "post_id": "post_17",
    "reviewer_id": "user_5",
    "created_at": "2026-05-12T12:22:22.417Z",
    "comment": "The secondary brand marks are just as strong as the primary. Great system. The foil stamping concept is brilliant. Very memorable and elevates the perceived value immediately. The kerning on the logotype is a bit tight, especially around the 'R' and 'A'.",
    "recognition": 4,
    "purpose": 3,
    "aesthetics": 3
  },
  {
    "id": "rev_post_17_1",
    "post_id": "post_17",
    "reviewer_id": "user_4",
    "created_at": "2026-05-18T19:53:41.641Z",
    "comment": "Really strong brand recall here. The custom typography makes it instantly recognizable. The secondary brand marks are just as strong as the primary. Great system. I don't think the playful tone fits a B2B enterprise product. Seems misaligned.",
    "recognition": 4,
    "purpose": 5,
    "aesthetics": 1
  },
  {
    "id": "rev_post_17_2",
    "post_id": "post_17",
    "reviewer_id": "user_3",
    "created_at": "2026-05-19T14:26:50.797Z",
    "comment": "The packaging mockup looks great, but I question how this translates to digital touchpoints. This logo mark scales down beautifully. It works just as well small as it does large. The mark is a bit too abstract. I'm not sure it clearly communicates what the company actually does.",
    "recognition": 3,
    "purpose": 4,
    "aesthetics": 3
  },
  {
    "id": "rev_post_17_3",
    "post_id": "post_17",
    "reviewer_id": "user_2",
    "created_at": "2026-05-18T19:01:25.924Z",
    "comment": "The brand voice matches the visual identity perfectly. Very cohesive. I don't think the playful tone fits a B2B enterprise product. Seems misaligned. The packaging mockup looks great, but I question how this translates to digital touchpoints.",
    "recognition": 5,
    "purpose": 1,
    "aesthetics": 2
  },
  {
    "id": "rev_post_17_4",
    "post_id": "post_17",
    "reviewer_id": "user_1",
    "created_at": "2026-05-14T22:18:49.404Z",
    "comment": "This logo mark scales down beautifully. It works just as well small as it does large. The earthy green color palette perfectly aligns with the organic/sustainable messaging. Love the playful use of shapes. It gives the brand a very approachable, friendly feel.",
    "recognition": 4,
    "purpose": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_17_5",
    "post_id": "post_17",
    "reviewer_name": "Prismatic Nomad",
    "device_id": "c183a5fe-f45d-4fc4-8d20-0194bf0e58f8",
    "created_at": "2026-05-08T11:03:24.405Z",
    "comment": "The earthy green color palette perfectly aligns with the organic/sustainable messaging. Really strong brand recall here. The custom typography makes it instantly recognizable. Love the playful use of shapes. It gives the brand a very approachable, friendly feel.",
    "recognition": 4,
    "purpose": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_17_6",
    "post_id": "post_17",
    "reviewer_name": "Creative Craftsman",
    "device_id": "b4d9ef62-85f7-419c-8a2b-67886b38b19b",
    "created_at": "2026-05-13T08:22:59.964Z",
    "comment": "It feels a bit generic, like I've seen this exact geometric sans-serif treatment a dozen times. It feels a bit generic, like I've seen this exact geometric sans-serif treatment a dozen times. This logo mark scales down beautifully. It works just as well small as it does large.",
    "recognition": 1,
    "purpose": 1,
    "aesthetics": 5
  },
  {
    "id": "rev_post_17_7",
    "post_id": "post_17",
    "reviewer_name": "Bold Artisan",
    "device_id": "152ffc39-e04c-4c31-9119-7fd11ca10b2a",
    "created_at": "2026-05-12T21:00:31.201Z",
    "comment": "This logo mark scales down beautifully. It works just as well small as it does large. This logo mark scales down beautifully. It works just as well small as it does large. The foil stamping concept is brilliant. Very memorable and elevates the perceived value immediately.",
    "recognition": 4,
    "purpose": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_17_8",
    "post_id": "post_17",
    "reviewer_name": "Pixel Critic",
    "device_id": "248449d5-2396-4ea0-9ce9-737d51b3c663",
    "created_at": "2026-05-19T19:02:26.650Z",
    "comment": "The foil stamping concept is brilliant. Very memorable and elevates the perceived value immediately. This logo mark scales down beautifully. It works just as well small as it does large. Love the playful use of shapes. It gives the brand a very approachable, friendly feel.",
    "recognition": 4,
    "purpose": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_17_9",
    "post_id": "post_17",
    "reviewer_name": "Tactile Explorer",
    "device_id": "660b95af-279c-4acd-b4a9-ddf2676a4810",
    "created_at": "2026-05-06T21:59:47.450Z",
    "comment": "This logo mark scales down beautifully. It works just as well small as it does large. The brand voice matches the visual identity perfectly. Very cohesive. The earthy green color palette perfectly aligns with the organic/sustainable messaging.",
    "recognition": 5,
    "purpose": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_17_10",
    "post_id": "post_17",
    "reviewer_name": "Geometric Explorer",
    "device_id": "8884a363-7988-4f8f-aa83-d9034caf7a1f",
    "created_at": "2026-05-15T08:03:26.422Z",
    "comment": "The secondary brand marks are just as strong as the primary. Great system. The foil stamping concept is brilliant. Very memorable and elevates the perceived value immediately. Love the playful use of shapes. It gives the brand a very approachable, friendly feel.",
    "recognition": 4,
    "purpose": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_17_11",
    "post_id": "post_17",
    "reviewer_name": "Minimalist Explorer",
    "device_id": "ab91f69a-844a-4827-93dc-3f39aa68860c",
    "created_at": "2026-05-19T19:32:04.594Z",
    "comment": "Love the playful use of shapes. It gives the brand a very approachable, friendly feel. Love the playful use of shapes. It gives the brand a very approachable, friendly feel. The earthy green color palette perfectly aligns with the organic/sustainable messaging.",
    "recognition": 4,
    "purpose": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_17_12",
    "post_id": "post_17",
    "reviewer_name": "Creative Thinker",
    "device_id": "3b0abd67-1af5-4259-9f54-0247353be269",
    "created_at": "2026-05-10T00:04:34.807Z",
    "comment": "The kerning on the logotype is a bit tight, especially around the 'R' and 'A'. Love the playful use of shapes. It gives the brand a very approachable, friendly feel. The brand voice matches the visual identity perfectly. Very cohesive.",
    "recognition": 3,
    "purpose": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_2_0",
    "post_id": "post_2",
    "reviewer_id": "user_1",
    "created_at": "2026-05-25T04:57:33.882Z",
    "comment": "Really strong brand recall here. The custom typography makes it instantly recognizable. Really strong brand recall here. The custom typography makes it instantly recognizable. The earthy green color palette perfectly aligns with the organic/sustainable messaging.",
    "recognition": 4,
    "purpose": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_2_1",
    "post_id": "post_2",
    "reviewer_id": "user_2",
    "created_at": "2026-05-19T07:51:24.841Z",
    "comment": "Love the playful use of shapes. It gives the brand a very approachable, friendly feel. The secondary brand marks are just as strong as the primary. Great system. The brand voice matches the visual identity perfectly. Very cohesive.",
    "recognition": 3,
    "purpose": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_2_2",
    "post_id": "post_2",
    "reviewer_id": "user_4",
    "created_at": "2026-05-18T17:30:19.282Z",
    "comment": "The contrast between the dark navy and black is too subtle, they muddy together. The brand voice matches the visual identity perfectly. Very cohesive. The brand voice matches the visual identity perfectly. Very cohesive.",
    "recognition": 2,
    "purpose": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_2_3",
    "post_id": "post_2",
    "reviewer_id": "user_5",
    "created_at": "2026-05-19T03:20:40.881Z",
    "comment": "I don't think the playful tone fits a B2B enterprise product. Seems misaligned. Love the playful use of shapes. It gives the brand a very approachable, friendly feel. The packaging mockup looks great, but I question how this translates to digital touchpoints.",
    "recognition": 1,
    "purpose": 4,
    "aesthetics": 1
  },
  {
    "id": "rev_post_2_4",
    "post_id": "post_2",
    "reviewer_id": "user_3",
    "created_at": "2026-05-13T06:14:00.550Z",
    "comment": "The secondary brand marks are just as strong as the primary. Great system. The secondary brand marks are just as strong as the primary. Great system. The foil stamping concept is brilliant. Very memorable and elevates the perceived value immediately.",
    "recognition": 4,
    "purpose": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_2_5",
    "post_id": "post_2",
    "reviewer_name": "Geometric Ninja",
    "device_id": "cc53fdfb-1414-433e-993b-ace9da277a2e",
    "created_at": "2026-05-14T15:00:22.312Z",
    "comment": "Really strong brand recall here. The custom typography makes it instantly recognizable. The foil stamping concept is brilliant. Very memorable and elevates the perceived value immediately. The mark is a bit too abstract. I'm not sure it clearly communicates what the company actually does.",
    "recognition": 4,
    "purpose": 4,
    "aesthetics": 3
  },
  {
    "id": "rev_post_2_6",
    "post_id": "post_2",
    "reviewer_name": "Geometric Fox",
    "device_id": "f6060bd4-4f9e-4547-8214-4eb7b49de4fd",
    "created_at": "2026-05-05T00:09:43.517Z",
    "comment": "Love the playful use of shapes. It gives the brand a very approachable, friendly feel. It feels a bit generic, like I've seen this exact geometric sans-serif treatment a dozen times. I don't think the playful tone fits a B2B enterprise product. Seems misaligned.",
    "recognition": 5,
    "purpose": 1,
    "aesthetics": 1
  },
  {
    "id": "rev_post_2_7",
    "post_id": "post_2",
    "reviewer_name": "Prismatic Fox",
    "device_id": "7991e9c2-d6db-4fab-9b40-d4762e45e691",
    "created_at": "2026-05-14T21:01:22.811Z",
    "comment": "This logo mark scales down beautifully. It works just as well small as it does large. The mark is a bit too abstract. I'm not sure it clearly communicates what the company actually does. I don't think the playful tone fits a B2B enterprise product. Seems misaligned.",
    "recognition": 4,
    "purpose": 1,
    "aesthetics": 1
  },
  {
    "id": "rev_post_2_8",
    "post_id": "post_2",
    "reviewer_name": "Sleek Critic",
    "device_id": "f8090e2f-287b-4cff-80df-0838b5be995e",
    "created_at": "2026-05-26T10:19:45.207Z",
    "comment": "This logo mark scales down beautifully. It works just as well small as it does large. The earthy green color palette perfectly aligns with the organic/sustainable messaging. Really strong brand recall here. The custom typography makes it instantly recognizable.",
    "recognition": 5,
    "purpose": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_2_9",
    "post_id": "post_2",
    "reviewer_name": "Geometric Maverick",
    "device_id": "972952a6-4216-497f-bc20-3405754b8951",
    "created_at": "2026-04-28T00:51:10.999Z",
    "comment": "The packaging mockup looks great, but I question how this translates to digital touchpoints. Love the playful use of shapes. It gives the brand a very approachable, friendly feel. The earthy green color palette perfectly aligns with the organic/sustainable messaging.",
    "recognition": 2,
    "purpose": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_2_10",
    "post_id": "post_2",
    "reviewer_name": "Prismatic Visionary",
    "device_id": "a5443be4-b431-478d-a04c-5456a7cdc821",
    "created_at": "2026-05-16T15:28:37.592Z",
    "comment": "The brand voice matches the visual identity perfectly. Very cohesive. The brand voice matches the visual identity perfectly. Very cohesive. The earthy green color palette perfectly aligns with the organic/sustainable messaging.",
    "recognition": 5,
    "purpose": 3,
    "aesthetics": 3
  },
  {
    "id": "rev_post_20_0",
    "post_id": "post_20",
    "reviewer_id": "user_1",
    "created_at": "2026-05-05T13:54:43.318Z",
    "comment": "The visual hook is immediate. It grabs attention right away. Excellent use of the brand colors to create a cohesive campaign feel. The visual hierarchy guides the eye straight to the value proposition.",
    "impact": 4,
    "clarity": 5,
    "engagement": 5
  },
  {
    "id": "rev_post_20_1",
    "post_id": "post_20",
    "reviewer_id": "user_4",
    "created_at": "2026-04-28T05:04:04.975Z",
    "comment": "Excellent use of the brand colors to create a cohesive campaign feel. Clear, punchy copy that pairs perfectly with the bold imagery. The visual hook is immediate. It grabs attention right away.",
    "impact": 5,
    "clarity": 4,
    "engagement": 5
  },
  {
    "id": "rev_post_20_2",
    "post_id": "post_20",
    "reviewer_id": "user_3",
    "created_at": "2026-05-12T15:28:38.971Z",
    "comment": "The visual hierarchy guides the eye straight to the value proposition. Excellent use of the brand colors to create a cohesive campaign feel. Really dynamic composition. The angled lines give it a lot of energy.",
    "impact": 5,
    "clarity": 4,
    "engagement": 4
  },
  {
    "id": "rev_post_20_3",
    "post_id": "post_20",
    "reviewer_id": "user_2",
    "created_at": "2026-05-03T03:03:40.705Z",
    "comment": "The imagery feels a bit like stock photos. It lacks authenticity. Clear, punchy copy that pairs perfectly with the bold imagery. The call to action is impossible to miss. Great use of contrasting colors.",
    "impact": 3,
    "clarity": 5,
    "engagement": 4
  },
  {
    "id": "rev_post_20_4",
    "post_id": "post_20",
    "reviewer_id": "user_5",
    "created_at": "2026-05-07T00:04:20.326Z",
    "comment": "Clear, punchy copy that pairs perfectly with the bold imagery. Clear, punchy copy that pairs perfectly with the bold imagery. Really dynamic composition. The angled lines give it a lot of energy.",
    "impact": 5,
    "clarity": 4,
    "engagement": 4
  },
  {
    "id": "rev_post_20_5",
    "post_id": "post_20",
    "reviewer_name": "Fluid Maverick",
    "device_id": "677c06e9-ffc5-4710-b50b-8d28898b535c",
    "created_at": "2026-05-12T02:09:07.156Z",
    "comment": "The tone is a bit too aggressive. It feels more like a hard sell than an invitation. Really dynamic composition. The angled lines give it a lot of energy. Really dynamic composition. The angled lines give it a lot of energy.",
    "impact": 3,
    "clarity": 5,
    "engagement": 5
  },
  {
    "id": "rev_post_32_0",
    "post_id": "post_32",
    "reviewer_id": "user_1",
    "created_at": "2026-05-11T02:45:56.069Z",
    "comment": "Incredible attention to detail in the textures. The brushed metal looks totally photorealistic. The composition feels a bit unbalanced, heavily weighted to the left side. The rendering quality is top-notch. Very clean and noise-free.",
    "composition": 5,
    "detail": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_32_1",
    "post_id": "post_32",
    "reviewer_id": "user_2",
    "created_at": "2026-05-13T08:15:01.865Z",
    "comment": "The lighting here is phenomenal. The soft rim light really separates the subject from the background. The rendering quality is top-notch. Very clean and noise-free. The sense of depth and perspective is masterful.",
    "composition": 4,
    "detail": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_32_2",
    "post_id": "post_32",
    "reviewer_id": "user_3",
    "created_at": "2026-05-19T18:35:49.236Z",
    "comment": "The sense of depth and perspective is masterful. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic. The composition rule of thirds is executed perfectly here.",
    "composition": 5,
    "detail": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_32_3",
    "post_id": "post_32",
    "reviewer_id": "user_4",
    "created_at": "2026-04-30T18:46:42.235Z",
    "comment": "The composition feels a bit unbalanced, heavily weighted to the left side. The perspective on the background buildings doesn't quite align with the foreground. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic.",
    "composition": 2,
    "detail": 1,
    "aesthetics": 4
  },
  {
    "id": "rev_post_32_4",
    "post_id": "post_32",
    "reviewer_id": "user_5",
    "created_at": "2026-05-02T07:16:28.127Z",
    "comment": "It feels a bit over-rendered. Sometimes less is more. The lighting here is phenomenal. The soft rim light really separates the subject from the background. The shadows are too completely black. Adding some ambient bounce light would make it richer.",
    "composition": 2,
    "detail": 4,
    "aesthetics": 2
  },
  {
    "id": "rev_post_32_5",
    "post_id": "post_32",
    "reviewer_name": "Subtle Maverick",
    "device_id": "ebf204a9-d35b-4383-a39a-a8015e31d660",
    "created_at": "2026-05-16T22:44:21.318Z",
    "comment": "The lighting here is phenomenal. The soft rim light really separates the subject from the background. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic.",
    "composition": 3,
    "detail": 5,
    "aesthetics": 3
  },
  {
    "id": "rev_post_32_6",
    "post_id": "post_32",
    "reviewer_name": "Tactile Visionary",
    "device_id": "1c9d4015-7aef-4c03-b6a7-3010a55c40c0",
    "created_at": "2026-05-24T09:29:34.512Z",
    "comment": "The sense of depth and perspective is masterful. The shadows are too completely black. Adding some ambient bounce light would make it richer. It feels a bit over-rendered. Sometimes less is more.",
    "composition": 4,
    "detail": 1,
    "aesthetics": 1
  },
  {
    "id": "rev_post_32_7",
    "post_id": "post_32",
    "reviewer_name": "Minimalist Panda",
    "device_id": "4d218cae-520d-4b00-8f55-3feeebcc75ca",
    "created_at": "2026-05-10T08:15:54.113Z",
    "comment": "It feels a bit over-rendered. Sometimes less is more. The colors feel a bit muddy and desaturated. It lacks pop. The anatomy feels a bit off, particularly around the shoulders and neck.",
    "composition": 2,
    "detail": 1,
    "aesthetics": 2
  },
  {
    "id": "rev_post_32_8",
    "post_id": "post_32",
    "reviewer_name": "Bold Wizard",
    "device_id": "c0768ea1-e156-4645-9b5e-fc20c83f24c4",
    "created_at": "2026-05-22T12:11:07.983Z",
    "comment": "The composition rule of thirds is executed perfectly here. It feels a bit over-rendered. Sometimes less is more. The colors feel a bit muddy and desaturated. It lacks pop.",
    "composition": 5,
    "detail": 2,
    "aesthetics": 1
  },
  {
    "id": "rev_post_9_0",
    "post_id": "post_9",
    "reviewer_id": "user_5",
    "created_at": "2026-04-27T20:23:15.013Z",
    "comment": "This logo mark scales down beautifully. It works just as well small as it does large. The secondary brand marks are just as strong as the primary. Great system. The brand voice matches the visual identity perfectly. Very cohesive.",
    "recognition": 5,
    "purpose": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_9_1",
    "post_id": "post_9",
    "reviewer_id": "user_4",
    "created_at": "2026-05-01T10:25:58.108Z",
    "comment": "Really strong brand recall here. The custom typography makes it instantly recognizable. The neon colors feel a bit too trendy. I worry this identity will look dated in a year. Really strong brand recall here. The custom typography makes it instantly recognizable.",
    "recognition": 5,
    "purpose": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_9_2",
    "post_id": "post_9",
    "reviewer_id": "user_3",
    "created_at": "2026-05-22T15:45:34.336Z",
    "comment": "The brand voice matches the visual identity perfectly. Very cohesive. The mark is a bit too abstract. I'm not sure it clearly communicates what the company actually does. This logo mark scales down beautifully. It works just as well small as it does large.",
    "recognition": 3,
    "purpose": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_9_3",
    "post_id": "post_9",
    "reviewer_id": "user_2",
    "created_at": "2026-05-13T10:54:56.547Z",
    "comment": "The secondary brand marks are just as strong as the primary. Great system. Love the playful use of shapes. It gives the brand a very approachable, friendly feel. It feels a bit generic, like I've seen this exact geometric sans-serif treatment a dozen times.",
    "recognition": 4,
    "purpose": 5,
    "aesthetics": 3
  },
  {
    "id": "rev_post_9_4",
    "post_id": "post_9",
    "reviewer_id": "user_1",
    "created_at": "2026-05-15T16:39:44.926Z",
    "comment": "The earthy green color palette perfectly aligns with the organic/sustainable messaging. This logo mark scales down beautifully. It works just as well small as it does large. The neon colors feel a bit too trendy. I worry this identity will look dated in a year.",
    "recognition": 4,
    "purpose": 5,
    "aesthetics": 2
  },
  {
    "id": "rev_post_9_5",
    "post_id": "post_9",
    "reviewer_name": "Vibrant Enthusiast",
    "device_id": "d3bafd4e-c589-4f16-a877-39f79f4ffe55",
    "created_at": "2026-05-10T12:48:37.841Z",
    "comment": "The mark is a bit too abstract. I'm not sure it clearly communicates what the company actually does. The neon colors feel a bit too trendy. I worry this identity will look dated in a year. The contrast between the dark navy and black is too subtle, they muddy together.",
    "recognition": 1,
    "purpose": 1,
    "aesthetics": 2
  },
  {
    "id": "rev_post_9_6",
    "post_id": "post_9",
    "reviewer_name": "Pixel Maverick",
    "device_id": "c28bcacd-a0bc-4b4b-8390-4774788d7872",
    "created_at": "2026-05-11T18:41:52.364Z",
    "comment": "The mark is a bit too abstract. I'm not sure it clearly communicates what the company actually does. The earthy green color palette perfectly aligns with the organic/sustainable messaging. The brand voice matches the visual identity perfectly. Very cohesive.",
    "recognition": 2,
    "purpose": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_9_7",
    "post_id": "post_9",
    "reviewer_name": "Lucid Panda",
    "device_id": "7909a057-4e24-446a-bbe5-11e34eea23ca",
    "created_at": "2026-05-23T01:45:54.427Z",
    "comment": "Really strong brand recall here. The custom typography makes it instantly recognizable. This logo mark scales down beautifully. It works just as well small as it does large. The earthy green color palette perfectly aligns with the organic/sustainable messaging.",
    "recognition": 4,
    "purpose": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_9_8",
    "post_id": "post_9",
    "reviewer_name": "Bold Guru",
    "device_id": "d24cb556-4bff-4f53-a51b-9ad15dc631ce",
    "created_at": "2026-05-03T19:38:08.957Z",
    "comment": "I don't think the playful tone fits a B2B enterprise product. Seems misaligned. I don't think the playful tone fits a B2B enterprise product. Seems misaligned. This logo mark scales down beautifully. It works just as well small as it does large.",
    "recognition": 3,
    "purpose": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_9_9",
    "post_id": "post_9",
    "reviewer_name": "Creative Panda",
    "device_id": "9cbc63c1-1c32-4861-84b8-67b478428d53",
    "created_at": "2026-05-13T23:49:52.634Z",
    "comment": "The brand voice matches the visual identity perfectly. Very cohesive. The foil stamping concept is brilliant. Very memorable and elevates the perceived value immediately. The brand voice matches the visual identity perfectly. Very cohesive.",
    "recognition": 4,
    "purpose": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_9_10",
    "post_id": "post_9",
    "reviewer_name": "Subtle Dreamer",
    "device_id": "33e503b1-ec52-4e9b-9d1e-69abff11131c",
    "created_at": "2026-05-21T13:58:30.222Z",
    "comment": "Love the playful use of shapes. It gives the brand a very approachable, friendly feel. Really strong brand recall here. The custom typography makes it instantly recognizable. The secondary brand marks are just as strong as the primary. Great system.",
    "recognition": 3,
    "purpose": 5,
    "aesthetics": 3
  },
  {
    "id": "rev_post_9_11",
    "post_id": "post_9",
    "reviewer_name": "Kinetic Panda",
    "device_id": "7e14e045-6823-4dba-8029-57eb0ff262d0",
    "created_at": "2026-05-13T20:04:19.362Z",
    "comment": "The earthy green color palette perfectly aligns with the organic/sustainable messaging. It feels a bit generic, like I've seen this exact geometric sans-serif treatment a dozen times. This logo mark scales down beautifully. It works just as well small as it does large.",
    "recognition": 3,
    "purpose": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_19_0",
    "post_id": "post_19",
    "reviewer_id": "user_2",
    "created_at": "2026-05-01T03:28:39.820Z",
    "comment": "This logo mark scales down beautifully. It works just as well small as it does large. This logo mark scales down beautifully. It works just as well small as it does large. The secondary brand marks are just as strong as the primary. Great system.",
    "recognition": 5,
    "purpose": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_19_1",
    "post_id": "post_19",
    "reviewer_id": "user_5",
    "created_at": "2026-05-22T15:28:35.709Z",
    "comment": "The foil stamping concept is brilliant. Very memorable and elevates the perceived value immediately. The secondary brand marks are just as strong as the primary. Great system. Love the playful use of shapes. It gives the brand a very approachable, friendly feel.",
    "recognition": 5,
    "purpose": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_19_2",
    "post_id": "post_19",
    "reviewer_id": "user_1",
    "created_at": "2026-05-14T08:41:56.266Z",
    "comment": "This logo mark scales down beautifully. It works just as well small as it does large. The brand voice matches the visual identity perfectly. Very cohesive. The earthy green color palette perfectly aligns with the organic/sustainable messaging.",
    "recognition": 5,
    "purpose": 3,
    "aesthetics": 3
  },
  {
    "id": "rev_post_19_3",
    "post_id": "post_19",
    "reviewer_id": "user_4",
    "created_at": "2026-04-30T07:26:57.956Z",
    "comment": "The foil stamping concept is brilliant. Very memorable and elevates the perceived value immediately. The brand voice matches the visual identity perfectly. Very cohesive. The brand voice matches the visual identity perfectly. Very cohesive.",
    "recognition": 4,
    "purpose": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_19_4",
    "post_id": "post_19",
    "reviewer_id": "user_3",
    "created_at": "2026-05-13T15:06:55.923Z",
    "comment": "The packaging mockup looks great, but I question how this translates to digital touchpoints. The packaging mockup looks great, but I question how this translates to digital touchpoints. The packaging mockup looks great, but I question how this translates to digital touchpoints.",
    "recognition": 2,
    "purpose": 1,
    "aesthetics": 2
  },
  {
    "id": "rev_post_28_0",
    "post_id": "post_28",
    "reviewer_id": "user_5",
    "created_at": "2026-05-14T16:56:41.282Z",
    "comment": "The imagery feels a bit like stock photos. It lacks authenticity. The headline typography is a bit hard to read against that busy background. The visual hierarchy guides the eye straight to the value proposition.",
    "impact": 2,
    "clarity": 1,
    "engagement": 4
  },
  {
    "id": "rev_post_28_1",
    "post_id": "post_28",
    "reviewer_id": "user_4",
    "created_at": "2026-05-23T23:29:40.741Z",
    "comment": "Clear, punchy copy that pairs perfectly with the bold imagery. The visual hierarchy guides the eye straight to the value proposition. Really dynamic composition. The angled lines give it a lot of energy.",
    "impact": 5,
    "clarity": 5,
    "engagement": 4
  },
  {
    "id": "rev_post_28_2",
    "post_id": "post_28",
    "reviewer_id": "user_3",
    "created_at": "2026-05-05T21:27:49.918Z",
    "comment": "The visual hook is immediate. It grabs attention right away. There's too much competing information. The main message gets lost in the noise. Excellent use of the brand colors to create a cohesive campaign feel.",
    "impact": 5,
    "clarity": 2,
    "engagement": 5
  },
  {
    "id": "rev_post_28_3",
    "post_id": "post_28",
    "reviewer_id": "user_2",
    "created_at": "2026-05-08T15:32:11.929Z",
    "comment": "Excellent use of the brand colors to create a cohesive campaign feel. Really dynamic composition. The angled lines give it a lot of energy. The call to action is impossible to miss. Great use of contrasting colors.",
    "impact": 4,
    "clarity": 4,
    "engagement": 3
  },
  {
    "id": "rev_post_28_4",
    "post_id": "post_28",
    "reviewer_id": "user_1",
    "created_at": "2026-05-25T22:02:14.620Z",
    "comment": "Clear, punchy copy that pairs perfectly with the bold imagery. The visual hook is immediate. It grabs attention right away. The visual hook is immediate. It grabs attention right away.",
    "impact": 3,
    "clarity": 5,
    "engagement": 5
  },
  {
    "id": "rev_post_28_5",
    "post_id": "post_28",
    "reviewer_name": "Lucid Maker",
    "device_id": "897237e2-c57d-499b-aeea-f8bfc5cd9509",
    "created_at": "2026-05-04T09:30:55.988Z",
    "comment": "The call to action is impossible to miss. Great use of contrasting colors. Really dynamic composition. The angled lines give it a lot of energy. Clear, punchy copy that pairs perfectly with the bold imagery.",
    "impact": 4,
    "clarity": 4,
    "engagement": 5
  },
  {
    "id": "rev_post_28_6",
    "post_id": "post_28",
    "reviewer_name": "Kinetic Thinker",
    "device_id": "0b57a9e6-1910-4c1d-a025-a3faf852a1b1",
    "created_at": "2026-05-04T09:15:57.347Z",
    "comment": "The call to action is impossible to miss. Great use of contrasting colors. The use of human faces makes it feel very relatable and trustworthy. Excellent use of the brand colors to create a cohesive campaign feel.",
    "impact": 4,
    "clarity": 3,
    "engagement": 3
  },
  {
    "id": "rev_post_28_7",
    "post_id": "post_28",
    "reviewer_name": "Prismatic Pioneer",
    "device_id": "d973d014-570a-4bfe-88d6-24dd3e43d8f9",
    "created_at": "2026-05-15T13:58:42.551Z",
    "comment": "There's too much competing information. The main message gets lost in the noise. The visual hook is immediate. It grabs attention right away. There's too much competing information. The main message gets lost in the noise.",
    "impact": 3,
    "clarity": 3,
    "engagement": 3
  },
  {
    "id": "rev_post_28_8",
    "post_id": "post_28",
    "reviewer_name": "Kinetic Pioneer",
    "device_id": "2c72deca-e846-4013-9aa5-8ad57b6e26a4",
    "created_at": "2026-05-02T23:08:16.070Z",
    "comment": "Excellent use of the brand colors to create a cohesive campaign feel. There's too much competing information. The main message gets lost in the noise. The use of human faces makes it feel very relatable and trustworthy.",
    "impact": 5,
    "clarity": 1,
    "engagement": 4
  },
  {
    "id": "rev_post_28_9",
    "post_id": "post_28",
    "reviewer_name": "Digital Nomad",
    "device_id": "48903aa2-5159-46cf-bbc4-a35993069fb6",
    "created_at": "2026-05-14T22:13:52.525Z",
    "comment": "Really dynamic composition. The angled lines give it a lot of energy. The use of human faces makes it feel very relatable and trustworthy. The visual hierarchy guides the eye straight to the value proposition.",
    "impact": 4,
    "clarity": 3,
    "engagement": 5
  },
  {
    "id": "rev_post_28_10",
    "post_id": "post_28",
    "reviewer_name": "Harmonic Craftsman",
    "device_id": "45550c3d-9f1a-40f5-8f97-06b6c9dadbf2",
    "created_at": "2026-05-16T09:27:56.919Z",
    "comment": "Excellent use of the brand colors to create a cohesive campaign feel. The use of human faces makes it feel very relatable and trustworthy. Really dynamic composition. The angled lines give it a lot of energy.",
    "impact": 5,
    "clarity": 5,
    "engagement": 4
  },
  {
    "id": "rev_post_28_11",
    "post_id": "post_28",
    "reviewer_name": "Digital Dreamer",
    "device_id": "a47fce3b-2db7-4c93-b446-cdacd80b6db9",
    "created_at": "2026-05-21T11:18:37.018Z",
    "comment": "The visual hierarchy guides the eye straight to the value proposition. The composition is a bit static and boring. It doesn't really pop. The visual hook is immediate. It grabs attention right away.",
    "impact": 5,
    "clarity": 1,
    "engagement": 4
  },
  {
    "id": "rev_post_28_12",
    "post_id": "post_28",
    "reviewer_name": "Subtle Wizard",
    "device_id": "ae6d5086-7449-4615-bab1-c9941a8b9dd0",
    "created_at": "2026-04-27T19:43:47.932Z",
    "comment": "The visual hook is immediate. It grabs attention right away. The visual hierarchy guides the eye straight to the value proposition. The visual hook is immediate. It grabs attention right away.",
    "impact": 4,
    "clarity": 5,
    "engagement": 4
  },
  {
    "id": "rev_post_28_13",
    "post_id": "post_28",
    "reviewer_name": "Sleek Guru",
    "device_id": "74d59434-2b63-4e8f-807b-7f5d3e9e5cd0",
    "created_at": "2026-05-19T02:43:24.004Z",
    "comment": "The use of human faces makes it feel very relatable and trustworthy. The visual hierarchy guides the eye straight to the value proposition. Clear, punchy copy that pairs perfectly with the bold imagery.",
    "impact": 4,
    "clarity": 3,
    "engagement": 3
  },
  {
    "id": "rev_post_28_14",
    "post_id": "post_28",
    "reviewer_name": "Subtle Visionary",
    "device_id": "30e06c4c-b485-4c36-b90a-ced12cfc6957",
    "created_at": "2026-05-11T21:27:07.698Z",
    "comment": "The imagery feels a bit like stock photos. It lacks authenticity. The visual hierarchy guides the eye straight to the value proposition. The visual hierarchy guides the eye straight to the value proposition.",
    "impact": 2,
    "clarity": 5,
    "engagement": 4
  },
  {
    "id": "rev_post_28_15",
    "post_id": "post_28",
    "reviewer_name": "Digital Maverick",
    "device_id": "593cd262-48ff-4146-89a3-2e5ab596149f",
    "created_at": "2026-05-22T05:30:38.275Z",
    "comment": "The visual hierarchy guides the eye straight to the value proposition. The call to action is impossible to miss. Great use of contrasting colors. The use of human faces makes it feel very relatable and trustworthy.",
    "impact": 4,
    "clarity": 5,
    "engagement": 5
  },
  {
    "id": "rev_post_28_16",
    "post_id": "post_28",
    "reviewer_name": "Lucid Dreamer",
    "device_id": "e89319c5-6b83-4bac-868a-5702d37c7749",
    "created_at": "2026-05-10T06:10:45.526Z",
    "comment": "The visual hierarchy guides the eye straight to the value proposition. The call to action is buried at the bottom. It should be much more prominent. There's too much competing information. The main message gets lost in the noise.",
    "impact": 4,
    "clarity": 2,
    "engagement": 2
  },
  {
    "id": "rev_post_28_17",
    "post_id": "post_28",
    "reviewer_name": "Sleek Dreamer",
    "device_id": "42110a6b-02b5-4bba-a7b5-f2bf3c3fbdce",
    "created_at": "2026-05-14T16:45:45.894Z",
    "comment": "The visual hierarchy guides the eye straight to the value proposition. The composition is a bit static and boring. It doesn't really pop. The imagery feels a bit like stock photos. It lacks authenticity.",
    "impact": 4,
    "clarity": 2,
    "engagement": 2
  },
  {
    "id": "rev_post_28_18",
    "post_id": "post_28",
    "reviewer_name": "Sleek Thinker",
    "device_id": "42b15bf5-1c93-41c5-84c4-074c8c5927ef",
    "created_at": "2026-05-18T02:19:35.333Z",
    "comment": "The visual hook is immediate. It grabs attention right away. There's too much competing information. The main message gets lost in the noise. It feels a bit text-heavy for a social media ad. People will just scroll past.",
    "impact": 5,
    "clarity": 2,
    "engagement": 2
  },
  {
    "id": "rev_post_4_0",
    "post_id": "post_4",
    "reviewer_id": "user_4",
    "created_at": "2026-05-03T10:52:06.939Z",
    "comment": "Navigation is completely hidden behind the hamburger menu on desktop. It adds unnecessary friction. The typography scale is solid, and the cool gray background feels perfect for the warm imagery. The contrast ratios are spot on. Very accessible and easy to read.",
    "usability": 3,
    "clarity": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_4_1",
    "post_id": "post_4",
    "reviewer_id": "user_3",
    "created_at": "2026-05-06T09:55:34.317Z",
    "comment": "Love the subtle hover states on the cards. Makes the interface feel very responsive. Great use of negative space. It lets the content breathe nicely. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious.",
    "usability": 5,
    "clarity": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_4_2",
    "post_id": "post_4",
    "reviewer_id": "user_1",
    "created_at": "2026-05-03T00:51:05.330Z",
    "comment": "Great use of negative space. It lets the content breathe nicely. The form fields lack clear focus states, making it hard to tell what's active. Navigation is completely hidden behind the hamburger menu on desktop. It adds unnecessary friction.",
    "usability": 5,
    "clarity": 2,
    "aesthetics": 2
  },
  {
    "id": "rev_post_4_3",
    "post_id": "post_4",
    "reviewer_id": "user_5",
    "created_at": "2026-05-21T09:54:14.602Z",
    "comment": "The typography scale is solid, and the cool gray background feels perfect for the warm imagery. The form fields lack clear focus states, making it hard to tell what's active. The form fields lack clear focus states, making it hard to tell what's active.",
    "usability": 5,
    "clarity": 1,
    "aesthetics": 2
  },
  {
    "id": "rev_post_4_4",
    "post_id": "post_4",
    "reviewer_id": "user_2",
    "created_at": "2026-05-10T06:52:17.324Z",
    "comment": "Love the subtle hover states on the cards. Makes the interface feel very responsive. Great use of negative space. It lets the content breathe nicely. Love the subtle hover states on the cards. Makes the interface feel very responsive.",
    "usability": 4,
    "clarity": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_4_5",
    "post_id": "post_4",
    "reviewer_name": "Digital Guru",
    "device_id": "04831985-cdf8-41ea-bc19-4fea09878d11",
    "created_at": "2026-05-18T07:47:15.978Z",
    "comment": "Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. Love the subtle hover states on the cards. Makes the interface feel very responsive.",
    "usability": 5,
    "clarity": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_11_0",
    "post_id": "post_11",
    "reviewer_id": "user_2",
    "created_at": "2026-05-26T03:09:03.291Z",
    "comment": "I finally beat Elden Ring after 120 hours. Malenia took me three days to beat. Most satisfying gaming experience ever.",
    "usability": 5,
    "clarity": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_11_1",
    "post_id": "post_11",
    "reviewer_id": "user_1",
    "created_at": "2026-04-29T21:07:50.471Z",
    "comment": "My flight got delayed by four hours, and they didn't even offer a meal voucher. Airlines really don't care about customer service anymore.",
    "usability": 5,
    "clarity": 4,
    "aesthetics": 1
  },
  {
    "id": "rev_post_11_2",
    "post_id": "post_11",
    "reviewer_id": "user_3",
    "created_at": "2026-05-26T11:00:20.308Z",
    "comment": "What's the best way to clean a cast iron skillet without ruining the seasoning? Some people say soap is fine now, but my grandma would disagree.",
    "usability": 3,
    "clarity": 4,
    "aesthetics": 3
  },
  {
    "id": "rev_post_11_3",
    "post_id": "post_11",
    "reviewer_id": "user_5",
    "created_at": "2026-05-24T13:08:26.322Z",
    "comment": "It's been raining for five days straight here. I feel like I haven't seen the sun in a month and it's really affecting my mood.",
    "usability": 4,
    "clarity": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_11_4",
    "post_id": "post_11",
    "reviewer_id": "user_4",
    "created_at": "2026-05-16T19:50:00.660Z",
    "comment": "I'm looking for a good vacuum cleaner for pet hair. The Dyson is so expensive, is the Shark actually worth it or should I just get a Roomba?",
    "usability": 4,
    "clarity": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_11_5",
    "post_id": "post_11",
    "reviewer_name": "Lucid Observer",
    "device_id": "e521e532-2177-4e12-9b8b-95b383091c08",
    "created_at": "2026-05-03T13:55:05.218Z",
    "comment": "Has anyone seen the new Marvel movie? The CGI in the third act was honestly kind of distracting, but the villain was great.",
    "usability": 4,
    "clarity": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_11_6",
    "post_id": "post_11",
    "reviewer_name": "Monochrome Ninja",
    "device_id": "faba7221-9212-4df1-85c7-879cbd250042",
    "created_at": "2026-05-09T11:49:27.687Z",
    "comment": "I bought a monstera plant last week and the leaves are already turning yellow. I'm watering it twice a week, is that too much?",
    "usability": 2,
    "clarity": 1,
    "aesthetics": 5
  },
  {
    "id": "rev_post_11_7",
    "post_id": "post_11",
    "reviewer_name": "Monochrome Craftsman",
    "device_id": "61dc8943-ad38-4a95-99b0-0cd2388ae961",
    "created_at": "2026-05-04T20:02:17.288Z",
    "comment": "I tried making sourdough bread yesterday, and the starter completely died on me. Does anyone have tips on maintaining temperature in a cold kitchen?",
    "usability": 4,
    "clarity": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_6_0",
    "post_id": "post_6",
    "reviewer_id": "user_5",
    "created_at": "2026-05-07T11:39:31.627Z",
    "comment": "Love the playful use of shapes. It gives the brand a very approachable, friendly feel. The secondary brand marks are just as strong as the primary. Great system. The earthy green color palette perfectly aligns with the organic/sustainable messaging.",
    "recognition": 3,
    "purpose": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_6_1",
    "post_id": "post_6",
    "reviewer_id": "user_4",
    "created_at": "2026-05-07T15:43:03.575Z",
    "comment": "The foil stamping concept is brilliant. Very memorable and elevates the perceived value immediately. The packaging mockup looks great, but I question how this translates to digital touchpoints. The secondary brand marks are just as strong as the primary. Great system.",
    "recognition": 4,
    "purpose": 1,
    "aesthetics": 5
  },
  {
    "id": "rev_post_6_2",
    "post_id": "post_6",
    "reviewer_id": "user_3",
    "created_at": "2026-04-29T20:29:33.707Z",
    "comment": "The mark is a bit too abstract. I'm not sure it clearly communicates what the company actually does. I don't think the playful tone fits a B2B enterprise product. Seems misaligned. I don't think the playful tone fits a B2B enterprise product. Seems misaligned.",
    "recognition": 2,
    "purpose": 2,
    "aesthetics": 1
  },
  {
    "id": "rev_post_6_3",
    "post_id": "post_6",
    "reviewer_id": "user_2",
    "created_at": "2026-05-17T02:56:17.690Z",
    "comment": "The foil stamping concept is brilliant. Very memorable and elevates the perceived value immediately. This logo mark scales down beautifully. It works just as well small as it does large. The brand voice matches the visual identity perfectly. Very cohesive.",
    "recognition": 4,
    "purpose": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_6_4",
    "post_id": "post_6",
    "reviewer_id": "user_1",
    "created_at": "2026-05-05T10:30:55.613Z",
    "comment": "The mark is a bit too abstract. I'm not sure it clearly communicates what the company actually does. The neon colors feel a bit too trendy. I worry this identity will look dated in a year. The earthy green color palette perfectly aligns with the organic/sustainable messaging.",
    "recognition": 1,
    "purpose": 2,
    "aesthetics": 4
  },
  {
    "id": "rev_post_6_5",
    "post_id": "post_6",
    "reviewer_name": "Pixel Artisan",
    "device_id": "6159fc5b-b6da-40ec-90aa-6fc6ce312b94",
    "created_at": "2026-05-11T07:16:59.254Z",
    "comment": "The earthy green color palette perfectly aligns with the organic/sustainable messaging. Really strong brand recall here. The custom typography makes it instantly recognizable. The contrast between the dark navy and black is too subtle, they muddy together.",
    "recognition": 4,
    "purpose": 4,
    "aesthetics": 2
  },
  {
    "id": "rev_post_6_6",
    "post_id": "post_6",
    "reviewer_name": "Kinetic Observer",
    "device_id": "442ab459-3ac8-488f-80ef-39b127056794",
    "created_at": "2026-05-04T16:09:30.779Z",
    "comment": "Love the playful use of shapes. It gives the brand a very approachable, friendly feel. The secondary brand marks are just as strong as the primary. Great system. Really strong brand recall here. The custom typography makes it instantly recognizable.",
    "recognition": 3,
    "purpose": 4,
    "aesthetics": 3
  },
  {
    "id": "rev_post_6_7",
    "post_id": "post_6",
    "reviewer_name": "Monochrome Maverick",
    "device_id": "74eee861-b662-4b90-baff-b74c29af087f",
    "created_at": "2026-05-13T17:44:37.864Z",
    "comment": "The packaging mockup looks great, but I question how this translates to digital touchpoints. Love the playful use of shapes. It gives the brand a very approachable, friendly feel. This logo mark scales down beautifully. It works just as well small as it does large.",
    "recognition": 2,
    "purpose": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_6_8",
    "post_id": "post_6",
    "reviewer_name": "Vibrant Critic",
    "device_id": "a70eff16-82ac-44ec-acfb-76f91ad70220",
    "created_at": "2026-05-09T18:19:51.337Z",
    "comment": "Really strong brand recall here. The custom typography makes it instantly recognizable. The secondary brand marks are just as strong as the primary. Great system. The brand voice matches the visual identity perfectly. Very cohesive.",
    "recognition": 5,
    "purpose": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_6_9",
    "post_id": "post_6",
    "reviewer_name": "Bold Pioneer",
    "device_id": "cc567148-9a36-4fc9-8c95-d8737eceeb4f",
    "created_at": "2026-05-26T07:15:36.887Z",
    "comment": "The contrast between the dark navy and black is too subtle, they muddy together. The packaging mockup looks great, but I question how this translates to digital touchpoints. The secondary brand marks are just as strong as the primary. Great system.",
    "recognition": 2,
    "purpose": 1,
    "aesthetics": 4
  },
  {
    "id": "rev_post_6_10",
    "post_id": "post_6",
    "reviewer_name": "Digital Panda",
    "device_id": "0027ac0d-ee6b-4545-a339-66755fbe595c",
    "created_at": "2026-04-30T17:13:53.822Z",
    "comment": "This logo mark scales down beautifully. It works just as well small as it does large. It feels a bit generic, like I've seen this exact geometric sans-serif treatment a dozen times. Really strong brand recall here. The custom typography makes it instantly recognizable.",
    "recognition": 4,
    "purpose": 1,
    "aesthetics": 5
  },
  {
    "id": "rev_post_6_11",
    "post_id": "post_6",
    "reviewer_name": "Pixel Fox",
    "device_id": "405f29d8-3756-43b1-8a2e-02876821ccb4",
    "created_at": "2026-05-24T05:55:49.773Z",
    "comment": "The packaging mockup looks great, but I question how this translates to digital touchpoints. Really strong brand recall here. The custom typography makes it instantly recognizable. The packaging mockup looks great, but I question how this translates to digital touchpoints.",
    "recognition": 3,
    "purpose": 4,
    "aesthetics": 3
  },
  {
    "id": "rev_post_6_12",
    "post_id": "post_6",
    "reviewer_name": "Creative Dreamer",
    "device_id": "5fd922a4-8156-43d7-a5d7-4c99697c70ce",
    "created_at": "2026-04-30T13:47:38.730Z",
    "comment": "Love the playful use of shapes. It gives the brand a very approachable, friendly feel. It feels a bit generic, like I've seen this exact geometric sans-serif treatment a dozen times. The earthy green color palette perfectly aligns with the organic/sustainable messaging.",
    "recognition": 3,
    "purpose": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_6_13",
    "post_id": "post_6",
    "reviewer_name": "Tactile Ninja",
    "device_id": "b343a7ad-c58f-4927-a406-691b9b1f692c",
    "created_at": "2026-05-20T06:40:47.208Z",
    "comment": "The foil stamping concept is brilliant. Very memorable and elevates the perceived value immediately. Really strong brand recall here. The custom typography makes it instantly recognizable. Really strong brand recall here. The custom typography makes it instantly recognizable.",
    "recognition": 5,
    "purpose": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_6_14",
    "post_id": "post_6",
    "reviewer_name": "Creative Panda",
    "device_id": "b99792c2-b3ea-4742-9bf0-5ba04c0f9e05",
    "created_at": "2026-05-04T18:52:59.286Z",
    "comment": "This logo mark scales down beautifully. It works just as well small as it does large. Really strong brand recall here. The custom typography makes it instantly recognizable. Love the playful use of shapes. It gives the brand a very approachable, friendly feel.",
    "recognition": 4,
    "purpose": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_6_15",
    "post_id": "post_6",
    "reviewer_name": "Prismatic Guru",
    "device_id": "ca745598-6cc1-4bba-91c0-20aadc95057f",
    "created_at": "2026-05-23T12:44:54.138Z",
    "comment": "The earthy green color palette perfectly aligns with the organic/sustainable messaging. This logo mark scales down beautifully. It works just as well small as it does large. Really strong brand recall here. The custom typography makes it instantly recognizable.",
    "recognition": 5,
    "purpose": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_6_16",
    "post_id": "post_6",
    "reviewer_name": "Vector Maker",
    "device_id": "5a64c508-5254-499f-b7f5-bef1f1e8bf2d",
    "created_at": "2026-05-26T12:43:29.655Z",
    "comment": "The earthy green color palette perfectly aligns with the organic/sustainable messaging. Really strong brand recall here. The custom typography makes it instantly recognizable. Love the playful use of shapes. It gives the brand a very approachable, friendly feel.",
    "recognition": 5,
    "purpose": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_6_17",
    "post_id": "post_6",
    "reviewer_name": "Tactile Pioneer",
    "device_id": "54a9be0e-1187-480c-a84f-11de1b967171",
    "created_at": "2026-05-03T19:28:55.938Z",
    "comment": "The brand voice matches the visual identity perfectly. Very cohesive. Really strong brand recall here. The custom typography makes it instantly recognizable. The earthy green color palette perfectly aligns with the organic/sustainable messaging.",
    "recognition": 4,
    "purpose": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_7_0",
    "post_id": "post_7",
    "reviewer_id": "user_2",
    "created_at": "2026-05-04T14:07:05.479Z",
    "comment": "The call to action is impossible to miss. Great use of contrasting colors. Excellent use of the brand colors to create a cohesive campaign feel. The call to action is buried at the bottom. It should be much more prominent.",
    "impact": 5,
    "clarity": 5,
    "engagement": 1
  },
  {
    "id": "rev_post_7_1",
    "post_id": "post_7",
    "reviewer_id": "user_4",
    "created_at": "2026-05-07T09:25:31.657Z",
    "comment": "Really dynamic composition. The angled lines give it a lot of energy. Really dynamic composition. The angled lines give it a lot of energy. The visual hook is immediate. It grabs attention right away.",
    "impact": 4,
    "clarity": 4,
    "engagement": 3
  },
  {
    "id": "rev_post_7_2",
    "post_id": "post_7",
    "reviewer_id": "user_5",
    "created_at": "2026-05-26T01:45:24.036Z",
    "comment": "There's too much competing information. The main message gets lost in the noise. Really dynamic composition. The angled lines give it a lot of energy. The visual hook is immediate. It grabs attention right away.",
    "impact": 3,
    "clarity": 4,
    "engagement": 4
  },
  {
    "id": "rev_post_7_3",
    "post_id": "post_7",
    "reviewer_id": "user_1",
    "created_at": "2026-05-06T12:08:57.980Z",
    "comment": "Really dynamic composition. The angled lines give it a lot of energy. The headline typography is a bit hard to read against that busy background. There's too much competing information. The main message gets lost in the noise.",
    "impact": 4,
    "clarity": 1,
    "engagement": 2
  },
  {
    "id": "rev_post_7_4",
    "post_id": "post_7",
    "reviewer_id": "user_3",
    "created_at": "2026-05-14T04:43:38.335Z",
    "comment": "Excellent use of the brand colors to create a cohesive campaign feel. Really dynamic composition. The angled lines give it a lot of energy. There's too much competing information. The main message gets lost in the noise.",
    "impact": 5,
    "clarity": 5,
    "engagement": 3
  },
  {
    "id": "rev_post_7_5",
    "post_id": "post_7",
    "reviewer_name": "Dynamic Maverick",
    "device_id": "58374bc0-d655-4bac-9310-937a5b2d6aad",
    "created_at": "2026-05-17T00:16:24.395Z",
    "comment": "Excellent use of the brand colors to create a cohesive campaign feel. The call to action is impossible to miss. Great use of contrasting colors. The composition is a bit static and boring. It doesn't really pop.",
    "impact": 5,
    "clarity": 4,
    "engagement": 3
  },
  {
    "id": "rev_post_7_6",
    "post_id": "post_7",
    "reviewer_name": "Abstract Seeker",
    "device_id": "40220c39-9be9-4771-904a-98740e829493",
    "created_at": "2026-05-01T13:25:07.748Z",
    "comment": "The visual hook is immediate. It grabs attention right away. The call to action is buried at the bottom. It should be much more prominent. The use of human faces makes it feel very relatable and trustworthy.",
    "impact": 4,
    "clarity": 3,
    "engagement": 3
  },
  {
    "id": "rev_post_7_7",
    "post_id": "post_7",
    "reviewer_name": "Harmonic Panda",
    "device_id": "d5393e4a-7ebd-47b1-93c9-165542ce6f34",
    "created_at": "2026-05-09T09:24:07.792Z",
    "comment": "Excellent use of the brand colors to create a cohesive campaign feel. The call to action is buried at the bottom. It should be much more prominent. There's too much competing information. The main message gets lost in the noise.",
    "impact": 5,
    "clarity": 2,
    "engagement": 1
  },
  {
    "id": "rev_post_7_8",
    "post_id": "post_7",
    "reviewer_name": "Harmonic Dreamer",
    "device_id": "4dfef6a3-7a83-4fbf-b77f-f54e7dfbca64",
    "created_at": "2026-05-17T08:20:53.080Z",
    "comment": "The use of human faces makes it feel very relatable and trustworthy. Really dynamic composition. The angled lines give it a lot of energy. Excellent use of the brand colors to create a cohesive campaign feel.",
    "impact": 5,
    "clarity": 5,
    "engagement": 3
  },
  {
    "id": "rev_post_35_0",
    "post_id": "post_35",
    "reviewer_id": "user_2",
    "created_at": "2026-05-19T00:05:42.448Z",
    "comment": "The rendering quality is top-notch. Very clean and noise-free. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic. Love the stylized approach. The limited color palette works incredibly well.",
    "composition": 5,
    "detail": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_35_1",
    "post_id": "post_35",
    "reviewer_id": "user_3",
    "created_at": "2026-04-28T17:01:57.359Z",
    "comment": "The shadows are too completely black. Adding some ambient bounce light would make it richer. The textures look a bit tiling/repetitive in the background. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic.",
    "composition": 2,
    "detail": 1,
    "aesthetics": 4
  },
  {
    "id": "rev_post_35_2",
    "post_id": "post_35",
    "reviewer_id": "user_1",
    "created_at": "2026-05-23T01:42:47.799Z",
    "comment": "The lighting here is phenomenal. The soft rim light really separates the subject from the background. Really expressive character design. You can feel the emotion. Love the stylized approach. The limited color palette works incredibly well.",
    "composition": 5,
    "detail": 3,
    "aesthetics": 3
  },
  {
    "id": "rev_post_35_3",
    "post_id": "post_35",
    "reviewer_id": "user_5",
    "created_at": "2026-05-10T04:54:39.353Z",
    "comment": "The sense of depth and perspective is masterful. The composition rule of thirds is executed perfectly here. The lighting here is phenomenal. The soft rim light really separates the subject from the background.",
    "composition": 4,
    "detail": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_35_4",
    "post_id": "post_35",
    "reviewer_id": "user_4",
    "created_at": "2026-04-30T04:47:24.079Z",
    "comment": "The shadows are too completely black. Adding some ambient bounce light would make it richer. The lighting here is phenomenal. The soft rim light really separates the subject from the background. The shadows are too completely black. Adding some ambient bounce light would make it richer.",
    "composition": 2,
    "detail": 5,
    "aesthetics": 2
  },
  {
    "id": "rev_post_35_5",
    "post_id": "post_35",
    "reviewer_name": "Vector Thinker",
    "device_id": "008f10ec-bb1a-419a-adaa-1c29ea3c36e7",
    "created_at": "2026-05-04T20:29:40.676Z",
    "comment": "Incredible attention to detail in the textures. The brushed metal looks totally photorealistic. The composition feels a bit unbalanced, heavily weighted to the left side. The composition rule of thirds is executed perfectly here.",
    "composition": 4,
    "detail": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_35_6",
    "post_id": "post_35",
    "reviewer_name": "Harmonic Guru",
    "device_id": "c2359ef3-cd05-489a-8921-71fe15cfcb0e",
    "created_at": "2026-05-22T10:01:39.716Z",
    "comment": "The lighting here is phenomenal. The soft rim light really separates the subject from the background. The anatomy feels a bit off, particularly around the shoulders and neck. The sense of depth and perspective is masterful.",
    "composition": 5,
    "detail": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_35_7",
    "post_id": "post_35",
    "reviewer_name": "Digital Maverick",
    "device_id": "f2f6a7ff-33b2-4557-a99a-989eafd85818",
    "created_at": "2026-05-06T11:30:17.644Z",
    "comment": "The perspective on the background buildings doesn't quite align with the foreground. It feels a bit over-rendered. Sometimes less is more. The colors feel a bit muddy and desaturated. It lacks pop.",
    "composition": 1,
    "detail": 2,
    "aesthetics": 2
  },
  {
    "id": "rev_post_35_8",
    "post_id": "post_35",
    "reviewer_name": "Harmonic Seeker",
    "device_id": "ec1df007-9d69-4fed-ba28-ea1312c4a059",
    "created_at": "2026-05-05T10:13:57.276Z",
    "comment": "Really expressive character design. You can feel the emotion. Really expressive character design. You can feel the emotion. It feels a bit over-rendered. Sometimes less is more.",
    "composition": 5,
    "detail": 4,
    "aesthetics": 3
  },
  {
    "id": "rev_post_35_9",
    "post_id": "post_35",
    "reviewer_name": "Kinetic Explorer",
    "device_id": "84355acb-9ede-4886-b13b-27afcb51cda9",
    "created_at": "2026-05-13T12:32:05.518Z",
    "comment": "The sense of depth and perspective is masterful. The lighting here is phenomenal. The soft rim light really separates the subject from the background. The lighting here is phenomenal. The soft rim light really separates the subject from the background.",
    "composition": 5,
    "detail": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_35_10",
    "post_id": "post_35",
    "reviewer_name": "Kinetic Guru",
    "device_id": "d757cd3d-ae76-4773-845e-ef0871333aa7",
    "created_at": "2026-05-21T18:07:16.249Z",
    "comment": "The textures look a bit tiling/repetitive in the background. The sense of depth and perspective is masterful. The anatomy feels a bit off, particularly around the shoulders and neck.",
    "composition": 1,
    "detail": 4,
    "aesthetics": 1
  },
  {
    "id": "rev_post_35_11",
    "post_id": "post_35",
    "reviewer_name": "Harmonic Explorer",
    "device_id": "9a6d2e20-9c79-4dbf-89b4-0c048ff0285c",
    "created_at": "2026-05-08T07:14:02.695Z",
    "comment": "Really expressive character design. You can feel the emotion. Really expressive character design. You can feel the emotion. The sense of depth and perspective is masterful.",
    "composition": 3,
    "detail": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_35_12",
    "post_id": "post_35",
    "reviewer_name": "Harmonic Enthusiast",
    "device_id": "f6242645-0c39-45ba-8b50-836a652e2c18",
    "created_at": "2026-05-20T21:28:32.286Z",
    "comment": "The composition rule of thirds is executed perfectly here. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic. The colors feel a bit muddy and desaturated. It lacks pop.",
    "composition": 5,
    "detail": 5,
    "aesthetics": 3
  },
  {
    "id": "rev_post_35_13",
    "post_id": "post_35",
    "reviewer_name": "Harmonic Architect",
    "device_id": "9307f125-2523-4711-aef1-879c4772e970",
    "created_at": "2026-04-27T05:51:55.771Z",
    "comment": "The sense of depth and perspective is masterful. Really expressive character design. You can feel the emotion. The anatomy feels a bit off, particularly around the shoulders and neck.",
    "composition": 4,
    "detail": 4,
    "aesthetics": 3
  },
  {
    "id": "rev_post_5_0",
    "post_id": "post_5",
    "reviewer_id": "user_1",
    "created_at": "2026-05-11T12:02:58.685Z",
    "comment": "The rendering quality is top-notch. Very clean and noise-free. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic. It feels a bit over-rendered. Sometimes less is more.",
    "composition": 5,
    "detail": 4,
    "aesthetics": 1
  },
  {
    "id": "rev_post_5_1",
    "post_id": "post_5",
    "reviewer_id": "user_2",
    "created_at": "2026-05-14T16:14:48.962Z",
    "comment": "The textures look a bit tiling/repetitive in the background. The lighting here is phenomenal. The soft rim light really separates the subject from the background. Really expressive character design. You can feel the emotion.",
    "composition": 3,
    "detail": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_5_2",
    "post_id": "post_5",
    "reviewer_id": "user_4",
    "created_at": "2026-05-24T17:23:32.692Z",
    "comment": "The rendering quality is top-notch. Very clean and noise-free. The textures look a bit tiling/repetitive in the background. The anatomy feels a bit off, particularly around the shoulders and neck.",
    "composition": 5,
    "detail": 1,
    "aesthetics": 2
  },
  {
    "id": "rev_post_5_3",
    "post_id": "post_5",
    "reviewer_id": "user_5",
    "created_at": "2026-05-26T05:41:42.205Z",
    "comment": "The composition rule of thirds is executed perfectly here. The composition rule of thirds is executed perfectly here. The lighting here is phenomenal. The soft rim light really separates the subject from the background.",
    "composition": 5,
    "detail": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_5_4",
    "post_id": "post_5",
    "reviewer_id": "user_3",
    "created_at": "2026-05-19T23:30:32.367Z",
    "comment": "Really expressive character design. You can feel the emotion. The lighting here is phenomenal. The soft rim light really separates the subject from the background. The lighting here is phenomenal. The soft rim light really separates the subject from the background.",
    "composition": 5,
    "detail": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_5_5",
    "post_id": "post_5",
    "reviewer_name": "Creative Fox",
    "device_id": "996b01af-7fc3-44f9-809d-96099841b68a",
    "created_at": "2026-05-25T19:55:06.835Z",
    "comment": "The composition rule of thirds is executed perfectly here. The sense of depth and perspective is masterful. The sense of depth and perspective is masterful.",
    "composition": 5,
    "detail": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_5_6",
    "post_id": "post_5",
    "reviewer_name": "Subtle Architect",
    "device_id": "7f308534-1a70-4499-a9b0-5912014148d4",
    "created_at": "2026-05-18T03:49:20.921Z",
    "comment": "The lighting here is phenomenal. The soft rim light really separates the subject from the background. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic. Really expressive character design. You can feel the emotion.",
    "composition": 3,
    "detail": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_5_7",
    "post_id": "post_5",
    "reviewer_name": "Vibrant Observer",
    "device_id": "57539c88-a7b3-4751-9124-a2c4c7e22430",
    "created_at": "2026-04-27T17:06:23.941Z",
    "comment": "The composition rule of thirds is executed perfectly here. The composition rule of thirds is executed perfectly here. Love the stylized approach. The limited color palette works incredibly well.",
    "composition": 3,
    "detail": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_5_8",
    "post_id": "post_5",
    "reviewer_name": "Bold Craftsman",
    "device_id": "9318b191-b99f-4db1-8723-e9c020fa8f7d",
    "created_at": "2026-05-12T01:10:51.874Z",
    "comment": "Really expressive character design. You can feel the emotion. The lighting here is phenomenal. The soft rim light really separates the subject from the background. The sense of depth and perspective is masterful.",
    "composition": 4,
    "detail": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_5_9",
    "post_id": "post_5",
    "reviewer_name": "Dynamic Maverick",
    "device_id": "d780a597-4bf6-4b2a-8086-13b22cc0385a",
    "created_at": "2026-05-22T01:56:12.593Z",
    "comment": "The sense of depth and perspective is masterful. The composition feels a bit unbalanced, heavily weighted to the left side. The rendering quality is top-notch. Very clean and noise-free.",
    "composition": 4,
    "detail": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_5_10",
    "post_id": "post_5",
    "reviewer_name": "Bold Guru",
    "device_id": "a7498d42-b309-489f-a96a-05108e475126",
    "created_at": "2026-05-13T13:02:49.596Z",
    "comment": "Really expressive character design. You can feel the emotion. The lighting here is phenomenal. The soft rim light really separates the subject from the background. The shadows are too completely black. Adding some ambient bounce light would make it richer.",
    "composition": 4,
    "detail": 4,
    "aesthetics": 2
  },
  {
    "id": "rev_post_5_11",
    "post_id": "post_5",
    "reviewer_name": "Vector Guru",
    "device_id": "c3c67695-dc4b-488e-9bc1-1ec083421837",
    "created_at": "2026-05-25T15:40:53.925Z",
    "comment": "Really expressive character design. You can feel the emotion. Really expressive character design. You can feel the emotion. The shadows are too completely black. Adding some ambient bounce light would make it richer.",
    "composition": 5,
    "detail": 4,
    "aesthetics": 3
  },
  {
    "id": "rev_post_5_12",
    "post_id": "post_5",
    "reviewer_name": "Kinetic Seeker",
    "device_id": "5e83cd14-99e5-4048-b71d-281f475b6397",
    "created_at": "2026-05-09T04:11:07.298Z",
    "comment": "The rendering quality is top-notch. Very clean and noise-free. The rendering quality is top-notch. Very clean and noise-free. Really expressive character design. You can feel the emotion.",
    "composition": 5,
    "detail": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_5_13",
    "post_id": "post_5",
    "reviewer_name": "Harmonic Pioneer",
    "device_id": "9cec972b-6e61-4dfd-a9db-b9bb178d1093",
    "created_at": "2026-05-24T16:30:22.944Z",
    "comment": "The composition rule of thirds is executed perfectly here. The rendering quality is top-notch. Very clean and noise-free. The rendering quality is top-notch. Very clean and noise-free.",
    "composition": 5,
    "detail": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_5_14",
    "post_id": "post_5",
    "reviewer_name": "Minimalist Artisan",
    "device_id": "432064f4-174a-452a-bcc3-f7b2a9b8a6f1",
    "created_at": "2026-05-23T09:28:44.784Z",
    "comment": "The sense of depth and perspective is masterful. The shadows are too completely black. Adding some ambient bounce light would make it richer. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic.",
    "composition": 4,
    "detail": 2,
    "aesthetics": 5
  },
  {
    "id": "rev_post_5_15",
    "post_id": "post_5",
    "reviewer_name": "Abstract Panda",
    "device_id": "51636544-6ee1-4c0b-928f-15786f27f77c",
    "created_at": "2026-05-06T22:56:22.788Z",
    "comment": "Love the stylized approach. The limited color palette works incredibly well. The composition rule of thirds is executed perfectly here. The rendering quality is top-notch. Very clean and noise-free.",
    "composition": 4,
    "detail": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_5_16",
    "post_id": "post_5",
    "reviewer_name": "Pixel Panda",
    "device_id": "d2e95601-5522-4320-ace2-47715bb7c5b1",
    "created_at": "2026-05-19T10:05:03.315Z",
    "comment": "The shadows are too completely black. Adding some ambient bounce light would make it richer. The perspective on the background buildings doesn't quite align with the foreground. The colors feel a bit muddy and desaturated. It lacks pop.",
    "composition": 3,
    "detail": 3,
    "aesthetics": 3
  },
  {
    "id": "rev_post_31_0",
    "post_id": "post_31",
    "reviewer_id": "user_4",
    "created_at": "2026-05-05T20:59:17.766Z",
    "comment": "The composition rule of thirds is executed perfectly here. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic. The textures look a bit tiling/repetitive in the background.",
    "composition": 5,
    "detail": 5,
    "aesthetics": 3
  },
  {
    "id": "rev_post_31_1",
    "post_id": "post_31",
    "reviewer_id": "user_3",
    "created_at": "2026-05-14T12:28:02.823Z",
    "comment": "The perspective on the background buildings doesn't quite align with the foreground. The composition rule of thirds is executed perfectly here. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic.",
    "composition": 3,
    "detail": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_31_2",
    "post_id": "post_31",
    "reviewer_id": "user_5",
    "created_at": "2026-05-04T10:58:51.050Z",
    "comment": "The lighting here is phenomenal. The soft rim light really separates the subject from the background. The shadows are too completely black. Adding some ambient bounce light would make it richer. The colors feel a bit muddy and desaturated. It lacks pop.",
    "composition": 4,
    "detail": 3,
    "aesthetics": 3
  },
  {
    "id": "rev_post_31_3",
    "post_id": "post_31",
    "reviewer_id": "user_2",
    "created_at": "2026-05-17T22:42:00.465Z",
    "comment": "The composition rule of thirds is executed perfectly here. Really expressive character design. You can feel the emotion. The anatomy feels a bit off, particularly around the shoulders and neck.",
    "composition": 3,
    "detail": 5,
    "aesthetics": 3
  },
  {
    "id": "rev_post_31_4",
    "post_id": "post_31",
    "reviewer_id": "user_1",
    "created_at": "2026-05-10T14:17:58.977Z",
    "comment": "Incredible attention to detail in the textures. The brushed metal looks totally photorealistic. The sense of depth and perspective is masterful. The colors feel a bit muddy and desaturated. It lacks pop.",
    "composition": 4,
    "detail": 5,
    "aesthetics": 3
  },
  {
    "id": "rev_post_31_5",
    "post_id": "post_31",
    "reviewer_name": "Kinetic Explorer",
    "device_id": "8ed6628a-30e9-4b8f-b4be-dd364b74526f",
    "created_at": "2026-05-26T00:22:47.762Z",
    "comment": "It feels a bit over-rendered. Sometimes less is more. The composition rule of thirds is executed perfectly here. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic.",
    "composition": 3,
    "detail": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_31_6",
    "post_id": "post_31",
    "reviewer_name": "Geometric Explorer",
    "device_id": "0ff196a5-bd7c-46ba-bece-27a37e6ce008",
    "created_at": "2026-05-13T11:44:24.232Z",
    "comment": "It feels a bit over-rendered. Sometimes less is more. The colors feel a bit muddy and desaturated. It lacks pop. The perspective on the background buildings doesn't quite align with the foreground.",
    "composition": 2,
    "detail": 2,
    "aesthetics": 2
  },
  {
    "id": "rev_post_31_7",
    "post_id": "post_31",
    "reviewer_name": "Vector Enthusiast",
    "device_id": "d26c2cb9-2bff-4b8c-90d4-55a6eb07d62d",
    "created_at": "2026-04-27T00:43:10.596Z",
    "comment": "It feels a bit over-rendered. Sometimes less is more. The composition rule of thirds is executed perfectly here. It feels a bit over-rendered. Sometimes less is more.",
    "composition": 1,
    "detail": 4,
    "aesthetics": 1
  },
  {
    "id": "rev_post_31_8",
    "post_id": "post_31",
    "reviewer_name": "Creative Thinker",
    "device_id": "14628824-6f06-4ffb-87ea-e2fbfd67812f",
    "created_at": "2026-05-12T22:22:34.479Z",
    "comment": "The anatomy feels a bit off, particularly around the shoulders and neck. The sense of depth and perspective is masterful. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic.",
    "composition": 3,
    "detail": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_31_9",
    "post_id": "post_31",
    "reviewer_name": "Creative Artisan",
    "device_id": "5a311e67-b4d5-44fb-b38c-a41aebeda7c0",
    "created_at": "2026-04-28T06:08:24.379Z",
    "comment": "The sense of depth and perspective is masterful. Really expressive character design. You can feel the emotion. The perspective on the background buildings doesn't quite align with the foreground.",
    "composition": 4,
    "detail": 5,
    "aesthetics": 2
  },
  {
    "id": "rev_post_31_10",
    "post_id": "post_31",
    "reviewer_name": "Vibrant Panda",
    "device_id": "560cd89d-6a4a-46ad-96b8-97be4c21918f",
    "created_at": "2026-04-30T08:42:09.406Z",
    "comment": "Incredible attention to detail in the textures. The brushed metal looks totally photorealistic. The lighting here is phenomenal. The soft rim light really separates the subject from the background. The sense of depth and perspective is masterful.",
    "composition": 3,
    "detail": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_31_11",
    "post_id": "post_31",
    "reviewer_name": "Bold Visionary",
    "device_id": "fe7325e7-2bb1-4b92-9a9d-8c367c4d3f24",
    "created_at": "2026-05-04T01:30:25.789Z",
    "comment": "Love the stylized approach. The limited color palette works incredibly well. The colors feel a bit muddy and desaturated. It lacks pop. The composition rule of thirds is executed perfectly here.",
    "composition": 4,
    "detail": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_31_12",
    "post_id": "post_31",
    "reviewer_name": "Abstract Guru",
    "device_id": "b22ae41d-5621-47b9-89e7-a9a06267390e",
    "created_at": "2026-04-27T13:41:11.594Z",
    "comment": "The sense of depth and perspective is masterful. The textures look a bit tiling/repetitive in the background. Love the stylized approach. The limited color palette works incredibly well.",
    "composition": 4,
    "detail": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_31_13",
    "post_id": "post_31",
    "reviewer_name": "Monochrome Craftsman",
    "device_id": "5b0e01f0-73a5-47a4-8321-ac9e1bbb2add",
    "created_at": "2026-04-30T20:51:46.767Z",
    "comment": "The colors feel a bit muddy and desaturated. It lacks pop. The colors feel a bit muddy and desaturated. It lacks pop. The perspective on the background buildings doesn't quite align with the foreground.",
    "composition": 1,
    "detail": 2,
    "aesthetics": 1
  },
  {
    "id": "rev_post_31_14",
    "post_id": "post_31",
    "reviewer_name": "Abstract Nomad",
    "device_id": "7198001f-565d-4b2d-8bfe-dea13cbdb0c8",
    "created_at": "2026-05-11T04:10:45.105Z",
    "comment": "Incredible attention to detail in the textures. The brushed metal looks totally photorealistic. The colors feel a bit muddy and desaturated. It lacks pop. The perspective on the background buildings doesn't quite align with the foreground.",
    "composition": 5,
    "detail": 2,
    "aesthetics": 1
  },
  {
    "id": "rev_post_31_15",
    "post_id": "post_31",
    "reviewer_name": "Subtle Pioneer",
    "device_id": "69bf73ec-89ee-4a50-96e6-c4d2fc817fc7",
    "created_at": "2026-05-20T17:07:49.393Z",
    "comment": "The sense of depth and perspective is masterful. The sense of depth and perspective is masterful. The sense of depth and perspective is masterful.",
    "composition": 4,
    "detail": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_26_0",
    "post_id": "post_26",
    "reviewer_id": "user_5",
    "created_at": "2026-05-20T19:11:50.286Z",
    "comment": "The imagery feels a bit like stock photos. It lacks authenticity. The composition is a bit static and boring. It doesn't really pop. Really dynamic composition. The angled lines give it a lot of energy.",
    "impact": 2,
    "clarity": 1,
    "engagement": 4
  },
  {
    "id": "rev_post_26_1",
    "post_id": "post_26",
    "reviewer_id": "user_1",
    "created_at": "2026-05-02T07:28:30.472Z",
    "comment": "The visual hook is immediate. It grabs attention right away. Clear, punchy copy that pairs perfectly with the bold imagery. Excellent use of the brand colors to create a cohesive campaign feel.",
    "impact": 4,
    "clarity": 5,
    "engagement": 5
  },
  {
    "id": "rev_post_26_2",
    "post_id": "post_26",
    "reviewer_id": "user_2",
    "created_at": "2026-04-30T12:53:53.733Z",
    "comment": "The use of human faces makes it feel very relatable and trustworthy. Really dynamic composition. The angled lines give it a lot of energy. The visual hierarchy guides the eye straight to the value proposition.",
    "impact": 4,
    "clarity": 5,
    "engagement": 5
  },
  {
    "id": "rev_post_26_3",
    "post_id": "post_26",
    "reviewer_id": "user_4",
    "created_at": "2026-05-19T12:06:32.451Z",
    "comment": "The call to action is impossible to miss. Great use of contrasting colors. The composition is a bit static and boring. It doesn't really pop. The use of human faces makes it feel very relatable and trustworthy.",
    "impact": 4,
    "clarity": 3,
    "engagement": 5
  },
  {
    "id": "rev_post_26_4",
    "post_id": "post_26",
    "reviewer_id": "user_3",
    "created_at": "2026-05-03T13:24:36.504Z",
    "comment": "Clear, punchy copy that pairs perfectly with the bold imagery. The headline typography is a bit hard to read against that busy background. The call to action is buried at the bottom. It should be much more prominent.",
    "impact": 5,
    "clarity": 2,
    "engagement": 2
  },
  {
    "id": "rev_post_26_5",
    "post_id": "post_26",
    "reviewer_name": "Bold Seeker",
    "device_id": "dda1cf4e-1788-4579-b15f-b625ea55329a",
    "created_at": "2026-05-08T03:23:09.518Z",
    "comment": "The visual hierarchy guides the eye straight to the value proposition. It feels a bit text-heavy for a social media ad. People will just scroll past. The headline typography is a bit hard to read against that busy background.",
    "impact": 3,
    "clarity": 3,
    "engagement": 3
  },
  {
    "id": "rev_post_26_6",
    "post_id": "post_26",
    "reviewer_name": "Vector Wizard",
    "device_id": "28fd481f-62a9-40fd-802c-208710489083",
    "created_at": "2026-04-29T06:44:59.620Z",
    "comment": "There's too much competing information. The main message gets lost in the noise. Clear, punchy copy that pairs perfectly with the bold imagery. Really dynamic composition. The angled lines give it a lot of energy.",
    "impact": 1,
    "clarity": 4,
    "engagement": 4
  },
  {
    "id": "rev_post_26_7",
    "post_id": "post_26",
    "reviewer_name": "Pixel Maverick",
    "device_id": "01cdc320-28df-43d4-ab21-44757b8ec3d9",
    "created_at": "2026-05-21T07:40:12.091Z",
    "comment": "Really dynamic composition. The angled lines give it a lot of energy. The tone is a bit too aggressive. It feels more like a hard sell than an invitation. The call to action is buried at the bottom. It should be much more prominent.",
    "impact": 5,
    "clarity": 1,
    "engagement": 1
  },
  {
    "id": "rev_post_26_8",
    "post_id": "post_26",
    "reviewer_name": "Geometric Visionary",
    "device_id": "bddd03c2-4bde-4e51-b8fd-047bfa1d1c98",
    "created_at": "2026-05-14T05:55:53.456Z",
    "comment": "The call to action is impossible to miss. Great use of contrasting colors. Excellent use of the brand colors to create a cohesive campaign feel. The visual hook is immediate. It grabs attention right away.",
    "impact": 5,
    "clarity": 5,
    "engagement": 4
  },
  {
    "id": "rev_post_26_9",
    "post_id": "post_26",
    "reviewer_name": "Minimalist Observer",
    "device_id": "bfc77731-87ae-477f-a77b-2cf1eea8f3a1",
    "created_at": "2026-05-17T08:51:33.533Z",
    "comment": "There's too much competing information. The main message gets lost in the noise. It feels a bit text-heavy for a social media ad. People will just scroll past. Excellent use of the brand colors to create a cohesive campaign feel.",
    "impact": 3,
    "clarity": 3,
    "engagement": 5
  },
  {
    "id": "rev_post_26_10",
    "post_id": "post_26",
    "reviewer_name": "Fluid Maverick",
    "device_id": "4b0a2d9a-7b1b-4ae9-8266-a5337ce84c4c",
    "created_at": "2026-05-17T17:01:09.370Z",
    "comment": "The use of human faces makes it feel very relatable and trustworthy. The call to action is impossible to miss. Great use of contrasting colors. The use of human faces makes it feel very relatable and trustworthy.",
    "impact": 4,
    "clarity": 4,
    "engagement": 4
  },
  {
    "id": "rev_post_26_11",
    "post_id": "post_26",
    "reviewer_name": "Creative Artisan",
    "device_id": "c959ce71-9eb1-4fed-ae46-6a7532b75b15",
    "created_at": "2026-05-25T05:05:58.786Z",
    "comment": "Clear, punchy copy that pairs perfectly with the bold imagery. Excellent use of the brand colors to create a cohesive campaign feel. The use of human faces makes it feel very relatable and trustworthy.",
    "impact": 5,
    "clarity": 4,
    "engagement": 4
  },
  {
    "id": "rev_post_26_12",
    "post_id": "post_26",
    "reviewer_name": "Geometric Wizard",
    "device_id": "0479ab5d-c9d3-4a07-ac0c-755c504299d0",
    "created_at": "2026-05-05T19:36:15.952Z",
    "comment": "The call to action is impossible to miss. Great use of contrasting colors. The call to action is impossible to miss. Great use of contrasting colors. The visual hook is immediate. It grabs attention right away.",
    "impact": 4,
    "clarity": 3,
    "engagement": 4
  },
  {
    "id": "rev_post_26_13",
    "post_id": "post_26",
    "reviewer_name": "Minimalist Artisan",
    "device_id": "081fe9d3-b50b-402e-bea7-1ceaf6b96137",
    "created_at": "2026-05-16T16:42:29.950Z",
    "comment": "The use of human faces makes it feel very relatable and trustworthy. The call to action is impossible to miss. Great use of contrasting colors. Excellent use of the brand colors to create a cohesive campaign feel.",
    "impact": 5,
    "clarity": 5,
    "engagement": 5
  },
  {
    "id": "rev_post_26_14",
    "post_id": "post_26",
    "reviewer_name": "Minimalist Critic",
    "device_id": "ffd61533-5629-4c8a-8e63-64d10473145a",
    "created_at": "2026-05-06T16:59:18.632Z",
    "comment": "The use of human faces makes it feel very relatable and trustworthy. The visual hierarchy guides the eye straight to the value proposition. Really dynamic composition. The angled lines give it a lot of energy.",
    "impact": 5,
    "clarity": 3,
    "engagement": 4
  },
  {
    "id": "rev_post_26_15",
    "post_id": "post_26",
    "reviewer_name": "Creative Panda",
    "device_id": "764090b6-f295-4a56-bafc-3891b39ff894",
    "created_at": "2026-04-28T23:22:07.204Z",
    "comment": "The tone is a bit too aggressive. It feels more like a hard sell than an invitation. The use of human faces makes it feel very relatable and trustworthy. The use of human faces makes it feel very relatable and trustworthy.",
    "impact": 2,
    "clarity": 5,
    "engagement": 5
  },
  {
    "id": "rev_post_26_16",
    "post_id": "post_26",
    "reviewer_name": "Creative Craftsman",
    "device_id": "f7efe925-1337-4593-8e53-d3e49b0bde89",
    "created_at": "2026-05-10T16:49:29.625Z",
    "comment": "It feels a bit text-heavy for a social media ad. People will just scroll past. The composition is a bit static and boring. It doesn't really pop. There's too much competing information. The main message gets lost in the noise.",
    "impact": 1,
    "clarity": 2,
    "engagement": 1
  },
  {
    "id": "rev_post_26_17",
    "post_id": "post_26",
    "reviewer_name": "Vector Artisan",
    "device_id": "41129fd6-a359-4992-b0c0-ae9a21375a30",
    "created_at": "2026-05-08T15:08:01.510Z",
    "comment": "Excellent use of the brand colors to create a cohesive campaign feel. The visual hierarchy guides the eye straight to the value proposition. The visual hook is immediate. It grabs attention right away.",
    "impact": 3,
    "clarity": 4,
    "engagement": 4
  },
  {
    "id": "rev_post_26_18",
    "post_id": "post_26",
    "reviewer_name": "Minimalist Dreamer",
    "device_id": "ae553dbe-77ad-4180-a99b-389fb72fa2a3",
    "created_at": "2026-05-22T16:34:19.305Z",
    "comment": "It feels a bit text-heavy for a social media ad. People will just scroll past. The visual hook is immediate. It grabs attention right away. Excellent use of the brand colors to create a cohesive campaign feel.",
    "impact": 2,
    "clarity": 5,
    "engagement": 4
  },
  {
    "id": "rev_post_26_19",
    "post_id": "post_26",
    "reviewer_name": "Abstract Architect",
    "device_id": "93c1a4a7-3304-4830-8853-ae29322f4ca9",
    "created_at": "2026-05-20T18:57:03.913Z",
    "comment": "The use of human faces makes it feel very relatable and trustworthy. The visual hook is immediate. It grabs attention right away. Clear, punchy copy that pairs perfectly with the bold imagery.",
    "impact": 4,
    "clarity": 5,
    "engagement": 5
  },
  {
    "id": "rev_post_33_0",
    "post_id": "post_33",
    "reviewer_id": "user_1",
    "created_at": "2026-05-11T07:34:28.518Z",
    "comment": "Incredible attention to detail in the textures. The brushed metal looks totally photorealistic. The lighting here is phenomenal. The soft rim light really separates the subject from the background. Love the stylized approach. The limited color palette works incredibly well.",
    "composition": 4,
    "detail": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_33_1",
    "post_id": "post_33",
    "reviewer_id": "user_2",
    "created_at": "2026-05-13T11:07:30.054Z",
    "comment": "Love the stylized approach. The limited color palette works incredibly well. The composition feels a bit unbalanced, heavily weighted to the left side. The composition feels a bit unbalanced, heavily weighted to the left side.",
    "composition": 5,
    "detail": 1,
    "aesthetics": 1
  },
  {
    "id": "rev_post_33_2",
    "post_id": "post_33",
    "reviewer_id": "user_3",
    "created_at": "2026-05-18T17:37:45.071Z",
    "comment": "The sense of depth and perspective is masterful. The perspective on the background buildings doesn't quite align with the foreground. The composition rule of thirds is executed perfectly here.",
    "composition": 5,
    "detail": 2,
    "aesthetics": 5
  },
  {
    "id": "rev_post_33_3",
    "post_id": "post_33",
    "reviewer_id": "user_5",
    "created_at": "2026-05-23T08:52:53.790Z",
    "comment": "The anatomy feels a bit off, particularly around the shoulders and neck. The sense of depth and perspective is masterful. Really expressive character design. You can feel the emotion.",
    "composition": 1,
    "detail": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_33_4",
    "post_id": "post_33",
    "reviewer_id": "user_4",
    "created_at": "2026-05-08T02:21:36.911Z",
    "comment": "The lighting here is phenomenal. The soft rim light really separates the subject from the background. Love the stylized approach. The limited color palette works incredibly well. The composition rule of thirds is executed perfectly here.",
    "composition": 5,
    "detail": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_33_5",
    "post_id": "post_33",
    "reviewer_name": "Digital Dreamer",
    "device_id": "666f0152-0b03-4d3e-ab71-3b6aabd082f5",
    "created_at": "2026-05-21T09:21:58.813Z",
    "comment": "The perspective on the background buildings doesn't quite align with the foreground. The colors feel a bit muddy and desaturated. It lacks pop. The colors feel a bit muddy and desaturated. It lacks pop.",
    "composition": 1,
    "detail": 2,
    "aesthetics": 2
  },
  {
    "id": "rev_post_33_6",
    "post_id": "post_33",
    "reviewer_name": "Digital Ninja",
    "device_id": "7b9674ee-5725-4553-b270-a8b6a2d3148e",
    "created_at": "2026-04-29T22:19:26.884Z",
    "comment": "Really expressive character design. You can feel the emotion. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic. Love the stylized approach. The limited color palette works incredibly well.",
    "composition": 4,
    "detail": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_33_7",
    "post_id": "post_33",
    "reviewer_name": "Digital Enthusiast",
    "device_id": "9536ec10-26a7-4b17-9e8b-eaa38802e99c",
    "created_at": "2026-05-18T08:36:58.865Z",
    "comment": "The sense of depth and perspective is masterful. The rendering quality is top-notch. Very clean and noise-free. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic.",
    "composition": 4,
    "detail": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_33_8",
    "post_id": "post_33",
    "reviewer_name": "Kinetic Panda",
    "device_id": "e1420cc8-3446-44cc-8eb3-07acacce340c",
    "created_at": "2026-05-11T08:06:19.938Z",
    "comment": "Love the stylized approach. The limited color palette works incredibly well. The composition rule of thirds is executed perfectly here. Love the stylized approach. The limited color palette works incredibly well.",
    "composition": 4,
    "detail": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_33_9",
    "post_id": "post_33",
    "reviewer_name": "Kinetic Ninja",
    "device_id": "373c455a-a45e-43d0-a061-761b7abe70bc",
    "created_at": "2026-05-21T18:38:33.108Z",
    "comment": "The sense of depth and perspective is masterful. Really expressive character design. You can feel the emotion. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic.",
    "composition": 3,
    "detail": 4,
    "aesthetics": 3
  },
  {
    "id": "rev_post_33_10",
    "post_id": "post_33",
    "reviewer_name": "Dynamic Critic",
    "device_id": "872d5ed1-918e-407c-9674-13153657f817",
    "created_at": "2026-05-22T13:22:46.061Z",
    "comment": "The shadows are too completely black. Adding some ambient bounce light would make it richer. The sense of depth and perspective is masterful. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic.",
    "composition": 1,
    "detail": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_33_11",
    "post_id": "post_33",
    "reviewer_name": "Creative Artisan",
    "device_id": "9568ded3-704b-4524-9f19-9c0d8193d04c",
    "created_at": "2026-05-21T06:03:07.844Z",
    "comment": "The anatomy feels a bit off, particularly around the shoulders and neck. It feels a bit over-rendered. Sometimes less is more. Really expressive character design. You can feel the emotion.",
    "composition": 3,
    "detail": 3,
    "aesthetics": 3
  },
  {
    "id": "rev_post_33_12",
    "post_id": "post_33",
    "reviewer_name": "Abstract Artisan",
    "device_id": "abbbe3c9-d31c-4817-a4dd-7217289a531e",
    "created_at": "2026-04-27T21:26:16.655Z",
    "comment": "Incredible attention to detail in the textures. The brushed metal looks totally photorealistic. The textures look a bit tiling/repetitive in the background. The anatomy feels a bit off, particularly around the shoulders and neck.",
    "composition": 4,
    "detail": 2,
    "aesthetics": 2
  },
  {
    "id": "rev_post_33_13",
    "post_id": "post_33",
    "reviewer_name": "Abstract Nomad",
    "device_id": "6217217f-fcd2-408a-8235-21381f6daa8f",
    "created_at": "2026-05-12T09:02:05.552Z",
    "comment": "The composition rule of thirds is executed perfectly here. The composition rule of thirds is executed perfectly here. The composition rule of thirds is executed perfectly here.",
    "composition": 4,
    "detail": 4,
    "aesthetics": 3
  },
  {
    "id": "rev_post_33_14",
    "post_id": "post_33",
    "reviewer_name": "Creative Nomad",
    "device_id": "fd459292-781f-430d-96b1-839e26d33b7d",
    "created_at": "2026-05-02T02:41:30.625Z",
    "comment": "The shadows are too completely black. Adding some ambient bounce light would make it richer. The anatomy feels a bit off, particularly around the shoulders and neck. The sense of depth and perspective is masterful.",
    "composition": 2,
    "detail": 1,
    "aesthetics": 5
  },
  {
    "id": "rev_post_34_0",
    "post_id": "post_34",
    "reviewer_id": "user_4",
    "created_at": "2026-05-24T07:09:01.460Z",
    "comment": "The composition rule of thirds is executed perfectly here. The rendering quality is top-notch. Very clean and noise-free. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic.",
    "composition": 5,
    "detail": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_34_1",
    "post_id": "post_34",
    "reviewer_id": "user_3",
    "created_at": "2026-05-07T10:47:18.468Z",
    "comment": "Love the stylized approach. The limited color palette works incredibly well. The composition rule of thirds is executed perfectly here. The shadows are too completely black. Adding some ambient bounce light would make it richer.",
    "composition": 3,
    "detail": 5,
    "aesthetics": 3
  },
  {
    "id": "rev_post_34_2",
    "post_id": "post_34",
    "reviewer_id": "user_5",
    "created_at": "2026-05-16T06:52:24.102Z",
    "comment": "The shadows are too completely black. Adding some ambient bounce light would make it richer. Really expressive character design. You can feel the emotion. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic.",
    "composition": 1,
    "detail": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_34_3",
    "post_id": "post_34",
    "reviewer_id": "user_1",
    "created_at": "2026-05-19T13:59:42.489Z",
    "comment": "The composition feels a bit unbalanced, heavily weighted to the left side. The composition rule of thirds is executed perfectly here. The rendering quality is top-notch. Very clean and noise-free.",
    "composition": 2,
    "detail": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_34_4",
    "post_id": "post_34",
    "reviewer_id": "user_2",
    "created_at": "2026-05-10T01:17:44.183Z",
    "comment": "The perspective on the background buildings doesn't quite align with the foreground. The lighting here is phenomenal. The soft rim light really separates the subject from the background. The composition feels a bit unbalanced, heavily weighted to the left side.",
    "composition": 1,
    "detail": 4,
    "aesthetics": 2
  },
  {
    "id": "rev_post_12_0",
    "post_id": "post_12",
    "reviewer_id": "user_5",
    "created_at": "2026-05-11T12:23:11.301Z",
    "comment": "Navigation is completely hidden behind the hamburger menu on desktop. It adds unnecessary friction. The onboarding flow seems very frictionless. Good job reducing cognitive load. Hierarchy is a bit flat. It's hard to tell what I'm supposed to look at first.",
    "usability": 2,
    "clarity": 5,
    "aesthetics": 1
  },
  {
    "id": "rev_post_12_1",
    "post_id": "post_12",
    "reviewer_id": "user_4",
    "created_at": "2026-05-07T19:53:42.876Z",
    "comment": "The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability. Those drop shadows are a bit heavy-handed. Softening them would make it feel more modern. Those drop shadows are a bit heavy-handed. Softening them would make it feel more modern.",
    "usability": 1,
    "clarity": 1,
    "aesthetics": 1
  },
  {
    "id": "rev_post_12_2",
    "post_id": "post_12",
    "reviewer_id": "user_3",
    "created_at": "2026-05-05T16:02:30.087Z",
    "comment": "The onboarding flow seems very frictionless. Good job reducing cognitive load. The form fields lack clear focus states, making it hard to tell what's active. The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability.",
    "usability": 5,
    "clarity": 3,
    "aesthetics": 3
  },
  {
    "id": "rev_post_12_3",
    "post_id": "post_12",
    "reviewer_id": "user_2",
    "created_at": "2026-05-19T05:08:31.054Z",
    "comment": "The contrast ratios are spot on. Very accessible and easy to read. Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 4,
    "clarity": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_12_4",
    "post_id": "post_12",
    "reviewer_id": "user_1",
    "created_at": "2026-05-13T09:26:48.831Z",
    "comment": "Love the subtle hover states on the cards. Makes the interface feel very responsive. Those drop shadows are a bit heavy-handed. Softening them would make it feel more modern. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 5,
    "clarity": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_16_0",
    "post_id": "post_16",
    "reviewer_id": "user_1",
    "created_at": "2026-04-28T05:40:46.036Z",
    "comment": "Love the playful use of shapes. It gives the brand a very approachable, friendly feel. The brand voice matches the visual identity perfectly. Very cohesive. I don't think the playful tone fits a B2B enterprise product. Seems misaligned.",
    "recognition": 5,
    "purpose": 3,
    "aesthetics": 3
  },
  {
    "id": "rev_post_16_1",
    "post_id": "post_16",
    "reviewer_id": "user_3",
    "created_at": "2026-05-05T22:23:55.070Z",
    "comment": "It feels a bit generic, like I've seen this exact geometric sans-serif treatment a dozen times. The secondary brand marks are just as strong as the primary. Great system. The earthy green color palette perfectly aligns with the organic/sustainable messaging.",
    "recognition": 3,
    "purpose": 4,
    "aesthetics": 3
  },
  {
    "id": "rev_post_16_2",
    "post_id": "post_16",
    "reviewer_id": "user_2",
    "created_at": "2026-05-24T20:20:25.482Z",
    "comment": "The foil stamping concept is brilliant. Very memorable and elevates the perceived value immediately. The secondary brand marks are just as strong as the primary. Great system. The secondary brand marks are just as strong as the primary. Great system.",
    "recognition": 4,
    "purpose": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_16_3",
    "post_id": "post_16",
    "reviewer_id": "user_5",
    "created_at": "2026-05-10T05:34:56.946Z",
    "comment": "The foil stamping concept is brilliant. Very memorable and elevates the perceived value immediately. The secondary brand marks are just as strong as the primary. Great system. I don't think the playful tone fits a B2B enterprise product. Seems misaligned.",
    "recognition": 4,
    "purpose": 4,
    "aesthetics": 3
  },
  {
    "id": "rev_post_16_4",
    "post_id": "post_16",
    "reviewer_id": "user_4",
    "created_at": "2026-04-30T13:25:20.188Z",
    "comment": "The foil stamping concept is brilliant. Very memorable and elevates the perceived value immediately. The earthy green color palette perfectly aligns with the organic/sustainable messaging. Love the playful use of shapes. It gives the brand a very approachable, friendly feel.",
    "recognition": 5,
    "purpose": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_16_5",
    "post_id": "post_16",
    "reviewer_name": "Monochrome Craftsman",
    "device_id": "5fb80e66-9641-49f7-b095-82c501eb1148",
    "created_at": "2026-05-14T08:34:51.767Z",
    "comment": "The neon colors feel a bit too trendy. I worry this identity will look dated in a year. Really strong brand recall here. The custom typography makes it instantly recognizable. The earthy green color palette perfectly aligns with the organic/sustainable messaging.",
    "recognition": 3,
    "purpose": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_16_6",
    "post_id": "post_16",
    "reviewer_name": "Harmonic Critic",
    "device_id": "530fc7eb-d053-413d-8f55-36c9150d2230",
    "created_at": "2026-05-02T07:59:52.393Z",
    "comment": "This logo mark scales down beautifully. It works just as well small as it does large. I don't think the playful tone fits a B2B enterprise product. Seems misaligned. The foil stamping concept is brilliant. Very memorable and elevates the perceived value immediately.",
    "recognition": 4,
    "purpose": 1,
    "aesthetics": 5
  },
  {
    "id": "rev_post_16_7",
    "post_id": "post_16",
    "reviewer_name": "Organic Craftsman",
    "device_id": "fa6a1cb8-13bc-4fb4-ac50-529e0bc00618",
    "created_at": "2026-05-25T18:01:42.496Z",
    "comment": "The brand voice matches the visual identity perfectly. Very cohesive. The foil stamping concept is brilliant. Very memorable and elevates the perceived value immediately. Love the playful use of shapes. It gives the brand a very approachable, friendly feel.",
    "recognition": 3,
    "purpose": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_13_0",
    "post_id": "post_13",
    "reviewer_id": "user_1",
    "created_at": "2026-05-15T16:23:19.825Z",
    "comment": "Love the subtle hover states on the cards. Makes the interface feel very responsive. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch.",
    "usability": 3,
    "clarity": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_13_1",
    "post_id": "post_13",
    "reviewer_id": "user_5",
    "created_at": "2026-05-08T18:51:19.951Z",
    "comment": "Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. The contrast ratios are spot on. Very accessible and easy to read.",
    "usability": 5,
    "clarity": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_13_2",
    "post_id": "post_13",
    "reviewer_id": "user_4",
    "created_at": "2026-05-15T03:06:34.661Z",
    "comment": "Hierarchy is a bit flat. It's hard to tell what I'm supposed to look at first. Love the subtle hover states on the cards. Makes the interface feel very responsive. The contrast ratios are spot on. Very accessible and easy to read.",
    "usability": 2,
    "clarity": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_13_3",
    "post_id": "post_13",
    "reviewer_id": "user_2",
    "created_at": "2026-05-24T09:14:15.615Z",
    "comment": "Hierarchy is a bit flat. It's hard to tell what I'm supposed to look at first. The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets. Not a fan of the bright blue primary button, it clashes with the muted pastel palette.",
    "usability": 1,
    "clarity": 2,
    "aesthetics": 2
  },
  {
    "id": "rev_post_13_4",
    "post_id": "post_13",
    "reviewer_id": "user_3",
    "created_at": "2026-05-02T17:51:05.271Z",
    "comment": "Navigation is completely hidden behind the hamburger menu on desktop. It adds unnecessary friction. The onboarding flow seems very frictionless. Good job reducing cognitive load. The onboarding flow seems very frictionless. Good job reducing cognitive load.",
    "usability": 1,
    "clarity": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_13_5",
    "post_id": "post_13",
    "reviewer_name": "Subtle Ninja",
    "device_id": "d39402d0-7281-4676-add0-f589536b16e8",
    "created_at": "2026-04-30T21:29:18.903Z",
    "comment": "The onboarding flow seems very frictionless. Good job reducing cognitive load. Not a fan of the bright blue primary button, it clashes with the muted pastel palette. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 4,
    "clarity": 3,
    "aesthetics": 3
  },
  {
    "id": "rev_post_13_6",
    "post_id": "post_13",
    "reviewer_name": "Abstract Explorer",
    "device_id": "6f126838-0a8a-481e-acd0-af5612186070",
    "created_at": "2026-05-22T07:56:33.810Z",
    "comment": "The body text feels a bit too light, maybe bump it up to a darker charcoal for better readability. The contrast ratios are spot on. Very accessible and easy to read. The layout feels a bit cramped on mobile breakpoints. Needs more padding around the touch targets.",
    "usability": 2,
    "clarity": 4,
    "aesthetics": 2
  },
  {
    "id": "rev_post_13_7",
    "post_id": "post_13",
    "reviewer_name": "Minimalist Pioneer",
    "device_id": "5dd258be-dee5-4e98-9e29-6370742ac826",
    "created_at": "2026-04-30T22:24:29.246Z",
    "comment": "The onboarding flow seems very frictionless. Good job reducing cognitive load. The contrast ratios are spot on. Very accessible and easy to read. Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch.",
    "usability": 4,
    "clarity": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_13_8",
    "post_id": "post_13",
    "reviewer_name": "Vibrant Guru",
    "device_id": "58386603-e599-4529-9258-30ae7c1972df",
    "created_at": "2026-04-29T09:34:04.618Z",
    "comment": "Those drop shadows are a bit heavy-handed. Softening them would make it feel more modern. The typography scale is solid, and the cool gray background feels perfect for the warm imagery. The contrast ratios are spot on. Very accessible and easy to read.",
    "usability": 3,
    "clarity": 5,
    "aesthetics": 3
  },
  {
    "id": "rev_post_13_9",
    "post_id": "post_13",
    "reviewer_name": "Creative Explorer",
    "device_id": "70df1096-e66b-4b03-a578-cf6e89eaade2",
    "created_at": "2026-05-01T01:08:54.366Z",
    "comment": "Navigation is completely hidden behind the hamburger menu on desktop. It adds unnecessary friction. Love the subtle hover states on the cards. Makes the interface feel very responsive. The onboarding flow seems very frictionless. Good job reducing cognitive load.",
    "usability": 3,
    "clarity": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_13_10",
    "post_id": "post_13",
    "reviewer_name": "Tactile Nomad",
    "device_id": "e22cd15b-9b31-4d6c-a6cf-d44c9a7ad765",
    "created_at": "2026-04-29T17:19:50.317Z",
    "comment": "Navigation is completely hidden behind the hamburger menu on desktop. It adds unnecessary friction. Those drop shadows are a bit heavy-handed. Softening them would make it feel more modern. Not a fan of the bright blue primary button, it clashes with the muted pastel palette.",
    "usability": 1,
    "clarity": 2,
    "aesthetics": 2
  },
  {
    "id": "rev_post_13_11",
    "post_id": "post_13",
    "reviewer_name": "Creative Nomad",
    "device_id": "085b5943-51f1-4086-8fe5-f1feddf6882a",
    "created_at": "2026-05-22T18:24:53.837Z",
    "comment": "The onboarding flow seems very frictionless. Good job reducing cognitive load. Not a fan of the bright blue primary button, it clashes with the muted pastel palette. Great use of negative space. It lets the content breathe nicely.",
    "usability": 5,
    "clarity": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_13_12",
    "post_id": "post_13",
    "reviewer_name": "Minimalist Guru",
    "device_id": "60a83ec7-6cc6-40e6-ad87-47198e7ef70c",
    "created_at": "2026-05-09T00:07:20.273Z",
    "comment": "Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch. Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch. The form fields lack clear focus states, making it hard to tell what's active.",
    "usability": 5,
    "clarity": 4,
    "aesthetics": 1
  },
  {
    "id": "rev_post_13_13",
    "post_id": "post_13",
    "reviewer_name": "Creative Artisan",
    "device_id": "033a06ed-5f2e-4b56-92f7-485a8e1fdcc3",
    "created_at": "2026-05-07T02:36:53.242Z",
    "comment": "The form fields lack clear focus states, making it hard to tell what's active. The onboarding flow seems very frictionless. Good job reducing cognitive load. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 3,
    "clarity": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_13_14",
    "post_id": "post_13",
    "reviewer_name": "Vibrant Maker",
    "device_id": "e7c75d15-640b-49dd-9d79-172eae98d9ba",
    "created_at": "2026-05-13T22:32:00.023Z",
    "comment": "The onboarding flow seems very frictionless. Good job reducing cognitive load. Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch. The contrast ratios are spot on. Very accessible and easy to read.",
    "usability": 5,
    "clarity": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_24_0",
    "post_id": "post_24",
    "reviewer_id": "user_3",
    "created_at": "2026-05-05T14:18:07.282Z",
    "comment": "The call to action is buried at the bottom. It should be much more prominent. The call to action is buried at the bottom. It should be much more prominent. The visual hook is immediate. It grabs attention right away.",
    "impact": 1,
    "clarity": 2,
    "engagement": 5
  },
  {
    "id": "rev_post_24_1",
    "post_id": "post_24",
    "reviewer_id": "user_2",
    "created_at": "2026-05-07T19:13:54.479Z",
    "comment": "Really dynamic composition. The angled lines give it a lot of energy. Clear, punchy copy that pairs perfectly with the bold imagery. The visual hierarchy guides the eye straight to the value proposition.",
    "impact": 5,
    "clarity": 5,
    "engagement": 4
  },
  {
    "id": "rev_post_24_2",
    "post_id": "post_24",
    "reviewer_id": "user_5",
    "created_at": "2026-04-28T01:38:29.153Z",
    "comment": "The headline typography is a bit hard to read against that busy background. The tone is a bit too aggressive. It feels more like a hard sell than an invitation. The call to action is buried at the bottom. It should be much more prominent.",
    "impact": 2,
    "clarity": 1,
    "engagement": 2
  },
  {
    "id": "rev_post_24_3",
    "post_id": "post_24",
    "reviewer_id": "user_4",
    "created_at": "2026-05-14T16:56:19.356Z",
    "comment": "Excellent use of the brand colors to create a cohesive campaign feel. Excellent use of the brand colors to create a cohesive campaign feel. Excellent use of the brand colors to create a cohesive campaign feel.",
    "impact": 4,
    "clarity": 5,
    "engagement": 4
  },
  {
    "id": "rev_post_24_4",
    "post_id": "post_24",
    "reviewer_id": "user_1",
    "created_at": "2026-04-30T10:19:24.100Z",
    "comment": "Excellent use of the brand colors to create a cohesive campaign feel. The composition is a bit static and boring. It doesn't really pop. Clear, punchy copy that pairs perfectly with the bold imagery.",
    "impact": 4,
    "clarity": 1,
    "engagement": 5
  },
  {
    "id": "rev_post_36_0",
    "post_id": "post_36",
    "reviewer_id": "user_4",
    "created_at": "2026-05-14T07:43:52.194Z",
    "comment": "The lighting here is phenomenal. The soft rim light really separates the subject from the background. Really expressive character design. You can feel the emotion. The composition rule of thirds is executed perfectly here.",
    "composition": 4,
    "detail": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_36_1",
    "post_id": "post_36",
    "reviewer_id": "user_2",
    "created_at": "2026-05-12T11:34:17.226Z",
    "comment": "Love the stylized approach. The limited color palette works incredibly well. The composition rule of thirds is executed perfectly here. The textures look a bit tiling/repetitive in the background.",
    "composition": 5,
    "detail": 4,
    "aesthetics": 3
  },
  {
    "id": "rev_post_36_2",
    "post_id": "post_36",
    "reviewer_id": "user_1",
    "created_at": "2026-05-21T17:41:02.850Z",
    "comment": "Incredible attention to detail in the textures. The brushed metal looks totally photorealistic. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic. The composition feels a bit unbalanced, heavily weighted to the left side.",
    "composition": 4,
    "detail": 3,
    "aesthetics": 3
  },
  {
    "id": "rev_post_36_3",
    "post_id": "post_36",
    "reviewer_id": "user_3",
    "created_at": "2026-04-30T20:55:48.513Z",
    "comment": "Incredible attention to detail in the textures. The brushed metal looks totally photorealistic. The composition rule of thirds is executed perfectly here. The composition rule of thirds is executed perfectly here.",
    "composition": 4,
    "detail": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_36_4",
    "post_id": "post_36",
    "reviewer_id": "user_5",
    "created_at": "2026-05-08T04:38:47.406Z",
    "comment": "Really expressive character design. You can feel the emotion. The rendering quality is top-notch. Very clean and noise-free. Really expressive character design. You can feel the emotion.",
    "composition": 4,
    "detail": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_36_5",
    "post_id": "post_36",
    "reviewer_name": "Vibrant Thinker",
    "device_id": "3e8de8ee-8dde-488f-af84-24aa84c3585e",
    "created_at": "2026-05-14T05:58:41.404Z",
    "comment": "The colors feel a bit muddy and desaturated. It lacks pop. The lighting here is phenomenal. The soft rim light really separates the subject from the background. Love the stylized approach. The limited color palette works incredibly well.",
    "composition": 3,
    "detail": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_36_6",
    "post_id": "post_36",
    "reviewer_name": "Monochrome Thinker",
    "device_id": "b39bec54-c2b6-47d1-bcdf-bd487adec167",
    "created_at": "2026-05-04T08:14:16.760Z",
    "comment": "The anatomy feels a bit off, particularly around the shoulders and neck. The sense of depth and perspective is masterful. The composition rule of thirds is executed perfectly here.",
    "composition": 3,
    "detail": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_36_7",
    "post_id": "post_36",
    "reviewer_name": "Digital Panda",
    "device_id": "75cdca74-33d4-4de2-b4d2-989dd93dc260",
    "created_at": "2026-04-30T19:37:56.920Z",
    "comment": "The rendering quality is top-notch. Very clean and noise-free. The textures look a bit tiling/repetitive in the background. The composition feels a bit unbalanced, heavily weighted to the left side.",
    "composition": 4,
    "detail": 2,
    "aesthetics": 1
  },
  {
    "id": "rev_post_36_8",
    "post_id": "post_36",
    "reviewer_name": "Lucid Maverick",
    "device_id": "b8527691-6455-4992-901e-833f123e1164",
    "created_at": "2026-04-27T23:11:12.980Z",
    "comment": "The composition rule of thirds is executed perfectly here. The composition rule of thirds is executed perfectly here. Love the stylized approach. The limited color palette works incredibly well.",
    "composition": 4,
    "detail": 4,
    "aesthetics": 3
  },
  {
    "id": "rev_post_36_9",
    "post_id": "post_36",
    "reviewer_name": "Fluid Enthusiast",
    "device_id": "3a26aa4c-19f7-4e12-87f4-da857183b4d4",
    "created_at": "2026-04-27T18:42:17.476Z",
    "comment": "The composition rule of thirds is executed perfectly here. Really expressive character design. You can feel the emotion. The composition rule of thirds is executed perfectly here.",
    "composition": 5,
    "detail": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_36_10",
    "post_id": "post_36",
    "reviewer_name": "Creative Nomad",
    "device_id": "003643ad-ece7-4fb0-9b25-1bacdde67bc3",
    "created_at": "2026-05-18T02:17:07.057Z",
    "comment": "Really expressive character design. You can feel the emotion. The composition rule of thirds is executed perfectly here. The sense of depth and perspective is masterful.",
    "composition": 4,
    "detail": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_36_11",
    "post_id": "post_36",
    "reviewer_name": "Organic Observer",
    "device_id": "acf9cb23-3560-4413-948f-238724d538b3",
    "created_at": "2026-05-26T23:46:34.457Z",
    "comment": "Incredible attention to detail in the textures. The brushed metal looks totally photorealistic. The textures look a bit tiling/repetitive in the background. It feels a bit over-rendered. Sometimes less is more.",
    "composition": 4,
    "detail": 1,
    "aesthetics": 1
  },
  {
    "id": "rev_post_36_12",
    "post_id": "post_36",
    "reviewer_name": "Dynamic Seeker",
    "device_id": "d8992f1c-743e-4cd3-9fe6-662253bddf9a",
    "created_at": "2026-05-22T10:16:47.470Z",
    "comment": "The composition rule of thirds is executed perfectly here. The rendering quality is top-notch. Very clean and noise-free. The textures look a bit tiling/repetitive in the background.",
    "composition": 4,
    "detail": 4,
    "aesthetics": 3
  },
  {
    "id": "rev_post_23_0",
    "post_id": "post_23",
    "reviewer_id": "user_4",
    "created_at": "2026-05-17T03:26:04.745Z",
    "comment": "Really dynamic composition. The angled lines give it a lot of energy. The visual hierarchy guides the eye straight to the value proposition. Excellent use of the brand colors to create a cohesive campaign feel.",
    "impact": 4,
    "clarity": 3,
    "engagement": 4
  },
  {
    "id": "rev_post_23_1",
    "post_id": "post_23",
    "reviewer_id": "user_3",
    "created_at": "2026-04-28T17:07:25.293Z",
    "comment": "The call to action is buried at the bottom. It should be much more prominent. It feels a bit text-heavy for a social media ad. People will just scroll past. There's too much competing information. The main message gets lost in the noise.",
    "impact": 2,
    "clarity": 2,
    "engagement": 1
  },
  {
    "id": "rev_post_23_2",
    "post_id": "post_23",
    "reviewer_id": "user_2",
    "created_at": "2026-05-25T20:34:48.783Z",
    "comment": "The visual hierarchy guides the eye straight to the value proposition. The composition is a bit static and boring. It doesn't really pop. The visual hook is immediate. It grabs attention right away.",
    "impact": 3,
    "clarity": 3,
    "engagement": 5
  },
  {
    "id": "rev_post_23_3",
    "post_id": "post_23",
    "reviewer_id": "user_5",
    "created_at": "2026-05-01T23:29:43.069Z",
    "comment": "The call to action is impossible to miss. Great use of contrasting colors. The use of human faces makes it feel very relatable and trustworthy. Really dynamic composition. The angled lines give it a lot of energy.",
    "impact": 5,
    "clarity": 3,
    "engagement": 5
  },
  {
    "id": "rev_post_23_4",
    "post_id": "post_23",
    "reviewer_id": "user_1",
    "created_at": "2026-05-13T01:18:42.988Z",
    "comment": "It feels a bit text-heavy for a social media ad. People will just scroll past. The imagery feels a bit like stock photos. It lacks authenticity. The use of human faces makes it feel very relatable and trustworthy.",
    "impact": 2,
    "clarity": 1,
    "engagement": 4
  },
  {
    "id": "rev_post_23_5",
    "post_id": "post_23",
    "reviewer_name": "Subtle Ninja",
    "device_id": "b33e128d-a5df-4c4f-90d5-941cc95cc3e0",
    "created_at": "2026-04-30T23:49:23.534Z",
    "comment": "The call to action is buried at the bottom. It should be much more prominent. The use of human faces makes it feel very relatable and trustworthy. The visual hierarchy guides the eye straight to the value proposition.",
    "impact": 1,
    "clarity": 4,
    "engagement": 5
  },
  {
    "id": "rev_post_23_6",
    "post_id": "post_23",
    "reviewer_name": "Geometric Craftsman",
    "device_id": "60952d81-338b-4c77-bca7-07d13431278e",
    "created_at": "2026-05-14T06:44:02.275Z",
    "comment": "The headline typography is a bit hard to read against that busy background. Clear, punchy copy that pairs perfectly with the bold imagery. The composition is a bit static and boring. It doesn't really pop.",
    "impact": 3,
    "clarity": 4,
    "engagement": 3
  },
  {
    "id": "rev_post_23_7",
    "post_id": "post_23",
    "reviewer_name": "Abstract Enthusiast",
    "device_id": "5112763b-53d3-48cc-ade9-2335c0d6288b",
    "created_at": "2026-05-15T12:38:08.602Z",
    "comment": "The use of human faces makes it feel very relatable and trustworthy. The visual hierarchy guides the eye straight to the value proposition. The imagery feels a bit like stock photos. It lacks authenticity.",
    "impact": 4,
    "clarity": 5,
    "engagement": 2
  },
  {
    "id": "rev_post_23_8",
    "post_id": "post_23",
    "reviewer_name": "Tactile Guru",
    "device_id": "35f324c8-de81-439f-8ad4-dc318e174c54",
    "created_at": "2026-05-14T02:01:26.008Z",
    "comment": "The imagery feels a bit like stock photos. It lacks authenticity. The headline typography is a bit hard to read against that busy background. Really dynamic composition. The angled lines give it a lot of energy.",
    "impact": 1,
    "clarity": 1,
    "engagement": 5
  },
  {
    "id": "rev_post_23_9",
    "post_id": "post_23",
    "reviewer_name": "Vibrant Wizard",
    "device_id": "5d4da7c4-a2a4-48ad-a4ab-f85a80335b8f",
    "created_at": "2026-05-15T17:45:29.508Z",
    "comment": "The tone is a bit too aggressive. It feels more like a hard sell than an invitation. The composition is a bit static and boring. It doesn't really pop. The call to action is buried at the bottom. It should be much more prominent.",
    "impact": 2,
    "clarity": 1,
    "engagement": 2
  },
  {
    "id": "rev_post_23_10",
    "post_id": "post_23",
    "reviewer_name": "Tactile Pioneer",
    "device_id": "6d50deff-d745-409b-9b75-d5fb0edd6e09",
    "created_at": "2026-05-02T09:04:13.638Z",
    "comment": "The composition is a bit static and boring. It doesn't really pop. There's too much competing information. The main message gets lost in the noise. Clear, punchy copy that pairs perfectly with the bold imagery.",
    "impact": 1,
    "clarity": 1,
    "engagement": 5
  },
  {
    "id": "rev_post_23_11",
    "post_id": "post_23",
    "reviewer_name": "Creative Dreamer",
    "device_id": "b1b632c2-36fb-4e28-8b4a-5631957c3bdc",
    "created_at": "2026-05-21T06:39:04.540Z",
    "comment": "The call to action is impossible to miss. Great use of contrasting colors. Excellent use of the brand colors to create a cohesive campaign feel. The use of human faces makes it feel very relatable and trustworthy.",
    "impact": 5,
    "clarity": 4,
    "engagement": 4
  },
  {
    "id": "rev_post_23_12",
    "post_id": "post_23",
    "reviewer_name": "Tactile Artisan",
    "device_id": "e54397ef-1a5c-4cc1-a55e-873069caa8af",
    "created_at": "2026-05-18T12:29:26.532Z",
    "comment": "Really dynamic composition. The angled lines give it a lot of energy. Really dynamic composition. The angled lines give it a lot of energy. The visual hierarchy guides the eye straight to the value proposition.",
    "impact": 4,
    "clarity": 5,
    "engagement": 3
  },
  {
    "id": "rev_post_23_13",
    "post_id": "post_23",
    "reviewer_name": "Creative Visionary",
    "device_id": "583e454a-e7f0-4683-86a6-4ee359ac0cb7",
    "created_at": "2026-05-13T21:52:53.859Z",
    "comment": "Clear, punchy copy that pairs perfectly with the bold imagery. The call to action is impossible to miss. Great use of contrasting colors. It feels a bit text-heavy for a social media ad. People will just scroll past.",
    "impact": 5,
    "clarity": 5,
    "engagement": 2
  },
  {
    "id": "rev_post_15_0",
    "post_id": "post_15",
    "reviewer_id": "user_3",
    "created_at": "2026-05-20T20:59:40.264Z",
    "comment": "The foil stamping concept is brilliant. Very memorable and elevates the perceived value immediately. The secondary brand marks are just as strong as the primary. Great system. Really strong brand recall here. The custom typography makes it instantly recognizable.",
    "recognition": 3,
    "purpose": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_15_1",
    "post_id": "post_15",
    "reviewer_id": "user_2",
    "created_at": "2026-05-21T03:12:53.507Z",
    "comment": "This logo mark scales down beautifully. It works just as well small as it does large. Really strong brand recall here. The custom typography makes it instantly recognizable. This logo mark scales down beautifully. It works just as well small as it does large.",
    "recognition": 5,
    "purpose": 4,
    "aesthetics": 3
  },
  {
    "id": "rev_post_15_2",
    "post_id": "post_15",
    "reviewer_id": "user_1",
    "created_at": "2026-05-20T06:48:31.330Z",
    "comment": "Really strong brand recall here. The custom typography makes it instantly recognizable. The foil stamping concept is brilliant. Very memorable and elevates the perceived value immediately. This logo mark scales down beautifully. It works just as well small as it does large.",
    "recognition": 4,
    "purpose": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_15_3",
    "post_id": "post_15",
    "reviewer_id": "user_5",
    "created_at": "2026-05-11T07:39:20.761Z",
    "comment": "This logo mark scales down beautifully. It works just as well small as it does large. The brand voice matches the visual identity perfectly. Very cohesive. The brand voice matches the visual identity perfectly. Very cohesive.",
    "recognition": 4,
    "purpose": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_15_4",
    "post_id": "post_15",
    "reviewer_id": "user_4",
    "created_at": "2026-05-07T15:53:35.854Z",
    "comment": "The neon colors feel a bit too trendy. I worry this identity will look dated in a year. This logo mark scales down beautifully. It works just as well small as it does large. Love the playful use of shapes. It gives the brand a very approachable, friendly feel.",
    "recognition": 2,
    "purpose": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_14_0",
    "post_id": "post_14",
    "reviewer_id": "user_2",
    "created_at": "2026-05-18T01:36:04.107Z",
    "comment": "The contrast ratios are spot on. Very accessible and easy to read. Hierarchy is a bit flat. It's hard to tell what I'm supposed to look at first. Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch.",
    "usability": 4,
    "clarity": 1,
    "aesthetics": 5
  },
  {
    "id": "rev_post_14_1",
    "post_id": "post_14",
    "reviewer_id": "user_5",
    "created_at": "2026-05-08T09:48:24.803Z",
    "comment": "Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch. The typography scale is solid, and the cool gray background feels perfect for the warm imagery. Love the subtle hover states on the cards. Makes the interface feel very responsive.",
    "usability": 4,
    "clarity": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_14_2",
    "post_id": "post_14",
    "reviewer_id": "user_3",
    "created_at": "2026-05-07T07:45:40.146Z",
    "comment": "Great use of negative space. It lets the content breathe nicely. Great use of negative space. It lets the content breathe nicely. Love the subtle hover states on the cards. Makes the interface feel very responsive.",
    "usability": 3,
    "clarity": 3,
    "aesthetics": 4
  },
  {
    "id": "rev_post_14_3",
    "post_id": "post_14",
    "reviewer_id": "user_1",
    "created_at": "2026-05-15T12:05:45.247Z",
    "comment": "The typography scale is solid, and the cool gray background feels perfect for the warm imagery. The onboarding flow seems very frictionless. Good job reducing cognitive load. The contrast ratios are spot on. Very accessible and easy to read.",
    "usability": 4,
    "clarity": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_14_4",
    "post_id": "post_14",
    "reviewer_id": "user_4",
    "created_at": "2026-05-10T14:20:49.831Z",
    "comment": "Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. The onboarding flow seems very frictionless. Good job reducing cognitive load. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 3,
    "clarity": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_14_5",
    "post_id": "post_14",
    "reviewer_name": "Digital Maker",
    "device_id": "bb45c2e1-c1ad-4c0f-ac93-be13f9048f88",
    "created_at": "2026-05-01T11:57:17.463Z",
    "comment": "Really clean visual hierarchy. The primary calls to action stand out without being obnoxious. The contrast ratios are spot on. Very accessible and easy to read. The typography scale is solid, and the cool gray background feels perfect for the warm imagery.",
    "usability": 5,
    "clarity": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_14_6",
    "post_id": "post_14",
    "reviewer_name": "Creative Enthusiast",
    "device_id": "120ed1d3-effe-47c5-b60d-b3670de560b1",
    "created_at": "2026-05-14T22:10:44.821Z",
    "comment": "The onboarding flow seems very frictionless. Good job reducing cognitive load. Love the subtle hover states on the cards. Makes the interface feel very responsive. Navigation flow is incredibly intuitive. The sticky header behavior is a nice touch.",
    "usability": 4,
    "clarity": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_18_0",
    "post_id": "post_18",
    "reviewer_id": "user_4",
    "created_at": "2026-04-27T13:46:42.879Z",
    "comment": "Love the playful use of shapes. It gives the brand a very approachable, friendly feel. Really strong brand recall here. The custom typography makes it instantly recognizable. This logo mark scales down beautifully. It works just as well small as it does large.",
    "recognition": 5,
    "purpose": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_18_1",
    "post_id": "post_18",
    "reviewer_id": "user_3",
    "created_at": "2026-05-26T03:08:14.381Z",
    "comment": "The brand voice matches the visual identity perfectly. Very cohesive. The kerning on the logotype is a bit tight, especially around the 'R' and 'A'. The brand voice matches the visual identity perfectly. Very cohesive.",
    "recognition": 5,
    "purpose": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_18_2",
    "post_id": "post_18",
    "reviewer_id": "user_5",
    "created_at": "2026-05-08T17:05:37.939Z",
    "comment": "The brand voice matches the visual identity perfectly. Very cohesive. This logo mark scales down beautifully. It works just as well small as it does large. Really strong brand recall here. The custom typography makes it instantly recognizable.",
    "recognition": 4,
    "purpose": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_18_3",
    "post_id": "post_18",
    "reviewer_id": "user_2",
    "created_at": "2026-05-13T02:38:01.132Z",
    "comment": "It feels a bit generic, like I've seen this exact geometric sans-serif treatment a dozen times. Really strong brand recall here. The custom typography makes it instantly recognizable. The neon colors feel a bit too trendy. I worry this identity will look dated in a year.",
    "recognition": 1,
    "purpose": 4,
    "aesthetics": 2
  },
  {
    "id": "rev_post_18_4",
    "post_id": "post_18",
    "reviewer_id": "user_1",
    "created_at": "2026-05-24T08:48:45.659Z",
    "comment": "The brand voice matches the visual identity perfectly. Very cohesive. The mark is a bit too abstract. I'm not sure it clearly communicates what the company actually does. It feels a bit generic, like I've seen this exact geometric sans-serif treatment a dozen times.",
    "recognition": 5,
    "purpose": 1,
    "aesthetics": 2
  },
  {
    "id": "rev_post_18_5",
    "post_id": "post_18",
    "reviewer_name": "Lucid Thinker",
    "device_id": "78cc4a44-867c-4f1c-8cea-0dff9914e0f1",
    "created_at": "2026-04-30T18:40:06.378Z",
    "comment": "Really strong brand recall here. The custom typography makes it instantly recognizable. The earthy green color palette perfectly aligns with the organic/sustainable messaging. This logo mark scales down beautifully. It works just as well small as it does large.",
    "recognition": 4,
    "purpose": 5,
    "aesthetics": 3
  },
  {
    "id": "rev_post_18_6",
    "post_id": "post_18",
    "reviewer_name": "Harmonic Wizard",
    "device_id": "a964d7d8-9e97-49df-9828-1e6cda316326",
    "created_at": "2026-05-15T06:27:01.086Z",
    "comment": "The kerning on the logotype is a bit tight, especially around the 'R' and 'A'. Love the playful use of shapes. It gives the brand a very approachable, friendly feel. The secondary brand marks are just as strong as the primary. Great system.",
    "recognition": 2,
    "purpose": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_18_7",
    "post_id": "post_18",
    "reviewer_name": "Organic Fox",
    "device_id": "f44a5d57-1729-4047-8263-9044162ff7c4",
    "created_at": "2026-04-27T09:54:22.718Z",
    "comment": "The brand voice matches the visual identity perfectly. Very cohesive. Love the playful use of shapes. It gives the brand a very approachable, friendly feel. The foil stamping concept is brilliant. Very memorable and elevates the perceived value immediately.",
    "recognition": 5,
    "purpose": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_18_8",
    "post_id": "post_18",
    "reviewer_name": "Organic Maverick",
    "device_id": "466e5949-aa2e-4030-8577-43f99aef545e",
    "created_at": "2026-05-09T22:39:16.980Z",
    "comment": "This logo mark scales down beautifully. It works just as well small as it does large. Love the playful use of shapes. It gives the brand a very approachable, friendly feel. The secondary brand marks are just as strong as the primary. Great system.",
    "recognition": 5,
    "purpose": 4,
    "aesthetics": 4
  },
  {
    "id": "rev_post_18_9",
    "post_id": "post_18",
    "reviewer_name": "Organic Visionary",
    "device_id": "65484638-6a9d-4ca9-b9b7-ae3647ac6447",
    "created_at": "2026-05-14T05:11:32.762Z",
    "comment": "The secondary brand marks are just as strong as the primary. Great system. Love the playful use of shapes. It gives the brand a very approachable, friendly feel. The foil stamping concept is brilliant. Very memorable and elevates the perceived value immediately.",
    "recognition": 5,
    "purpose": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_18_10",
    "post_id": "post_18",
    "reviewer_name": "Subtle Architect",
    "device_id": "93d01b5e-815e-474a-a174-69aa5959bfde",
    "created_at": "2026-05-07T04:41:32.598Z",
    "comment": "Love the playful use of shapes. It gives the brand a very approachable, friendly feel. Love the playful use of shapes. It gives the brand a very approachable, friendly feel. I don't think the playful tone fits a B2B enterprise product. Seems misaligned.",
    "recognition": 4,
    "purpose": 5,
    "aesthetics": 1
  },
  {
    "id": "rev_post_18_11",
    "post_id": "post_18",
    "reviewer_name": "Kinetic Panda",
    "device_id": "82e8d41e-362d-4482-9f78-a45eb8942048",
    "created_at": "2026-05-15T03:56:25.108Z",
    "comment": "Really strong brand recall here. The custom typography makes it instantly recognizable. This logo mark scales down beautifully. It works just as well small as it does large. The mark is a bit too abstract. I'm not sure it clearly communicates what the company actually does.",
    "recognition": 4,
    "purpose": 4,
    "aesthetics": 3
  },
  {
    "id": "rev_post_18_12",
    "post_id": "post_18",
    "reviewer_name": "Organic Seeker",
    "device_id": "19b25c45-99e4-4eae-88f0-496f62b9031a",
    "created_at": "2026-05-07T08:52:49.898Z",
    "comment": "The foil stamping concept is brilliant. Very memorable and elevates the perceived value immediately. I don't think the playful tone fits a B2B enterprise product. Seems misaligned. Really strong brand recall here. The custom typography makes it instantly recognizable.",
    "recognition": 5,
    "purpose": 3,
    "aesthetics": 3
  },
  {
    "id": "rev_post_18_13",
    "post_id": "post_18",
    "reviewer_name": "Kinetic Fox",
    "device_id": "8c98f52a-e771-4e41-be62-b4fe412853f2",
    "created_at": "2026-05-15T05:36:36.262Z",
    "comment": "The foil stamping concept is brilliant. Very memorable and elevates the perceived value immediately. The earthy green color palette perfectly aligns with the organic/sustainable messaging. The brand voice matches the visual identity perfectly. Very cohesive.",
    "recognition": 5,
    "purpose": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_18_14",
    "post_id": "post_18",
    "reviewer_name": "Bold Maker",
    "device_id": "0c179771-aa33-4b61-9249-b714510bd2cd",
    "created_at": "2026-04-27T00:41:29.802Z",
    "comment": "The mark is a bit too abstract. I'm not sure it clearly communicates what the company actually does. The earthy green color palette perfectly aligns with the organic/sustainable messaging. The earthy green color palette perfectly aligns with the organic/sustainable messaging.",
    "recognition": 3,
    "purpose": 4,
    "aesthetics": 5
  },
  {
    "id": "rev_post_18_15",
    "post_id": "post_18",
    "reviewer_name": "Kinetic Architect",
    "device_id": "8a9a3b87-6ff1-43f3-860b-b4aa4d2e810e",
    "created_at": "2026-05-11T07:14:52.182Z",
    "comment": "The secondary brand marks are just as strong as the primary. Great system. The secondary brand marks are just as strong as the primary. Great system. The secondary brand marks are just as strong as the primary. Great system.",
    "recognition": 3,
    "purpose": 4,
    "aesthetics": 3
  },
  {
    "id": "rev_post_18_16",
    "post_id": "post_18",
    "reviewer_name": "Sleek Panda",
    "device_id": "53efeedd-ac6f-4ab7-8c6e-2419f0b64272",
    "created_at": "2026-05-19T18:59:08.829Z",
    "comment": "Love the playful use of shapes. It gives the brand a very approachable, friendly feel. The brand voice matches the visual identity perfectly. Very cohesive. The foil stamping concept is brilliant. Very memorable and elevates the perceived value immediately.",
    "recognition": 4,
    "purpose": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_21_0",
    "post_id": "post_21",
    "reviewer_id": "user_3",
    "created_at": "2026-04-28T04:48:28.162Z",
    "comment": "The headline typography is a bit hard to read against that busy background. The visual hook is immediate. It grabs attention right away. Excellent use of the brand colors to create a cohesive campaign feel.",
    "impact": 3,
    "clarity": 5,
    "engagement": 5
  },
  {
    "id": "rev_post_21_1",
    "post_id": "post_21",
    "reviewer_id": "user_2",
    "created_at": "2026-05-17T21:28:14.497Z",
    "comment": "The visual hook is immediate. It grabs attention right away. Excellent use of the brand colors to create a cohesive campaign feel. The visual hierarchy guides the eye straight to the value proposition.",
    "impact": 4,
    "clarity": 4,
    "engagement": 5
  },
  {
    "id": "rev_post_21_2",
    "post_id": "post_21",
    "reviewer_id": "user_4",
    "created_at": "2026-04-30T08:56:11.332Z",
    "comment": "The composition is a bit static and boring. It doesn't really pop. The headline typography is a bit hard to read against that busy background. The tone is a bit too aggressive. It feels more like a hard sell than an invitation.",
    "impact": 2,
    "clarity": 2,
    "engagement": 1
  },
  {
    "id": "rev_post_21_3",
    "post_id": "post_21",
    "reviewer_id": "user_5",
    "created_at": "2026-05-17T02:24:08.437Z",
    "comment": "The imagery feels a bit like stock photos. It lacks authenticity. The composition is a bit static and boring. It doesn't really pop. It feels a bit text-heavy for a social media ad. People will just scroll past.",
    "impact": 2,
    "clarity": 1,
    "engagement": 2
  },
  {
    "id": "rev_post_21_4",
    "post_id": "post_21",
    "reviewer_id": "user_1",
    "created_at": "2026-05-08T17:44:10.236Z",
    "comment": "The use of human faces makes it feel very relatable and trustworthy. Really dynamic composition. The angled lines give it a lot of energy. The imagery feels a bit like stock photos. It lacks authenticity.",
    "impact": 5,
    "clarity": 4,
    "engagement": 3
  },
  {
    "id": "rev_post_21_5",
    "post_id": "post_21",
    "reviewer_name": "Sleek Wizard",
    "device_id": "38829b95-c516-41d3-8c3e-492ff975a425",
    "created_at": "2026-05-12T19:45:14.054Z",
    "comment": "The visual hook is immediate. It grabs attention right away. Really dynamic composition. The angled lines give it a lot of energy. Really dynamic composition. The angled lines give it a lot of energy.",
    "impact": 4,
    "clarity": 3,
    "engagement": 3
  },
  {
    "id": "rev_post_21_6",
    "post_id": "post_21",
    "reviewer_name": "Subtle Ninja",
    "device_id": "efa700b3-a263-4820-ab12-4a750984c230",
    "created_at": "2026-05-06T10:34:07.741Z",
    "comment": "The headline typography is a bit hard to read against that busy background. The visual hierarchy guides the eye straight to the value proposition. The use of human faces makes it feel very relatable and trustworthy.",
    "impact": 3,
    "clarity": 4,
    "engagement": 5
  },
  {
    "id": "rev_post_21_7",
    "post_id": "post_21",
    "reviewer_name": "Vibrant Panda",
    "device_id": "0b82d165-c1e5-44a6-8076-64cf221d1a8c",
    "created_at": "2026-05-19T09:51:31.732Z",
    "comment": "Clear, punchy copy that pairs perfectly with the bold imagery. The use of human faces makes it feel very relatable and trustworthy. Excellent use of the brand colors to create a cohesive campaign feel.",
    "impact": 4,
    "clarity": 4,
    "engagement": 5
  },
  {
    "id": "rev_post_21_8",
    "post_id": "post_21",
    "reviewer_name": "Prismatic Visionary",
    "device_id": "29bc8cb2-0032-462b-bc3f-f9ce48f8edda",
    "created_at": "2026-05-19T01:49:40.195Z",
    "comment": "Excellent use of the brand colors to create a cohesive campaign feel. Really dynamic composition. The angled lines give it a lot of energy. The call to action is impossible to miss. Great use of contrasting colors.",
    "impact": 5,
    "clarity": 4,
    "engagement": 4
  },
  {
    "id": "rev_post_22_0",
    "post_id": "post_22",
    "reviewer_id": "user_4",
    "created_at": "2026-05-18T11:10:11.228Z",
    "comment": "The composition is a bit static and boring. It doesn't really pop. The call to action is buried at the bottom. It should be much more prominent. The imagery feels a bit like stock photos. It lacks authenticity.",
    "impact": 1,
    "clarity": 2,
    "engagement": 1
  },
  {
    "id": "rev_post_22_1",
    "post_id": "post_22",
    "reviewer_id": "user_1",
    "created_at": "2026-05-02T13:42:32.763Z",
    "comment": "The visual hook is immediate. It grabs attention right away. The use of human faces makes it feel very relatable and trustworthy. Clear, punchy copy that pairs perfectly with the bold imagery.",
    "impact": 4,
    "clarity": 5,
    "engagement": 5
  },
  {
    "id": "rev_post_22_2",
    "post_id": "post_22",
    "reviewer_id": "user_2",
    "created_at": "2026-05-04T03:45:15.351Z",
    "comment": "The call to action is buried at the bottom. It should be much more prominent. The call to action is impossible to miss. Great use of contrasting colors. The call to action is buried at the bottom. It should be much more prominent.",
    "impact": 3,
    "clarity": 5,
    "engagement": 3
  },
  {
    "id": "rev_post_22_3",
    "post_id": "post_22",
    "reviewer_id": "user_3",
    "created_at": "2026-04-30T10:56:10.995Z",
    "comment": "The call to action is impossible to miss. Great use of contrasting colors. Clear, punchy copy that pairs perfectly with the bold imagery. The use of human faces makes it feel very relatable and trustworthy.",
    "impact": 4,
    "clarity": 4,
    "engagement": 5
  },
  {
    "id": "rev_post_22_4",
    "post_id": "post_22",
    "reviewer_id": "user_5",
    "created_at": "2026-05-20T03:29:13.989Z",
    "comment": "The tone is a bit too aggressive. It feels more like a hard sell than an invitation. The call to action is buried at the bottom. It should be much more prominent. The visual hook is immediate. It grabs attention right away.",
    "impact": 1,
    "clarity": 2,
    "engagement": 5
  },
  {
    "id": "rev_post_22_5",
    "post_id": "post_22",
    "reviewer_name": "Sleek Guru",
    "device_id": "f5ff9087-aa59-45a9-896b-50c1377020b5",
    "created_at": "2026-05-10T11:52:39.145Z",
    "comment": "It feels a bit text-heavy for a social media ad. People will just scroll past. The visual hierarchy guides the eye straight to the value proposition. Excellent use of the brand colors to create a cohesive campaign feel.",
    "impact": 3,
    "clarity": 4,
    "engagement": 5
  },
  {
    "id": "rev_post_22_6",
    "post_id": "post_22",
    "reviewer_name": "Harmonic Nomad",
    "device_id": "a3bd8d85-7f75-4fb8-97b4-7dacf64f6d03",
    "created_at": "2026-05-03T17:29:40.268Z",
    "comment": "The call to action is impossible to miss. Great use of contrasting colors. The call to action is impossible to miss. Great use of contrasting colors. The imagery feels a bit like stock photos. It lacks authenticity.",
    "impact": 4,
    "clarity": 3,
    "engagement": 3
  },
  {
    "id": "rev_post_22_7",
    "post_id": "post_22",
    "reviewer_name": "Digital Pioneer",
    "device_id": "2d63cedc-aceb-426c-ad0b-16104486db28",
    "created_at": "2026-05-10T23:16:12.635Z",
    "comment": "The use of human faces makes it feel very relatable and trustworthy. The call to action is impossible to miss. Great use of contrasting colors. The call to action is impossible to miss. Great use of contrasting colors.",
    "impact": 5,
    "clarity": 5,
    "engagement": 5
  },
  {
    "id": "rev_post_22_8",
    "post_id": "post_22",
    "reviewer_name": "Harmonic Maverick",
    "device_id": "db886496-3c09-4d3e-8bea-0db17c29928d",
    "created_at": "2026-05-14T11:48:21.988Z",
    "comment": "Clear, punchy copy that pairs perfectly with the bold imagery. The visual hierarchy guides the eye straight to the value proposition. Really dynamic composition. The angled lines give it a lot of energy.",
    "impact": 5,
    "clarity": 4,
    "engagement": 4
  },
  {
    "id": "rev_post_22_9",
    "post_id": "post_22",
    "reviewer_name": "Kinetic Dreamer",
    "device_id": "a3f7b4f9-21a8-4b34-8ae4-3b3c72fc37dd",
    "created_at": "2026-05-18T08:17:38.001Z",
    "comment": "Excellent use of the brand colors to create a cohesive campaign feel. The call to action is buried at the bottom. It should be much more prominent. Excellent use of the brand colors to create a cohesive campaign feel.",
    "impact": 3,
    "clarity": 3,
    "engagement": 4
  },
  {
    "id": "rev_post_22_10",
    "post_id": "post_22",
    "reviewer_name": "Lucid Observer",
    "device_id": "25114e5c-8ad6-4d20-be8a-bb6a3ddee5d3",
    "created_at": "2026-05-02T14:05:03.307Z",
    "comment": "The visual hierarchy guides the eye straight to the value proposition. Really dynamic composition. The angled lines give it a lot of energy. The visual hierarchy guides the eye straight to the value proposition.",
    "impact": 5,
    "clarity": 5,
    "engagement": 4
  },
  {
    "id": "rev_post_22_11",
    "post_id": "post_22",
    "reviewer_name": "Kinetic Fox",
    "device_id": "d6fd203f-05a6-40a8-9e26-b8ffe3bc0f99",
    "created_at": "2026-05-20T11:16:00.928Z",
    "comment": "Excellent use of the brand colors to create a cohesive campaign feel. The composition is a bit static and boring. It doesn't really pop. The visual hook is immediate. It grabs attention right away.",
    "impact": 4,
    "clarity": 3,
    "engagement": 5
  },
  {
    "id": "rev_post_22_12",
    "post_id": "post_22",
    "reviewer_name": "Prismatic Critic",
    "device_id": "c8be8b09-e426-48bc-85e7-634dcb50f633",
    "created_at": "2026-05-06T23:19:35.852Z",
    "comment": "There's too much competing information. The main message gets lost in the noise. Excellent use of the brand colors to create a cohesive campaign feel. Excellent use of the brand colors to create a cohesive campaign feel.",
    "impact": 3,
    "clarity": 4,
    "engagement": 3
  },
  {
    "id": "rev_post_22_13",
    "post_id": "post_22",
    "reviewer_name": "Harmonic Visionary",
    "device_id": "2998fde2-202f-49b1-b66a-efd0f3e76cb6",
    "created_at": "2026-05-07T00:38:40.481Z",
    "comment": "The composition is a bit static and boring. It doesn't really pop. The imagery feels a bit like stock photos. It lacks authenticity. It feels a bit text-heavy for a social media ad. People will just scroll past.",
    "impact": 2,
    "clarity": 1,
    "engagement": 1
  },
  {
    "id": "rev_post_22_14",
    "post_id": "post_22",
    "reviewer_name": "Digital Ninja",
    "device_id": "60b9c79a-0fa4-4ec1-8888-e7b7cc879341",
    "created_at": "2026-04-28T15:59:16.264Z",
    "comment": "The call to action is impossible to miss. Great use of contrasting colors. It feels a bit text-heavy for a social media ad. People will just scroll past. Excellent use of the brand colors to create a cohesive campaign feel.",
    "impact": 5,
    "clarity": 1,
    "engagement": 5
  },
  {
    "id": "rev_post_22_15",
    "post_id": "post_22",
    "reviewer_name": "Digital Fox",
    "device_id": "d7a8f82e-f949-4c81-9544-61919da221d3",
    "created_at": "2026-05-02T07:53:07.852Z",
    "comment": "The headline typography is a bit hard to read against that busy background. The tone is a bit too aggressive. It feels more like a hard sell than an invitation. The imagery feels a bit like stock photos. It lacks authenticity.",
    "impact": 2,
    "clarity": 1,
    "engagement": 1
  },
  {
    "id": "rev_post_22_16",
    "post_id": "post_22",
    "reviewer_name": "Kinetic Wizard",
    "device_id": "a79ded15-ffc5-4c8f-8478-e870e0d8f1e9",
    "created_at": "2026-05-21T17:36:07.919Z",
    "comment": "The visual hook is immediate. It grabs attention right away. The use of human faces makes it feel very relatable and trustworthy. The composition is a bit static and boring. It doesn't really pop.",
    "impact": 5,
    "clarity": 5,
    "engagement": 2
  },
  {
    "id": "rev_post_22_17",
    "post_id": "post_22",
    "reviewer_name": "Harmonic Craftsman",
    "device_id": "7d2ea82a-da23-49a2-8ed2-8c46d956f62c",
    "created_at": "2026-05-03T03:02:17.852Z",
    "comment": "The headline typography is a bit hard to read against that busy background. Clear, punchy copy that pairs perfectly with the bold imagery. The visual hook is immediate. It grabs attention right away.",
    "impact": 3,
    "clarity": 4,
    "engagement": 5
  },
  {
    "id": "rev_post_22_18",
    "post_id": "post_22",
    "reviewer_name": "Lucid Explorer",
    "device_id": "36122b9b-f8eb-4edc-91f6-225538aa7c6d",
    "created_at": "2026-05-12T18:10:11.137Z",
    "comment": "Clear, punchy copy that pairs perfectly with the bold imagery. The headline typography is a bit hard to read against that busy background. The headline typography is a bit hard to read against that busy background.",
    "impact": 4,
    "clarity": 3,
    "engagement": 3
  },
  {
    "id": "rev_post_29_0",
    "post_id": "post_29",
    "reviewer_id": "user_2",
    "created_at": "2026-05-09T02:58:46.128Z",
    "comment": "Love the stylized approach. The limited color palette works incredibly well. It feels a bit over-rendered. Sometimes less is more. The composition feels a bit unbalanced, heavily weighted to the left side.",
    "composition": 4,
    "detail": 2,
    "aesthetics": 2
  },
  {
    "id": "rev_post_29_1",
    "post_id": "post_29",
    "reviewer_id": "user_3",
    "created_at": "2026-05-15T00:11:45.367Z",
    "comment": "The composition rule of thirds is executed perfectly here. Love the stylized approach. The limited color palette works incredibly well. The composition rule of thirds is executed perfectly here.",
    "composition": 5,
    "detail": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_29_2",
    "post_id": "post_29",
    "reviewer_id": "user_5",
    "created_at": "2026-05-07T14:57:55.950Z",
    "comment": "The lighting here is phenomenal. The soft rim light really separates the subject from the background. The rendering quality is top-notch. Very clean and noise-free. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic.",
    "composition": 3,
    "detail": 5,
    "aesthetics": 4
  },
  {
    "id": "rev_post_29_3",
    "post_id": "post_29",
    "reviewer_id": "user_4",
    "created_at": "2026-05-11T19:48:03.226Z",
    "comment": "Love the stylized approach. The limited color palette works incredibly well. The textures look a bit tiling/repetitive in the background. Love the stylized approach. The limited color palette works incredibly well.",
    "composition": 4,
    "detail": 3,
    "aesthetics": 3
  },
  {
    "id": "rev_post_29_4",
    "post_id": "post_29",
    "reviewer_id": "user_1",
    "created_at": "2026-05-20T22:20:30.574Z",
    "comment": "The lighting here is phenomenal. The soft rim light really separates the subject from the background. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic. The lighting here is phenomenal. The soft rim light really separates the subject from the background.",
    "composition": 5,
    "detail": 4,
    "aesthetics": 3
  },
  {
    "id": "rev_post_29_5",
    "post_id": "post_29",
    "reviewer_name": "Harmonic Craftsman",
    "device_id": "c478f1ef-2895-428c-b451-98822df6534f",
    "created_at": "2026-05-07T20:30:22.313Z",
    "comment": "The lighting here is phenomenal. The soft rim light really separates the subject from the background. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic. The anatomy feels a bit off, particularly around the shoulders and neck.",
    "composition": 5,
    "detail": 5,
    "aesthetics": 2
  },
  {
    "id": "rev_post_29_6",
    "post_id": "post_29",
    "reviewer_name": "Harmonic Artisan",
    "device_id": "4c0968c8-65b2-42aa-a32f-c6d848bd3fef",
    "created_at": "2026-05-03T14:54:56.759Z",
    "comment": "The rendering quality is top-notch. Very clean and noise-free. The rendering quality is top-notch. Very clean and noise-free. The sense of depth and perspective is masterful.",
    "composition": 5,
    "detail": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_29_7",
    "post_id": "post_29",
    "reviewer_name": "Subtle Maker",
    "device_id": "64374cc3-224b-455e-8bd1-992517299113",
    "created_at": "2026-05-12T13:30:47.768Z",
    "comment": "The perspective on the background buildings doesn't quite align with the foreground. The sense of depth and perspective is masterful. Incredible attention to detail in the textures. The brushed metal looks totally photorealistic.",
    "composition": 3,
    "detail": 5,
    "aesthetics": 5
  },
  {
    "id": "rev_post_29_8",
    "post_id": "post_29",
    "reviewer_name": "Creative Nomad",
    "device_id": "6a386872-b36a-4210-865e-6a7cc5eefe82",
    "created_at": "2026-05-15T14:20:31.521Z",
    "comment": "Really expressive character design. You can feel the emotion. Love the stylized approach. The limited color palette works incredibly well. The rendering quality is top-notch. Very clean and noise-free.",
    "composition": 3,
    "detail": 3,
    "aesthetics": 5
  },
  {
    "id": "rev_post_29_9",
    "post_id": "post_29",
    "reviewer_name": "Dynamic Guru",
    "device_id": "8dedb405-ab91-4a9d-8ea5-061237f20f43",
    "created_at": "2026-04-30T06:16:27.624Z",
    "comment": "The colors feel a bit muddy and desaturated. It lacks pop. Really expressive character design. You can feel the emotion. The rendering quality is top-notch. Very clean and noise-free.",
    "composition": 3,
    "detail": 4,
    "aesthetics": 3
  }
];

export const MOCK_REVIEWS: Review[] = RAW_MOCK_REVIEWS.filter(review => {
  const post = MOCK_POSTS.find(p => p.id === review.post_id);
  return !post || review.reviewer_id !== post.avatar_id;
});

// --- MOCK BADGES (Historical & Active Store) ---
export const MOCK_BADGES: Badge[] = [
  // Previous Top Rated (Old, might be low ranked now, >7 days)
  {
    post_id: 'post_8',
    badge_type: 'top_rated_previous',
    awarded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString()
  },
  {
    post_id: 'post_10',
    badge_type: 'top_rated_previous',
    awarded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString()
  },
  {
    post_id: 'post_9',
    badge_type: 'top_rated_previous',
    awarded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString()
  },
  {
    post_id: 'post_19',
    badge_type: 'top_rated_previous',
    awarded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString()
  }
];


/**
 * SIMULATED RELATIONSHIP HELPERS
 * In production, these would be Supabase API calls or SQL queries.
 */

// Simulated async delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Simulates: SELECT * FROM reviews WHERE post_id = {postId}
 */
export async function getReviewsByPostId(postId: string): Promise<Review[]> {
  await delay(100);
  return MOCK_REVIEWS.filter(review => review.post_id === postId);
}

/**
 * Calculates metrics for a post based on its reviews.
 * This satisfies the requirements for normalized relational access.
 */
export async function calculatePostMetrics(postId: string, additionalReviews?: Review[]): Promise<PostMetrics> {
  const reviews = [...(await getReviewsByPostId(postId)), ...(additionalReviews || [])];

  const reviewCount = reviews.length;
  if (reviewCount === 0) {
    return {
      post_id: postId,
      average_score: 0,
      review_count: 0,
      rating_unlocked: false
    };
  }

  const post = MOCK_POSTS.find(p => p.id === postId);
  const modeConfig = getReviewMode(post?.category);
  const criteriaKeys = modeConfig.criteria.map(c => c.dbKey as keyof Review);

  const totalSum = reviews.reduce((acc, review) => {
    let sum = 0;
    let count = 0;
    for (const key of criteriaKeys) {
      if (typeof review[key] === 'number' && review[key] > 0) {
        sum += review[key] as number;
        count++;
      }
    }
    const avg = count > 0 ? sum / count : 0;
    return acc + avg;
  }, 0);

  return {
    post_id: postId,
    average_score: Number((totalSum / reviewCount).toFixed(1)),
    review_count: reviewCount,
    rating_unlocked: reviewCount >= 3
  };
}

/**
 * Simulation for logged-in user context.
 */
export function getReviewerDisplayName(review: Review): string {
  if (review.reviewer_id) {
    const avatar = MOCK_AVATARS[review.reviewer_id];
    if (avatar) return avatar.name;

    // Check localStorage for dynamically created session avatars or mock overrides
    if (typeof window !== 'undefined') {
      try {
        const savedSession = localStorage.getItem('rater_session_avatars');
        if (savedSession) {
          const sessionAvatars = JSON.parse(savedSession);
          if (sessionAvatars[review.reviewer_id]) {
            return sessionAvatars[review.reviewer_id].name;
          }
        }
        const savedOverrides = localStorage.getItem('rater_mock_overrides');
        if (savedOverrides) {
          const mockOverrides = JSON.parse(savedOverrides);
          if (mockOverrides[review.reviewer_id]) {
            return mockOverrides[review.reviewer_id].name;
          }
        }
      } catch (e) {
        console.error("Error reading reviewer name from storage:", e);
      }
    }
    return 'Unknown Avatar';
  }
  return review.reviewer_name || 'Anonymous';
}

/**
 * SIMULATED DB MUTATIONS
 */

export async function updatePost(postId: string, updates: Partial<Post>): Promise<Post> {
  await delay(800);
  console.log(`[DB] Updating post ${postId}`, updates);
  // In a real app, this would be a PATCH request
  return { id: postId, ...updates } as Post;
}

export async function deletePost(postId: string): Promise<boolean> {
  await delay(1000);
  console.log(`[DB] Deleting post ${postId} (Soft Delete Simulation)`);
  return true;
}

export async function hardDeletePost(postId: string): Promise<boolean> {
  await delay(1500);
  console.log(`[DB] HARD Deleting post ${postId} and cascading relations`);
  return true;
}
