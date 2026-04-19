const fs = require('fs');
const txt = fs.readFileSync('frontend/components/pages/Home.tsx', 'utf8');
const renderChatIndex = txt.indexOf('renderChat');
if (renderChatIndex !== -1) {
   console.log(txt.substring(renderChatIndex - 500, renderChatIndex + 5000));
}
