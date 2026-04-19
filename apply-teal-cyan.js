const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, searchReplaceList) {
    if (!fs.existsSync(filePath)) {
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    for (const item of searchReplaceList) {
        content = content.replace(item.search, item.replace);
    }
    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log('Updated teal/cyan: ' + filePath);
    }
}

function processDirectory(dir, ext, searchReplaceList) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath, ext, searchReplaceList);
        } else if (fullPath.endsWith(ext)) {
            replaceInFile(fullPath, searchReplaceList);
        }
    }
}

// 1. Layout & Sidebar gradients
replaceInFile(path.join('frontend', 'components', 'layout', 'AppLayout.tsx'), [
    {
        search: /from-\[#e0f7fa\] via-\[#e1bee7\] to-\[#c5cae9\]/g,
        replace: 'from-teal-200 via-cyan-200 to-blue-200'
    },
    {
        search: /from-\[#5f2c82\] to-\[#49a09d\]/g,
        replace: 'from-teal-400 to-cyan-500'
    }
]);

// 2. Sidebar active colors
replaceInFile(path.join('frontend', 'components', 'layout', 'Sidebar.tsx'), [
    { 
        search: /text-\[#5f2c82\]/g, 
        replace: 'text-teal-600' 
    },
    {
        search: /hover:shadow-\[0_0_15px_rgba\(0,245,255,0\.5\)\]/g,
        replace: 'hover:shadow-lg'
    }
]);

// 3. Topbar updates
replaceInFile(path.join('frontend', 'components', 'layout', 'Topbar.tsx'), [
    {
        search: /hover:shadow-\[0_0_15px_rgba\(0,245,255,0\.5\)\]/g,
        replace: 'hover:shadow-lg hover:shadow-teal-500/20'
    },
    {
        search: /focus:ring-\[#00f5ff\]/g,
        replace: 'focus:ring-teal-400'
    },
    {
        search: /bg-white\/70 backdrop-blur-xl/g,
        replace: 'bg-white/60 backdrop-blur-lg'
    }
]);

// 4. Global UI Component themes (Cards, Chats, Links)
const uiReplacements = [
    // Background and Blurs for Cards
    {
        search: /bg-white\/60 backdrop-blur-xl/g,
        replace: 'bg-white/60 backdrop-blur-lg'
    },
    // Hover Effects changing from Neon Purple/Blue to Soft Teal
    {
        search: /hover:shadow-\[0_0_20px_rgba\(155,92,255,0\.3\)\]/g,
        replace: 'hover:shadow-xl hover:shadow-cyan-500/20'
    },
    // Hover Effects from saas2
    {
        search: /hover:shadow-\[0_0_20px_rgba\(59,130,246,0\.4\)\]/g,
        replace: 'hover:shadow-xl hover:shadow-cyan-500/20'
    },
    // Hover Effects from Topbar old
    {
        search: /hover:shadow-\[0_0_20px_rgba\(168,85,247,0\.4\)\]/g,
        replace: 'hover:shadow-xl hover:shadow-teal-500/20'
    },
    // Chat & Buttons specific (replace hardcoded neon gradients)
    {
        search: /from-\[#00f5ff\] to-\[#9b5cff\]/g,
        replace: 'from-teal-400 to-cyan-500'
    },
    {
        search: /from-\[#5f2c82\] to-\[#49a09d\]/g,
        replace: 'from-teal-500 to-cyan-600'
    },
    // Replace old glow shadows
    {
        search: /hover:shadow-\[0_0_15px_rgba\(0,245,255,0\.5\)\]/g,
        replace: 'hover:shadow-lg hover:shadow-cyan-500/30'
    },
    {
        search: /hover:shadow-\[0_0_15px_rgba\(155,92,255,0\.5\)\]/g,
        replace: 'hover:shadow-lg hover:shadow-teal-500/30'
    },
    {
        search: /text-gray-700/g,
        replace: 'text-gray-800'
    }
];

processDirectory(path.join('frontend', 'components'), '.tsx', uiReplacements);
processDirectory(path.join('frontend', 'app'), '.tsx', uiReplacements);

console.log('Teal/Cyan Premium SaaS applied successfully!');
