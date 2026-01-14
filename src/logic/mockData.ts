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
    name: 'Sarah Design',
    bgColor: '#7C3BED', // Brand Purple
    isBlocked: false,
    passkey: '1111'
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
    description: 'A clean, minimalist approach to online shopping interactions.',
    category: 'Web Design',
    imageUrl: 'https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&q=80&w=800', // Placeholder
    designerId: 'user_1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    rating: { average: 4.5, reviewCount: 15, isLocked: false }
  },
  {
    id: 'post_2',
    title: 'Coffee Brand Identity',
    description: 'Rebranding for a local coffee shop focusing on organic themes.',
    category: 'Brand Identity Design',
    imageUrl: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_2',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    rating: { average: 0, reviewCount: 2, isLocked: true }
  },
  {
    id: 'post_3',
    title: 'Neon Poster Series',
    description: 'Exploration of cyberpunk aesthetics in poster format.',
    category: 'Poster Design',
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    rating: { average: 4.8, reviewCount: 5, isLocked: false }
  }
];
