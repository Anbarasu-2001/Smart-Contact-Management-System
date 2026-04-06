const fs = require('fs');
let code = fs.readFileSync('frontend/app/chat/[id]/page.tsx', 'utf8');

const regex = /<main className="flex-1 overflow-y-auto.*?>[\s\S]*?<div ref=\{scrollRef\}/g;

const newCode = '<main className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 bg-[#f5f7fa] dark:bg-[#0f172a]">\n' +
'        {messages.map((msg) => {\n' +
'          const myId = authUser?._id;\n' +
'          const senderId = typeof msg.sender === "object" ? msg.sender?._id : (msg.senderId || msg.sender);\n' +
'          const isMe = String(senderId) === String(myId) || msg.sender === "user";\n' +
'          return (\n' +
'            <div key={msg._id} className={\lex \ mb-2\}>\n' +
'              <div className={\px-4 py-2 rounded-xl max-w-[70%] \\}>\n' +
'                <p className="break-words font-normal">{msg.text}</p>\n' +
'                <span className={\	ext-[10px] block text-right font-medium \\}>\n' +
'                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}\n' +
'                </span>\n' +
'              </div>\n' +
'            </div>\n' +
'          );\n' +
'        })}\n' +
'        {isTyping && (\n' +
'          <div className="flex justify-start">\n' +
'            <div className="bg-white dark:bg-[#1e293b] rounded-2xl rounded-tl-sm p-3 shadow-sm border border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 font-medium">\n' +
'              Typing...\n' +
'            </div>\n' +
'          </div>\n' +
'        )}\n' +
'        <div ref={scrollRef}';

code = code.replace(regex, newCode);
fs.writeFileSync('frontend/app/chat/[id]/page.tsx', code);
console.log('Done!');
