const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, searchReplaceList) {
    if (!fs.existsSync(filePath)) {
        console.log("File not found: " + filePath);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    for (const item of searchReplaceList) {
        content = content.replace(item.search, item.replace);
    }
    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log('Updated: ' + filePath);
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

// 1. Layout
replaceInFile(path.join('frontend', 'components', 'layout', 'AppLayout.tsx'), [
    {
        search: /<div className=\"bg-\[#0F172A\].*?flex flex-col\">/s,
        replace: '<div className=\"flex h-screen font-sans bg-gradient-to-br from-[#e0f7fa] via-[#f3e5f5] to-[#e3f2fd] dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 text-gray-800 dark:text-white\">'
    },
    {
        search: /<div className=\"flex flex-1 w-full\">([\s\S]*?)<footer.*?>\s*<span>Powered by<\/span>\s*<p className=\"text-cyan-300\">HeroUI<\/p>\s*<\/footer>\s*<\/div>/s,
        replace: '<aside className=\"w-64 h-full bg-gradient-to-b from-purple-500 to-blue-500 text-white p-5 rounded-2xl flex flex-col justify-between m-4 shadow-lg shrink-0 z-50\">{sidebar}</aside>' +
                 '<div className=\"flex-1 flex flex-col h-screen overflow-hidden\">' +
                 '<header className=\"h-20 flex items-center justify-between w-full px-6 py-4\">{topbar}</header>' +
                 '<main className=\"flex-1 p-6 overflow-y-auto\"><div className=\"grid gap-6 mx-auto w-full\">{children}</div></main>' +
                 '</div></div>'
    }
]);

// 2. Sidebar
replaceInFile(path.join('frontend', 'components', 'layout', 'Sidebar.tsx'), [
    { search: /p-2 rounded-lg/g, replace: 'px-4 py-3 gap-3 rounded-xl' },
    { search: /hover:bg-white\/10 transition-colors/g, replace: 'hover:bg-white/20 hover:shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all duration-300' },
    { search: /bg-teal-[^\s]+/g, replace: 'bg-white' },
    { search: /text-teal-[^\s]+/g, replace: 'text-purple-600 shadow-lg' },
]);

// 3. Topbar
replaceInFile(path.join('frontend', 'components', 'layout', 'Topbar.tsx'), [
    { search: /bg-white\/40 backdrop-blur-md px-6 py-2 w-1\/2 min-w-\[300px\] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all text-slate-700 placeholder-slate-400 rounded-2xl  hover:shadow-xl hover:shadow-cyan-900\/10/g,
      replace: 'bg-white/60 backdrop-blur-md px-4 py-2 w-1/2 border border-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300 text-gray-700 placeholder-gray-400 rounded-xl shadow-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]'
    },
    { search: /px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/g,
      replace: 'bg-transparent border-0 px-0 py-0 w-full flex items-center justify-between'
    }
]);

// 4. Globals.css
const globalsPath = path.join('frontend', 'styles', 'globals.css');
if (fs.existsSync(globalsPath)) {
    let content = fs.readFileSync(globalsPath, 'utf8');
    if (!content.includes('Poppins')) {
        content = `@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');\n` + content;
        content += `\nbody { font-family: 'Poppins', sans-serif !important; }\n`;
        fs.writeFileSync(globalsPath, content);
        console.log('Updated: ' + globalsPath);
    }
}

// 5. Global Spacing & Layout replace
const uiReplacements = [
    // Margins (Remove most, ensure gap is used)
    { search: /mt-\d+/g, replace: '' },
    { search: /mb-\d+/g, replace: '' },
    { search: /my-\d+/g, replace: '' },
    
    // Border Radius
    { search: /rounded-md/g, replace: 'rounded-2xl' },
    { search: /rounded-lg/g, replace: 'rounded-2xl' },
    { search: /rounded-xl/g, replace: 'rounded-2xl' },
    { search: /rounded-3xl/g, replace: 'rounded-2xl' },
    { search: /rounded-full/g, replace: 'rounded-full' }, // keep full
    
    // Cards
    { search: /bg-white\/5 backdrop-blur-sm border border-white\/10 p-6 shadow-xl hover:shadow-2xl transition-all duration-300/g,
      replace: 'bg-white/60 backdrop-blur-lg rounded-2xl p-6 border border-white/40 shadow-lg hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all duration-300' },
    { search: /bg-slate-800\/50/g, replace: 'bg-white/60 backdrop-blur-lg border border-white/40 shadow-lg hover:scale-[1.02] transition-all rounded-2xl' },
    
    // Fix flex/grid spaces
    { search: /space-y-/g, replace: 'gap-' },
    { search: /space-x-/g, replace: 'gap-' },
];

processDirectory(path.join('frontend', 'components'), '.tsx', uiReplacements);
processDirectory(path.join('frontend', 'app'), '.tsx', uiReplacements);

console.log('Premium SaaS applied');