const fs = require('fs');
let content = fs.readFileSync('frontend/components/contacts/ContactDetails.tsx', 'utf-8');
content = content.replace(/router\.push\(\\/chat\/\$\{targetUserId\}\?name=\$\{encodeURIComponent\(current\.name\)\}\\);/g, 'router.push(/chat/?name=);');
content = content.replace(/router\.push\(\\/call\/\$\{targetUserId\}\?name=\$\{encodeURIComponent\(current\.name\)\}&mode=\$\{mode\}\\);/g, 'router.push(/call/?name=&mode=);');
fs.writeFileSync('frontend/components/contacts/ContactDetails.tsx', content);
