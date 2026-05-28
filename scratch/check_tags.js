
const fs = require('fs');
const content = fs.readFileSync('vendor/pages/Profile.jsx', 'utf8');

let divCount = 0;
let mainCount = 0;
let motionCount = 0;
let formCount = 0;

const lines = content.split('\n');
lines.forEach((line, index) => {
    const openDivs = (line.match(/<div/g) || []).length;
    const closeDivs = (line.match(/<\/div>/g) || []).length;
    divCount += openDivs - closeDivs;

    const openMains = (line.match(/<main/g) || []).length;
    const closeMains = (line.match(/<\/main>/g) || []).length;
    mainCount += openMains - closeMains;

    const openMotions = (line.match(/<motion\.div/g) || []).length;
    const closeMotions = (line.match(/<\/motion\.div>/g) || []).length;
    motionCount += openMotions - closeMotions;

    if (divCount < 0 || mainCount < 0 || motionCount < 0) {
        console.log(`Negative count at line ${index + 1}: div=${divCount}, main=${mainCount}, motion=${motionCount}`);
    }
});

console.log(`Final counts: div=${divCount}, main=${mainCount}, motion=${motionCount}`);
