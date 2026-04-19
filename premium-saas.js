const fs = require('fs');

function processFile(file) {
    let txt = fs.readFileSync(file, 'utf8');
    
    // Convert margin-based spacing to gap-based spacing, but we must do this structurally.
    // Instead of regex-destroying them blindly without flex wrappers.
    // Let's remove them directly and inject gap-6 in flex containers where applicable.
    
    txt = txt.replace(/mb-\d+/g, '');
    txt = txt.replace(/mt-\d+/g, '');
    txt = txt.replace(/my-\d+/g, '');
    txt = txt.replace(/\s+/g, ' '); // collapse extra spaces
    txt = txt.replace(/className=\"\s+/g, 'className="');
    
    // For Sidebar, the main wrappers:
    if (file.includes('Sidebar.tsx')) {
        // Find the main aside container and ensure it has gap-6
        txt = txt.replace('flex flex-col shadow-2xl', 'flex flex-col gap-6 shadow-lg');
        
        // Brand section wrapper
        txt = txt.replace(/<div className=\"\"> <div className=\"flex items-center gap-3\">/g, '<div className="flex flex-col gap-1"> <div className="flex items-center gap-3">');
        txt = txt.replace(/<div className=\"flex items-center gap-3\"> <div className=\"w-10 h-10/g, '<div className="flex items-center gap-3"> <div className="w-10 h-10');
        
        // The menu items list
        txt = txt.replace(/<div className=\"flex flex-col gap-2 overflow-y-auto flex-grow\">/g, '<div className="flex flex-col gap-2 overflow-y-auto flex-grow">');
        
        // Soft pastel upgrade to the Sidebar bg
        txt = txt.replace(/bg-gradient-to-b from-teal-400 to-cyan-500/g, 'bg-white/60 backdrop-blur-2xl border border-white/60 text-slate-700');
        // Because text is now slate-700, we need to fix the brand
        txt = txt.replace(/text-cyan-500 font-bold/g, 'text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-purple-500 font-bold');
        txt = txt.replace(/text-white tracking-wide/g, 'text-slate-800 tracking-wide');
        txt = txt.replace(/text-teal-100/g, 'text-slate-400');
        // Fix nav item text colors
        txt = txt.replace(/text-cyan-100/g, 'text-slate-500');
        txt = txt.replace(/text-white/g, 'text-slate-700');
        txt = txt.replace(/bg-white\/20/g, 'bg-white/80 border border-white/50');
        txt = txt.replace(/shadow-\[0_0_15px_rgba\(255,255,255,0\.4\)\]/g, 'shadow-lg shadow-teal-500/10 text-teal-600');
        txt = txt.replace(/bg-white\/30 shadow-\[0_0_15px_rgba\(255,255,255,0\.4\)/g, 'bg-white/80 shadow-lg shadow-teal-500/10 text-teal-600 border border-white/50');
        
        // Clean up the shadow-2xl from previous which were left
        txt = txt.replace(/shadow-2xl/g, '');
    }
    
    if (file.includes('Topbar.tsx')) {
        txt = txt.replace(/text-white/g, 'text-slate-700');
        txt = txt.replace(/bg-white\/20/g, 'bg-white/80');
        txt = txt.replace(/bg-teal-500/g, 'bg-gradient-to-br from-teal-400 to-cyan-500');
        // Global padding fixes
        txt = txt.replace(/gap-4/g, 'gap-6');
    }

    if (file.includes('Home.tsx')) {
        // Change gap-6 to gap-6
        // Update cards to super premium
        txt = txt.replace(/border-white\/40/g, 'border-white/60');
        txt = txt.replace(/bg-white\/60/g, 'bg-white/40'); // lighter to let gradient through
        // Chat update
        txt = txt.replace(/bg-teal-500 text-slate-700/g, 'bg-gradient-to-br from-teal-400 to-cyan-500 text-white');
    }

    fs.writeFileSync(file, txt);
}

['frontend/components/layout/Sidebar.tsx', 'frontend/components/layout/Topbar.tsx', 'frontend/components/pages/Home.tsx'].forEach(processFile);
console.log('Premium SaaS UI updates complete.');