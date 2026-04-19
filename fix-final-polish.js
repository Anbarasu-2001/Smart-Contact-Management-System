const fs = require('fs');
let css = fs.readFileSync('frontend/styles/globals.css', 'utf8');

css = css.replace(/bg-gradient-to-r from-slate-100 to-cyan-100/g, 'bg-gradient-to-r from-teal-700 to-cyan-700');
css = css.replace(/from-cyan-300 to-indigo-300/g, 'from-teal-600 to-cyan-500');
css = css.replace(/text-slate-300/g, 'text-gray-700');
css = css.replace(/bg-slate-800\/70/g, 'bg-white/60');
css = css.replace(/bg-slate-900\/[0-9]+/g, 'bg-white/60');
css = css.replace(/shadow-2xl/g, 'shadow-lg');
css = css.replace(/rounded-xl/g, 'rounded-2xl');
css = css.replace(/rounded-\[.*?\]/g, 'rounded-2xl');
css = css.replace(/border-cyan-[^ ]+/g, 'border-white/40');
css = css.replace(/text-cyan-100/g, 'text-teal-700');
css = css.replace(/text-slate-[^ ]+/g, 'text-gray-800');
css = css.replace(/bg-background text-foreground/g, 'bg-transparent text-gray-800');

fs.writeFileSync('frontend/styles/globals.css', css);
console.log('Fixed CSS globals');
