export type Category = 'Web Design' | 'Mobile App Design' | 'Logo Design' | 'Brand Identity Design' | 'Poster Design' | 'Flyer Design' | 'Social Media Design' | 'AI Image' | '3D Design';

export interface Avatar {
  id: string;
  username: string;     // UNIQUE username
  name: string;         // Display name
  role: string;         // public-facing identity label
  avatar_url?: string;  // snake_case
  bg_color: string;     // snake_case
  bio?: string;
  is_blocked: boolean;  // snake_case
  passkey: string; 
  created_at: string;   // snake_case
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
}

export interface Post {
  id: string;
  title: string;
  description: string;
  category: Category;
  image_url: string;
  author_id: string;
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
  'Web Design', 'Mobile App Design', 'Brand Identity Design', 
  'Logo Design', 'Poster Design', 'Flyer Design', 'Social Media Design', 'AI Image', '3D Design'
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
    created_at: '2026-01-01T00:00:00Z'
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
    author_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: 'post_8',
    title: 'Portfolio Website',
    description: 'Personal portfolio design highlighting creative works and resume.',
    category: 'Web Design',
    image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_5',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    id: 'post_11',
    title: 'SaaS Dashboard UI',
    description: 'Analytics dashboard design for a B2B software platform with real-time data visualization.',
    category: 'Web Design',
    image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 'post_12',
    title: 'Restaurant Landing Page',
    description: 'Elegant one-page website for an upscale dining experience with menu integration.',
    category: 'Web Design',
    image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
  {
    id: 'post_4',
    title: 'Finance App UI',
    description: 'Mobile banking application interface focused on accessibility and data visualization.',
    category: 'Mobile App Design',
    image_url: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: 'post_10',
    title: 'Meditation App',
    description: 'Calming user interface design for a daily meditation and mindfulness app.',
    category: 'Mobile App Design',
    image_url: 'https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
  },
  {
    id: 'post_13',
    title: 'Fitness Tracker App',
    description: 'Health and workout tracking interface with goal setting and progress charts.',
    category: 'Mobile App Design',
    image_url: 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: 'post_14',
    title: 'Food Delivery App',
    description: 'Streamlined ordering experience with restaurant discovery and live tracking.',
    category: 'Mobile App Design',
    image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_4',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: 'post_2',
    title: 'Coffee Brand Identity',
    description: 'Rebranding for a local coffee shop focusing on organic themes and warm earth tones.',
    category: 'Brand Identity Design',
    image_url: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'post_9',
    title: 'Eco Juice Packaging',
    description: 'Sustainable packaging concept for organic cold-pressed juices.',
    category: 'Brand Identity Design',
    image_url: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
  },
  {
    id: 'post_15',
    title: 'Luxury Watch Branding',
    description: 'Premium brand identity for a Swiss-inspired watch manufacturer.',
    category: 'Brand Identity Design',
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_5',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 'post_16',
    title: 'Bakery Visual Identity',
    description: 'Warm and inviting brand system for an artisan bakery chain.',
    category: 'Brand Identity Design',
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_4',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
  },
  {
    id: 'post_6',
    title: 'Tech Startup Logo',
    description: 'Minimalist geometric logo concept for an AI technology startup.',
    category: 'Logo Design',
    image_url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_4',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 'post_17',
    title: 'Creative Agency Logo',
    description: 'Dynamic and playful logomark for a digital creative studio.',
    category: 'Logo Design',
    image_url: 'https://images.unsplash.com/photo-1626785774625-ddcddc3445e9?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 'post_18',
    title: 'Eco Foundation Logo',
    description: 'Nature-inspired symbol for an environmental nonprofit organization.',
    category: 'Logo Design',
    image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
  },
  {
    id: 'post_19',
    title: 'Podcast Network Logo',
    description: 'Audio waveform-inspired logo for a podcast production company.',
    category: 'Logo Design',
    image_url: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString(),
  },
  {
    id: 'post_3',
    title: 'Neon Poster Series',
    description: 'Exploration of cyberpunk aesthetics in poster format using vibrant neon gradients.',
    category: 'Poster Design',
    image_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 'post_20',
    title: 'Jazz Festival Poster',
    description: 'Retro-inspired concert poster with bold typography and saxphone illustration.',
    category: 'Poster Design',
    image_url: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_5',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'post_21',
    title: 'Movie Premiere Poster',
    description: 'Cinematic key art design for an indie film premiere.',
    category: 'Poster Design',
    image_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
  },
  {
    id: 'post_22',
    title: 'Art Exhibition Poster',
    description: 'Abstract geometric design for a contemporary art gallery opening.',
    category: 'Poster Design',
    image_url: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_4',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13).toISOString(),
  },
  {
    id: 'post_5',
    title: 'Summer Event Flyer',
    description: 'Bright and energetic flyer design for a summer music festival.',
    category: 'Flyer Design',
    image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'post_23',
    title: 'Charity Gala Flyer',
    description: 'Elegant invitation design for a black-tie fundraising event.',
    category: 'Flyer Design',
    image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: 'post_24',
    title: 'Gym Promotion Flyer',
    description: 'High-energy fitness center promotional material with bold call-to-action.',
    category: 'Flyer Design',
    image_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_5',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: 'post_25',
    title: 'Food Truck Menu Flyer',
    description: 'Vibrant street food menu design with mouth-watering photography.',
    category: 'Flyer Design',
    image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  },
  {
    id: 'post_7',
    title: 'Instagram Post Pack',
    description: 'Cohesive social media template system for a lifestyle influencer.',
    category: 'Social Media Design',
    image_url: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
  },
  {
    id: 'post_26',
    title: 'LinkedIn Header Design',
    description: 'Professional banner design for corporate personal branding.',
    category: 'Social Media Design',
    image_url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_5',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    id: 'post_27',
    title: 'YouTube Thumbnail Kit',
    description: 'High-visibility thumbnail designs for a tech review channel.',
    category: 'Social Media Design',
    image_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
  },
  {
    id: 'post_28',
    title: 'Twitter Thread Graphics',
    description: 'Eye-catching carousel designs for educational Twitter threads.',
    category: 'Social Media Design',
    image_url: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_5',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
  },
  {
    id: 'post_29',
    title: 'Cyberpunk Cityscape',
    description: 'AI-generated hyper-realistic futuristic city at night.',
    category: 'AI Image',
    image_url: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_4',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'post_30',
    title: 'Surreal Portrait',
    description: 'AI-assisted artistic portrait exploring abstract identity.',
    category: 'AI Image',
    image_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: 'post_31',
    title: 'Nature Synthesis',
    description: 'AI exploration of bioluminescent flora in a deep forest.',
    category: 'AI Image',
    image_url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'post_32',
    title: 'Vaporwave Dreams',
    description: 'AI-generated retro-aesthetic landscape with soft neon lighting.',
    category: 'AI Image',
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 'post_33',
    title: 'Floating Island 3D',
    description: 'Low-poly 3D environment for a stylized adventure game.',
    category: '3D Design',
    image_url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_5',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  },
  {
    id: 'post_34',
    title: 'Mechanical Watch 3D',
    description: 'Detailed 3D model of a complex mechanical watch movement.',
    category: '3D Design',
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
  },
  {
    id: 'post_35',
    title: 'Character Concept 3D',
    description: 'Sculpted 3D character design for a fantasy RPG.',
    category: '3D Design',
    image_url: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_4',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 'post_36',
    title: 'Abstract Sculpture 3D',
    description: 'Procedural 3D sculpture exploring form and light interaction.',
    category: '3D Design',
    image_url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=800',
    author_id: 'user_1',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
  },
];

// --- MOCK REVIEWS ---
export const MOCK_REVIEWS: Review[] = [
  // post_1 reviews
  {
    id: 'r1',
    post_id: 'post_1',
    reviewer_name: 'Design Enthusiast',
    clarity: 4.5,
    purpose: 4,
    aesthetics: 5,
    comment: 'Exceptional work, very clean.',
    created_at: '2024-03-21T10:00:00Z'
  },
  {
    id: 'r2',
    post_id: 'post_1',
    reviewer_name: 'UX Researcher',
    clarity: 5,
    purpose: 5,
    aesthetics: 4,
    comment: 'The user flow is perfectly intuitive.',
    created_at: '2024-03-22T14:30:00Z'
  },
  {
    id: 'r3',
    post_id: 'post_1',
    reviewer_name: 'WebDev',
    clarity: 4,
    purpose: 4,
    aesthetics: 4.5,
    created_at: '2024-03-23T09:15:00Z'
  },
  // post_8 reviews
  {
    id: 'r4',
    post_id: 'post_8',
    reviewer_name: 'Creative Mentor',
    clarity: 5,
    purpose: 4,
    aesthetics: 5,
    comment: 'Great portfolio structure.',
    created_at: '2024-03-20T11:00:00Z'
  },
  {
      id: 'r5',
      post_id: 'post_3',
      reviewer_name: 'CyberPunk',
      clarity: 5,
      purpose: 5,
      aesthetics: 5,
      comment: 'The neon glow effect is hyper-realistic.',
      created_at: '2024-03-22T20:00:00Z'
  },
  {
      id: 'r6',
      post_id: 'post_3',
      reviewer_name: 'PosterCollector',
      clarity: 5,
      purpose: 5,
      aesthetics: 5,
      comment: 'Instant purchase.',
      created_at: '2024-03-23T08:00:00Z'
  },
  {
      id: 'r7',
      post_id: 'post_3',
      reviewer_name: 'Anonymous',
      clarity: 4,
      purpose: 5,
      aesthetics: 5,
      created_at: '2024-03-25T12:00:00Z'
  }
];

// --- MOCK BADGES (Historical & Active Store) ---
export const MOCK_BADGES: Badge[] = [
  {
    post_id: 'post_1',
    badge_type: 'top_rated_active',
    awarded_at: '2024-04-10T10:00:00Z'
  },
  {
    post_id: 'post_3',
    badge_type: 'top_rated_active',
    awarded_at: '2024-04-11T12:00:00Z'
  },
  {
    post_id: 'post_20',
    badge_type: 'top_rated_previous',
    awarded_at: '2024-03-15T09:00:00Z'
  },
  {
    post_id: 'post_8',
    badge_type: 'top_rated_previous',
    awarded_at: '2024-03-01T08:30:00Z'
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
