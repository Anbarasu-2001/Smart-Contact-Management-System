const fs = require('fs');
let txt = fs.readFileSync('frontend/components/pages/Home.tsx', 'utf8');

txt = txt.replace(
    /<div className="chat-window flex-1 min-h-0 overflow-y-auto scroll-smooth p-4" ref=\{chatScrollRef\}>/g,
    '<div className="bg-white/60 backdrop-blur-lg rounded-2xl p-4 flex-1 min-h-0 overflow-y-auto scroll-smooth border border-white/40 shadow-inner mb-4" ref={chatScrollRef}>'
);

txt = txt.replace(
    /className={\`px-4 py-2 rounded-xl max-w-xs shadow-md transition-all duration-200 \$\{isMe \? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-br-sm" : "bg-gray-200 dark:bg-gray-700 text-black dark:text-gray-100 rounded-bl-sm"\}\`}/g,
    'className={`px-4 py-2 rounded-xl shadow transition-all duration-200 ${isMe ? "bg-teal-500 text-white ml-auto" : "bg-white text-gray-800"}`}'
);

fs.writeFileSync('frontend/components/pages/Home.tsx', txt);
console.log('Fixed chat container and bubbles');
