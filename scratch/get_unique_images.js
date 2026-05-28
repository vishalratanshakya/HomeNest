import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../src/core/utils/dummyData.js');
const content = fs.readFileSync(filePath, 'utf8');

// regex to find unsplash URLs
const regex = /https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9-]+/g;
const matches = content.match(regex) || [];

const uniqueIds = new Set();
matches.forEach(url => {
  const match = url.match(/photo-([a-zA-Z0-9-]+)/);
  if (match && match[1]) {
    uniqueIds.add(match[1]);
  }
});

console.log(`Total Unsplash URLs found: ${matches.length}`);
console.log(`Unique photo IDs found: ${uniqueIds.size}`);
console.log(JSON.stringify(Array.from(uniqueIds)));
