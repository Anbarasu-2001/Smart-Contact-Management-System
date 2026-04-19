const fs=require('fs'); let txt=fs.readFileSync('frontend/components/pages/Home.tsx', 'utf8'); let mbs = txt.match(/mb-\d+/g); console.log([...new Set(mbs)]); 
