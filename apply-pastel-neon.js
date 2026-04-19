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
        console.log('Updated pastel/neon: ' + filePath);
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
        search: /from-\[#e0f7fa\] via-\[#f3e5f5\] to-\[#e3f2fd\]/g,
        replace: 'from-[#e0f7fa] via-[#e1bee7] to-[#c5cae9]'
    },
    {
        search: /from-purple-500 to-blue-500/g,
        replace: 'from-[#5f2c82] to-[#49a09d]'
    }
]);

// 2. Sidebar active colors and hover
replaceInFile(path.join('frontend', 'components', 'layout', 'Sidebar.tsx'), [
    { 
        search: /text-purple-600/g, 
        replace: 'text-[#5f2c82]' 
    },
    {
        search: /hover:bg-white\/20 hover:shadow-\[.*?\]/g,
        replace: 'hover:bg-white/20 hover:scale-105 hover:shadow-[0_0_15px_rgba(0,245,255,0.5)]'
    }
]);

// 3. Topbar updates
replaceInFile(path.join('frontend', 'components', 'layout', 'Topbar.tsx'), [
    {
        search: /hover:shadow-\[0_0_20px_rgba\(168,85,247,0\.4\)\]/g,
        replace: 'hover:shadow-[0_0_15px_rgba(0,245,255,0.5)]'
    },
    {
        search: /focus:ring-purple-400/g,
        replace: 'focus:ring-[#00f5ff]'
    },
    {
        search: /bg-white\/60 backdrop-blur-md/g,
        replace: 'bg-white/70 backdrop-blur-xl'
    }
]);

// 4. Global UI Component themes (Cards, Chats, Links)
const uiReplacements = [
    // Background and Blurs for Cards
    {
        search: /bg-white\/60 backdrop-blur-lg/g,
        replace: 'bg-white/60 backdrop-blur-xl'
    },
    // Hover Effects changing to Neon Purple/Blue
    {
        search: /hover:shadow-\[0_0_20px_rgba\(59,130,246,0\.4\)\]/g,
        replace: 'hover:shadow-[0_0_20px_rgba(155,92,255,0.3)]'
    },
    // Chat specific (if hardcoded gradients exist, replace them)
    {
        search: /from-purple-[345]00 to-blue-[345]00/g,
        replace: 'from-[#00f5ff] to-[#9b5cff]'
    },
    {
        search: /from-blue-[456]00 to-purple-[456]00/g,
        replace: 'from-[#00f5ff] to-[#9b5cff]'
    },
    // General Buttons with old solid themes
    {
        search: /bg-purple-600 hover:bg-purple-700/g,
        replace: 'bg-gradient-to-r from-[#5f2c82] to-[#49a09d] hover:shadow-[0_0_15px_rgba(0,245,255,0.5)]'
    },
    {
        search: /bg-teal-500 hover:bg-teal-600/g,
        replace: 'bg-gradient-to-r from-[#00f5ff] to-[#9b5cff] text-white hover:shadow-[0_0_15px_rgba(155,92,255,0.5)]'
    }
];

processDirectory(path.join('frontend', 'components'), '.tsx', uiReplacements);
processDirectory(path.join('frontend', 'app'), '.tsx', uiReplacements);

console.log('Pastel & Neon SaaS applied successfully!');
