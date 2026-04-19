const fs = require('fs');

// Rewrite AppLayout.tsx with rightPanel restored in the grid flow
const appLayoutCode = `'use client';
import React from 'react';

type AppLayoutProps = {
    sidebar: React.ReactNode;
    topbar: React.ReactNode;
    rightPanel?: React.ReactNode;
    children: React.ReactNode;
};

export default function AppLayout({ sidebar, topbar, rightPanel, children }: AppLayoutProps) {
    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-[#eef2ff] via-[#f8fafc] to-[#e0f2fe] text-gray-800 font-['Poppins']">
            {/* Sidebar fixed structure */}
            {sidebar}
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {topbar}
                <main className="flex-1 overflow-y-auto p-6">
                    {/* The structure dictates the grid is managed inside children, or here if we split right panel */}
                    <div className="flex xl:gap-8 gap-6 w-full h-full">
                        <div className="flex-1 flex flex-col gap-6">
                            {children}
                        </div>
                        {rightPanel && (
                            <aside className="hidden xl:flex w-80 shrink-0 flex-col gap-6">
                                {rightPanel}
                            </aside>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
`;
fs.writeFileSync('components/layout/AppLayout.tsx', appLayoutCode);

console.log('AppLayout.tsx restored with rightPanel.');
