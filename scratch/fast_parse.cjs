const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function processLineByLine() {
  const fileStream = fs.createReadStream(path.join(process.cwd(), 'src/logic/mockData.ts'));

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let currentPostId = null;
  let inReviewer = false;
  
  const postReviewers = {};
  const duplicates = {};

  for await (const line of rl) {
    if (line.includes('post_id:')) {
      const match = line.match(/post_id:\s*['"]([^'"]+)['"]/);
      if (match) {
        currentPostId = match[1];
        if (!postReviewers[currentPostId]) {
          postReviewers[currentPostId] = new Set();
        }
      }
    }
    
    if (line.includes('reviewer: {')) {
      inReviewer = true;
      continue;
    }
    
    if (inReviewer && line.includes('id:')) {
      const match = line.match(/id:\s*['"]([^'"]+)['"]/);
      if (match && currentPostId) {
        const reviewerId = match[1];
        if (postReviewers[currentPostId].has(reviewerId)) {
          if (!duplicates[currentPostId]) duplicates[currentPostId] = [];
          duplicates[currentPostId].push(reviewerId);
        } else {
          postReviewers[currentPostId].add(reviewerId);
        }
        inReviewer = false;
      }
    }
    
    if (inReviewer && line.includes('}')) {
      inReviewer = false; // end of reviewer block
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
  
  process.exit(0);
}

processLineByLine();
