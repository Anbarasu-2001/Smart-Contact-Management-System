const fs = require('fs');
const file = 'C:/Users/Anbarasu/OneDrive/Desktop/miniproject/frontend/app/chat/[id]/page.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "typeof msg.sender === \"object\"",
  "typeof msg.senderId === \"object\""
);

code = code.replace(
  "? msg.sender?._id",
  "? (msg.senderId as any)?._id"
);

fs.writeFileSync(file, code);
console.log('TypeScript issue fixed');
