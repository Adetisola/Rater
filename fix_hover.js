const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'PostCard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add group/card conditional to Link className
content = content.replace(
  'className="group relative break-inside-avoid block"',
  'className={`group ${!hasError ? \\'group/card\\' : \\'\\'} relative break-inside-avoid block`}'
);

// 2. We only want to replace group-hover: classes in the bottom half of the file (after line 192).
// Let's split by lines and process.
const lines = content.split('\n');
for (let i = 192; i < lines.length; i++) {
  lines[i] = lines[i].replace(/group-hover:(text-white(?:\/\d+)?)/g, 'group-hover/card:$1');
  lines[i] = lines[i].replace(/group-hover:(border-white\/\d+)/g, 'group-hover/card:$1');
  lines[i] = lines[i].replace(/group-hover:brightness-0/g, 'group-hover/card:brightness-0');
  lines[i] = lines[i].replace(/group-hover:invert/g, 'group-hover/card:invert');
}

fs.writeFileSync(filePath, lines.join('\n'));
console.log("Successfully replaced classes in PostCard.tsx");
