const fs = require('fs');
const glob = require('glob');
const files = glob.sync('frontend/**/*.tsx', { ignore: ['frontend/.next/**'] });

for (const file of files) {
   let txt = fs.readFileSync(file, 'utf8');
   let original = txt;
   
   // Specific Chat styling patches
   txt = txt.replace(/bg-gradient-to-r from-\[#00F5FF\] to-\[#9B5CFF\]\/15 border-cyan-400\/20 text-right/g, 'bg-gradient-to-r from-[#00F5FF] to-[#9B5CFF] text-white text-right');
   txt = txt.replace(/bg-slate-[78]00\/[567]0 border-slate-[56]00\/30 text-left/g, 'bg-white text-gray-900 border text-left');
   
   if (txt !== original) {
       fs.writeFileSync(file, txt);
       console.log('Fixed chat messages in', file);
   }
}
