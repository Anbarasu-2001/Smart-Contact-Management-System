const fs = require('fs');

const replacement = '<main className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 bg-[#f5f7fa] dark:bg-[#0f172a]">' + 
'        {messages.map((msg) => {' +
'          const myId = authUser?._id;' +
'          const senderId = typeof msg.sender === "object" ? msg.sender?._id : (msg.senderId || msg.sender);' +
'          const isMe = String(senderId) === String(myId) || msg.sender === "user";' +
'          return (' +
'            <div key={msg._id} className={"flex " + (isMe ? "justify-end" : "justify-start") + " mb-2"}>' +
'              <div className={"px-4 py-2 rounded-xl max-w-[70%] " + (isMe ? "bg-blue-500 text-white rounded-tr-sm" : "bg-white dark:bg-[#1e293b] text-[#1f2937] dark:text-[#e2e8f0] rounded-tl-sm border border-slate-100 dark:border-slate-800")}>' +
'                <p className="break-words font-normal">{msg.text}</p>' +
'                <span className={"text-[10px] block text-right font-medium " + (isMe ? "text-blue-200" : "text-slate-400 dark:text-slate-500")}>' +
'                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}' +
'                </span>' +
'              </div>' +
'            </div>' +
'          );' +
'        })}' +
'        {isTyping && (' +
'          <div className="flex justify-start">' +
'            <div className="bg-white dark:bg-[#1e293b] rounded-2xl rounded-tl-sm p-3 shadow-sm border border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 font-medium">' +
'              Typing...' +
'            </div>' +
'          </div>' +
'        )}' +
'        <div ref={scrollRef} className="h-2"></div>' +
'      </main>';

let content = fs.readFileSync('frontend/app/chat/[id]/page.tsx', 'utf-8');

content = content.replace(/<main className="flex-1 overflow-y-auto(.|\n)*?<div ref=\{scrollRef\} className="h-2"><\/div>\n.*?<\/main>/gm, replacement);

fs.writeFileSync('frontend/app/chat/[id]/page.tsx', content);
