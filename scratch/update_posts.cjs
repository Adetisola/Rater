const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../src/logic/mockData.ts');
let content = fs.readFileSync(targetFile, 'utf8');

// Change user_5 posts to user_1, except post_8
content = content.replace(
  /id: 'post_15',[\s\S]*?author_id: 'user_5',/,
  match => match.replace("author_id: 'user_5'", "author_id: 'user_1'")
);
content = content.replace(
  /id: 'post_20',[\s\S]*?author_id: 'user_5',/,
  match => match.replace("author_id: 'user_5'", "author_id: 'user_1'")
);
content = content.replace(
  /id: 'post_24',[\s\S]*?author_id: 'user_5',/,
  match => match.replace("author_id: 'user_5'", "author_id: 'user_1'")
);
content = content.replace(
  /id: 'post_26',[\s\S]*?author_id: 'user_5',/,
  match => match.replace("author_id: 'user_5'", "author_id: 'user_1'")
);
content = content.replace(
  /id: 'post_28',[\s\S]*?author_id: 'user_5',/,
  match => match.replace("author_id: 'user_5'", "author_id: 'user_1'")
);
content = content.replace(
  /id: 'post_33',[\s\S]*?author_id: 'user_5',/,
  match => match.replace("author_id: 'user_5'", "author_id: 'user_1'")
);

// Change user_4 posts to user_2, except post_14
content = content.replace(
  /id: 'post_16',[\s\S]*?author_id: 'user_4',/,
  match => match.replace("author_id: 'user_4'", "author_id: 'user_2'")
);
content = content.replace(
  /id: 'post_6',[\s\S]*?author_id: 'user_4',/,
  match => match.replace("author_id: 'user_4'", "author_id: 'user_2'")
);
content = content.replace(
  /id: 'post_22',[\s\S]*?author_id: 'user_4',/,
  match => match.replace("author_id: 'user_4'", "author_id: 'user_2'")
);
content = content.replace(
  /id: 'post_29',[\s\S]*?author_id: 'user_4',/,
  match => match.replace("author_id: 'user_4'", "author_id: 'user_2'")
);
content = content.replace(
  /id: 'post_35',[\s\S]*?author_id: 'user_4',/,
  match => match.replace("author_id: 'user_4'", "author_id: 'user_2'")
);

fs.writeFileSync(targetFile, content);
console.log("Updated MOCK_POSTS distribution");
