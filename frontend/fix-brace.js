const fs = require('fs');

let code = fs.readFileSync('C:/Users/Anbarasu/OneDrive/Desktop/miniproject/frontend/components/contacts/ContactDetails.tsx', 'utf8');

code = code.replace(
  "router.push(`/call/${id}?name=${encodeURIComponent(current.name)}&mode=${mode}`);\n    return (",
  "router.push(`/call/${id}?name=${encodeURIComponent(current.name)}&mode=${mode}`);\n    };\n\n    return ("
);

fs.writeFileSync('C:/Users/Anbarasu/OneDrive/Desktop/miniproject/frontend/components/contacts/ContactDetails.tsx', code);
console.log('Brace fixed');
