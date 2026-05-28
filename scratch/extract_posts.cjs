const fs = require('fs');
const path = require('path');

const mockDataPath = path.join(__dirname, '..', 'src', 'logic', 'mockData.ts');
const mockDataContent = fs.readFileSync(mockDataPath, 'utf8');

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

console.log("ACTUAL_POSTS_JSON:");
console.log(JSON.stringify(posts, null, 2));
