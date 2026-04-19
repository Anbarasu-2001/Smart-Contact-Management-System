const fs = require('fs');
const css = fs.readFileSync('styles/globals.css', 'utf8');

let depth = 0;
const lines = css.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let char of line) {
        if (char === '{') depth++;
        if (char === '}') depth--;
    }
    if (depth < 0) {
        console.log(`Unmatched } at line ${i + 1}: ${line}`);
        depth = 0;
    }
}
if (depth > 0) {
    console.log(`Unmatched { remaining at EOF, depth: ${depth}`);
    // Let's find the last {
}