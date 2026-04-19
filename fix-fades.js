const fs = require('fs');
const glob = require('glob');

const files = glob.sync('frontend/**/*.{tsx,ts,jsx,js}', { ignore: ['frontend/node_modules/**', 'frontend/.next/**'] });

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Global
    content = content.replace(/text-gray-[34]00/g, 'text-gray-800');
    content = content.replace(/text-slate-[345]00/g, 'text-gray-800');
    content = content.replace(/text-gray-500/g, 'text-gray-800');
    // Important headings
    content = content.replace(/text-gray-[678]00/g, 'text-gray-900');
    content = content.replace(/text-slate-[678]00/g, 'text-gray-900');
    
    // Fade removal
    content = content.replace(/opacity-[56]0/g, '');
    content = content.replace(/text-white\/[4567]0/g, 'text-gray-900');
    content = content.replace(/text-white\/80/g, 'text-white/90'); // Bump opacity
    
    // Inputs
    content = content.replace(/placeholder-gray-[45]00/g, 'placeholder-gray-500');
    content = content.replace(/focus:ring-teal-400/g, 'focus:ring-[#00F5FF]');
    content = content.replace(/focus:ring-cyan-500/g, 'focus:ring-[#00F5FF]');

    // Buttons / Gradients
    content = content.replace(/from-teal-400 to-cyan-500/g, 'from-[#00F5FF] to-[#9B5CFF]');
    content = content.replace(/from-cyan-500 to-blue-500/g, 'from-[#00F5FF] to-[#9B5CFF]');
    content = content.replace(/bg-teal-500/g, 'bg-gradient-to-r from-[#00F5FF] to-[#9B5CFF]');
    content = content.replace(/bg-cyan-500/g, 'bg-gradient-to-r from-[#00F5FF] to-[#9B5CFF]');
    
    // Specific text colors
    content = content.replace(/text-teal-500/g, 'text-[#00F5FF] drop-shadow-[0_0_6px_#00F5FF]');
    content = content.replace(/text-cyan-500/g, 'text-[#00F5FF]');

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log('Fixed', file);
    }
}
