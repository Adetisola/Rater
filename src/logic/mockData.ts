export type Category = 
  | 'Web Design' 
  | 'Mobile App Design' 
  | 'Brand Identity Design' 
  | 'Logo Design' 
  | 'Poster Design' 
  | 'Flyer Design' 
  | 'Social Media Design' 
  | 'AI Image' 
  | '3D Design'
  | 'Packaging Design'
  | 'Banner Design'
  | 'Ad Creative Design'
  | 'Illustration'
  | 'Icon Design'
  | 'Typography Design'
  | 'UI Design'
  | 'Landing Page Design'
  | 'Dashboard Design';

export interface Avatar {
  id: string;
  username: string;                  // UNIQUE public handle (URL slug)
  name: string;                      // Display name (flexible)
  role: string;                      // public-facing identity label
  avatar_url?: string;
  bg_color: string;
  bio?: string;
  is_blocked: boolean;
  passkey: string;
  created_at: string;
  // Username history — for old-URL redirects and Supabase migration
  usernameLastChangedAt?: number;    // Unix ms timestamp of last username change
  previousUsernames?: string[];      // Ordered list of past usernames (oldest first)
  // Smart Bio Links — structured social platform links
  social_links?: {
    type: 'instagram' | 'twitter' | 'youtube' | 'behance' | 'dribbble' | 'linktree' | 'github' | 'pinterest' | 'facebook';
    url: string;
    username?: string;
  }[];
}

