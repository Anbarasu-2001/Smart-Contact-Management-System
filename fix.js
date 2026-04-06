
const fs = require('fs');
let code = fs.readFileSync('frontend/app/chat/[id]/page.tsx', 'utf8');
code = code.replace(/<div\[\\\s\\\S]*?className={\lex w-full \\\\}[\s\S]*?<div[\s\S]*?className={\px-4 py-2\.5 max-w-\[75%\] rounded-2xl text-\[15px\] shadow-sm[\s\S]*?\\}/, 
\<div key={msg._id} className={\\\lex \\\ mb-2\\\}>
              <div className={\\\px-4 py-2 rounded-xl max-w-[70%] \\\\}\);
fs.writeFileSync('frontend/app/chat/[id]/page.tsx', code);

