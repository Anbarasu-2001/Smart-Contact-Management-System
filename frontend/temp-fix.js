const fs = require('fs');

function processFile(file) {
  let text = fs.readFileSync(file, 'utf8');
  // Remove all margins (mt-*, mb-*, ml-*, mr-*, my-*, mx-*, m-*) unless they're mx-auto or my-auto
  text = text.replace(/\bm[trblxy]?-(\d+|px|1\.5|2\.5)\b/g, '');
  
  // Replace space-y-* with flex flex-col gap-4 or gap-6
  text = text.replace(/space-y-\d+/g, function(match) {
      return 'flex flex-col gap-6';
  });
  
  // Clean up multiple spaces left by regex
  text = text.replace(/\s+(?=(?:\w|-))/g, ' ');
  
  // Remove trailing spaces inside classNames
  text = text.replace(/\s+"/g, '"');

  fs.writeFileSync(file, text);
}

const files = [
  'components/auth/Login.tsx', 
  'components/auth/Register.tsx',
  'components/pages/Home.tsx',
  'components/pages/ShareGeneratorPage.tsx',
  'components/contacts/Contacts.tsx',
  'components/contacts/ContactDetails.tsx',
  'components/layout/AppLayout.tsx'
];

files.forEach(f => { 
  if(fs.existsSync(f)) {
    processFile(f); 
    console.log('Fixed ' + f);
  }
});
