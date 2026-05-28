const fs = require('fs');
const path = require('path');
const mockDataPath = path.join(process.cwd(), 'src/logic/mockData.ts');

let content = fs.readFileSync(mockDataPath, 'utf8');

const regex1 = /"reviewer_id":\s*"usr_guest_[^"]+",\s*"reviewer_name":/g;
const regex2 = /reviewer_id:\s*'usr_guest_[^']+',\s*reviewer_name:/g;

const matches1 = (content.match(regex1) || []).length;
const matches2 = (content.match(regex2) || []).length;

content = content.replace(regex1, '"reviewer_name":');
content = content.replace(regex2, 'reviewer_name:');

fs.writeFileSync(mockDataPath, content, 'utf8');

console.log(`Removed ${matches1 + matches2} fake guest IDs to make them real guests!`);
