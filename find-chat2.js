const fs = require('fs');
const txt = fs.readFileSync('frontend/components/pages/Home.tsx', 'utf8');

const match1 = txt.match(/activeView === ['"]chat['"]/);
console.log('Match1 (activeView === chat):', match1 ? match1.index : 'none');

const match2 = txt.match(/renderChat/);
console.log('Match2 (renderChat):', match2 ? match2.index : 'none');

const match3 = txt.match(/chatRoomId/);
console.log('Match3 (chatRoomId):', match3 ? match3.index : 'none');
