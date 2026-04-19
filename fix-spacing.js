const fs = require('fs');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('frontend');
let modified = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let orig = content;

    // Remove mt-*, mb-*, my-* 
    content = content.replace(/\b(mt|mb|my)-(\d+|\[.*?\])\b/g, '');
    
    // Convert space-y-* to flex gap
    content = content.replace(/\bspace-y-(\d+|\[.*?\])\b/g, 'flex flex-col gap-4');

    // Remove empty spaces after regex
    content = content.replace(/\s{2,}/g, ' ');

    if (content !== orig) {
        fs.writeFileSync(file, content, 'utf8');
        modified++;
        console.log('Cleaned margins in ' + file);
    }
});

console.log('Total files cleaned: ' + modified);
