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
  reviews: Review[];
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
    rating: { average: 4.5, reviewCount: 15, isLocked: false },
    reviews: [
      {
        id: 'r_1_1',
        postId: 'post_1',
        reviewerName: 'Alice Dev',
        ratings: { clarity: 5, purpose: 5, aesthetics: 4 },
        comment: 'The checkout flow is silky smooth. Love the minimalist vibe.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      },
      {
        id: 'r_1_2',
        postId: 'post_1',
        reviewerName: 'DesignGuru',
        ratings: { clarity: 4, purpose: 5, aesthetics: 5 },
        comment: 'Beautiful typography choices. The spacing feels just right.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
      },
      {
        id: 'r_1_3',
        postId: 'post_1',
        reviewerName: 'Anonymous',
        ratings: { clarity: 4, purpose: 4, aesthetics: 4 },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      }
    ]
  },
  {
    id: 'post_8',
    title: 'Portfolio Website',
    description: 'Personal portfolio design highlighting creative works and resume.',
    category: 'Web Design',
    imageUrl: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_5',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    rating: { average: 4.7, reviewCount: 19, isLocked: false },
    reviews: [
      {
        id: 'r_8_1',
        postId: 'post_8',
        reviewerName: 'Recruiter_Dave',
        ratings: { clarity: 5, purpose: 5, aesthetics: 5 },
        comment: 'This is exactly the kind of portfolio I look for. Clear and impactful.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
      },
      {
        id: 'r_8_2',
        postId: 'post_8',
        reviewerName: 'Sarah Smith',
        ratings: { clarity: 5, purpose: 4, aesthetics: 5 },
        comment: 'The dark mode implementation is flawless.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
      },
      {
        id: 'r_8_3',
        postId: 'post_8',
        reviewerName: 'Anonymous',
        ratings: { clarity: 4, purpose: 5, aesthetics: 4 },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString()
      }
    ]
  },
  {
    id: 'post_11',
    title: 'SaaS Dashboard UI',
    description: 'Analytics dashboard design for a B2B software platform with real-time data visualization.',
    category: 'Web Design',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_2',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    rating: { average: 4.9, reviewCount: 45, isLocked: false }, // Top Rated & Most Discussed for Web Design
    reviews: [
      {
        id: 'r_11_1',
        postId: 'post_11',
        reviewerName: 'DataNerd',
        ratings: { clarity: 5, purpose: 5, aesthetics: 5 },
        comment: 'Finally, a dashboard that prioritizes data readability without looking boring.',
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
      },
      {
        id: 'r_11_2',
        postId: 'post_11',
        reviewerName: 'UX_Lead',
        ratings: { clarity: 5, purpose: 5, aesthetics: 5 },
        comment: 'Incredible use of whitespace. The charts are intuitive.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      },
      {
        id: 'r_11_3',
        postId: 'post_11',
        reviewerName: 'FrontendFan',
        ratings: { clarity: 4, purpose: 5, aesthetics: 5 },
        comment: 'I want to build this. Are the specs available?',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
      }
    ]
  },
  {
    id: 'post_12',
    title: 'Restaurant Landing Page',
    description: 'Elegant one-page website for an upscale dining experience with menu integration.',
    category: 'Web Design',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_3',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    rating: { average: 4.1, reviewCount: 8, isLocked: false },
    reviews: [
      {
        id: 'r_12_1',
        postId: 'post_12',
        reviewerName: 'ChefTony',
        ratings: { clarity: 3, purpose: 5, aesthetics: 5 },
        comment: 'Looks delicious, but the menu font is a bit small.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      },
      {
        id: 'r_12_2',
        postId: 'post_12',
        reviewerName: 'Anonymous',
        ratings: { clarity: 4, purpose: 4, aesthetics: 4 },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
      },
      {
        id: 'r_12_3',
        postId: 'post_12',
        reviewerName: 'WebDev101',
        ratings: { clarity: 5, purpose: 4, aesthetics: 3 },
        comment: 'Good structure, maybe less parallax effects.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
      }
    ]
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
    rating: { average: 4.0, reviewCount: 1, isLocked: true },
    reviews: [
      {
        id: 'r_4_1',
        postId: 'post_4',
        reviewerName: 'EarlyAdopter',
        ratings: { clarity: 4, purpose: 4, aesthetics: 4 },
        comment: 'Great start! Looking forward to seeing more screens.',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      }
    ]
  },
  {
    id: 'post_10',
    title: 'Meditation App',
    description: 'Calming user interface design for a daily meditation and mindfulness app.',
    category: 'Mobile App Design',
    imageUrl: 'https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_3',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
    rating: { average: 4.4, reviewCount: 6, isLocked: false },
    reviews: [
      {
        id: 'r_10_1',
        postId: 'post_10',
        reviewerName: 'MindfulUser',
        ratings: { clarity: 5, purpose: 5, aesthetics: 4 },
        comment: 'Very calming colors. Matches the theme perfectly.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
      },
      {
        id: 'r_10_2',
        postId: 'post_10',
        reviewerName: 'Anonymous',
        ratings: { clarity: 4, purpose: 4, aesthetics: 4 },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
      },
      {
        id: 'r_10_3',
        postId: 'post_10',
        reviewerName: 'AppCritic',
        ratings: { clarity: 4, purpose: 5, aesthetics: 5 },
        comment: 'The navigation bar is innovative.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString()
      }
    ]
  },
  {
    id: 'post_13',
    title: 'Fitness Tracker App',
    description: 'Health and workout tracking interface with goal setting and progress charts.',
    category: 'Mobile App Design',
    imageUrl: 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    rating: { average: 4.8, reviewCount: 52, isLocked: false }, // Top Rated & Most Discussed for Mobile App
    reviews: [
      {
        id: 'r_13_1',
        postId: 'post_13',
        reviewerName: 'GymRat',
        ratings: { clarity: 5, purpose: 5, aesthetics: 5 },
        comment: 'I would actually use this. The progress circles are motivating.',
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
      },
      {
        id: 'r_13_2',
        postId: 'post_13',
        reviewerName: 'UI_Explorer',
        ratings: { clarity: 5, purpose: 5, aesthetics: 4 },
        comment: 'Clean data visualization. Good job.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
      },
      {
        id: 'r_13_3',
        postId: 'post_13',
        reviewerName: 'Anonymous',
        ratings: { clarity: 4, purpose: 5, aesthetics: 5 },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
      }
    ]
  },
  {
    id: 'post_14',
    title: 'Food Delivery App',
    description: 'Streamlined ordering experience with restaurant discovery and live tracking.',
    category: 'Mobile App Design',
    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_4',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    rating: { average: 4.2, reviewCount: 11, isLocked: false },
    reviews: [
      {
        id: 'r_14_1',
        postId: 'post_14',
        reviewerName: 'HungryUser',
        ratings: { clarity: 5, purpose: 5, aesthetics: 3 },
        comment: 'Functional but maybe a bit too generic.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      },
      {
        id: 'r_14_2',
        postId: 'post_14',
        reviewerName: 'DesignStudent',
        ratings: { clarity: 4, purpose: 4, aesthetics: 4 },
        comment: 'Solid UX flow.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
      },
      {
        id: 'r_14_3',
        postId: 'post_14',
        reviewerName: 'Anonymous',
        ratings: { clarity: 4, purpose: 4, aesthetics: 4 },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
      }
    ]
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
    rating: { average: 4.2, reviewCount: 42, isLocked: false }, // Most Discussed
    reviews: [
        {
            id: 'r_2_1',
            postId: 'post_2',
            reviewerName: 'BaristaJoe',
            ratings: { clarity: 5, purpose: 5, aesthetics: 4 },
            comment: 'Love the earthy tones. Fits the coffee vibe perfectly.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
        },
        {
            id: 'r_2_2',
            postId: 'post_2',
            reviewerName: 'Anonymous',
            ratings: { clarity: 4, purpose: 4, aesthetics: 3 },
            comment: 'A bit too brown?',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString()
        },
        {
            id: 'r_2_3',
            postId: 'post_2',
            reviewerName: 'BrandingExpert',
            ratings: { clarity: 5, purpose: 4, aesthetics: 5 },
            comment: 'Solid execution on the logo mark.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
        }
    ]
  },
  {
    id: 'post_9',
    title: 'Eco Juice Packaging',
    description: 'Sustainable packaging concept for organic cold-pressed juices.',
    category: 'Brand Identity Design',
    imageUrl: 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    rating: { average: 5.0, reviewCount: 2, isLocked: true },
    reviews: [
        {
            id: 'r_9_1',
            postId: 'post_9',
            reviewerName: 'EcoWarrior',
            ratings: { clarity: 5, purpose: 5, aesthetics: 5 },
            comment: 'Finally some sustainable packaging that looks premium!',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
        },
        {
            id: 'r_9_2',
            postId: 'post_9',
            reviewerName: 'Anonymous',
            ratings: { clarity: 5, purpose: 5, aesthetics: 5 },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString()
        }
    ]
  },
  {
    id: 'post_15',
    title: 'Luxury Watch Branding',
    description: 'Premium brand identity for a Swiss-inspired watch manufacturer.',
    category: 'Brand Identity Design',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_5',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    rating: { average: 4.9, reviewCount: 33, isLocked: false }, // Top Rated
    reviews: [
        {
            id: 'r_15_1',
            postId: 'post_15',
            reviewerName: 'HorologyFan',
            ratings: { clarity: 5, purpose: 5, aesthetics: 5 },
            comment: 'Classy, timeless, elegant. 10/10.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
        },
        {
            id: 'r_15_2',
            postId: 'post_15',
            reviewerName: 'LuxuryLover',
            ratings: { clarity: 5, purpose: 5, aesthetics: 5 },
            comment: 'The serif font choice is excellent for this market.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
        },
        {
            id: 'r_15_3',
            postId: 'post_15',
            reviewerName: 'Anonymous',
            ratings: { clarity: 4, purpose: 5, aesthetics: 5 },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
        }
    ]
  },
  {
    id: 'post_16',
    title: 'Bakery Visual Identity',
    description: 'Warm and inviting brand system for an artisan bakery chain.',
    category: 'Brand Identity Design',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_4',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
    rating: { average: 4.3, reviewCount: 14, isLocked: false },
    reviews: [
        {
            id: 'r_16_1',
            postId: 'post_16',
            reviewerName: 'BakerBob',
            ratings: { clarity: 5, purpose: 4, aesthetics: 4 },
            comment: 'Makes me hungry just looking at it.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
        },
        {
            id: 'r_16_2',
            postId: 'post_16',
            reviewerName: 'Anonymous',
            ratings: { clarity: 3, purpose: 5, aesthetics: 4 },
            comment: 'Logo mark is a bit hard to read at small sizes.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString()
        },
        {
            id: 'r_16_3',
            postId: 'post_16',
            reviewerName: 'DesignStudent2',
            ratings: { clarity: 5, purpose: 4, aesthetics: 5 },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString()
        }
    ]
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
    rating: { average: 0, reviewCount: 0, isLocked: true },
    reviews: []
  },
  {
    id: 'post_17',
    title: 'Creative Agency Logo',
    description: 'Dynamic and playful logomark for a digital creative studio.',
    category: 'Logo Design',
    imageUrl: 'https://images.unsplash.com/photo-1626785774625-ddcddc3445e9?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    rating: { average: 4.8, reviewCount: 38, isLocked: false }, // Top Rated & Most Discussed
    reviews: [
        {
            id: 'r_17_1',
            postId: 'post_17',
            reviewerName: 'AgencyOwner',
            ratings: { clarity: 5, purpose: 5, aesthetics: 5 },
            comment: 'Energetic and bold. Stands out.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
        },
        {
            id: 'r_17_2',
            postId: 'post_17',
            reviewerName: 'CreativeDir',
            ratings: { clarity: 4, purpose: 5, aesthetics: 5 },
            comment: 'Love the color palette.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString()
        },
        {
            id: 'r_17_3',
            postId: 'post_17',
            reviewerName: 'Anonymous',
            ratings: { clarity: 5, purpose: 5, aesthetics: 4 },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString()
        }
    ]
  },
  {
    id: 'post_18',
    title: 'Eco Foundation Logo',
    description: 'Nature-inspired symbol for an environmental nonprofit organization.',
    category: 'Logo Design',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_2',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    rating: { average: 4.5, reviewCount: 22, isLocked: false },
    reviews: [
        {
            id: 'r_18_1',
            postId: 'post_18',
            reviewerName: 'NatureLover',
            ratings: { clarity: 5, purpose: 5, aesthetics: 4 },
            comment: 'Leaf symbol is clever usage of negative space.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
        },
        {
            id: 'r_18_2',
            postId: 'post_18',
            reviewerName: 'GreenTech',
            ratings: { clarity: 4, purpose: 5, aesthetics: 5 },
            comment: 'Very professional.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
        },
        {
            id: 'r_18_3',
            postId: 'post_18',
            reviewerName: 'Anonymous',
            ratings: { clarity: 4, purpose: 4, aesthetics: 4 },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString()
        }
    ]
  },
  {
    id: 'post_19',
    title: 'Podcast Network Logo',
    description: 'Audio waveform-inspired logo for a podcast production company.',
    category: 'Logo Design',
    imageUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_3',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString(),
    rating: { average: 4.1, reviewCount: 9, isLocked: false },
    reviews: [
        {
            id: 'r_19_1',
            postId: 'post_19',
            reviewerName: 'AudioEng',
            ratings: { clarity: 4, purpose: 4, aesthetics: 4 },
            comment: 'A classic waveform concept, but well executed.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
        },
        {
            id: 'r_19_2',
            postId: 'post_19',
            reviewerName: 'Podcaster',
            ratings: { clarity: 5, purpose: 3, aesthetics: 4 },
            comment: 'A bit generic, but recognizable.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString()
        },
        {
            id: 'r_19_3',
            postId: 'post_19',
            reviewerName: 'Anonymous',
            ratings: { clarity: 3, purpose: 5, aesthetics: 4 },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString()
        }
    ]
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
    rating: { average: 4.9, reviewCount: 28, isLocked: false }, // Top Rated
    reviews: [
        {
            id: 'r_3_1',
            postId: 'post_3',
            reviewerName: 'CyberPunk',
            ratings: { clarity: 5, purpose: 5, aesthetics: 5 },
            comment: 'The neon glow effect is hyper-realistic.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
        },
        {
            id: 'r_3_2',
            postId: 'post_3',
            reviewerName: 'PosterCollector',
            ratings: { clarity: 5, purpose: 5, aesthetics: 5 },
            comment: 'Instant purchase.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
        },
        {
            id: 'r_3_3',
            postId: 'post_3',
            reviewerName: 'Anonymous',
            ratings: { clarity: 4, purpose: 5, aesthetics: 5 },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
        }
    ]
  },
  {
    id: 'post_20',
    title: 'Jazz Festival Poster',
    description: 'Retro-inspired concert poster with bold typography and saxphone illustration.',
    category: 'Poster Design',
    imageUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_5',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    rating: { average: 4.6, reviewCount: 47, isLocked: false }, // Most Discussed
    reviews: [
        {
            id: 'r_20_1',
            postId: 'post_20',
            reviewerName: 'JazzFan',
            ratings: { clarity: 5, purpose: 5, aesthetics: 4 },
            comment: 'Captures the soul of jazz.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
        },
        {
            id: 'r_20_2',
            postId: 'post_20',
            reviewerName: 'MusicPromoter',
            ratings: { clarity: 5, purpose: 5, aesthetics: 5 },
            comment: 'Using this for our next gig.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
        },
        {
            id: 'r_20_3',
            postId: 'post_20',
            reviewerName: 'DesignerX',
            ratings: { clarity: 4, purpose: 4, aesthetics: 5 },
            comment: 'Typography is bold and legible.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
        }
    ]
  },
  {
    id: 'post_21',
    title: 'Movie Premiere Poster',
    description: 'Cinematic key art design for an indie film premiere.',
    category: 'Poster Design',
    imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_2',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    rating: { average: 4.3, reviewCount: 16, isLocked: false },
    reviews: [
        {
            id: 'r_21_1',
            postId: 'post_21',
            reviewerName: 'FilmMaker',
            ratings: { clarity: 4, purpose: 5, aesthetics: 4 },
            comment: 'Sets the right mood.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString()
        },
        {
            id: 'r_21_2',
            postId: 'post_21',
            reviewerName: 'Anonymous',
            ratings: { clarity: 5, purpose: 4, aesthetics: 4 },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()
        }
    ]
  },
  {
    id: 'post_22',
    title: 'Art Exhibition Poster',
    description: 'Abstract geometric design for a contemporary art gallery opening.',
    category: 'Poster Design',
    imageUrl: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_4',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13).toISOString(),
    rating: { average: 4.0, reviewCount: 5, isLocked: false },
    reviews: [
        {
            id: 'r_22_1',
            postId: 'post_22',
            reviewerName: 'ArtCurator',
            ratings: { clarity: 3, purpose: 4, aesthetics: 5 },
            comment: 'A bit abstract but visually striking.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString()
        },
        {
            id: 'r_22_2',
            postId: 'post_22',
            reviewerName: 'Anonymous',
            ratings: { clarity: 5, purpose: 3, aesthetics: 4 },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString()
        },
        {
            id: 'r_22_3',
            postId: 'post_22',
            reviewerName: 'GalleryOwner',
            ratings: { clarity: 4, purpose: 5, aesthetics: 3 },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString()
        }
    ]
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
    rating: { average: 4.6, reviewCount: 8, isLocked: false },
    reviews: [
        {
            id: 'r_5_1',
            postId: 'post_5',
            reviewerName: 'PartyPlanner',
            ratings: { clarity: 5, purpose: 5, aesthetics: 4 },
            comment: 'Super fun vibes!',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
        },
        {
            id: 'r_5_2',
            postId: 'post_5',
            reviewerName: 'Anonymous',
            ratings: { clarity: 4, purpose: 5, aesthetics: 5 },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
        },
        {
            id: 'r_5_3',
            postId: 'post_5',
            reviewerName: 'DJ_Mike',
            ratings: { clarity: 5, purpose: 4, aesthetics: 5 },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
        }
    ]
  },
  {
    id: 'post_23',
    title: 'Charity Gala Flyer',
    description: 'Elegant invitation design for a black-tie fundraising event.',
    category: 'Flyer Design',
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_3',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    rating: { average: 4.9, reviewCount: 31, isLocked: false }, // Top Rated & Most Discussed
    reviews: [
        {
            id: 'r_23_1',
            postId: 'post_23',
            reviewerName: 'EventCoord',
            ratings: { clarity: 5, purpose: 5, aesthetics: 5 },
            comment: 'Elegant and easy to read.',
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        },
        {
            id: 'r_23_2',
            postId: 'post_23',
            reviewerName: 'CharityOrg',
            ratings: { clarity: 5, purpose: 5, aesthetics: 5 },
            comment: 'Perfect for our donor gala.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
        },
        {
            id: 'r_23_3',
            postId: 'post_23',
            reviewerName: 'Anonymous',
            ratings: { clarity: 5, purpose: 4, aesthetics: 5 },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
        }
    ]
  },
  {
    id: 'post_24',
    title: 'Gym Promotion Flyer',
    description: 'High-energy fitness center promotional material with bold call-to-action.',
    category: 'Flyer Design',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_5',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    rating: { average: 4.2, reviewCount: 12, isLocked: false },
    reviews: [
        {
            id: 'r_24_1',
            postId: 'post_24',
            reviewerName: 'FitFam',
            ratings: { clarity: 5, purpose: 5, aesthetics: 3 },
            comment: 'Gets the message across loud and clear.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
        },
        {
            id: 'r_24_2',
            postId: 'post_24',
            reviewerName: 'Anonymous',
            ratings: { clarity: 4, purpose: 4, aesthetics: 4 },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
        },
        {
            id: 'r_24_3',
            postId: 'post_24',
            reviewerName: 'GymOwner',
            ratings: { clarity: 4, purpose: 4, aesthetics: 4 },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
        }
    ]
  },
  {
    id: 'post_25',
    title: 'Food Truck Menu Flyer',
    description: 'Vibrant street food menu design with mouth-watering photography.',
    category: 'Flyer Design',
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_2',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    rating: { average: 3.8, reviewCount: 4, isLocked: false },
    reviews: [
        {
            id: 'r_25_1',
            postId: 'post_25',
            reviewerName: 'Foodie',
            ratings: { clarity: 3, purpose: 4, aesthetics: 4 },
            comment: 'Photos are great but text is cluttered.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString()
        },
        {
            id: 'r_25_2',
            postId: 'post_25',
            reviewerName: 'Anonymous',
            ratings: { clarity: 4, purpose: 4, aesthetics: 3 },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString()
        },
        {
            id: 'r_25_3',
            postId: 'post_25',
            reviewerName: 'ChefX',
            ratings: { clarity: 4, purpose: 4, aesthetics: 4 },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13).toISOString()
        }
    ]
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
    rating: { average: 4.3, reviewCount: 12, isLocked: false },
    reviews: [
        {
            id: 'r_7_1',
            postId: 'post_7',
            reviewerName: 'Influencer101',
            ratings: { clarity: 5, purpose: 5, aesthetics: 4 },
            comment: 'My feed looks amazing with these.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
        },
        {
            id: 'r_7_2',
            postId: 'post_7',
            reviewerName: 'Anonymous',
            ratings: { clarity: 4, purpose: 4, aesthetics: 4 },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
        },
        {
            id: 'r_7_3',
            postId: 'post_7',
            reviewerName: 'SocialMgr',
            ratings: { clarity: 4, purpose: 5, aesthetics: 4 },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString()
        }
    ]
  },
  {
    id: 'post_26',
    title: 'LinkedIn Banner Set',
    description: 'Professional header designs for corporate personal branding.',
    category: 'Social Media Design',
    imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_4',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    rating: { average: 4.7, reviewCount: 41, isLocked: false }, // Top Rated & Most Discussed
    reviews: [
        {
            id: 'r_26_1',
            postId: 'post_26',
            reviewerName: 'HR_Pro',
            ratings: { clarity: 5, purpose: 5, aesthetics: 5 },
            comment: 'Very professional. Improved my profile visibility.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
        },
        {
            id: 'r_26_2',
            postId: 'post_26',
            reviewerName: 'JobSeeker',
            ratings: { clarity: 5, purpose: 5, aesthetics: 4 },
            comment: 'Clean and modern.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
        },
        {
            id: 'r_26_3',
            postId: 'post_26',
            reviewerName: 'Anonymous',
            ratings: { clarity: 4, purpose: 5, aesthetics: 5 },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
        }
    ]
  },
  {
    id: 'post_27',
    title: 'TikTok Content Pack',
    description: 'Trendy video overlay templates and animated stickers for content creators.',
    category: 'Social Media Design',
    imageUrl: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_3',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    rating: { average: 4.4, reviewCount: 23, isLocked: false },
    reviews: [
        {
            id: 'r_27_1',
            postId: 'post_27',
            reviewerName: 'TikToker',
            ratings: { clarity: 5, purpose: 5, aesthetics: 4 },
            comment: 'Trending vibes!',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
        },
        {
            id: 'r_27_2',
            postId: 'post_27',
            reviewerName: 'ContentCreator',
            ratings: { clarity: 4, purpose: 5, aesthetics: 5 },
            comment: 'Easy to use overlays.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
        },
        {
            id: 'r_27_3',
            postId: 'post_27',
            reviewerName: 'Anonymous',
            ratings: { clarity: 4, purpose: 4, aesthetics: 4 },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
        }
    ]
  },
  {
    id: 'post_28',
    title: 'Twitter Thread Graphics',
    description: 'Eye-catching carousel designs for educational Twitter threads.',
    category: 'Social Media Design',
    imageUrl: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?auto=format&fit=crop&q=80&w=800',
    designerId: 'user_5',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    rating: { average: 4.0, reviewCount: 7, isLocked: false },
    reviews: [
        {
            id: 'r_28_1',
            postId: 'post_28',
            reviewerName: 'TwitterGuru',
            ratings: { clarity: 4, purpose: 4, aesthetics: 4 },
            comment: 'Good template structure.',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString()
        },
        {
            id: 'r_28_2',
            postId: 'post_28',
            reviewerName: 'Anonymous',
            ratings: { clarity: 4, purpose: 4, aesthetics: 4 },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString()
        },
        {
            id: 'r_28_3',
            postId: 'post_28',
            reviewerName: 'GrowthHacker',
            ratings: { clarity: 4, purpose: 4, aesthetics: 4 },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString()
        }
    ]
  }
];
