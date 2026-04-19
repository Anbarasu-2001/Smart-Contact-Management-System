const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        if (file === 'node_modules' || file === '.next' || file === '.turbo') return;
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(full));
        } else {
            if (/\.(tsx|ts|jsx|js)$/.test(file)) results.push(full);
        }
    });
    return results;
}

const files = walk('frontend');

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. Faded text
    content = content.replace(/text-gray-[34]00/g, 'text-gray-800');
    content = content.replace(/text-slate-[345]00/g, 'text-gray-800');
    content = content.replace(/text-gray-500/g, 'text-gray-800');
    
    // 2. Headings and body
    content = content.replace(/text-gray-[678]00/g, 'text-gray-900');
    content = content.replace(/text-slate-[678]00/g, 'text-gray-900');
    
    // 3. Opacity and blurs
    content = content.replace(/opacity-[56]0/g, '');
    content = content.replace(/text-white\/[4567]0/g, 'text-gray-900');
    content = content.replace(/text-white\/80/g, 'text-white/90');
    
    // 4. Inputs
    content = content.replace(/placeholder-gray-[456]00/g, 'placeholder-gray-500');
    content = content.replace(/placeholder-slate-[456]00/g, 'placeholder-gray-500');
    content = content.replace(/focus:ring-teal-400/g, 'focus:ring-[#00F5FF]');
    content = content.replace(/focus:ring-cyan-500/g, 'focus:ring-[#00F5FF]');

    // 5. Buttons and Gradients
    content = content.replace(/from-teal-400 to-cyan-[45]00/g, 'from-[#00F5FF] to-[#9B5CFF]');
    content = content.replace(/from-[#00F5FF] to-cyan-[45]00/g, 'from-[#00F5FF] to-[#9B5CFF]');
    content = content.replace(/from-cyan-500 to-blue-[45]00/g, 'from-[#00F5FF] to-[#9B5CFF]');
    content = content.replace(/bg-teal-[45]00/g, 'bg-gradient-to-r from-[#00F5FF] to-[#9B5CFF]');
    content = content.replace(/bg-cyan-[45]00/g, 'bg-gradient-to-r from-[#00F5FF] to-[#9B5CFF]');
    
    // 6. Highlights
    content = content.replace(/text-teal-[45]00/g, 'text-[#00F5FF] drop-shadow-[0_0_6px_#00F5FF]');
    content = content.replace(/text-cyan-[45]00/g, 'text-[#00F5FF]');
    
    // 7. Sidebar specifically
    content = content.replace(/hover:bg-white\/10 hover:text-white/g, 'hover:text-white');
    content = content.replace(/text-teal-600 bg-white/g, 'text-[#5f2c82] bg-white');

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Fixed', file);
    }
}
