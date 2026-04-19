const fs = require('fs');
const path = require('path');

const homePath = path.join('frontend', 'components', 'pages', 'Home.tsx');
let content = fs.readFileSync(homePath, 'utf8');

// Replace top Quick Action cards
content = content.replace(/rounded-2xl p-5 bg-white\/10 dark:bg-white\/5 backdrop-blur-xl border border-white\/10 shadow-lg hover:scale-\[1.02\] transition-all cursor-pointer/g,
    'bg-white/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/40 hover:scale-[1.02] transition-all duration-300 cursor-pointer');

// Replace Recent Contacts & Analytics Overview cards
content = content.replace(/rounded-2xl p-5 bg-white\/10 dark:bg-white\/5 backdrop-blur-xl border border-white\/10 shadow-lg/g,
    'bg-white/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/40 hover:scale-[1.02] transition-all duration-300');

// Update text colors for visibility if they are white/10 or slate-100 to match gray-800
content = content.replace(/text-slate-100/g, 'text-gray-800');
content = content.replace(/text-gray-800/g, 'text-gray-600 font-medium'); // soften sub-text, wait let's just make it gray-800 mostly
content = content.replace(/text-\[#00F5FF\]/g, 'text-teal-600 font-bold');

// Analytics gradient update
content = content.replace(/bg-gradient-to-r from-cyan-500\/10 via-blue-500\/10 to-violet-500\/10/g,
    'bg-gradient-to-r from-teal-100 via-cyan-100 to-blue-100');
content = content.replace(/from-cyan-500\/30 via-blue-400\/45 to-violet-400\/70/g,
    'from-teal-400 via-cyan-500 to-blue-500');

fs.writeFileSync(homePath, content);
console.log('Fixed cards in Home.tsx');
