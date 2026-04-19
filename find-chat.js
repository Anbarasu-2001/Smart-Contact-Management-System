const fs = require('fs');
const txt = fs.readFileSync('frontend/components/pages/Home.tsx', 'utf8');
const chatIndex = txt.indexOf('activeView === \'chat\'');
if (chatIndex !== -1) {
   console.log('Found chat view at:', chatIndex);
   console.log(txt.substring(chatIndex - 50, chatIndex + 4000));
} else {
   console.log('Not found');
}
