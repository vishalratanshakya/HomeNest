import fs from 'fs';

const filePath = 'c:\\Desktop\\realstate\\src\\core\\services\\firebaseService.js';
const content = fs.readFileSync(filePath, 'utf8');

try {
  const openBraces = (content.match(/{/g) || []).length;
  const closeBraces = (content.match(/}/g) || []).length;
  
  console.log(`Braces: ${openBraces} / ${closeBraces}`);
  
  if (openBraces !== closeBraces) console.error('Brace mismatch!');
  
} catch (e) {
  console.error(e);
}