export interface Review {
  id: string;
  post_id: string;
  reviewer_id?: string; 
  reviewer_name?: string; 
  device_id?: string;
  clarity: number;
  purpose: number;
  aesthetics: number;
  comment?: string;
  created_at: string;
  updated_at?: string;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  category: Category;
  image_url: string;
  avatar_id: string;
  is_deleted?: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface PostMetrics {
  post_id: string;
  average_score: number;
  review_count: number;
  rating_unlocked: boolean;
}

export type BadgeType = 'top_rated_active' | 'top_rated_previous';

export interface Badge {
  post_id: string;
  badge_type: BadgeType;
  awarded_at: string;
}

// --- MOCK DATABASE ---

export const CATEGORIES: Category[] = [
  'Web Design', 
  'Mobile App Design', 
  'Brand Identity Design', 
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
    id: 'post_1',
    title: 'Modern E-commerce Web',
    description: 'A clean, minimalist approach to online shopping interactions with simplified checkout flows.',
    category: 'Web Design',
    image_url: 'https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: 'post_8',
    title: 'Portfolio Website',
    description: 'Personal portfolio design highlighting creative works and resume.',
    category: 'Web Design',
    image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_5',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    id: 'post_11',
    title: 'SaaS Dashboard UI',
    description: 'Analytics dashboard design for a B2B software platform with real-time data visualization.',
    category: 'Web Design',
    image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 'post_12',
    title: 'Restaurant Landing Page',
    description: 'Elegant one-page website for an upscale dining experience with menu integration.',
    category: 'Web Design',
    image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
  {
    id: 'post_4',
    title: 'Finance App UI',
    description: 'Mobile banking application interface focused on accessibility and data visualization.',
    category: 'Mobile App Design',
    image_url: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: 'post_10',
    title: 'Meditation App',
    description: 'Calming user interface design for a daily meditation and mindfulness app.',
    category: 'Mobile App Design',
    image_url: 'https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
  },
  {
    id: 'post_13',
    title: 'Fitness Tracker App',
    description: 'Health and workout tracking interface with goal setting and progress charts.',
    category: 'Mobile App Design',
    image_url: 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: 'post_14',
    title: 'Food Delivery App',
    description: 'Streamlined ordering experience with restaurant discovery and live tracking.',
    category: 'Mobile App Design',
    image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_4',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: 'post_2',
    title: 'Coffee Brand Identity',
    description: 'Rebranding for a local coffee shop focusing on organic themes and warm earth tones.',
    category: 'Brand Identity Design',
    image_url: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'post_9',
    title: 'Eco Juice Packaging',
    description: 'Sustainable packaging concept for organic cold-pressed juices.',
    category: 'Brand Identity Design',
    image_url: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
  {
    id: 'post_15',
    title: 'Luxury Watch Branding',
    description: 'Premium brand identity for a Swiss-inspired watch manufacturer.',
    category: 'Brand Identity Design',
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 'post_16',
    title: 'Bakery Visual Identity',
    description: 'Warm and inviting brand system for an artisan bakery chain.',
    category: 'Brand Identity Design',
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
  },
  {
    id: 'post_6',
    title: 'Tech Startup Logo',
    description: 'Minimalist geometric logo concept for an AI technology startup.',
    category: 'Logo Design',
    image_url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 'post_17',
    title: 'Creative Agency Logo',
    description: 'Dynamic and playful logomark for a digital creative studio.',
    category: 'Logo Design',
    image_url: 'https://images.unsplash.com/photo-1626785774625-ddcddc3445e9?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'post_18',
    title: 'Eco Foundation Logo',
    description: 'Nature-inspired symbol for an environmental nonprofit organization.',
    category: 'Logo Design',
    image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: 'post_19',
    title: 'Podcast Network Logo',
    description: 'Audio waveform-inspired logo for a podcast production company.',
    category: 'Logo Design',
    image_url: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString(),
  },
  {
    id: 'post_3',
    title: 'Neon Poster Series',
    description: 'Exploration of cyberpunk aesthetics in poster format using vibrant neon gradients.',
    category: 'Poster Design',
    image_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 'post_20',
    title: 'Jazz Festival Poster',
    description: 'Retro-inspired concert poster with bold typography and saxphone illustration.',
    category: 'Poster Design',
    image_url: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'post_21',
    title: 'Movie Premiere Poster',
    description: 'Cinematic key art design for an indie film premiere.',
    category: 'Poster Design',
    image_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
  },
  {
    id: 'post_22',
    title: 'Art Exhibition Poster',
    description: 'Abstract geometric design for a contemporary art gallery opening.',
    category: 'Poster Design',
    image_url: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13).toISOString(),
  },
  {
    id: 'post_5',
    title: 'Summer Event Flyer',
    description: 'Bright and energetic flyer design for a summer music festival.',
    category: 'Flyer Design',
    image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'post_23',
    title: 'Charity Gala Flyer',
    description: 'Elegant invitation design for a black-tie fundraising event.',
    category: 'Flyer Design',
    image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: 'post_24',
    title: 'Gym Promotion Flyer',
    description: 'High-energy fitness center promotional material with bold call-to-action.',
    category: 'Flyer Design',
    image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: 'post_25',
    title: 'Food Truck Menu Flyer',
    description: 'Vibrant street food menu design with mouth-watering photography.',
    category: 'Flyer Design',
    image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  },
  {
    id: 'post_7',
    title: 'Instagram Post Pack',
    description: 'Cohesive social media template system for a lifestyle influencer.',
    category: 'Social Media Design',
    image_url: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: 'post_26',
    title: 'LinkedIn Header Design',
    description: 'Professional banner design for corporate personal branding.',
    category: 'Social Media Design',
    image_url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    id: 'post_27',
    title: 'YouTube Thumbnail Kit',
    description: 'High-visibility thumbnail designs for a tech review channel.',
    category: 'Social Media Design',
    image_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
  },
  {
    id: 'post_28',
    title: 'Twitter Thread Graphics',
    description: 'Eye-catching carousel designs for educational Twitter threads.',
    category: 'Social Media Design',
    image_url: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
  },
  {
    id: 'post_29',
    title: 'Cyberpunk Cityscape',
    description: 'AI-generated hyper-realistic futuristic city at night.',
    category: 'AI Image',
    image_url: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'post_30',
    title: 'Surreal Portrait',
    description: 'AI-assisted artistic portrait exploring abstract identity.',
    category: 'AI Image',
    image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: 'post_31',
    title: 'Nature Synthesis',
    description: 'AI exploration of bioluminescent flora in a deep forest.',
    category: 'AI Image',
    image_url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'post_32',
    title: 'Vaporwave Dreams',
    description: 'AI-generated retro-aesthetic landscape with soft neon lighting.',
    category: 'AI Image',
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 'post_33',
    title: 'Floating Island 3D',
    description: 'Low-poly 3D environment for a stylized adventure game.',
    category: '3D Design',
    image_url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  },
  {
    id: 'post_34',
    title: 'Mechanical Watch 3D',
    description: 'Detailed 3D model of a complex mechanical watch movement.',
    category: '3D Design',
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
  },
  {
    id: 'post_35',
    title: 'Character Concept 3D',
    description: 'Sculpted 3D character design for a fantasy RPG.',
    category: '3D Design',
    image_url: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'post_36',
    title: 'Abstract Sculpture 3D',
    description: 'Procedural 3D sculpture exploring form and light interaction.',
    category: '3D Design',
    image_url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=800',
    avatar_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
  },
];

// --- MOCK REVIEWS ---
export const MOCK_REVIEWS: Review[] = [
  {
    id: 'r1',
    post_id: 'post_1',
    reviewer_id: 'user_5',
    clarity: 4.5,
    purpose: 4.5,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.01).toISOString()
  },
  {
    id: 'r2',
    post_id: 'post_1',
    reviewer_id: 'user_4',
    clarity: 4.5,
    purpose: 4.5,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.01).toISOString()
  },
  {
    id: 'r3',
    post_id: 'post_1',
    reviewer_id: 'user_3',
    clarity: 5,
    purpose: 4.5,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.04).toISOString()
  },
  {
    id: 'r4',
    post_id: 'post_1',
    reviewer_id: 'user_1',
    clarity: 5,
    purpose: 5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.06).toISOString()
  },
  {
    id: 'r5',
    post_id: 'post_1',
    reviewer_id: 'user_2',
    clarity: 4.5,
    purpose: 5,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.06).toISOString()
  },
  {
    id: 'r6',
    post_id: 'post_1',
    device_id: 'device_0l21995',
    reviewer_name: 'Guest 545',
    clarity: 5,
    purpose: 5,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.08).toISOString()
  },
  {
    id: 'r7',
    post_id: 'post_1',
    device_id: 'device_xjc9ibg',
    reviewer_name: 'Guest 240',
    clarity: 4.5,
    purpose: 5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.06).toISOString()
  },
  {
    id: 'r8',
    post_id: 'post_1',
    device_id: 'device_evjz5c5',
    clarity: 4.5,
    purpose: 4.5,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.03).toISOString()
  },
  {
    id: 'r9',
    post_id: 'post_1',
    device_id: 'device_f7ikgdr',
    clarity: 4.5,
    purpose: 4.5,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.05).toISOString()
  },
  {
    id: 'r10',
    post_id: 'post_1',
    device_id: 'device_bv8nwxb',
    clarity: 5,
    purpose: 4.5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.06).toISOString()
  },
  {
    id: 'r11',
    post_id: 'post_1',
    device_id: 'device_89tyw73',
    clarity: 4.5,
    purpose: 5,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.03).toISOString()
  },
  {
    id: 'r12',
    post_id: 'post_1',
    device_id: 'device_fulu6rm',
    reviewer_name: 'Guest 269',
    clarity: 5,
    purpose: 4.5,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.01).toISOString()
  },
  {
    id: 'r13',
    post_id: 'post_11',
    reviewer_id: 'user_5',
    clarity: 4,
    purpose: 5,
    aesthetics: 4,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.82).toISOString()
  },
  {
    id: 'r14',
    post_id: 'post_11',
    reviewer_id: 'user_4',
    clarity: 5,
    purpose: 4.5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.68).toISOString()
  },
  {
    id: 'r15',
    post_id: 'post_11',
    reviewer_id: 'user_2',
    clarity: 4.5,
    purpose: 4.5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.67).toISOString()
  },
  {
    id: 'r16',
    post_id: 'post_11',
    reviewer_id: 'user_3',
    clarity: 4,
    purpose: 5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.90).toISOString()
  },
  {
    id: 'r17',
    post_id: 'post_11',
    reviewer_id: 'user_1',
    clarity: 4,
    purpose: 4.5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.00).toISOString()
  },
  {
    id: 'r18',
    post_id: 'post_11',
    device_id: 'device_x2dtn7x',
    reviewer_name: 'Guest 323',
    clarity: 4,
    purpose: 4.5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.90).toISOString()
  },
  {
    id: 'r19',
    post_id: 'post_11',
    device_id: 'device_5qf9256',
    clarity: 5,
    purpose: 4.5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.70).toISOString()
  },
  {
    id: 'r20',
    post_id: 'post_11',
    device_id: 'device_fvoivxg',
    reviewer_name: 'Guest 850',
    clarity: 5,
    purpose: 4,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.66).toISOString()
  },
  {
    id: 'r21',
    post_id: 'post_11',
    device_id: 'device_ww4t8v4',
    reviewer_name: 'Guest 645',
    clarity: 4,
    purpose: 5,
    aesthetics: 4,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.03).toISOString()
  },
  {
    id: 'r22',
    post_id: 'post_11',
    device_id: 'device_g0vwoj3',
    reviewer_name: 'Guest 987',
    clarity: 4.5,
    purpose: 5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.31).toISOString()
  },
  {
    id: 'r23',
    post_id: 'post_6',
    reviewer_id: 'user_2',
    clarity: 4.5,
    purpose: 5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.11).toISOString()
  },
  {
    id: 'r24',
    post_id: 'post_6',
    reviewer_id: 'user_5',
    clarity: 4.5,
    purpose: 4.5,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.65).toISOString()
  },
  {
    id: 'r25',
    post_id: 'post_6',
    reviewer_id: 'user_1',
    clarity: 4.5,
    purpose: 5,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2.47).toISOString()
  },
  {
    id: 'r26',
    post_id: 'post_6',
    reviewer_id: 'user_4',
    clarity: 4.5,
    purpose: 4.5,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.63).toISOString()
  },
  {
    id: 'r27',
    post_id: 'post_6',
    reviewer_id: 'user_3',
    clarity: 5,
    purpose: 5,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.41).toISOString()
  },
  {
    id: 'r28',
    post_id: 'post_6',
    device_id: 'device_s0ne0z5',
    reviewer_name: 'Guest 181',
    clarity: 4.5,
    purpose: 4.5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.88).toISOString()
  },
  {
    id: 'r29',
    post_id: 'post_6',
    device_id: 'device_zy5pel6',
    clarity: 5,
    purpose: 4.5,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2.21).toISOString()
  },
  {
    id: 'r30',
    post_id: 'post_6',
    device_id: 'device_lhhrzid',
    clarity: 4.5,
    purpose: 4.5,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.31).toISOString()
  },
  {
    id: 'r31',
    post_id: 'post_19',
    reviewer_id: 'user_1',
    clarity: 4.5,
    purpose: 4.5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7.02).toISOString()
  },
  {
    id: 'r32',
    post_id: 'post_19',
    reviewer_id: 'user_5',
    clarity: 4.5,
    purpose: 5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6.05).toISOString()
  },
  {
    id: 'r33',
    post_id: 'post_19',
    reviewer_id: 'user_4',
    clarity: 4.5,
    purpose: 4.5,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8.79).toISOString()
  },
  {
    id: 'r34',
    post_id: 'post_19',
    reviewer_id: 'user_3',
    clarity: 5,
    purpose: 4.5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9.22).toISOString()
  },
  {
    id: 'r35',
    post_id: 'post_19',
    reviewer_id: 'user_2',
    clarity: 5,
    purpose: 5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8.81).toISOString()
  },
  {
    id: 'r36',
    post_id: 'post_19',
    device_id: 'device_idrn4ul',
    reviewer_name: 'Guest 158',
    clarity: 5,
    purpose: 5,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7.22).toISOString()
  },
  {
    id: 'r37',
    post_id: 'post_19',
    device_id: 'device_28w88oe',
    reviewer_name: 'Guest 139',
    clarity: 4.5,
    purpose: 5,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6.81).toISOString()
  },
  {
    id: 'r38',
    post_id: 'post_19',
    device_id: 'device_rvgy9ge',
    clarity: 5,
    purpose: 5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9.34).toISOString()
  },
  {
    id: 'r39',
    post_id: 'post_19',
    device_id: 'device_lhy9z9p',
    reviewer_name: 'Guest 578',
    clarity: 4.5,
    purpose: 4.5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8.17).toISOString()
  },
  {
    id: 'r40',
    post_id: 'post_19',
    device_id: 'device_wdzyf8f',
    reviewer_name: 'Guest 292',
    clarity: 4.5,
    purpose: 5,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6.57).toISOString()
  },
  {
    id: 'r41',
    post_id: 'post_19',
    device_id: 'device_fc3nzu0',
    clarity: 5,
    purpose: 5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7.40).toISOString()
  },
  {
    id: 'r42',
    post_id: 'post_19',
    device_id: 'device_md9yo77',
    clarity: 4.5,
    purpose: 5,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5.30).toISOString()
  },
  {
    id: 'r43',
    post_id: 'post_19',
    device_id: 'device_xvmze4w',
    clarity: 4.5,
    purpose: 5,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6.46).toISOString()
  },
  {
    id: 'r44',
    post_id: 'post_19',
    device_id: 'device_b7a5mfa',
    clarity: 5,
    purpose: 4.5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8.66).toISOString()
  },
  {
    id: 'r45',
    post_id: 'post_3',
    reviewer_id: 'user_1',
    clarity: 4.5,
    purpose: 5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2.19).toISOString()
  },
  {
    id: 'r46',
    post_id: 'post_3',
    reviewer_id: 'user_2',
    clarity: 5,
    purpose: 4.5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3.00).toISOString()
  },
  {
    id: 'r47',
    post_id: 'post_3',
    reviewer_id: 'user_5',
    clarity: 4.5,
    purpose: 5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2.57).toISOString()
  },
  {
    id: 'r48',
    post_id: 'post_3',
    reviewer_id: 'user_4',
    clarity: 5,
    purpose: 4.5,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3.09).toISOString()
  },
  {
    id: 'r49',
    post_id: 'post_3',
    reviewer_id: 'user_3',
    clarity: 5,
    purpose: 4.5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2.74).toISOString()
  },
  {
    id: 'r50',
    post_id: 'post_3',
    device_id: 'device_vduklf2',
    clarity: 4.5,
    purpose: 4.5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2.42).toISOString()
  },
  {
    id: 'r51',
    post_id: 'post_3',
    device_id: 'device_t5l2k2j',
    reviewer_name: 'Guest 433',
    clarity: 4.5,
    purpose: 4.5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2.85).toISOString()
  },
  {
    id: 'r52',
    post_id: 'post_8',
    reviewer_id: 'user_1',
    clarity: 3,
    purpose: 4,
    aesthetics: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3.85).toISOString()
  },
  {
    id: 'r53',
    post_id: 'post_8',
    reviewer_id: 'user_5',
    clarity: 3,
    purpose: 3.5,
    aesthetics: 2.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8.44).toISOString()
  },
  {
    id: 'r54',
    post_id: 'post_8',
    reviewer_id: 'user_4',
    clarity: 3.5,
    purpose: 3.5,
    aesthetics: 2.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3.60).toISOString()
  },
  {
    id: 'r55',
    post_id: 'post_8',
    reviewer_id: 'user_2',
    clarity: 3.5,
    purpose: 4,
    aesthetics: 3.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3.86).toISOString()
  },
  {
    id: 'r56',
    post_id: 'post_8',
    reviewer_id: 'user_3',
    clarity: 3.5,
    purpose: 4,
    aesthetics: 3.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8.32).toISOString()
  },
  {
    id: 'r57',
    post_id: 'post_8',
    device_id: 'device_czbnx0e',
    clarity: 4,
    purpose: 3.5,
    aesthetics: 2.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7.19).toISOString()
  },
  {
    id: 'r58',
    post_id: 'post_8',
    device_id: 'device_0neuk7u',
    clarity: 3,
    purpose: 3,
    aesthetics: 3.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2.71).toISOString()
  },
  {
    id: 'r59',
    post_id: 'post_8',
    device_id: 'device_8xo5pvx',
    reviewer_name: 'Guest 308',
    clarity: 3.5,
    purpose: 4,
    aesthetics: 4,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7.37).toISOString()
  },
  {
    id: 'r60',
    post_id: 'post_8',
    device_id: 'device_hkkx4yp',
    reviewer_name: 'Guest 709',
    clarity: 3,
    purpose: 3.5,
    aesthetics: 3.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6.60).toISOString()
  },
  {
    id: 'r61',
    post_id: 'post_8',
    device_id: 'device_b7nchjk',
    reviewer_name: 'Guest 359',
    clarity: 3,
    purpose: 4,
    aesthetics: 2.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4.91).toISOString()
  },
  {
    id: 'r62',
    post_id: 'post_8',
    device_id: 'device_l76vdcz',
    reviewer_name: 'Guest 891',
    clarity: 3,
    purpose: 4,
    aesthetics: 4,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6.19).toISOString()
  },
  {
    id: 'r63',
    post_id: 'post_8',
    device_id: 'device_uug2wf7',
    reviewer_name: 'Guest 577',
    clarity: 3,
    purpose: 3.5,
    aesthetics: 3.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5.90).toISOString()
  },
  {
    id: 'r64',
    post_id: 'post_8',
    device_id: 'device_oapmpoa',
    clarity: 2.5,
    purpose: 4,
    aesthetics: 2.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4.07).toISOString()
  },
  {
    id: 'r65',
    post_id: 'post_8',
    device_id: 'device_5bl9qhn',
    clarity: 2.5,
    purpose: 3.5,
    aesthetics: 4,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6.78).toISOString()
  },
  {
    id: 'r66',
    post_id: 'post_8',
    device_id: 'device_zr6w8f0',
    clarity: 3.5,
    purpose: 4,
    aesthetics: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5.12).toISOString()
  },
  {
    id: 'r67',
    post_id: 'post_8',
    device_id: 'device_lw9mvi0',
    clarity: 3.5,
    purpose: 4,
    aesthetics: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4.19).toISOString()
  },
  {
    id: 'r68',
    post_id: 'post_8',
    device_id: 'device_c0vfstz',
    clarity: 3.5,
    purpose: 4,
    aesthetics: 4,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8.32).toISOString()
  },
  {
    id: 'r69',
    post_id: 'post_8',
    device_id: 'device_74l23dv',
    reviewer_name: 'Guest 436',
    clarity: 3,
    purpose: 3,
    aesthetics: 3.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2.40).toISOString()
  },
  {
    id: 'r70',
    post_id: 'post_13',
    reviewer_id: 'user_2',
    clarity: 3,
    purpose: 4.5,
    aesthetics: 4,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.08).toISOString()
  },
  {
    id: 'r71',
    post_id: 'post_13',
    reviewer_id: 'user_5',
    clarity: 3,
    purpose: 3,
    aesthetics: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.19).toISOString()
  },
  {
    id: 'r72',
    post_id: 'post_13',
    reviewer_id: 'user_1',
    clarity: 3,
    purpose: 3.5,
    aesthetics: 4,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.12).toISOString()
  },
  {
    id: 'r73',
    post_id: 'post_13',
    reviewer_id: 'user_3',
    clarity: 3.5,
    purpose: 3.5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.15).toISOString()
  },
  {
    id: 'r74',
    post_id: 'post_13',
    reviewer_id: 'user_4',
    clarity: 4,
    purpose: 4,
    aesthetics: 3.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.06).toISOString()
  },
  {
    id: 'r75',
    post_id: 'post_13',
    device_id: 'device_eoyoni2',
    reviewer_name: 'Guest 546',
    clarity: 4,
    purpose: 4.5,
    aesthetics: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.10).toISOString()
  },
  {
    id: 'r76',
    post_id: 'post_13',
    device_id: 'device_jboz303',
    clarity: 3.5,
    purpose: 4.5,
    aesthetics: 4,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.19).toISOString()
  },
  {
    id: 'r77',
    post_id: 'post_13',
    device_id: 'device_x2qeorg',
    clarity: 4.5,
    purpose: 3.5,
    aesthetics: 3.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.07).toISOString()
  },
  {
    id: 'r78',
    post_id: 'post_13',
    device_id: 'device_tvmvvsr',
    clarity: 3,
    purpose: 3.5,
    aesthetics: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.09).toISOString()
  },
  {
    id: 'r79',
    post_id: 'post_13',
    device_id: 'device_7gwnxz1',
    reviewer_name: 'Guest 92',
    clarity: 4,
    purpose: 3.5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.09).toISOString()
  },
  {
    id: 'r80',
    post_id: 'post_13',
    device_id: 'device_zw0817t',
    reviewer_name: 'Guest 153',
    clarity: 4,
    purpose: 4.5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.15).toISOString()
  },
  {
    id: 'r81',
    post_id: 'post_13',
    device_id: 'device_fuo714g',
    reviewer_name: 'Guest 745',
    clarity: 3.5,
    purpose: 3.5,
    aesthetics: 3.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.03).toISOString()
  },
  {
    id: 'r82',
    post_id: 'post_17',
    reviewer_id: 'user_4',
    clarity: 3.5,
    purpose: 4,
    aesthetics: 3.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.18).toISOString()
  },
  {
    id: 'r83',
    post_id: 'post_17',
    reviewer_id: 'user_5',
    clarity: 3.5,
    purpose: 4,
    aesthetics: 4,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.31).toISOString()
  },
  {
    id: 'r84',
    post_id: 'post_17',
    reviewer_id: 'user_3',
    clarity: 3,
    purpose: 3.5,
    aesthetics: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.14).toISOString()
  },
  {
    id: 'r85',
    post_id: 'post_17',
    reviewer_id: 'user_2',
    clarity: 3.5,
    purpose: 2.5,
    aesthetics: 3.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.06).toISOString()
  },
  {
    id: 'r86',
    post_id: 'post_17',
    reviewer_id: 'user_1',
    clarity: 2.5,
    purpose: 3.5,
    aesthetics: 3.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.23).toISOString()
  },
  {
    id: 'r87',
    post_id: 'post_17',
    device_id: 'device_jevjj6i',
    clarity: 3,
    purpose: 3,
    aesthetics: 4,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.08).toISOString()
  },
  {
    id: 'r88',
    post_id: 'post_17',
    device_id: 'device_2olkrbb',
    reviewer_name: 'Guest 332',
    clarity: 3,
    purpose: 3.5,
    aesthetics: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.23).toISOString()
  },
  {
    id: 'r89',
    post_id: 'post_17',
    device_id: 'device_vzi5g7r',
    reviewer_name: 'Guest 334',
    clarity: 3.5,
    purpose: 3.5,
    aesthetics: 2.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.28).toISOString()
  },
  {
    id: 'r90',
    post_id: 'post_17',
    device_id: 'device_evhkpe9',
    clarity: 3.5,
    purpose: 2.5,
    aesthetics: 2.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.14).toISOString()
  },
  {
    id: 'r91',
    post_id: 'post_17',
    device_id: 'device_fh7xxrk',
    clarity: 4,
    purpose: 3,
    aesthetics: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.10).toISOString()
  },
  {
    id: 'r92',
    post_id: 'post_17',
    device_id: 'device_o4xqbu4',
    reviewer_name: 'Guest 874',
    clarity: 3.5,
    purpose: 3.5,
    aesthetics: 3.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.08).toISOString()
  },
  {
    id: 'r93',
    post_id: 'post_17',
    device_id: 'device_j30cu57',
    clarity: 2.5,
    purpose: 3,
    aesthetics: 3.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.13).toISOString()
  },
  {
    id: 'r94',
    post_id: 'post_17',
    device_id: 'device_akgd9os',
    clarity: 3.5,
    purpose: 2.5,
    aesthetics: 3.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.14).toISOString()
  },
  {
    id: 'r95',
    post_id: 'post_17',
    device_id: 'device_4zbyp29',
    clarity: 3,
    purpose: 3,
    aesthetics: 3.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.33).toISOString()
  },
  {
    id: 'r96',
    post_id: 'post_17',
    device_id: 'device_guyknju',
    reviewer_name: 'Guest 107',
    clarity: 3,
    purpose: 4,
    aesthetics: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.25).toISOString()
  },
  {
    id: 'r97',
    post_id: 'post_17',
    device_id: 'device_mk75opg',
    reviewer_name: 'Guest 878',
    clarity: 3.5,
    purpose: 2.5,
    aesthetics: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.29).toISOString()
  },
  {
    id: 'r98',
    post_id: 'post_17',
    device_id: 'device_14z82b7',
    reviewer_name: 'Guest 233',
    clarity: 3.5,
    purpose: 3,
    aesthetics: 4,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.38).toISOString()
  },
  {
    id: 'r99',
    post_id: 'post_17',
    device_id: 'device_3tts868',
    reviewer_name: 'Guest 214',
    clarity: 2.5,
    purpose: 3,
    aesthetics: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.15).toISOString()
  },
  {
    id: 'r100',
    post_id: 'post_17',
    device_id: 'device_pda8qsv',
    clarity: 2.5,
    purpose: 4,
    aesthetics: 4,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.30).toISOString()
  },
  {
    id: 'r101',
    post_id: 'post_17',
    device_id: 'device_i1rer6x',
    clarity: 2.5,
    purpose: 3,
    aesthetics: 4,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.35).toISOString()
  },
  {
    id: 'r102',
    post_id: 'post_10',
    reviewer_id: 'user_1',
    clarity: 5,
    purpose: 5,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10.38).toISOString()
  },
  {
    id: 'r103',
    post_id: 'post_10',
    reviewer_id: 'user_2',
    clarity: 5,
    purpose: 5,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 19.00).toISOString()
  },
  {
    id: 'r104',
    post_id: 'post_14',
    reviewer_id: 'user_3',
    clarity: 5,
    purpose: 5,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2.89).toISOString()
  },
  {
    id: 'r105',
    post_id: 'post_22',
    reviewer_id: 'user_2',
    clarity: 5,
    purpose: 5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10.73).toISOString()
  },
  {
    id: 'r106',
    post_id: 'post_22',
    reviewer_id: 'user_3',
    clarity: 5,
    purpose: 5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10.71).toISOString()
  },
  {
    id: 'r107',
    post_id: 'post_12',
    reviewer_id: 'user_1',
    clarity: 4,
    purpose: 4,
    aesthetics: 3.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3.65).toISOString()
  },
  {
    id: 'r108',
    post_id: 'post_12',
    reviewer_id: 'user_4',
    clarity: 4.5,
    purpose: 3.5,
    aesthetics: 4,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3.09).toISOString()
  },
  {
    id: 'r109',
    post_id: 'post_12',
    reviewer_id: 'user_5',
    clarity: 3.5,
    purpose: 3.5,
    aesthetics: 3.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2.05).toISOString()
  },
  {
    id: 'r110',
    post_id: 'post_12',
    reviewer_id: 'user_3',
    clarity: 3.5,
    purpose: 4.5,
    aesthetics: 4,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2.23).toISOString()
  },
  {
    id: 'r111',
    post_id: 'post_2',
    reviewer_id: 'user_1',
    clarity: 4.5,
    purpose: 4.5,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.01).toISOString()
  },
  {
    id: 'r112',
    post_id: 'post_2',
    reviewer_id: 'user_2',
    clarity: 4.5,
    purpose: 5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.00).toISOString()
  },
  {
    id: 'r113',
    post_id: 'post_2',
    reviewer_id: 'user_4',
    clarity: 4.5,
    purpose: 4.5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.02).toISOString()
  },
  {
    id: 'r114',
    post_id: 'post_15',
    reviewer_id: 'user_2',
    clarity: 4.5,
    purpose: 4.5,
    aesthetics: 4.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.50).toISOString()
  },
  {
    id: 'r115',
    post_id: 'post_15',
    reviewer_id: 'user_3',
    clarity: 5,
    purpose: 4,
    aesthetics: 4,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3.20).toISOString()
  },
  {
    id: 'r116',
    post_id: 'post_15',
    reviewer_id: 'user_1',
    clarity: 4.5,
    purpose: 4.5,
    aesthetics: 4,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3.35).toISOString()
  },
  {
    id: 'r117',
    post_id: 'post_15',
    reviewer_id: 'user_4',
    clarity: 5,
    purpose: 4,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2.16).toISOString()
  },
  {
    id: 'r118',
    post_id: 'post_15',
    reviewer_id: 'user_5',
    clarity: 5,
    purpose: 4,
    aesthetics: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.93).toISOString()
  },
  {
    id: 'r119',
    post_id: 'post_21',
    reviewer_id: 'user_4',
    clarity: 3.5,
    purpose: 3,
    aesthetics: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4.16).toISOString()
  },
  {
    id: 'r120',
    post_id: 'post_21',
    reviewer_id: 'user_2',
    clarity: 4,
    purpose: 3,
    aesthetics: 3.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4.14).toISOString()
  },
  {
    id: 'r121',
    post_id: 'post_21',
    reviewer_id: 'user_1',
    clarity: 3.5,
    purpose: 3.5,
    aesthetics: 3.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3.61).toISOString()
  },
  {
    id: 'r122',
    post_id: 'post_4',
    reviewer_id: 'user_1',
    clarity: 2,
    purpose: 3,
    aesthetics: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.78).toISOString()
  },
  {
    id: 'r123',
    post_id: 'post_4',
    reviewer_id: 'user_3',
    clarity: 1.5,
    purpose: 2,
    aesthetics: 2.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.53).toISOString()
  },
  {
    id: 'r124',
    post_id: 'post_4',
    reviewer_id: 'user_4',
    clarity: 2.5,
    purpose: 3,
    aesthetics: 1.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.80).toISOString()
  },
  {
    id: 'r125',
    post_id: 'post_4',
    reviewer_id: 'user_5',
    clarity: 2.5,
    purpose: 3,
    aesthetics: 2.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.11).toISOString()
  },
  {
    id: 'r126',
    post_id: 'post_4',
    reviewer_id: 'user_2',
    clarity: 3,
    purpose: 2.5,
    aesthetics: 1.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.24).toISOString()
  },
  {
    id: 'r127',
    post_id: 'post_4',
    device_id: 'device_odux6su',
    reviewer_name: 'Guest 283',
    clarity: 3,
    purpose: 1.5,
    aesthetics: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.22).toISOString()
  },
  {
    id: 'r128',
    post_id: 'post_4',
    device_id: 'device_jsrslng',
    clarity: 3.5,
    purpose: 2,
    aesthetics: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.01).toISOString()
  },
  {
    id: 'r129',
    post_id: 'post_4',
    device_id: 'device_qsatubb',
    clarity: 3.5,
    purpose: 2,
    aesthetics: 3.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.37).toISOString()
  },
  {
    id: 'r130',
    post_id: 'post_4',
    device_id: 'device_umy4o30',
    clarity: 3,
    purpose: 3,
    aesthetics: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.75).toISOString()
  },
  {
    id: 'r131',
    post_id: 'post_4',
    device_id: 'device_kvs28xh',
    reviewer_name: 'Guest 413',
    clarity: 3,
    purpose: 3.5,
    aesthetics: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.39).toISOString()
  },
  {
    id: 'r132',
    post_id: 'post_4',
    device_id: 'device_x1lqth2',
    clarity: 1.5,
    purpose: 2,
    aesthetics: 2.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.71).toISOString()
  },
  {
    id: 'r133',
    post_id: 'post_4',
    device_id: 'device_uy1cymq',
    reviewer_name: 'Guest 659',
    clarity: 2.5,
    purpose: 2.5,
    aesthetics: 3.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.76).toISOString()
  },
  {
    id: 'r134',
    post_id: 'post_4',
    device_id: 'device_755t5d7',
    reviewer_name: 'Guest 500',
    clarity: 2,
    purpose: 2,
    aesthetics: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.20).toISOString()
  },
  {
    id: 'r135',
    post_id: 'post_4',
    device_id: 'device_khaucer',
    reviewer_name: 'Guest 77',
    clarity: 3.5,
    purpose: 2,
    aesthetics: 2.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.10).toISOString()
  },
  {
    id: 'r136',
    post_id: 'post_4',
    device_id: 'device_py8e6kg',
    clarity: 3,
    purpose: 3,
    aesthetics: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.64).toISOString()
  },
  {
    id: 'r137',
    post_id: 'post_4',
    device_id: 'device_81gtoqg',
    reviewer_name: 'Guest 758',
    clarity: 2,
    purpose: 2.5,
    aesthetics: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.60).toISOString()
  },
  {
    id: 'r138',
    post_id: 'post_4',
    device_id: 'device_rvls2cj',
    reviewer_name: 'Guest 362',
    clarity: 1.5,
    purpose: 3,
    aesthetics: 2.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.18).toISOString()
  },
  {
    id: 'r139',
    post_id: 'post_4',
    device_id: 'device_7mooty7',
    reviewer_name: 'Guest 931',
    clarity: 2.5,
    purpose: 3,
    aesthetics: 1.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.18).toISOString()
  },
  {
    id: 'r140',
    post_id: 'post_9',
    reviewer_id: 'user_1',
    clarity: 2.5,
    purpose: 2,
    aesthetics: 2.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5.86).toISOString()
  },
  {
    id: 'r141',
    post_id: 'post_9',
    reviewer_id: 'user_5',
    clarity: 3,
    purpose: 2,
    aesthetics: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6.98).toISOString()
  },
  {
    id: 'r142',
    post_id: 'post_9',
    reviewer_id: 'user_4',
    clarity: 2,
    purpose: 2,
    aesthetics: 1.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4.62).toISOString()
  },
  {
    id: 'r143',
    post_id: 'post_9',
    reviewer_id: 'user_3',
    clarity: 1.5,
    purpose: 2.5,
    aesthetics: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2.20).toISOString()
  },
  {
    id: 'r144',
    post_id: 'post_9',
    reviewer_id: 'user_2',
    clarity: 1.5,
    purpose: 1,
    aesthetics: 1.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7.69).toISOString()
  },
  {
    id: 'r145',
    post_id: 'post_9',
    device_id: 'device_yvdazg2',
    reviewer_name: 'Guest 790',
    clarity: 2,
    purpose: 2,
    aesthetics: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11.46).toISOString()
  },
  {
    id: 'r146',
    post_id: 'post_9',
    device_id: 'device_4ven3ll',
    reviewer_name: 'Guest 221',
    clarity: 1.5,
    purpose: 1.5,
    aesthetics: 1.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11.54).toISOString()
  },
  {
    id: 'r147',
    post_id: 'post_9',
    device_id: 'device_7aa6q4f',
    reviewer_name: 'Guest 323',
    clarity: 2.5,
    purpose: 2,
    aesthetics: 1.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6.86).toISOString()
  },
  {
    id: 'r148',
    post_id: 'post_9',
    device_id: 'device_dciqlv9',
    reviewer_name: 'Guest 354',
    clarity: 1.5,
    purpose: 3,
    aesthetics: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6.69).toISOString()
  },
  {
    id: 'r149',
    post_id: 'post_9',
    device_id: 'device_36ppaic',
    clarity: 1,
    purpose: 1,
    aesthetics: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11.59).toISOString()
  },
  {
    id: 'r150',
    post_id: 'post_9',
    device_id: 'device_5q6yart',
    reviewer_name: 'Guest 527',
    clarity: 2,
    purpose: 2,
    aesthetics: 2.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10.48).toISOString()
  },
  {
    id: 'r151',
    post_id: 'post_9',
    device_id: 'device_t2cest5',
    clarity: 3,
    purpose: 1,
    aesthetics: 2.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7.46).toISOString()
  },
  {
    id: 'r152',
    post_id: 'post_9',
    device_id: 'device_a8d5u00',
    clarity: 2,
    purpose: 1.5,
    aesthetics: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12.35).toISOString()
  },
  {
    id: 'r153',
    post_id: 'post_9',
    device_id: 'device_8oq1r7q',
    clarity: 2.5,
    purpose: 1,
    aesthetics: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11.62).toISOString()
  },
  {
    id: 'r154',
    post_id: 'post_9',
    device_id: 'device_s3cxj2l',
    reviewer_name: 'Guest 182',
    clarity: 2.5,
    purpose: 1.5,
    aesthetics: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11.95).toISOString()
  },
  {
    id: 'r155',
    post_id: 'post_18',
    reviewer_id: 'user_1',
    clarity: 2.5,
    purpose: 2.5,
    aesthetics: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5.64).toISOString()
  },
  {
    id: 'r156',
    post_id: 'post_18',
    reviewer_id: 'user_3',
    clarity: 2,
    purpose: 2.5,
    aesthetics: 2.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4.04).toISOString()
  },
  {
    id: 'r157',
    post_id: 'post_18',
    reviewer_id: 'user_4',
    clarity: 2.5,
    purpose: 3.5,
    aesthetics: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2.15).toISOString()
  },
  {
    id: 'r158',
    post_id: 'post_18',
    reviewer_id: 'user_2',
    clarity: 3,
    purpose: 3.5,
    aesthetics: 3.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4.21).toISOString()
  },
  {
    id: 'r159',
    post_id: 'post_18',
    reviewer_id: 'user_5',
    clarity: 2.5,
    purpose: 3,
    aesthetics: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5.94).toISOString()
  },
  {
    id: 'r160',
    post_id: 'post_18',
    device_id: 'device_s03jop7',
    reviewer_name: 'Guest 378',
    clarity: 3,
    purpose: 2.5,
    aesthetics: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3.33).toISOString()
  },
  {
    id: 'r161',
    post_id: 'post_18',
    device_id: 'device_d748az1',
    clarity: 3.5,
    purpose: 3.5,
    aesthetics: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4.29).toISOString()
  },
  {
    id: 'r162',
    post_id: 'post_18',
    device_id: 'device_62y0d7e',
    clarity: 2.5,
    purpose: 3,
    aesthetics: 3.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5.66).toISOString()
  },
  {
    id: 'r163',
    post_id: 'post_18',
    device_id: 'device_5gpzrvs',
    clarity: 2.5,
    purpose: 2.5,
    aesthetics: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4.60).toISOString()
  },
  {
    id: 'r164',
    post_id: 'post_18',
    device_id: 'device_anchjp6',
    clarity: 3,
    purpose: 2,
    aesthetics: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2.28).toISOString()
  },
  {
    id: 'r165',
    post_id: 'post_25',
    reviewer_id: 'user_4',
    clarity: 3,
    purpose: 2.5,
    aesthetics: 3,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5.75).toISOString()
  },
  {
    id: 'r166',
    post_id: 'post_25',
    reviewer_id: 'user_1',
    clarity: 2,
    purpose: 3,
    aesthetics: 2.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12.09).toISOString()
  },
  {
    id: 'r167',
    post_id: 'post_25',
    reviewer_id: 'user_2',
    clarity: 2.5,
    purpose: 2,
    aesthetics: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10.56).toISOString()
  },
  {
    id: 'r168',
    post_id: 'post_25',
    reviewer_id: 'user_3',
    clarity: 2.5,
    purpose: 3,
    aesthetics: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8.21).toISOString()
  },
  {
    id: 'r169',
    post_id: 'post_25',
    reviewer_id: 'user_5',
    clarity: 2.5,
    purpose: 2,
    aesthetics: 2.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13.22).toISOString()
  },
  {
    id: 'r170',
    post_id: 'post_25',
    device_id: 'device_ye5959o',
    reviewer_name: 'Guest 380',
    clarity: 2,
    purpose: 2.5,
    aesthetics: 2.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11.96).toISOString()
  },
  {
    id: 'r171',
    post_id: 'post_25',
    device_id: 'device_pkjwzto',
    clarity: 3,
    purpose: 2,
    aesthetics: 2.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11.30).toISOString()
  },
  {
    id: 'r172',
    post_id: 'post_25',
    device_id: 'device_p0xm8e6',
    clarity: 2,
    purpose: 3,
    aesthetics: 2.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5.76).toISOString()
  },
  {
    id: 'r173',
    post_id: 'post_25',
    device_id: 'device_udoy097',
    clarity: 2.5,
    purpose: 2.5,
    aesthetics: 2.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6.30).toISOString()
  },
  {
    id: 'r174',
    post_id: 'post_25',
    device_id: 'device_tnm0ns6',
    reviewer_name: 'Guest 8',
    clarity: 2.5,
    purpose: 2,
    aesthetics: 2.5,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5.47).toISOString()
  },
  {
    id: 'r175',
    post_id: 'post_25',
    device_id: 'device_kdpnfuh',
    reviewer_name: 'Guest 927',
    clarity: 2,
    purpose: 2.5,
    aesthetics: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13.52).toISOString()
  },
  {
    id: 'r176',
    post_id: 'post_25',
    device_id: 'device_pz1hvbf',
    reviewer_name: 'Guest 484',
    clarity: 2,
    purpose: 2.5,
    aesthetics: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10.64).toISOString()
  }
];

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

  const totalSum = reviews.reduce((acc, review) => {
    const avg = (review.clarity + review.purpose + review.aesthetics) / 3;
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
    return avatar?.name || 'Unknown Avatar';
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
