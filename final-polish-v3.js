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

const files = walk('frontend');
let modified = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let orig = content;

    // Apply rounded-2xl globally (for basic text matches)
    content = content.replace(/\brounded-(sm|md|lg|xl|3xl)\b/g, 'rounded-2xl');
    
    // Convert shadow to shadow-lg, and shadow-md/2xl/inner/none to shadow-lg
    content = content.replace(/\bshadow-(sm|md|2xl|inner|none)\b/g, 'shadow-lg');
    
    // Only upgrade literal single `shadow ` to `shadow-lg ` avoiding changing shadow-lg again.
    content = content.replace(/\bshadow\b(?!\-)/g, 'shadow-lg');
    
    // Scale transitions update from 105 to soft 1.02
    content = content.replace(/\bhover:scale-105\b/g, 'hover:scale-[1.02]');
    
    // We will find ANY class string block: className="...", className={'...'}, className={`...`}
    content = content.replace(/className\s*=\s*(["'{])([\s\S]*?)(["'}])/g, (match, prefix, inner, suffix) => {
        let replaced = inner;

        // Smooth transitions parsing inside className block
        if ((replaced.includes('hover:bg-') || replaced.includes('cursor-pointer') || replaced.includes('hover:text-')) && !replaced.includes('transition')) {
            replaced += ' transition-all duration-300';
        }

        // Soft hover elevate for container blocks
        if ((replaced.includes('p-4') || replaced.includes('p-6') || replaced.includes('bg-white/60') || replaced.includes('shadow-lg')) && replaced.includes('hover:') && !replaced.includes('hover:-translate-y-1')) {
            replaced += ' hover:-translate-y-1 hover:shadow-xl hover:scale-[1.02]';
        }
        
        // Enforce consistent text mapping
        replaced = replaced.replace(/\btext-slate-800\b/g, 'text-gray-800');
        replaced = replaced.replace(/\btext-slate-700\b/g, 'text-gray-700');
        replaced = replaced.replace(/\btext-slate-600\b/g, 'text-gray-600');
        replaced = replaced.replace(/\btext-slate-500\b/g, 'text-gray-500');
        replaced = replaced.replace(/\btext-[A-Za-z]+-[A-Za-z0-9\/]+\b/g, m => m); // safe passing just to be sure we don't ruin regex
        
        // Remove multiple spaces
        replaced = replaced.replace(/\s{2,}/g, ' ').trim();

        return `className=${prefix}${replaced}${suffix}`;
    });

    if (content !== orig) {
        fs.writeFileSync(file, content, 'utf8');
        modified++;
        console.log('Polished ' + file);
    }
});

console.log('Total files polished: ' + modified);