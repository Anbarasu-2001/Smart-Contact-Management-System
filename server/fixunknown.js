const fs = require('fs');
const path = 'C:/Users/Anbarasu/OneDrive/Desktop/miniproject/frontend/components/pages/Home.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/'Unknown User'/g, "'Loading...'")
                 .replace(/"Unknown User"/g, '"Loading..."');
fs.writeFileSync(path, content);
console.log('Fixed Unknown User');
