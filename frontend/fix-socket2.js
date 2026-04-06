const fs = require('fs');

const path = 'C:/Users/Anbarasu/OneDrive/Desktop/miniproject/frontend/components/layout/GlobalSocketListener.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/notifySound\?\.play\(\);/g, '(notifySound as any)?.play();');

fs.writeFileSync(path, code);
console.log('Fixed type error again');
