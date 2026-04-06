const fs = require('fs');
let code = fs.readFileSync('frontend/components/pages/Home.tsx', 'utf8');
code = code.split('title="Welcome back, Sophia!"').join('title={\Welcome back, \!\}');
code = code.split("{user?.name || 'Sophia'}").join("{user?.name || 'User'}");
fs.writeFileSync('frontend/components/pages/Home.tsx', code);
