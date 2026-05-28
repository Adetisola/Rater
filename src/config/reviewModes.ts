import type { Category, Review } from '../types';

export type ReviewMode = 'INTERFACE' | 'BRAND' | 'MARKETING' | 'VISUAL_CRAFT';

export interface CriterionConfig {
  dbKey: keyof Review;
  label: string;
  question: string;
  points: string[];
  iconUrl: string;
}

export interface ReviewModeConfig {
  modeName: string;
  criteria: [CriterionConfig, CriterionConfig, CriterionConfig];
}

export const REVIEW_MODE_MAPPINGS: Partial<Record<Category, ReviewMode>> = {
  'Web Design': 'INTERFACE',
  'Mobile App Design': 'INTERFACE',
  'UI Design': 'INTERFACE',
  'Landing Page Design': 'INTERFACE',
  'Dashboard Design': 'INTERFACE',

  'Brand Identity Design': 'BRAND',
  'Logo Design': 'BRAND',
  'Packaging Design': 'BRAND',
  'Typography Design': 'BRAND',
  'Icon Design': 'BRAND',

  'Poster Design': 'MARKETING',
  'Flyer Design': 'MARKETING',
  'Banner Design': 'MARKETING',
  'Social Media Design': 'MARKETING',
  'Ad Creative Design': 'MARKETING',

  'AI Image': 'VISUAL_CRAFT',
  '3D Design': 'VISUAL_CRAFT',
  'Illustration': 'VISUAL_CRAFT',
  'Mockup Design': 'VISUAL_CRAFT',
};

// ============================================================================
// 1. INTERFACE MODE
// ============================================================================

const INTERFACE_USABILITY: CriterionConfig = {
  dbKey: 'usability',
  label: 'Usability',
  question: "How intuitive and easy the interface feels to use",
  points: ["Ease of use", "Navigation flow", "Interaction clarity"],
  iconUrl: "https://img.icons8.com/color/96/user-male-circle--v9.png"
};

const INTERFACE_CLARITY: CriterionConfig = {
  dbKey: 'clarity',
  label: 'Clarity',
  question: "How clear, readable, and well structured is the design?",
  points: ["Visual hierarchy", "Readability", "Layout balance"],
  iconUrl: "https://img.icons8.com/external-creatype-blue-field-colourcreatype/100/external-clarity-tools-design-creatype-blue-field-colourcreatype.png"
};

const INTERFACE_AESTHETICS: CriterionConfig = {
  dbKey: 'aesthetics',
  label: 'Aesthetics',
  question: "How visually appealing and polished is the design?",
  points: ["Colour harmony", "Typography", "Overall polish"],
  iconUrl: "https://img.icons8.com/color/96/color-palette.png"
};

// ============================================================================
// 2. BRAND MODE
// ============================================================================

const BRAND_RECOGNITION: CriterionConfig = {
  dbKey: 'recognition',
  label: 'Recognition',
  question: "How memorable and distinctive the identity feels",
  points: ["Distinctiveness", "Memorability", "Brand recall"],
  iconUrl: "https://img.icons8.com/color/96/star-of-bethlehem.png"
};

const BRAND_PURPOSE: CriterionConfig = {
  dbKey: 'purpose',
  label: 'Purpose',
  question: "How clearly the design communicates its intended identity or message",
  points: ["Brand fit", "Message clarity", "Audience alignment"],
  iconUrl: "https://img.icons8.com/color/96/goal--v1.png"
};

const BRAND_AESTHETICS: CriterionConfig = {
  dbKey: 'aesthetics',
  label: 'Aesthetics',
  question: "How visually appealing and polished is the design?",
  points: ["Colour harmony", "Style consistency", "Overall polish"],
  iconUrl: "https://img.icons8.com/color/96/color-palette.png"
};

// ============================================================================
// 3. MARKETING MODE
// ============================================================================

const MARKETING_IMPACT: CriterionConfig = {
  dbKey: 'impact',
  label: 'Impact',
  question: "How effectively the design grabs attention",
  points: ["Visual punch", "Contrast", "Immediate appeal"],
  iconUrl: "https://img.icons8.com/color/96/fire-element--v1.png"
};

const MARKETING_CLARITY: CriterionConfig = {
  dbKey: 'clarity',
  label: 'Clarity',
  question: "How clear, readable, and well structured is the design?",
  points: ["Readability", "Hierarchy", "Message clarity"],
  iconUrl: "https://img.icons8.com/external-creatype-blue-field-colourcreatype/100/external-clarity-tools-design-creatype-blue-field-colourcreatype.png"
};

const MARKETING_ENGAGEMENT: CriterionConfig = {
  dbKey: 'engagement',
  label: 'Engagement',
  question: "How strongly the design holds the viewer’s interest",
  points: ["Visual hooks", "Viewer interest", "Curiosity"],
  iconUrl: "https://img.icons8.com/color/96/look.png"
};

// ============================================================================
// 4. VISUAL CRAFT MODE
// ============================================================================

const VISUAL_CRAFT_COMPOSITION: CriterionConfig = {
  dbKey: 'composition',
  label: 'Composition',
  question: "How intentional and visually cohesive the image feels",
  points: ["Visual balance", "Framing", "Cohesion"],
  iconUrl: "https://img.icons8.com/color/96/dashboard-layout.png"
};

const VISUAL_CRAFT_DETAIL: CriterionConfig = {
  dbKey: 'detail',
  label: 'Detail',
  question: "The level of care, polish, and precision in the execution",
  points: ["Refinement", "Precision", "Lighting"],
  iconUrl: "https://img.icons8.com/color/96/search--v1.png"
};

const VISUAL_CRAFT_AESTHETICS: CriterionConfig = {
  dbKey: 'aesthetics',
  label: 'Aesthetics',
  question: "How visually appealing and polished is the design?",
  points: ["Style consistency", "Visual appeal", "Overall polish"],
  iconUrl: "https://img.icons8.com/color/96/color-palette.png"
};

// ============================================================================
// MODE MAPPINGS
// ============================================================================

export const REVIEW_MODES: Record<ReviewMode, ReviewModeConfig> = {
  INTERFACE: {
    modeName: 'Interface',
    criteria: [INTERFACE_USABILITY, INTERFACE_CLARITY, INTERFACE_AESTHETICS]
  },
  BRAND: {
    modeName: 'Brand',
    criteria: [BRAND_RECOGNITION, BRAND_PURPOSE, BRAND_AESTHETICS]
  },
  MARKETING: {
    modeName: 'Marketing',
    criteria: [MARKETING_IMPACT, MARKETING_CLARITY, MARKETING_ENGAGEMENT]
  },
  VISUAL_CRAFT: {
    modeName: 'Visual Craft',
    criteria: [VISUAL_CRAFT_COMPOSITION, VISUAL_CRAFT_DETAIL, VISUAL_CRAFT_AESTHETICS]
  }
};

export function getReviewMode(category?: Category): ReviewModeConfig {
  if (!category) return REVIEW_MODES.INTERFACE;
  const mode = REVIEW_MODE_MAPPINGS[category] || 'INTERFACE';
  return REVIEW_MODES[mode];
}
