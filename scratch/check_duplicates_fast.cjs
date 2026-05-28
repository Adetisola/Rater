const fs = require('fs');
const path = require('path');

const mockDataPath = path.join(process.cwd(), 'src/logic/mockData.ts');
const content = fs.readFileSync(mockDataPath, 'utf8');

// Match `post_id` and `reviewer`
let duplicates = {};
let postReviewers = {};

// It might be formatted differently, e.g.
// post_id: '...',
// reviewer: {
//   id: '...',
//   name: '...',
//   avatarUrl: '...'
// }

// Let's just find blocks.
const blocks = content.split('post_id:');
for (let i = 1; i < blocks.length; i++) {
  const block = blocks[i];
  
  // Extract postId
  const postMatch = block.match(/^\s*['"]([^'"]+)['"]/);
  if (!postMatch) continue;
  const postId = postMatch[1];
  
  // Extract reviewer
  const reviewerMatch = block.match(/reviewer:\s*\{[^}]*id:\s*['"]([^'"]+)['"]/);
  if (!reviewerMatch) continue;
  
  const reviewerId = reviewerMatch[1];
  
  if (!postReviewers[postId]) {
    postReviewers[postId] = new Set();
  }
  
  if (postReviewers[postId].has(reviewerId)) {
    if (!duplicates[postId]) duplicates[postId] = [];
    duplicates[postId].push(reviewerId);
  } else {
    postReviewers[postId].add(reviewerId);
  }
}

let found = false;
for (const postId in duplicates) {
  console.log(`Post: ${postId} - Duplicates: ${duplicates[postId].join(', ')}`);
  found = true;
}

if (!found) {
  console.log("No duplicates found!");
}
