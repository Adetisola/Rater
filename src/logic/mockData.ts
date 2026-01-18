export type Category = 'Web Design' | 'Mobile App Design' | 'Logo Design' | 'Brand Identity Design' | 'Poster Design' | 'Flyer Design' | 'Social Media Design';

export interface Avatar {
  id: string;
  name: string;
  avatarUrl?: string; // If undefined, use initials + bgColor
  bgColor: string;
  isBlocked: boolean;
  passkey: string; 
}

export interface Rating {
  clarity: number;
  purpose: number;
  aesthetics: number;
}

export interface Review {
  id: string;
  postId: string;
  ratings: Rating;
  comment?: string;
  reviewerName?: string;
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  description: string;
  category: Category;
  imageUrl: string;
  designerId: string;
  createdAt: string;
  rating: {
    average: number;
    reviewCount: number;
    isLocked: boolean;
  };
}

// --- MOCK DATABASE ---

export const CATEGORIES: Category[] = [
  'Web Design', 'Mobile App Design', 'Brand Identity Design', 
  'Logo Design', 'Poster Design', 'Flyer Design', 'Social Media Design'
];

export const MOCK_AVATARS: Record<string, Avatar> = {
  'user_1': {
    id: 'user_1',
    name: 'Timi',
    avatarUrl: 'https://i.pravatar.cc/150?u=timi',
    bgColor: '#FEC312',
    isBlocked: false,
    passkey: '1234'
  },
  'user_2': {
    id: 'user_2',
    name: 'Sarah Chen',
    bgColor: '#7C3BED',
    isBlocked: false,
    passkey: '1111'
  },
  'user_3': {
    id: 'user_3',
    name: 'Marcus Johnson',
    bgColor: '#3B82F6',
    isBlocked: false,
    passkey: '2222'
  },
  'user_4': {
    id: 'user_4',
    name: 'Elena Rodriguez',
    bgColor: '#10B981',
    isBlocked: false,
    passkey: '3333'
  },
  'user_5': {
    id: 'user_5',
    name: 'James Park',
    bgColor: '#F59E0B',
    isBlocked: false,
    passkey: '4444'
  },
  'user_blocked': {
    id: 'user_blocked',
    name: 'Spammer',
    bgColor: '#999999',
    isBlocked: true,
    passkey: '0000'
  }
};

