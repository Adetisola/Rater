const fs = require('fs');
const path = require('path');

const mockDataPath = path.join(__dirname, '..', 'src', 'logic', 'mockData.ts');

const mockDataContent = fs.readFileSync(mockDataPath, 'utf8');

// Parse MOCK_POSTS via Split
const postsToken = 'export const MOCK_POSTS: Post[] = [';
const postsIndex = mockDataContent.indexOf(postsToken);

if (postsIndex === -1) {
  console.error("Could not find MOCK_POSTS");
  process.exit(1);
}

let bracketDepth = 0;
let endPostsIndex = -1;
const postsStart = postsIndex + postsToken.length - 1;
for (let i = postsStart; i < mockDataContent.length; i++) {
  if (mockDataContent[i] === '[') bracketDepth++;
  if (mockDataContent[i] === ']') {
    bracketDepth--;
    if (bracketDepth === 0) {
      endPostsIndex = i;
      break;
    }
  }
}

const postsBlock = mockDataContent.slice(postsStart, endPostsIndex + 1);
const posts = [];
const blocks = postsBlock.split('},');
blocks.forEach(block => {
  const idMatch = block.match(/id:\s*['"]([^'"]+)['"]/);
  const catMatch = block.match(/category:\s*['"]([^'"]+)['"]/);
  if (idMatch && catMatch) {
    posts.push({ id: idMatch[1], category: catMatch[1] });
  }
});

console.log("Extracted posts:", posts.length);

// Parse RAW_MOCK_REVIEWS via JSON
const startToken = 'const RAW_MOCK_REVIEWS: Review[] = ';
const startIndex = mockDataContent.indexOf(startToken);

if (startIndex === -1) {
  console.error("Could not find RAW_MOCK_REVIEWS");
  process.exit(1);
}

bracketDepth = 0;
let endReviewsIndex = -1;
const reviewsStart = startIndex + startToken.length;
for (let i = reviewsStart; i < mockDataContent.length; i++) {
  if (mockDataContent[i] === '[') bracketDepth++;
  if (mockDataContent[i] === ']') {
    bracketDepth--;
    if (bracketDepth === 0) {
      endReviewsIndex = i;
      break;
    }
  }
}

const rawArrayStr = mockDataContent.slice(reviewsStart, endReviewsIndex + 1);
const reviews = JSON.parse(rawArrayStr);

console.log("Extracted reviews:", reviews.length);

const REVIEW_MODE_MAPPINGS = {
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

const MODE_CRITERIA = {
  INTERFACE: ['usability', 'clarity', 'aesthetics'],
  BRAND: ['recognition', 'purpose', 'aesthetics'],
  MARKETING: ['impact', 'clarity', 'engagement'],
  VISUAL_CRAFT: ['composition', 'detail', 'aesthetics']
};

let zeroRatingReviewsCount = 0;
let missingPostCount = 0;

reviews.forEach(review => {
  const post = posts.find(p => p.id === review.post_id);
  if (!post) {
    console.log(`❌ Review ${review.id} has no matching post in MOCK_POSTS.`);
    missingPostCount++;
    return;
  }
  
  const mode = REVIEW_MODE_MAPPINGS[post.category];
  if (!mode) {
    console.log(`❌ Post ${post.id} category "${post.category}" has no mapping.`);
    return;
  }
  
  const criteria = MODE_CRITERIA[mode];
  let sum = 0;
  let count = 0;
  
  criteria.forEach(c => {
    const val = review[c];
    if (typeof val === 'number') {
      sum += val;
      count++;
    }
  });
  
  const avg = count > 0 ? sum / count : 0;
  if (avg === 0) {
    console.log(`⚠️ Mismatch! Review ${review.id} for post ${review.post_id} (${post.category} - ${mode}) has rating average of 0.`);
    console.log("Review data:", JSON.stringify(review));
    zeroRatingReviewsCount++;
  }
});

console.log("Total zero rating reviews:", zeroRatingReviewsCount);
console.log("Total missing posts reviews:", missingPostCount);
