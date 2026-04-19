const fs = require('fs');

const cssPath = 'styles/globals.css';
let css = fs.readFileSync(cssPath, 'utf8');

// Replace the old chat UI styles entirely the prompt's request
const replacement = `/* Chat UI */
.chat-window {
    @apply flex flex-col gap-4 overflow-y-auto p-4 rounded-2xl border border-white/40 bg-white/70 backdrop-blur-lg shadow-md h-[60vh];
}

.message-row {
    @apply flex w-full;
}

.message-row.is-me {
    @apply justify-end;
}

.message-row.is-them {
    @apply justify-start;
}

.message-bubble {
    @apply max-w-xs px-4 py-2 rounded-xl shadow relative;
}

.message-row.is-me .message-bubble {
    @apply bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-br-sm;
}

.message-row.is-them .message-bubble {
    @apply bg-gray-100 border border-white/40 text-gray-800 rounded-bl-sm;
}
`;
css = css.replace(/\/\* Chat UI \*\/[\s\S]*?(?=\/\* Avatar Utilities \*\/|$)/g, replacement);

fs.writeFileSync(cssPath, css);
console.log('Chat CSS replaced.');
