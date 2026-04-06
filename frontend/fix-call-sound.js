const fs = require('fs');

let code = fs.readFileSync('C:/Users/Anbarasu/OneDrive/Desktop/miniproject/frontend/components/layout/GlobalSocketListener.tsx', 'utf8');

code = code.replace(/callSound\?\.stop\(\)/g, '(callSound as any)?.stop()');
code = code.replace(/notifySound\?\.stop\(\)/g, '(notifySound as any)?.stop()');

fs.writeFileSync('C:/Users/Anbarasu/OneDrive/Desktop/miniproject/frontend/components/layout/GlobalSocketListener.tsx', code);
console.log('TypeScript errors fixed');
