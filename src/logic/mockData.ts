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
  {
    id: 'post_1',
    title: 'Modern E-commerce Web',
    description: 'A clean, minimalist approach to online shopping interactions with simplified checkout flows.',
    category: 'Web Design',
    imageUrl: 'https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    rating: { average: 4.5, reviewCount: 15, isLocked: false }
  },
  {
    id: 'post_2', // Badge: Most Discussed
    title: 'Coffee Brand Identity',
    description: 'Rebranding for a local coffee shop focusing on organic themes and warm earth tones.',
    category: 'Brand Identity Design',
    imageUrl: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_2',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    rating: { average: 4.2, reviewCount: 42, isLocked: false }
  },
  {
    id: 'post_3', // Badge: Top Rated
    title: 'Neon Poster Series',
    description: 'Exploration of cyberpunk aesthetics in poster format using vibrant neon gradients.',
    category: 'Poster Design',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    rating: { average: 4.9, reviewCount: 28, isLocked: false }
  },
  {
    id: 'post_4',
    title: 'Finance App UI',
    description: 'Mobile banking application interface focused on accessibility and data visualization.',
    category: 'Mobile App Design',
    imageUrl: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_3',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 day ago
    rating: { average: 4.0, reviewCount: 1, isLocked: true }
  },
  {
    id: 'post_5',
    title: 'Summer Event Flyer',
    description: 'Bright and energetic flyer design for a summer music festival.',
    category: 'Flyer Design',
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    rating: { average: 4.6, reviewCount: 8, isLocked: false }
  },
  {
    id: 'post_6',
    title: 'Tech Startup Logo',
    description: 'Minimalist geometric logo concept for an AI technology startup.',
    category: 'Logo Design',
    imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_4',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    rating: { average: 0, reviewCount: 0, isLocked: true }
  },
  {
    id: 'post_7',
    title: 'Instagram Templates',
    description: 'Set of cohesive social media templates for fashion influencers.',
    category: 'Social Media Design',
    imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week ago
    rating: { average: 4.3, reviewCount: 12, isLocked: false }
  },
  {
    id: 'post_8',
    title: 'Portfolio Website',
    description: 'Personal portfolio design highlighting creative works and resume.',
    category: 'Web Design',
    imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_5',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
    rating: { average: 4.7, reviewCount: 19, isLocked: false }
  },
  {
    id: 'post_9',
    title: 'Eco Juice Packaging',
    description: 'Sustainable packaging concept for organic cold-pressed juices.',
    category: 'Brand Identity Design',
    imageUrl: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), // 2 weeks ago
    rating: { average: 5.0, reviewCount: 2, isLocked: true }
  },
  {
    id: 'post_10',
    title: 'Meditation App',
    description: 'Calming user interface design for a daily meditation and mindfulness app.',
    category: 'Mobile App Design',
    imageUrl: 'https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_3',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(), // 3 weeks ago
    rating: { average: 4.4, reviewCount: 6, isLocked: false }
  }
];
