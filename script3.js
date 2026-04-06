const fs = require('fs');
let code = fs.readFileSync('frontend/app/chat/[id]/page.tsx', 'utf8');

const targetHtml = \<main className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 bg-[#f5f7fa] dark:bg-[#0f172a]">\;

const indexOfMain = code.indexOf(targetHtml);
const indexOfScrollRef = code.indexOf(\<div ref={scrollRef}\, indexOfMain);

if (indexOfMain !== -1 && indexOfScrollRef !== -1) {
    const newCode = \<main className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 bg-[#f5f7fa] dark:bg-[#0f172a]">
        {messages.map((msg) => {
          const myId = authUser?._id;
          const senderId = typeof msg.senderId === 'object' ? msg.senderId?._id : (msg.senderId || msg.sender);
          const isMe = String(senderId) === String(myId) || msg.sender === "user";

          return (
            <div key={msg._id} className={\\\lex \\\ mb-2\\\}>
              <div className={\\\px-4 py-2 rounded-xl max-w-[70%] \\\\\\}>
                <p className="break-words font-normal">{msg.text}</p>
                <span className={\\\	ext-[10px] block text-right font-medium \\\\\\}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl rounded-tl-sm p-3 shadow-sm border border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 font-medium">
              Typing...
            </div>
          </div>
        )}
        \;

    code = code.substring(0, indexOfMain) + newCode + code.substring(indexOfScrollRef);
    fs.writeFileSync('frontend/app/chat/[id]/page.tsx', code);
    console.log("REPLACED EXACT!");
} else {
    console.log("NOT FOUND", indexOfMain, indexOfScrollRef);
}
