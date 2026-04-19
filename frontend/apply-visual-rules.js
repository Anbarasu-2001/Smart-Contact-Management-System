const fs = require('fs');

const homePath = 'components/pages/Home.tsx';
let home = fs.readFileSync(homePath, 'utf8');

// Replace any wrapper for the main content to strictly use grid grid-cols-1 xl:grid-cols-3 gap-6
// We will replace the main rendering block
home = home.replace(/<div className="grid grid-cols-[^"]+">/g, '<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">');
home = home.replace(/<div className="w-full flex-1[^"]*">/g, '<div className="flex flex-col gap-6 w-full">');

// Apply the specific premium card system everywhere
const premiumCardClass = 'bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300';
home = home.replace(/className="[^"]*glass-card[^"]*"/g, 'className="' + premiumCardClass + '"');
home = home.replace(/className="[^"]*premium-card[^"]*"/g, 'className="' + premiumCardClass + '"');
home = home.replace(/className="[^"]*quick-action-card[^"]*"/g, 'className="' + premiumCardClass + ' flex flex-col gap-3"');

fs.writeFileSync(homePath, home);

const sidebarPath = 'components/layout/Sidebar.tsx';
let sidebar = fs.readFileSync(sidebarPath, 'utf8');
sidebar = sidebar.replace(/text-\[\#4f46e5\] shadow-lg scale-\[1\.02\]/g, 'text-[#4f46e5] shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-[1.02]');
fs.writeFileSync(sidebarPath, sidebar);

console.log('Visual rules applied.');
