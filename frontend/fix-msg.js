const fs = require('fs');

let code = fs.readFileSync('C:/Users/Anbarasu/OneDrive/Desktop/miniproject/server/index.js', 'utf8');

const targetStr = `        _id: message._id,\n          ownerId: message.ownerId,\n          contactId: message.contactId,`;
const replaceStr = `        _id: message._id,\n          ownerId: message.ownerId,\n          senderId: userId,\n          contactId: message.contactId,`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('C:/Users/Anbarasu/OneDrive/Desktop/miniproject/server/index.js', code);
console.log('Fixed server payload');

let frontendCode = fs.readFileSync('C:/Users/Anbarasu/OneDrive/Desktop/miniproject/frontend/components/layout/GlobalSocketListener.tsx', 'utf8');

const checkStr = "if (pathname.includes(`/chat/${msg.senderId}`) || pathname.includes(`/chat/${msg.sender}`)) {\n        return;\n      }";
const replaceCheck = `if (String(msg.senderId) === String(authContext?.user?._id) || String(msg.ownerId) === String(authContext?.user?._id)) {\n        return;\n      }\n\n      if (pathname.includes(\`/chat/\${msg.senderId}\`) || pathname.includes(\`/chat/\${msg.sender}\`)) {\n        return;\n      }`;

frontendCode = frontendCode.replace(checkStr, replaceCheck);
fs.writeFileSync('C:/Users/Anbarasu/OneDrive/Desktop/miniproject/frontend/components/layout/GlobalSocketListener.tsx', frontendCode);
console.log('Fixed frontend listener');
