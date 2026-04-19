const fs = require('fs');
let txt = fs.readFileSync('frontend/components/pages/Home.tsx', 'utf8');

const startStr = '{/* Dashboard Widgets */}';
const endStr = '</main>';

const start = txt.indexOf(startStr);
const end = txt.indexOf(endStr, start) + endStr.length;

if (start === -1 || start === txt.indexOf(endStr, start)) {
    console.error('Cannot find boundaries', start, end);
    process.exit(1);
}

const dashBlock = txt.substring(start, end);
console.log('Block size to replace:', dashBlock.length);

const newDash = `
{/* Dashboard Widgets */}
                <div className="grid grid-cols-3 gap-6">
                    {/* Analytics Overview */}
                    <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/40 hover:scale-[1.02] transition-all duration-300 col-span-2 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg text-slate-800">Analytics Overview</h3>
                            <i className="fas fa-chart-pie text-slate-400"></i>
                        </div>
                        <div className="h-40 rounded-xl border border-white/40 bg-white/30 flex items-end gap-2 p-3 mb-6 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent pointer-events-none"></div>
                            {[ 'h-[26%]', 'h-[34%]', 'h-[31%]', 'h-[42%]', 'h-[48%]', 'h-[44%]', 'h-[56%]', 'h-[53%]', 'h-[62%]', 'h-[58%]', 'h-[71%]', 'h-[66%]' ].map((heightClass, idx) => (
                                <div key={idx} className={\`flex-1 rounded-t-sm bg-gradient-to-t from-teal-400 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 transition-all cursor-pointer \${heightClass}\`}></div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-auto">
                            <div className="p-4 rounded-xl bg-white/50 border border-white/40 flex flex-col items-center justify-center">
                                <span className="text-xs text-slate-500 mb-1 tracking-wide uppercase font-semibold">Visitors</span>
                                <span className="text-3xl font-bold text-slate-800">{(dashboardStats.totalContacts * 19) + 80}</span>
                            </div>
                            <div className="p-4 rounded-xl bg-white/50 border border-white/40 flex flex-col items-center justify-center">
                                <span className="text-xs text-slate-500 mb-1 tracking-wide uppercase font-semibold">Shares</span>
                                <span className="text-3xl font-bold text-slate-800">{(dashboardStats.activeChats * 7) + 24}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Card */}
                    <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/40 hover:scale-[1.02] transition-all duration-300 col-span-1 flex flex-col h-full justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-lg text-slate-800">Quick Stats</h3>
                                <i className="fas fa-bolt text-amber-400"></i>
                            </div>
                            <p className="text-slate-500 text-sm mb-6">Your weekly performance</p>
                        </div>
                        <div className="flex flex-col gap-4 mt-auto">
                            <div className="p-4 rounded-xl bg-gradient-to-r from-teal-400/10 to-cyan-500/10 border border-white/40 flex items-center justify-between">
                                <span className="text-slate-600 font-medium">Total Messages</span>
                                <span className="text-xl font-bold text-teal-600">{dashboardStats.messagesSent}</span>
                            </div>
                            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-400/10 to-pink-500/10 border border-white/40 flex items-center justify-between">
                                <span className="text-slate-600 font-medium">Active Chats</span>
                                <span className="text-xl font-bold text-purple-600">{dashboardStats.activeChats}</span>
                            </div>
                            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-400/10 to-cyan-500/10 border border-white/40 flex items-center justify-between">
                                <span className="text-slate-600 font-medium">Success Rate</span>
                                <span className="text-xl font-bold text-blue-600">{dashboardStats.successRate}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Activity Card */}
                    <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/40 hover:scale-[1.02] transition-all duration-300 col-span-1 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg text-slate-800">Recent Activity</h3>
                            <button className="text-xs text-teal-600 font-semibold hover:underline" onClick={() => setActiveView('reminder')}>View All</button>
                        </div>
                        <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px] scroll-smooth pr-1">
                            {reminders.slice(0, 4).length > 0 ? reminders.slice(0, 4).map((reminder) => (
                                <div key={reminder._id} className="p-4 rounded-xl bg-white/40 border border-white/40 hover:bg-white/60 transition-all flex items-start gap-3">
                                    <div className="w-2 h-2 mt-1.5 rounded-full bg-teal-400 shrink-0"></div>
                                    <div className="flex flex-col">
                                        <p className="font-medium text-slate-800 text-sm line-clamp-1">{reminder.message}</p>
                                        <p className="text-xs text-slate-500 mt-1">{new Date(reminder.dueDate || Date.now()).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            )) : <p className="text-sm text-slate-500 py-4 text-center">No recent activity.</p>}
                        </div>
                    </div>

                    {/* Contacts List */}
                    <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/40 hover:scale-[1.02] transition-all duration-300 col-span-1 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg text-slate-800">Contacts</h3>
                            <span className="px-2 py-1 text-xs font-semibold bg-cyan-100 text-cyan-600 rounded-lg">{dashboardStats.totalContacts}</span>
                        </div>
                        <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px] scroll-smooth pr-1">
                            {normalizedContacts.slice(0, 4).map((contact) => (
                                <div key={String(contact._id || contact.phone || contact.name)} className="flex items-center gap-3 p-3 rounded-xl bg-white/40 border border-white/40 hover:bg-white/60 transition-colors cursor-pointer">
                                    <AppAvatar name={contact.name || 'U'} className="!w-10 !h-10" />
                                    <div className="min-w-0">
                                        <p className="font-medium text-slate-800 truncate">{contact.name || 'Unknown'}</p>
                                        <p className="text-xs text-slate-500 truncate">{contact.phone || 'No phone number'}</p>
                                    </div>
                                </div>
                            ))}
                            {normalizedContacts.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No contacts yet.</p>}
                        </div>
                    </div>

                    {/* Group List */}
                    <div className="bg-white/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/40 hover:scale-[1.02] transition-all duration-300 col-span-1 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg text-slate-800">Active Groups</h3>
                            <i className="fas fa-users text-slate-400"></i>
                        </div>
                        <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px] scroll-smooth pr-1">
                            {[
                                { name: 'Product Team', members: 12, color: 'from-blue-400 to-blue-600' },
                                { name: 'Marketing Squad', members: 8, color: 'from-pink-400 to-rose-500' },
                                { name: 'Dev Ops', members: 5, color: 'from-teal-400 to-emerald-500' }
                            ].map((group, idx) => (
                                <div key={idx} className="flex items-center p-3 rounded-xl bg-white/40 border border-white/40 hover:bg-white/60 transition-colors cursor-pointer gap-4">
                                    <div className={\`w-12 h-12 rounded-xl bg-gradient-to-br \${group.color} flex items-center justify-center text-white shadow-md\`}>
                                        <span className="font-bold text-lg">{group.name.charAt(0)}</span>
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <span className="font-semibold text-slate-800">{group.name}</span>
                                        <span className="text-xs text-slate-500 font-medium tracking-wide">{group.members} Members</span>
                                    </div>
                                    <i className="fas fa-chevron-right text-slate-300 text-xs"></i>
                                </div>
                            ))}
                        </div>
                   </div>
                </div>
</main>`;

if (dashBlock) {
    txt = txt.substring(0, start) + newDash + txt.substring(end);
    fs.writeFileSync('frontend/components/pages/Home.tsx', txt);
    console.log('Successfully replaced DASHBOARD WIDGETS!');
}
