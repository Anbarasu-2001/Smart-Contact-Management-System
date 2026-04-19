const fs = require('fs');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.css')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('.');

// 1. Process CSS
const cssPath = 'styles/globals.css';
if (fs.existsSync(cssPath)) {
    let css = fs.readFileSync(cssPath, 'utf8');

    // Force background and card colors globally to the premium SaaS theme
    // We overwrite :root and .dark to be identical to avoid theme flashes
    const premiumVars = `
:root, .dark {
    --background: 210 40% 98%;
    --foreground: 222.2 47.4% 11.2%;
    --radius: 1rem; /* rounded-2xl */
    --bg-gradient: linear-gradient(to bottom right, #eef2ff, #f8fafc, #e0f2fe);
    --sidebar-gradient: linear-gradient(to bottom, #4f46e5, #3b82f6);
    --card-bg: rgba(255, 255, 255, 0.7);
    --card-border: rgba(255, 255, 255, 0.4);
    --primary: #6366f1; /* indigo-500 */
    --accent: #3b82f6; /* blue-500 */
    --neon-shadow: 0 0 15px rgba(99, 102, 241, 0.5);
    --text-main: #1f2937; /* gray-800 */
    --text-sec: #6b7280; /* gray-500 */
}

body {
    background: var(--bg-gradient);
    color: var(--text-main);
    font-family: 'Poppins', sans-serif;
    min-height: 100vh;
    margin: 0;
    overflow: hidden;
}

body::before, body::after, .app-nebula {
    display: none !important; /* Remove dark mode glowing orbs */
}`;

    // Replace :root, .dark, body layers in css
    css = css.replace(/:root\s*{[^}]*}/g, '');
    css = css.replace(/\.dark\s*{[^}]*}/g, '');
    css = css.replace(/body\s*{[^}]*}/g, '');
    css = css.replace(/body::before\s*{[^}]*}/g, '');
    css = css.replace(/body::after\s*{[^}]*}/g, '');
    css = css.replace(/\.app-nebula\s*{[^}]*}/g, '');
    css = css.replace(/@layer base\s*{[^}]*body\s*{[^}]*}[^}]*}/g, ''); /* remove layer base body */
    
    // Modify standard classes
    css = css.replace(/\.glass-card\s*{[^}]*}/g, `.glass-card {
    @apply bg-white/70 backdrop-blur-lg border border-white/40 shadow-md rounded-2xl transition-all duration-300 ease-in-out;
}
.glass-card:hover {
    @apply shadow-xl scale-[1.02];
}`);

    css = css.replace(/\.glass-panel\s*{[^}]*}/g, `.glass-panel {
    @apply bg-white/70 backdrop-blur-lg border border-white/40 shadow-md rounded-2xl transition-all duration-300 ease-in-out;
}`);

    css = css.replace(/\.glass-panel-strong\s*{[^}]*}/g, `.glass-panel-strong {
    @apply bg-white/70 backdrop-blur-lg border border-white/40 shadow-md rounded-2xl transition-all duration-300 ease-in-out;
}`);

    css = css.replace(/\.futuristic-shell\s*{[^}]*}/g, `.futuristic-shell {
    display: flex;
    height: 100vh;
    overflow: hidden;
}`);

    css = css.replace(/\.saas-topbar\s*{[^}]*}/g, `.saas-topbar {
    @apply bg-white/70 backdrop-blur-lg border border-white/40 shadow-sm rounded-2xl p-4 flex justify-between items-center transition-all duration-300;
}`);

    css = css.replace(/\.quick-action-card\s*{[^}]*}/g, `.quick-action-card {
    @apply bg-white/70 backdrop-blur-lg border border-white/40 shadow-md rounded-2xl p-5 transition-all duration-300 ease-in-out text-gray-800;
}
.quick-action-card:hover {
    @apply shadow-xl scale-[1.02];
}`);

    // prepend premiumVars
    fs.writeFileSync(cssPath, premiumVars + '\n' + css);
    console.log('Processed globals.css');
}

// 2. Clean up React components - replace specific backgrounds, dark modes, text colors
files.forEach(file => {
    if (!file.endsWith('.tsx') && !file.endsWith('.jsx')) return;
    let content = fs.readFileSync(file, 'utf8');
    let orig = content;

    // Remove dark mode specific classes completely
    content = content.replace(/dark:[^\s"'}]+/g, '');
    
    // Replace text colors
    content = content.replace(/text-slate-\d+/g, 'text-gray-500');
    content = content.replace(/text-cyan-\d+/g, 'text-indigo-500');
    content = content.replace(/text-teal-\d+/g, 'text-blue-500');
    content = content.replace(/text-white/g, 'text-gray-800'); // Note: some buttons might need white text, we'll fix it if needed

    // Backgrounds - anything starting with bg-slate or bg-gray or bg-cyan -> remove or map
    content = content.replace(/bg-slate-\d+(\/\d+)?/g, '');
    content = content.replace(/bg-gray-\d+(\/\d+)?/g, '');

    // Common layout cleanup
    content = content.replace(/min-h-screen/g, 'h-screen overflow-hidden');
    content = content.replace(/min-h-\[calc[^]+?\]/g, 'flex-1 overflow-y-auto');

    // Remove mt-/mb- and use gap
    content = content.replace(/\bmt-\d+\b/g, '');
    content = content.replace(/\bmb-\d+\b/g, '');
    content = content.replace(/\bmy-\d+\b/g, '');

    // Sidebar exact match replacement:
    if (file.includes('Sidebar.tsx')) {
        content = content.replace(/className=(['"{])(.*?)w-64([\s\S]*?)(['"}])/g, 'className="w-64 h-full bg-gradient-to-b from-indigo-500 to-blue-500 text-white p-5 flex flex-col justify-between rounded-r-3xl"');
        content = content.replace(/className=(['"{])(.*?)alien-nav-item([\s\S]*?)(['"}])/g, 'className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/20 hover:scale-[1.02] transition-all text-white font-semibold"');
        content = content.replace(/className=(['"{])(.*?)alien-nav-item active([\s\S]*?)(['"}])/g, 'className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white text-indigo-600 shadow-lg hover:scale-[1.02] transition-all font-semibold"');
        content = content.replace(/text-gray-800/g, 'text-white'); // Fix sidebar text color being overriden by global rule
    }

    if (file.includes('Navbar.tsx') || file.includes('navbar.tsx')) {
        content = content.replace(/className=(['"{])(.*?)topbar-search([\s\S]*?)(['"}])/g, 'className="bg-white/70 backdrop-blur-md px-4 py-2 rounded-xl w-1/2 shadow-sm border border-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-400"');
    }

    if (file.includes('Home.tsx')) {
        // Enforce grid grid-cols-3 gap-6 for dashboard content
        if (!content.includes('grid-cols-3 gap-6')) {
            content = content.replace(/grid-cols-1 md:grid-cols-2( xl:grid-cols-4)?/g, 'grid-cols-3');
        }
    }

    if (orig !== content) {
        fs.writeFileSync(file, content);
        console.log('Processed: ' + file);
    }
});

console.log('UI Overhaul Script Finished!');