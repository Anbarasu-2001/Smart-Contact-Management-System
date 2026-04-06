const fs = require('fs');
let code = fs.readFileSync('C:/Users/Anbarasu/OneDrive/Desktop/miniproject/frontend/app/chat/[id]/page.tsx', 'utf8');

code = code.replace(
  "if (msg.senderId === contactId) {",
  "if (String(msg.senderId) === String(contactId) || String(msg.ownerId) === String(contactId) || msg.senderId !== authUser?._id) {"
);

fs.writeFileSync('C:/Users/Anbarasu/OneDrive/Desktop/miniproject/frontend/app/chat/[id]/page.tsx', code);
console.log('Fixed receive message logic');
