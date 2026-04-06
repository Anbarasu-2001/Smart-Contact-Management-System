const fs = require('fs');

let code = fs.readFileSync('C:/Users/Anbarasu/OneDrive/Desktop/miniproject/frontend/app/chat/[id]/page.tsx', 'utf8');

const mainStart = '<main className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 bg-[#f5f7fa] dark:bg-[#0f172a]">';
const newMainStart = '<main className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-[#f5f7fa] dark:bg-[#0f172a]">';

code = code.replace(mainStart, newMainStart);

const findStart = ' className=\n                "flex " + (isMe ? "justify-end" : "justify-start") + " mb-2"\n              }';
const end = '              </div>{" "}\n            </div>';
let targetIndex = code.indexOf('<div\n              key={msg._id}');
let endIndex = code.indexOf(end, targetIndex);

if (targetIndex > -1 && endIndex > -1) {
    const replaceBlock = `            <div key={msg._id} className={\`flex \${isMe ? "justify-end" : "justify-start"}\`}>
              <div className={\`max-w-[80%] md:max-w-xs p-3 rounded-xl \${isMe ? "bg-blue-500 text-white rounded-br-sm" : "bg-gray-200 text-black rounded-bl-sm dark:bg-gray-700 dark:text-white"}\`}>
                <div className="break-words font-normal text-[0.95rem] leading-snug">{msg.text}</div>
                <div className={\`text-[10px] text-right mt-1 \${isMe ? "text-blue-200" : "text-gray-500 dark:text-gray-400"}\`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>`;
            
    code = code.substring(0, targetIndex) + replaceBlock + code.substring(endIndex + end.length);
    fs.writeFileSync('C:/Users/Anbarasu/OneDrive/Desktop/miniproject/frontend/app/chat/[id]/page.tsx', code);
    console.log('UI Updated');
} else {
    // Try simpler replace
    const codeChunk = `            <div
              key={msg._id}
              className={
                "flex " + (isMe ? "justify-end" : "justify-start") + " mb-2"
              }
            >
              {" "}
              <div
                className={
                  "px-4 py-2 rounded-xl max-w-[70%] " +
                  (isMe
                    ? "bg-blue-500 text-white rounded-tr-sm"
                    : "bg-white dark:bg-[#1e293b] text-[#1f2937] dark:text-[#e2e8f0] rounded-tl-sm border border-slate-100 dark:border-slate-800")
                }
              >
                {" "}
                <p className="break-words font-normal">{msg.text}</p>{" "}
                <span
                  className={
                    "text-[10px] block text-right font-medium " +
                    (isMe
                      ? "text-blue-200"
                      : "text-slate-400 dark:text-slate-500")
                  }
                >
                  {" "}
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                </span>{" "}
              </div>{" "}
            </div>`;
    
    const replaceBlock = `            <div key={msg._id} className={\`flex \${isMe ? "justify-end" : "justify-start"}\`}>
              <div className={\`max-w-[80%] md:max-w-xs p-3 rounded-xl \${isMe ? "bg-blue-500 text-white rounded-br-sm shadow-sm" : "bg-gray-200 text-black rounded-bl-sm shadow-sm dark:bg-gray-700 dark:text-white"}\`}>
                <div className="break-words font-normal text-[0.95rem] leading-snug">{msg.text}</div>
                <div className={\`text-[10px] text-right mt-1 \${isMe ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}\`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>`;
            
    code = code.replace(codeChunk, replaceBlock);
    fs.writeFileSync('C:/Users/Anbarasu/OneDrive/Desktop/miniproject/frontend/app/chat/[id]/page.tsx', code);
    console.log('UI Updated 2');
}
