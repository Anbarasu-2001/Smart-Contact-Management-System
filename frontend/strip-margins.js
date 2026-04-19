const fs = require('fs');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('.'); // walking relative to frontend
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let orig = content;

    // The user strictly demanded NO mt-/mb-/my- except potentially auto margins:
    // Only strip the numerical margin-tops and margin-bottoms.
    content = content.replace(/\bm[tby]-\d+\b/g, ''); // removes mt-4, mb-8, my-2, etc.

    // Also remove p-10 or excessive padding inside components that break the layout, except p-4, p-5, p-6
    // We let the gap handle it.
    
    // Apply grid grid-cols-3 globally inside dashboard if needed (handled in Home).

    if (orig !== content) {
        fs.writeFileSync(file, content);
        console.log('Stripped margins from ' + file);
    }
});
