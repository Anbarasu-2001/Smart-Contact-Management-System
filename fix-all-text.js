const fs = require('fs');
const glob = require('glob');
const path = require('path');

const files = glob.sync('frontend/**/*.{tsx,ts,jsx,js}', { ignore: ['frontend/node_modules/**', 'frontend/.next/**'] });

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. Text fades
    content = content.replace(/text-gray-300/g, 'text-gray-700');
    content = content.replace(/text-gray-400/g, 'text-gray-800');
    content = content.replace(/opacity-50/g, '');
    content = content.replace(/opacity-60/g, '');
    content = content.replace(/text-white\/70/g, 'text-gray-900');
    content = content.replace(/text-white\/60/g, 'text-gray-900');

    // 2. Buttons 
    // Replace old teal or pastel gradients with the new button
    content = content.replace(/bg-gradient-to-r from-cyan-400 to-blue-500/g, 'bg-gradient-to-r from-[#00F5FF] to-[#9B5CFF]');
    content = content.replace(/bg-gradient-to-br from-teal-400 to-cyan-500/g, 'bg-gradient-to-r from-[#00F5FF] to-[#9B5CFF]');
    content = content.replace(/bg-teal-500/g, 'bg-gradient-to-r from-[#00F5FF] to-[#9B5CFF]');

    // 3. Inputs
    // Replaces generic inputs
    content = content.replace(/placeholder-slate-400/g, 'placeholder-gray-500');
    content = content.replace(/placeholder-gray-400/g, 'placeholder-gray-500');
    content = content.replace(/text-slate-700/g, 'text-gray-900');
    content = content.replace(/text-gray-600/g, 'text-gray-900');
    content = content.replace(/focus:ring-teal-400/g, 'focus:ring-[#00F5FF]');
    content = content.replace(/focus:ring-cyan-400/g, 'focus:ring-[#00F5FF]');

    // 4. Sidebar / Headings / Text
    // Very custom - we might just target Dashboard/Sidebar specific files if possible
    
    if (content !== original) {
        fs.writeFileSync(file, content.replace(/\s+/g, ' '));
        console.log('Fixed:', file);
    }
}
