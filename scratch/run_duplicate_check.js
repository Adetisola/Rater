import fs from 'fs';
import path from 'path';

// Read mockData.ts
const mockDataPath = path.join(process.cwd(), 'src/logic/mockData.ts');
const mockDataContent = fs.readFileSync(mockDataPath, 'utf8');

// The reviews array export is: export const RAW_MOCK_REVIEWS: Review[] = [ ... ];
// We can try to regex extract the json objects or we can just import it since it's TS, but importing TS from node is hard without ts-node.
// Let's use a regex to extract reviewer properties and post_id.
// It's easier to just build a quick script that uses ts-node to import mockData.ts and analyze it.

const script = `
import { RAW_MOCK_REVIEWS } from './src/logic/mockData';

const postReviewers = new Map<string, Set<string>>();
const duplicates = new Map<string, string[]>();

for (const review of RAW_MOCK_REVIEWS) {
  const reviewerId = review.reviewer.id || review.reviewer.name;
  const postId = review.post_id;
  
  if (!postReviewers.has(postId)) {
    postReviewers.set(postId, new Set());
  }
  
  const reviewers = postReviewers.get(postId)!;
  if (reviewers.has(reviewerId)) {
    if (!duplicates.has(postId)) {
      duplicates.set(postId, []);
    }
    duplicates.get(postId)!.push(reviewerId);
  } else {
    reviewers.add(reviewerId);
  }
}

let found = false;
for (const [postId, dupes] of duplicates.entries()) {
  console.log(\`Post: \${postId} - Duplicates: \${dupes.join(', ')}\`);
  found = true;
}

if (!found) {
  console.log("No duplicates found!");
}
`;

fs.writeFileSync(path.join(process.cwd(), 'scratch/check_duplicates.ts'), script, 'utf8');
