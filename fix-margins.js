const fs = require('fs');

const filesToProcess = [
    'frontend/components/pages/Home.tsx',
    'frontend/components/layout/AppLayout.tsx',
    'frontend/components/layout/Topbar.tsx',
    'frontend/components/layout/Sidebar.tsx'
];

for (const file of filesToProcess) {
    if (!fs.existsSync(file)) continue;
    
    let txt = fs.readFileSync(file, 'utf8');

    // Remove all explicit mt-X, mb-X, my-X
    txt = txt.replace(/\\s*m[tby]-\\d+\\b/g, '');
    
    // Convert 'space-y-X' to 'flex flex-col gap-X' or simply to 'gap-X' if already flex flex-col
    // But since the generic rule is Use ONLY gap-4 or gap-6... let's just obliterate 'space-y-'
    txt = txt.replace(/\\s*space-y-\\d+\\b/g, '');
    
    fs.writeFileSync(file, txt);
    console.log('Fixed margins in:', file);
}
