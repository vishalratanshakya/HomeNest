import fs from 'fs';

const filePath = 'c:\\Desktop\\realstate\\user\\pages\\ProfilePage.jsx';
const content = fs.readFileSync(filePath, 'utf8');

try {
  const openBraces = (content.match(/{/g) || []).length;
  const closeBraces = (content.match(/}/g) || []).length;
  const openParens = (content.match(/\(/g) || []).length;
  const closeParens = (content.match(/\)/g) || []).length;
  
  console.log(`Braces: ${openBraces} / ${closeBraces}`);
  console.log(`Parens: ${openParens} / ${closeParens}`);
  
  if (openBraces !== closeBraces) console.error('Brace mismatch!');
  if (openParens !== closeParens) console.error('Paren mismatch!');
  
} catch (e) {
  console.error(e);
}
