const fs = require('fs');
const path = require('path');

const layoutPath = path.join('frontend', 'components', 'layout', 'AppLayout.tsx');

let layout = fs.readFileSync(layoutPath, 'utf8');

layout = `\
'use client';

import React from 'react';

type AppLayoutProps = {
    sidebar: React.ReactNode;
    topbar: React.ReactNode;
    rightPanel?: React.ReactNode;
    children: React.ReactNode;
};

export default function AppLayout({ sidebar, topbar, rightPanel, children }: AppLayoutProps) {
    return (
        <div className="flex h-screen font-sans bg-gradient-to-br from-teal-200 via-cyan-200 to-blue-200 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900 text-gray-800 dark:text-white">
            
            {/* Sidebar */}
            <aside className="w-64 p-4 shrink-0">
                <div className="h-full bg-gradient-to-b from-teal-400 to-cyan-500 text-white p-5 rounded-2xl flex flex-col justify-between shadow-lg">
                    {sidebar}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-20 flex items-center justify-between w-full px-6 py-4">
                    {topbar}
                </header>
                
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {children}
                    </div>
                </div>
            </main>

        </div>
    );
}
`;

fs.writeFileSync(layoutPath, layout);
console.log('Updated AppLayout.tsx');
