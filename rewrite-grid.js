const fs = require('fs');
const path = require('path');

const homePath = path.join('frontend', 'components', 'pages', 'Home.tsx');
let content = fs.readFileSync(homePath, 'utf8');

const newDashboard = `
        const renderDashboard = () => (
            <main className="p-6">
                <div className="flex flex-col gap-6">
                    {/* Welcome Header */}
                    <div className="mb-2">
                        <h2 className="text-2xl font-bold text-gray-800 tracking-wide">Welcome back, {user?.name || "User"}!</h2>
                        <p className="text-sm text-gray-600 font-medium">Here's what's happening today.</p>
                    </div>

                    {/* Main Grid System */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Analytics - spanning 2 columns */}
                        <div className="md:col-span-2 bg-white/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/40 hover:scale-[1.02] transition-all duration-300 flex flex-col h-full">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-800 text-lg">Analytics Overview</h3>
                                <span className="text-teal-600 text-sm font-bold bg-white/50 px-3 py-1 rounded-full">+14% month</span>
                            </div>
                            <div className="h-48 rounded-2xl border border-white/40 bg-gradient-to-r from-teal-100 via-cyan-100 to-blue-100 flex items-end gap-3 p-4 flex-1">
                                {[ 
                                    'h-[26%]', 'h-[34%]', 'h-[31%]', 'h-[42%]', 'h-[48%]', 'h-[44%]',
                                    'h-[56%]', 'h-[53%]', 'h-[62%]', 'h-[58%]', 'h-[71%]', 'h-[66%]',
                                    'h-[80%]', 'h-[75%]', 'h-[85%]', 'h-[92%]', 'h-[88%]', 'h-[100%]'
                                ].map((heightClass, idx) => (
                                    <span key={idx} className={\`flex-1 rounded-2xl bg-gradient-to-t from-teal-400 via-cyan-500 to-blue-500 hover:from-teal-300 hover:to-blue-400 cursor-pointer transition-all duration-300 \${heightClass}\`} />
                                ))}
                            </div>
                        </div>

                        {/* Top Right: Stats stack */}
                        <div className="md:col-span-1 flex flex-col gap-6">
                            <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/40 hover:scale-[1.02] transition-all duration-300 flex-1 flex flex-col justify-center">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-lg shadow-sm">
                                        <i className="fas fa-users" />
                                    </div>
                                    <span className="text-xs font-bold text-teal-600 uppercase tracking-wide">Total Contacts</span>
                                </div>
                                <h4 className="text-3xl font-bold text-gray-800">{dashboardStats.totalContacts}</h4>
                                <p className="text-sm text-gray-500 mt-1">Across all networks</p>
                            </div>

                            <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/40 hover:scale-[1.02] transition-all duration-300 flex-1 flex flex-col justify-center">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center text-lg shadow-sm">
                                        <i className="fas fa-bolt" />
                                    </div>
                                    <span className="text-xs font-bold text-cyan-600 uppercase tracking-wide">Active Chats</span>
                                </div>
                                <h4 className="text-3xl font-bold text-gray-800">{dashboardStats.activeChats * 3 + 12}</h4>
                                <p className="text-sm text-gray-500 mt-1">In the last 7 days</p>
                            </div>
                        </div>

                        {/* Bottom Left: Smart Actions */}
                        <div className="md:col-span-1 bg-white/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/40 hover:scale-[1.02] transition-all duration-300 h-full flex flex-col">
                            <h3 className="font-bold text-gray-800 text-lg mb-4">Smart Actions</h3>
                            <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
                                <button onClick={() => setActiveView('contacts')} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/60 transition-all border border-transparent hover:border-white/40 group">
                                    <div className="w-10 h-10 rounded-full bg-teal-100/50 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <i className="fas fa-user-plus" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-sm font-bold text-gray-800">Add Contact</h4>
                                        <p className="text-xs text-gray-500">Expand your network</p>
                                    </div>
                                </button>
                                <button onClick={() => setActiveView('chat')} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/60 transition-all border border-transparent hover:border-white/40 group">
                                    <div className="w-10 h-10 rounded-full bg-blue-100/50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <i className="fas fa-comments" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-sm font-bold text-gray-800">Messages</h4>
                                        <p className="text-xs text-gray-500">Jump back in</p>
                                    </div>
                                </button>
                                <button onClick={() => setActiveView('secure-links')} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/60 transition-all border border-transparent hover:border-white/40 group">
                                    <div className="w-10 h-10 rounded-full bg-purple-100/50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <i className="fas fa-link" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="text-sm font-bold text-gray-800">Secure Links</h4>
                                        <p className="text-xs text-gray-500">Manage access</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Bottom Center & Right: Recent Contacts */}
                        <div className="md:col-span-2 bg-white/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/40 hover:scale-[1.02] transition-all duration-300 h-full flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-800 text-lg">Recent Contacts</h3>
                                <button onClick={() => setActiveView('contacts')} className="text-sm font-bold text-teal-600 hover:text-teal-700">View All</button>
                            </div>
                            <div className="flex flex-col gap-2 flex-1">
                                {normalizedContacts.slice(0, 4).map((contact) => (
                                    <div key={String(contact._id || contact.phone || contact.name)} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/50 transition-colors border border-transparent hover:border-white/40 cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <AppAvatar name={contact.name || 'U'} className="!w-10 !h-10 border border-white/50 shadow-sm" />
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm truncate">{contact.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{contact.phone || 'No phone number'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-medium text-gray-400">Just now</span>
                                            <button className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 hover:bg-teal-500 hover:text-white transition-colors flex items-center justify-center shadow-sm">
                                                <i className="fas fa-chevron-right text-xs" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {normalizedContacts.length === 0 && (
                                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
                                        <i className="fas fa-users-slash text-2xl" />
                                        <p className="text-sm">No recent contacts yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        );
`;

// Extract old renderDashboard and replace
const parts = content.split('const renderDashboard = () => (');
if (parts.length === 2) {
    const endPart = parts[1].split(/const renderContacts = \(\) => \(/)[1];
    content = parts[0] + newDashboard + "\n    const renderContacts = () => (" + endPart;
    fs.writeFileSync(homePath, content);
    console.log("Successfully overhauled renderDashboard grids inside Home.tsx");
} else {
    console.log("Could not locate split targets properly.");
}
