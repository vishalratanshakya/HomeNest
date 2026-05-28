
const fs = require('fs');
const content = fs.readFileSync('vendor/pages/Profile.jsx', 'utf8');

let curly = 0;
let paren = 0;
let bracket = 0;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '{') curly++;
    if (char === '}') curly--;
    if (char === '(') paren++;
    if (char === ')') paren--;
    if (char === '[') bracket++;
    if (char === ']') bracket--;

    if (curly < 0 || paren < 0 || bracket < 0) {
        console.log(`Negative count at index ${i}: curly=${curly}, paren=${paren}, bracket=${bracket}`);
        // Find line number
        const line = content.substring(0, i).split('\n').length;
        console.log(`Line ${line}`);
    }
}

console.log(`Final counts: curly=${curly}, paren=${paren}, bracket=${bracket}`);
