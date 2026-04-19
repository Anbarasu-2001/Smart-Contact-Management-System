const fs = require('fs');
const path = 'frontend/components/pages/Home.tsx';
let code = fs.readFileSync(path, 'utf8');

const replacements = [
    [/bg-white shadow rounded-lg/g, 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl'],
    [/bg-white shadow-md rounded-lg/g, 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl'],
    [/bg-white rounded-lg shadow/g, 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl'],
    [/bg-white dark:bg-slate-800 rounded-lg shadow-md/g, 'bg-[rgba(255,255,255,0.6)] dark:bg-[rgba(15,23,42,0.6)] backdrop-blur-xl border border-white/40 outline outline-1 outline-white/20 rounded-3xl shadow-2xl'],
    [/bg-white\\\/5 backdrop-blur-lg/g, 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40'],
    [/bg-indigo-600 hover:bg-indigo-700/g, 'bg-gradient-to-r from-[#00F5FF]/80 to-[#9B5CFF]/80 hover:from-[#00F5FF] hover:to-[#9B5CFF] hover:shadow-[0_0_20px_rgba(155,92,255,0.4)] shadow-lg'],
    [/bg-blue-600 hover:bg-blue-700/g, 'bg-gradient-to-r from-[#00F5FF]/80 to-[#9B5CFF]/80 hover:shadow-[0_0_20px_rgba(155,92,255,0.4)]'],
    [/text-indigo-600/g, 'text-transparent bg-clip-text bg-gradient-to-r from-[#00F5FF] to-[#9B5CFF]'],
    [/text-blue-600/g, 'text-transparent bg-clip-text bg-gradient-to-r from-[#00F5FF] to-[#9B5CFF]'],
    [/text-indigo-500/g, 'text-transparent bg-clip-text bg-gradient-to-r from-[#00F5FF] to-[#9B5CFF]'],
    [/bg-indigo-50 text-indigo-700/g, 'bg-[#00F5FF]/10 text-[#00F5FF] backdrop-blur-sm'],
    [/bg-blue-50 text-blue-700/g, 'bg-[#9B5CFF]/10 text-[#9B5CFF] backdrop-blur-sm'],
    [/bg-indigo-50/g, 'bg-[#00F5FF]/10 backdrop-blur-sm'],
    [/bg-blue-50/g, 'bg-[#9B5CFF]/10 backdrop-blur-sm'],
    [/rounded-md/g, 'rounded-2xl'],
    [/rounded-lg/g, 'rounded-3xl'],
    [/bg-indigo-500 text-white/g, 'bg-gradient-to-r from-[#00F5FF] to-[#9B5CFF] text-white shadow-md'],
    [/bg-gray-100 dark:bg-gray-700/g, 'bg-[rgba(255,255,255,0.4)] dark:bg-[rgba(30,41,59,0.4)] backdrop-blur-md border border-white/20'],
    [/bg-gray-50 dark:bg-gray-800/g, 'bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/20'],
    [/bg-gray-50/g, 'bg-white/40 dark:bg-slate-800/40 backdrop-blur-md'],
    [/bg-white dark:bg-gray-800 border-b/g, 'bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 border-b'],
    [/bg-gray-900 rounded-3xl overflow-hidden/g, 'bg-gray-900/90 backdrop-blur-3xl rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(0,245,255,0.2)]']
];

replacements.forEach(([regex, replace]) => {
    code = code.replace(regex, replace);
});

fs.writeFileSync(path, code);
console.log('UI updated for Home.tsx');