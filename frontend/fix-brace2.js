const fs = require('fs');

let code = fs.readFileSync('C:/Users/Anbarasu/OneDrive/Desktop/miniproject/frontend/components/contacts/ContactDetails.tsx', 'utf8');

const target = "mode=${mode}`);";
const index = code.indexOf(target);
if(index > -1) {
    code = code.substring(0, index + target.length) + "\n       };\n" + code.substring(index + target.length);
    fs.writeFileSync('C:/Users/Anbarasu/OneDrive/Desktop/miniproject/frontend/components/contacts/ContactDetails.tsx', code);
    console.log('Brace fixed with indexof');
} else {
    console.log('Target not found');
}
