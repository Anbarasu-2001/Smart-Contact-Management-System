const fs = require('fs');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
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

    content = content.replace(/(className\s*=\s*)(["'`])(.*?)\2/gs, (match, prefix, quote, inner) => {
        let replaced = inner + ";

        // Strip ONLY top and bottom margins (mt, mb, my) safely.
        replaced = replaced.replace(/\bmt-(?:\d+|\[.*?\])\b/g, '');
        replaced = replaced.replace(/\bmb-(?:\d+|\[.*?\])\b/g, '');
        replaced = replaced.replace(/\bmy-(?:\d+|\[.*?\])\b/g, '');
        replaced = replaced.replace(/\bspace-y-\d+\b/g, 'flex flex-col gap-4');
        replaced = replaced.replace(/\bspace-y-\[.*?\]\b/g, 'flex flex-col gap-4');

        // Note: I deliberately avoid stripping \bm- because `m-` handles left/right margins too, which might break layout horizontally if not careful.
        
        replaced = replaced.replace(/\s{2,}/g, ' ').trim();
        return prefix + quote + replaced + quote;
    });

    if (content !== orig) {
        fs.writeFileSync(file, content, 'utf8');
        modified++;
        console.log('Fixed margins safely in ' + file);
    }
});

console.log('Total files cleaned: ' + modified);
