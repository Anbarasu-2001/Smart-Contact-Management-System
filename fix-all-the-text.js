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

    // Global
    content = content.replace(/text-gray-400/g, 'text-gray-800');
    content = content.replace(/text-gray-300/g, 'text-gray-800');
    content = content.replace(/opacity-50/g, ''); 
    content = content.replace(/opacity-60/g, '');

    // Card specifics
    content = content.replace(/text-white\/70/g, 'text-gray-900');
    content = content.replace(/text-white\/60/g, 'text-gray-900');

    // Buttons
    content = content.replace(/from-teal-[45]00 to-cyan-[45]00/g, 'from-[#00F5FF] to-[#9B5CFF]');
    content = content.replace(/from-cyan-[45]00 to-blue-[45]00/g, 'from-[#00F5FF] to-[#9B5CFF]');
    content = content.replace(/bg-teal-[456]00(?! text-)/g, 'bg-gradient-to-r from-[#00F5FF] to-[#9B5CFF]');
    
    // Inputs
    content = content.replace(/placeholder-slate-400/g, 'placeholder-gray-500');
    content = content.replace(/placeholder-gray-400/g, 'placeholder-gray-500');
    content = content.replace(/text-slate-[456]00/g, 'text-gray-900');
    content = content.replace(/focus:ring-teal-[45]00/g, 'focus:ring-[#00F5FF]');
    content = content.replace(/focus:ring-cyan-[45]00/g, 'focus:ring-[#00F5FF]');

    // Headings / text fallbacks
    content = content.replace(/text-gray-500/g, 'text-gray-700'); 
    content = content.replace(/text-gray-[67]00/g, 'text-gray-900'); 
    
    // Sidebar active
    content = content.replace(/text-teal-600/g, 'text-[#5f2c82]');
    content = content.replace(/text-teal-[5]00/g, 'text-[#00F5FF] drop-shadow-[0_0_6px_#00F5FF]');
    content = content.replace(/text-cyan-[5]00/g, 'text-[#00F5FF]');
    
    // Chat Message
    // Looking for ternary like isOwnMessage ? '...' : '...'
    if (content.includes('isOwnMessage')) {
        content = content.replace(/isOwnMessage\s*\?\s*['"]([^'"]*)['"]\s*:\s*['"]([^'"]*)['"]/g, "isOwnMessage ? 'bg-gradient-to-r from-[#00F5FF] to-[#9B5CFF] text-white' : 'bg-white text-gray-900'");
    }

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Fixed', file);
    }
}
