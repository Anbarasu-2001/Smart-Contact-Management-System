const fs = require('fs');

const file = 'frontend/components/pages/Home.tsx';
let data = fs.readFileSync(file, 'utf8');

// Replace the strict string match which fails on Mongoose populated objects
data = data.replace(/String\(message\.senderId\) === String\(user\?\._id\)/g, "String(message.senderId?._id || message.senderId) === String(user?._id)");

fs.writeFileSync(file, data);
console.log("Updated Home.tsx sender mapping!");
