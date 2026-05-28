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
function getGuestReviewerLines(isQuotedKey) {
  const role = roles[roleCounter % roles.length];
  roleCounter++;
  const id = 'usr_guest_' + Math.random().toString(36).substring(2, 9);
  
  if (isQuotedKey) {
    return `"reviewer_id": "${id}",\n    "reviewer_name": "${role}"`;
  } else {
    return `reviewer_id: '${id}',\n    reviewer_name: '${role}'`;
  }
}

const lines = content.split('\n');
const postReviewers = {};
let replacedCount = 0;
let log = [];

// A simpler state machine approach to avoid any regex backtracking
let inReview = false;
let currentPostId = null;
let currentReviewerId = null;
let isQuotedFormat = false;

let reviewerIdLineIdx = -1;
let reviewerNameLineIdx = -1;
let avatarIdLineIdx = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.match(/"?id"?:\s*['"]rev_/)) {
    // New review block started
    inReview = true;
    currentPostId = null;
    currentReviewerId = null;
    reviewerIdLineIdx = -1;
    reviewerNameLineIdx = -1;
    avatarIdLineIdx = -1;
    isQuotedFormat = line.includes('"id":');
  }
  
  if (inReview) {
    if (line.match(/"?post_id"?:\s*/)) {
      const match = line.match(/"?post_id"?:\s*['"]([^'"]+)['"]/);
      if (match) currentPostId = match[1];
    }
    
    if (line.match(/"?reviewer_id"?:\s*/)) {
      const match = line.match(/"?reviewer_id"?:\s*['"]([^'"]+)['"]/);
      if (match) {
        currentReviewerId = match[1];
        reviewerIdLineIdx = i;
      }
    }
    
    if (line.match(/"?reviewer_name"?:\s*/)) {
      reviewerNameLineIdx = i;
    }
    
    if (line.match(/"?avatar_id"?:\s*/)) {
      avatarIdLineIdx = i;
    }

    // A review block ends with }, or };
    if (line.match(/^\s*},?$/)) {
      if (currentPostId && currentReviewerId && reviewerIdLineIdx !== -1) {
        if (!postReviewers[currentPostId]) {
          postReviewers[currentPostId] = new Set();
        }
        
        if (postReviewers[currentPostId].has(currentReviewerId)) {
          // DUPLICATE
          replacedCount++;
          log.push(`Replaced duplicate ${currentReviewerId} on ${currentPostId}`);
          
          lines[reviewerIdLineIdx] = '    ' + getGuestReviewerLines(isQuotedFormat) + (lines[reviewerIdLineIdx].trim().endsWith(',') ? ',' : '');
          if (reviewerNameLineIdx !== -1) lines[reviewerNameLineIdx] = '';
          if (avatarIdLineIdx !== -1) lines[avatarIdLineIdx] = '';
        } else {
          postReviewers[currentPostId].add(currentReviewerId);
        }
      }
      
      inReview = false;
    }
  }
}

if (replacedCount > 0) {
  fs.writeFileSync(mockDataPath, lines.join('\n'), 'utf8');
  log.push(`Success! Replaced ${replacedCount} duplicate reviewers.`);
} else {
  log.push('No duplicates found!');
}

fs.writeFileSync(path.join(process.cwd(), 'scratch/dedupe.log'), log.join('\n'), 'utf8');
console.log('Done');
