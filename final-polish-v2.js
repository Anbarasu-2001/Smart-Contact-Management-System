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
        let replaced = inner;

        // Apply rounded-2xl globally (except to full orbs)
        replaced = replaced.replace(/\brounded-(sm|md|lg|xl|3xl)\b/g, 'rounded-2xl');
        
        // Upgrade all small/large shadows to soft SaaS shadows (shadow-lg)
        replaced = replaced.replace(/\bshadow-(sm|md|2xl|inner|none)\b/g, 'shadow-lg');
        
        // Add hover transition smoothly
        if ((replaced.includes('hover:') || replaced.includes('cursor-pointer') || replaced.includes('transition')) && !replaced.includes('transition-')) {
            replaced += ' transition-all duration-300';
        }

        // Add soft hover elevate to cards and panels
        if ((replaced.includes('card') || replaced.includes('panel') || replaced.includes('p-4') || replaced.includes('p-6')) && replaced.includes('shadow') && !replaced.includes('-translate-y-')) {
            replaced += ' hover:-translate-y-1 hover:shadow-xl hover:scale-[1.02]';
        }

        // Clean double spaces
        replaced = replaced.replace(/\s{2,}/g, ' ').trim();

        return prefix + quote + replaced + quote;
    });

    if (content !== orig) {
        fs.writeFileSync(file, content, 'utf8');
        modified++;
        console.log('Polished styling in ' + file);
    }
});

console.log('Total files polished: ' + modified);
