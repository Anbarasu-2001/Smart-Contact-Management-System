const fs = require('fs');
let code = fs.readFileSync('C:/Users/Anbarasu/OneDrive/Desktop/miniproject/frontend/components/layout/GlobalSocketListener.tsx', 'utf8');

code = code.replace("callSound?.play();", "(callSound as any)?.play();");

fs.writeFileSync('C:/Users/Anbarasu/OneDrive/Desktop/miniproject/frontend/components/layout/GlobalSocketListener.tsx', code);
console.log('TypeScript issue fixed');
