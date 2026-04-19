const fs = require('fs');

const premiumCardClass = "bg-white/70 backdrop-blur-lg border border-white/40 rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300";
const activeBtnClass = "bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-xl px-4 py-2 hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:scale-[1.02] transition-all duration-300";
const rejectBtnClass = "bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl px-4 py-2 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:scale-[1.02] transition-all duration-300";
const acceptBtnClass = "bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl px-4 py-2 hover:shadow-[0_0_15px_rgba(34,197,94,0.5)] hover:scale-[1.02] transition-all duration-300";

function readAndReplace(filePath, replacers) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let orig = content;
    replacers.forEach(r => {
        content = content.replace(r[0], r[1]);
    });
    if (content !== orig) {
        fs.writeFileSync(filePath, content);
        console.log("Updated " + filePath);
    }
}

// 1. Dashboard Insights
readAndReplace('components/dashboard/DashboardInsights.tsx', [
    [/<Card className="[^"]*"/g, '<Card className="' + premiumCardClass + '"'],
    [/className="[^"]*grid grid-cols-[^"]*"/g, 'className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"']
]);

// 2. Chat/Contact Details
readAndReplace('components/contacts/ContactDetails.tsx', [
    [/className="[^"]*flex-1[^"]*p-4[^"]*"/g, 'className="flex-1 flex flex-col gap-6"'],
    [/<div className="flex justify-between items-start mb-6">/g, '<div className="flex justify-between items-start">'],
    [/className="[^"]*bg-gradient-to-r from-cyan-400 to-blue-500[^"]*"/g, 'className="' + activeBtnClass + '"'],
    [/className="[^"]*glass-panel[^"]*"/g, 'className="' + premiumCardClass + '"']
]);

// 3. Call UI
readAndReplace('app/secure-call/[token]/page.tsx', [
    [/className="[^"]*min-h-screen[^"]*"/g, 'className="h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#eef2ff] via-[#f8fafc] to-[#e0f2fe]"'],
    [/<div className="max-w-md[^>]*>/g, '<div className="' + premiumCardClass + ' w-full max-w-lg flex flex-col items-center justify-center text-center gap-6">'],
    [/className="[^"]*bg-green-500[^"]*"/g, 'className="' + acceptBtnClass + '"'],
    [/className="[^"]*bg-red-500[^"]*"/g, 'className="' + rejectBtnClass + '"']
]);

// 4. Secure Links & Generator
readAndReplace('components/pages/ShareGeneratorPage.tsx', [
    [/className="[^"]*glass-card[^"]*"/g, 'className="' + premiumCardClass + ' flex flex-col gap-6"'],
    [/className="[^"]*bg-gradient-to-r from-purple-\d+ to-indigo-\d+[^"]*"/g, 'className="' + activeBtnClass + '"']
]);

// 5. Contacts List
readAndReplace('components/contacts/Contacts.tsx', [
    [/className="[^"]*grid grid-cols-[^"]*"/g, 'className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"'],
    [/className="[^"]*glass-card[^"]*"/g, 'className="' + premiumCardClass + '"']
]);

// 6. Login Page
readAndReplace('components/auth/Login.tsx', [
    [/className="[^"]*min-h-screen[^"]*"/g, 'className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#eef2ff] via-[#f8fafc] to-[#e0f2fe]"'],
    [/className="[^"]*glass-panel[^"]*w-full max-w-md[^"]*"/g, 'className="' + premiumCardClass + ' w-full max-w-md flex flex-col gap-6"'],
    [/className="[^"]*bg-gradient-to-r from-cyan-500 to-blue-600[^"]*"/g, 'className="' + activeBtnClass + ' w-full"']
]);

// 7. Forms and Inputs globally
readAndReplace('components/design/PremiumInput.tsx', [
    [/className="[^"]*bg-white\/10[^"]*"/g, 'className="w-full bg-white/70 backdrop-blur-sm px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none text-gray-800"']
]);

console.log('Final SaaS styling pass complete!');
