const fs = require('fs');
const glob = require('glob');
const path = require('path');

const replaceInFile = (filePath, replacements) => {
    if (!fs.existsSync(filePath)) {
        console.log(`[WARN] File not found: ${filePath}`);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    for (const {search, replace} of replacements) {
        content = content.replace(search, replace);
    }
    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`[OK] Updated: ${filePath}`);
    } else {
        console.log(`[SKIP] No changes in: ${filePath}`);
    }
};

// 1. Globals.css - Add Poppins Font
const globalsPath = path.join('frontend', 'styles', 'globals.css');
if (fs.existsSync(globalsPath)) {
    let globals = fs.readFileSync(globalsPath, 'utf8');
    if (!globals.includes('Poppins')) {
        globals = `@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');\n` + globals;
        globals += `\nbody { font-family: 'Poppins', sans-serif; }\n`;
        fs.writeFileSync(globalsPath, globals);
        console.log('[OK] Updated globals.css');
    }
}

// 2. AppLayout.tsx
replaceInFile(path.join('frontend', 'components', 'layout', 'AppLayout.tsx'), [
    {
        search: /<div className="bg-\[#0F172A\][^>]+>/g,
        replace: `<div className="flex h-screen font-sans bg-gradient-to-br from-[#e0f7fa] via-[#f3e5f5] to-[#e3f2fd] dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 text-gray-800 dark:text-white">`
    },
    {
        search: /<div className="flex flex-1 w-full">([\s\S]*?)<aside className="hidden lg:block[^>]+>\{sidebar\}<\/aside>\s*<div className="flex-1 lg:ml-\[260px\] flex flex-col min-h-screen">\s*<header className="h-16 flex items-center w-full bg-transparent">\{topbar\}<\/header>\s*<main className="flex-1 w-full flex">\s*<div className="w-full flex-1 !max-w-none ! items-start justify-start">\s*\{children\}\s*<\/div>\s*<aside className="hidden xl:block[^>]+>\{rightPanel\}<\/aside>\s*<\/main>\s*<\/div>\s*<\/div>(\s*<div className="lg:hidden.+?<\/div>\s*<div className="xl:hidden.+?<\/div>\s*<footer.*?>\s*<span>Powered by<\/span>\s*<p className="text-cyan-300">HeroUI<\/p>\s*<\/footer>)/s,
        replace: `<div className="w-64 h-full bg-gradient-to-b from-purple-500 to-blue-500 text-white p-5 rounded-2xl flex flex-col justify-between m-4 shadow-lg shrink-0">\n` +
                 `  {sidebar}\n` +
                 `</div>\n` +
                 `<div className="flex-1 flex flex-col overflow-hidden">\n` +
                 `  <header className="h-20 flex items-center justify-between w-full px-6 py-4">\n` +
                 `    {topbar}\n` +
                 `  </header>\n` +
                 `  <main className="flex-1 p-6 overflow-y-auto">\n` +
                 `    {children}\n` +
                 `  </main>\n` +
                 `</div>`
    }
]);

// 3. Sidebar.tsx
replaceInFile(path.join('frontend', 'components', 'layout', 'Sidebar.tsx'), [
    {
        search: /hover:bg-white\/10 transition-colors/g,
        replace: 'hover:bg-white/20 hover:shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all duration-300'
    },
    {
        search: /bg-teal-[^\s]+ text-teal-[^\s]+/g,
        replace: 'bg-white text-purple-600 shadow-lg'
    },
    {
        search: /p-2 rounded-lg/g,
        replace: 'px-4 py-3 rounded-xl gap-3'
    }
]);

// 4. Topbar.tsx
replaceInFile(path.join('frontend', 'components', 'layout', 'Topbar.tsx'), [
    {
        search: /bg-white\/40 backdrop-blur-md px-6 py-2 w-1\/2 min-w-\[300px\] border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all text-slate-700 placeholder-slate-400 rounded-2xl  hover:shadow-xl hover:shadow-cyan-900\/10 duration-300 /g,
        replace: 'bg-white/60 backdrop-blur-md px-4 py-2 w-1/2 border border-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300 text-gray-700 placeholder-gray-400 rounded-xl shadow-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] '
    },
    {
        search: /bg-slate-[^\s]+/g,
        replace: 'bg-transparent'
    },
    {
        search: /border-b border-slate-200/g,
        replace: 'border-none'
    }
]);

// 5. Replace massive UI on Home.tsx and Dashboard
const replaceGlassCards = (filePath) => {
    replaceInFile(filePath, [
        {
            // Replace simple rounded md cards with Premium glass cards
            search: /bg-white\/5 backdrop-blur-sm border border-white\/10 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300/g,
            replace: 'bg-white/60 backdrop-blur-lg border border-white/40 p-6 rounded-2xl shadow-lg hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all duration-300'
        },
        {
            search: /bg-slate-800\/50/g,
            replace: 'bg-white/60 backdrop-blur-lg shadow-lg'
        },
        {
            search: /border-slate-700/g,
            replace: 'border-white/40'
        },
        {
            // Fix layout
            search: /space-y-6/g,
            replace: 'grid grid-cols-1 md:grid-cols-3 gap-6'
        },
        {
            search: /flex flex-col md:flex-row gap-6/g,
            replace: 'grid grid-cols-3 gap-6'
        }
    ]);
};

glob('frontend/components/pages/**/*.tsx', (err, files) => {
    if (err) throw err;
    files.forEach(f => replaceGlassCards(f));
});
glob('frontend/app/**/*.tsx', (err, files) => {
    if (err) throw err;
    files.forEach(f => replaceGlassCards(f));
});

console.log('Script execution finished.');
