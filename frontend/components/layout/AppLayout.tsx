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
        <div className="bg-[#0F172A] dark:bg-[#0F172A] min-h-screen w-full flex flex-col">
            <div className="flex flex-1 w-full">
                {/* Sidebar: only visible on lg+ screens, overlay on mobile */}
                <aside className="hidden lg:block w-[260px] h-full fixed left-0 top-0 z-30 bg-white/10 dark:bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col space-y-2 py-6 px-4" style={{ minWidth: 256, maxWidth: 256 }}>{sidebar}</aside>
                <div className="flex-1 ml-0 lg:ml-[260px] flex flex-col min-h-screen">
                    <header className="h-16 flex items-center mb-6 w-full bg-transparent">{topbar}</header>
                    <main className="flex-1 w-full flex">
                        <div className="w-full flex-1 !max-w-none !mx-0 items-start justify-start">
                            {children}
                        </div>
                        {/* Right panel: always visible on xl+ screens */}
                        <aside className="hidden xl:block w-[320px] h-full sticky top-0 self-start ml-6">{rightPanel}</aside>
                    </main>
                </div>
            </div>
            {/* Responsive: sidebar drawer only on mobile */}
            <div className="lg:hidden fixed inset-0 z-50">{sidebar}</div>
            {/* Responsive: rightPanel below content on mobile/tablet */}
            <div className="xl:hidden max-w-7xl mx-auto mt-6">{rightPanel}</div>
            <footer className="w-full flex flex-col items-center justify-center py-4 mt-8">
                <span>Powered by</span>
                <p className="text-cyan-300">HeroUI</p>
            </footer>
        </div>
    );
}
