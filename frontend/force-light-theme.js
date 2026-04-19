const fs = require('fs');

const path = 'app/providers.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/<NextThemesProvider \{\.\.\.themeProps\}>/, '<NextThemesProvider defaultTheme="light" forcedTheme="light" {...themeProps}>');

fs.writeFileSync(path, content);
console.log('Forced Light Mode in providers.tsx.');
