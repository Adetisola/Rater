const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function getAllFiles(dir, extn, files, result, regex) {
  files = files || fs.readdirSync(dir);
  result = result || [];
  regex = regex || new RegExp(`\\${extn}$`);

  for (let i = 0; i < files.length; i++) {
    let file = path.join(dir, files[i]);
    if (fs.statSync(file).isDirectory()) {
      try {
        result = getAllFiles(file, extn, fs.readdirSync(file), result, regex);
      } catch (error) {
        continue;
      }
    } else {
      if (regex.test(file)) {
        result.push(file);
      }
    }
  }
  return result;
}

const allFiles = [...getAllFiles(srcDir, '.tsx'), ...getAllFiles(srcDir, '.ts')];

const allImports = new Set();

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (importPath.startsWith('.')) {
      let resolvedPath = path.resolve(path.dirname(file), importPath);
      allImports.add(resolvedPath);
    } else if (importPath.startsWith('@/')) {
      let resolvedPath = path.join(srcDir, importPath.slice(2));
      allImports.add(resolvedPath);
    }
  }
  
  const dynamicRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicRegex.exec(content)) !== null) {
    const importPath = match[1];
    if (importPath.startsWith('.')) {
      let resolvedPath = path.resolve(path.dirname(file), importPath);
      allImports.add(resolvedPath);
    } else if (importPath.startsWith('@/')) {
      let resolvedPath = path.join(srcDir, importPath.slice(2));
      allImports.add(resolvedPath);
    }
  }
});

const unusedFiles = [];
allFiles.forEach(file => {
  if (file.includes(path.join('src', 'app')) || file.includes('page.tsx') || file.includes('layout.tsx') || file.includes('route.ts')) {
    return;
  }
  
  const fileWithoutExt = file.replace(/\.tsx?$/, '');
  let isUsed = false;
  for (let imported of allImports) {
    if (imported === file || imported === fileWithoutExt || imported + '.tsx' === file || imported + '.ts' === file) {
      isUsed = true;
      break;
    }
  }
  
  if (!isUsed) {
    unusedFiles.push(file);
  }
});

fs.writeFileSync('unused_results.json', JSON.stringify(unusedFiles, null, 2));
