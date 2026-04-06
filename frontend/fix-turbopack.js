const fs = require('fs');
const path = require('path');

const chatFile = path.resolve('app/chat/[id]/page.tsx');
let code = fs.readFileSync(chatFile, 'utf8');

code = code.replace('export const dynamic = "force-dynamic";', '');

fs.writeFileSync(chatFile, code, 'utf8');
console.log('Fixed chat page Turbopack error issue. export dynamic removed from client component.');
