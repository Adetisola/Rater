const fs = require('fs');
const lines = fs.readFileSync('src/components/PostDetailContent.tsx', 'utf8').split('\n');
lines.splice(869, 200);
fs.writeFileSync('src/components/PostDetailContent.tsx', lines.join('\n'));
