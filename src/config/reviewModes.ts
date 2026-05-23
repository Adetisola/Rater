import type { Category, Review } from '../types';

export type ReviewMode = 'INTERFACE' | 'BRAND' | 'MARKETING' | 'VISUAL_CRAFT' | 'GLOBAL';

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

const GLOBAL_CLARITY: CriterionConfig = {
  dbKey: 'clarity',
  label: 'Clarity',
  question: "How clear, readable, and well structured is the design?",
  points: ["Hierarchy", "Spacing", "Readability", "Layout Balance"],
  iconUrl: "https://img.icons8.com/external-creatype-blue-field-colourcreatype/100/external-clarity-tools-design-creatype-blue-field-colourcreatype.png"
};

const GLOBAL_PURPOSE: CriterionConfig = {
  dbKey: 'purpose',
  label: 'Purpose',
  question: "How well does the design communicate its intended message or goal?",
  points: ["Brand Fit", "UX intent", "Conversion Clarity", "Context Alignment"],
  iconUrl: "https://img.icons8.com/color/96/goal--v1.png"
};

const GLOBAL_AESTHETICS: CriterionConfig = {
  dbKey: 'aesthetics',
  label: 'Aesthetics',
  question: "How visually appealing and polished is the design?",
  points: ["Colour Usage", "Typography", "Style Consistency", "Overall Look & Feel"],
  iconUrl: "https://img.icons8.com/color/96/color-palette.png"
};

// Map each mode to exactly 3 db keys representing its criteria
export const REVIEW_MODES: Record<ReviewMode, ReviewModeConfig> = {
  GLOBAL: {
    modeName: 'Global',
    criteria: [GLOBAL_CLARITY, GLOBAL_PURPOSE, GLOBAL_AESTHETICS]
  },
  INTERFACE: {
    modeName: 'Interface',
    criteria: [
      {
        dbKey: 'usability',
        label: 'Usability',
        question: "How easy the interface feels to navigate",
        points: ["Frictionless flows", "Clear affordances", "Error prevention", "Accessibility"],
        iconUrl: "https://img.icons8.com/color/96/user-male-circle--v9.png"
      },
      GLOBAL_CLARITY,
      GLOBAL_AESTHETICS
    ]
  },
  BRAND: {
    modeName: 'Brand',
    criteria: [
      {
        dbKey: 'recognition',
        label: 'Recognition',
        question: "How memorable and distinctive the identity feels",
        points: ["Unique silhouette", "Recall value", "Differentiation", "Iconic qualities"],
        iconUrl: "https://img.icons8.com/color/96/star-of-bethlehem.png"
      },
      GLOBAL_PURPOSE,
      GLOBAL_AESTHETICS
    ]
  },
  MARKETING: {
    modeName: 'Marketing',
    criteria: [
      {
        dbKey: 'impact',
        label: 'Impact',
        question: "How effectively the design grabs attention",
        points: ["Stopping power", "Visual contrast", "Immediate appeal", "Boldness"],
        iconUrl: "https://img.icons8.com/color/96/fire-element--v1.png"
      },
      GLOBAL_CLARITY,
      {
        dbKey: 'attention',
        label: 'Attention',
        question: "How strongly the visual hooks the viewer's focus",
        points: ["Engagement", "Visual hooks", "Curiosity", "Call to action clarity"],
        iconUrl: "https://img.icons8.com/color/96/look.png"
      }
    ]
  },
  VISUAL_CRAFT: {
    modeName: 'Visual Craft',
    criteria: [
      {
        dbKey: 'composition',
        label: 'Composition',
        question: "How balanced and harmonious the visual elements feel",
        points: ["Rule of thirds", "Visual weight", "Framing", "Negative space"],
        iconUrl: "https://img.icons8.com/color/96/dashboard-layout.png"
      },
      {
        dbKey: 'detail',
        label: 'Detail',
        question: "The level of care, polish, and precision in the execution",
        points: ["Refinement", "Texture", "Lighting", "Pixel perfection"],
        iconUrl: "https://img.icons8.com/color/96/search--v1.png"
      },
      GLOBAL_AESTHETICS
    ]
  }
};

export function getReviewMode(category?: Category): ReviewModeConfig {
  if (!category) return REVIEW_MODES.GLOBAL;
  const mode = REVIEW_MODE_MAPPINGS[category] || 'GLOBAL';
  return REVIEW_MODES[mode];
}
