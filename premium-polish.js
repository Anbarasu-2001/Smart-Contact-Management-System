const fs = require('fs');

const files = [
    'frontend/components/pages/Home.tsx',
    'frontend/components/layout/Sidebar.tsx',
    'frontend/components/layout/Topbar.tsx'
];

files.forEach(f => {
    try {
        let txt = fs.readFileSync(f, 'utf8');
        let count = 0;
        
        // Regex to match className attributes
        txt = txt.replace(/className=(['"])(.*?)\1/g, (match, quote, cls) => {
            let classes = new Set(cls.split(/\s+/));
            let needsPolish = false;

            // Target glassmorphism panels, teal buttons, and significant containers
            if (classes.has('bg-white/60') || classes.has('bg-white/80') || 
                classes.has('backdrop-blur-lg') || classes.has('backdrop-blur-md') ||
                classes.has('bg-teal-500') || classes.has('bg-teal-600')) {
                needsPolish = true;
            }

            // Exclude full screen wrappers, inputs, tiny things
            if (classes.has('min-h-screen') || classes.has('outline-none') || classes.has('input')) {
                needsPolish = false;
            }

            if (needsPolish) {
                // Remove existing conflicting border radius & shadow classes
                for (let c of classes) {
                    if (c.startsWith('rounded-') && c !== 'rounded-2xl') classes.delete(c);
                    if (c.startsWith('shadow-') && !['shadow-lg', 'shadow-xl'].includes(c)) classes.delete(c);
                    if (c === 'rounded') classes.delete(c);
                    if (c === 'shadow') classes.delete(c);
                    if (c === 'transition') classes.delete(c);
                }

                // Add requested classes
                classes.add('rounded-2xl');
                classes.add('shadow-lg');
                classes.add('hover:shadow-xl');
                classes.add('transition-all');
                classes.add('duration-300');
                
                // Add hover scale but don't duplicate
                classes.add('hover:scale-[1.02]');
                
                // Ensure no double values
                count++;
                return `className=${quote}${Array.from(classes).join(' ')}${quote}`;
            }

            return match;
        });

        console.log(`Replaced ${count} items in ${f}`);
        fs.writeFileSync(f, txt);
    } catch(e) {
        console.log(`Error reading $f: ${e.message}`);
    }
});