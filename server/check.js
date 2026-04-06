const fs = require('fs');
const content = fs.readFileSync('C:/Users/Anbarasu/OneDrive/Desktop/miniproject/frontend/components/pages/Home.tsx', 'utf8');

const lines = content.split('\n');
const mappedIdx = lines.findIndex(l => l.includes('chatSummaries.map('));
if (mappedIdx !== -1) {
    console.log(lines.slice(mappedIdx - 5, mappedIdx + 20).join('\n'));
} else {
    console.log('Not found');
}
