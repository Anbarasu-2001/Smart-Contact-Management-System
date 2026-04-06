const fs = require('fs');
let code = fs.readFileSync('frontend/components/pages/Home.tsx', 'utf8');
code = code.replace(/title.*Welcome back.*!}/g, 'title={\Welcome back, \!\}');
fs.writeFileSync('frontend/components/pages/Home.tsx', code);
