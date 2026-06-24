const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const excludeDirs = ['node_modules', '.git', 'dist', 'scratch', '.vscode'];
const excludeFiles = ['package-lock.json', 'refactor.js'];
const binaryExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.ttf', '.woff', '.woff2'];

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  // Process files and directories
  for (const entry of entries) {
    if (excludeDirs.includes(entry.name) || excludeFiles.includes(entry.name)) {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else {
      processFile(fullPath);
    }
  }

  // Rename directories and files after processing contents
  for (const entry of entries) {
    if (excludeDirs.includes(entry.name) || excludeFiles.includes(entry.name)) {
      continue;
    }
    
    const oldName = entry.name;
    let newName = oldName;
    if (oldName.includes('Owner')) newName = newName.replace(/Owner/g, 'Owner');
    if (oldName.includes('owner')) newName = newName.replace(/owner/g, 'owner');
    if (oldName.includes('OWNER')) newName = newName.replace(/OWNER/g, 'OWNER');

    if (oldName !== newName) {
      const oldPath = path.join(dirPath, oldName);
      const newPath = path.join(dirPath, newName);
      fs.renameSync(oldPath, newPath);
      console.log(`Renamed: ${oldPath} -> ${newPath}`);
    }
  }
}

function processFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (binaryExtensions.includes(ext)) return;

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    content = content.replace(/Owner/g, 'Owner');
    content = content.replace(/owner/g, 'owner');
    content = content.replace(/OWNER/g, 'OWNER');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated content: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error processing file ${filePath}: ${err.message}`);
  }
}

// Start processing from root, but we should be careful not to rename root itself.
console.log('Starting refactor...');
processDirectory(rootDir);
console.log('Refactor complete.');
