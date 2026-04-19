const fs = require('fs');
const glob = require('glob');
const files = glob.sync('frontend/**/*.{tsx,ts,js}', { ignore: ['frontend/.next/**'] });

for (const file of files) {
   let txt = fs.readFileSync(file, 'utf8');
   let original = txt;
   
   // Chat styling logic across any file
   // Sender: text-white on gradient bg
   // Receiver: text-gray-900 on white bg
   
   // For the specific string we found in ContactDetails.tsx
   txt = txt.replace(/bg-gradient-to-r from-\[#00F5FF\] to-\[#9B5CFF\]\/15 border-cyan-400\/20 text-right/g, 'bg-gradient-to-r from-[#00F5FF] to-[#9B5CFF] text-white text-right');
   txt = txt.replace(/bg-slate-[78]00\/70 border-slate-[56]00\/30 text-left/g, 'bg-white text-gray-900 border text-left');

   // Replace text-white/50, text-white/60, text-white/70 with text-gray-900 generally on light/glass components
   txt = txt.replace(/text-white\/[4567]0/g, 'text-gray-900');
   txt = txt.replace(/text-gray-[34]00/g, 'text-gray-800');
   txt = txt.replace(/text-slate-[34]00/g, 'text-gray-800');

   if (txt !== original) {
       fs.writeFileSync(file, txt);
       console.log('Final polish in', file);
   }
}
