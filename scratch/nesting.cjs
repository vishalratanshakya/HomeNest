
const fs = require('fs');
const content = fs.readFileSync('vendor/pages/Profile.jsx', 'utf8');

const lines = content.split('\n');
let level = 0;
lines.forEach((line, index) => {
    const open = (line.match(/<(?!(img|br|hr|input|link|meta|!))([a-z0-9.]+)(?![^>]*\/>)/gi) || []).length;
    const close = (line.match(/<\//g) || []).length;
    const prevLevel = level;
    level += open - close;
    if (open > 0 || close > 0) {
        console.log(`${index + 1}: ${prevLevel} -> ${level} | ${line.trim()}`);
    }
});
