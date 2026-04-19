const fs = require('fs');
const glob = require('glob');
const path = require('path');

function processFile(file) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. Text fades
    content = content.replace(/\btext-gray-300\b/g, 'text-gray-800');
    content = content.replace(/\btext-gray-400\b/g, 'text-gray-800');
    content = content.replace(/\btext-slate-300\b/g, 'text-gray-800');
    content = content.replace(/\btext-slate-400\b/g, 'text-gray-800');
    content = content.replace(/\btext-gray-500\b/g, 'text-gray-800');
    // Important headings
    content = content.replace(/\btext-gray-600\b/g, 'text-gray-900');
    content = content.replace(/\btext-gray-700\b/g, 'text-gray-900');
    content = content.replace(/\btext-slate-600\b/g, 'text-gray-900');
    content = content.replace(/\btext-slate-700\b/g, 'text-gray-900');
    content = content.replace(/\btext-slate-800\b/g, 'text-gray-900');

    content = content.replace(/\bopacity-50\b|opacity=\{"?0\.5(?:0)?"?\}/g, '');
    content = content.replace(/\bopacity-60\b|opacity=\{"?0\.6(?:0)?"?\}/g, '');
    content = content.replace(/\btext-white\/70\b/g, 'text-gray-900');
    content = content.replace(/\btext-white\/60\b/g, 'text-gray-900');
    content = content.replace(/\btext-white\/50\b/g, 'text-gray-900');
    content = content.replace(/\btext-white\/80\b/g, 'text-white');

    // 2. Buttons / Gradients
    content = content.replace(/\bfrom-cyan-[45]00 to-blue-[45]00\b/g, 'from-[#00F5FF] to-[#9B5CFF]');
    content = content.replace(/\bfrom-teal-[45]00 to-cyan-[45]00\b/g, 'from-[#00F5FF] to-[#9B5CFF]');
    content = content.replace(/\bfrom-teal-[45]00 via-[\w-]+ to-cyan-[45]00\b/g, 'from-[#00F5FF] to-[#9B5CFF]');
    content = content.replace(/\bfrom-violet-[45]00 via-[\w-]+ to-purple-[45]00\b/g, 'from-[#00F5FF] to-[#9B5CFF]');
    content = content.replace(/\bfrom-cyan-[45]00 via-[\w-]+ to-indigo-[45]00\b/g, 'from-[#00F5FF] to-[#9B5CFF]');
    
    // Apply button updates broadly
    content = content.replace(/\bbg-teal-500\b/g, 'bg-gradient-to-r from-[#00F5FF] to-[#9B5CFF]');
    content = content.replace(/\bbg-cyan-500\b/g, 'bg-gradient-to-r from-[#00F5FF] to-[#9B5CFF]');

    // 3. Inputs
    content = content.replace(/\bplaceholder-slate-400\b/g, 'placeholder-gray-500');
    content = content.replace(/\bplaceholder-gray-400\b/g, 'placeholder-gray-500');
    content = content.replace(/\bfocus:ring-teal-400\b/g, 'focus:ring-[#00F5FF]');
    content = content.replace(/\bfocus:ring-cyan-500\b/g, 'focus:ring-[#00F5FF]');
    content = content.replace(/\bfocus:ring-cyan-400\b/g, 'focus:ring-[#00F5FF]');

    // 4. Chat specific logic 
    if (file.includes('ContactDetails.tsx') || file.includes('Chat') || file.includes('Home.tsx')) {
        content = content.replace(/bg-gradient-to-r from-\[#00F5FF\] to-\[#9B5CFF\][^\s]* border-[a-z0-9-\/]* text-right/g, 'bg-gradient-to-r from-[#00F5FF] to-[#9B5CFF] text-white text-right');
        content = content.replace(/bg-slate-[a-z0-9-\/]* border-[a-z0-9-\/]* text-left/g, 'bg-white text-gray-900 border text-left');
    }

    // 5. Sidebar logic
    if (file.includes('Sidebar.tsx')) {
        content = content.replace(/text-teal-600/g, 'text-[#5f2c82]');
        content = content.replace(/hover:bg-white\/10 hover:text-white/g, 'text-white hover:bg-white/10');
        content = content.replace(/text-white\/90/g, 'text-white');
    }
    
    // 6. Highlights
    content = content.replace(/\btext-teal-500\b/g, 'text-[#00F5FF] drop-shadow-[0_0_6px_#00F5FF]');
    content = content.replace(/\btext-cyan-500\b/g, 'text-[#00F5FF]');
    
    // Headings fallback
    content = content.replace(/\bfont-semibold text-gray-800\b/g, 'text-lg font-semibold text-gray-900');
    content = content.replace(/\bfont-bold text-gray-800\b/g, 'text-2xl font-bold text-gray-900');

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Fixed via Regex:', file);
    }
}

const files = glob.sync('frontend/**/*.{tsx,ts,jsx,js}', { ignore: ['frontend/node_modules/**', 'frontend/.next/**', 'frontend/.turbo/**'] });
for (const f of files) {
    processFile(f);
}
