import type { Category } from '@/types';

/**
 * Product-defined design categories.
 *
 * These are domain constants, not user data. They live here permanently
 * and are never stored in the database. They mirror the `Category` union
 * type in `src/types/index.ts` and must be kept in sync with it.
 */
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
  'Dashboard Design',
];
