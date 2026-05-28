const fs = require('fs');
const path = require('path');

const mockDataPath = path.join(process.cwd(), 'src/logic/mockData.ts');
const content = fs.readFileSync(mockDataPath, 'utf8');

const roles = [
  'UI Designer', 'Brand Strategist', 'Art Director', 'UX Researcher', 
  'Product Designer', 'Creative Director', 'Motion Designer', 'Visual Designer',
  'Graphic Designer', 'Frontend Engineer', 'Typography Expert', 'Design Lead'
];

let roleCounter = 0;
function getGuestReviewerLines() {
  const role = roles[roleCounter % roles.length];
  roleCounter++;
  const id = 'usr_guest_' + Math.random().toString(36).substring(2, 9);
  return `reviewer_id: '${id}',\n    reviewer_name: '${role}'`;
}

let lines = content.split('\n');
let postReviewers = {};
let replacedCount = 0;

let inReview = false;
let braceDepth = 0;
let reviewDepth = -1;

let currentPostId = null;
let currentReviewerId = null;
let reviewerIdLineIdx = -1;
let reviewerNameLineIdx = -1;
let avatarIdLineIdx = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Track brace depth
  const openCount = (line.match(/\{/g) || []).length;
  const closeCount = (line.match(/\}/g) || []).length;
  braceDepth += openCount - closeCount;

  if (line.match(/id:\s*['"]rev_/)) {
    inReview = true;
    reviewDepth = braceDepth; // This is the depth of the review object
    currentPostId = null;
    currentReviewerId = null;
    reviewerIdLineIdx = -1;
    reviewerNameLineIdx = -1;
    avatarIdLineIdx = -1;
  }
  
  if (inReview) {
    if (line.match(/post_id:\s*['"]([^'"]+)['"]/)) {
      currentPostId = line.match(/post_id:\s*['"]([^'"]+)['"]/)[1];
      if (!postReviewers[currentPostId]) postReviewers[currentPostId] = new Set();
    }
    
    if (line.match(/reviewer_id:\s*['"]([^'"]+)['"]/)) {
      currentReviewerId = line.match(/reviewer_id:\s*['"]([^'"]+)['"]/)[1];
      reviewerIdLineIdx = i;
    }
    
    if (line.match(/reviewer_name:\s*['"]([^'"]+)['"]/)) {
      reviewerNameLineIdx = i;
    }
    
    if (line.match(/avatar_id:\s*['"]([^'"]+)['"]/)) {
      avatarIdLineIdx = i;
    }
    
    // When we exit the review object
    if (braceDepth < reviewDepth) {
      inReview = false;
      if (currentPostId && currentReviewerId && reviewerIdLineIdx !== -1) {
        if (postReviewers[currentPostId].has(currentReviewerId)) {
          // It's a duplicate!
          replacedCount++;
          
          // Replace the reviewer_id line with the new guest info
          lines[reviewerIdLineIdx] = '    ' + getGuestReviewerLines() + ',';
          
          // If there was a reviewer_name or avatar_id, delete those lines so they don't conflict
          if (reviewerNameLineIdx !== -1) lines[reviewerNameLineIdx] = '';
          if (avatarIdLineIdx !== -1) lines[avatarIdLineIdx] = '';
          
          console.log(`Replaced duplicate ${currentReviewerId} on ${currentPostId}`);
        } else {
          postReviewers[currentPostId].add(currentReviewerId);
        }
      }
    }
  }
}

if (replacedCount > 0) {
  fs.writeFileSync(mockDataPath, lines.join('\n'));
  console.log(`Successfully replaced ${replacedCount} duplicate reviewers.`);
} else {
  console.log('No duplicate reviewers found.');
}