export const MOCK_POSTS: Post[] = [
  // ========== WEB DESIGN (4 posts) ==========
  {
    id: 'post_1',
    title: 'Modern E-commerce Web',
    description: 'A clean, minimalist approach to online shopping interactions with simplified checkout flows.',
    category: 'Web Design',
    imageUrl: 'https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    rating: { average: 4.5, reviewCount: 15, isLocked: false }
  },
  {
    id: 'post_8',
    title: 'Portfolio Website',
    description: 'Personal portfolio design highlighting creative works and resume.',
    category: 'Web Design',
    imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_5',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    rating: { average: 4.7, reviewCount: 19, isLocked: false }
  },
  {
    id: 'post_11',
    title: 'SaaS Dashboard UI',
    description: 'Analytics dashboard design for a B2B software platform with real-time data visualization.',
    category: 'Web Design',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_2',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    rating: { average: 4.9, reviewCount: 45, isLocked: false } // Top Rated & Most Discussed for Web Design
  },
  {
    id: 'post_12',
    title: 'Restaurant Landing Page',
    description: 'Elegant one-page website for an upscale dining experience with menu integration.',
    category: 'Web Design',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_3',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    rating: { average: 4.1, reviewCount: 8, isLocked: false }
  },

  // ========== MOBILE APP DESIGN (4 posts) ==========
  {
    id: 'post_4',
    title: 'Finance App UI',
    description: 'Mobile banking application interface focused on accessibility and data visualization.',
    category: 'Mobile App Design',
    imageUrl: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_3',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    rating: { average: 4.0, reviewCount: 1, isLocked: true }
  },
  {
    id: 'post_10',
    title: 'Meditation App',
    description: 'Calming user interface design for a daily meditation and mindfulness app.',
    category: 'Mobile App Design',
    imageUrl: 'https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_3',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
    rating: { average: 4.4, reviewCount: 6, isLocked: false }
  },
  {
    id: 'post_13',
    title: 'Fitness Tracker App',
    description: 'Health and workout tracking interface with goal setting and progress charts.',
    category: 'Mobile App Design',
    imageUrl: 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    rating: { average: 4.8, reviewCount: 52, isLocked: false } // Top Rated & Most Discussed for Mobile App
  },
  {
    id: 'post_14',
    title: 'Food Delivery App',
    description: 'Streamlined ordering experience with restaurant discovery and live tracking.',
    category: 'Mobile App Design',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_4',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    rating: { average: 4.2, reviewCount: 11, isLocked: false }
  },

  // ========== BRAND IDENTITY DESIGN (4 posts) ==========
  {
    id: 'post_2',
    title: 'Coffee Brand Identity',
    description: 'Rebranding for a local coffee shop focusing on organic themes and warm earth tones.',
    category: 'Brand Identity Design',
    imageUrl: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_2',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    rating: { average: 4.2, reviewCount: 42, isLocked: false } // Most Discussed
  },
  {
    id: 'post_9',
    title: 'Eco Juice Packaging',
    description: 'Sustainable packaging concept for organic cold-pressed juices.',
    category: 'Brand Identity Design',
    imageUrl: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    rating: { average: 5.0, reviewCount: 2, isLocked: true }
  },
  {
    id: 'post_15',
    title: 'Luxury Watch Branding',
    description: 'Premium brand identity for a Swiss-inspired watch manufacturer.',
    category: 'Brand Identity Design',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_5',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    rating: { average: 4.9, reviewCount: 33, isLocked: false } // Top Rated
  },
  {
    id: 'post_16',
    title: 'Bakery Visual Identity',
    description: 'Warm and inviting brand system for an artisan bakery chain.',
    category: 'Brand Identity Design',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_4',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
    rating: { average: 4.3, reviewCount: 14, isLocked: false }
  },

  // ========== LOGO DESIGN (4 posts) ==========
  {
    id: 'post_6',
    title: 'Tech Startup Logo',
    description: 'Minimalist geometric logo concept for an AI technology startup.',
    category: 'Logo Design',
    imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_4',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    rating: { average: 0, reviewCount: 0, isLocked: true }
  },
  {
    id: 'post_17',
    title: 'Creative Agency Logo',
    description: 'Dynamic and playful logomark for a digital creative studio.',
    category: 'Logo Design',
    imageUrl: 'https://images.unsplash.com/photo-1626785774625-ddcddc3445e9?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    rating: { average: 4.8, reviewCount: 38, isLocked: false } // Top Rated & Most Discussed
  },
  {
    id: 'post_18',
    title: 'Eco Foundation Logo',
    description: 'Nature-inspired symbol for an environmental nonprofit organization.',
    category: 'Logo Design',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_2',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    rating: { average: 4.5, reviewCount: 22, isLocked: false }
  },
  {
    id: 'post_19',
    title: 'Podcast Network Logo',
    description: 'Audio waveform-inspired logo for a podcast production company.',
    category: 'Logo Design',
    imageUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_3',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString(),
    rating: { average: 4.1, reviewCount: 9, isLocked: false }
  },

  // ========== POSTER DESIGN (4 posts) ==========
  {
    id: 'post_3',
    title: 'Neon Poster Series',
    description: 'Exploration of cyberpunk aesthetics in poster format using vibrant neon gradients.',
    category: 'Poster Design',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    rating: { average: 4.9, reviewCount: 28, isLocked: false } // Top Rated
  },
  {
    id: 'post_20',
    title: 'Jazz Festival Poster',
    description: 'Retro-inspired concert poster with bold typography and saxphone illustration.',
    category: 'Poster Design',
    imageUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_5',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    rating: { average: 4.6, reviewCount: 47, isLocked: false } // Most Discussed
  },
  {
    id: 'post_21',
    title: 'Movie Premiere Poster',
    description: 'Cinematic key art design for an indie film premiere.',
    category: 'Poster Design',
    imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_2',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    rating: { average: 4.3, reviewCount: 16, isLocked: false }
  },
  {
    id: 'post_22',
    title: 'Art Exhibition Poster',
    description: 'Abstract geometric design for a contemporary art gallery opening.',
    category: 'Poster Design',
    imageUrl: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_4',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13).toISOString(),
    rating: { average: 4.0, reviewCount: 5, isLocked: false }
  },

  // ========== FLYER DESIGN (4 posts) ==========
  {
    id: 'post_5',
    title: 'Summer Event Flyer',
    description: 'Bright and energetic flyer design for a summer music festival.',
    category: 'Flyer Design',
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    rating: { average: 4.6, reviewCount: 8, isLocked: false }
  },
  {
    id: 'post_23',
    title: 'Charity Gala Flyer',
    description: 'Elegant invitation design for a black-tie fundraising event.',
    category: 'Flyer Design',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_3',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    rating: { average: 4.9, reviewCount: 31, isLocked: false } // Top Rated & Most Discussed
  },
  {
    id: 'post_24',
    title: 'Gym Promotion Flyer',
    description: 'High-energy fitness center promotional material with bold call-to-action.',
    category: 'Flyer Design',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_5',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    rating: { average: 4.2, reviewCount: 12, isLocked: false }
  },
  {
    id: 'post_25',
    title: 'Food Truck Menu Flyer',
    description: 'Vibrant street food menu design with mouth-watering photography.',
    category: 'Flyer Design',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_2',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    rating: { average: 3.8, reviewCount: 4, isLocked: false }
  },

  // ========== SOCIAL MEDIA DESIGN (4 posts) ==========
  {
    id: 'post_7',
    title: 'Instagram Templates',
    description: 'Set of cohesive social media templates for fashion influencers.',
    category: 'Social Media Design',
    imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    rating: { average: 4.3, reviewCount: 12, isLocked: false }
  },
  {
    id: 'post_26',
    title: 'LinkedIn Banner Set',
    description: 'Professional header designs for corporate personal branding.',
    category: 'Social Media Design',
    imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_4',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    rating: { average: 4.7, reviewCount: 41, isLocked: false } // Top Rated & Most Discussed
  },
  {
    id: 'post_27',
    title: 'TikTok Content Pack',
    description: 'Trendy video overlay templates and animated stickers for content creators.',
    category: 'Social Media Design',
    imageUrl: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_3',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    rating: { average: 4.4, reviewCount: 23, isLocked: false }
  },
  {
    id: 'post_28',
    title: 'Twitter Thread Graphics',
    description: 'Eye-catching carousel designs for educational Twitter threads.',
    category: 'Social Media Design',
    imageUrl: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_5',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    rating: { average: 4.0, reviewCount: 7, isLocked: false }
  }
];

